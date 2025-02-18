import { RedisHandler, GCSHandler } from './handlers';
import { extractCacheMetadata } from './util/parse-ctx';

import {
  CacheHandlerParametersGet,
  CacheHandlerParametersSet,
  CacheHandlerValue,
  HandlerType,
  ClientType,
  HandlerInstanceType,
  HandlerOptionsType,
  CacheOptionsType,
} from './type';

const DEFAULT_HANDLER = 'redis';

export class CacheHandler {
  static #handlers: Map<HandlerType, HandlerInstanceType> = new Map();
  static #initializationPromise: Promise<void> | null = null;
  static #defaultHandler: HandlerType = DEFAULT_HANDLER;
  static #namespace?: string;

  static readonly #handlerCreators: {
    [T in HandlerType]: (client: ClientType<T>, options?: HandlerOptionsType<T>) => HandlerInstanceType<T>;
  } = {
    redis: (client) => new RedisHandler(client),
    gcs: (client, options) => new GCSHandler(client, options),
  };

  static async initializeHandler<T extends HandlerType>({
    handlers,
    defaultHandler,
    cacheOptions,
  }: {
    handlers: {
      type: T;
      initialize: () => Promise<ClientType<T>>;
      options?: HandlerOptionsType;
    }[];
    defaultHandler?: HandlerType;
    cacheOptions?: CacheOptionsType;
  }): Promise<void> {
    if (CacheHandler.#initializationPromise) {
      await CacheHandler.#initializationPromise;
      return;
    }

    CacheHandler.#defaultHandler = defaultHandler ?? DEFAULT_HANDLER;
    CacheHandler.#namespace = cacheOptions?.namespace;

    CacheHandler.#initializationPromise = (async () => {
      const results = await Promise.allSettled(
        handlers.map(async ({ type, initialize, options }) => {
          try {
            const createHandler = CacheHandler.#handlerCreators[type];
            if (!createHandler) {
              throw new Error(`Unsupported client type: ${type}`);
            }
            const client = await initialize();
            return { type, handler: createHandler(client, options) };
          } catch (error) {
            console.error(`Failed to initialize handler for type: ${type}`, error);
            return null;
          }
        }),
      );

      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          CacheHandler.#handlers.set(result.value.type, result.value.handler);
        }
      });
    })();

    return CacheHandler.#initializationPromise;
  }

  static getHandler<T extends HandlerType>(type: T): HandlerInstanceType<T> {
    const handlerType = type ?? CacheHandler.#defaultHandler;
    const handler = CacheHandler.#handlers.get(handlerType);

    if (!handler) {
      throw new Error(`Handler not found for type: ${handlerType}`);
    }

    return handler as HandlerInstanceType<T>;
  }

  async get(
    nextKey: CacheHandlerParametersGet[0],
    rawCtx: CacheHandlerParametersGet[1],
  ): Promise<CacheHandlerValue | null> {
    await CacheHandler.#initializationPromise;

    const { cacheKey, handlerType } = extractCacheMetadata(rawCtx);
    const targetHandlerType = handlerType ?? CacheHandler.#defaultHandler;
    const targetHandler = CacheHandler.getHandler(targetHandlerType);

    const defaultKey = cacheKey ?? nextKey;
    const key = [CacheHandler.#namespace, defaultKey].filter(Boolean).join(':');

    const cacheData = await targetHandler.get(key);
    if (!cacheData) return null;

    const { value, lastModified } = cacheData;
    if (value?.kind === 'FETCH') {
      if (value.revalidate === 0) return null;

      const now = Date.now();
      const cacheAge = Math.floor((now - (lastModified || now)) / 1000);

      if (cacheAge >= value.revalidate) return null;
    }

    return cacheData;
  }

  async set(
    nextKey: CacheHandlerParametersSet[0],
    value: CacheHandlerParametersSet[1],
    rawCtx: CacheHandlerParametersSet[2],
  ): Promise<void> {
    await CacheHandler.#initializationPromise;

    const { cacheKey, handlerType, ctx } = extractCacheMetadata(rawCtx);
    const targetHandlerType = handlerType ?? CacheHandler.#defaultHandler;
    const targetHandler = CacheHandler.getHandler(targetHandlerType);

    const defaultKey = cacheKey ?? nextKey;
    const key = [CacheHandler.#namespace, defaultKey].filter(Boolean).join(':');

    await targetHandler.set(key, value, ctx);
  }
}

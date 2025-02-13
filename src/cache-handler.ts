import { RedisHandler, GCSHandler } from './handlers';
import { Handler } from './interface/handler-interface';
import { extractCacheMetadata } from './util/parse-ctx';

import type {
  CacheHandlerParametersGet,
  CacheHandlerParametersSet,
  CacheHandlerValue,
  HandlerType,
  ClientType,
  HandlerInstanceType,
  HandlerOptionsType,
} from './type';

export class CacheHandler {
  static #handler: Handler | null = null;
  static #initializationPromise: Promise<void> | null = null;

  static readonly #handlerCreators: {
    [T in HandlerType]: (client: ClientType<T>, options?: HandlerOptionsType) => HandlerInstanceType<T>;
  } = {
    redis: (client, options) => new RedisHandler(client, options),
    gcs: (client, options) => new GCSHandler(client, options),
  };

  static async initializeHandler<T extends HandlerType>({
    type,
    initialize,
    options,
  }: {
    type: T;
    initialize: () => Promise<ClientType<T>>;
    options: HandlerOptionsType;
  }): Promise<void> {
    if (CacheHandler.#initializationPromise) {
      return CacheHandler.#initializationPromise;
    }

    CacheHandler.#initializationPromise = (async () => {
      if (CacheHandler.#handler) {
        console.log('Handler is already initialized.');
        return;
      }

      const createHandler = CacheHandler.#handlerCreators[type];
      if (!createHandler) {
        throw new Error(`Unsupported client type: ${type}`);
      }

      const client = await initialize();
      CacheHandler.#handler = createHandler(client, options);
    })();

    return CacheHandler.#initializationPromise;
  }

  async get(
    nextKey: CacheHandlerParametersGet[0],
    rawCtx: CacheHandlerParametersGet[1],
  ): Promise<CacheHandlerValue | null> {
    await CacheHandler.#initializationPromise;
    if (!CacheHandler.#handler) {
      throw new Error('Handler is not initialized.');
    }

    const { cacheKey } = extractCacheMetadata(rawCtx);
    const key = cacheKey ?? nextKey;

    const cacheData = await CacheHandler.#handler.get(key, rawCtx);
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
    if (!CacheHandler.#handler) {
      throw new Error('Handler is not initialized.');
    }

    const { cacheKey, ctx } = extractCacheMetadata(rawCtx);
    const key = cacheKey ?? nextKey;

    await CacheHandler.#handler.set(key, value, ctx);
  }
}

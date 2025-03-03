import { RedisHandler, GCSHandler } from './handlers';
import { extractCacheMetadata } from './util/parse-ctx';

import {
  HandlerType,
  HandlerInstanceType,
  HandlerOptionsType,
  ClientType,
  CacheOptionsType,
  CacheHandlerValue,
  CacheHandler as NextCacheHandler,
  CacheHandlerParametersGet,
  CacheHandlerParametersSet,
  CacheHandlerParametersRevalidateTag,
  TagsManifestType,
  FileSystemCacheContext,
} from './type';

const DEFAULT_HANDLER = 'redis';
const DEFAULT_CACHE_MAX_SIZE = 2;

export class CacheHandler implements NextCacheHandler {
  static #context: FileSystemCacheContext;

  static #handlers: Map<HandlerType, HandlerInstanceType> = new Map();
  static #defaultHandler: HandlerType = DEFAULT_HANDLER;
  static #initializationPromise: Promise<void> | null = null;

  static #namespace?: string;
  static #cacheMaxSize: number = DEFAULT_CACHE_MAX_SIZE;
  static #tagsManifest: TagsManifestType = { items: {} };

  static readonly #handlerCreators: {
    [T in HandlerType]: (client: ClientType<T>, options?: HandlerOptionsType<T>) => HandlerInstanceType<T>;
  } = {
    redis: (client) => new RedisHandler(client),
    gcs: (client, options) => new GCSHandler(client, options),
  };

  // Internal Next.js config
  constructor(context: FileSystemCacheContext) {
    CacheHandler.#context = context;
  }

  async initializeHandler<T extends HandlerType>({
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
    CacheHandler.#cacheMaxSize = cacheOptions?.cacheMaxSize ?? DEFAULT_CACHE_MAX_SIZE;

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

  static shouldInvalidateCache(cacheData: CacheHandlerValue, tags?: string[]) {
    const { value, lastModified } = cacheData;

    if (value?.kind !== 'FETCH') return false;
    if (value.revalidate === 0) return true;

    const now = Date.now();
    const cacheAge = Math.floor((now - (lastModified || now)) / 1000);
    if (cacheAge >= value.revalidate) return true;

    if (!tags || tags.length === 0) return false;

    const latestRevalidateAt = CacheHandler.getLatestRevalidateAt(tags);
    return latestRevalidateAt >= (lastModified || now);
  }

  static getLatestRevalidateAt(tags: string[]) {
    return tags.reduce((max, tag) => {
      const revalidatedAt = CacheHandler.#tagsManifest.items[tag]?.revalidatedAt ?? 0;

      if (revalidatedAt > 0) {
        delete CacheHandler.#tagsManifest.items[tag];
      }

      return Math.max(max, revalidatedAt);
    }, 0);
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

    const { cacheKey, handlerType, ctx } = extractCacheMetadata(rawCtx);
    const targetHandlerType = handlerType ?? CacheHandler.#defaultHandler;
    const targetHandler = CacheHandler.getHandler(targetHandlerType);

    const defaultKey = cacheKey ?? nextKey;
    const key = [CacheHandler.#namespace, defaultKey].filter(Boolean).join(':');

    const cacheData = await targetHandler.get(key);
    if (!cacheData) return null;

    if (CacheHandler.shouldInvalidateCache(cacheData, ctx.tags)) {
      return null;
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

    const valueSize = JSON.stringify(value).length;

    if (ctx.fetchCache && valueSize > CacheHandler.#cacheMaxSize * 1024 * 1024) {
      if (CacheHandler.#context.dev) {
        throw new Error(
          `\nFailed to set Next.js data cache, items over ${CacheHandler.#cacheMaxSize} can not be cached (${valueSize} bytes). ` +
            `To increase the cache limit, check the README: https://github.com/dongwonnn/next-payload-handler?tab=readme-ov-file#cacheoptions`,
        );
      }
      return;
    }

    const defaultKey = cacheKey ?? nextKey;
    const key = [CacheHandler.#namespace, defaultKey].filter(Boolean).join(':');

    await targetHandler.set(key, value, ctx);
  }

  async revalidateTag(...args: CacheHandlerParametersRevalidateTag): Promise<void> {
    await CacheHandler.#initializationPromise;
    const tags = typeof args[0] === 'string' ? [args[0]] : args[0];
    if (tags.length === 0) return;

    CacheHandler.#tagsManifest.items = {
      ...CacheHandler.#tagsManifest.items,
      ...Object.fromEntries(
        tags.map((tag) => [tag, { revalidatedAt: Date.now(), ...(CacheHandler.#tagsManifest.items[tag] || {}) }]),
      ),
    };
  }

  resetRequestCache() {
    // Not supported yet
  }
}

import { RedisClientType } from 'redis';
import type {
  CacheHandlerCtxTags,
  CacheHandlerKey,
  CacheHandlerParametersGet,
  CacheHandlerParametersSet,
  CacheHandlerValue,
} from '../type';

export class CacheHandler {
  static #handler: RedisClientType | null = null;

  static async initializeHandler(initialize: () => Promise<RedisClientType>): Promise<void> {
    if (!CacheHandler.#handler) {
      CacheHandler.#handler = await initialize();
    }
  }

  #generateRedisKey(key: CacheHandlerKey, tags?: CacheHandlerCtxTags): string {
    return tags && tags.length > 0 ? tags.join(',') : String(key);
  }

  async get(key: CacheHandlerParametersGet[0], ctx: CacheHandlerParametersGet[1]): Promise<CacheHandlerValue | null> {
    const redisKey = this.#generateRedisKey(key, ctx.tags);
    try {
      const cachedValue = await CacheHandler.#handler?.get(redisKey);
      return cachedValue ? JSON.parse(cachedValue) : null;
    } catch (error) {
      console.error('Error fetching from Redis:', error);
      return null;
    }
  }

  async set(
    key: CacheHandlerParametersSet[0],
    value: CacheHandlerParametersSet[1],
    ctx: CacheHandlerParametersSet[2],
  ): Promise<void> {
    const redisKey = this.#generateRedisKey(key, ctx.tags);
    const cacheData = {
      value,
      lastModified: Date.now(),
      tags: ctx.tags,
    };

    try {
      await CacheHandler.#handler?.set(redisKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error setting value in Redis:', error);
    }
  }
}

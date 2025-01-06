import type {
  CacheHandlerValue,
  CacheHandlerKey,
  CacheHandlerCtxTags,
  CacheHandlerParametersGet,
  CacheHandlerParametersSet,
  RedisClientType,
  RedisConfig,
  RedisModules,
} from '../type';
import RedisClientManager from './redisClientManager';

class PayloadCacheHandler {
  private static redisClient: RedisClientType<RedisModules> | null = null;
  private static redisConfig: RedisConfig | null = null;

  constructor(redisConfig: RedisConfig) {
    if (!PayloadCacheHandler.redisClient) {
      PayloadCacheHandler.redisClient = RedisClientManager.getClient(redisConfig);
    }
    PayloadCacheHandler.redisConfig = redisConfig;
  }

  static getRedisClient(): RedisClientType<RedisModules> {
    if (!PayloadCacheHandler.redisClient) {
      throw new Error('Redis client has not been initialized.');
    }
    return PayloadCacheHandler.redisClient;
  }

  private generateRedisKey(key: CacheHandlerKey, tags?: CacheHandlerCtxTags): string {
    return tags && tags.length > 0 ? tags.join(',') : String(key);
  }

  async get(key: CacheHandlerParametersGet[0], ctx: CacheHandlerParametersGet[1]): Promise<CacheHandlerValue | null> {
    const redisKey = this.generateRedisKey(key, ctx.tags);
    try {
      const cachedValue = await PayloadCacheHandler.redisClient?.get(redisKey);
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
    const redisKey = this.generateRedisKey(key, ctx.tags);
    const cacheData = {
      value,
      lastModified: Date.now(),
      tags: ctx.tags,
    };

    try {
      await PayloadCacheHandler.redisClient?.set(redisKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error setting value in Redis:', error);
    }
  }
}

export default PayloadCacheHandler;

import { createClient } from 'redis';
import type {
  CacheHandlerValue,
  CacheHandlerKey,
  CacheHandlerCtxTags,
  CacheHandlerParametersGet,
  CacheHandlerParametersSet,
  RedisClientType,
  RedisConfig,
} from '../type';

class PayloadCacheHandler {
  private static redisClient: RedisClientType | null = null;
  private static redisConfig: RedisConfig | null = null;

  constructor(redisConfig: RedisConfig) {
    if (!PayloadCacheHandler.redisClient) {
      PayloadCacheHandler.redisClient = createClient({
        url: redisConfig.url,
      });

      PayloadCacheHandler.redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      PayloadCacheHandler.redisClient.on('connect', () => {
        console.log('Redis connection successful');
      });

      PayloadCacheHandler.redisClient.connect();
    }

    PayloadCacheHandler.redisConfig = redisConfig;
  }

  static getRedisClient(): RedisClientType {
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

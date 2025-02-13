import { Handler } from '../interface/handler-interface';

import type {
  RedisClientType,
  CacheHandlerParametersGet,
  CacheHandlerParametersSet,
  CacheHandlerValue,
  HandlerOptionsType,
} from '../type';

export class RedisHandler implements Handler {
  readonly #client: RedisClientType;
  readonly #cacheNamespace?: string;

  constructor(client: RedisClientType, options?: HandlerOptionsType) {
    this.#client = client;
    this.#cacheNamespace = options?.cacheNamespace;
  }

  async get(key: CacheHandlerParametersGet[0], ctx: CacheHandlerParametersGet[1]): Promise<CacheHandlerValue | null> {
    const redisKey = `${this.#cacheNamespace}:${key}`;
    try {
      const cachedValue = await this.#client.get(redisKey);
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
    const redisKey = `${this.#cacheNamespace}:${key}`;
    const cacheData = {
      value,
      lastModified: Date.now(),
      tags: ctx.tags,
    };

    try {
      await this.#client.set(redisKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error setting value in Redis:', error);
    }
  }
}

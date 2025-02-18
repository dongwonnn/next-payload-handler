import { Handler } from '../interface/handler-interface';

import type { RedisClientType, CacheHandlerParametersGet, CacheHandlerParametersSet, CacheHandlerValue } from '../type';

export class RedisHandler implements Handler {
  readonly #client: RedisClientType;

  constructor(client: RedisClientType) {
    this.#client = client;
  }

  async get(key: CacheHandlerParametersGet[0]): Promise<CacheHandlerValue | null> {
    try {
      const cachedValue = await this.#client.get(key);
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
    const cacheData = {
      value,
      lastModified: Date.now(),
      tags: ctx.tags,
    };

    try {
      await this.#client.set(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error setting value in Redis:', error);
    }
  }
}

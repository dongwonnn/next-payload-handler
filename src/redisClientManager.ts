import { createClient } from 'redis';
import type { RedisClientType, RedisModules, RedisClientOptions } from '../type';

class RedisClientManager {
  private static instance: RedisClientType<RedisModules> | null = null;

  private constructor() {}

  static getClient(config: RedisClientOptions): RedisClientType<RedisModules> {
    if (!RedisClientManager.instance) {
      RedisClientManager.instance = createClient(config) as RedisClientType<RedisModules>;

      RedisClientManager.instance.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      RedisClientManager.instance.on('connect', () => {
        console.log('Redis connection successful!');
      });

      RedisClientManager.instance.connect();
    }

    return RedisClientManager.instance;
  }
}

export default RedisClientManager;

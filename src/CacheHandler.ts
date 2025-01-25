import { RedisHandler } from './handlers/redis-handler';
import { Handler } from './interface/handler-interface';

import type { RedisClientType, CacheHandlerParametersGet, CacheHandlerParametersSet, CacheHandlerValue } from './type';

type HandlerType = 'redis';
type ClientType = RedisClientType;
type HandlerInstanceType = InstanceType<typeof RedisHandler>;

export class CacheHandler {
  static #handler: Handler | null = null;

  static readonly #handlerCreators: Record<HandlerType, (client: ClientType) => HandlerInstanceType> = {
    redis: (client) => new RedisHandler(client),
  };

  static async initializeHandler(type: HandlerType, initialize: () => Promise<ClientType>): Promise<void> {
    if (CacheHandler.#handler) {
      console.log('Handler is already initialized.');
      return;
    }

    const createHandler = CacheHandler.#handlerCreators[type];
    if (!createHandler) {
      throw new Error(`Unsupported client type: ${type}`);
    }

    const client = await initialize();
    CacheHandler.#handler = createHandler(client);
    console.log(`Handler initialized for type: ${type}`);
  }

  async get(key: CacheHandlerParametersGet[0], ctx: CacheHandlerParametersGet[1]): Promise<CacheHandlerValue | null> {
    if (!CacheHandler.#handler) {
      throw new Error('Handler is not initialized.');
    }
    return CacheHandler.#handler.get(key, ctx);
  }

  async set(
    key: CacheHandlerParametersSet[0],
    value: CacheHandlerParametersSet[1],
    ctx: CacheHandlerParametersSet[2],
  ): Promise<void> {
    if (!CacheHandler.#handler) {
      throw new Error('Handler is not initialized.');
    }
    await CacheHandler.#handler.set(key, value, ctx);
  }
}

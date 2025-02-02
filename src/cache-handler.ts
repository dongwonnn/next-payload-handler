import { RedisHandler, GCSHandler } from './handlers';
import { Handler } from './interface/handler-interface';
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
    options?: HandlerOptionsType;
  }): Promise<void> {
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

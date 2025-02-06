import type { Bucket as GCSBucketType, RedisClientType, CacheHandler } from './index';
import type { GCSHandler, RedisHandler } from '../handlers';
export type { GCSHandler, RedisHandler };

export type CacheHandlerParametersGet = Parameters<CacheHandler['get']>;
export type CacheHandlerParametersSet = Parameters<CacheHandler['set']>;
export type CacheHandlerCtxTags = CacheHandlerParametersGet[1]['tags'] | CacheHandlerParametersSet[2]['tags'];
export type CacheHandlerKey = CacheHandlerParametersGet[0] | CacheHandlerParametersSet[0];

type HandlerTypeToClient = {
  redis: RedisClientType;
  gcs: GCSBucketType;
};

type HandlerTypeToInstance = {
  redis: InstanceType<typeof RedisHandler>;
  gcs: InstanceType<typeof GCSHandler>;
};

export type HandlerType = keyof HandlerTypeToClient;
export type ClientType<T extends HandlerType = HandlerType> = HandlerTypeToClient[T];
export type HandlerInstanceType<T extends HandlerType = HandlerType> = HandlerTypeToInstance[T];
export type HandlerOptionsType = {
  bucketPrefix: string;
};

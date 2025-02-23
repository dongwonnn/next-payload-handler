import type { Bucket as GCSBucketType, RedisClientType, CacheHandler } from './index';
import type { GCSHandler, RedisHandler } from '../handlers';
export type { GCSHandler, RedisHandler };

export type CacheHandlerParametersGet = Parameters<CacheHandler['get']>;
export type CacheHandlerParametersSet = Parameters<CacheHandler['set']>;
export type CacheHandlerParametersRevalidateTag = Parameters<CacheHandler['revalidateTag']>;

type HandlerTypeToClient = {
  redis: RedisClientType;
  gcs: GCSBucketType;
};

type HandlerTypeToInstance = {
  redis: InstanceType<typeof RedisHandler>;
  gcs: InstanceType<typeof GCSHandler>;
};

type HandlerTypeToOptions = {
  redis: {};
  gcs: {
    bucketPrefix?: string;
  };
};

export type HandlerType = keyof HandlerTypeToClient;
export type ClientType<T extends HandlerType = HandlerType> = HandlerTypeToClient[T];
export type HandlerInstanceType<T extends HandlerType = HandlerType> = HandlerTypeToInstance[T];
export type HandlerOptionsType<T extends HandlerType = HandlerType> = HandlerTypeToOptions[T];

export type CacheOptionsType = {
  namespace?: string;
  cacheMaxSize?: number;
};

export type TagsManifestType = {
  items: { [tag: string]: { revalidatedAt?: number } };
};

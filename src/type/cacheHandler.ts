import type { CacheHandler, CacheHandlerValue } from 'next/dist/server/lib/incremental-cache';
import type { Bucket as GCSBucketType, RedisClientType } from './index';
import type { GCSHandler, RedisHandler } from '../handlers';

export type CacheHandlerParametersGet = Parameters<CacheHandler['get']>;
export type CacheHandlerParametersSet = Parameters<CacheHandler['set']>;
export type CacheHandlerCtxTags = CacheHandlerParametersGet[1]['tags'] | CacheHandlerParametersSet[2]['tags'];
export type CacheHandlerKey = CacheHandlerParametersGet[0] | CacheHandlerParametersSet[0];

// TODO: fix generic type
export type HandlerType = 'redis' | 'gcs';
export type ClientType = RedisClientType | GCSBucketType;
export type HandlerInstanceType = InstanceType<typeof RedisHandler> | InstanceType<typeof GCSHandler>;
export type HandlerOptionsType = {
  bucketPrefix: string;
};

export type { CacheHandlerValue, GCSHandler, RedisHandler };

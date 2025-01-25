import type { CacheHandler, CacheHandlerValue } from 'next/dist/server/lib/incremental-cache';

export type CacheHandlerParametersGet = Parameters<CacheHandler['get']>;
export type CacheHandlerParametersSet = Parameters<CacheHandler['set']>;
export type CacheHandlerCtxTags = CacheHandlerParametersGet[1]['tags'] | CacheHandlerParametersSet[2]['tags'];
export type CacheHandlerKey = CacheHandlerParametersGet[0] | CacheHandlerParametersSet[0];
export type { CacheHandlerValue };

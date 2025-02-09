import { CacheHandlerCtxTags, CacheHandlerKey } from '../type';

export function getCustomKey(key: CacheHandlerKey, tags: CacheHandlerCtxTags): string {
  return tags?.length ? JSON.stringify(tags) : key;
}

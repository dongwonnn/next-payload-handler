import { CacheHandlerCtxTags, CacheHandlerKey } from '../type';

export function getCustomKey({
  key,
  tags,
  namespace,
}: {
  key: CacheHandlerKey;
  tags: CacheHandlerCtxTags;
  namespace?: string;
}): string {
  const defaultCacheKey = tags?.length ? JSON.stringify(tags) : key;
  return !!namespace ? `${namespace}:${defaultCacheKey}` : defaultCacheKey;
}

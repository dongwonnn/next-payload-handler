import type { CacheHandlerParametersSet } from '../type';

type TypeCacheMetadata = {
  cacheKey: string | null;
  handlerType: string | null;
};

function isBase64(str: string) {
  if (typeof str !== 'string' || str.length % 4 !== 0) return false;

  const base64Regex = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/;
  return base64Regex.test(str);
}

export function extractCacheMetadata(ctx: CacheHandlerParametersSet[2]) {
  const { tags = [] } = ctx;
  const [firstTag, ...remainingTags] = tags;

  if (!firstTag || !isBase64(firstTag)) {
    return { cacheKey: null, handlerType: null, ctx };
  }
  ``;

  const decoded = Buffer.from(firstTag, 'base64').toString('utf-8');
  const { cacheKey, handlerType }: TypeCacheMetadata = JSON.parse(decoded) || {};

  return {
    cacheKey: cacheKey ?? null,
    handlerType: handlerType ?? null,
    ctx: { ...ctx, tags: remainingTags },
  };
}

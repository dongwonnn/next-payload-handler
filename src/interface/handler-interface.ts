import type {
  CacheHandlerCtxTags,
  CacheHandlerKey,
  CacheHandlerParametersGet,
  CacheHandlerParametersSet,
  CacheHandlerValue,
} from '../type';

export interface Handler {
  get(key: CacheHandlerParametersGet[0], ctx: CacheHandlerParametersGet[1]): Promise<CacheHandlerValue | null>;
  set(
    key: CacheHandlerParametersSet[0],
    value: CacheHandlerParametersSet[1],
    ctx: CacheHandlerParametersSet[2],
  ): Promise<void>;
}

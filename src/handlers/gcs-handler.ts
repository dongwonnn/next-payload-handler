import { Handler } from '../interface/handler-interface';
import type {
  Bucket,
  CacheHandlerCtxTags,
  CacheHandlerKey,
  CacheHandlerParametersGet,
  CacheHandlerParametersSet,
  CacheHandlerValue,
  optionsType,
} from '../type';

export class GCSHandler implements Handler {
  #bucket: Bucket;
  readonly #bucketPrefix: string;

  constructor(bucket: Bucket, options: optionsType) {
    this.#bucket = bucket;
    this.#bucketPrefix = options.bucketPrefix;
  }

  getCustomKey(key: CacheHandlerKey, tags?: CacheHandlerCtxTags): string {
    return tags && tags.length > 0 ? tags.join(',') : String(key);
  }

  getFilePath(key: string, tags?: string[]): string {
    const prefix = this.#bucketPrefix ? `${this.#bucketPrefix}/` : '';
    return `${prefix}${this.getCustomKey(key, tags)}`;
  }

  async get(key: CacheHandlerParametersGet[0], ctx: CacheHandlerParametersGet[1]): Promise<CacheHandlerValue | null> {
    const filePath = this.getFilePath(key, ctx.tags);
    const bucketFile = this.#bucket.file(filePath);

    try {
      const [contents] = await bucketFile.download(); // 파일 내용 다운로드
      return JSON.parse(contents.toString());
    } catch (error: any) {
      if (error.code === 404) {
        console.log(`Cache not found for key: ${key}`);
        return null;
      }
      throw error;
    }
  }

  async set(
    key: CacheHandlerParametersSet[0],
    value: CacheHandlerParametersSet[1],
    ctx: CacheHandlerParametersSet[2],
  ): Promise<void> {
    const filePath = this.getFilePath(key, ctx.tags);
    const bucketFile = this.#bucket.file(filePath);
    const cacheData = {
      value,
      lastModified: Date.now(),
      tags: ctx.tags,
    };

    try {
      await bucketFile.save(JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error setting value in GCS:', error);
    }
  }
}

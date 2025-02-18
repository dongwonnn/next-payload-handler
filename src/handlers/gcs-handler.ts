import path from 'path';
import { Handler } from '../interface/handler-interface';

import type {
  Bucket,
  GCPApiError,
  CacheHandlerParametersGet,
  CacheHandlerParametersSet,
  CacheHandlerValue,
  HandlerOptionsType,
} from '../type';

export class GCSHandler implements Handler {
  readonly #bucket: Bucket;
  readonly #bucketPrefix?: string;

  constructor(bucket: Bucket, options?: HandlerOptionsType<'gcs'>) {
    this.#bucket = bucket;
    this.#bucketPrefix = options?.bucketPrefix;
  }

  getBucketFile(fileName: string) {
    const filePath = path.posix.join(this.#bucketPrefix ?? '', fileName);
    return this.#bucket.file(filePath);
  }

  async get(key: CacheHandlerParametersGet[0]): Promise<CacheHandlerValue | null> {
    const bucketFile = this.getBucketFile(key);

    try {
      const [contents] = await bucketFile.download();
      return JSON.parse(contents.toString());
    } catch (error) {
      if ((error as GCPApiError).code === 404) {
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
    const bucketFile = this.getBucketFile(key);

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

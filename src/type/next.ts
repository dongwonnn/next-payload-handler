import type { CacheHandler, CacheHandlerValue } from 'next/dist/server/lib/incremental-cache';
import type FileSystemCache from 'next/dist/server/lib/incremental-cache/file-system-cache';

type FileSystemCacheContext = ConstructorParameters<typeof FileSystemCache>[0];
export type { CacheHandler, CacheHandlerValue, FileSystemCacheContext };

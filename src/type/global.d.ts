/// <reference types="node" />

declare namespace globalThis {
  interface RequestInit extends globalThis.RequestInit {
    next?: PatchFetchRequestConfig | undefined;
  }
}

interface PatchFetchRequestConfig extends NextFetchRequestConfig {
  cacheKey?: string;
  handlerType?: string;
}

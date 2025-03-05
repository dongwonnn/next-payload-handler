export function patchFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  if (!init.next) {
    return fetch(input, init);
  }

  const { cacheKey, handlerType, tags = [] } = init.next;

  const metaData =
    cacheKey || handlerType ? Buffer.from(JSON.stringify({ cacheKey, handlerType })).toString('base64') : null;
  const modifiedTags = metaData ? [metaData, ...tags] : tags;

  const modifiedInit = {
    ...init,
    next: {
      ...init.next,
      tags: modifiedTags,
    },
  };

  return fetch(input, modifiedInit);
}

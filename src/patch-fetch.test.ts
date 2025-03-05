import { patchFetch } from './patch-fetch';

describe('patchFetch', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks(); // Restore fetch mock
  });

  it('should call fetch with the original parameters when init.next is not provided', async () => {
    const input = 'https://example.com';
    const init = {};

    await patchFetch(input, init);

    expect(global.fetch).toHaveBeenCalledWith(input, init);
  });

  it('should modify next.tags correctly when init.next is provided', async () => {
    const input = 'https://example.com';
    const init = {
      next: {
        cacheKey: 'testKey',
        handlerType: 'testType',
        tags: ['tag1'],
      },
    };

    await patchFetch(input, init);

    const expectedMetaData = Buffer.from(JSON.stringify({ cacheKey: 'testKey', handlerType: 'testType' })).toString(
      'base64',
    );

    expect(global.fetch).toHaveBeenCalledWith(
      input,
      expect.objectContaining({
        next: expect.objectContaining({
          tags: [expectedMetaData, 'tag1'], // The transformed metadata should be added to the tags array
        }),
      }),
    );
  });

  it('should not modify tags when cacheKey and handlerType are not provided', async () => {
    const input = 'https://example.com';
    const init = {
      next: {
        tags: ['tag1'],
      },
    };

    await patchFetch(input, init);

    expect(global.fetch).toHaveBeenCalledWith(input, init); // The original init should remain unchanged
  });

  it('should include only the transformed metadata in tags when cacheKey and handlerType are provided but tags is an empty array', async () => {
    const input = 'https://example.com';
    const init = {
      next: {
        cacheKey: 'testKey',
        handlerType: 'testType',
        tags: [], // Empty array
      },
    };

    await patchFetch(input, init);

    const expectedMetaData = Buffer.from(JSON.stringify({ cacheKey: 'testKey', handlerType: 'testType' })).toString(
      'base64',
    );

    expect(global.fetch).toHaveBeenCalledWith(
      input,
      expect.objectContaining({
        next: expect.objectContaining({
          tags: [expectedMetaData], // Only the transformed metadata should be included
        }),
      }),
    );
  });
});

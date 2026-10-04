import { createApiClient } from '@nocobase/app-client';
import { describe, expect, it, vi } from 'vitest';
import {
  getManagedToolDetails,
  listManagedTools,
} from '../client/tools-management-service.js';

const summary = {
  name: '@acme/query & review?中文#100%',
  title: 'Query records',
  description: 'Read collection records',
  scope: 'SPECIFIED',
  source: 'custom-source',
};

describe('Tools management API', () => {
  it('reads the data envelope without changing summaries or fetching details', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(Response.json({ data: [summary] }));
    const api = createApiClient({
      baseURL: 'https://example.test/workspace/api',
      fetch,
    });
    const signal = new AbortController().signal;
    expect(await listManagedTools(api, signal)).toEqual([summary]);
    expect(fetch).toHaveBeenCalledExactlyOnceWith(
      'https://example.test/workspace/api/aiEmployee/tools',
      expect.objectContaining({ method: 'GET', signal }),
    );
  });

  it.each([
    null,
    {},
    { type: 'object', properties: { query: { type: 'string' } } },
  ])(
    'preserves the direct detail contract and schema %j, encoding the name once as a path segment',
    async (inputSchema) => {
      const detail = { ...summary, about: '# Query records', inputSchema };
      const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValue(Response.json({ data: detail }));
      const api = createApiClient({
        baseURL: 'https://example.test/nested/api',
        fetch,
      });
      const signal = new AbortController().signal;
      expect(await getManagedToolDetails(api, summary.name, signal)).toEqual(
        detail,
      );
      const [url, init] = fetch.mock.calls[0];
      const requestURL = new URL(String(url));
      expect(requestURL.pathname).toBe(
        `/nested/api/aiEmployee/tools/${encodeURIComponent(summary.name)}`,
      );
      expect(requestURL.search).toBe('');
      expect(requestURL.hash).toBe('');
      expect(init).toMatchObject({ method: 'GET', signal });
      expect(init?.body).toBeUndefined();
    },
  );

  it('propagates failed and cancelled requests instead of synthesizing empty data', async () => {
    const error = new Error('Unavailable');
    const fetch = vi.fn<typeof globalThis.fetch>().mockRejectedValue(error);
    const api = createApiClient({ baseURL: 'https://example.test/api', fetch });
    await expect(listManagedTools(api)).rejects.toBe(error);
    await expect(getManagedToolDetails(api, summary.name)).rejects.toBe(error);
    const cancelled = new DOMException('Aborted', 'AbortError');
    fetch.mockRejectedValue(cancelled);
    const controller = new AbortController();
    controller.abort();
    await expect(
      getManagedToolDetails(api, summary.name, controller.signal),
    ).rejects.toBe(cancelled);
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApiClient } from '@nocobase/app-client';

import { notifyServerLocale } from '../../client/use-locale.js';

/**
 * An application is served from a base path, and its API lives under that base rather than at the origin root.
 *
 * This is the regression the test exists for: a hard-coded `/api/i18n/locale` reaches the origin root and 404s on
 * every application the template generates, since those are served from `/main` by default.
 */
const BASE = '/main';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('telling the server which language to answer in', () => {
  it('requests the endpoint under the application base path', async () => {
    const fetchSpy = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(new Response('{"data":{}}', { status: 200 }));
    vi.stubGlobal('fetch', fetchSpy);
    const api = createApiClient({ baseURL: `${BASE}/api` });
    await notifyServerLocale(api, 'zh-CN');

    const [url, init] = fetchSpy.mock.calls[0] ?? [];
    // Path-relative, which the browser resolves against the current origin.
    expect(String(url)).toBe(`${BASE}/api/i18n/locale`);
    expect(init?.method).toBe('PUT');
    expect(init?.body).toBe(JSON.stringify({ locale: 'zh-CN' }));
  });

  it('returns the server fallback result to the language control', async () => {
    const result = {
      locale: 'en-US',
      requestedLocale: 'ja-JP',
      fallback: true,
    };
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(Response.json({ data: result })),
    );
    const api = createApiClient({ baseURL: `${BASE}/api` });
    await expect(notifyServerLocale(api, 'ja-JP')).resolves.toEqual(result);
  });

  it('keeps transport failures distinguishable from a successful fallback', async () => {
    const failure = new TypeError('Network unavailable');
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(failure));
    const api = createApiClient({ baseURL: `${BASE}/api` });
    await expect(notifyServerLocale(api, 'ja-JP')).rejects.toBe(failure);
  });
});

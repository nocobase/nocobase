import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { serverPath } from '../src/dynamic/session.ts';
import { ApiClient } from '../src/lib/http.ts';

function recorder(): { urls: string[]; fetch: typeof fetch } {
  const urls: string[] = [];
  const fetcher = (async (input: RequestInfo | URL) => {
    urls.push(String(input));
    return new Response(JSON.stringify({ data: { ok: true } }), {
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;
  return { urls, fetch: fetcher };
}

describe('ApiClient below a base path', () => {
  const server = 'https://acme.example.com/main';
  const schema = z.object({ ok: z.boolean() });

  it('does not repeat the base path of a route that already names it', async () => {
    const { urls, fetch } = recorder();
    const client = new ApiClient({ server, headers: {}, fetch });
    await client.post(serverPath(server, '/api/auth/device/code'), {}, schema);
    expect(urls).toEqual([
      'https://acme.example.com/main/api/auth/device/code',
    ]);
  });

  it('takes a route without the base path below the base', async () => {
    const { urls, fetch } = recorder();
    const client = new ApiClient({ server, headers: {}, fetch });
    await client.get('/api/cli/manifest', schema);
    expect(urls).toEqual(['https://acme.example.com/main/api/cli/manifest']);
  });
});

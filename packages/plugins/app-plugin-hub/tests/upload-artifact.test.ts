import { createApiClient } from '@nocobase/app-client';
import { describe, expect, it, vi } from 'vitest';
import { readError, uploadArtifact } from '../client/pages/hub/utils.js';

describe('uploadArtifact', () => {
  it('uses the application API URL and preserves the raw gzip upload', async () => {
    const release = { id: 'release-1' };
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ data: release }));
    const api = createApiClient({ baseURL: '/custom/api', fetch: transport });
    const artifact = new File(['archive'], 'release.tar.gz');
    await expect(uploadArtifact(api, 'app-1', artifact)).resolves.toEqual(
      release,
    );
    const [url, options] = transport.mock.calls[0]!;
    expect(url).toBe('/custom/api/hub/apps/app-1/releases');
    expect(options).toMatchObject({
      method: 'POST',
      credentials: 'include',
      body: artifact,
    });
    expect(options?.body).toBe(artifact);
    expect(new Headers(options?.headers).get('content-type')).toBe(
      'application/gzip',
    );
  });

  it('keeps upload failures readable by the page', async () => {
    const transport = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json(
        {
          error: {
            code: 403,
            status: 'PERMISSION_DENIED',
            reason: 'AUTHORIZATION_DENIED',
            domain: 'authorization',
            message: 'Upload denied',
          },
        },
        { status: 403 },
      ),
    );
    const api = createApiClient({ baseURL: '/custom/api', fetch: transport });
    const failure = await uploadArtifact(
      api,
      'app-1',
      new File([], 'release.tar.gz'),
    ).catch((error: unknown) => error);
    expect(readError(failure)).toMatchObject({
      message: 'Upload denied',
      reason: 'AUTHORIZATION_DENIED',
      status: 403,
    });
  });
});

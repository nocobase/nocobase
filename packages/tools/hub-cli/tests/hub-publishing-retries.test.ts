// @vitest-environment node
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { publishToHub } from '../src/hub-publishing.ts';

let root: string;
const env = {
  HUB_URL: 'https://hub.example/main',
  HUB_APP_ID: 'crm',
  HUB_API_KEY: 'test-only-credential',
};
const options = { file: 'artifact.tar.gz', deploy: true, wait: false };
beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'hub-retry-test-'));
  await writeFile(path.join(root, 'artifact.tar.gz'), 'artifact');
});
afterEach(async () => {
  vi.unstubAllGlobals();
  await rm(root, { recursive: true, force: true });
});
function mockRetry(status: string | undefined) {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({
        data: { releaseId: 'r1', operationId: 'op-1', reused: true },
      }),
    )
    .mockResolvedValueOnce(Response.json({ data: { status } }));
  vi.stubGlobal('fetch', fetcher);
  return fetcher;
}

describe('upload deployment retries without waiting', () => {
  it.each(['failed', 'cancelled'])(
    'rejects a reused %s deployment',
    async (status) => {
      const fetcher = mockRetry(status);
      await expect(
        publishToHub('upload', options, root, env, root),
      ).rejects.toMatchObject({
        code: 'DEPLOYMENT_FAILED',
        exitCode: 1,
      });
      expect(fetcher).toHaveBeenCalledTimes(2);
      expect(String(fetcher.mock.calls[1]?.[0])).toBe(
        'https://hub.example/main/api/hub/apps/crm/deployments/op-1/status',
      );
    },
  );
  it.each(['queued', 'deploying', 'succeeded'])(
    'returns a reused %s deployment after one status check',
    async (status) => {
      const fetcher = mockRetry(status);
      await expect(
        publishToHub('upload', options, root, env, root),
      ).resolves.toMatchObject({
        reused: true,
        operationId: 'op-1',
        operationStatus: status,
      });
      expect(fetcher).toHaveBeenCalledTimes(2);
    },
  );
  it.each(['unknown', undefined])(
    'rejects an unconfirmed status %s',
    async (status) => {
      mockRetry(status);
      await expect(
        publishToHub('upload', options, root, env, root),
      ).rejects.toMatchObject({
        code: 'RESULT_UNKNOWN',
        exitCode: 3,
      });
    },
  );
  it('does not report success when the status request fails', async () => {
    const fetcher = mockRetry('failed');
    fetcher
      .mockReset()
      .mockResolvedValueOnce(
        Response.json({
          data: { releaseId: 'r1', operationId: 'op-1', reused: true },
        }),
      )
      .mockRejectedValueOnce(new Error('Disconnected'));
    await expect(
      publishToHub('upload', options, root, env, root),
    ).rejects.toMatchObject({
      code: 'RESULT_UNKNOWN',
      exitCode: 3,
    });
  });
  it.each([
    { deploy: true, reused: false },
    { deploy: false, reused: true },
  ])(
    'keeps upload acceptance independent of polling: %j',
    async ({ deploy, reused }) => {
      const fetcher = vi.fn().mockResolvedValueOnce(
        Response.json({
          data: { releaseId: 'r1', operationId: 'op-1', reused },
        }),
      );
      vi.stubGlobal('fetch', fetcher);
      await publishToHub('upload', { ...options, deploy }, root, env, root);
      expect(fetcher).toHaveBeenCalledTimes(1);
    },
  );
});

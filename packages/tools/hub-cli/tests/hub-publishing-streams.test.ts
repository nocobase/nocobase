// @vitest-environment node
import { createReadStream, type ReadStream } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { finished } from 'node:stream/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { publishToHub } from '../src/hub-publishing.ts';

vi.mock('node:fs', async (importOriginal) => {
  const fs = await importOriginal<typeof import('node:fs')>();
  return { ...fs, createReadStream: vi.fn(fs.createReadStream) };
});

let root: string;
const env = {
  HUB_URL: 'https://hub.example/main',
  HUB_APP_ID: 'crm',
  HUB_API_KEY: 'test-only-credential',
};
const streams = () =>
  vi
    .mocked(createReadStream)
    .mock.results.map(({ value }) => value as ReadStream);

beforeEach(async () => {
  vi.mocked(createReadStream).mockClear();
  root = await mkdtemp(path.join(os.tmpdir(), 'hub-stream-test-'));
  await writeFile(path.join(root, 'artifact.tar.gz'), 'artifact');
  await writeFile(path.join(root, 'runtime.yml'), 'feature: true\n');
});

afterEach(async () => {
  // Keep fixture cleanup safe even when a lifecycle assertion fails.
  await Promise.allSettled(streams().map((stream) => finished(stream)));
  vi.unstubAllGlobals();
  await rm(root, { recursive: true, force: true });
});

describe.each([undefined, 'runtime.yml'])(
  'upload stream cleanup with config %s',
  (config) => {
    it('handles a late file-open failure without replacing the request error', async () => {
      const fs = await vi.importActual<typeof import('node:fs')>('node:fs');
      vi.mocked(createReadStream)
        .mockImplementationOnce(fs.createReadStream)
        // The artifact passed validation, but is unavailable when upload starts.
        .mockImplementationOnce(() =>
          fs.createReadStream(path.join(root, 'missing.tar.gz')),
        );
      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValue(new Error('Disconnected')),
      );

      await expect(
        publishToHub(
          'upload',
          { file: 'artifact.tar.gz', deploy: true, wait: false, config },
          root,
          env,
          root,
        ),
      ).rejects.toMatchObject({ code: 'RESULT_UNKNOWN', exitCode: 3 });
      for (const stream of streams()) expect(stream.closed).toBe(true);
    });

    it.each(['accepted', 'rejected', 'disconnected'] as const)(
      'closes the artifact before returning when the request is %s without consuming its body',
      async (outcome) => {
        const fetcher = vi.fn(() => {
          if (outcome === 'disconnected')
            return Promise.reject(new Error('Disconnected'));
          return Promise.resolve(
            outcome === 'accepted'
              ? Response.json({
                  data: { releaseId: 'r1', operationId: 'op-1' },
                })
              : Response.json(
                  { error: { code: 'FORBIDDEN' } },
                  { status: 403 },
                ),
          );
        });
        vi.stubGlobal('fetch', fetcher);
        const result = publishToHub(
          'upload',
          { file: 'artifact.tar.gz', deploy: true, wait: false, config },
          root,
          env,
          root,
        );

        if (outcome === 'accepted') {
          await expect(result).resolves.toMatchObject({ releaseId: 'r1' });
        } else {
          await expect(result).rejects.toMatchObject({
            code: outcome === 'rejected' ? 'FORBIDDEN' : 'RESULT_UNKNOWN',
            exitCode: outcome === 'rejected' ? 1 : 3,
          });
        }
        expect(fetcher).toHaveBeenCalledTimes(1);
        expect(streams().length).toBeGreaterThan(0);
        for (const stream of streams()) expect(stream.closed).toBe(true);
      },
    );
  },
);

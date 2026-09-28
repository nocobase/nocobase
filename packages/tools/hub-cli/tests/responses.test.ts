// @vitest-environment node
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  bindAppCommand,
  runAppCommand,
  type AppCommandRun,
} from '@nocobase/app-cli/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Deploy from '../src/cli/deploy.ts';
import Upload from '../src/cli/upload.ts';

let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'hub-response-test-'));
  await writeFile(path.join(root, 'artifact.tar.gz'), 'artifact');
});
afterEach(async () => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  await rm(root, { recursive: true, force: true });
});
const secret = 'test-only-response-secret';
/** `upload-deploy` is `hub deploy` without `--release-id`, which uploads the archive and deploys it. */
function run(
  operation: 'upload' | 'deploy' | 'upload-deploy',
  flags: string[] = [],
): Promise<AppCommandRun> {
  const Command = bindAppCommand(operation === 'upload' ? Upload : Deploy, {
    rootDir: root,
    id: operation === 'upload' ? 'hub:upload' : 'hub:deploy',
  });
  return runAppCommand(Command, [
    '--json',
    '--hub',
    'https://hub.example/main',
    '--app-id',
    'crm',
    '--api-key',
    secret,
    '--idempotency-key',
    'retry-response-test',
    ...(operation === 'deploy'
      ? ['--release-id', 'r1']
      : ['--file', path.join(root, 'artifact.tar.gz')]),
    ...flags,
  ]);
}

describe.each(['upload', 'deploy'] as const)(
  '%s response validation',
  (operation) => {
    it.each([
      null,
      [],
      false,
      'unexpected',
      { data: [] },
      { data: null },
      { data: {} },
    ])(
      'reports an unknown result for malformed success envelope %j',
      async (payload) => {
        vi.stubGlobal(
          'fetch',
          vi.fn().mockResolvedValue(Response.json(payload)),
        );
        const result = await run(
          operation,
          operation === 'deploy' ? ['--no-wait'] : [],
        );
        expect(result.exitCode).toBe(3);
        expect(result.json()).toMatchObject({
          ok: false,
          command: `hub ${operation}`,
          status: 'failure',
          error: {
            code: 'INVALID_HUB_RESPONSE',
            // What a retry needs: the same key, reported even when the command chose it.
            details: {
              idempotencyKey: 'retry-response-test',
              ...(operation === 'deploy' ? { releaseId: 'r1' } : {}),
            },
          },
        });
        expect(result.stdout + result.stderr).not.toContain(secret);
      },
    );
    it.each([
      null,
      [],
      { error: null },
      { error: { code: 'contains private text' } },
    ])(
      'handles malformed HTTP error envelope %j without a TypeError',
      async (payload) => {
        vi.stubGlobal(
          'fetch',
          vi.fn().mockResolvedValue(Response.json(payload, { status: 403 })),
        );
        const result = await run(
          operation,
          operation === 'deploy' ? ['--no-wait'] : [],
        );
        expect(result.exitCode).toBe(1);
        expect(result.json()).toMatchObject({
          ok: false,
          error: { code: 'HUB_REQUEST_FAILED' },
        });
        expect(result.stdout + result.stderr).not.toContain(
          'contains private text',
        );
      },
    );
  },
);

describe('deployment acceptance validation', () => {
  it.each([
    { operationId: '', status: 'queued' },
    { operationId: '   ', status: 'queued' },
    { operationId: 'op-1', status: 'unexpected' },
    { operationId: 'op-1' },
    { operationId: 'op-1', status: null },
  ])(
    'rejects invalid deployment acceptance %j with --no-wait',
    async (data) => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(Response.json({ data })),
      );
      const result = await run('deploy', ['--no-wait']);
      expect(result.exitCode).toBe(3);
      expect(result.json()).toMatchObject({ ok: false });
    },
  );
  it.each(['queued', 'deploying', 'succeeded', 'failed', 'cancelled'])(
    'preserves confirmed %s status with --no-wait',
    async (status) => {
      const fetcher = vi
        .fn()
        .mockResolvedValue(
          Response.json({ data: { operationId: 'op-1', status } }),
        );
      vi.stubGlobal('fetch', fetcher);
      const result = await run('deploy', ['--no-wait']);
      if (status === 'failed' || status === 'cancelled') {
        expect(result.exitCode).toBe(1);
        expect(result.json()).toMatchObject({
          ok: false,
          error: {
            code: 'DEPLOYMENT_FAILED',
            details: { operationId: 'op-1', operationStatus: status },
          },
        });
      } else {
        expect(result.exitCode).toBeUndefined();
        expect(result.json()).toMatchObject({
          ok: true,
          result: { operationStatus: status },
        });
      }
      expect(fetcher).toHaveBeenCalledTimes(1);
    },
  );
  it.each(['', '   ', 12])(
    'rejects an invalid upload release ID %j',
    async (releaseId) => {
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValue(
            Response.json({ data: { releaseId, operationId: null } }),
          ),
      );
      const result = await run('upload');
      expect(result.exitCode).toBe(3);
      expect(result.json()).toMatchObject({
        ok: false,
        error: { code: 'INVALID_HUB_RESPONSE' },
      });
    },
  );
  it.each(['', '   ', 12, undefined])(
    'rejects an invalid upload deployment ID %j',
    async (operationId) => {
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValue(
            Response.json({ data: { releaseId: 'r1', operationId } }),
          ),
      );
      const result = await run('upload-deploy', ['--no-wait']);
      expect(result.exitCode).toBe(3);
      expect(result.json()).toMatchObject({
        ok: false,
        error: {
          code: 'INVALID_HUB_RESPONSE',
          details: { idempotencyKey: 'retry-response-test', releaseId: 'r1' },
        },
      });
    },
  );
});

// @vitest-environment node
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
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
import { publishRelease, publishToHub } from '../src/hub-publishing.ts';

let root: string;
const env = {
  HUB_URL: 'https://hub.example/main',
  HUB_APP_ID: 'crm',
  HUB_API_KEY: 'test-only-credential',
};
beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'hub-cli-test-'));
  await mkdir(path.join(root, 'storage/exports'), { recursive: true });
  await writeFile(path.join(root, 'storage/exports/dist.tar.gz'), 'artifact');
});
afterEach(async () => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  await rm(root, { recursive: true, force: true });
});
const response = (data: object) =>
  new Response(JSON.stringify({ data }), {
    headers: { 'content-type': 'application/json' },
  });

describe('Hub publishing client', () => {
  it.each(['upload', 'deploy'] as const)(
    '%s reads the App root .env with per-value flag and environment precedence',
    async (operation) => {
      await writeFile(
        path.join(root, '.env'),
        '# Publishing defaults\nHUB_URL="https://file.example/main"\nHUB_APP_ID=from-file # comment\nHUB_API_KEY=\'file-secret#literal\'\nNODE_OPTIONS=--invalid-option\n',
      );
      const processEnvBefore = { ...process.env };
      const fetcher = vi.fn().mockImplementation(() =>
        Promise.resolve(
          response({
            releaseId: 'r1',
            operationId: 'op-1',
            status: 'queued',
          }),
        ),
      );
      vi.stubGlobal('fetch', fetcher);
      const options = { 'release-id': 'r1', wait: false };
      const endpoint = operation === 'upload' ? 'releases' : 'deploy';
      const check = (host: string, appId: string, secret: string) => {
        const call = fetcher.mock.lastCall;
        expect(String(call?.[0])).toBe(
          `https://${host}/main/api/hub/apps/${appId}/${endpoint}`,
        );
        expect(call?.[1].headers.authorization).toBe(`Bearer ${secret}`);
      };
      const result = await publishToHub(operation, options, root, {});
      check('file.example', 'from-file', 'file-secret#literal');
      expect(JSON.stringify(result)).not.toContain('file-secret');

      // Each missing value falls back separately rather than selecting one source wholesale.
      const partialEnv = { HUB_API_KEY: 'ci-secret' };
      await publishToHub(
        operation,
        { ...options, 'app-id': 'flag-app' },
        root,
        partialEnv,
      );
      check('file.example', 'flag-app', 'ci-secret');
      expect(partialEnv).toEqual({ HUB_API_KEY: 'ci-secret' });

      await publishToHub(operation, options, root, env);
      check('hub.example', 'crm', env.HUB_API_KEY);
      await publishToHub(
        operation,
        {
          ...options,
          hub: 'https://flag.example/main',
          'app-id': 'flag-app',
          'api-key': 'flag-secret',
        },
        root,
        env,
      );
      check('flag.example', 'flag-app', 'flag-secret');
      expect(process.env).toEqual(processEnvBefore);
    },
  );

  it('resolves --file and --config from the current directory, and the default artifact from the App root', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'hub-cli-cwd-'));
    try {
      await writeFile(path.join(cwd, 'other.tar.gz'), 'other');
      await writeFile(path.join(cwd, 'runtime.yml'), 'feature: cwd\n');
      const bodies: string[] = [];
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation(async (_url: URL, init: RequestInit) => {
          if (typeof init.body === 'string') {
            bodies.push(init.body);
            return response({ operationId: 'op-1', status: 'queued' });
          }
          const chunks: Buffer[] = [];
          for await (const chunk of init.body as unknown as AsyncIterable<Buffer>)
            chunks.push(Buffer.from(chunk));
          bodies.push(Buffer.concat(chunks).toString());
          return response({ releaseId: 'r1', operationId: null });
        }),
      );

      await publishToHub('upload', { file: 'other.tar.gz' }, root, env, cwd);
      await publishToHub('upload', {}, root, env, cwd);
      await publishToHub(
        'deploy',
        { 'release-id': 'r1', config: 'runtime.yml', wait: false },
        root,
        env,
        cwd,
      );
      expect(bodies[0]).toBe('other');
      expect(bodies[1]).toBe('artifact');
      expect(JSON.parse(bodies[2] ?? '')).toMatchObject({
        config: { content: 'feature: cwd\n' },
      });

      // The App root is not searched for a path the caller named.
      await expect(
        publishToHub(
          'upload',
          { file: 'storage/exports/dist.tar.gz' },
          root,
          env,
          cwd,
        ),
      ).rejects.toMatchObject({ code: 'INVALID_ARTIFACT', exitCode: 2 });
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('reports unreadable .env as a local error before sending a request', async () => {
    await mkdir(path.join(root, '.env'));
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    await expect(publishToHub('upload', {}, root, env)).rejects.toMatchObject({
      code: 'INVALID_ENV_FILE',
      exitCode: 2,
      message: 'Cannot read the App root .env file.',
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('streams the file, preserves the Hub base path, and uses a checksum retry identity', async () => {
    const fetcher = vi.fn(async (url: URL, init: RequestInit) => {
      expect(String(url)).toBe(
        'https://hub.example/main/api/hub/apps/crm/releases',
      );
      expect(init.redirect).toBe('error');
      expect(init.headers).toMatchObject({
        authorization: 'Bearer test-only-credential',
        'content-type': 'application/gzip',
        'content-length': '8',
      });
      let body = '';
      for await (const chunk of init.body as unknown as AsyncIterable<Buffer>)
        body += chunk.toString();
      expect(body).toBe('artifact');
      return response({
        releaseId: 'release-1',
        version: '1.0.0',
        operationId: null,
      });
    });
    vi.stubGlobal('fetch', fetcher);
    const result = await publishToHub('upload', {}, root, env);
    expect(result.idempotencyKey).toBe(
      createHash('sha256').update('artifact').digest('hex'),
    );
    expect(JSON.stringify(result)).not.toContain(env.HUB_API_KEY);
  });
  it('gives flags precedence, waits through the minimal status endpoint, and distinguishes deployment failure', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        response({ operationId: 'op-1', status: 'queued' }),
      )
      .mockResolvedValueOnce(response({ status: 'succeeded' }));
    vi.stubGlobal('fetch', fetcher);
    const result = await publishToHub(
      'deploy',
      {
        hub: 'https://override.example/console',
        'app-id': 'erp',
        'api-key': 'override',
        'release-id': 'r1',
        wait: true,
      },
      root,
      env,
    );
    expect(result.operationStatus).toBe('succeeded');
    expect(String(fetcher.mock.calls[0]?.[0])).toBe(
      'https://override.example/console/api/hub/apps/erp/deploy',
    );
    expect(String(fetcher.mock.calls[1]?.[0])).toBe(
      'https://override.example/console/api/hub/apps/erp/deployments/op-1/status',
    );
    fetcher
      .mockResolvedValueOnce(
        response({ operationId: 'op-2', status: 'queued' }),
      )
      .mockResolvedValueOnce(response({ status: 'failed' }));
    await expect(
      publishToHub('deploy', { 'release-id': 'r2', wait: true }, root, env),
    ).rejects.toMatchObject({ exitCode: 1, code: 'DEPLOYMENT_FAILED' });
  });
  it('reports each deployment status once while it waits, without the Hub address', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          response({ operationId: 'op-1', status: 'queued' }),
        )
        .mockResolvedValueOnce(response({ status: 'queued' }))
        .mockResolvedValueOnce(response({ status: 'deploying' }))
        .mockResolvedValueOnce(response({ status: 'deploying' }))
        .mockResolvedValueOnce(response({ status: 'succeeded' })),
    );
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    const progress: string[] = [];
    try {
      const run = publishRelease(
        'deploy',
        {
          hub: 'https://hub.example/console',
          'release-id': 'r1',
          wait: true,
          onProgress: (message) => progress.push(message),
        },
        root,
        env,
      );
      await vi.runAllTimersAsync();
      await expect(run).resolves.toMatchObject({
        result: { operationStatus: 'succeeded' },
      });
    } finally {
      vi.useRealTimers();
    }
    expect(progress).toEqual([
      'Waiting for deployment op-1 (up to 600s)…',
      'Deployment op-1: queued',
      'Deployment op-1: deploying',
      'Deployment op-1: succeeded',
    ]);
    expect(progress.join('\n')).not.toContain('hub.example');
  });
  it.each(['failed', 'cancelled'])(
    'rejects a known %s deployment retry without waiting',
    async (status) => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => response({ operationId: 'previous-op', status })),
      );
      await expect(
        publishToHub('deploy', { 'release-id': 'r1', wait: false }, root, env),
      ).rejects.toMatchObject({ exitCode: 1, code: 'DEPLOYMENT_FAILED' });
    },
  );
  it('makes deployment retries identical and supports explicit fresh deployment identities', async () => {
    const fetcher = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(response({ operationId: 'op-1', status: 'queued' })),
      );
    vi.stubGlobal('fetch', fetcher);
    const first = await publishToHub(
      'deploy',
      { 'release-id': 'r1', wait: false },
      root,
      env,
    );
    expect(
      (
        await publishToHub(
          'deploy',
          { 'release-id': 'r1', wait: false },
          root,
          env,
        )
      ).idempotencyKey,
    ).toBe(first.idempotencyKey);
    expect(
      (
        await publishToHub(
          'deploy',
          { 'release-id': 'r1', 'idempotency-key': 'new-attempt', wait: false },
          root,
          env,
        )
      ).idempotencyKey,
    ).toBe('new-attempt');
  });
  it('reports a reused deployment as history rather than a fresh deployment', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          response({
            operationId: 'op-1',
            status: 'succeeded',
            reused: true,
            createdAt: '2026-09-18T07:00:00.000Z',
          }),
        ),
      ),
    );
    const result = await publishToHub(
      'deploy',
      { 'release-id': 'r1', wait: true },
      root,
      env,
    );
    expect(result).toMatchObject({
      reused: true,
      operationStatus: 'succeeded',
      deploymentCreatedAt: '2026-09-18T07:00:00.000Z',
    });
    expect(String(result.warning)).toContain('--idempotency-key');
  });

  it('stays quiet when the Hub created the deployment for this request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          response({
            operationId: 'op-1',
            status: 'succeeded',
            reused: false,
          }),
        ),
      ),
    );
    const result = await publishToHub(
      'deploy',
      { 'release-id': 'r1', wait: true },
      root,
      env,
    );
    expect(result.reused).toBeUndefined();
    expect(result.warning).toBeUndefined();
  });

  it('warns when upload --deploy reuses an existing Release and its deployment', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          response({
            releaseId: 'r1',
            operationId: 'op-1',
            status: 'succeeded',
            reused: true,
          }),
        ),
      ),
    );
    const result = await publishToHub(
      'upload',
      { deploy: true, wait: true },
      root,
      env,
    );
    expect(result).toMatchObject({
      reused: true,
      operationStatus: 'succeeded',
    });
    expect(String(result.warning)).toContain('--idempotency-key');
  });

  it('sends deploy and wait intent on the upload itself', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        response({ releaseId: 'r1', operationId: 'op-1', status: 'queued' }),
      )
      .mockResolvedValueOnce(response({ status: 'succeeded' }));
    vi.stubGlobal('fetch', fetcher);
    await publishToHub('upload', { deploy: true, wait: true }, root, env);
    expect(fetcher.mock.calls[0]?.[1].headers).toMatchObject({
      'x-hub-deployment-intent': 'explicit',
      'x-hub-wait': 'true',
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it.each([false, true])(
    'rejects upload-and-deploy without an operation even when wait is %s',
    async (wait) => {
      const fetcher = vi.fn().mockImplementation(() =>
        Promise.resolve(
          response({
            releaseId: 'existing',
            operationId: null,
            reused: true,
          }),
        ),
      );
      vi.stubGlobal('fetch', fetcher);
      await expect(
        publishToHub('upload', { deploy: true, wait }, root, env),
      ).rejects.toMatchObject({ code: 'NO_DEPLOYMENT', exitCode: 1 });
      expect(fetcher).toHaveBeenCalledTimes(1);
    },
  );

  it('reports invalid local input before calling Hub and classifies unconfirmed responses', async () => {
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    await expect(publishToHub('upload', {}, root, {})).rejects.toMatchObject({
      exitCode: 2,
    });
    await expect(
      publishToHub('upload', { file: 'missing' }, root, env),
    ).rejects.toMatchObject({ exitCode: 2 });
    await expect(
      publishToHub('upload', { wait: true }, root, env),
    ).rejects.toMatchObject({ exitCode: 2, code: 'WAIT_REQUIRES_DEPLOY' });
    await expect(
      publishToHub('upload', { hub: 'https://user:password@host' }, root, env),
    ).rejects.toMatchObject({ exitCode: 2 });
    expect(fetcher).not.toHaveBeenCalled();
    fetcher.mockRejectedValue(new Error(env.HUB_API_KEY));
    await expect(
      publishToHub('deploy', { 'release-id': 'r1', wait: false }, root, env),
    ).rejects.toMatchObject({ exitCode: 3, code: 'RESULT_UNKNOWN' });
    fetcher.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: 'FORBIDDEN', message: env.HUB_API_KEY },
        }),
        { status: 403 },
      ),
    );
    await expect(
      publishToHub('deploy', { 'release-id': 'r1', wait: false }, root, env),
    ).rejects.toMatchObject({
      exitCode: 1,
      message: 'Hub rejected the request (403, FORBIDDEN).',
    });
  });
  it('sends optional configuration in the request body and changes the default deploy retry identity with its content', async () => {
    const content = 'database:\n  password: private-test-value\n';
    await writeFile(path.join(root, 'runtime.yml'), content);
    const fetcher = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(response({ operationId: 'op-1', status: 'queued' })),
      );
    vi.stubGlobal('fetch', fetcher);
    const first = await publishToHub(
      'deploy',
      { 'release-id': 'r1', config: 'runtime.yml', wait: false },
      root,
      env,
      root,
    );
    expect(JSON.parse(fetcher.mock.calls[0]?.[1].body)).toEqual({
      releaseId: 'r1',
      config: { mode: 'file', content },
    });
    expect(JSON.stringify(first)).not.toContain('private-test-value');
    await writeFile(path.join(root, 'runtime.yml'), 'feature: changed\n');
    const second = await publishToHub(
      'deploy',
      { 'release-id': 'r1', config: 'runtime.yml', wait: false },
      root,
      env,
      root,
    );
    expect(second.idempotencyKey).not.toBe(first.idempotencyKey);
    fetcher.mockImplementation(async (_url: URL, init: RequestInit) => {
      const chunks: Buffer[] = [];
      for await (const chunk of init.body as unknown as AsyncIterable<Buffer>)
        chunks.push(Buffer.from(chunk));
      const bytes = Buffer.concat(chunks);
      const length = Buffer.byteLength('feature: changed\n');
      expect(init.headers).toMatchObject({
        'content-type': 'application/vnd.nocobase.release-upload.v1',
        'x-hub-config-length': String(length),
      });
      expect(bytes.subarray(0, length).toString()).toBe('feature: changed\n');
      expect(bytes.subarray(length).toString()).toBe('artifact');
      expect(JSON.stringify(init.headers)).not.toContain('feature');
      return response({
        releaseId: 'r1',
        operationId: 'op-1',
        status: 'queued',
      });
    });
    await publishToHub(
      'upload',
      { deploy: true, config: 'runtime.yml', wait: false },
      root,
      env,
      root,
    );
  });

  it('rejects unreadable configuration and upload-only configuration before calling Hub', async () => {
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    await expect(
      publishToHub('upload', { config: 'missing.yml' }, root, env),
    ).rejects.toMatchObject({ code: 'CONFIG_REQUIRES_DEPLOY', exitCode: 2 });
    await expect(
      publishToHub(
        'deploy',
        { 'release-id': 'r1', config: 'missing.yml' },
        root,
        env,
      ),
    ).rejects.toMatchObject({ code: 'INVALID_CONFIG_FILE', exitCode: 2 });
    await writeFile(path.join(root, 'runtime.yml'), '');
    await expect(
      publishToHub(
        'upload',
        { deploy: true, config: 'runtime.yml', wait: false },
        root,
        env,
        root,
      ),
    ).rejects.toMatchObject({ code: 'INVALID_CONFIG_FILE', exitCode: 2 });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('never reports a timeout or unknown status as success', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          response({ operationId: 'op-1', status: 'queued' }),
        )
        .mockResolvedValueOnce(response({ status: 'queued' })),
    );
    await expect(
      publishToHub('deploy', { 'release-id': 'r1', timeout: 0.01 }, root, env),
    ).rejects.toMatchObject({ exitCode: 3, code: 'WAIT_TIMEOUT' });
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          response({ operationId: 'op-1', status: 'queued' }),
        )
        .mockResolvedValueOnce(response({ status: 'unknown' })),
    );
    await expect(
      publishToHub('deploy', { 'release-id': 'r1', wait: true }, root, env),
    ).rejects.toMatchObject({ exitCode: 3 });
  });
});

describe('failure details', () => {
  it('carries none for a local error found before any request', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const failure = await publishToHub(
      'upload',
      { wait: true },
      root,
      env,
    ).catch((error: unknown) => error);
    expect(failure).toMatchObject({ code: 'WAIT_REQUIRES_DEPLOY' });
    expect((failure as { details?: unknown }).details).toBeUndefined();
  });

  it('names the Release a confirmed upload left without a deployment', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        response({ releaseId: 'existing', operationId: null, reused: true }),
      ),
    );
    await expect(
      publishToHub('upload', { deploy: true, wait: false }, root, env),
    ).rejects.toMatchObject({
      code: 'NO_DEPLOYMENT',
      details: {
        idempotencyKey: createHash('sha256').update('artifact').digest('hex'),
        releaseId: 'existing',
      },
    });
  });

  it('names the deployment a timed-out wait leaves running', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          response({ operationId: 'op-1', status: 'queued' }),
        )
        .mockResolvedValueOnce(response({ status: 'deploying' })),
    );
    await expect(
      publishToHub('deploy', { 'release-id': 'r1', timeout: 0.01 }, root, env),
    ).rejects.toMatchObject({
      code: 'WAIT_TIMEOUT',
      exitCode: 3,
      details: {
        idempotencyKey: expect.any(String),
        releaseId: 'r1',
        operationId: 'op-1',
        operationStatus: 'deploying',
      },
    });
  });

  it('keeps the reuse warning apart from the typed result', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        response({ operationId: 'op-1', status: 'succeeded', reused: true }),
      ),
    );
    const { result, warning } = await publishRelease(
      'deploy',
      { 'release-id': 'r1', wait: true },
      root,
      env,
    );
    expect(result).not.toHaveProperty('warning');
    expect(warning).toContain('--idempotency-key');
  });
});

/** `upload-deploy` is `hub deploy` without `--release-id`, which uploads the archive and deploys it. */
type Operation = 'upload' | 'deploy' | 'upload-deploy';

function commandName(operation: Operation): string {
  return operation === 'upload' ? 'hub upload' : 'hub deploy';
}

function command(
  operation: Operation,
  argv: readonly string[],
): Promise<AppCommandRun> {
  const Command = bindAppCommand(operation === 'upload' ? Upload : Deploy, {
    rootDir: root,
    id: commandName(operation).replace(' ', ':'),
  });
  return runAppCommand(Command, argv);
}

const connection = [
  '--hub',
  env.HUB_URL,
  '--app-id',
  env.HUB_APP_ID,
  '--api-key',
  env.HUB_API_KEY,
];

describe('CLI command output', () => {
  it.each([
    ['deploy', [], 'succeeded', true],
    ['deploy', [], 'failed', true],
    ['deploy', ['--wait'], 'succeeded', true],
    ['deploy', ['--no-wait'], 'queued', false],
    ['upload-deploy', [], 'succeeded', true],
    ['upload-deploy', [], 'failed', true],
    ['upload-deploy', ['--wait'], 'succeeded', true],
    ['upload-deploy', ['--no-wait'], 'queued', false],
    ['upload', [], 'queued', false],
  ] as const)(
    '%s %j reports %s with polling=%s',
    async (operation, flags, status, polls) => {
      const fetcher = vi
        .fn()
        .mockResolvedValueOnce(
          response({ releaseId: 'r1', operationId: 'op-1', status: 'queued' }),
        )
        .mockResolvedValueOnce(response({ status }));
      vi.stubGlobal('fetch', fetcher);
      const run = await command(operation, [
        '--json',
        ...connection,
        ...(operation === 'deploy'
          ? ['--release-id', 'r1']
          : ['--file', path.join(root, 'storage/exports/dist.tar.gz')]),
        ...flags,
      ]);
      // json() throws unless stdout is exactly one document.
      const json = run.json();
      if (status === 'failed') {
        expect(run.exitCode).toBe(1);
        expect(json).toMatchObject({
          ok: false,
          command: commandName(operation),
          status: 'failure',
          error: {
            code: 'DEPLOYMENT_FAILED',
            details: { operationId: 'op-1', operationStatus: 'failed' },
          },
        });
      } else {
        expect(run.exitCode).toBeUndefined();
        expect(json).toMatchObject({
          ok: true,
          command: commandName(operation),
          status: 'success',
          ...(polls ? { result: { operationStatus: 'succeeded' } } : {}),
        });
      }
      expect(fetcher).toHaveBeenCalledTimes(polls ? 2 : 1);
      if (polls)
        expect(String(fetcher.mock.calls[1]?.[0])).toMatch(
          /\/deployments\/op-1\/status$/,
        );
    },
  );
  it('prints one JSON envelope and a parameter exit code without echoing secret arguments', async () => {
    const run = await command('deploy', [
      '--json',
      '--api-key',
      env.HUB_API_KEY,
      '--timeout',
      'soon',
    ]);
    expect(run.exitCode).toBe(2);
    expect(run.json()).toMatchObject({
      ok: false,
      command: 'hub deploy',
      status: 'failure',
      error: { code: 'INVALID_USAGE' },
    });
    expect(run.stdout + run.stderr).not.toContain(env.HUB_API_KEY);
  });
  it('fails with the Release to deploy when an uploading deploy has no confirmed deployment', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          response({ releaseId: 'existing', operationId: null, reused: true }),
        ),
    );
    const run = await command('upload-deploy', [
      '--json',
      ...connection,
      '--file',
      path.join(root, 'storage/exports/dist.tar.gz'),
    ]);
    expect(run.exitCode).toBe(1);
    expect(run.json()).toMatchObject({
      ok: false,
      command: 'hub deploy',
      status: 'failure',
      error: { code: 'NO_DEPLOYMENT', details: { releaseId: 'existing' } },
    });
  });

  it('warns when the Hub reused an earlier deployment, and reports the run as a no-op', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          response({
            operationId: 'op-1',
            status: 'succeeded',
            reused: true,
          }),
        ),
      ),
    );
    const argv = [...connection, '--release-id', 'r1'];

    const human = await command('deploy', argv);
    expect(human.error).toBeUndefined();
    expect(human.stdout.trim().split('\n')).toEqual([
      expect.stringMatching(/^Deployment op-1: succeeded\. Retry key: /),
    ]);
    expect(human.stderr).toContain('--idempotency-key');

    const json = (await command('deploy', ['--json', ...argv])).json();
    expect(json).toMatchObject({
      ok: true,
      status: 'success-noop',
      result: { operationId: 'op-1', reused: true },
      warnings: [expect.stringContaining('--idempotency-key')],
    });
    expect(json.result).not.toHaveProperty('warning');
  });

  it('allows --no-wait to return the accepted deployment status', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(response({ operationId: 'op-1', status: 'queued' })),
    );
    await writeFile(path.join(root, 'runtime.yml'), 'feature: parsed\n');
    const run = await command('deploy', [
      '--json',
      ...connection,
      '--release-id',
      'r1',
      '--no-wait',
      '--config',
      path.join(root, 'runtime.yml'),
    ]);
    expect(
      JSON.parse(vi.mocked(fetch).mock.calls[0]?.[1]?.body as string),
    ).toMatchObject({ config: { mode: 'file', content: 'feature: parsed\n' } });
    expect(run.json()).toMatchObject({
      ok: true,
      status: 'success',
      result: { operationStatus: 'queued' },
      warnings: [],
    });
  });

  it('uploads the default archive from the App root, and a typed --file from the current directory', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'hub-cli-cwd-'));
    try {
      await writeFile(path.join(cwd, 'other.tar.gz'), 'other');
      const bodies: string[] = [];
      vi.stubGlobal(
        'fetch',
        vi.fn(async (_url: URL, init: RequestInit) => {
          const chunks: Buffer[] = [];
          for await (const chunk of init.body as unknown as AsyncIterable<Buffer>)
            chunks.push(Buffer.from(chunk));
          bodies.push(Buffer.concat(chunks).toString());
          return response({ releaseId: 'r1', operationId: null });
        }),
      );
      vi.spyOn(process, 'cwd').mockReturnValue(cwd);

      const defaulted = await command('upload', ['--json', ...connection]);
      const typed = await command('upload', [
        '--json',
        ...connection,
        '--file',
        'other.tar.gz',
      ]);

      expect(defaulted.json()).toMatchObject({ ok: true });
      expect(typed.json()).toMatchObject({ ok: true });
      expect(bodies).toEqual(['artifact', 'other']);
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});

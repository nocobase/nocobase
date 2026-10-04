// @vitest-environment node
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { c as createArchive } from 'tar';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { parseRemoteUrl } from '../src/remotes.ts';
import { DEFAULT_ARTIFACT, publish } from '../src/publish.ts';
import {
  APP_ID,
  data,
  DEPLOYMENT,
  failure,
  list,
  fakeHub,
  HOST_TARGET,
  REMOTE_URL,
} from './fake-hub.ts';

let root: string;
const apiKey = 'test-only-api-key';
const target = parseRemoteUrl(REMOTE_URL);

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'hub-publish-'));
});
afterEach(async () => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  await rm(root, { recursive: true, force: true });
});

/** Writes the default archive, recording `buildTarget` in its dist/package.json when given. */
async function writeArchive(buildTarget?: object): Promise<string> {
  const dist = path.join(root, 'staging', 'dist');
  await mkdir(dist, { recursive: true });
  await writeFile(
    path.join(dist, 'package.json'),
    JSON.stringify(buildTarget ? { nocobase: { buildTarget } } : {}),
  );
  const file = path.join(root, DEFAULT_ARTIFACT);
  await mkdir(path.dirname(file), { recursive: true });
  await createArchive({ gzip: true, file, cwd: path.join(root, 'staging') }, [
    'dist',
  ]);
  return file;
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

describe('hub deploy', () => {
  it('builds for the platform the Hub reports, uploads, deploys and waits', async () => {
    const hub = fakeHub();
    const build = vi.fn(async () => {
      await writeArchive(HOST_TARGET);
    });
    const progress: string[] = [];
    const { result, warning } = await publish({
      target,
      apiKey,
      root,
      deploy: true,
      build,
      onProgress: (line) => progress.push(line),
    });

    expect(build).toHaveBeenCalledWith([
      '--target',
      'linux-x64',
      '--node-version',
      '24',
      '--tar',
    ]);
    const routes = hub.requests.map(
      (request) => `${request.method} ${request.route}`,
    );
    const chunks = Math.ceil(hub.state.size / hub.state.chunkSize);
    expect(routes).toEqual([
      'GET ',
      'POST releases/uploads',
      ...Array<string>(chunks).fill('PATCH releases/uploads/u1'),
      'POST releases/uploads/u1/complete',
      'POST deploy',
      'GET deployments/op-1/status',
    ]);
    for (const request of hub.requests)
      expect(request.headers.authorization).toBe(`Bearer ${apiKey}`);
    expect(JSON.parse(hub.requests[1]?.body ?? '')).toEqual({
      size: result.size,
      sha256: result.checksum,
    });
    // The archive arrives whole and in order, each chunk at the offset the Hub has reached.
    expect(hub.state.received.length).toBe(result.size);
    expect(
      hub.requests
        .filter((request) => request.method === 'PATCH')
        .map((request) => Number(request.headers['upload-offset'])),
    ).toEqual(Array.from({ length: chunks }, (_, index) => index * 4));
    const complete = hub.requests.at(-3);
    // The upload is retried by its content, the deployment by what it deploys.
    expect(complete?.headers['idempotency-key']).toBe(result.checksum);
    const deployRequest = hub.requests.at(-2);
    expect(deployRequest?.headers['idempotency-key']).toBe(
      sha256(`${APP_ID}:r1`),
    );
    expect(JSON.parse(deployRequest?.body ?? '')).toEqual({
      releaseId: 'r1',
    });
    expect(result).toMatchObject({
      releaseId: 'r1',
      version: '1.0.0',
      reused: false,
      operationId: 'op-1',
      operationStatus: 'succeeded',
      buildTarget: HOST_TARGET,
    });
    expect(warning).toBeUndefined();
    expect(progress.slice(0, 2)).toEqual([
      'Building for linux-x64 Node 24…',
      expect.stringMatching(/^Uploading dist\.tar\.gz/u),
    ]);
    expect(progress.slice(-2)).toEqual([
      'Waiting for deployment op-1 (up to 600s)…',
      'Deployment op-1: succeeded',
    ]);
    // Progress is reported by the tenth, each tenth once.
    const tenths = progress.filter((line) => line.startsWith('Uploaded '));
    expect(tenths.length).toBeGreaterThan(0);
    expect(new Set(tenths).size).toBe(tenths.length);
    expect(JSON.stringify({ result, progress })).not.toContain(apiKey);
  });

  it('deploys the Release the Hub already has for the archive instead of failing', async () => {
    const hub = fakeHub({
      'POST releases/uploads': () =>
        data({
          offset: 10,
          size: 10,
          chunkSize: 4,
          releaseId: 'r0',
          version: '0.9.0',
          reused: true,
        }),
    });
    await writeArchive();
    const progress: string[] = [];
    const { result } = await publish({
      target,
      apiKey,
      root,
      deploy: true,
      onProgress: (line) => progress.push(line),
    });
    expect(result).toMatchObject({ releaseId: 'r0', reused: false });
    expect(JSON.parse(hub.requests.at(-2)?.body ?? '')).toEqual({
      releaseId: 'r0',
    });
    expect(progress).toContain(
      'The Hub already has this archive as Release r0; deploying it.',
    );
  });

  it('reports a reused deployment as history, after checking it succeeded', async () => {
    fakeHub({
      'POST deploy': () =>
        data({ operationId: 'op-1', status: 'succeeded', reused: true }),
    });
    const { result, warning } = await publish({
      target,
      apiKey,
      root,
      deploy: true,
      releaseId: 'r1',
      wait: false,
    });
    expect(result.reused).toBe(true);
    expect(warning).toMatch(/nothing was deployed now/u);
  });

  /**
   * A Hub that answers a known idempotency key with its deployment and any other with a new one, `op-3`. `latest` is
   * the App's latest deployment until then.
   */
  function hubWithDeployments(
    byKey: Record<string, string>,
    latest: string,
  ): ReturnType<typeof fakeHub> {
    const deployments = new Map(Object.entries(byKey));
    return fakeHub({
      'POST deploy': (request) => {
        const key = request.headers['idempotency-key'] ?? '';
        const existing = deployments.get(key);
        if (existing !== undefined)
          return data({
            operationId: existing,
            status: 'succeeded',
            reused: true,
          });
        deployments.set(key, 'op-3');
        latest = 'op-3';
        return data({ operationId: 'op-3', status: 'queued', reused: false });
      },
      'GET deployments?page=1&pageSize=1': () =>
        list([{ ...DEPLOYMENT, id: latest }], { total: 3, pageSize: 1 }),
      'GET deployments/op-3/status': () => data({ status: 'succeeded' }),
    });
  }

  it('rolls back to a Release deployed before, which its default key alone would only find again', async () => {
    // op-1 deployed r1 under the default key, then op-2 deployed r2.
    const firstKey = sha256(`${APP_ID}:r1`);
    const hub = hubWithDeployments({ [firstKey]: 'op-1' }, 'op-2');
    const { result, warning } = await publish({
      target,
      apiKey,
      root,
      deploy: true,
      releaseId: 'r1',
    });
    const nextKey = sha256(`${firstKey}:op-1`);
    expect(result).toMatchObject({
      operationId: 'op-3',
      reused: false,
      operationStatus: 'succeeded',
      idempotencyKey: nextKey,
    });
    expect(warning).toBeUndefined();
    expect(
      hub.requests.map((request) => [
        request.route,
        request.headers['idempotency-key'],
      ]),
    ).toEqual([
      ['deploy', firstKey],
      ['deployments?page=1&pageSize=1', undefined],
      ['deploy', nextKey],
      ['deployments/op-3/status', undefined],
    ]);
  });

  it('repeats nothing when a rollback runs again, walking the same keys to the deployment it made', async () => {
    // The rollback above made op-3 under the key derived from op-1.
    const firstKey = sha256(`${APP_ID}:r1`);
    const nextKey = sha256(`${firstKey}:op-1`);
    const hub = hubWithDeployments(
      { [firstKey]: 'op-1', [nextKey]: 'op-3' },
      'op-3',
    );
    const { result, warning } = await publish({
      target,
      apiKey,
      root,
      deploy: true,
      releaseId: 'r1',
      wait: false,
    });
    expect(result).toMatchObject({
      operationId: 'op-3',
      reused: true,
      idempotencyKey: nextKey,
    });
    expect(warning).toMatch(/latest deployment already deploys this Release/u);
    expect(
      hub.requests.filter((request) => request.route === 'deploy'),
    ).toHaveLength(2);
  });

  it('keeps a given idempotency key exact, even when the App has moved on', async () => {
    const hub = hubWithDeployments({ 'given-key': 'op-1' }, 'op-2');
    const { result, warning } = await publish({
      target,
      apiKey,
      root,
      deploy: true,
      releaseId: 'r1',
      idempotencyKey: 'given-key',
      wait: false,
    });
    expect(result).toMatchObject({ operationId: 'op-1', reused: true });
    expect(warning).toMatch(/earlier deployment for this idempotency key/u);
    expect(hub.requests.map((request) => request.route)).toEqual([
      'deploy',
      'deployments/op-1/status',
    ]);
  });

  it('deploys a named Release without building or uploading, keyed by its configuration', async () => {
    const hub = fakeHub();
    await writeFile(path.join(root, 'runtime.yml'), 'feature: on\n');
    const build = vi.fn();
    const { result } = await publish({
      target,
      apiKey,
      root,
      cwd: root,
      deploy: true,
      releaseId: 'r1',
      config: 'runtime.yml',
      build,
    });
    expect(build).not.toHaveBeenCalled();
    expect(hub.requests.map((request) => request.route)).toEqual([
      'deploy',
      'deployments/op-1/status',
    ]);
    expect(JSON.parse(hub.requests[0]?.body ?? '')).toEqual({
      releaseId: 'r1',
      config: { mode: 'file', content: 'feature: on\n' },
    });
    expect(result.idempotencyKey).toBe(
      sha256(`${APP_ID}:r1:${sha256('feature: on\n')}`),
    );
    expect(result).not.toHaveProperty('checksum');
  });

  it('refuses an archive built for another platform before uploading it', async () => {
    const hub = fakeHub();
    await writeArchive({ ...HOST_TARGET, arch: 'arm64', nodeMajor: 22 });
    await expect(
      publish({ target, apiKey, root, deploy: true }),
    ).rejects.toMatchObject({
      code: 'BUILD_TARGET_MISMATCH',
      exitCode: 2,
      message:
        'The archive targets linux-arm64 Node 22; the Hub runs linux-x64 Node 24. Rebuild it, or deploy without --no-build or --file to build for the Hub.',
    });
    expect(hub.requests.map((request) => request.route)).toEqual(['']);
  });

  it('cannot build when the Hub does not report its platform', async () => {
    fakeHub({ 'GET ': () => data({ id: APP_ID, buildTarget: null }) });
    const build = vi.fn();
    await expect(
      publish({ target, apiKey, root, deploy: true, build }),
    ).rejects.toMatchObject({ code: 'BUILD_TARGET_UNAVAILABLE' });
    expect(build).not.toHaveBeenCalled();
  });

  it.each(['failed', 'cancelled'])(
    'fails when the deployment ends %s, naming the Release and deployment',
    async (status) => {
      fakeHub({
        'GET deployments/op-1/status': () => data({ status }),
      });
      await expect(
        publish({ target, apiKey, root, deploy: true, releaseId: 'r1' }),
      ).rejects.toMatchObject({
        code: 'DEPLOYMENT_FAILED',
        exitCode: 1,
        details: {
          releaseId: 'r1',
          operationId: 'op-1',
          operationStatus: status,
        },
      });
    },
  );

  it('returns the accepted deployment with --no-wait', async () => {
    const hub = fakeHub();
    const { result } = await publish({
      target,
      apiKey,
      root,
      deploy: true,
      releaseId: 'r1',
      wait: false,
    });
    expect(result.operationStatus).toBe('queued');
    expect(hub.requests.map((request) => request.route)).toEqual(['deploy']);
  });
});

describe('hub upload', () => {
  it('uploads without deploying, keyed by the given idempotency key', async () => {
    const hub = fakeHub();
    await writeArchive(HOST_TARGET);
    const { result } = await publish({
      target,
      apiKey,
      root,
      deploy: false,
      idempotencyKey: 'ci-42',
    });
    expect(hub.requests.at(-1)?.route).toBe('releases/uploads/u1/complete');
    expect(hub.requests.at(-1)?.headers['idempotency-key']).toBe('ci-42');
    expect(result).toMatchObject({
      releaseId: 'r1',
      reused: false,
      idempotencyKey: 'ci-42',
    });
    expect(result).not.toHaveProperty('operationId');
  });

  it('uploads a --file from the current directory', async () => {
    const hub = fakeHub();
    await writeFile(path.join(root, 'other.tar.gz'), 'other');
    await publish({
      target,
      apiKey,
      root,
      cwd: root,
      file: 'other.tar.gz',
      deploy: false,
    });
    expect(hub.uploaded()).toBe('other');
  });

  it('resends a lost chunk from the offset the Hub reports', async () => {
    let failed = false;
    const hub = fakeHub();
    const put = hub.fetch.getMockImplementation();
    hub.fetch.mockImplementation(
      async (input: URL | string, init?: RequestInit) => {
        // The second chunk reaches the Hub, but its answer is lost.
        if (
          !failed &&
          init?.headers &&
          (init.headers as Record<string, string>)['upload-offset'] === '4'
        ) {
          failed = true;
          await put?.(input, init);
          throw new TypeError('socket hang up');
        }
        return put?.(input, init);
      },
    );
    await writeFile(path.join(root, 'other.tar.gz'), 'abcdefghij');
    const { result } = await publish({
      target,
      apiKey,
      root,
      cwd: root,
      file: 'other.tar.gz',
      deploy: false,
    });
    expect(result.releaseId).toBe('r1');
    expect(hub.uploaded()).toBe('abcdefghij');
    expect(
      hub.requests.map(
        (request) =>
          `${request.method} ${Number(request.headers['upload-offset'] ?? -1)}`,
      ),
    ).toContain('GET -1');
  });

  it('goes on from the offset a mismatch reports, without asking for it', async () => {
    const hub = fakeHub();
    // The Hub is already past the first chunk, as after a run whose answer to it was lost.
    hub.state.received = Buffer.from('abcd');
    const routes = hub.fetch.getMockImplementation();
    hub.fetch.mockImplementation(
      async (input: URL | string, init?: RequestInit) => {
        const response = await routes?.(input, init);
        // The session is reported at offset 0, so the first chunk is sent again and mismatches.
        return init?.method === 'POST' &&
          String(input).endsWith('/releases/uploads')
          ? data(
              {
                uploadId: 'u1',
                offset: 0,
                size: 10,
                chunkSize: 4,
                expiresAt: '2026-09-30T00:00:00.000Z',
              },
              201,
            )
          : response;
      },
    );
    await writeFile(path.join(root, 'other.tar.gz'), 'abcdefghij');
    const { result } = await publish({
      target,
      apiKey,
      root,
      cwd: root,
      file: 'other.tar.gz',
      deploy: false,
    });
    expect(result.releaseId).toBe('r1');
    expect(hub.uploaded()).toBe('abcdefghij');
    expect(
      hub.requests.map((request) => `${request.method} ${request.route}`),
    ).toEqual([
      'GET ',
      'POST releases/uploads',
      'PATCH releases/uploads/u1',
      'PATCH releases/uploads/u1',
      'PATCH releases/uploads/u1',
      'POST releases/uploads/u1/complete',
    ]);
  });

  it('keeps retrying when the read that finds the offset fails too', async () => {
    const hub = fakeHub();
    const routes = hub.fetch.getMockImplementation();
    let lostChunk = false;
    let lostRead = false;
    hub.fetch.mockImplementation(
      async (input: URL | string, init?: RequestInit) => {
        const headers = (init?.headers ?? {}) as Record<string, string>;
        // The second chunk reaches the Hub, but its answer is lost, and so is the read that follows.
        if (!lostChunk && headers['upload-offset'] === '4') {
          lostChunk = true;
          await routes?.(input, init);
          throw new TypeError('socket hang up');
        }
        if (
          lostChunk &&
          !lostRead &&
          init?.method === 'GET' &&
          String(input).endsWith('/releases/uploads/u1')
        ) {
          lostRead = true;
          throw new TypeError('connect ECONNREFUSED');
        }
        return routes?.(input, init);
      },
    );
    await writeFile(path.join(root, 'other.tar.gz'), 'abcdefghij');
    const { result } = await publish({
      target,
      apiKey,
      root,
      cwd: root,
      file: 'other.tar.gz',
      deploy: false,
    });
    expect(result.releaseId).toBe('r1');
    expect(hub.uploaded()).toBe('abcdefghij');
    expect(lostRead).toBe(true);
  }, 15_000);

  it('resumes a session an earlier run left unfinished', async () => {
    const hub = fakeHub();
    hub.state.received = Buffer.from('abcd');
    await writeFile(path.join(root, 'other.tar.gz'), 'abcdefghij');
    const progress: string[] = [];
    await publish({
      target,
      apiKey,
      root,
      cwd: root,
      file: 'other.tar.gz',
      deploy: false,
      onProgress: (line) => progress.push(line),
    });
    expect(hub.uploaded()).toBe('abcdefghij');
    expect(progress).toContain('Resuming an earlier upload at 40%.');
    expect(
      hub.requests.filter((request) => request.method === 'PATCH'),
    ).toHaveLength(2);
  });
});

describe('failures', () => {
  it('reports invalid local input before calling the Hub', async () => {
    const hub = fakeHub();
    await expect(
      publish({ target, apiKey, root, deploy: true }),
    ).rejects.toMatchObject({ code: 'INVALID_ARTIFACT', exitCode: 2 });
    await expect(
      publish({ target, apiKey, root, deploy: true, timeout: 0 }),
    ).rejects.toMatchObject({ code: 'INVALID_TIMEOUT' });
    await expect(
      publish({
        target,
        apiKey,
        root,
        deploy: true,
        idempotencyKey: 'has space',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_IDEMPOTENCY_KEY' });
    await expect(
      publish({
        target,
        apiKey,
        root,
        cwd: root,
        deploy: true,
        releaseId: 'r1',
        config: 'missing.yml',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_CONFIG_FILE' });
    expect(hub.requests).toEqual([]);
  });

  it("passes the Hub's error code through without its message", async () => {
    // A Release named in the body that the App does not have is an invalid argument, not a missing route.
    fakeHub({ 'POST deploy': () => failure('RELEASE_NOT_FOUND', 400) });
    const error: unknown = await publish({
      target,
      apiKey,
      root,
      deploy: true,
      releaseId: 'r1',
    }).catch((caught: unknown) => caught);
    expect(error).toMatchObject({
      code: 'RELEASE_NOT_FOUND',
      exitCode: 1,
      message: 'Hub rejected the request (400, RELEASE_NOT_FOUND).',
    });
    expect(JSON.stringify(error)).not.toContain('secret-bearing');
  });

  it('says no Hub answered when a 404 names nothing the Hub would, as at a mistyped mount path', async () => {
    for (const notFound of [
      () => new Response('<html>Not Found</html>', { status: 404 }),
      () => Response.json({ error: 'Not found' }, { status: 404 }),
      // An application without the Hub answers an unknown API path with the framework's own reason.
      () => failure('ROUTE_NOT_FOUND', 404, { domain: 'app' }),
    ]) {
      fakeHub({ 'POST deploy': notFound });
      const error: unknown = await publish({
        target,
        apiKey,
        root,
        deploy: true,
        releaseId: 'r1',
      }).catch((caught: unknown) => caught);
      // Nothing reached the Hub, so the outcome is known: nothing was deployed.
      expect(error).toMatchObject({
        code: 'HUB_NOT_FOUND',
        exitCode: 1,
        message:
          'No Hub API answered at https://hub.example/main (404). Check the remote URL.',
      });
    }
  });

  it('calls a lost request that changes the Hub unknown, and a lost read unreachable', async () => {
    fakeHub({
      'POST deploy': () => {
        throw new TypeError('socket hang up');
      },
    });
    await expect(
      publish({ target, apiKey, root, deploy: true, releaseId: 'r1' }),
    ).rejects.toMatchObject({ code: 'RESULT_UNKNOWN', exitCode: 3 });
    fakeHub({
      'GET ': () => {
        throw new TypeError('connect ECONNREFUSED');
      },
    });
    await expect(
      publish({ target, apiKey, root, deploy: true, build: vi.fn() }),
    ).rejects.toMatchObject({ code: 'HUB_UNREACHABLE', exitCode: 1 });
  });

  it('reports a request that outlasts the deadline as a timeout', async () => {
    const hub = fakeHub();
    const routes = hub.fetch.getMockImplementation();
    hub.fetch.mockImplementation((input: URL | string, init?: RequestInit) =>
      // The deployment request never answers until the client gives up on it.
      init?.method === 'POST' && String(input).endsWith('/deploy')
        ? new Promise<Response>((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => {
              reject(init.signal?.reason as Error);
            });
          })
        : (routes?.(input, init) as Promise<Response>),
    );
    await expect(
      publish({
        target,
        apiKey,
        root,
        deploy: true,
        releaseId: 'r1',
        timeout: 1,
      }),
    ).rejects.toMatchObject({
      code: 'TIMEOUT',
      exitCode: 3,
      message: expect.stringContaining('within 1 seconds'),
      details: { releaseId: 'r1' },
    });
  });

  it('never reports an unknown status as success', async () => {
    fakeHub({
      'GET deployments/op-1/status': () => data({ status: 'weird' }),
    });
    await expect(
      publish({ target, apiKey, root, deploy: true, releaseId: 'r1' }),
    ).rejects.toMatchObject({ code: 'RESULT_UNKNOWN', exitCode: 3 });
  });

  it('times out waiting and names the deployment still running', async () => {
    fakeHub({
      'GET deployments/op-1/status': () => data({ status: 'deploying' }),
    });
    await expect(
      publish({
        target,
        apiKey,
        root,
        deploy: true,
        releaseId: 'r1',
        timeout: 1,
      }),
    ).rejects.toMatchObject({
      code: expect.stringMatching(/^(WAIT_TIMEOUT|TIMEOUT|RESULT_UNKNOWN)$/u),
      exitCode: 3,
      details: { operationId: 'op-1' },
    });
  });
});

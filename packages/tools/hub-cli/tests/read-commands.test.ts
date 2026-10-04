// @vitest-environment node
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  bindAppCommand,
  runAppCommand,
  type AppCommandRun,
} from '@nocobase/app-cli/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import HubReleases from '../src/cli/releases.ts';
import HubStatus from '../src/cli/status.ts';
import { saveKey } from '../src/credentials.ts';
import { writeRemotes } from '../src/remotes.ts';
import {
  APP_ID,
  data,
  DEPLOYMENT,
  failure,
  list,
  fakeHub,
  HOST_TARGET,
  RELEASES,
  REMOTE_URL,
} from './fake-hub.ts';

let root: string;
let home: string;

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'hub-read-'));
  home = await mkdtemp(path.join(os.tmpdir(), 'hub-read-home-'));
  vi.stubEnv('XDG_CONFIG_HOME', home);
  vi.stubEnv('APPDATA', home);
  await writeRemotes(root, {
    default: 'origin',
    remotes: { origin: REMOTE_URL },
  });
  await saveKey(REMOTE_URL, 'test-only-api-key');
});
afterEach(async () => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  await rm(root, { recursive: true, force: true });
  await rm(home, { recursive: true, force: true });
});

function run(
  Command: Parameters<typeof bindAppCommand>[0],
  id: string,
  argv: readonly string[],
): Promise<AppCommandRun> {
  return runAppCommand(bindAppCommand(Command, { rootDir: root, id }), [
    '--json',
    ...argv,
  ]);
}

describe('hub releases', () => {
  it('lists the Releases with what runs and what was deployed', async () => {
    const hub = fakeHub({
      'GET releases?page=1&pageSize=5': () => list(RELEASES, { pageSize: 5 }),
    });
    const result = await run(HubReleases, 'hub:releases', ['--limit', '5']);
    expect(result.json()).toMatchObject({
      ok: true,
      command: 'hub releases',
      result: {
        releases: [
          {
            releaseId: 'r2',
            version: '2.0.0',
            uploadedAt: '2026-09-29T10:00:00.000Z',
            buildTarget: HOST_TARGET,
            running: true,
            everDeployed: true,
          },
          { releaseId: 'r1', buildTarget: null, running: false },
        ],
      },
    });
    expect(hub.requests[0]?.headers.authorization).toBe(
      'Bearer test-only-api-key',
    );
  });

  it('reports one Release, and the Hub error when it is missing', async () => {
    fakeHub({ 'GET releases/r1': () => data(RELEASES[1] ?? {}) });
    const one = await run(HubReleases, 'hub:releases', ['--release-id', 'r1']);
    expect(one.json()).toMatchObject({
      result: { releases: [{ releaseId: 'r1' }] },
    });
    fakeHub({ 'GET releases/r9': () => failure('RELEASE_NOT_FOUND', 404) });
    const missing = await run(HubReleases, 'hub:releases', [
      '--release-id',
      'r9',
    ]);
    expect(missing.json()).toMatchObject({
      error: { code: 'RELEASE_NOT_FOUND' },
    });
  });

  it.each(['0', '101'])('refuses --limit %s', async (limit) => {
    const result = await run(HubReleases, 'hub:releases', ['--limit', limit]);
    expect(result.exitCode).toBe(2);
    expect(result.json()).toMatchObject({ error: { code: 'INVALID_LIMIT' } });
  });
});

describe('hub status', () => {
  it('reports the target, what runs and the last deployment', async () => {
    fakeHub({
      'GET ': () =>
        data({
          app: { id: APP_ID },
          runtime: { hostAvailable: true, state: 'running' },
          currentVersion: '2.0.0',
          deployment: { observedReleaseId: 'r2', observedState: 'running' },
          buildTarget: HOST_TARGET,
        }),
      'GET deployments?page=1&pageSize=1': () =>
        list([DEPLOYMENT], { total: 3, pageSize: 1 }),
    });
    const result = await run(HubStatus, 'hub:status', []);
    expect(result.json()).toMatchObject({
      ok: true,
      command: 'hub status',
      result: {
        connection: {
          remote: 'origin',
          hub: 'https://hub.example/main',
          appId: APP_ID,
        },
        buildTarget: HOST_TARGET,
        running: { releaseId: 'r2', version: '2.0.0', state: 'running' },
        lastDeployment: {
          operationId: 'op-2',
          releaseId: 'r2',
          version: '2.0.0',
          status: 'succeeded',
          finishedAt: '2026-09-29T10:02:00.000Z',
        },
      },
    });
  });

  it('reports an App nothing was deployed to', async () => {
    fakeHub({
      'GET ': () =>
        data({ app: { id: APP_ID }, currentVersion: null, buildTarget: null }),
      'GET deployments?page=1&pageSize=1': () => list([], { pageSize: 1 }),
    });
    const result = await run(HubStatus, 'hub:status', []);
    expect(result.json()).toMatchObject({
      result: { buildTarget: null, running: null, lastDeployment: null },
    });
  });

  it('reports one deployment with --deployment', async () => {
    const hub = fakeHub();
    const result = await run(HubStatus, 'hub:status', ['--deployment', 'op-1']);
    expect(result.json()).toMatchObject({
      result: { deployment: { operationId: 'op-1', status: 'succeeded' } },
    });
    expect(hub.requests.map((request) => request.route)).toEqual([
      'deployments/op-1/status',
    ]);
  });
});

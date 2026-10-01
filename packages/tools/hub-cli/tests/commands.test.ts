// @vitest-environment node
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  bindAppCommand,
  runAppCommand,
  type AppCommandRun,
} from '@nocobase/app-cli/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import HubAuthLogin from '../src/cli/auth/login.ts';
import HubAuthLogout from '../src/cli/auth/logout.ts';
import HubAuthStatus from '../src/cli/auth/status.ts';
import { readStdin } from '../src/cli/auth/input.ts';
import HubDeploy from '../src/cli/deploy.ts';
import HubRemoteAdd from '../src/cli/remote/add.ts';
import HubRemoteList from '../src/cli/remote/list.ts';
import HubRemoteRemove from '../src/cli/remote/remove.ts';
import HubUpload from '../src/cli/upload.ts';
import { runBuild } from '../src/build.ts';
import { loadKey, saveKey } from '../src/credentials.ts';
import { DEFAULT_ARTIFACT } from '../src/publish.ts';
import { REMOTES_FILE } from '../src/remotes.ts';
import { failure, fakeHub, REMOTE_URL } from './fake-hub.ts';

vi.mock('../src/cli/auth/input.ts', () => ({
  readStdin: vi.fn(),
  promptHidden: vi.fn(),
}));
vi.mock('../src/build.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/build.ts')>()),
  runBuild: vi.fn(),
}));

const secret = 'test-only-api-key';
let root: string;
let home: string;

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'hub-commands-'));
  home = await mkdtemp(path.join(os.tmpdir(), 'hub-home-'));
  vi.stubEnv('XDG_CONFIG_HOME', home);
  vi.stubEnv('APPDATA', home);
});
afterEach(async () => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.mocked(readStdin).mockReset();
  vi.mocked(runBuild).mockReset();
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

async function addOrigin(): Promise<void> {
  const result = await run(HubRemoteAdd, 'hub:remote:add', [
    'origin',
    REMOTE_URL,
  ]);
  expect(result.exitCode ?? 0).toBe(0);
}

describe('hub remote', () => {
  it('adds remotes, makes the first the default, lists and removes them', async () => {
    const added = await run(HubRemoteAdd, 'hub:remote:add', [
      'origin',
      `${REMOTE_URL}/`,
    ]);
    expect(added.json()).toMatchObject({
      ok: true,
      command: 'hub remote add',
      result: {
        name: 'origin',
        url: REMOTE_URL,
        hub: 'https://hub.example/main',
        appId: 'crm',
        default: true,
      },
    });
    await run(HubRemoteAdd, 'hub:remote:add', [
      'us',
      'https://hub-us.example/apps/crm',
    ]);
    expect(
      JSON.parse(await readFile(path.join(root, REMOTES_FILE), 'utf8')),
    ).toEqual({
      default: 'origin',
      remotes: { origin: REMOTE_URL, us: 'https://hub-us.example/apps/crm' },
    });

    const duplicate = await run(HubRemoteAdd, 'hub:remote:add', [
      'us',
      REMOTE_URL,
    ]);
    expect(duplicate.exitCode).toBe(2);
    expect(duplicate.json()).toMatchObject({
      error: { code: 'REMOTE_EXISTS' },
    });

    const list = await run(HubRemoteList, 'hub:remote:list', []);
    expect(list.json()).toMatchObject({
      result: {
        remotes: [
          { name: 'origin', default: true },
          { name: 'us', default: false },
        ],
      },
    });

    const removed = await run(HubRemoteRemove, 'hub:remote:remove', ['origin']);
    expect(removed.json()).toMatchObject({
      result: { name: 'origin', wasDefault: true },
    });
    expect(
      JSON.parse(await readFile(path.join(root, REMOTES_FILE), 'utf8')),
    ).toEqual({ remotes: { us: 'https://hub-us.example/apps/crm' } });
  });

  it('rejects a URL that names no App, without writing anything', async () => {
    const result = await run(HubRemoteAdd, 'hub:remote:add', [
      'origin',
      'https://hub.example/main',
    ]);
    expect(result.exitCode).toBe(2);
    expect(result.json()).toMatchObject({
      error: { code: 'INVALID_REMOTE_URL' },
    });
    await expect(
      readFile(path.join(root, REMOTES_FILE), 'utf8'),
    ).rejects.toThrow();
  });
});

describe('hub auth', () => {
  it('saves a key the Hub accepts for the App, read from stdin', async () => {
    await addOrigin();
    const hub = fakeHub();
    vi.mocked(readStdin).mockResolvedValue(`${secret}\n`);
    const result = await run(HubAuthLogin, 'hub:auth:login', ['--with-token']);
    expect(result.json()).toMatchObject({
      ok: true,
      result: { remote: 'origin', url: REMOTE_URL, appId: 'crm' },
    });
    expect(hub.requests[0]?.headers.authorization).toBe(`Bearer ${secret}`);
    expect(await loadKey(REMOTE_URL)).toMatchObject({ apiKey: secret });
    expect(result.stdout + result.stderr).not.toContain(secret);
  });

  it('saves nothing when the Hub rejects the key, and says how to fix it', async () => {
    await addOrigin();
    fakeHub({ 'GET ': () => failure('INVALID_API_KEY', 401) });
    vi.mocked(readStdin).mockResolvedValue(secret);
    const result = await run(HubAuthLogin, 'hub:auth:login', ['--with-token']);
    expect(result.exitCode).toBe(1);
    expect(result.json()).toMatchObject({
      error: {
        code: 'INVALID_API_KEY',
        suggestions: [
          {
            run: {
              command: 'pnpm',
              args: ['nocobase', 'hub', 'auth', 'login', '--remote', 'origin'],
            },
          },
        ],
      },
    });
    expect(await loadKey(REMOTE_URL)).toBeUndefined();
  });

  it('points to the remote URL when no Hub answers at it', async () => {
    await addOrigin();
    fakeHub({
      'GET ': () => new Response('<html>Not Found</html>', { status: 404 }),
    });
    vi.mocked(readStdin).mockResolvedValue(secret);
    const result = await run(HubAuthLogin, 'hub:auth:login', ['--with-token']);
    expect(result.exitCode).toBe(1);
    expect(result.json()).toMatchObject({
      error: {
        code: 'HUB_NOT_FOUND',
        suggestions: [
          {
            message: expect.stringContaining(REMOTE_URL),
            run: {
              command: 'pnpm',
              args: ['nocobase', 'hub', 'remote', 'list'],
            },
          },
        ],
      },
    });
    expect(await loadKey(REMOTE_URL)).toBeUndefined();
  });

  it('refuses an empty key', async () => {
    await addOrigin();
    vi.mocked(readStdin).mockResolvedValue('  \n');
    const result = await run(HubAuthLogin, 'hub:auth:login', ['--with-token']);
    expect(result.json()).toMatchObject({ error: { code: 'MISSING_TOKEN' } });
  });

  it('reports each remote, and fails when a saved key is rejected', async () => {
    await addOrigin();
    await run(HubRemoteAdd, 'hub:remote:add', [
      'staging',
      'https://hub.example/main/apps/crm-staging',
    ]);
    await saveKey(REMOTE_URL, secret);
    fakeHub();
    const ok = await run(HubAuthStatus, 'hub:auth:status', []);
    expect(ok.json()).toMatchObject({
      ok: true,
      result: {
        credentials: [
          { remote: 'origin', loggedIn: true, valid: true },
          { remote: 'staging', loggedIn: false, valid: null },
        ],
      },
    });

    // A Hub that cannot answer, or a proxy answering in its place, says nothing about the key.
    fakeHub({
      'GET ': () =>
        new Response('<html>Bad gateway</html>', {
          status: 502,
          headers: { 'content-type': 'text/html' },
        }),
    });
    const unchecked = await run(HubAuthStatus, 'hub:auth:status', []);
    expect(unchecked.json()).toMatchObject({
      ok: true,
      result: {
        credentials: [
          {
            remote: 'origin',
            loggedIn: true,
            valid: null,
            error: 'INVALID_HUB_RESPONSE',
          },
          { remote: 'staging', loggedIn: false, valid: null },
        ],
      },
    });

    fakeHub({ 'GET ': () => failure('INVALID_API_KEY', 401) });
    const rejected = await run(HubAuthStatus, 'hub:auth:status', []);
    expect(rejected.exitCode).toBe(1);
    expect(rejected.json()).toMatchObject({
      error: {
        code: 'INVALID_API_KEY',
        details: {
          credentials: [
            { remote: 'origin', valid: false },
            { remote: 'staging' },
          ],
        },
      },
    });
  });

  it('logs out, and reports a second logout as a no-op', async () => {
    await addOrigin();
    await saveKey(REMOTE_URL, secret);
    const first = await run(HubAuthLogout, 'hub:auth:logout', []);
    expect(first.json()).toMatchObject({
      status: 'success',
      result: { removed: true },
    });
    const second = await run(HubAuthLogout, 'hub:auth:logout', []);
    expect(second.json()).toMatchObject({
      status: 'success-noop',
      result: { removed: false },
    });
  });
});

describe('hub deploy and hub upload', () => {
  it('build through the application CLI with the target the Hub reports', async () => {
    await addOrigin();
    await saveKey(REMOTE_URL, secret);
    fakeHub();
    vi.mocked(runBuild).mockImplementation(async () => {
      await mkdir(path.join(root, 'storage/exports'), { recursive: true });
      await writeFile(path.join(root, DEFAULT_ARTIFACT), 'artifact');
    });
    const result = await run(HubDeploy, 'hub:deploy', []);
    expect(result.json()).toMatchObject({
      ok: true,
      command: 'hub deploy',
      result: { releaseId: 'r1', operationStatus: 'succeeded' },
    });
    expect(runBuild).toHaveBeenCalledWith(
      {
        command: 'pnpm',
        args: [
          'nocobase',
          'build',
          '--target',
          'linux-x64',
          '--node-version',
          '24',
          '--tar',
        ],
      },
      root,
    );
  });

  it('uploads the existing archive with --no-build', async () => {
    await addOrigin();
    await saveKey(REMOTE_URL, secret);
    const hub = fakeHub();
    await mkdir(path.join(root, 'storage/exports'), { recursive: true });
    await writeFile(path.join(root, DEFAULT_ARTIFACT), 'artifact');
    const result = await run(HubUpload, 'hub:upload', ['--no-build']);
    expect(result.json()).toMatchObject({
      ok: true,
      result: { releaseId: 'r1' },
    });
    expect(runBuild).not.toHaveBeenCalled();
    expect(hub.uploaded()).toBe('artifact');
  });

  it('says how to log in when no key is saved', async () => {
    await addOrigin();
    const result = await run(HubDeploy, 'hub:deploy', ['--release-id', 'r1']);
    expect(result.exitCode).toBe(1);
    expect(result.json()).toMatchObject({
      error: {
        code: 'NOT_LOGGED_IN',
        suggestions: [
          {
            run: {
              command: 'pnpm',
              args: ['nocobase', 'hub', 'auth', 'login', '--remote', 'origin'],
            },
          },
        ],
      },
    });
  });

  it('says how to add a remote when there is none', async () => {
    const result = await run(HubDeploy, 'hub:deploy', []);
    expect(result.exitCode).toBe(2);
    expect(result.json()).toMatchObject({ error: { code: 'NO_REMOTE' } });
  });

  it.each([
    [HubDeploy, 'hub:deploy', ['--build', '--release-id', 'r1']],
    [HubDeploy, 'hub:deploy', ['--build', '--file', 'x.tar.gz']],
    [HubUpload, 'hub:upload', ['--build', '--file', 'x.tar.gz']],
  ] as const)(
    'refuses --build with an existing archive or Release',
    async (Command, id, argv) => {
      await addOrigin();
      const result = await run(Command, id, argv);
      expect(result.exitCode).toBe(2);
      expect(result.json()).toMatchObject({
        error: { code: 'CONFLICTING_FLAGS' },
      });
    },
  );

  it('reports a reused deployment as a no-op with its warning', async () => {
    await addOrigin();
    await saveKey(REMOTE_URL, secret);
    fakeHub({
      'POST deploy': () =>
        new Response(
          JSON.stringify({
            data: { operationId: 'op-1', status: 'succeeded', reused: true },
          }),
          { headers: { 'content-type': 'application/json' } },
        ),
    });
    const result = await run(HubDeploy, 'hub:deploy', ['--release-id', 'r1']);
    expect(result.json()).toMatchObject({
      ok: true,
      status: 'success-noop',
      warnings: [expect.stringMatching(/nothing was deployed now/u)],
    });
  });

  it('reports an unexpected failure by code alone', async () => {
    await addOrigin();
    await saveKey(REMOTE_URL, secret);
    vi.stubGlobal(
      'fetch',
      vi.fn(() => {
        throw Object.assign(new Error(`cause containing ${secret}`), {
          name: 'Weird',
        });
      }),
    );
    // A thrown non-TypeError from fetch is still a lost request, which the library classifies.
    const result = await run(HubDeploy, 'hub:deploy', ['--release-id', 'r1']);
    expect(result.json()).toMatchObject({
      error: { code: 'RESULT_UNKNOWN' },
    });
    expect(result.stdout + result.stderr).not.toContain(secret);
  });
});

// db-test-portability: sqlite-only — the installer handles an application's SQLite database file
import { spawn } from 'node:child_process';
import {
  mkdtemp,
  mkdir,
  readFile,
  readlink,
  realpath,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readCurrent, switchCurrent } from '../src/lib/current-link.ts';
import { buildEcosystemConfig, buildLauncher } from '../src/lib/ecosystem.ts';
import {
  buildAppEnv,
  endpointsOf,
  healthUrl,
  readAppEnv,
} from '../src/lib/env-file.ts';
import { layoutOf, releaseId, releaseLinkTarget } from '../src/lib/layout.ts';
import { acquireLock } from '../src/lib/lock.ts';
import {
  readState,
  writeState,
  type InstallerState,
} from '../src/lib/state.ts';

let root: string;

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'app-installer-'));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('app.env', () => {
  it('writes absolute config and storage paths, so a release never holds the data', async () => {
    const layout = layoutOf(root);
    await writeFile(
      layout.appEnv,
      buildAppEnv(layout, {
        origin: 'https://apps.example.com',
        host: '127.0.0.1',
        port: 13000,
        basePath: '/crm',
      }),
    );
    const env = await readAppEnv(layout);
    expect(env).toMatchObject({
      NODE_ENV: 'production',
      APP_BASE_PATH: '/crm',
      APP_CONFIG_FILE: layout.configFile,
      APP_STORAGE_DIR: layout.storageDir,
      APP_PUBLIC_ORIGIN: 'https://apps.example.com',
      APP_SERVER_PORT: '13000',
      NOCOBASE_STRICT_STARTUP: 'true',
    });
    expect(env.HUB_STORAGE_DIR).toBeUndefined();
    expect(path.isAbsolute(env.APP_CONFIG_FILE)).toBe(true);
    expect(path.isAbsolute(env.APP_STORAGE_DIR)).toBe(true);
  });

  it('quotes a path with spaces so it reads back unchanged', async () => {
    const spaced = path.join(root, 'with space');
    await mkdir(spaced);
    const layout = layoutOf(spaced);
    await writeFile(
      layout.appEnv,
      buildAppEnv(layout, {
        origin: 'http://127.0.0.1:13000',
        host: '127.0.0.1',
        port: 13000,
        basePath: '/main',
      }),
    );
    expect((await readAppEnv(layout)).APP_STORAGE_DIR).toBe(layout.storageDir);
  });

  it('checks health on loopback when the application binds every interface, under its base path', () => {
    expect(
      healthUrl({
        APP_BASE_PATH: '/hub',
        APP_SERVER_HOST: '0.0.0.0',
        APP_SERVER_PORT: '13001',
      }),
    ).toBe('http://127.0.0.1:13001/hub/api/healthz');
    expect(
      healthUrl({ APP_SERVER_HOST: '10.0.0.5', APP_SERVER_PORT: '80' }),
    ).toBe('http://10.0.0.5:80/main/api/healthz');
    expect(healthUrl({ APP_BASE_PATH: '/', APP_SERVER_PORT: '80' })).toBe(
      'http://127.0.0.1:80/api/healthz',
    );
  });

  it('reads a hand-edited origin and port the way install writes them', () => {
    expect(
      endpointsOf({
        APP_BASE_PATH: '/crm/',
        APP_PUBLIC_ORIGIN: 'https://apps.example.com//',
        APP_SERVER_HOST: '127.0.0.1',
        APP_SERVER_PORT: ' 13002 ',
      }),
    ).toEqual({
      url: 'https://apps.example.com/crm/',
      origin: 'https://apps.example.com',
      host: '127.0.0.1',
      port: 13002,
    });
    for (const port of ['', 'abc', '0', '70000', '13000.5']) {
      expect(endpointsOf({ APP_SERVER_PORT: port }).port).toBeNull();
    }
    // Health is still checked at what the file says, so an unreadable port fails the check rather than hiding.
    expect(healthUrl({ APP_SERVER_PORT: 'abc' })).toBe(
      'http://127.0.0.1:abc/main/api/healthz',
    );
  });

  it('reports the public URL and the listening address as endpoints', async () => {
    const layout = layoutOf(root);
    await writeFile(
      layout.appEnv,
      buildAppEnv(layout, {
        origin: 'https://apps.example.com',
        host: '0.0.0.0',
        port: 13001,
        basePath: '/',
      }),
    );
    expect(endpointsOf(await readAppEnv(layout))).toEqual({
      url: 'https://apps.example.com/',
      origin: 'https://apps.example.com',
      host: '0.0.0.0',
      port: 13001,
    });
  });
});

describe('ecosystem.config.cjs', () => {
  it('runs node on launcher.mjs and names nothing a switch or an edit changes', async () => {
    const layout = layoutOf(root);
    await writeFile(
      layout.ecosystemFile,
      buildEcosystemConfig({
        name: 'nocobase-hub',
        nodePath: '/usr/bin/node',
        keepChildren: true,
      }),
    );

    const require = createRequire(import.meta.url);
    const config = require(layout.ecosystemFile) as {
      apps: {
        name: string;
        script: string;
        args: string[];
        interpreter: string;
        cwd: string;
        env?: Record<string, string>;
        kill_timeout: number;
        treekill: boolean;
      }[];
    };
    const [app] = config.apps;
    expect(app.name).toBe('nocobase-hub');
    expect(app.script).toBe('/usr/bin/node');
    expect(app.interpreter).toBe('none');
    // `require` resolves the file's real path, which differs from a temporary directory's name on macOS.
    const realRoot = await realpath(root);
    expect(app.args).toEqual([path.join(realRoot, 'launcher.mjs')]);
    expect(app.cwd).toBe(realRoot);
    // app.env is read by launcher.mjs on every start; values captured here would go stale under pm2 restart.
    expect(app.env).toBeUndefined();
    expect(app.kill_timeout).toBeGreaterThanOrEqual(60_000);
    expect(app.treekill).toBe(false);
  });

  it('leaves pm2 to kill the process tree of an application that hosts nothing', async () => {
    const layout = layoutOf(root);
    await writeFile(
      layout.ecosystemFile,
      buildEcosystemConfig({ name: 'nocobase-crm', nodePath: '/usr/bin/node' }),
    );
    const config = createRequire(import.meta.url)(layout.ecosystemFile) as {
      apps: { treekill?: boolean; error_file: string }[];
    };
    expect(config.apps[0].treekill).toBeUndefined();
    expect(config.apps[0].error_file).toBe(
      path.join(await realpath(root), 'logs/app.err.log'),
    );
  });
});

describe('launcher.mjs', () => {
  /** A release whose server entry reports how it was started instead of starting an application. */
  async function fakeRelease(version: string): Promise<string> {
    const entry = path.join(
      root,
      releaseLinkTarget(version),
      'dist/server/standalone.js',
    );
    await mkdir(path.dirname(entry), { recursive: true });
    await writeFile(
      entry,
      `console.log(JSON.stringify({ version: ${JSON.stringify(version)}, pid: process.pid, main: import.meta.main, entry: process.argv[1], args: process.argv.slice(2), execArgv: process.execArgv, cwd: process.cwd(), origin: process.env.APP_PUBLIC_ORIGIN, storage: process.env.APP_STORAGE_DIR }));\n`,
    );
    return realpath(entry);
  }

  async function writeEnv(origin: string): Promise<void> {
    const layout = layoutOf(root);
    await writeFile(
      layout.appEnv,
      buildAppEnv(layout, {
        origin,
        host: '127.0.0.1',
        port: 13000,
        basePath: '/main',
      }),
    );
  }

  function launch(
    nodeFlags: string[] = [],
    args: string[] = [],
  ): Promise<{
    pid: number | undefined;
    report: Record<string, unknown>;
  }> {
    const child = spawn(
      process.execPath,
      [...nodeFlags, layoutOf(root).launcherFile, ...args],
      {
        cwd: root,
        stdio: ['ignore', 'pipe', 'inherit'],
      },
    );
    let stdout = '';
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    return new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('close', (code) => {
        if (code !== 0) reject(new Error(`launcher exited with ${code}`));
        else
          resolve({
            pid: child.pid,
            report: JSON.parse(stdout) as Record<string, unknown>,
          });
      });
    });
  }

  it('becomes the current release in the same process, with app.env applied', async () => {
    const layout = layoutOf(root);
    const entry = await fakeRelease('1.0.0');
    await symlink(releaseLinkTarget('1.0.0'), layout.current);
    await writeEnv('https://apps.example.com');
    await writeFile(layout.launcherFile, buildLauncher());

    const { pid, report } = await launch();
    expect(report).toMatchObject({
      version: '1.0.0',
      // The same pid pm2 started, so its signals reach the application itself.
      pid,
      // Main module, or standalone.js never starts the server.
      main: true,
      // The real path, so a running application keeps loading its own release after `current` moves.
      entry,
      cwd: await realpath(root),
      origin: 'https://apps.example.com',
      storage: layout.storageDir,
    });
  });

  it('passes node flags and arguments given to it on to the application', async () => {
    const layout = layoutOf(root);
    await fakeRelease('1.0.0');
    await symlink(releaseLinkTarget('1.0.0'), layout.current);
    await writeEnv('https://apps.example.com');
    await writeFile(layout.launcherFile, buildLauncher());

    const { report } = await launch(['--max-old-space-size=256'], ['--extra']);
    expect(report).toMatchObject({
      execArgv: ['--max-old-space-size=256'],
      args: ['--extra'],
    });
  });

  it('reads current and app.env again on every start, which is what makes pm2 restart apply them', async () => {
    const layout = layoutOf(root);
    await fakeRelease('1.0.0');
    await fakeRelease('1.1.0');
    await symlink(releaseLinkTarget('1.0.0'), layout.current);
    await writeEnv('https://apps.example.com');
    await writeFile(layout.launcherFile, buildLauncher());
    expect((await launch()).report.version).toBe('1.0.0');

    await switchCurrent(layout, releaseLinkTarget('1.1.0'));
    await writeEnv('https://hub.example.org');
    expect((await launch()).report).toMatchObject({
      version: '1.1.0',
      origin: 'https://hub.example.org',
    });
  });
});

describe('current link', () => {
  it('replaces an existing link in one rename', async () => {
    const layout = layoutOf(root);
    expect(await readCurrent(layout)).toBeUndefined();
    await switchCurrent(layout, releaseLinkTarget('1.0.0'));
    await switchCurrent(layout, releaseLinkTarget('1.1.0'));
    expect(await readlink(layout.current)).toBe(releaseLinkTarget('1.1.0'));
  });
});

describe('installer.json', () => {
  const id = releaseId('1.0.0', '2026-01-01T00:00:00.000Z');
  const state: InstallerState = {
    schemaVersion: 1,
    appName: 'crm',
    basePath: '/crm',
    templateKind: 'app',
    source: { kind: 'archive' },
    name: 'nocobase-crm',
    registry: 'https://npm.nocobase.ai',
    dialect: 'sqlite',
    drivers: [],
    current: id,
    releases: [
      {
        id,
        version: '1.0.0',
        builtAt: '2026-01-01T00:00:00.000Z',
        installedAt: '2026-01-01T00:00:00.000Z',
        buildTarget: { platform: 'linux', arch: 'x64', nodeMajor: 24 },
      },
    ],
    history: [{ action: 'install', to: id, at: '2026-01-01T00:00:00.000Z' }],
  };

  it('names a release by its version and UTC build time', () => {
    expect(id).toBe('1.0.0_20260101T000000Z');
    expect(releaseId('1.2.0-beta.3', '2026-09-27T08:55:00.123+08:00')).toBe(
      '1.2.0-beta.3_20260927T005500Z',
    );
  });

  it('reads back what it wrote', async () => {
    const layout = layoutOf(root);
    await writeState(layout, state);
    expect(await readState(layout)).toEqual(state);
  });

  it('reports a root without installer.json as not installed', async () => {
    await expect(readState(layoutOf(root))).rejects.toMatchObject({
      code: 'NOT_INSTALLED',
      exitCode: 2,
    });
  });

  it('refuses a schema it does not know', async () => {
    const layout = layoutOf(root);
    await writeFile(
      layout.stateFile,
      JSON.stringify({ ...state, schemaVersion: 2 }),
    );
    await expect(readState(layout)).rejects.toMatchObject({
      code: 'STATE_UNSUPPORTED',
    });
  });
});

describe('lock', () => {
  it('lets one installer in and turns the next away', async () => {
    const file = path.join(root, '.installer.lock');
    const release = await acquireLock(file);
    // The lock holds this process's pid, which is alive, so a second attempt from another pid is refused.
    await writeFile(file, `${process.ppid}\n`);
    await expect(acquireLock(file)).rejects.toMatchObject({ code: 'LOCKED' });
    await release();
    await expect(readFile(file, 'utf8')).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  it('takes over a lock whose owner is gone', async () => {
    const file = path.join(root, '.installer.lock');
    // pid 2^22 + 1 is above the default pid_max on Linux and macOS, so no process has it.
    await writeFile(file, `${2 ** 22 + 1}\n`);
    const release = await acquireLock(file);
    expect((await readFile(file, 'utf8')).trim()).toBe(String(process.pid));
    await release();
  });
});

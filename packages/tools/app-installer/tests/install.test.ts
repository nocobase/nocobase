// db-test-portability: sqlite-only — the installer handles an application's SQLite database file
import {
  existsSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  writeFileSync,
} from 'node:fs';
import { createServer, type Server } from 'node:net';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  archiveFor,
  createWorld,
  freePort,
  installer,
  tempDir,
} from './harness.ts';

let temp: ReturnType<typeof tempDir>;
let root: string;

let PORT: string;

/** The first archive a fresh fake world writes: 1.1.0, built at its first build time. */
const RELEASE = path.join('releases', '1.1.0_20260101T000000Z', 'app');

beforeEach(async () => {
  temp = tempDir('app-installer-install-');
  root = path.join(temp.dir, 'shop');
  PORT = String(await freePort());
});

afterEach(() => {
  temp.remove();
});

describe('install', () => {
  it('unpacks, configures, migrates and starts the application, writing only the release under releases/', async () => {
    const world = createWorld();
    const result = await installer(world, [
      'install',
      '--archive',
      archiveFor(world, temp.dir, '1.1.0'),
      root,
      '--port',
      PORT,
    ]);

    expect(result.code).toBe(0);
    expect(result.json.result).toMatchObject({
      version: '1.1.0',
      started: true,
      initialAdmin: {
        key: 'users.initialAdmin',
        username: 'nocobase',
        email: 'admin@nocobase.com',
        defaultPassword: true,
      },
    });
    // The password itself never leaves config.yml.
    expect(JSON.stringify(result.json)).not.toContain('admin123');
    expect(result.stderr).not.toContain('admin123');
    expect(readlinkSync(path.join(root, 'current'))).toBe(RELEASE);
    expect(readdirSync(root).sort()).toEqual([
      'app.env',
      'config.yml',
      'current',
      'ecosystem.config.cjs',
      'installer.json',
      'launcher.mjs',
      'logs',
      'releases',
      'storage',
    ]);
    const state = JSON.parse(
      readFileSync(path.join(root, 'installer.json'), 'utf8'),
    );
    expect(state).toMatchObject({
      appName: 'shop',
      basePath: '/shop',
      source: { kind: 'archive' },
      current: '1.1.0_20260101T000000Z',
      releases: [
        {
          id: '1.1.0_20260101T000000Z',
          version: '1.1.0',
          builtAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      name: 'nocobase-shop',
      dialect: 'sqlite',
    });
    const env = readFileSync(path.join(root, 'app.env'), 'utf8');
    expect(env).toContain(`APP_STORAGE_DIR=${path.join(root, 'storage')}`);
    // Only the one storage variable: HUB_STORAGE_DIR is gone.
    expect(env).not.toContain('HUB_STORAGE_DIR');
    expect(world.pm2.calls).toEqual([
      'version',
      `start ${path.join(root, 'ecosystem.config.cjs')}`,
      'save',
    ]);
  });

  it('installs through --dir the same way as through the argument, and reports the endpoints', async () => {
    const world = createWorld();
    const result = await installer(world, [
      'install',
      '--archive',
      archiveFor(world, temp.dir, '1.1.0'),
      '--dir',
      root,
      '--port',
      PORT,
      '--origin',
      'https://apps.example.com',
    ]);

    expect(result.code).toBe(0);
    expect(result.json.result).toMatchObject({
      directory: root,
      endpoints: {
        url: 'https://apps.example.com/shop/',
        origin: 'https://apps.example.com',
        host: '127.0.0.1',
        port: Number(PORT),
      },
    });
    expect(readlinkSync(path.join(root, 'current'))).toBe(RELEASE);
  });

  it('names the pm2 process after the installation directory', async () => {
    const world = createWorld();
    const crm = path.join(temp.dir, 'crm');
    const result = await installer(world, [
      'install',
      '--archive',
      archiveFor(world, temp.dir, '1.1.0'),
      crm,
      '--port',
      PORT,
    ]);

    expect(result.code).toBe(0);
    expect(result.json.result?.name).toBe('nocobase-crm');
    expect(world.pm2.processes.has('nocobase-crm')).toBe(true);
  });

  it('accepts an argument and a --dir that name the same directory', async () => {
    const world = createWorld();
    const result = await installer(world, [
      'install',
      '--archive',
      archiveFor(world, temp.dir, '1.1.0'),
      root,
      '--dir',
      `${root}/`,
      '--port',
      PORT,
    ]);

    expect(result.code).toBe(0);
    expect(result.json.result?.directory).toBe(root);
  });

  it('removes everything it wrote, parents included, when migrating fails', async () => {
    const nested = path.join(temp.dir, 'new-parent', 'shop');
    const world = createWorld({ failOn: 'db apply' });
    const result = await installer(world, [
      'install',
      '--archive',
      archiveFor(world, temp.dir, '1.1.0'),
      nested,
      '--port',
      PORT,
    ]);

    expect(result.code).toBe(1);
    expect(existsSync(path.join(temp.dir, 'new-parent'))).toBe(false);
  });

  it('refuses a pm2 name another process already uses, before writing anything', async () => {
    const world = createWorld();
    world.pm2.processes.set('nocobase-shop', {
      name: 'nocobase-shop',
      pid: 1,
      status: 'online',
      restarts: 0,
      cwd: '/srv/other-shop',
    });
    const result = await installer(world, [
      'install',
      '--archive',
      archiveFor(world, temp.dir, '1.1.0'),
      root,
      '--port',
      PORT,
    ]);

    expect(result.code).toBe(2);
    expect(result.json.error?.code).toBe('PM2_NAME_IN_USE');
    expect(result.json.error?.message).toContain('/srv/other-shop');
    expect(existsSync(root)).toBe(false);
    expect(world.pm2.processes.get('nocobase-shop')?.cwd).toBe(
      '/srv/other-shop',
    );
  });

  it('refuses a pm2 older than the floor, before writing anything', async () => {
    const world = createWorld();
    // 4.2 is the last pm2 that runs ecosystem.config.cjs as an application.
    world.pm2.version = async () => '4.2.3';
    const result = await installer(world, [
      'install',
      '--archive',
      archiveFor(world, temp.dir, '1.1.0'),
      root,
      '--port',
      PORT,
    ]);

    expect(result.code).toBe(2);
    expect(result.json.error?.code).toBe('PM2_UNSUPPORTED');
    expect(existsSync(root)).toBe(false);
  });

  it('reports where the installed application is reached and where it listens', async () => {
    const world = createWorld();
    await installer(world, [
      'install',
      '--archive',
      archiveFor(world, temp.dir, '1.1.0'),
      root,
      '--port',
      PORT,
      '--origin',
      'https://apps.example.com',
    ]);
    const result = await installer(world, ['status', '--dir', root]);

    expect(result.code).toBe(0);
    expect(result.json.result?.endpoints).toEqual({
      url: 'https://apps.example.com/shop/',
      origin: 'https://apps.example.com',
      host: '127.0.0.1',
      port: Number(PORT),
    });
  });

  it('checks --set-from-env variables before unpacking', async () => {
    const world = createWorld();
    const result = await installer(world, [
      'install',
      '--archive',
      archiveFor(world, temp.dir, '1.1.0'),
      root,
      '--port',
      PORT,
      '--set-from-env',
      'database.connections.main.password=HUB_INSTALLER_TEST_UNSET',
    ]);

    expect(result.code).toBe(2);
    expect(result.json.error?.code).toBe('ENV_MISSING');
    expect(world.calls).toEqual([]);
  });

  describe('with the port taken', () => {
    let server: Server;
    let port: number;

    beforeEach(async () => {
      server = createServer();
      await new Promise<void>((resolve) =>
        server.listen(0, '127.0.0.1', resolve),
      );
      port = (server.address() as { port: number }).port;
    });

    afterEach(async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    });

    it('refuses to install rather than trusting whatever answers there', async () => {
      const world = createWorld();
      const result = await installer(world, [
        'install',
        '--archive',
        archiveFor(world, temp.dir, '1.1.0'),
        root,
        '--port',
        String(port),
      ]);

      expect(result.code).toBe(2);
      expect(result.json.error?.code).toBe('PORT_IN_USE');
      // The suggestion names a port that was free when it was checked.
      const free = Number(result.json.error?.details?.freePort);
      expect(free).toBeGreaterThan(port);
      expect(JSON.stringify(result.json.error)).toContain(`--port ${free}`);
      expect(existsSync(root)).toBe(false);
    });
  });

  it('gives up early on a process pm2 reports as errored, and leaves the installed files', async () => {
    const world = createWorld({ startStatus: 'errored', healthy: () => false });
    const result = await installer(world, [
      'install',
      '--archive',
      archiveFor(world, temp.dir, '1.1.0'),
      root,
      '--port',
      PORT,
      '--health-timeout',
      '120',
    ]);

    expect(result.code).toBe(1);
    expect(result.json.error?.code).toBe('START_FAILED');
    // It was this install's own process: the name was checked free beforehand.
    expect(world.pm2.calls).toContain('delete nocobase-shop');
    expect(existsSync(path.join(root, 'installer.json'))).toBe(true);
    expect(readlinkSync(path.join(root, 'current'))).toBe(RELEASE);
  });

  it('masks --set values in errors', async () => {
    const world = createWorld({
      cli: {
        'config set': {
          ok: false,
          error: { code: 'CONFIG_INVALID', message: 'bad key' },
        },
      },
    });
    const result = await installer(world, [
      'install',
      '--archive',
      archiveFor(world, temp.dir, '1.1.0'),
      root,
      '--port',
      PORT,
      '--set',
      'database.connections.main.password=s3cret',
    ]);

    expect(result.code).toBe(1);
    expect(result.json.error?.message).toContain(
      'database.connections.main.password=***',
    );
    expect(JSON.stringify(result.json)).not.toContain('s3cret');
  });

  it('cleans up after an interrupt during the migration', async () => {
    const world = createWorld({ hangOn: 'db apply' });
    const pending = installer(world, [
      'install',
      '--archive',
      archiveFor(world, temp.dir, '1.1.0'),
      root,
      '--port',
      PORT,
    ]);
    await new Promise((resolve) => setTimeout(resolve, 200));
    process.emit('SIGINT', 'SIGINT');
    const result = await pending;

    expect(result.code).toBe(1);
    expect(result.json.error?.code).toBe('INTERRUPTED');
    expect(existsSync(root)).toBe(false);
  });

  it('treats a regular file at the target as a precheck failure', async () => {
    writeFileSync(root, 'not a directory');
    const world = createWorld();
    const result = await installer(world, [
      'install',
      '--archive',
      archiveFor(world, temp.dir, '1.1.0'),
      root,
      '--port',
      PORT,
    ]);

    expect(result.code).toBe(2);
    expect(result.json.error?.code).toBe('TARGET_NOT_EMPTY');
  });
});

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
import { createWorld, freePort, hub, tempDir } from './harness.ts';

let temp: ReturnType<typeof tempDir>;
let root: string;

let PORT: string;

/** The first build a fresh fake world makes: 1.1.0, the latest published, built at its first build time. */
const RELEASE = path.join('releases', '1.1.0_20260101T000000Z', 'app');

beforeEach(async () => {
  temp = tempDir('app-installer-install-');
  root = path.join(temp.dir, 'hub');
  PORT = String(await freePort());
});

afterEach(() => {
  temp.remove();
});

describe('install', () => {
  it('builds, configures, migrates and starts the Hub, writing only the release under releases/', async () => {
    const world = createWorld();
    const result = await hub(world, [
      'install',
      '--template',
      'hub',
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
    expect(existsSync(path.join(root, '.build'))).toBe(false);
    const state = JSON.parse(
      readFileSync(path.join(root, 'installer.json'), 'utf8'),
    );
    expect(state).toMatchObject({
      appName: 'hub',
      basePath: '/hub',
      templateKind: 'hub',
      source: {
        kind: 'template',
        template: 'hub',
        package: '@nocobase/app-template-hub',
      },
      current: '1.1.0_20260101T000000Z',
      releases: [
        {
          id: '1.1.0_20260101T000000Z',
          version: '1.1.0',
          builtAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      name: 'nocobase-hub',
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
    const result = await hub(world, [
      'install',
      '--template',
      'hub',
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
        url: 'https://apps.example.com/hub/',
        origin: 'https://apps.example.com',
        host: '127.0.0.1',
        port: Number(PORT),
      },
    });
    expect(readlinkSync(path.join(root, 'current'))).toBe(RELEASE);
  });

  it('names a template build that predates the recorded build time by when it was built, at the template base path', async () => {
    const world = createWorld({ legacyManifest: true });
    const result = await hub(world, [
      'install',
      '--template',
      'hub',
      root,
      '--port',
      PORT,
    ]);

    expect(result.code).toBe(0);
    expect(result.json.result).toMatchObject({
      version: '1.1.0',
      basePath: '/hub',
    });
    expect(String(result.json.result?.releaseId)).toMatch(
      /^1\.1\.0_\d{8}T\d{6}Z$/u,
    );
  });

  it('names the pm2 process after the installation directory', async () => {
    const world = createWorld();
    const crm = path.join(temp.dir, 'crm');
    const result = await hub(world, [
      'install',
      '--template',
      'hub',
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
    const result = await hub(world, [
      'install',
      '--template',
      'hub',
      root,
      '--dir',
      `${root}/`,
      '--port',
      PORT,
    ]);

    expect(result.code).toBe(0);
    expect(result.json.result?.directory).toBe(root);
  });

  it('removes everything it wrote, parents included, when the build fails', async () => {
    const nested = path.join(temp.dir, 'new-parent', 'hub');
    const world = createWorld({ failOn: 'build --tar' });
    const result = await hub(world, [
      'install',
      '--template',
      'hub',
      nested,
      '--port',
      PORT,
    ]);

    expect(result.code).toBe(1);
    expect(result.json.error?.code).toBe('BUILD_FAILED');
    expect(existsSync(path.join(temp.dir, 'new-parent'))).toBe(false);
  });

  it('keeps the build directory under --keep-source even when the build fails', async () => {
    const world = createWorld({ failOn: 'build --tar' });
    const result = await hub(world, [
      'install',
      '--template',
      'hub',
      root,
      '--port',
      PORT,
      '--keep-source',
    ]);

    expect(result.code).toBe(1);
    expect(readdirSync(root)).toEqual(['.build']);
    expect(result.json.warnings.join('\n')).toContain(
      'The build directory was kept',
    );
  });

  it('refuses a pm2 name another process already uses, before writing anything', async () => {
    const world = createWorld();
    world.pm2.processes.set('nocobase-hub', {
      name: 'nocobase-hub',
      pid: 1,
      status: 'online',
      restarts: 0,
      cwd: '/srv/other-hub',
    });
    const result = await hub(world, [
      'install',
      '--template',
      'hub',
      root,
      '--port',
      PORT,
    ]);

    expect(result.code).toBe(2);
    expect(result.json.error?.code).toBe('PM2_NAME_IN_USE');
    expect(result.json.error?.message).toContain('/srv/other-hub');
    expect(existsSync(root)).toBe(false);
    expect(world.pm2.processes.get('nocobase-hub')?.cwd).toBe('/srv/other-hub');
  });

  it('refuses a pm2 older than the floor, before writing anything', async () => {
    const world = createWorld();
    // 4.2 is the last pm2 that runs ecosystem.config.cjs as an application.
    world.pm2.version = async () => '4.2.3';
    const result = await hub(world, [
      'install',
      '--template',
      'hub',
      root,
      '--port',
      PORT,
    ]);

    expect(result.code).toBe(2);
    expect(result.json.error?.code).toBe('PM2_UNSUPPORTED');
    expect(existsSync(root)).toBe(false);
  });

  it('reports where the installed Hub is reached and where it listens', async () => {
    const world = createWorld();
    await hub(world, [
      'install',
      '--template',
      'hub',
      root,
      '--port',
      PORT,
      '--origin',
      'https://apps.example.com',
    ]);
    const result = await hub(world, ['status', '--dir', root, '--offline']);

    expect(result.code).toBe(0);
    expect(result.json.result?.endpoints).toEqual({
      url: 'https://apps.example.com/hub/',
      origin: 'https://apps.example.com',
      host: '127.0.0.1',
      port: Number(PORT),
    });
  });

  it('checks --set-from-env variables before the build', async () => {
    const world = createWorld();
    const result = await hub(world, [
      'install',
      '--template',
      'hub',
      root,
      '--port',
      PORT,
      '--set-from-env',
      'database.connections.main.password=HUB_INSTALLER_TEST_UNSET',
    ]);

    expect(result.code).toBe(2);
    expect(result.json.error?.code).toBe('ENV_MISSING');
    expect(world.calls.some((call) => call.includes('create'))).toBe(false);
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
      const result = await hub(world, [
        'install',
        '--template',
        'hub',
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
    const result = await hub(world, [
      'install',
      '--template',
      'hub',
      root,
      '--port',
      PORT,
      '--health-timeout',
      '120',
    ]);

    expect(result.code).toBe(1);
    expect(result.json.error?.code).toBe('START_FAILED');
    // It was this install's own process: the name was checked free beforehand.
    expect(world.pm2.calls).toContain('delete nocobase-hub');
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
    const result = await hub(world, [
      'install',
      '--template',
      'hub',
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

  it('adds the dialect driver, pinned to the range the runtime accepts, before the build', async () => {
    const world = createWorld();
    const result = await hub(world, [
      'install',
      '--template',
      'hub',
      root,
      '--port',
      PORT,
      '--dialect',
      'postgres',
      '--no-start',
    ]);

    expect(result.code).toBe(0);
    const add = world.calls.findIndex((call) => call[1] === 'add');
    const build = world.calls.findIndex((call) => call[1] === 'build');
    expect(world.calls[add]).toEqual([
      'pnpm',
      'add',
      '@nocobase/db-postgres@^0.1.0',
    ]);
    expect(add).toBeLessThan(build);
    expect(world.pm2.calls).toEqual([]);
  });

  it('cleans up after an interrupt during the build', async () => {
    const world = createWorld({ hangOn: 'build --tar' });
    const pending = hub(world, [
      'install',
      '--template',
      'hub',
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
    const result = await hub(createWorld(), [
      'install',
      '--template',
      'hub',
      root,
      '--port',
      PORT,
    ]);

    expect(result.code).toBe(2);
    expect(result.json.error?.code).toBe('TARGET_NOT_EMPTY');
  });

  it('does not take a prototype property for a dist-tag', async () => {
    const result = await hub(createWorld(), [
      'install',
      root,
      '--port',
      PORT,
      '--template',
      'hub@constructor',
    ]);

    expect(result.code).toBe(2);
    expect(result.json.error?.code).toBe('VERSION_NOT_FOUND');
  });
});

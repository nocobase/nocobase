import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { create } from 'tar';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { parseAppSpec } from '../src/lib/app-source.ts';
import { CommandFailedError } from '../src/lib/run-command.ts';
import { readState } from '../src/lib/state.ts';
import { layoutOf } from '../src/lib/layout.ts';
import {
  archiveFor,
  createWorld,
  freePort,
  installer,
  tempDir,
} from './harness.ts';

let temp: ReturnType<typeof tempDir>;
let root: string;
let port: string;
beforeEach(async () => {
  temp = tempDir('installer-app-source-');
  root = path.join(temp.dir, 'example-app');
  port = String(await freePort());
});
afterEach(() => temp.remove());

function npmWorld() {
  const world = createWorld();
  const runtime = world.run;
  const npm = {
    version: '1.2.0',
    failBuild: false,
    mismatch: false,
    directories: [] as string[],
    calls: [] as string[][],
  };
  world.run = async (command, args, options) => {
    if (command !== 'npm' && command !== 'pnpm')
      return runtime(command, args, options);
    npm.calls.push([command, ...args]);
    const ok = (value = '') => ({ stdout: value, stderr: '' });
    if (command === 'npm' && args[0] === 'view') {
      return ok(
        JSON.stringify({ name: '@nocobase/example-app', version: npm.version }),
      );
    }
    const cwd = options!.cwd!;
    if (args[0] === '--version') return ok('11.7.0');
    if (args[0] === 'pack') {
      npm.directories.push(cwd);
      const pkg = path.join(cwd, 'fixture/package');
      mkdirSync(pkg, { recursive: true });
      writeFileSync(
        path.join(pkg, 'package.json'),
        JSON.stringify({
          name: '@nocobase/example-app',
          version: npm.version,
          nocobase: { templateKind: 'app' },
          scripts: { build: 'nocobase build' },
        }),
      );
      create(
        {
          cwd: path.dirname(pkg),
          file: path.join(cwd, 'app.tgz'),
          sync: true,
          gzip: true,
        },
        ['package'],
      );
      return ok(JSON.stringify([{ filename: 'app.tgz' }]));
    }
    if (args[0] === 'install') return ok();
    if (args[0] === 'build') {
      if (npm.failBuild)
        throw new CommandFailedError('pnpm build', 1, '', 'broken source');
      const archive = archiveFor(world, temp.dir, npm.version, {
        name: npm.mismatch ? 'other-app' : '@nocobase/example-app',
        relocatable: true,
      });
      mkdirSync(path.join(cwd, 'storage/exports'), { recursive: true });
      writeFileSync(
        path.join(cwd, 'storage/exports/dist.tar.gz'),
        readFileSync(archive),
      );
      return ok();
    }
    throw new Error(`Unexpected ${command} ${args.join(' ')}`);
  };
  return { world, npm };
}

it.each(['example-app', '@nocobase/example-app'])(
  'resolves %s to the official package',
  (spec) => {
    expect(parseAppSpec(spec)).toEqual({
      package: '@nocobase/example-app',
      selector: 'latest',
    });
    expect(parseAppSpec(`${spec}@beta`)).toEqual({
      package: '@nocobase/example-app',
      selector: 'beta',
    });
  },
);
it('accepts another publisher and rejects paths, URLs and empty selectors', () => {
  expect(parseAppSpec('@acme/crm@1.2.0')).toEqual({
    package: '@acme/crm',
    selector: '1.2.0',
  });
  for (const spec of [
    '../example-app',
    'file:example-app',
    'https://example.com/app.tgz',
    'example-app@',
    'example-app@^1',
    '@nocobase/example-app@latest\n',
  ])
    expect(() => parseAppSpec(spec)).toThrow();
});
it('rejects conflicting sources before downloading or writing', async () => {
  const { world, npm } = npmWorld();
  const result = await installer(world, [
    'install',
    root,
    '--app',
    'example-app',
    '--archive',
    'archive.tgz',
  ]);
  expect(result.json.error?.code).toBe('INVALID_USAGE');
  expect(npm.calls).toHaveLength(0);
  expect(existsSync(root)).toBe(false);
});
it.each(['example-app', '@nocobase/example-app'])(
  'installs %s with its published identity and discards the build tree',
  async (spec) => {
    const { world, npm } = npmWorld();
    const result = await installer(world, [
      'install',
      root,
      '--app',
      spec,
      '--port',
      port,
      '--registry',
      'https://registry.example.test',
    ]);
    expect(result.code).toBe(0);
    const state = await readState(layoutOf(root));
    expect(state).toMatchObject({
      appName: '@nocobase/example-app',
      source: { kind: 'app', package: '@nocobase/example-app' },
      registry: 'https://registry.example.test',
    });
    expect(state.releases[0].version).toBe(npm.version);
    expect(npm.calls[0]).toEqual([
      'npm',
      'view',
      '@nocobase/example-app@latest',
      'name',
      'version',
      '--json',
      '--registry=https://registry.example.test',
      '--@nocobase:registry=https://registry.example.test',
    ]);
    expect(npm.directories.every((directory) => !existsSync(directory))).toBe(
      true,
    );
  },
);
it('cleans a failed install and rejects a build that changes application identity', async () => {
  const { world, npm } = npmWorld();
  npm.failBuild = true;
  const args = ['install', root, '--app', 'example-app', '--port', port];
  expect((await installer(world, args)).json.error?.code).toBe(
    'APP_BUILD_FAILED',
  );
  expect(existsSync(root)).toBe(false);
  npm.failBuild = false;
  npm.mismatch = true;
  expect((await installer(world, args)).json.error?.code).toBe('APP_INVALID');
  expect(existsSync(root)).toBe(false);
  expect(npm.directories.every((directory) => !existsSync(directory))).toBe(
    true,
  );
});
it('upgrades, rebuilds and rolls back an npm application while preserving its data', async () => {
  const { world, npm } = npmWorld();
  expect(
    (
      await installer(world, [
        'install',
        root,
        '--app',
        'example-app',
        '--port',
        port,
      ])
    ).code,
  ).toBe(0);
  const original = await readState(layoutOf(root));
  const upload = path.join(root, 'storage', 'test-upload.txt');
  writeFileSync(upload, 'persistent test upload');
  expect((await installer(world, ['upgrade', '--dir', root])).json.status).toBe(
    'success-noop',
  );
  expect(npm.directories).toHaveLength(1);
  npm.version = '1.3.0';
  const preview = await installer(world, [
    'upgrade',
    '--dir',
    root,
    '--to',
    'beta',
  ]);
  expect(preview.json.error?.code).toBe('CONFIRMATION_REQUIRED');
  expect((await readState(layoutOf(root))).current).toBe(original.current);
  const upgraded = await installer(world, [
    'upgrade',
    '--dir',
    root,
    '--to',
    'beta',
    '--yes',
  ]);
  expect(upgraded.code).toBe(0);
  expect(upgraded.json.result).toMatchObject({
    fromVersion: '1.2.0',
    toVersion: '1.3.0',
  });
  const current = (await readState(layoutOf(root))).current;
  expect(
    (await installer(world, ['upgrade', '--dir', root, '--rebuild', '--yes']))
      .code,
  ).toBe(0);
  expect((await readState(layoutOf(root))).current).not.toBe(current);
  expect(
    (await installer(world, ['rollback', '--dir', root, '--yes'])).code,
  ).toBe(0);
  expect((await readState(layoutOf(root))).current).toBe(current);
  expect(readFileSync(upload, 'utf8')).toBe('persistent test upload');
  const stops = world.pm2.calls.filter((call) =>
    call.startsWith('stop'),
  ).length;
  npm.failBuild = true;
  npm.version = '1.4.0';
  expect(
    (await installer(world, ['upgrade', '--dir', root, '--yes'])).json.error
      ?.code,
  ).toBe('APP_BUILD_FAILED');
  expect((await readState(layoutOf(root))).current).toBe(current);
  expect(
    world.pm2.calls.filter((call) => call.startsWith('stop')),
  ).toHaveLength(stops);
  npm.version = '1.1.0';
  expect(
    (await installer(world, ['upgrade', '--dir', root, '--yes'])).json.error
      ?.code,
  ).toBe('DOWNGRADE');
  expect(
    (await installer(world, ['upgrade', '--dir', root, '--archive', 'x'])).json
      .error?.code,
  ).toBe('INVALID_USAGE');
});

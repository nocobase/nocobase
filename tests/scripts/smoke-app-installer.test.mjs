import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  databaseFile,
  markLastUpgradeMigrated,
  parseArgs,
  processCommandLine,
  releaseIdOf,
  repackArchive,
} from '../../scripts/smoke-app-installer.mjs';

test('the smoke script takes a root, an archive, a port and the installer command after --', () => {
  const defaults = parseArgs(['--root', '/tmp/crm', '--archive', 'crm.tar.gz']);
  assert.equal(defaults.root, path.resolve('/tmp/crm'));
  assert.equal(defaults.archive, path.resolve('crm.tar.gz'));
  assert.equal(defaults.port, 13000);
  assert.deepEqual(defaults.installer, [
    'node',
    'packages/tools/app-installer/bin/run.js',
  ]);

  const custom = parseArgs([
    '--root',
    '/tmp/crm',
    '--archive',
    'crm.tar.gz',
    '--port',
    '13200',
    '--',
    'npx',
    '--yes',
    '@nocobase/app-installer@0.1.0',
  ]);
  assert.equal(custom.port, 13200);
  assert.deepEqual(custom.installer, [
    'npx',
    '--yes',
    '@nocobase/app-installer@0.1.0',
  ]);

  for (const args of [
    [],
    ['--root', '/tmp/crm'],
    ['--archive', 'crm.tar.gz'],
    ['--source', 'archive', '--root', '/tmp/crm', '--archive', 'crm.tar.gz'],
    ['--root', '/tmp/crm', '--archive', 'crm.tar.gz', '--port', 'x'],
    ['--root', '/tmp/crm', '--archive', 'crm.tar.gz', '--other', 'y'],
    ['--root', '/tmp/crm', '--archive', 'crm.tar.gz', '--'],
  ])
    assert.throws(() => parseArgs(args));
});

test('release ids are formed the way app-installer forms them', () => {
  assert.equal(
    releaseIdOf('1.0.0', '2026-09-27T00:55:00.123Z'),
    '1.0.0_20260927T005500Z',
  );
});

const buildTarget = { platform: 'linux', arch: 'x64', nodeMajor: 24 };

/** An installation with one release, `installed`, current, whose server entry names it. */
function fakeInstallation(root, installed) {
  const id = releaseIdOf(installed, '2026-09-26T00:00:00.000Z');
  const release = path.join(root, 'releases', id, 'app');
  fs.mkdirSync(path.join(release, 'dist', 'server'), { recursive: true });
  fs.writeFileSync(
    path.join(release, 'dist', 'server', 'standalone.js'),
    `export function startServer() {} // ${installed}\n`,
  );
  fs.symlinkSync(path.join('releases', id, 'app'), path.join(root, 'current'));
  fs.writeFileSync(
    path.join(root, 'installer.json'),
    JSON.stringify({
      schemaVersion: 1,
      name: 'nocobase-crm',
      current: id,
      releases: [
        {
          id,
          version: installed,
          builtAt: '2026-09-26T00:00:00.000Z',
          installedAt: '2026-09-26T00:00:00.000Z',
          buildTarget,
        },
      ],
      history: [
        { action: 'install', to: id, at: 'a' },
        { action: 'upgrade', from: 'x', to: id, at: 'b', migrations: 0 },
        { action: 'rollback', from: id, to: 'x', at: 'c' },
      ],
    }),
  );
  return id;
}

const readState = (root) =>
  JSON.parse(fs.readFileSync(path.join(root, 'installer.json'), 'utf8'));

test('marking the last upgrade as migrated touches only that entry', () => {
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), 'installer-smoke-migrated-'),
  );
  try {
    fakeInstallation(root, '1.0.0');
    markLastUpgradeMigrated(root);
    assert.deepEqual(
      readState(root).history.map((entry) => entry.migrations),
      [undefined, 1, undefined],
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a later build is a repacked archive with a new build time, broken on request', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'installer-smoke-repack-'));
  try {
    const tree = path.join(dir, 'tree');
    fs.mkdirSync(path.join(tree, 'dist', 'server'), { recursive: true });
    fs.writeFileSync(path.join(tree, 'config.example.yml'), 'users: {}\n');
    fs.writeFileSync(
      path.join(tree, 'dist', 'server', 'standalone.js'),
      'export {};\n',
    );
    fs.writeFileSync(
      path.join(tree, 'dist', 'package.json'),
      JSON.stringify({
        name: 'crm',
        version: '0.1.0',
        nocobase: { basePath: '/main', builtAt: '2026-01-01T00:00:00.000Z' },
      }),
    );
    const source = path.join(dir, 'source.tar.gz');
    assert.equal(
      spawnSync('tar', [
        '-czf',
        source,
        '-C',
        tree,
        'config.example.yml',
        'dist',
      ]).status,
      0,
    );

    const target = path.join(dir, 'broken.tar.gz');
    const id = repackArchive(source, target, {
      builtAt: '2026-02-01T00:00:00.000Z',
      broken: true,
    });
    assert.equal(id, '0.1.0_20260201T000000Z');

    const out = path.join(dir, 'out');
    fs.mkdirSync(out);
    assert.equal(spawnSync('tar', ['-xzf', target, '-C', out]).status, 0);
    const manifest = JSON.parse(
      fs.readFileSync(path.join(out, 'dist', 'package.json'), 'utf8'),
    );
    assert.deepEqual(manifest.nocobase, {
      basePath: '/main',
      builtAt: '2026-02-01T00:00:00.000Z',
    });
    assert.match(
      fs.readFileSync(
        path.join(out, 'dist', 'server', 'standalone.js'),
        'utf8',
      ),
      /^throw new Error/,
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the database is the one file an application has', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'installer-smoke-db-'));
  try {
    fs.mkdirSync(path.join(root, 'storage', 'logs'), { recursive: true });
    fs.writeFileSync(path.join(root, 'storage', 'database.sqlite'), '');
    fs.writeFileSync(path.join(root, 'storage', 'logs', 'app.log'), '');
    assert.equal(
      databaseFile(root),
      path.join(root, 'storage', 'database.sqlite'),
    );

    fs.writeFileSync(path.join(root, 'storage', 'other.sqlite'), '');
    assert.throws(() => databaseFile(root), /found 2/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a running process is identified by its command line', async (t) => {
  const child = spawn(
    process.execPath,
    ['-e', 'setTimeout(() => {}, 30000)', 'smoke-marker-argument'],
    { stdio: 'ignore' },
  );
  t.after(() => child.kill());
  await new Promise((resolve) => child.once('spawn', resolve));
  assert.match(processCommandLine(child.pid), /smoke-marker-argument/);
});

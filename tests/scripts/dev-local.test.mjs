import assert from 'node:assert/strict';
import {
  mkdtemp,
  mkdir,
  readFile,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { parse } from 'yaml';
import { test } from 'node:test';
import {
  stageTemplate,
  stageWorkspace,
  syncTemplate,
} from '../../scripts/dev-local.mjs';

const root = path.resolve(import.meta.dirname, '../..');

test('refresh preserves runtime data and local edits and preflights conflicts', async (t) => {
  const tmp = await mkdtemp(path.join(tmpdir(), 'local-refresh-test-'));
  t.after(() => rm(tmp, { recursive: true, force: true }));
  const source = path.join(tmp, 'template');
  const app = path.join(tmp, 'app');
  await mkdir(source);
  await writeFile(path.join(source, 'page.ts'), 'v1');
  await writeFile(path.join(source, 'gone.ts'), 'old');
  // Simulate interruption after the first template file was copied.
  await mkdir(app);
  await writeFile(path.join(app, '.local-template-hashes.json'), 'null');
  await writeFile(path.join(app, 'page.ts'), 'v1');
  await syncTemplate(source, app, false);
  assert.equal(await readFile(path.join(app, 'gone.ts'), 'utf8'), 'old');
  await writeFile(path.join(app, 'config.yml'), 'my config');
  await writeFile(path.join(app, 'page.ts'), 'my edit');
  await writeFile(path.join(source, 'next.ts'), 'new file');
  await rm(path.join(source, 'gone.ts'));
  assert.equal((await syncTemplate(source, app, false)).stale, true);
  await writeFile(path.join(source, 'page.ts'), 'v2');
  await assert.rejects(
    syncTemplate(source, app, true),
    /conflict[\s\S]*page.ts/,
  );
  assert.equal(await readFile(path.join(app, 'gone.ts'), 'utf8'), 'old');
  await assert.rejects(readFile(path.join(app, 'next.ts')), { code: 'ENOENT' });
  await writeFile(path.join(app, 'page.ts'), 'v2');
  await syncTemplate(source, app, true);
  assert.equal(
    await readFile(path.join(app, 'config.yml'), 'utf8'),
    'my config',
  );
  assert.equal(await readFile(path.join(app, 'next.ts'), 'utf8'), 'new file');
  await assert.rejects(readFile(path.join(app, 'gone.ts')), { code: 'ENOENT' });
});

test('stage the current checkout, including new source files and excluding local state', async (t) => {
  const tmp = await mkdtemp(path.join(tmpdir(), 'stage-default-'));
  t.after(() => rm(tmp, { recursive: true, force: true }));
  const source = path.join(tmp, 'template');
  const stage = path.join(tmp, 'staged');
  await mkdir(path.join(source, 'client'), { recursive: true });
  execFileSync('git', ['init', '--quiet'], { cwd: tmp });
  await writeFile(
    path.join(source, '.gitignore'),
    'config.yml\n.env*\nstorage/\ndist/\nnode_modules/\n',
  );
  await writeFile(
    path.join(source, 'package.json'),
    JSON.stringify({
      name: '@nocobase/app-template-default',
      dependencies: {},
      devDependencies: { '@nocobase/db-sqlite': 'workspace:*' },
    }),
  );
  await writeFile(
    path.join(source, 'client/styles.css'),
    "@import 'tailwindcss';",
  );
  await writeFile(
    path.join(source, 'client/runtime.ts'),
    '@nocobase/app-template-default',
  );
  await writeFile(
    path.join(source, 'client/service-provider.ts'),
    '@nocobase/app-template-default/client',
  );
  await writeFile(path.join(source, 'obsolete.ts'), '');
  execFileSync('git', ['add', '.'], { cwd: tmp });
  await rm(path.join(source, 'obsolete.ts'));
  await writeFile(
    path.join(source, 'client/runtime.ts'),
    'edited @nocobase/app-template-default',
  );
  await writeFile(path.join(source, 'client/new.ts'), 'new source');
  const omitted = [
    'config.yml',
    '.env.local',
    'experiment.sqlite-wal',
    'storage/database.sqlite',
    'dist/asset',
    'node_modules/test',
  ];
  for (const file of omitted) {
    await mkdir(path.dirname(path.join(source, file)), { recursive: true });
    await writeFile(path.join(source, file), 'local data');
  }
  execFileSync('git', ['add', '-f', 'config.yml'], { cwd: source });
  await stageTemplate(source, stage);
  assert.equal(
    await readFile(path.join(stage, 'client/runtime.ts'), 'utf8'),
    'edited @nocobase/app-template-default-local',
  );
  assert.equal(
    await readFile(path.join(stage, 'client/new.ts'), 'utf8'),
    'new source',
  );
  for (const file of [...omitted, 'obsolete.ts'])
    await assert.rejects(readFile(path.join(stage, file)), { code: 'ENOENT' });
});

test('local Default links template dependencies and isolates pnpm installs, additions and removals', async (t) => {
  const tmp = await mkdtemp(path.join(tmpdir(), 'local-default-lock-'));
  const stage = path.join(tmp, 'local/default');
  t.after(() => rm(tmp, { recursive: true, force: true }));
  const source = 'packages/templates/app-template-default';
  await stageTemplate(path.join(root, source), stage);
  const manifest = JSON.parse(
    await readFile(path.join(stage, 'package.json'), 'utf8'),
  );
  assert.equal(manifest.name, '@nocobase/app-template-default-local');
  assert.equal(manifest.private, true);
  assert.equal(manifest.publishConfig, undefined);
  assert.equal(manifest.dependencies['@nocobase/db-sqlite'], 'workspace:*');
  assert.match(
    await readFile(path.join(stage, 'client/styles.css'), 'utf8'),
    /@import 'tailwindcss' source\('\.'\);/u,
  );
  await stageWorkspace(stage, stage, path.join(root, source));
  const workspaceFile = 'pnpm-workspace.yaml';
  const outer = await readFile(path.join(root, workspaceFile), 'utf8');
  assert.ok(
    !parse(outer).packages.some((glob) =>
      path.matchesGlob('local/default', glob),
    ),
  );
  assert.ok(
    !Object.hasOwn(
      parse(await readFile(path.join(root, 'pnpm-lock.yaml'), 'utf8'))
        .importers,
      'local/default',
    ),
  );
  const { packageManager } = JSON.parse(
    await readFile(path.join(root, 'package.json'), 'utf8'),
  );
  await writeFile(
    path.join(tmp, 'package.json'),
    JSON.stringify({ name: 'fixture-root', private: true, packageManager }),
  );
  await writeFile(path.join(tmp, workspaceFile), 'packages: ["packages/*"]\n');
  const pnpm = (cwd, ...args) =>
    execFileSync('pnpm', args, { cwd, stdio: 'pipe' });
  pnpm(tmp, 'install', '--offline', '--lockfile-only', '--no-frozen-lockfile');
  const outerLock = await readFile(path.join(tmp, 'pnpm-lock.yaml'), 'utf8');
  pnpm(
    stage,
    'install',
    '--offline',
    '--ignore-scripts',
    '--no-frozen-lockfile',
  );
  const localLock = () => readFile(path.join(stage, 'pnpm-lock.yaml'), 'utf8');
  assert.deepEqual(Object.keys(parse(await localLock()).importers), ['.']);
  for (const [name, owner] of [
    ['react', path.join(root, source)],
    ['@nocobase/db-sqlite', path.join(root, source)],
  ]) {
    assert.equal(
      await realpath(path.join(stage, 'node_modules', name)),
      await realpath(path.join(owner, 'node_modules', name)),
    );
  }
  const extra = path.join(tmp, 'experimental');
  await mkdir(extra);
  await writeFile(
    path.join(extra, 'package.json'),
    JSON.stringify({ name: 'local-experiment', version: '1.0.0' }),
  );
  pnpm(
    stage,
    'add',
    '--offline',
    '--ignore-scripts',
    'local-experiment@link:../../experimental',
  );
  assert.ok(
    parse(await localLock()).importers['.'].dependencies['local-experiment'],
  );
  pnpm(stage, 'remove', 'local-experiment');
  assert.ok(
    !parse(await localLock()).importers['.'].dependencies['local-experiment'],
  );
  pnpm(tmp, 'install', '--offline', '--frozen-lockfile');
  assert.equal(
    await readFile(path.join(tmp, 'pnpm-lock.yaml'), 'utf8'),
    outerLock,
  );
});

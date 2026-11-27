import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { parse } from 'yaml';
import { test } from 'node:test';
import { stageTemplate, syncTemplate } from '../../scripts/dev-local.mjs';

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

test('the generated Default manifest uses the template workspace packages and locked resolutions', async (t) => {
  const stage = await mkdtemp(path.join(tmpdir(), 'local-default-lock-'));
  t.after(() => rm(stage, { recursive: true, force: true }));
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
  const { importers } = parse(
    await readFile(path.join(root, 'pnpm-lock.yaml'), 'utf8'),
  );
  const local = 'local/default';
  const original = {
    ...importers[source].dependencies,
    ...importers[source].devDependencies,
  };
  for (const section of ['dependencies', 'devDependencies']) {
    const entries = importers[local][section];
    assert.deepEqual(
      Object.fromEntries(
        Object.entries(entries).map(([name, entry]) => [name, entry.specifier]),
      ),
      manifest[section],
    );
    for (const [name, entry] of Object.entries(entries)) {
      if (entry.version.startsWith('link:')) {
        assert.equal(
          path.resolve(root, local, entry.version.slice(5)),
          path.resolve(root, source, original[name].version.slice(5)),
          name,
        );
      } else assert.equal(entry.version, original[name].version, name);
    }
  }
});

test('a non-frozen lockfile update preserves the absent app and follows template dependency changes', async (t) => {
  const tmp = await mkdtemp(path.join(tmpdir(), 'default-lock-update-'));
  t.after(() => rm(tmp, { recursive: true, force: true }));
  const tpl = 'packages/templates/app-template-default';
  const driver = 'packages/libs/sqlite';
  const local = 'local/default';
  await mkdir(path.join(tmp, tpl), { recursive: true });
  await mkdir(path.join(tmp, driver), { recursive: true });
  await writeFile(
    path.join(tmp, '.pnpmfile.cjs'),
    await readFile(path.join(root, '.pnpmfile.cjs')),
  );
  const { packageManager } = JSON.parse(
    await readFile(path.join(root, 'package.json'), 'utf8'),
  );
  await writeFile(
    path.join(tmp, 'package.json'),
    JSON.stringify({ name: 'test-root', private: true, packageManager }),
  );
  await writeFile(
    path.join(tmp, 'pnpm-workspace.yaml'),
    'packages: ["packages/*/*", "local/default"]\n',
  );
  const name = '@nocobase/db-sqlite';
  await writeFile(
    path.join(tmp, driver, 'package.json'),
    JSON.stringify({ name, version: '1.0.0' }),
  );
  const tplManifest = {
    name: 'default',
    devDependencies: { [name]: 'workspace:*' },
  };
  await writeFile(
    path.join(tmp, tpl, 'package.json'),
    JSON.stringify(tplManifest),
  );
  const install = () =>
    execFileSync(
      'pnpm',
      ['install', '--offline', '--lockfile-only', '--no-frozen-lockfile'],
      { cwd: tmp, stdio: 'pipe' },
    );
  const importer = async () =>
    parse(await readFile(path.join(tmp, 'pnpm-lock.yaml'), 'utf8')).importers[
      local
    ];
  install();
  assert.deepEqual((await importer()).dependencies[name], {
    specifier: 'workspace:*',
    version: 'link:../../packages/libs/sqlite',
  });
  await mkdir(path.join(tmp, local), { recursive: true });
  await writeFile(
    path.join(tmp, local, 'package.json'),
    JSON.stringify({
      name: 'default-local',
      private: true,
      devDependencies: { [name]: 'workspace:^' },
    }),
  );
  install();
  assert.equal(
    (await importer()).devDependencies[name].specifier,
    'workspace:^',
  );
  await rm(path.join(tmp, local), { recursive: true });
  await writeFile(
    path.join(tmp, tpl, 'package.json'),
    JSON.stringify({
      ...tplManifest,
      devDependencies: { [name]: 'workspace:~' },
    }),
  );
  install();
  assert.equal((await importer()).dependencies[name].specifier, 'workspace:~');
});

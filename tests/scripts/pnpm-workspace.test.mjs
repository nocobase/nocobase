import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(import.meta.dirname, '../..');

test('does not let pnpm mutate dependencies before dry-run scripts start', async () => {
  const workspace = await readFile(
    path.join(repoRoot, 'pnpm-workspace.yaml'),
    'utf8',
  );

  assert.match(workspace, /^verifyDepsBeforeRun: false$/mu);
});

test('keeps commercial driver optional peers in manifests but excludes them from OSS installation', async () => {
  const { default: pnpmfile } = await import('../../.pnpmfile.cjs');
  for (const location of [
    'app/app-server',
    'libs/db-testing',
    'tools/app-testing',
  ]) {
    const manifest = JSON.parse(
      await readFile(
        path.join(repoRoot, 'packages', location, 'package.json'),
        'utf8',
      ),
    );
    const resolved = pnpmfile.hooks.readPackage(structuredClone(manifest));
    for (const dialect of ['kingbase', 'dameng', 'oceanbase']) {
      const name = `@nocobase/db-${dialect}`;
      assert.ok(manifest.peerDependencies[name]);
      assert.ok(!manifest.peerDependencies[name].startsWith('workspace:'));
      assert.equal(manifest.peerDependenciesMeta[name].optional, true);
      assert.equal(resolved.peerDependencies[name], undefined);
      assert.equal(manifest.dependencies?.[name], undefined);
      assert.equal(manifest.devDependencies?.[name], undefined);
    }
    assert.equal(
      resolved.peerDependencies['@nocobase/db'],
      manifest.peerDependencies['@nocobase/db'],
    );
  }
  const required = {
    name: '@nocobase/app-server',
    peerDependencies: { '@nocobase/db-kingbase': '^1.0.0' },
  };
  assert.deepEqual(
    pnpmfile.hooks.readPackage(structuredClone(required)),
    required,
  );
});

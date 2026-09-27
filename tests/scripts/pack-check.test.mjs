import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  archiveNameForPackage,
  discoverPackages,
  findShadowedSourceDirectories,
  findUnresolvedProtocols,
  hasTypeEntrypoints,
  validatePackedManifest,
  validatePackageManifest,
} from '../../scripts/pack-check.mjs';

const repoRoot = path.resolve(import.meta.dirname, '../..');

test('publishes the default template as source instead of a runtime library', async () => {
  const manifest = JSON.parse(
    await readFile(
      path.join(
        repoRoot,
        'packages/templates/app-template-default/package.json',
      ),
      'utf8',
    ),
  );

  assert.equal(manifest.exports, undefined);
  assert.ok(manifest.files.includes('server'));
  // The database directory ships as source too. It is named by part rather than whole so that the
  // Collection artifacts `collections generate` writes under database/<connection>/collections/ stay
  // out of the tarball; template-framework-alignment pins which parts.
  assert.ok(manifest.files.some((entry) => entry.startsWith('database/')));
  assert.ok(!manifest.files.includes('dist'));
});

test('derives stable archive names from scoped package names', () => {
  assert.equal(
    archiveNameForPackage('@nocobase/app-client'),
    'nocobase-app-client.tgz',
  );
});

test('discovers packages from packages directories in package-name order', async (t) => {
  const repoRoot = await createTestRepo(t);
  await createPackage(repoRoot, 'tools/zeta', '@nocobase/zeta');
  await createPackage(repoRoot, 'libs/alpha', '@nocobase/alpha');

  const packages = await discoverPackages(repoRoot);

  assert.deepEqual(
    packages.map(({ manifest }) => manifest.name),
    ['@nocobase/alpha', '@nocobase/zeta'],
  );
});

test('rejects incomplete publication metadata', () => {
  assert.throws(
    () =>
      validatePackageManifest(
        {
          name: '@nocobase/incomplete',
          private: true,
          version: '0.0.1',
        },
        '/repo/packages/libs/incomplete',
      ),
    /must not be private[\s\S]*publishConfig\.access[\s\S]*files/u,
  );
});

test('rejects a compiled package that also publishes its runtime-resolved sources', () => {
  assert.deepEqual(
    findShadowedSourceDirectories({ files: ['dist', 'database', 'server'] }),
    ['database', 'server'],
  );
  // A template publishes its sources for the user to read and edit, and has no `dist` for them to shadow.
  assert.deepEqual(
    findShadowedSourceDirectories({ files: ['server', 'database'] }),
    [],
  );
  assert.throws(
    () =>
      validatePackageManifest(
        {
          files: ['dist', 'database'],
          name: '@nocobase/app-plugin-shadowed',
          publishConfig: { access: 'public' },
          version: '0.0.1',
        },
        '/repo/packages/plugins/app-plugin-shadowed',
      ),
    /must not publish the "database" source directory beside dist/u,
  );
});

test('requires every discovered package to have a changelog', async (t) => {
  const repoRoot = await createTestRepo(t);
  await createPackage(repoRoot, 'libs/missing-changelog', '@nocobase/missing', {
    changelog: false,
  });

  await assert.rejects(
    discoverPackages(repoRoot),
    /must include CHANGELOG\.md/u,
  );
});

test('validates changelog package names', async (t) => {
  const repoRoot = await createTestRepo(t);
  await createPackage(repoRoot, 'libs/invalid-changelog', '@nocobase/invalid', {
    changelogContents: '# @nocobase/wrong\n',
  });

  await assert.rejects(
    discoverPackages(repoRoot),
    /CHANGELOG\.md must start with/u,
  );
});

test('requires the current released version in the changelog', async (t) => {
  const repoRoot = await createTestRepo(t);
  await createPackage(repoRoot, 'libs/stale-changelog', '@nocobase/stale', {
    changelogContents: '# @nocobase/stale\n\n## 0.0.0\n',
  });

  await assert.rejects(
    discoverPackages(repoRoot),
    /CHANGELOG\.md must include version 0\.0\.1/u,
  );
});

test('finds unresolved workspace and catalog protocols with field paths', () => {
  assert.deepEqual(
    findUnresolvedProtocols({
      dependencies: {
        '@nocobase/app-client': 'workspace:^',
        react: '^19.0.0',
      },
      devDependencies: {
        typescript: 'catalog:',
      },
    }),
    [
      {
        field: 'dependencies.@nocobase/app-client',
        value: 'workspace:^',
      },
      {
        field: 'devDependencies.typescript',
        value: 'catalog:',
      },
    ],
  );
});

test('detects type entrypoints in top-level and exported declarations', () => {
  assert.equal(hasTypeEntrypoints({ types: './dist/index.d.ts' }), true);
  assert.equal(
    hasTypeEntrypoints({
      exports: {
        './client': { types: './dist/client.d.ts' },
      },
    }),
    true,
  );
  assert.equal(
    hasTypeEntrypoints({ exports: { '.': './dist/index.js' } }),
    false,
  );
});

test('validates packed identity and resolved protocols', () => {
  const source = { name: '@nocobase/example', version: '1.0.0' };

  assert.doesNotThrow(() =>
    validatePackedManifest(source, {
      dependencies: { react: '^19.0.0' },
      ...source,
    }),
  );
  assert.throws(
    () =>
      validatePackedManifest(source, {
        dependencies: { '@nocobase/sdk': 'workspace:^' },
        ...source,
      }),
    /dependencies\.@nocobase\/sdk: workspace:\^/u,
  );
  assert.throws(
    () =>
      validatePackedManifest(source, {
        name: source.name,
        version: '2.0.0',
      }),
    /Packed identity mismatch/u,
  );
});

async function createTestRepo(t) {
  const repoRoot = await mkdtemp(
    path.join(tmpdir(), 'nocobase-pack-check-test-'),
  );
  await mkdir(path.join(repoRoot, 'packages'));
  t.after(() => rm(repoRoot, { force: true, recursive: true }));
  return repoRoot;
}

// `relativeDirectory` is a `<category>/<package>` path, matching the two-level layout of `packages/`.
async function createPackage(
  repoRoot,
  relativeDirectory,
  packageName,
  { changelog = true, changelogContents } = {},
) {
  const directory = path.join(repoRoot, 'packages', relativeDirectory);
  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(directory, 'package.json'),
    `${JSON.stringify(
      {
        files: ['dist'],
        name: packageName,
        publishConfig: { access: 'public' },
        version: '0.0.1',
      },
      null,
      2,
    )}\n`,
  );
  if (changelog) {
    await writeFile(
      path.join(directory, 'CHANGELOG.md'),
      changelogContents ?? `# ${packageName}\n\n## 0.0.1\n`,
    );
  }
}

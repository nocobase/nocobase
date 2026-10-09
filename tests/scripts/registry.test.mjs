import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  buildRegistry,
  materializeRegistry,
  parseRegistryArgs,
  resolveRegistryOwner,
} from '../../scripts/registry.mjs';

const repoRoot = path.resolve(import.meta.dirname, '../..');
const exampleOwnerRoot = path.join(
  repoRoot,
  'packages/examples/app-plugin-registry-example',
);

test('parses package-scoped Registry commands', () => {
  assert.deepEqual(
    parseRegistryArgs([
      'materialize',
      '--package',
      '@nocobase/app-plugin-authentication',
      '--item',
      'auth-forms',
      '--output-root',
      'packages/templates/app-template-default',
    ]),
    {
      action: 'materialize',
      all: false,
      help: false,
      item: 'auth-forms',
      outputRoot: 'packages/templates/app-template-default',
      package: '@nocobase/app-plugin-authentication',
    },
  );
});

test('resolves a Registry owner by package name', () => {
  assert.equal(
    resolveRegistryOwner('@nocobase/app-plugin-registry-example', { repoRoot }),
    exampleOwnerRoot,
  );
});

test('builds and materializes the plugin Registry example', async (t) => {
  const buildRoot = await mkdtemp(
    path.join(tmpdir(), 'nocobase-registry-example-build-'),
  );
  const applicationRoot = await mkdtemp(
    path.join(tmpdir(), 'nocobase-registry-example-app-'),
  );
  t.after(() => rm(buildRoot, { force: true, recursive: true }));
  t.after(() => rm(applicationRoot, { force: true, recursive: true }));

  const buildResult = buildRegistry({
    ownerRoot: exampleOwnerRoot,
    outputDirectory: buildRoot,
    repoRoot,
  });
  const pageItem = JSON.parse(
    fs.readFileSync(path.join(buildRoot, 'page-ui.json'), 'utf8'),
  );

  assert.deepEqual(buildResult.items, [
    { files: 3, name: 'page-ui' },
    { files: 3, name: 'component-ui' },
    { files: 4, name: 'provider-ui' },
  ]);
  assert.deepEqual(pageItem.registryDependencies, ['button']);
  assert.equal(pageItem.files.length, 3);
  assert.equal(
    JSON.parse(
      fs.readFileSync(path.join(buildRoot, 'component-ui.json'), 'utf8'),
    ).files.length,
    3,
  );
  assert.equal(
    JSON.parse(
      fs.readFileSync(path.join(buildRoot, 'provider-ui.json'), 'utf8'),
    ).files.length,
    4,
  );

  const materializeResult = materializeRegistry({
    outputRoot: applicationRoot,
    ownerRoot: exampleOwnerRoot,
    repoRoot,
  });
  const installedRoot = path.join(
    applicationRoot,
    'client/extensions/nocobase-registry-example-page-ui',
  );

  assert.deepEqual(materializeResult.materialized, [
    {
      files: 3,
      target: 'client/extensions/nocobase-registry-example-page-ui',
    },
    {
      files: 3,
      target: 'client/extensions/nocobase-registry-example-component-ui',
    },
    {
      files: 4,
      target: 'client/extensions/nocobase-registry-example-provider-ui',
    },
  ]);
  assert.match(
    fs.readFileSync(
      path.join(installedRoot, 'pages/registry-example-page.tsx'),
      'utf8',
    ),
    /from '#components\/ui\/button'/u,
  );
  assert.match(
    fs.readFileSync(path.join(installedRoot, 'extension.ts'), 'utf8'),
    /REGISTRY_EXAMPLE_ROUTE_IDS\.index/u,
  );
  assert.match(
    fs.readFileSync(
      path.join(
        applicationRoot,
        'client/extensions/nocobase-registry-example-component-ui/index.ts',
      ),
      'utf8',
    ),
    /EditablePanel/u,
  );
  assert.match(
    fs.readFileSync(
      path.join(
        applicationRoot,
        'client/extensions/nocobase-registry-example-provider-ui/index.ts',
      ),
      'utf8',
    ),
    /ExampleUiProvider/u,
  );
});

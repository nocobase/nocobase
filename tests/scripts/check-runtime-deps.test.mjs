import assert from 'node:assert/strict';
import test from 'node:test';
import {
  collectRuntimeSpecifiers,
  findViolations,
} from '../../scripts/check-runtime-deps.mjs';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

test('ignores import-like UI prose, comments, regexes and JSX text', () => {
  const source = `
    const labels = { undoImport: 'Undo import', importError: 'Invalid file' };
    const description = "import 'not-a-package'";
    // import 'comment-only';
    /* export { value } from 'comment-export'; */
    const pattern = /import 'regex-only'/;
    const view = <div>import 'jsx-only'<span title="require('attribute-only')" />{labels.undoImport}</div>;
    import { value } from 'real-package';
  `;
  assert.deepEqual([...collectRuntimeSpecifiers(source)], ['real-package']);
});

test('collects runtime imports and exports, skipping type-only references', () => {
  const source = `
    import main, { type Type, value } from 'mixed';
    import * as namespace from 'namespace';
    import 'side-effect';
    import type DefaultType from 'type-default';
    import { type A, type B } from 'type-named';
    import keep, { type C } from 'default-and-types';
    export { value, type D } from 're-export';
    export * from 'export-all';
    export * as named from 'export-namespace';
    export type { E } from 'type-export';
    export { type F } from 'type-export-named';
    import legacy = require('legacy');
    import type LegacyType = require('legacy-type');
    const load = () => import('dynamic', { with: { type: 'json' } });
    const dependency = require('required');
    type Query = import('type-query').T;
    const dynamicName = import(variable);
    object.import('method-only');
    object.require('method-only');
  `;
  assert.deepEqual(
    [...collectRuntimeSpecifiers(source)].sort(),
    [
      'mixed',
      'namespace',
      'side-effect',
      'default-and-types',
      're-export',
      'export-all',
      'export-namespace',
      'legacy',
      'dynamic',
      'required',
    ].sort(),
  );
});

test('visits expressions inside templates and supports literal dynamic imports', () => {
  const source =
    'const text = `import "prose" ${import("nested")}`; import(`literal`); import(`prefix-${name}`);';
  assert.deepEqual(
    [...collectRuntimeSpecifiers(source)],
    ['nested', 'literal'],
  );
});

test('uses the filename for TypeScript assertions and fails closed on invalid syntax', () => {
  assert.deepEqual(
    [
      ...collectRuntimeSpecifiers(
        "const a = <number>value; import 'real';",
        'file.ts',
      ),
    ],
    ['real'],
  );
  assert.throws(
    () => collectRuntimeSpecifiers('import {', 'broken.ts'),
    /Cannot scan broken.ts/,
  );
});

test('still reports undeclared and dev-only dependencies, without reporting prose', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'runtime-deps-test-'));
  try {
    await mkdir(path.join(root, 'client'));
    await writeFile(
      path.join(root, 'client', 'index.tsx'),
      `
      const labels = { undoImport: 'Undo import', importError: 'Invalid file' };
      import 'missing'; import 'dev-only'; import 'peer'; import 'runtime'; import 'optional';
    `,
    );
    const violations = await findViolations(
      root,
      {
        name: 'fixture',
        files: ['client'],
        dependencies: { runtime: '*' },
        peerDependencies: { peer: '*' },
        optionalDependencies: { optional: '*' },
        devDependencies: { 'dev-only': '*' },
      },
      new Set(),
    );
    assert.deepEqual(
      violations.map(({ dependency, kind }) => ({ dependency, kind })),
      [
        { dependency: 'dev-only', kind: 'dev-only' },
        { dependency: 'missing', kind: 'undeclared' },
      ],
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('does not ask for a declaration for a Vite virtual module', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'runtime-deps-test-'));
  try {
    await mkdir(path.join(root, 'client'));
    await writeFile(
      path.join(root, 'client', 'index.ts'),
      `await import('virtual:nocobase-workflow-client-entries');`,
    );
    // No package publishes a `virtual:` specifier; a build plugin supplies it.
    assert.deepEqual(
      await findViolations(
        root,
        { name: 'fixture', files: ['client'] },
        new Set(),
      ),
      [],
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('checks every source emitted into dist, including root and plugin-specific directories', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'runtime-deps-test-'));
  try {
    await writeFile(
      path.join(root, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: { outDir: 'dist', rootDir: '.' },
        include: [
          'index.ts',
          'src/**/*.ts',
          'server/**/*.ts',
          'client/**/*.ts',
          'runtime/**/*.ts',
          'cli/**/*.ts',
          'build/**/*.ts',
          'dsl/**/*.ts',
          'shared/**/*.ts',
        ],
      }),
    );
    await writeFile(
      path.join(root, 'tsconfig.migrations.json'),
      JSON.stringify({
        compilerOptions: { outDir: 'dist', rootDir: '.' },
        include: ['database/**/*.ts'],
      }),
    );
    await writeFile(
      path.join(root, 'tsconfig.check.json'),
      JSON.stringify({
        compilerOptions: { noEmit: true },
        include: ['scripts/**/*.ts'],
      }),
    );
    await writeFile(path.join(root, 'index.ts'), "import 'root-dependency';");
    for (const directory of [
      'src',
      'server',
      'client',
      'runtime',
      'cli',
      'build',
      'dsl',
      'shared',
    ]) {
      await mkdir(path.join(root, directory));
      await writeFile(
        path.join(root, directory, 'index.ts'),
        `import '${directory}-dependency';`,
      );
    }
    await mkdir(path.join(root, 'database'));
    await writeFile(
      path.join(root, 'database', 'migration.ts'),
      "import 'database-dependency';",
    );
    await mkdir(path.join(root, 'scripts'));
    await writeFile(
      path.join(root, 'scripts', 'unused.ts'),
      "import 'build-script-only';",
    );

    const violations = await findViolations(
      root,
      { name: 'fixture', files: ['dist'] },
      new Set(),
    );
    assert.deepEqual(
      violations.map(({ dependency }) => dependency),
      [
        'build-dependency',
        'cli-dependency',
        'client-dependency',
        'database-dependency',
        'dsl-dependency',
        'root-dependency',
        'runtime-dependency',
        'server-dependency',
        'shared-dependency',
        'src-dependency',
      ],
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

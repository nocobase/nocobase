import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  collectManifestReferences,
  collectScriptReferences,
  collectStyleReferences,
  findCrossPackageReads,
} from '../../scripts/check-cross-package-paths.mjs';

// A miniature workspace: `@test/reader` and `@test/target` under packages/libs, and `@test/app` under
// packages/templates.
function createWorkspace(t, readerManifest = {}) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'cross-package-paths-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const write = (file, content) => {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), content);
  };
  write('pnpm-workspace.yaml', 'packages:\n  - packages/*/*\n');
  write(
    'packages/libs/reader/package.json',
    JSON.stringify({ name: '@test/reader', ...readerManifest }),
  );
  write(
    'packages/libs/target/package.json',
    JSON.stringify({ name: '@test/target' }),
  );
  write('packages/libs/target/src/index.ts', 'export const value = 1;\n');
  write(
    'packages/templates/app/package.json',
    JSON.stringify({ name: '@test/app' }),
  );
  return { root, write };
}

const summarize = ({ violations }) =>
  violations
    .map(({ file, reference, target }) => `${file} ${reference} ${target}`)
    .sort();

test('reports relative imports, path literals and stylesheet imports that land in another package', async (t) => {
  const { root, write } = createWorkspace(t);
  write(
    'packages/libs/reader/tests/import.test.ts',
    "import { value } from '../../target/src/index.ts';\n",
  );
  write(
    'packages/libs/reader/tests/resolve.test.ts',
    "const dir = path.resolve(import.meta.dirname, '..', '..', '..', 'templates', 'app');\n",
  );
  write(
    'packages/libs/reader/vitest.config.ts',
    "export const file = path.resolve(import.meta.dirname, `../target/${name}.ts`);\nexport const cwd = path.resolve(process.cwd(), '../../templates/app');\n",
  );
  write(
    'packages/libs/reader/website/styles.css',
    "@import '../../target/styles.css';\n@source '../../../templates/app/client';\n",
  );
  write(
    'packages/libs/reader/tests/repository.test.ts',
    "const root = path.join(repository, 'packages/templates/app');\n",
  );
  write(
    'packages/libs/reader/tsconfig.test.json',
    JSON.stringify({
      include: ['tests', '../../templates/app/client/env.d.ts'],
    }),
  );

  assert.deepEqual(summarize(await findCrossPackageReads(root)), [
    'packages/libs/reader/tests/import.test.ts ../../target/src/index.ts @test/target',
    'packages/libs/reader/tests/repository.test.ts packages/templates/app @test/app',
    'packages/libs/reader/tests/resolve.test.ts ../../../templates/app @test/app',
    'packages/libs/reader/tsconfig.test.json ../../templates/app/client/env.d.ts @test/app',
    'packages/libs/reader/vitest.config.ts ../../templates/app @test/app',
    'packages/libs/reader/vitest.config.ts ../target/ @test/target',
    'packages/libs/reader/website/styles.css ../../../templates/app/client @test/app',
    'packages/libs/reader/website/styles.css ../../target/styles.css @test/target',
  ]);
});

test('reports a package script that runs another package’s file', async (t) => {
  const { root } = createWorkspace(t, {
    scripts: { 'test:integration': 'node ../target/scripts/run.mjs --all' },
  });
  assert.deepEqual(summarize(await findCrossPackageReads(root)), [
    'packages/libs/reader/package.json ../target/scripts/run.mjs @test/target',
  ]);
});

test('accepts reads of a declared dependency, of the package itself, and of paths outside every package', async (t) => {
  const { root, write } = createWorkspace(t, {
    devDependencies: { '@test/target': 'workspace:*' },
  });
  write(
    'packages/libs/reader/tests/import.test.ts',
    [
      "import { value } from '../../target/src/index.ts';",
      "import { own } from '../src/own.ts';",
      // A synthetic layout written into a temporary directory, which only looks like a repository path.
      "const watched = ['../../plugins/app-plugin-enabled/server/**/*'];",
      "const fixture = new URL('./fixtures/app/', import.meta.url);",
      '',
    ].join('\n'),
  );
  assert.deepEqual(summarize(await findCrossPackageReads(root)), []);
});

test('an exemption covers its path and is reported once it covers nothing', async (t) => {
  const { root, write } = createWorkspace(t);
  write(
    'packages/libs/reader/tests/fixtures/manual/main.tsx',
    "import '../../../../../templates/app/client/main.tsx';\n",
  );
  const used = {
    packageName: '@test/reader',
    path: 'tests/fixtures/manual/',
    reason: 'manual',
  };
  const unused = {
    packageName: '@test/reader',
    path: 'vitest.config.ts',
    reason: 'stale',
  };
  const result = await findCrossPackageReads(root, {
    exemptions: [used, unused],
  });
  assert.deepEqual(result.violations, []);
  assert.deepEqual(result.unusedExemptions, [unused]);
});

test('skips node_modules and build output', async (t) => {
  const { root, write } = createWorkspace(t);
  write(
    'packages/libs/reader/node_modules/dependency/index.js',
    "require('../../../target/src/index.ts');\n",
  );
  write(
    'packages/libs/reader/dist/index.js',
    "import '../../target/src/index.ts';\n",
  );
  assert.deepEqual(summarize(await findCrossPackageReads(root)), []);
});

test('collects module specifiers, path literals and joined literal arguments, not prose', () => {
  const references = collectScriptReferences(
    [
      "import type { A } from '../a.ts';",
      "export * from './b.js';",
      "const c = await import('../c.js');",
      "type D = import('../d.ts').D;",
      "const e = path.join(root, '..', 'e');",
      "const f = new URL('../f/', import.meta.url);",
      'const g = `../g/${name}`;',
      "const h = 'packages/libs/h/src';",
      "const prose = 'Go back ../ later';",
      "const relativeWord = 'some/../path';",
      '',
    ].join('\n'),
    'source.ts',
  );
  assert.deepEqual(references, [
    { kind: 'module', text: '../a.ts' },
    { kind: 'module', text: './b.js' },
    { kind: 'module', text: '../c.js' },
    { kind: 'module', text: '../d.ts' },
    { kind: 'path', text: '../e' },
    { kind: 'path', text: '../f/' },
    { kind: 'path', text: '../g/' },
    { kind: 'repository', text: 'packages/libs/h/src' },
  ]);
});

test('collects stylesheet references outside comments', () => {
  assert.deepEqual(
    collectStyleReferences(
      [
        "/* @import '../commented.css'; */",
        "@import '../a.css';",
        '@import url("../b.css") layer(base);',
        "@source '../c';",
        "@plugin './d.js';",
        "@import 'tailwindcss';",
        '.e { background: url(../e.png); }',
        '',
      ].join('\n'),
    ),
    [
      { kind: 'module', text: '../a.css' },
      { kind: 'module', text: '../b.css' },
      { kind: 'module', text: '../c' },
      { kind: 'module', text: './d.js' },
      { kind: 'module', text: '../e.png' },
    ],
  );
});

test('collects the relative paths of package scripts', () => {
  assert.deepEqual(
    collectManifestReferences({
      scripts: {
        test: 'vitest run',
        integration: 'node ../../libs/jobs/scripts/run.mjs',
        copy: "cp -r './assets' dist",
      },
    }),
    [
      { kind: 'root', text: '../../libs/jobs/scripts/run.mjs' },
      { kind: 'root', text: './assets' },
    ],
  );
});

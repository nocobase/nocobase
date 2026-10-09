import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

import ts from 'typescript';

import {
  buildRegistry,
  findRegistryOwners,
  materializeRegistry,
} from '../../scripts/registry.mjs';
import {
  assertPortableImports,
  assertResolvableImports,
  importsOf,
  sourceFiles,
} from './helpers/registry-imports.mjs';

const repoRoot = path.resolve(import.meta.dirname, '../..');
const libraryRoot = path.join(repoRoot, 'ui-library');
const libraryRequire = createRequire(path.join(libraryRoot, 'package.json'));
const shadcn = path.join(libraryRoot, 'node_modules/shadcn/dist/index.js');
const exec = promisify(execFile);

function write(root, file, content) {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function json(root, file, content) {
  write(root, file, `${JSON.stringify(content, null, 2)}\n`);
}

function temporary(t) {
  // Keep fixtures inside the checkout; neither shadcn nor Vite can escape the run's working directory.
  const root = fs.mkdtempSync(
    path.join(repoRoot, 'node_modules/.cache/registry-imports-'),
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

fs.mkdirSync(path.join(repoRoot, 'node_modules/.cache'), { recursive: true });

test('import inspection covers static, type, re-export, dynamic and require syntax', () => {
  const content = `// import '@/comment';
const text = "from '@/ordinary-string'";
import '@/side-effect';
import type { Value } from '@/type';
export { value } from '@/re-export';
type Value = import('@/import-type').Value;
const lazy = import('@/dynamic');
const legacy = require('@/require');
import legacyType = require('@/import-equals');
`;
  assert.deepEqual(
    importsOf('probe.ts', content).map(({ specifier }) => specifier),
    [
      '@/side-effect',
      '@/type',
      '@/re-export',
      '@/import-type',
      '@/dynamic',
      '@/require',
      '@/import-equals',
    ],
  );
  assert.throws(
    () => assertPortableImports([{ path: 'registry/probe.ts', content }]),
    /registry\/probe\.ts:3:8: build-tool alias "@\/side-effect"/u,
  );
  assertPortableImports([
    {
      path: 'probe.ts',
      content:
        "import '#lib/utils'; import './local.js'; import '@nocobase/app-client';",
    },
  ]);
  assert.throws(
    () =>
      assertPortableImports([
        { path: 'probe.ts', content: "import '~/utils';" },
      ]),
    /build-tool alias/u,
  );
});

test('every package-owned generated registry is free of build-tool aliases', (t) => {
  const root = temporary(t);
  const files = [];
  const owners = findRegistryOwners(repoRoot);
  assert.ok(owners.length, 'Expected package-owned registries');
  for (const [index, ownerRoot] of owners.entries()) {
    const outputDirectory = path.join(root, String(index));
    const result = buildRegistry({ ownerRoot, outputDirectory, repoRoot });
    for (const { name } of result.items) {
      const item = JSON.parse(
        fs.readFileSync(path.join(outputDirectory, `${name}.json`), 'utf8'),
      );
      for (const file of item.files)
        files.push({
          path: `${path.relative(repoRoot, ownerRoot)}/${file.path}`,
          content: file.content,
        });
    }
  }
  assertPortableImports(files);
});

test('every shadcn-built UI Library item and demo is free of build-tool aliases', async (t) => {
  const output = temporary(t);
  await exec(
    process.execPath,
    [shadcn, 'build', 'registry.json', '--output', output],
    { cwd: libraryRoot, timeout: 120_000 },
  );
  const index = JSON.parse(
    fs.readFileSync(path.join(output, 'registry.json'), 'utf8'),
  );
  assert.ok(index.items.length, 'Expected UI Library items');
  const files = index.items.flatMap(({ name }) => {
    const item = JSON.parse(
      fs.readFileSync(path.join(output, `${name}.json`), 'utf8'),
    );
    return item.files.map((file) => ({
      path: `ui-library/${file.path}`,
      content: file.content,
    }));
  });
  assertPortableImports(files);
});

function consumer(root, kind) {
  const imports = Object.fromEntries(
    [
      ['components', 'tsx'],
      ['lib', 'ts'],
      ['hooks', 'ts'],
    ].map(([name, extension]) => [
      `#${name}/*`,
      kind === 'plugin'
        ? {
            types: `./client/${name}/*.${extension}`,
            default: `./dist/client/${name}/*.js`,
          }
        : `./client/${name}/*.${extension}`,
    ]),
  );
  json(root, 'package.json', {
    name: `registry-${kind}-fixture`,
    type: 'module',
    imports,
    dependencies: {
      react: libraryRequire('react/package.json').version,
      cn: JSON.parse(
        fs.readFileSync(
          path.join(libraryRoot, 'node_modules/cn/package.json'),
          'utf8',
        ),
      ).version,
    },
  });
  fs.symlinkSync(
    path.join(libraryRoot, 'node_modules'),
    path.join(root, 'node_modules'),
    'dir',
  );
  json(root, 'components.json', {
    $schema: 'https://ui.shadcn.com/schema.json',
    style: 'base-nova',
    rsc: false,
    tsx: true,
    tailwind: {
      config: '',
      css: 'client/styles.css',
      baseColor: 'neutral',
      cssVariables: true,
    },
    aliases: {
      components: '#components',
      ui: '#components/ui',
      lib: '#lib',
      hooks: '#hooks',
      utils: '#lib/utils',
    },
  });
  write(root, 'client/styles.css', '@import "tailwindcss";\n');
  write(
    root,
    'client/lib/value.ts',
    `export const value: string = '${kind.toUpperCase()}_LOCAL_VALUE';\n`,
  );
  write(
    root,
    'client/lib/utils.ts',
    'export const identity = (value: string): string => value;\n',
  );
  write(
    root,
    'client/components/ui/button.tsx',
    "import { value } from '#lib/value';\nexport const button: string = value;\n",
  );
  const options = {
    target: ts.ScriptTarget.ES2022,
    strict: true,
    skipLibCheck: true,
    types: [],
    jsx: ts.JsxEmit.ReactJSX,
    rootDir: root,
    outDir: path.join(root, 'dist'),
    module: kind === 'plugin' ? ts.ModuleKind.NodeNext : ts.ModuleKind.ESNext,
    moduleResolution:
      kind === 'plugin'
        ? ts.ModuleResolutionKind.NodeNext
        : ts.ModuleResolutionKind.Bundler,
    declaration: kind === 'plugin',
    isolatedDeclarations: kind === 'plugin',
    noEmit: kind !== 'plugin',
  };
  json(root, 'tsconfig.json', {
    compilerOptions: {
      module: kind === 'plugin' ? 'NodeNext' : 'ESNext',
      moduleResolution: kind === 'plugin' ? 'NodeNext' : 'Bundler',
    },
    include: ['client'],
  });
  return options;
}

function registryOwner(root) {
  json(root, 'package.json', {
    name: '@fixture/registry-owner',
    type: 'module',
    nocobase: { registry: { items: { probe: './registry/probe' } } },
  });
  json(root, 'registry.config.json', {
    name: 'fixture',
    items: [
      {
        name: 'probe',
        type: 'registry:block',
        registryDependencies: [],
        dependencies: [],
        source: {
          root: 'registry/probe',
          target: 'client/extensions/probe',
          include: ['.'],
        },
      },
    ],
  });
  write(
    root,
    'registry/probe/local.ts',
    'export const suffix: string = "_RECIPE";\n',
  );
  write(
    root,
    'registry/probe/index.ts',
    "import { button } from '#components/ui/button';\nimport { suffix } from './local.js';\nexport { PageContainer } from './page-container.js';\nexport const probe: string = button + suffix;\n",
  );
  // Compile a maintained React component too; the probe adds the package-boundary assertion.
  write(
    root,
    'registry/probe/page-container.tsx',
    fs.readFileSync(
      path.join(libraryRoot, 'registry/components/page-container.tsx'),
      'utf8',
    ),
  );
}

async function registryServer(t, output) {
  const unexpected = [];
  const server = http.createServer((req, res) => {
    const file =
      req.url === '/registries.json'
        ? null
        : path.join(output, path.basename(req.url));
    if (req.url === '/registries.json') res.end('[]');
    else if (req.url === '/colors/neutral.json')
      res.end(
        JSON.stringify({
          name: 'neutral',
          cssVars: { light: {}, dark: {} },
          inlineColors: { light: {}, dark: {} },
          inlineColorsTemplate: '',
          cssVarsTemplate: '',
        }),
      );
    else if (fs.existsSync(file)) {
      res.setHeader('content-type', 'application/json');
      res.end(fs.readFileSync(file));
    } else {
      unexpected.push(req.url);
      res.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return { url: `http://127.0.0.1:${server.address().port}`, unexpected };
}

for (const kind of ['app', 'plugin']) {
  for (const installation of ['materialize', 'shadcn add']) {
    test(`${installation}: ${kind} resolves package imports without aliases, including plugin output`, async (t) => {
      const root = temporary(t);
      const ownerRoot = path.join(root, 'owner');
      const host = path.join(root, 'host');
      const target =
        kind === 'plugin' ? path.join(host, 'plugins/probe') : host;
      registryOwner(ownerRoot);
      const options = consumer(target, kind);
      if (kind === 'plugin') consumer(host, 'app');
      if (installation === 'materialize') {
        materializeRegistry({ ownerRoot, outputRoot: target, repoRoot: root });
      } else {
        const output = path.join(root, 'r');
        buildRegistry({ ownerRoot, outputDirectory: output, repoRoot: root });
        const { url, unexpected } = await registryServer(t, output);
        // Emulate an upstream shadcn primitive: add must rewrite its utils import from the consumer's config.
        json(output, 'button.json', {
          name: 'button',
          type: 'registry:ui',
          files: [
            {
              path: 'ui/button.tsx',
              type: 'registry:ui',
              content:
                "import { identity } from '@/lib/utils';\nimport { value } from '#lib/value';\nexport const button: string = identity(value);\n",
            },
          ],
        });
        const item = JSON.parse(
          fs.readFileSync(path.join(output, 'probe.json'), 'utf8'),
        );
        item.registryDependencies = [`${url}/button.json`];
        json(output, 'probe.json', item);
        fs.rmSync(path.join(target, 'client/components/ui/button.tsx'));
        await exec(
          process.execPath,
          [shadcn, 'add', `${url}/probe.json`, '--cwd', target, '--yes'],
          {
            env: { ...process.env, REGISTRY_URL: url },
            timeout: 60_000,
          },
        );
        assert.deepEqual(
          unexpected,
          [],
          'shadcn requested an undeclared registry resource',
        );
      }
      assert.ok(
        fs.existsSync(path.join(target, 'client/extensions/probe/index.ts')),
      );
      const program = assertResolvableImports(target, options);
      if (kind === 'plugin') {
        assert.equal(program.emit().emitSkipped, false);
        assertPortableImports(
          sourceFiles(path.join(target, 'dist')).map((file) => ({
            path: file,
            content: fs.readFileSync(file, 'utf8'),
          })),
        );
      }
      const entry =
        kind === 'plugin'
          ? './plugins/probe/dist/client/extensions/probe/index.js'
          : './client/extensions/probe/index.js';
      write(
        host,
        'entry.ts',
        `export { probe, PageContainer } from '${entry}';\n`,
      );
      const { build } = await import(
        pathToFileURL(libraryRequire.resolve('vite'))
      );
      const bundle = await build({
        configFile: false,
        root: host,
        logLevel: 'silent',
        build: {
          write: false,
          minify: false,
          lib: { entry: path.join(host, 'entry.ts'), formats: ['es'] },
          rollupOptions: { external: ['react', 'react/jsx-runtime', 'cn'] },
        },
      });
      const outputs = Array.isArray(bundle) ? bundle : [bundle];
      const code = outputs
        .flatMap((output) => output.output)
        .filter((chunk) => chunk.type === 'chunk')
        .map((chunk) => chunk.code)
        .join('\n');
      assert.ok(code.includes(`${kind.toUpperCase()}_LOCAL_VALUE`), code);
      if (kind === 'plugin')
        assert.ok(
          !code.includes('APP_LOCAL_VALUE'),
          'Host package imports captured the plugin import',
        );

      // A valid baseline must fail when a single alias is reintroduced, even for a type-only import.
      write(
        target,
        'client/extensions/probe/regression.ts',
        "import type { Value } from '@/lib/value';\nexport type Regression = Value;\n",
      );
      assert.throws(
        () => assertResolvableImports(target, options),
        /regression\.ts:1:28: build-tool alias "@\/lib\/value"/u,
      );
      write(
        target,
        'client/extensions/probe/regression.ts',
        "import { value } from '#lib/missing';\nexport const regression: string = value;\n",
      );
      assert.throws(
        () => assertResolvableImports(target, options),
        /cannot resolve "#lib\/missing"/u,
      );
      write(
        target,
        'client/extensions/probe/regression.ts',
        "import { value } from '@client/utils';\nexport const regression: string = value;\n",
      );
      assert.throws(
        () => assertResolvableImports(target, options),
        /cannot resolve "@client\/utils"/u,
      );
    });
  }
}

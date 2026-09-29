import { test } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { loadAppVitePlugins } from '../vite/plugins.ts';

test('uses registered client factories and resolves import-only exports from the app', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vite-registration-'));
  try {
    await fs.mkdir(path.join(root, 'client'), { recursive: true });
    await fs.writeFile(path.join(root, 'package.json'), '{}');
    await fs.writeFile(
      path.join(root, 'client/plugins.ts'),
      `
      import { defineClientPlugins as define } from '@nocobase/app-client/plugins';
      import enabled from 'fixture-plugin/client';
      import unused from 'missing-plugin/client';
      export default define([enabled()]);
    `,
    );
    const pluginRoot = path.join(root, 'node_modules/fixture-plugin');
    await fs.mkdir(pluginRoot, { recursive: true });
    await fs.writeFile(
      path.join(pluginRoot, 'package.json'),
      JSON.stringify({
        type: 'module',
        exports: {
          './package.json': './package.json',
          './vite': { import: './vite.js', require: './wrong.cjs' },
        },
      }),
    );
    await fs.writeFile(
      path.join(pluginRoot, 'vite.js'),
      `export default ({ appRoot }) => ({ name: appRoot });`,
    );
    assert.deepEqual(
      await loadAppVitePlugins({
        appRoot: root,
        environment: { command: 'build', mode: 'production' },
      }),
      [{ name: root }],
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('loads workspace TypeScript contributions with JavaScript import specifiers', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vite-typescript-'));
  try {
    await fs.mkdir(path.join(root, 'client'), { recursive: true });
    await fs.writeFile(path.join(root, 'package.json'), '{"type":"module"}');
    await fs.writeFile(
      path.join(root, 'client/plugins.ts'),
      `import { defineClientPlugins } from '@nocobase/app-client/plugins'; import plugin from 'fixture-plugin/client'; export default defineClientPlugins([plugin()]);`,
    );
    const packageRoot = path.join(root, 'node_modules/fixture-plugin');
    await fs.mkdir(packageRoot, { recursive: true });
    await fs.writeFile(
      path.join(packageRoot, 'package.json'),
      JSON.stringify({
        type: 'module',
        exports: {
          './package.json': './package.json',
          './vite': { import: './vite.ts' },
        },
      }),
    );
    await fs.writeFile(
      path.join(packageRoot, 'vite.ts'),
      "import { name } from './helper.js'; export default () => ({ name });",
    );
    await fs.writeFile(
      path.join(packageRoot, 'helper.ts'),
      "export const name: string = 'typescript-contribution';",
    );
    assert.deepEqual(
      await loadAppVitePlugins({
        appRoot: root,
        environment: { command: 'build', mode: 'production' },
      }),
      [{ name: 'typescript-contribution' }],
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('contributes nothing when the application registers no client plugins', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vite-registration-'));
  try {
    await fs.writeFile(path.join(root, 'package.json'), '{}');
    // Vite resolves its config through this loader, so a missing
    // `client/plugins.ts` must not fail the build.
    assert.deepEqual(
      await loadAppVitePlugins({
        appRoot: root,
        environment: { command: 'build', mode: 'production' },
      }),
      [],
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('hands a contribution the literal options the application registered with', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vite-config-'));
  try {
    await fs.mkdir(path.join(root, 'client'), { recursive: true });
    await fs.writeFile(path.join(root, 'package.json'), '{"type":"module"}');
    await fs.writeFile(
      path.join(root, 'client/plugins.ts'),
      `
      import { defineClientPlugins } from '@nocobase/app-client/plugins';
      import configured from 'configured-plugin/client';
      import dynamic from 'dynamic-plugin/client';
      import bare from 'bare-plugin/client';
      const root = process.env.ROOT;
      export default defineClientPlugins([
        configured({ sourceRoot: 'flows', depth: -2, debug: false, nested: { list: ['a'] } }),
        dynamic({ sourceRoot: root }),
        bare(),
      ]);
    `,
    );
    for (const name of ['configured-plugin', 'dynamic-plugin', 'bare-plugin']) {
      const pluginRoot = path.join(root, 'node_modules', name);
      await fs.mkdir(pluginRoot, { recursive: true });
      await fs.writeFile(
        path.join(pluginRoot, 'package.json'),
        JSON.stringify({
          type: 'module',
          exports: {
            './package.json': './package.json',
            './vite': { import: './vite.js' },
          },
        }),
      );
      await fs.writeFile(
        path.join(pluginRoot, 'vite.js'),
        `export default ({ registration }) => ({ name: ${JSON.stringify(name)}, config: registration.config ?? null });`,
      );
    }
    assert.deepEqual(
      await loadAppVitePlugins({
        appRoot: root,
        environment: { command: 'build', mode: 'production' },
      }),
      [
        {
          name: 'configured-plugin',
          config: {
            sourceRoot: 'flows',
            depth: -2,
            debug: false,
            nested: { list: ['a'] },
          },
        },
        // The declaration is parsed, never executed, so an option that is only
        // knowable at runtime leaves the whole object unread rather than
        // reporting a partial one.
        { name: 'dynamic-plugin', config: null },
        { name: 'bare-plugin', config: null },
      ],
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('loads a contribution from a package that does not export its manifest', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vite-manifest-'));
  try {
    await fs.mkdir(path.join(root, 'client'), { recursive: true });
    await fs.writeFile(path.join(root, 'package.json'), '{}');
    await fs.writeFile(
      path.join(root, 'client/plugins.ts'),
      `import { defineClientPlugins } from '@nocobase/app-client/plugins';
      import withVite from 'with-vite/client';
      import withoutVite from 'without-vite/client';
      export default defineClientPlugins([withVite(), withoutVite()]);`,
    );
    for (const [name, exports] of [
      ['with-vite', { './client': './client.js', './vite': './vite.js' }],
      ['without-vite', { './client': './client.js' }],
    ] as const) {
      const packageRoot = path.join(root, 'node_modules', name);
      await fs.mkdir(packageRoot, { recursive: true });
      await fs.writeFile(
        path.join(packageRoot, 'package.json'),
        JSON.stringify({ name, type: 'module', exports }),
      );
      await fs.writeFile(
        path.join(packageRoot, 'vite.js'),
        `export default () => ({ name: ${JSON.stringify(name)} });`,
      );
    }
    assert.deepEqual(
      await loadAppVitePlugins({
        appRoot: root,
        environment: { command: 'build', mode: 'production' },
      }),
      [{ name: 'with-vite' }],
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('names a registered plugin that is not installed', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vite-missing-'));
  try {
    await fs.mkdir(path.join(root, 'client'), { recursive: true });
    await fs.writeFile(path.join(root, 'package.json'), '{}');
    await fs.writeFile(
      path.join(root, 'client/plugins.ts'),
      `import { defineClientPlugins } from '@nocobase/app-client/plugins';
      import absent from 'absent-plugin/client';
      export default defineClientPlugins([absent()]);`,
    );
    await assert.rejects(
      loadAppVitePlugins({
        appRoot: root,
        environment: { command: 'build', mode: 'production' },
      }),
      /absent-plugin is registered in client\/plugins\.ts but is not installed/,
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

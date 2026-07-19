/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { rspack } from '@rspack/core';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { buildClient } from '../buildClient';

const tempDirs: string[] = [];

afterEach(async () => {
  vi.unstubAllGlobals();
  await Promise.all(tempDirs.map((dir) => fs.remove(dir)));
  tempDirs.length = 0;
});

async function createPackage(source: string) {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'nocobase-build-client-'));
  tempDirs.push(cwd);
  await fs.outputJson(path.join(cwd, 'tsconfig.json'), {
    compilerOptions: {
      lib: ['DOM', 'ES2020'],
      module: 'ESNext',
      moduleResolution: 'Node',
      target: 'ES2020',
    },
    include: ['src'],
  });
  await fs.outputFile(path.join(cwd, 'src/index.ts'), source);
  await fs.outputFile(path.join(cwd, 'src/locale/en-US.ts'), `export default { ready: 'Ready' };\n`);
  return cwd;
}

async function bundleConsumer(entry: string, outDir: string, target: 'node' | 'web') {
  await fs.outputFile(path.join(outDir, 'entry.js'), entry);
  const compiler = rspack({
    context: outDir,
    entry: './entry.js',
    mode: 'production',
    output: {
      chunkFilename: '[name].js',
      filename: 'consumer.js',
      library: { type: 'commonjs2' },
      path: path.join(outDir, 'dist'),
      publicPath: '/nocobase/',
    },
    target,
  });
  await new Promise<void>((resolve, reject) => {
    compiler.run((error, stats) => {
      compiler.close(() => {
        if (error || stats?.hasErrors()) reject(error || new Error(stats?.toString({ all: false, errors: true })));
        else resolve();
      });
    });
  });
  return path.join(outDir, 'dist/consumer.js');
}

async function bundleEsmConsumer(modulePath: string, outDir: string) {
  const entry = path.join(outDir, 'entry.mjs');
  await fs.outputFile(
    entry,
    `import { createProject } from ${JSON.stringify(modulePath)}; export { createProject };\n`,
  );
  const compiler = rspack({
    context: outDir,
    entry,
    experiments: { outputModule: true },
    externals: { [modulePath]: modulePath },
    externalsType: 'module-import',
    mode: 'production',
    output: {
      chunkFormat: 'module',
      filename: 'consumer.mjs',
      library: { type: 'module' },
      module: true,
      path: path.join(outDir, 'dist'),
    },
    target: 'web',
  });
  await new Promise<void>((resolve, reject) => {
    compiler.run((error, stats) => {
      compiler.close(() => {
        if (error || stats?.hasErrors()) reject(error || new Error(stats?.toString({ all: false, errors: true })));
        else resolve();
      });
    });
  });
  return path.join(outDir, 'dist/consumer.mjs');
}

describe('buildClient', () => {
  test('keeps the default client build single-chunk and consumable as CommonJS', async () => {
    const cwd = await createPackage('export const value = 42;\n');

    await buildClient(
      cwd,
      { modifyRsbuildConfig: (config) => config, modifyTsupConfig: (config) => config },
      false,
      () => {},
    );

    expect((await fs.readdir(path.join(cwd, 'es'))).filter((file) => file.endsWith('.mjs'))).toEqual(['index.mjs']);
    expect((await fs.readdir(path.join(cwd, 'lib'))).filter((file) => file.endsWith('.js'))).toEqual(['index.js']);

    const consumer = await bundleConsumer(
      `module.exports = require(${JSON.stringify(path.join(cwd, 'lib/index.js'))}).value;\n`,
      path.join(cwd, 'cjs-consumer'),
      'node',
    );
    expect(require(consumer)).toBe(42);
  });

  test('emits an ESM module Worker while the CommonJS consumer uses the main-thread branch', async () => {
    const cwd = await createPackage(`
export function createProject() {
  if (process.env.NOCOBASE_CLIENT_MODULE_WORKER === 'false') return 'main-thread';
  return new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
}
`);
    await fs.outputFile(path.join(cwd, 'src/worker.ts'), `self.postMessage('worker-ready');\n`);

    await buildClient(
      cwd,
      {
        client: { moduleWorker: true },
        modifyRsbuildConfig: (config) => config,
        modifyTsupConfig: (config) => config,
      },
      false,
      () => {},
    );

    const cjsConsumer = await bundleConsumer(
      `module.exports = require(${JSON.stringify(path.join(cwd, 'lib/index.js'))}).createProject();\n`,
      path.join(cwd, 'cjs-consumer'),
      'node',
    );
    expect(require(cjsConsumer)).toBe('main-thread');

    const esmConsumer = await bundleEsmConsumer(path.join(cwd, 'es/index.mjs'), path.join(cwd, 'esm-consumer'));
    const workerUrls: string[] = [];
    vi.stubGlobal(
      'Worker',
      class {
        constructor(url: string | URL) {
          workerUrls.push(String(url));
        }
      },
    );
    const consumer = (await import(pathToFileURL(esmConsumer).href)) as { createProject(): unknown };
    consumer.createProject();

    expect(workerUrls).toHaveLength(1);
    await expect(fs.pathExists(fileURLToPath(workerUrls[0]))).resolves.toBe(true);
  });
});

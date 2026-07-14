/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, test } from 'vitest';

import { buildClient } from '../buildClient';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => fs.remove(dir)));
  tempDirs.length = 0;
});

async function createWorkerPackage() {
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
  await fs.outputFile(
    path.join(cwd, 'src/index.ts'),
    `export function createWorker() {
  return new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
}
`,
  );
  await fs.outputFile(path.join(cwd, 'src/worker.ts'), `self.postMessage('worker-ready');\n`);
  await fs.outputFile(path.join(cwd, 'src/locale/en-US.ts'), `export default { ready: 'Ready' };\n`);
  return cwd;
}

describe('buildClient', () => {
  test('emits module Worker chunks for ESM and CommonJS client libraries', async () => {
    const cwd = await createWorkerPackage();

    await buildClient(
      cwd,
      {
        modifyRsbuildConfig: (config) => config,
        modifyTsupConfig: (config) => config,
      },
      false,
      () => {},
    );

    await expect(fs.pathExists(path.join(cwd, 'es/index.mjs'))).resolves.toBe(true);
    await expect(fs.pathExists(path.join(cwd, 'lib/index.js'))).resolves.toBe(true);
    const esmChunks = (await fs.readdir(path.join(cwd, 'es'))).filter(
      (file) => file.endsWith('.mjs') && file !== 'index.mjs',
    );
    const commonJsChunks = (await fs.readdir(path.join(cwd, 'lib'))).filter(
      (file) => file.endsWith('.js') && file !== 'index.js',
    );
    expect(esmChunks.length).toBeGreaterThan(0);
    expect(commonJsChunks.length).toBeGreaterThan(0);
    const esmEntry = await fs.readFile(path.join(cwd, 'es/index.mjs'), 'utf8');
    const commonJsEntry = await fs.readFile(path.join(cwd, 'lib/index.js'), 'utf8');
    expect(esmEntry).toMatch(
      /new Worker\([\s\S]*?type:\s*["']module["']/u,
    );
    expect(commonJsEntry).toMatch(
      /new Worker\([\s\S]*?Object\.assign\([\s\S]*?type:\s*["']module["'][\s\S]*?type:\s*["']module["']/u,
    );
    expect(commonJsEntry).toContain('import.meta.url');
    expect(await Promise.all(commonJsChunks.map((file) => fs.readFile(path.join(cwd, 'lib', file), 'utf8')))).not.toEqual(
      expect.arrayContaining([expect.stringContaining('require(')]),
    );
    expect(esmEntry).not.toContain('.p="/"');
    expect(commonJsEntry).not.toContain('.p="/"');
  });
});

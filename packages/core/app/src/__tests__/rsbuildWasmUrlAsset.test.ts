/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { rspack, type Configuration } from '@rspack/core';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { addWasmUrlAssetRule } from '../../rsbuildWasmUrlAsset';

const tempDirs: string[] = [];

afterEach(async () => {
  vi.unstubAllGlobals();
  await Promise.all(tempDirs.map((dir) => fs.remove(dir)));
  tempDirs.length = 0;
});

describe('addWasmUrlAssetRule', () => {
  it('emits resolvable Worker and hashed WASM URLs below a non-root public path', async () => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'nocobase-app-worker-wasm-'));
    tempDirs.push(cwd);
    await fs.outputFile(
      path.join(cwd, 'index.js'),
      `import wasmUrl from './fixture.wasm?url';
export function createAssets() {
  return { wasmUrl, worker: new Worker(new URL('./worker.js', import.meta.url), { type: 'module' }) };
}
`,
    );
    await fs.outputFile(path.join(cwd, 'worker.js'), `self.postMessage('ready');\n`);
    await fs.outputFile(path.join(cwd, 'fixture.wasm'), Buffer.from([0, 97, 115, 109, 1, 0, 0, 0]));
    const config: Configuration = {
      context: cwd,
      entry: './index.js',
      mode: 'production',
      output: {
        chunkFilename: '[name]-[contenthash:8].js',
        filename: 'index.js',
        library: { type: 'commonjs2' },
        path: path.join(cwd, 'dist'),
        publicPath: '/nocobase/',
      },
      target: 'web',
    };
    addWasmUrlAssetRule(config);

    await compile(config);

    const workerUrls: string[] = [];
    vi.stubGlobal('document', { baseURI: 'https://example.test/nocobase/' });
    vi.stubGlobal('self', { location: { href: 'https://example.test/nocobase/' } });
    vi.stubGlobal(
      'Worker',
      class {
        constructor(url: string | URL) {
          workerUrls.push(String(url));
        }
      },
    );
    const assets = (require(path.join(cwd, 'dist/index.js')) as { createAssets(): { wasmUrl: string } }).createAssets();

    expect(assets.wasmUrl).toMatch(/^\/nocobase\/assets\/fixture-[a-f0-9]{8}\.wasm$/u);
    expect(workerUrls[0]).toMatch(/^https:\/\/example\.test\/nocobase\/.+\.js$/u);
    await expect(fs.pathExists(path.join(cwd, 'dist', assets.wasmUrl.slice('/nocobase/'.length)))).resolves.toBe(true);
    await expect(
      fs.pathExists(path.join(cwd, 'dist', new URL(workerUrls[0]).pathname.slice('/nocobase/'.length))),
    ).resolves.toBe(true);
  });
});

async function compile(config: Configuration): Promise<void> {
  const compiler = rspack(config);
  await new Promise<void>((resolve, reject) => {
    compiler.run((error, stats) => {
      compiler.close(() => {
        if (error || stats?.hasErrors()) reject(error || new Error(stats?.toString({ all: false, errors: true })));
        else resolve();
      });
    });
  });
}

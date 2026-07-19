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
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildPluginClient } from '../buildPlugin';

const tempDirs: string[] = [];

afterEach(async () => {
  vi.unstubAllGlobals();
  await Promise.all(tempDirs.map((dir) => fs.remove(dir)));
  tempDirs.length = 0;
});

describe('plugin client Worker and WASM build', () => {
  it('resolves emitted assets from the plugin runtime path below a non-root app path', async () => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'nocobase-plugin-worker-wasm-'));
    const packageName = '@nocobase/plugin-worker-wasm-fixture';
    tempDirs.push(cwd);
    await fs.outputJson(path.join(cwd, 'package.json'), { name: packageName, version: '1.0.0' });
    await fs.outputFile(path.join(cwd, 'client-v2.js'), `module.exports = require('./dist/client-v2/index.js');\n`);
    await fs.outputFile(
      path.join(cwd, 'src/client-v2/index.ts'),
      `import wasmUrl from './fixture.wasm?url';
export function createAssets() {
  return { wasmUrl, worker: new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }) };
}
`,
    );
    await fs.outputFile(path.join(cwd, 'src/client-v2/worker.ts'), `self.postMessage('ready');\n`);
    await fs.outputFile(path.join(cwd, 'src/client-v2/fixture.wasm'), Buffer.from([0, 97, 115, 109, 1, 0, 0, 0]));

    await buildPluginClient(cwd, {}, false, () => {}, 'client-v2');

    const publicBase = `/nocobase/static/plugins/${packageName}/dist/client-v2/`;
    const workerUrls: string[] = [];
    vi.stubGlobal('document', {
      baseURI: `https://example.test${publicBase}`,
      currentScript: { src: `https://example.test${publicBase}index.js`, tagName: 'SCRIPT' },
    });
    vi.stubGlobal('window', { location: { pathname: '/nocobase/v/admin' } });
    vi.stubGlobal('self', globalThis);
    vi.stubGlobal(
      'Worker',
      class {
        constructor(url: string | URL) {
          workerUrls.push(String(url));
        }
      },
    );
    const assets = (
      require(path.join(cwd, 'dist/client-v2/index.js')) as {
        createAssets(): { wasmUrl: string };
      }
    ).createAssets();

    expect(assets.wasmUrl).toMatch(
      new RegExp(`^https://example\\.test${escapeRegExp(publicBase)}assets/fixture-[a-f0-9]{8}\\.wasm$`, 'u'),
    );
    expect(workerUrls[0]).toMatch(new RegExp(`^https://example\\.test${escapeRegExp(publicBase)}.+\\.js$`, 'u'));
    await expect(fs.pathExists(toOutputPath(cwd, publicBase, assets.wasmUrl))).resolves.toBe(true);
    await expect(fs.pathExists(toOutputPath(cwd, publicBase, workerUrls[0]))).resolves.toBe(true);
  });
});

function toOutputPath(cwd: string, publicBase: string, url: string): string {
  return path.join(cwd, 'dist/client-v2', new URL(url).pathname.slice(publicBase.length));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

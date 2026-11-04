/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { spawnSync } from 'node:child_process';
import fs from 'fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import buildConfig from '../../../build.config';

vi.mock('@nocobase/build', () => ({ defineConfig: (config: unknown) => config }));

// Run each rendering in a fresh process: PDF.js caches decoder initialization in the worker.
const renderJpx = (wasmUrl = '') => {
  const fixture = path.resolve(__dirname, 'fixtures/jpx-red-square.pdf');
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
        import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
        import { createCanvas } from '@napi-rs/canvas';
        import { readFileSync } from 'node:fs';
        const options = { useWasm: false };
        if (process.argv[2]) {
          options.wasmUrl = process.argv[2];
        }
        const task = getDocument({ data: new Uint8Array(readFileSync(process.argv[1])), ...options });
        try {
          const pdf = await task.promise;
          const page = await pdf.getPage(1);
          const canvas = createCanvas(32, 32);
          const context = canvas.getContext('2d');
          await page.render({ canvas, canvasContext: context, viewport: page.getViewport({ scale: 1 }) }).promise;
          console.log('pixel=' + JSON.stringify(Array.from(context.getImageData(16, 16, 1, 1).data)));
        } finally {
          await task.destroy();
        }
      `,
      fixture,
      wasmUrl,
    ],
    { encoding: 'utf8', timeout: 30000 },
  );
  expect(result.error).toBeUndefined();
  expect(result.status, result.stderr).toBe(0);
  return result.stdout + result.stderr;
};

describe('PDF preview JPEG2000 decoding', () => {
  let outputDir: string;
  const pluginDir = path.resolve(__dirname, '../../..');

  beforeAll(async () => {
    outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nocobase-pdf-jpx-'));
    // Redirect build output to a temporary directory while executing the real resource-copy hook.
    const destination = (target: Parameters<typeof fs.copyFile>[1]) =>
      path.join(outputDir, path.relative(path.join(pluginDir, 'dist'), String(target)));
    const copy = fs.cp.bind(fs);
    const copyFile = fs.copyFile.bind(fs);
    const mkdir = fs.mkdir.bind(fs);
    vi.spyOn(fs, 'cp').mockImplementation((source, target, options) => copy(source, destination(target), options));
    vi.spyOn(fs, 'copyFile').mockImplementation((source, target, mode) => copyFile(source, destination(target), mode));
    vi.spyOn(fs, 'mkdir').mockImplementation((target, options) => mkdir(destination(target), options));
    try {
      await buildConfig.afterBuild(vi.fn());
    } finally {
      vi.restoreAllMocks();
    }
    await fs.writeFile(path.join(outputDir, 'package.json'), JSON.stringify({ type: 'module' }));
  });

  afterAll(async () => {
    if (outputDir) {
      await fs.rm(outputDir, { recursive: true, force: true });
    }
  });

  it('publishes only the OpenJPEG JavaScript decoder and its licenses in the wasm directory', async () => {
    expect((await fs.readdir(path.join(outputDir, 'client/pdfjs/wasm'))).sort()).toEqual([
      'LICENSE_OPENJPEG',
      'LICENSE_PDFJS_OPENJPEG',
      'openjpeg_nowasm_fallback.js',
    ]);
  });

  it('reproduces a silently blank page when the JavaScript decoder URL is missing', () => {
    const output = renderJpx();

    expect(output).toContain('nullopenjpeg_nowasm_fallback.js');
    expect(output).toContain('OpenJPEG failed to initialize');
    expect(output).toContain('pixel=[255,255,255,255]');
  });

  it('renders the red JPX image using the published decoder, even with WASM disabled', () => {
    const output = renderJpx(pathToFileURL(path.join(outputDir, 'client/pdfjs/wasm') + path.sep).href);

    expect(output).not.toContain('OpenJPEG failed to initialize');
    expect(output).toContain('pixel=[255,0,0,255]');
  });
});

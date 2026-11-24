import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { brotliDecompressSync, gunzipSync } from 'node:zlib';
import type { Plugin, Rollup } from 'vite';
import { afterEach, describe, expect, it } from 'vitest';

import { createAppViteConfig } from '../vite/app.ts';
import { precompressAssets } from '../vite/precompress.ts';

const directories: string[] = [];

afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

const writeBundle = async (
  plugin: Plugin,
  dir: string,
  bundle: Rollup.OutputBundle,
): Promise<void> => {
  const hook = plugin.writeBundle as (
    options: { dir: string },
    bundle: Rollup.OutputBundle,
  ) => Promise<void>;
  await hook({ dir }, bundle);
};

describe('precompressAssets', () => {
  it('is part of every application build', async () => {
    const config = await (
      createAppViteConfig({}) as (env: {
        command: 'build';
        mode: string;
      }) => Promise<{ plugins: unknown[] }>
    )({ command: 'build', mode: 'production' });
    expect(
      config.plugins.flat().some(
        (plugin) =>
          (plugin as Plugin | undefined)?.name ===
          'nocobase:precompress-assets',
      ),
    ).toBe(true);
  });

  it('writes Brotli and gzip copies of compressible files only', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'nocobase-precompress-'));
    directories.push(dir);
    const script = 'console.log("compress me");\n'.repeat(200);
    const style = '.a { color: red; }\n'.repeat(200);
    const files = {
      'index.js': script,
      'index.css': style,
      'small.js': 'tiny',
      'image.png': 'x'.repeat(4096),
      'index.js.map': '{}'.repeat(4096),
    };
    for (const [name, content] of Object.entries(files))
      writeFileSync(path.join(dir, name), content);
    const bundle = {
      'index.js': { type: 'chunk', fileName: 'index.js', code: script },
      'index.css': { type: 'asset', fileName: 'index.css', source: style },
      'small.js': { type: 'chunk', fileName: 'small.js', code: 'tiny' },
      'image.png': {
        type: 'asset',
        fileName: 'image.png',
        source: new Uint8Array(Buffer.from(files['image.png'])),
      },
      'index.js.map': {
        type: 'asset',
        fileName: 'index.js.map',
        source: files['index.js.map'],
      },
    } as unknown as Rollup.OutputBundle;

    await writeBundle(precompressAssets(), dir, bundle);

    for (const [name, content] of [
      ['index.js', script],
      ['index.css', style],
    ]) {
      expect(
        brotliDecompressSync(
          readFileSync(path.join(dir, `${name}.br`)),
        ).toString(),
      ).toBe(content);
      expect(
        gunzipSync(readFileSync(path.join(dir, `${name}.gz`))).toString(),
      ).toBe(content);
    }
    const { readdirSync } = await import('node:fs');
    expect(readdirSync(dir).sort()).toEqual(
      [
        'image.png',
        'index.css',
        'index.css.br',
        'index.css.gz',
        'index.js',
        'index.js.br',
        'index.js.gz',
        'index.js.map',
        'small.js',
      ].sort(),
    );
  });
});

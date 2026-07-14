/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { build } from 'esbuild';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { brotliCompressSync, gzipSync } from 'node:zlib';

const repositoryRoot = process.cwd();
const require = createRequire(import.meta.url);
const entryPoint = path.resolve(
  repositoryRoot,
  'packages/core/client-v2/src/flow/components/code-editor/typescriptProject.ts',
);
const runJSClientEntry = path.resolve(repositoryRoot, 'packages/core/runjs/src/client-v2/index.ts');

const result = await build({
  bundle: true,
  entryPoints: [entryPoint],
  external: ['@codemirror/*', 'typescript'],
  format: 'esm',
  minify: true,
  platform: 'browser',
  plugins: [
    {
      name: 'runjs-baseline-resolver',
      setup(buildApi) {
        buildApi.onResolve({ filter: /^@nocobase\/runjs\/client-v2$/u }, () => ({ path: runJSClientEntry }));
        buildApi.onResolve({ filter: /\.d\.ts\?raw$/u }, (args) => ({
          namespace: 'runjs-raw-declaration',
          path: require.resolve(args.path.replace(/\?raw$/u, '')),
        }));
        buildApi.onLoad({ filter: /.*/u, namespace: 'runjs-raw-declaration' }, async (args) => ({
          contents: await fs.readFile(args.path, 'utf8'),
          loader: 'text',
        }));
      },
    },
  ],
  treeShaking: true,
  write: false,
});

const output = result.outputFiles[0].contents;
console.info(
  JSON.stringify(
    {
      brotliBytes: brotliCompressSync(output).byteLength,
      gzipBytes: gzipSync(output).byteLength,
      measurement: 'isolated-minified-editor-typescript-support-chunk',
      rawBytes: output.byteLength,
      typescriptRuntime: 'external dynamic import',
    },
    null,
    2,
  ),
);

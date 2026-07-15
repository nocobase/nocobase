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
const typePackManifestPath = path.resolve(
  repositoryRoot,
  'packages/core/client-v2/src/flow/components/code-editor/type-packs/generated/manifest.ts',
);
const frozenBaselineGzipBytes = 232385;
const initialGzipIncrementBudgetBytes = 50 * 1024;
const declarationGraphRawBudgetBytes = 8 * 1024 * 1024;
const declarationGraphGzipBudgetBytes = 2 * 1024 * 1024;
const declarationGraphChunkBudget = 60;

const declarationMarkers = {
  antd: 'InternalCompoundedButton',
  'antd-bridge': "readonly Button: typeof import('antd/es/button').default;",
  'antd-icons': 'AccountBookFilled',
  react: 'DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_REACT_NODES',
  'react-bridge': "type RunJSOfficialReactModule = typeof import('react');",
};

const result = await build({
  bundle: true,
  entryPoints: [entryPoint],
  external: ['@codemirror/*', 'typescript'],
  format: 'esm',
  minify: true,
  metafile: true,
  outdir: 'runjs-typescript-support',
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
  splitting: true,
  treeShaking: true,
  write: false,
});

const outputs = result.outputFiles.map((outputFile) => {
  const relativePath = path.relative(repositoryRoot, outputFile.path);
  const metadata = result.metafile.outputs[relativePath];
  return {
    contents: outputFile.contents,
    entryPoint: metadata?.entryPoint,
    inputs: Object.keys(metadata?.inputs || {}),
    path: relativePath,
    rawBytes: outputFile.contents.byteLength,
  };
});
const initialOutput = outputs.find((output) => output.entryPoint === path.relative(repositoryRoot, entryPoint));
if (!initialOutput) {
  throw new Error('Unable to identify the RunJS TypeScript support entry chunk.');
}
const asyncOutputs = outputs.filter((output) => output !== initialOutput);
const bufferView = (contents) => Buffer.from(contents.buffer, contents.byteOffset, contents.byteLength);
const markerLocations = Object.fromEntries(
  Object.entries(declarationMarkers).map(([name, marker]) => [
    name,
    outputs.filter((output) => bufferView(output.contents).includes(marker)).map((output) => output.path),
  ]),
);
const declarationBodiesExcludedFromInitialChunk = Object.values(declarationMarkers).every(
  (marker) => !bufferView(initialOutput.contents).includes(marker),
);
const initialBrotliBytes = brotliCompressSync(initialOutput.contents).byteLength;
const initialGzipBytes = gzipSync(initialOutput.contents).byteLength;
const initialGzipIncrementBytes = initialGzipBytes - frozenBaselineGzipBytes;
const declarationGraphOutputs = asyncOutputs.filter((output) =>
  output.inputs.some((input) => input.includes('/type-packs/generated/graphs/')),
);
const declarationGraphRawBytes = declarationGraphOutputs.reduce((total, output) => total + output.rawBytes, 0);
const declarationGraphGzipBytes = declarationGraphOutputs.reduce(
  (total, output) => total + gzipSync(output.contents).byteLength,
  0,
);
const declarationGraphBrotliBytes = declarationGraphOutputs.reduce(
  (total, output) => total + brotliCompressSync(output.contents).byteLength,
  0,
);
const manifestSource = await fs.readFile(typePackManifestPath, 'utf8');
const manifestExportStart = manifestSource.indexOf('export const generatedRunJSTypeLibraryPackManifest');
const manifestAssignmentStart = manifestSource.indexOf('= [', manifestExportStart);
const manifestArrayStart = manifestAssignmentStart + 2;
const manifestArrayEnd = manifestSource.lastIndexOf('];');
if (manifestExportStart < 0 || manifestAssignmentStart < 0 || manifestArrayEnd < manifestArrayStart) {
  throw new Error('Unable to parse the generated RunJS type-pack manifest.');
}
const manifest = JSON.parse(manifestSource.slice(manifestArrayStart, manifestArrayEnd + 1));
const declarationGraphHashes = new Set(manifest.map((entry) => entry.graphHash));
const packCount = manifest.length;
const declarationGraphCount = declarationGraphHashes.size;
const packsShareDeclarationGraphs = declarationGraphCount < packCount;
const declarationGraphChunksMatchManifest = declarationGraphOutputs.length === declarationGraphCount;

console.info(
  JSON.stringify(
    {
      asyncChunks: {
        count: asyncOutputs.length,
        declarationGraphChunkCount: declarationGraphOutputs.length,
        rawBytes: asyncOutputs.reduce((total, output) => total + output.rawBytes, 0),
      },
      budgets: {
        declarationGraphChunkCount: declarationGraphOutputs.length,
        declarationGraphChunkLimit: declarationGraphChunkBudget,
        declarationGraphChunksMatchManifest,
        declarationGraphChunkWithinBudget:
          declarationGraphChunksMatchManifest && declarationGraphOutputs.length <= declarationGraphChunkBudget,
        declarationGraphGzipBytes,
        declarationGraphGzipLimitBytes: declarationGraphGzipBudgetBytes,
        declarationGraphGzipWithinBudget: declarationGraphGzipBytes <= declarationGraphGzipBudgetBytes,
        declarationGraphRawBytes,
        declarationGraphRawLimitBytes: declarationGraphRawBudgetBytes,
        declarationGraphRawWithinBudget: declarationGraphRawBytes <= declarationGraphRawBudgetBytes,
        declarationBodiesExcludedFromInitialChunk,
        initialGzipIncrementBytes,
        initialGzipIncrementLimitBytes: initialGzipIncrementBudgetBytes,
        initialGzipWithinBudget: initialGzipIncrementBytes <= initialGzipIncrementBudgetBytes,
        packsShareDeclarationGraphs,
      },
      declarationGraphs: {
        brotliBytes: declarationGraphBrotliBytes,
        chunkCount: declarationGraphOutputs.length,
        gzipBytes: declarationGraphGzipBytes,
        manifestCount: declarationGraphCount,
        rawBytes: declarationGraphRawBytes,
      },
      declarationMarkerLocations: markerLocations,
      initialChunk: {
        brotliBytes: initialBrotliBytes,
        gzipBytes: initialGzipBytes,
        path: initialOutput.path,
        rawBytes: initialOutput.rawBytes,
      },
      measurement: 'code-split-minified-editor-typescript-support',
      outputCount: outputs.length,
      packCount,
      frozenBaselineGzipBytes,
      typescriptRuntime: 'external dynamic import',
    },
    null,
    2,
  ),
);

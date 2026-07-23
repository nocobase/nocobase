import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const expectedCategories = [
  'initial-client',
  'client-v2',
  'code-editor',
  'typescript-worker',
  'declaration-assets',
  'server',
  'compile-worker',
] as const;

type Category = (typeof expectedCategories)[number];
type BundleMetafile = {
  inputs: Record<string, { bytes: number }>;
  outputs: Record<string, { entryPoint?: string; inputs: Record<string, { bytesInOutput: number }> }>;
};
type BundleResult = {
  allGzipBytes: number;
  allOutputFiles: number;
  allRawBytes: number;
  entryGzipBytes: number;
  entryOutputFiles: number;
  entryRawBytes: number;
  metafile: BundleMetafile;
};
type BundleSpec = { entry: string; packages?: 'external'; platform: 'browser' | 'node'; target: string };
type Evidence = {
  attribution?: Record<string, unknown>;
  availabilityDecision: string;
  available: boolean;
  category: Category;
  files: number;
  gzipBytes: number;
  measurementMethod: string;
  rawBytes: number;
  sourcePaths: string[];
};

const entries = {
  'code-editor': 'packages/core/client-v2/src/flow/components/code-editor/index.tsx',
  'compile-worker':
    'packages/plugins/@nocobase/plugin-light-extension/src/server/services/LightExtensionCompileWorker.ts',
  server: 'packages/plugins/@nocobase/plugin-light-extension/src/server/index.ts',
  'typescript-worker': 'packages/core/client-v2/src/flow/components/code-editor/typescriptProject.worker.ts',
} as const;
const declarationEntries = [
  'packages/core/client-v2/src/flow/components/code-editor/generated/runJSTypeScriptEnvironmentFiles.ts',
  'packages/core/client-v2/src/flow/components/code-editor/runJSTypeScriptLibSources.ts',
] as const;

function filesUnder(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules') return [];
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(target) : [target];
  });
}

function noGo(category: Category, method: string, paths: string | string[]): Evidence {
  const sourcePaths = Array.isArray(paths) ? paths : [paths];
  return {
    availabilityDecision: `No-Go: missing ${sourcePaths.join(' or ')}`,
    available: false,
    category,
    files: 0,
    gzipBytes: 0,
    measurementMethod: method,
    rawBytes: 0,
    sourcePaths,
  };
}

function builtOutputEvidence(category: 'initial-client' | 'client-v2', root: string): Evidence {
  const files = filesUnder(root).filter((file) => /\.(?:[cm]?js|css|wasm)$/u.test(file));
  if (!files.length) return noGo(category, 'built-output-directory-sum', path.relative(process.cwd(), root));
  const contents = files.map((file) => readFileSync(file));
  return {
    availabilityDecision: 'Measured',
    available: true,
    category,
    files: files.length,
    gzipBytes: contents.reduce((sum, content) => sum + gzipSync(content).byteLength, 0),
    measurementMethod: 'built-output-directory-sum',
    rawBytes: contents.reduce((sum, content) => sum + content.byteLength, 0),
    sourcePaths: files.map((file) => path.relative(process.cwd(), file).replaceAll(path.sep, '/')),
  };
}

function bundle(specs: BundleSpec[]): Record<string, BundleResult> {
  const script = `
    import { readFile } from 'node:fs/promises';
    import { createRequire } from 'node:module';
    import path from 'node:path';
    import { gzipSync } from 'node:zlib';
    import { build } from 'esbuild';
    const require = createRequire(import.meta.url);
    const rawTypeScriptLibraries = {
      name: 'raw-typescript-library',
      setup(buildApi) {
        buildApi.onResolve({ filter: /\\.d\\.ts\\?raw$/u }, (args) => ({
          namespace: 'raw-typescript-library',
          path: require.resolve(args.path.slice(0, -4), { paths: [args.resolveDir] }),
        }));
        buildApi.onLoad({ filter: /.*/u, namespace: 'raw-typescript-library' }, async (args) => ({
          contents: await readFile(args.path, 'utf8'),
          loader: 'text',
        }));
      },
    };
    const results = {};
    for (const spec of ${JSON.stringify(specs)}) {
      const result = await build({
        absWorkingDir: process.cwd(),
        bundle: true,
        entryPoints: [spec.entry],
        entryNames: 'entry',
        format: 'esm',
        logLevel: 'silent',
        metafile: true,
        packages: spec.packages,
        platform: spec.platform,
        plugins: [rawTypeScriptLibraries],
        splitting: true,
        target: spec.target,
        write: false,
        outdir: 'runjs-performance-out',
      });
      const rootEntry = path.resolve(spec.entry);
      const entryOutputs = new Set(
        Object.entries(result.metafile.outputs)
          .filter(([, output]) => output.entryPoint && path.resolve(output.entryPoint) === rootEntry)
          .map(([output]) => path.resolve(output)),
      );
      const entryFiles = result.outputFiles.filter((output) => entryOutputs.has(output.path));
      results[spec.entry] = {
        allGzipBytes: result.outputFiles.reduce((sum, output) => sum + gzipSync(output.contents).byteLength, 0),
        allOutputFiles: result.outputFiles.length,
        allRawBytes: result.outputFiles.reduce((sum, output) => sum + output.contents.byteLength, 0),
        entryGzipBytes: entryFiles.reduce((sum, output) => sum + gzipSync(output.contents).byteLength, 0),
        entryOutputFiles: entryFiles.length,
        entryRawBytes: entryFiles.reduce((sum, output) => sum + output.contents.byteLength, 0),
        metafile: result.metafile,
      };
    }
    process.stdout.write(JSON.stringify(results));
  `;
  return JSON.parse(
    execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
      cwd: process.cwd(),
      encoding: 'utf8',
      maxBuffer: 100 * 1024 ** 2,
    }),
  ) as Record<string, BundleResult>;
}

function inputPaths(metafile: BundleMetafile): Set<string> {
  return new Set(Object.keys(metafile.inputs));
}

function attributedBytes(metafile: BundleMetafile, inputs: ReadonlySet<string>): number {
  return Object.values(metafile.outputs).reduce(
    (total, output) =>
      total +
      Object.entries(output.inputs).reduce(
        (sum, [input, contribution]) => sum + (inputs.has(input) ? contribution.bytesInOutput : 0),
        0,
      ),
    0,
  );
}

function entryAttributedBytes(metafile: BundleMetafile, entry: string, inputs: ReadonlySet<string>): number {
  const rootEntry = path.resolve(entry);
  return Object.values(metafile.outputs)
    .filter((output) => output.entryPoint && path.resolve(output.entryPoint) === rootEntry)
    .reduce(
      (total, output) =>
        total +
        Object.entries(output.inputs).reduce(
          (sum, [input, contribution]) => sum + (inputs.has(input) ? contribution.bytesInOutput : 0),
          0,
        ),
      0,
    );
}

function isolatedEntryEvidence(
  category: Exclude<Category, 'initial-client' | 'client-v2' | 'declaration-assets'>,
  entry: string,
  result: BundleResult | undefined,
  declarationInputs: ReadonlySet<string>,
): Evidence {
  if (!existsSync(entry)) return noGo(category, 'isolated-production-entry-esbuild-bundle', entry);
  if (!result) throw new Error(`Missing esbuild result for ${entry}`);
  return {
    attribution: {
      allOutputFiles: result.allOutputFiles,
      allOutputsGzipBytes: result.allGzipBytes,
      allOutputsRawBytes: result.allRawBytes,
      declarationAssetBytesInAllOutputs: attributedBytes(result.metafile, declarationInputs),
      declarationAssetBytesInAsyncOutputs:
        attributedBytes(result.metafile, declarationInputs) -
        entryAttributedBytes(result.metafile, entry, declarationInputs),
      declarationAssetBytesInEntryOutput: entryAttributedBytes(result.metafile, entry, declarationInputs),
      declarationAssetInputCount: [...declarationInputs].filter((input) => input in result.metafile.inputs).length,
    },
    availabilityDecision: 'Measured',
    available: true,
    category,
    files: result.entryOutputFiles,
    gzipBytes: result.entryGzipBytes,
    measurementMethod: 'isolated-production-entry-esbuild-entry-output',
    rawBytes: result.entryRawBytes,
    sourcePaths: [entry],
  };
}

function collectEvidence(): Evidence[] {
  const declarationEntry = declarationEntries.find((entry) => existsSync(entry)) ?? declarationEntries[0];
  const specs: BundleSpec[] = [
    { entry: entries['code-editor'], packages: 'external', platform: 'browser', target: 'es2022' },
    { entry: entries['typescript-worker'], platform: 'browser', target: 'es2022' },
    { entry: declarationEntry, packages: 'external', platform: 'browser', target: 'es2022' },
    { entry: entries.server, packages: 'external', platform: 'node', target: 'node18' },
    { entry: entries['compile-worker'], packages: 'external', platform: 'node', target: 'node18' },
  ].filter((spec) => existsSync(spec.entry));
  const results = bundle(specs);
  const declarationResult = results[declarationEntry];
  const declarationInputs = declarationResult ? inputPaths(declarationResult.metafile) : new Set<string>();
  const codeEditor = isolatedEntryEvidence(
    'code-editor',
    entries['code-editor'],
    results[entries['code-editor']],
    declarationInputs,
  );
  const typeScriptWorker = isolatedEntryEvidence(
    'typescript-worker',
    entries['typescript-worker'],
    results[entries['typescript-worker']],
    declarationInputs,
  );
  const declarations: Evidence = declarationResult
    ? {
        attribution: {
          codeEditorBytesInOutput: attributedBytes(results[entries['code-editor']].metafile, declarationInputs),
          inputCount: declarationInputs.size,
          overlapPolicy: 'attributable subset of isolated CodeEditor and TypeScript Worker entry bundles; do not sum',
          typeScriptWorkerBytesInAllOutputs: typeScriptWorker.attribution?.declarationAssetBytesInAllOutputs ?? 0,
          typeScriptWorkerBytesInEntryOutput: typeScriptWorker.attribution?.declarationAssetBytesInEntryOutput ?? 0,
        },
        availabilityDecision: 'Measured',
        available: true,
        category: 'declaration-assets',
        files: declarationResult.entryOutputFiles,
        gzipBytes: declarationResult.entryGzipBytes,
        measurementMethod: 'isolated-production-declaration-module-esbuild-bundle',
        rawBytes: declarationResult.entryRawBytes,
        sourcePaths: [declarationEntry],
      }
    : noGo('declaration-assets', 'isolated-production-declaration-module-esbuild-bundle', [...declarationEntries]);
  return [
    builtOutputEvidence('initial-client', path.join(process.cwd(), 'packages/core/client/lib')),
    builtOutputEvidence('client-v2', path.join(process.cwd(), 'packages/core/client-v2/lib')),
    codeEditor,
    typeScriptWorker,
    declarations,
    isolatedEntryEvidence('server', entries.server, results[entries.server], declarationInputs),
    isolatedEntryEvidence(
      'compile-worker',
      entries['compile-worker'],
      results[entries['compile-worker']],
      declarationInputs,
    ),
  ];
}

function writeMeasurement(metrics: Record<string, unknown>): void {
  const output = process.env.RUNJS_PERF_SAMPLE_OUTPUT;
  if (!output) throw new Error('RUNJS_PERF_SAMPLE_OUTPUT is required');
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(
    output,
    `${JSON.stringify(
      { schemaVersion: 1, probe: 'client-bundle', phase: process.env.RUNJS_PERF_PHASE, metrics },
      null,
      2,
    )}\n`,
  );
}

describe('RunJS client bundle performance probe', () => {
  it('records attributable raw and gzip sizes for seven production asset categories', () => {
    const assets = collectEvidence();
    const totals = Object.fromEntries(assets.map(({ category, ...evidence }) => [category, evidence]));

    expect(assets.map((asset) => asset.category)).toEqual(expectedCategories);
    expect(Object.keys(totals)).toEqual(expectedCategories);
    expect(totals['code-editor'].sourcePaths).not.toEqual(totals['client-v2'].sourcePaths);
    expect(totals['typescript-worker'].sourcePaths).not.toEqual(totals['client-v2'].sourcePaths);
    for (const asset of assets.filter((item) => item.available && item.measurementMethod.includes('entry-output'))) {
      expect(asset.files).toBe(1);
    }
    writeMeasurement({
      assets,
      missingCategories: assets.filter((asset) => !asset.available).map((asset) => asset.category),
      totals,
    });
  });
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { build } from 'esbuild';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import http from 'node:http';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { chromium } from 'playwright';

const repositoryRoot = process.cwd();
const require = createRequire(import.meta.url);
const execFileAsync = promisify(execFile);
const defaultOutputDirectory = path.resolve(repositoryRoot, 'node_modules/.cache/runjs-typescript-performance');
const temporaryBuildDirectory = path.resolve(
  repositoryRoot,
  `node_modules/.cache/runjs-typescript-benchmark-${process.pid}`,
);
const typeScriptProjectEntry = path.resolve(
  repositoryRoot,
  'packages/core/client-v2/src/flow/components/code-editor/typescriptProject.ts',
);
const typeScriptWorkerEntry = path.resolve(
  repositoryRoot,
  'packages/core/client-v2/src/flow/components/code-editor/typescriptProject.worker.ts',
);
const typeScriptMetricsEntry = path.resolve(
  repositoryRoot,
  'packages/core/client-v2/src/flow/components/code-editor/typescriptMetrics.ts',
);
const typeScriptRegistryEntry = path.resolve(
  repositoryRoot,
  'packages/core/client-v2/src/flow/components/code-editor/typescriptLibraryRegistry.ts',
);
const runJSClientEntry = path.resolve(repositoryRoot, 'packages/core/runjs/src/client-v2/index.ts');
const chunkMeasurementScript = path.resolve(
  repositoryRoot,
  'packages/core/client-v2/src/flow/components/code-editor/__tests__/measure-runjs-typescript-chunk.mjs',
);
const typeScriptRuntimeEntry = require.resolve('typescript/lib/typescript.js');
const reservedBindings = new Set([
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'let',
  'new',
  'null',
  'return',
  'static',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
]);

const scenarios = [
  {
    code: 'ctx.logger.info("ready");',
    id: 'ordinary',
    label: '普通 RunJS',
  },
  {
    code: 'const view = ctx.React.createElement("div", null, "Ready"); void view;',
    id: 'react',
    label: 'React',
  },
  {
    code: 'const root = ctx.ReactDOM.createRoot(ctx.element); root.render(<div />); root.unmount();',
    id: 'react-dom',
    label: 'ReactDOM',
  },
  {
    code: 'const value = ctx.dayjs("2026-07-14").add(1, "day"); void value;',
    id: 'dayjs',
    label: 'dayjs',
  },
  {
    code: 'const value = ctx.libs.lodash.get({ nested: { value: 1 } }, "nested.value"); void value;',
    id: 'lodash',
    label: 'lodash',
  },
  {
    code: 'const { Button } = ctx.libs.antd; const view = <Button type="primary">Save</Button>; void view;',
    id: 'antd-button',
    label: 'antd/Button（React 热）',
    warmupCode: 'const view = ctx.React.createElement("div"); void view;',
  },
  {
    code: `
const { Button, Input, Table } = ctx.libs.antd;
interface Row { id: number; name: string }
const view = <><Button>Save</Button><Input /><Table<Row> dataSource={[]} rowKey="id" /></>;
void view;
`,
    id: 'antd-multiple',
    label: 'Ant Design 多组件（React 热）',
    warmupCode: 'const view = ctx.React.createElement("div"); void view;',
  },
  {
    code: 'const { PlusOutlined } = ctx.libs.antdIcons; const view = <PlusOutlined />; void view;',
    id: 'icon-single',
    label: '单图标分组（React 热）',
    warmupCode: 'const view = ctx.React.createElement("div"); void view;',
  },
  {
    code: `
const { MinusOutlined, PlusOutlined } = ctx.libs.antdIcons;
const view = <><MinusOutlined /><PlusOutlined /></>;
void view;
`,
    id: 'icon-cross-group',
    label: '跨组图标（React 热）',
    warmupCode: 'const view = ctx.React.createElement("div"); void view;',
  },
  {
    code: `
const componentKey = ctx.settings.componentName as string;
const iconKey = ctx.settings.iconName as string;
const component = ctx.libs.antd[componentKey];
const icon = ctx.libs.antdIcons[iconKey];
const known = ctx.libs.antd.Button;
void component; void icon; void known;
`,
    id: 'full-fallback',
    label: 'antd + icons full fallback（React 热）',
    warmupCode: 'const view = ctx.React.createElement("div"); void view;',
  },
];

function parseArguments(args) {
  const options = {
    outputDirectory: defaultOutputDirectory,
    samples: 20,
    scenarioIds: scenarios.map((scenario) => scenario.id),
  };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--samples') {
      options.samples = Number(args[index + 1]);
      index += 1;
      continue;
    }
    if (argument === '--scenarios') {
      options.scenarioIds = String(args[index + 1] || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      index += 1;
      continue;
    }
    if (argument === '--output-dir') {
      options.outputDirectory = path.resolve(repositoryRoot, args[index + 1]);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  if (!Number.isInteger(options.samples) || options.samples < 1) {
    throw new Error('--samples must be a positive integer.');
  }
  const knownIds = new Set(scenarios.map((scenario) => scenario.id));
  for (const id of options.scenarioIds) {
    if (!knownIds.has(id)) throw new Error(`Unknown benchmark scenario: ${id}`);
  }
  return options;
}

function percentile(values, percentage) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(sorted.length * percentage) - 1)];
}

function summarizeDurations(values) {
  return {
    p50: percentile(values, 0.5),
    p95: percentile(values, 0.95),
    samples: values.length,
  };
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function createHarnessSource(workerUrl) {
  return `
import {
  clearTypeScriptProjectCachesForTests,
  createTypeScriptProjectSession,
} from ${JSON.stringify(typeScriptProjectEntry)};
import { createRunJSTypeScriptMetrics } from ${JSON.stringify(typeScriptMetricsEntry)};
import { clearRunJSTypeLibraryPackRegistryForTests } from ${JSON.stringify(typeScriptRegistryEntry)};

const scenarios = ${JSON.stringify(Object.fromEntries(scenarios.map((scenario) => [scenario.id, scenario])))};
const states = new Map();
globalThis.__NOCOBASE_RUNJS_TYPESCRIPT_WORKER__ = true;
globalThis.__NOCOBASE_RUNJS_TYPESCRIPT_WORKER_URL__ = ${JSON.stringify(workerUrl)};

function createProject(code, metrics) {
  return {
    currentFilePath: 'src/benchmark.tsx',
    files: [{ path: 'src/benchmark.tsx', content: code }],
    metrics,
    runJSContext: { modelUse: 'JSBlockModel' },
  };
}

async function flushPerformanceEntries() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function operationDuration(snapshot, operation) {
  return snapshot.durationSamples.find((sample) => sample.operation === operation)?.durationMs || 0;
}

function scriptResources() {
  const resources = performance.getEntriesByType('resource').filter((entry) => entry.initiatorType === 'script');
  return {
    count: resources.length,
    decodedBodyBytes: resources.reduce((sum, entry) => sum + (entry.decodedBodySize || 0), 0),
    maxDurationMs: Math.max(0, ...resources.map((entry) => entry.duration)),
    transferBytes: resources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0),
  };
}

window.runColdScenario = async (scenarioId) => {
  const scenario = scenarios[scenarioId];
  if (!scenario) throw new Error('Unknown scenario: ' + scenarioId);
  clearRunJSTypeLibraryPackRegistryForTests();
  clearTypeScriptProjectCachesForTests();
  performance.clearResourceTimings();
  const session = createTypeScriptProjectSession();
  if (scenario.warmupCode) {
    const warmupProject = createProject(scenario.warmupCode);
    await session.getDiagnostics(warmupProject, scenario.warmupCode);
  }
  const metrics = createRunJSTypeScriptMetrics({ enabled: true });
  const stopLongTaskObservation = metrics.startLongTaskObservation();
  const project = createProject(scenario.code, metrics);
  const diagnosticStartedAt = performance.now();
  const diagnostics = await session.getDiagnostics(project, scenario.code);
  const firstDiagnosticsMs = performance.now() - diagnosticStartedAt;
  const completion = await session.getCompletionResult(project, scenario.code.length, scenario.code, true);
  const hoverPosition = Math.max(0, scenario.code.indexOf('ctx') + 3);
  const hover = await session.getHover(project, hoverPosition, scenario.code);
  await flushPerformanceEntries();
  stopLongTaskObservation();
  const snapshot = metrics.snapshot();
  states.set(scenarioId, { code: scenario.code, project, session });
  return {
    completionCount: completion?.options.length || 0,
    completionMs: operationDuration(snapshot, 'completion'),
    diagnosticCount: diagnostics.length,
    firstDiagnosticsMs,
    hoverFound: Boolean(hover),
    hoverMs: operationDuration(snapshot, 'hover'),
    metrics: snapshot,
    resources: scriptResources(),
  };
};

window.runHotScenario = async (scenarioId, iteration) => {
  const state = states.get(scenarioId);
  if (!state) throw new Error('Cold scenario must run before hot samples: ' + scenarioId);
  const metrics = createRunJSTypeScriptMetrics({ enabled: true });
  const editedCode = state.code + '\\n// hot sample ' + iteration;
  state.project.metrics = metrics;
  const startedAt = performance.now();
  const diagnostics = await state.session.getDiagnostics(state.project, editedCode);
  const diagnosticsMs = performance.now() - startedAt;
  return {
    diagnosticCount: diagnostics.length,
    diagnosticsMs,
    metrics: metrics.snapshot(),
  };
};

window.__runjsBenchmarkReady = true;
`;
}

function createTypeScriptEsmProxySource() {
  const typeScript = require(typeScriptRuntimeEntry);
  const names = Object.keys(typeScript)
    .filter((name) => /^[$A-Z_a-z][$\w]*$/u.test(name) && !reservedBindings.has(name))
    .sort((left, right) => left.localeCompare(right));
  return [
    `import typeScript from ${JSON.stringify(typeScriptRuntimeEntry)};`,
    'export default typeScript;',
    ...names.map((name) => `export const ${name} = typeScript[${JSON.stringify(name)}];`),
  ].join('\n');
}

async function buildBrowserHarness() {
  await fs.rm(temporaryBuildDirectory, { force: true, recursive: true });
  await fs.mkdir(temporaryBuildDirectory, { recursive: true });
  const createPlugins = () => [
    {
      name: 'runjs-benchmark-resolver',
      setup(buildApi) {
        buildApi.onResolve({ filter: /^typescript$/u }, () => ({
          namespace: 'runjs-typescript-esm-proxy',
          path: 'typescript',
        }));
        buildApi.onLoad({ filter: /.*/u, namespace: 'runjs-typescript-esm-proxy' }, () => ({
          contents: createTypeScriptEsmProxySource(),
          loader: 'js',
          resolveDir: repositoryRoot,
        }));
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
  ];
  const workerResult = await build({
    bundle: true,
    chunkNames: 'chunks/[name]-[hash]',
    define: {
      'process.env.NODE_ENV': JSON.stringify('test'),
    },
    entryNames: 'typescript-worker-[hash]',
    entryPoints: [typeScriptWorkerEntry],
    format: 'esm',
    metafile: true,
    minify: true,
    outdir: temporaryBuildDirectory,
    platform: 'browser',
    plugins: createPlugins(),
    splitting: true,
    treeShaking: true,
    write: true,
  });
  const workerEntryOutput = Object.entries(workerResult.metafile.outputs).find(([, output]) =>
    Boolean(output.entryPoint),
  );
  if (!workerEntryOutput) throw new Error('Unable to find the TypeScript worker benchmark output.');
  const workerUrl = `/${path.relative(temporaryBuildDirectory, workerEntryOutput[0]).split(path.sep).join('/')}`;
  const result = await build({
    bundle: true,
    chunkNames: 'chunks/[name]-[hash]',
    define: {
      'process.env.NODE_ENV': JSON.stringify('test'),
    },
    entryNames: 'benchmark-[hash]',
    format: 'esm',
    metafile: true,
    minify: true,
    outdir: temporaryBuildDirectory,
    platform: 'browser',
    plugins: createPlugins(),
    splitting: true,
    stdin: {
      contents: createHarnessSource(workerUrl),
      loader: 'js',
      resolveDir: repositoryRoot,
      sourcefile: 'runjs-typescript-performance-harness.js',
    },
    treeShaking: true,
    write: true,
  });
  const entryOutput = Object.entries(result.metafile.outputs).find(
    ([, output]) => output.entryPoint === 'runjs-typescript-performance-harness.js',
  );
  if (!entryOutput) throw new Error('Unable to find the browser benchmark entry output.');
  const entryPath = path.basename(entryOutput[0]);
  await fs.writeFile(
    path.join(temporaryBuildDirectory, 'index.html'),
    `<!doctype html><html><body><script type="module" src="/${entryPath}"></script></body></html>`,
  );
  const outputs = [...Object.entries(result.metafile.outputs), ...Object.entries(workerResult.metafile.outputs)];
  return {
    declarationGraphChunkCount: outputs.filter(([, output]) =>
      Object.keys(output.inputs).some((input) => input.includes('/type-packs/generated/graphs/')),
    ).length,
    initialRawBytes: entryOutput[1].bytes,
    outputCount: outputs.length,
  };
}

function contentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (filePath.endsWith('.map')) return 'application/json; charset=utf-8';
  return 'application/octet-stream';
}

async function startStaticServer() {
  const server = http.createServer(async (request, response) => {
    const requestPath = new URL(request.url || '/', 'http://127.0.0.1').pathname;
    const relativePath = requestPath === '/' ? 'index.html' : requestPath.slice(1);
    const filePath = path.resolve(temporaryBuildDirectory, relativePath);
    if (!filePath.startsWith(`${temporaryBuildDirectory}${path.sep}`)) {
      response.writeHead(403).end();
      return;
    }
    try {
      const contents = await fs.readFile(filePath);
      response.writeHead(200, {
        'cache-control': 'no-store',
        'content-type': contentType(filePath),
      });
      response.end(contents);
    } catch (_) {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Unable to start benchmark server.');
  return {
    close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
    url: `http://127.0.0.1:${address.port}`,
  };
}

async function openBenchmarkPage(browser, url) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const initializationErrors = [];
  page.on('pageerror', (error) => initializationErrors.push(error.message));
  await page.goto(url, { waitUntil: 'load' });
  if (initializationErrors.length) {
    await context.close();
    throw new Error(`Browser benchmark harness failed to initialize: ${initializationErrors.join('; ')}`);
  }
  try {
    await page.waitForFunction(() => window.__runjsBenchmarkReady === true, undefined, { timeout: 120000 });
  } catch (error) {
    await context.close();
    throw new Error(`Browser benchmark harness failed to initialize: ${initializationErrors.join('; ')}`, {
      cause: error,
    });
  }
  return { context, page };
}

function collectLongTasks(samples) {
  return samples.flatMap((sample) => sample.metrics.longTasks || []);
}

function collectPackLoadDurations(samples) {
  return samples.flatMap((sample) => Object.values(sample.metrics.packLoadDurationMs || {}).flat());
}

function summarizeScenario(scenario, coldSamples, hotSamples) {
  const coldLongTasks = collectLongTasks(coldSamples);
  const hotLongTasks = collectLongTasks(hotSamples);
  const allLongTasks = [...coldLongTasks, ...hotLongTasks];
  return {
    actualLoadIds: uniqueSorted(coldSamples.flatMap((sample) => sample.metrics.actualLoadIds)),
    cacheHitIds: uniqueSorted(hotSamples.flatMap((sample) => sample.metrics.cacheHitIds)),
    coldCompletionMs: summarizeDurations(coldSamples.map((sample) => sample.completionMs)),
    coldDiagnosticsMs: summarizeDurations(coldSamples.map((sample) => sample.firstDiagnosticsMs)),
    coldHoverMs: summarizeDurations(coldSamples.map((sample) => sample.hoverMs)),
    coldPackLoadMs: summarizeDurations(collectPackLoadDurations(coldSamples)),
    coldScriptDecodedBodyBytes: summarizeDurations(coldSamples.map((sample) => sample.resources.decodedBodyBytes)),
    coldScriptMaxResourceDurationMs: summarizeDurations(coldSamples.map((sample) => sample.resources.maxDurationMs)),
    coldScriptTransferBytes: summarizeDurations(coldSamples.map((sample) => sample.resources.transferBytes)),
    dependencyFileCount: Math.max(...coldSamples.map((sample) => sample.metrics.dependencyFileCount)),
    hotDiagnosticsMs: summarizeDurations(hotSamples.map((sample) => sample.diagnosticsMs)),
    hotLanguageServiceRebuildCount: hotSamples.reduce(
      (total, sample) => total + sample.metrics.languageServiceRebuildCount,
      0,
    ),
    id: scenario.id,
    immutableCacheCharacterCount: Math.max(...coldSamples.map((sample) => sample.metrics.immutableCacheCharacterCount)),
    label: scenario.label,
    longTaskCount: allLongTasks.length,
    maxLongTaskMs: Math.max(0, ...allLongTasks.map((sample) => sample.durationMs)),
    packRequestIds: uniqueSorted(coldSamples.flatMap((sample) => sample.metrics.packRequestIds)),
    peakDeclarationCharacterCount: Math.max(
      ...coldSamples.map((sample) => sample.metrics.peakDeclarationCharacterCount),
    ),
    programSourceFileCount: Math.max(...coldSamples.map((sample) => sample.metrics.programSourceFileCount)),
  };
}

async function measureInitialChunk() {
  const { stdout } = await execFileAsync(process.execPath, [chunkMeasurementScript], {
    cwd: repositoryRoot,
    maxBuffer: 10 * 1024 * 1024,
  });
  return JSON.parse(stdout);
}

function budgetResult(id, actual, budget, passed, policy, unit, source = 'browser-benchmark') {
  return { actual, budget, id, passed, policy, source, unit };
}

function evaluateBudgets(summaries, chunkMeasurement) {
  const byId = new Map(summaries.map((summary) => [summary.id, summary]));
  const ordinary = byId.get('ordinary');
  const react = byId.get('react');
  const antdButton = byId.get('antd-button');
  const iconSingle = byId.get('icon-single');
  const maxLongTaskMs = Math.max(0, ...summaries.map((summary) => summary.maxLongTaskMs));
  return {
    maxLongTaskMs,
    results: [
      budgetResult(
        'initial-code-editor-gzip-increment',
        chunkMeasurement.budgets.initialGzipIncrementBytes,
        chunkMeasurement.budgets.initialGzipIncrementLimitBytes,
        chunkMeasurement.budgets.initialGzipWithinBudget,
        'ci-gate',
        'bytes',
        'chunk-scan',
      ),
      budgetResult(
        'initial-chunk-third-party-declarations',
        !chunkMeasurement.budgets.declarationBodiesExcludedFromInitialChunk,
        false,
        chunkMeasurement.budgets.declarationBodiesExcludedFromInitialChunk,
        'ci-gate',
        'boolean',
        'chunk-scan',
      ),
      budgetResult(
        'shared-declaration-graph-chunks',
        chunkMeasurement.budgets.declarationGraphChunkCount,
        chunkMeasurement.budgets.declarationGraphChunkLimit,
        chunkMeasurement.budgets.declarationGraphChunkWithinBudget &&
          chunkMeasurement.budgets.packsShareDeclarationGraphs,
        'ci-gate',
        'count',
        'chunk-scan',
      ),
      budgetResult(
        'declaration-graph-raw-bytes',
        chunkMeasurement.budgets.declarationGraphRawBytes,
        chunkMeasurement.budgets.declarationGraphRawLimitBytes,
        chunkMeasurement.budgets.declarationGraphRawWithinBudget,
        'ci-gate',
        'bytes',
        'chunk-scan',
      ),
      budgetResult(
        'declaration-graph-gzip-bytes',
        chunkMeasurement.budgets.declarationGraphGzipBytes,
        chunkMeasurement.budgets.declarationGraphGzipLimitBytes,
        chunkMeasurement.budgets.declarationGraphGzipWithinBudget,
        'ci-gate',
        'bytes',
        'chunk-scan',
      ),
      budgetResult(
        'hot-diagnostics-p95',
        ordinary?.hotDiagnosticsMs.p95 ?? null,
        0.95 * 1.2,
        ordinary ? ordinary.hotDiagnosticsMs.p95 <= 0.95 * 1.2 : false,
        'trend',
        'ms',
      ),
      budgetResult(
        'react-cold-diagnostics-p95',
        react?.coldDiagnosticsMs.p95 ?? null,
        400,
        react ? react.coldDiagnosticsMs.p95 <= 400 : false,
        'trend',
        'ms',
      ),
      budgetResult(
        'antd-button-warm-react-p95',
        antdButton?.coldDiagnosticsMs.p95 ?? null,
        300,
        antdButton ? antdButton.coldDiagnosticsMs.p95 <= 300 : false,
        'trend',
        'ms',
      ),
      budgetResult(
        'single-icon-cold-p95',
        iconSingle?.coldDiagnosticsMs.p95 ?? null,
        250,
        iconSingle ? iconSingle.coldDiagnosticsMs.p95 <= 250 : false,
        'trend',
        'ms',
      ),
      budgetResult(
        'hot-input-language-service-rebuilds',
        summaries.reduce((sum, summary) => sum + summary.hotLanguageServiceRebuildCount, 0),
        0,
        summaries.every((summary) => summary.hotLanguageServiceRebuildCount === 0),
        'ci-gate',
        'count',
      ),
      budgetResult('concurrent-same-pack-loader-count', 1, 1, true, 'ci-gate', 'count', 'typescriptMetrics.test.ts'),
      budgetResult('maximum-type-system-long-task', maxLongTaskMs, 100, maxLongTaskMs <= 100, 'trend', 'ms'),
    ],
  };
}

function formatMilliseconds(value) {
  return `${round(value).toFixed(2)} ms`;
}

function createMarkdownReport(report) {
  const fullFallback = report.scenarios.find((scenario) => scenario.id === 'full-fallback');
  const lines = [
    '# RunJS TypeScript 性能基准',
    '',
    `- 时间：${report.generatedAt}`,
    `- 样本：每个场景冷缓存 ${report.samplesPerScenario} 次，热输入 ${report.samplesPerScenario} 次`,
    `- 浏览器：${report.environment.browser}`,
    `- 机器：${report.environment.cpuModel}，${report.environment.cpuCount} 核，${report.environment.totalMemoryGiB} GiB，${report.environment.platform} ${report.environment.arch}`,
    `- Node.js：${report.environment.node}`,
    `- 缓存定义：冷样本使用全新浏览器 context、registry、Language Service；热样本复用同一 context、pack Promise、Language Service 和不可变 snapshot。`,
    '',
    '| 场景 | 冷 diagnostics P50 / P95 | 热 diagnostics P50 / P95 | pack loader P50 / P95 | script transfer P50 / P95 | 请求 packs | 实际加载 packs | 热缓存命中 | 最大 Long Task |',
    '| --- | ---: | ---: | ---: | ---: | --- | --- | --- | ---: |',
  ];
  for (const summary of report.scenarios) {
    lines.push(
      `| ${summary.label} | ${formatMilliseconds(summary.coldDiagnosticsMs.p50)} / ${formatMilliseconds(
        summary.coldDiagnosticsMs.p95,
      )} | ${formatMilliseconds(summary.hotDiagnosticsMs.p50)} / ${formatMilliseconds(
        summary.hotDiagnosticsMs.p95,
      )} | ${formatMilliseconds(summary.coldPackLoadMs.p50)} / ${formatMilliseconds(
        summary.coldPackLoadMs.p95,
      )} | ${Math.round(summary.coldScriptTransferBytes.p50)} B / ${Math.round(
        summary.coldScriptTransferBytes.p95,
      )} B | ${summary.packRequestIds.join(', ') || '无'} | ${summary.actualLoadIds.join(', ') || '无'} | ${
        summary.cacheHitIds.join(', ') || '无'
      } | ${formatMilliseconds(summary.maxLongTaskMs)} |`,
    );
  }
  lines.push('', '## 预算', '', '| Budget | Policy | Actual | Limit | Result |', '| --- | --- | ---: | ---: | --- |');
  for (const result of report.budgets.results) {
    lines.push(
      `| ${result.id} | ${result.policy} | ${String(result.actual)} ${result.unit} | ${String(result.budget)} ${
        result.unit
      } | ${result.passed ? 'PASS' : 'FAIL'} |`,
    );
  }
  lines.push(
    '',
    '## 任务 17 迁移结果',
    '',
    report.workerMigrationPassed
      ? `主线程 Long Task 预算通过：最大 ${formatMilliseconds(report.budgets.maxLongTaskMs)}，不超过 100 ms 门禁。`
      : `主线程 Long Task 预算未通过：最大 ${formatMilliseconds(report.budgets.maxLongTaskMs)}，超过 100 ms 门禁。`,
    '',
    '## 已知限制',
    '',
    fullFallback
      ? `- full fallback completion 会完整序列化 completion details 与 text changes，P95 为 ${formatMilliseconds(
          fullFallback.coldCompletionMs.p95,
        )}；该耗时发生在 Worker，不阻塞主线程，但仍需后续优化。`
      : '- 当前选择的场景不包含 full fallback completion 数据。',
    report.optimization?.fullFallbackCompletionP95Ms != null
      ? `- 跳过无 source/action 的普通 completion details 后，full fallback ${
          report.optimization.samples
        } 样本复测 P95 为 ${formatMilliseconds(report.optimization.fullFallbackCompletionP95Ms)}，仍是后续优化项。`
      : '',
    '',
  );
  return lines.join('\n');
}

async function main() {
  if (process.argv[2] === '--render-existing') {
    const reportPath = path.resolve(repositoryRoot, process.argv[3]);
    const report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
    report.mode = 'worker';
    report.workerMigrationPassed = report.budgets.maxLongTaskMs <= 100;
    if (process.argv[4]) {
      report.optimization = {
        fullFallbackCompletionP95Ms: Number(process.argv[4]),
        samples: Number(process.argv[5] || 0),
      };
    }
    await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    await fs.writeFile(
      path.join(path.dirname(reportPath), 'runjs-typescript-performance.md'),
      createMarkdownReport(report),
    );
    return;
  }
  const options = parseArguments(process.argv.slice(2));
  const selectedScenarios = scenarios.filter((scenario) => options.scenarioIds.includes(scenario.id));
  const chunkMeasurement = await measureInitialChunk();
  const buildStats = await buildBrowserHarness();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  try {
    const results = [];
    for (const scenario of selectedScenarios) {
      const coldSamples = [];
      for (let index = 0; index < options.samples; index += 1) {
        const { context, page } = await openBenchmarkPage(browser, server.url);
        try {
          coldSamples.push(await page.evaluate((scenarioId) => window.runColdScenario(scenarioId), scenario.id));
        } finally {
          await context.close();
        }
      }
      const hotSamples = [];
      const { context, page } = await openBenchmarkPage(browser, server.url);
      try {
        await page.evaluate((scenarioId) => window.runColdScenario(scenarioId), scenario.id);
        for (let index = 0; index < options.samples; index += 1) {
          hotSamples.push(
            await page.evaluate(({ iteration, scenarioId }) => window.runHotScenario(scenarioId, iteration), {
              iteration: index,
              scenarioId: scenario.id,
            }),
          );
        }
      } finally {
        await context.close();
      }
      results.push({ coldSamples, hotSamples, scenario });
      console.info(`RUNJS_BENCHMARK_SCENARIO ${scenario.id} ${coldSamples.length}/${hotSamples.length}`);
    }
    const summaries = results.map(({ coldSamples, hotSamples, scenario }) =>
      summarizeScenario(scenario, coldSamples, hotSamples),
    );
    const budgets = evaluateBudgets(summaries, chunkMeasurement);
    const cpus = os.cpus();
    const report = {
      budgets,
      build: { ...buildStats, chunkMeasurement },
      environment: {
        arch: os.arch(),
        browser: await browser.version(),
        cpuCount: cpus.length,
        cpuModel: cpus[0]?.model || 'unknown',
        node: process.version,
        platform: `${os.platform()} ${os.release()}`,
        totalMemoryGiB: round(os.totalmem() / 1024 / 1024 / 1024),
      },
      executeTask17: budgets.maxLongTaskMs > 100,
      generatedAt: new Date().toISOString(),
      mode: 'worker',
      rawSamples: Object.fromEntries(
        results.map(({ coldSamples, hotSamples, scenario }) => [scenario.id, { coldSamples, hotSamples }]),
      ),
      samplesPerScenario: options.samples,
      scenarios: summaries,
      workerMigrationPassed: budgets.maxLongTaskMs <= 100,
    };
    await fs.mkdir(options.outputDirectory, { recursive: true });
    await fs.writeFile(
      path.join(options.outputDirectory, 'runjs-typescript-performance.json'),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    await fs.writeFile(
      path.join(options.outputDirectory, 'runjs-typescript-performance.md'),
      createMarkdownReport(report),
    );
    console.info('RUNJS_TYPESCRIPT_PERFORMANCE', JSON.stringify({ ...report, rawSamples: undefined }, null, 2));
  } finally {
    await browser.close();
    await server.close();
    await fs.rm(temporaryBuildDirectory, { force: true, recursive: true });
  }
}

await main();

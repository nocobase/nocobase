/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  LIGHT_EXTENSION_BROWSER_PREVIEW_COMPILER_BUILD_ID,
  type BrowserPreviewEntryContract,
  type BrowserPreviewFile,
} from './protocol';

export const BROWSER_PREVIEW_BENCHMARK_SCHEMA_VERSION = 1;
export const BROWSER_PREVIEW_BENCHMARK_ENTRY_COUNT = 20;
export const BROWSER_PREVIEW_BENCHMARK_FILE_COUNT = 200;
export const BROWSER_PREVIEW_BENCHMARK_WARM_SAMPLE_COUNT = 20;

export interface BrowserPreviewBenchmarkFixture {
  files: BrowserPreviewFile[];
  entries: BrowserPreviewEntryContract[];
  warmEditPaths: string[];
  byteSize: number;
}

export interface BrowserPreviewBenchmarkDurationStatistics {
  sampleCount: number;
  min: number;
  p50: number;
  p95: number;
  max: number;
}

export interface BrowserPreviewBenchmarkReportInput {
  environment: {
    runtime: string;
    userAgent: string;
    nodeVersion?: string;
  };
  fixture: BrowserPreviewBenchmarkFixture;
  wasmDownloadMs: number;
  wasmInitializeMs: number;
  coldBuildSamplesMs: number[];
  warmBuildSamplesMs: number[];
}

export interface BrowserPreviewBenchmarkReport {
  schemaVersion: typeof BROWSER_PREVIEW_BENCHMARK_SCHEMA_VERSION;
  compilerBuildId: typeof LIGHT_EXTENSION_BROWSER_PREVIEW_COMPILER_BUILD_ID;
  environment: BrowserPreviewBenchmarkReportInput['environment'];
  fixture: {
    entryCount: number;
    fileCount: number;
    byteSize: number;
  };
  initialization: {
    wasmDownloadMs: number;
    wasmInitializeMs: number;
  };
  coldStartupMs: number;
  coldBuild: BrowserPreviewBenchmarkDurationStatistics;
  warmBuild: BrowserPreviewBenchmarkDurationStatistics;
}

export function createBrowserPreviewBenchmarkFixture(): BrowserPreviewBenchmarkFixture {
  const files: BrowserPreviewFile[] = [];
  const entries: BrowserPreviewEntryContract[] = [];
  const warmEditPaths: string[] = [];

  for (let entryIndex = 1; entryIndex <= BROWSER_PREVIEW_BENCHMARK_ENTRY_COUNT; entryIndex += 1) {
    const entryName = `entry-${padNumber(entryIndex)}`;
    const entryDir = `src/client/js-blocks/${entryName}`;
    const entryPath = `${entryDir}/index.tsx`;
    entries.push({
      entryPath,
      kind: 'js-block',
      runtimeVersion: 'v2',
      surfaceStyle: 'render',
    });
    files.push({
      path: entryPath,
      content: "import { value01 } from './module-01';\nctx.render(ctx.React.createElement('div', null, value01));\n",
      language: 'typescript',
    });

    for (let moduleIndex = 1; moduleIndex <= 9; moduleIndex += 1) {
      const moduleName = `module-${padNumber(moduleIndex)}`;
      const nextModuleName = `module-${padNumber(moduleIndex + 1)}`;
      const path = `${entryDir}/${moduleName}.ts`;
      files.push({
        path,
        content:
          moduleIndex < 9
            ? `import { value${padNumber(moduleIndex + 1)} } from './${nextModuleName}';\nexport const value${padNumber(
                moduleIndex,
              )} = value${padNumber(moduleIndex + 1)} + ':${entryName}:${moduleName}';\n`
            : `export const value09 = '${entryName}:${moduleName}:cold';\n`,
        language: 'typescript',
      });
      if (moduleIndex === 9) {
        warmEditPaths.push(path);
      }
    }
  }

  const byteSize = calculateFixtureByteSize(files);
  if (files.length !== BROWSER_PREVIEW_BENCHMARK_FILE_COUNT) {
    throw new Error(`Browser preview benchmark fixture expected ${BROWSER_PREVIEW_BENCHMARK_FILE_COUNT} files`);
  }

  return { files, entries, warmEditPaths, byteSize };
}

export function createBrowserPreviewBenchmarkWarmEdit(
  fixture: BrowserPreviewBenchmarkFixture,
  sampleIndex: number,
): BrowserPreviewFile {
  if (!Number.isInteger(sampleIndex) || sampleIndex < 0 || sampleIndex >= BROWSER_PREVIEW_BENCHMARK_WARM_SAMPLE_COUNT) {
    throw new Error('Browser preview benchmark warm sample index is out of range');
  }
  const path = fixture.warmEditPaths[sampleIndex % fixture.warmEditPaths.length];
  return {
    path,
    content: `export const value09 = 'warm-sample-${padNumber(sampleIndex + 1)}';\n`,
    language: 'typescript',
  };
}

export function buildBrowserPreviewBenchmarkReport(
  input: BrowserPreviewBenchmarkReportInput,
): BrowserPreviewBenchmarkReport {
  assertNonEmptyText(input.environment.runtime, 'runtime');
  assertNonEmptyText(input.environment.userAgent, 'user agent');
  if (input.fixture.entries.length !== BROWSER_PREVIEW_BENCHMARK_ENTRY_COUNT) {
    throw new Error(`Browser preview benchmark requires ${BROWSER_PREVIEW_BENCHMARK_ENTRY_COUNT} entries`);
  }
  if (input.fixture.files.length !== BROWSER_PREVIEW_BENCHMARK_FILE_COUNT) {
    throw new Error(`Browser preview benchmark requires ${BROWSER_PREVIEW_BENCHMARK_FILE_COUNT} files`);
  }
  if (input.warmBuildSamplesMs.length < BROWSER_PREVIEW_BENCHMARK_WARM_SAMPLE_COUNT) {
    throw new Error(
      `Browser preview benchmark requires at least ${BROWSER_PREVIEW_BENCHMARK_WARM_SAMPLE_COUNT} warm samples`,
    );
  }
  const wasmDownloadMs = assertDuration(input.wasmDownloadMs);
  const wasmInitializeMs = assertDuration(input.wasmInitializeMs);
  const coldBuild = calculateBrowserPreviewBenchmarkStatistics(input.coldBuildSamplesMs);

  return {
    schemaVersion: BROWSER_PREVIEW_BENCHMARK_SCHEMA_VERSION,
    compilerBuildId: LIGHT_EXTENSION_BROWSER_PREVIEW_COMPILER_BUILD_ID,
    environment: { ...input.environment },
    fixture: {
      entryCount: input.fixture.entries.length,
      fileCount: input.fixture.files.length,
      byteSize: input.fixture.byteSize,
    },
    initialization: {
      wasmDownloadMs,
      wasmInitializeMs,
    },
    coldStartupMs: wasmDownloadMs + wasmInitializeMs + coldBuild.p50,
    coldBuild,
    warmBuild: calculateBrowserPreviewBenchmarkStatistics(input.warmBuildSamplesMs),
  };
}

export function calculateBrowserPreviewBenchmarkStatistics(
  samples: number[],
): BrowserPreviewBenchmarkDurationStatistics {
  if (samples.length === 0) {
    throw new Error('Browser preview benchmark duration statistics require at least one sample');
  }
  const sorted = samples.map(assertDuration).sort((left, right) => left - right);

  return {
    sampleCount: sorted.length,
    min: sorted[0],
    p50: percentile(sorted, 0.5),
    p95: percentile(sorted, 0.95),
    max: sorted[sorted.length - 1],
  };
}

export function serializeBrowserPreviewBenchmarkJson(report: BrowserPreviewBenchmarkReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function serializeBrowserPreviewBenchmarkMarkdown(report: BrowserPreviewBenchmarkReport): string {
  return `${[
    '# Light Extension Browser Preview Benchmark',
    '',
    `Compiler build: \`${report.compilerBuildId}\``,
    '',
    '## Environment',
    '',
    '| Field | Value |',
    '| --- | --- |',
    `| Runtime | ${escapeMarkdownCell(report.environment.runtime)} |`,
    `| User agent | ${escapeMarkdownCell(report.environment.userAgent)} |`,
    `| Node version | ${escapeMarkdownCell(report.environment.nodeVersion || 'n/a')} |`,
    '',
    '## Fixture',
    '',
    '| Entries | Files | Bytes |',
    '| ---: | ---: | ---: |',
    `| ${report.fixture.entryCount} | ${report.fixture.fileCount} | ${report.fixture.byteSize} |`,
    '',
    '## Initialization',
    '',
    '| WASM download (ms) | WASM initialize (ms) | Cold startup (ms) |',
    '| ---: | ---: | ---: |',
    `| ${formatDuration(report.initialization.wasmDownloadMs)} | ${formatDuration(
      report.initialization.wasmInitializeMs,
    )} | ${formatDuration(report.coldStartupMs)} |`,
    '',
    '## Builds',
    '',
    '| Temperature | Samples | Min (ms) | p50 (ms) | p95 (ms) | Max (ms) |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
    durationRow('Cold', report.coldBuild),
    durationRow('Warm', report.warmBuild),
  ].join('\n')}\n`;
}

function calculateFixtureByteSize(files: BrowserPreviewFile[]): number {
  const encoder = new TextEncoder();
  return files.reduce(
    (total, file) => total + encoder.encode(file.path).byteLength + encoder.encode(file.content).byteLength,
    0,
  );
}

function percentile(sortedSamples: number[], quantile: number): number {
  const index = (sortedSamples.length - 1) * quantile;
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);
  if (lowerIndex === upperIndex) {
    return sortedSamples[lowerIndex];
  }
  const fraction = index - lowerIndex;
  return sortedSamples[lowerIndex] + (sortedSamples[upperIndex] - sortedSamples[lowerIndex]) * fraction;
}

function assertDuration(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('Browser preview benchmark durations must be non-negative finite numbers');
  }
  return value;
}

function assertNonEmptyText(value: string, label: string): void {
  if (!value.trim()) {
    throw new Error(`Browser preview benchmark ${label} is required`);
  }
}

function durationRow(label: string, statistics: BrowserPreviewBenchmarkDurationStatistics): string {
  return `| ${label} | ${statistics.sampleCount} | ${formatDuration(statistics.min)} | ${formatDuration(
    statistics.p50,
  )} | ${formatDuration(statistics.p95)} | ${formatDuration(statistics.max)} |`;
}

function formatDuration(value: number): string {
  return String(Number(value.toFixed(3)));
}

function escapeMarkdownCell(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\n', '<br>');
}

function padNumber(value: number): string {
  return String(value).padStart(2, '0');
}

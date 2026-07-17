/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  BROWSER_PREVIEW_BENCHMARK_ENTRY_COUNT,
  BROWSER_PREVIEW_BENCHMARK_FILE_COUNT,
  BROWSER_PREVIEW_BENCHMARK_WARM_SAMPLE_COUNT,
  buildBrowserPreviewBenchmarkReport,
  createBrowserPreviewBenchmarkFixture,
  createBrowserPreviewBenchmarkWarmEdit,
  serializeBrowserPreviewBenchmarkJson,
  serializeBrowserPreviewBenchmarkMarkdown,
} from '../browser-preview/browserPreviewBenchmark';
import { BrowserPreviewVirtualFileSystem } from '../browser-preview/virtualFileSystem';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('browser provisional preview benchmark', () => {
  it('records cold startup and 20 warm edits for the deterministic 200-file/20-entry workspace', async () => {
    const { BrowserProvisionalCompiler } = await loadBrowserCompiler();
    const { readFile } = await import('node:fs/promises');
    const wasm = await readFile(`${process.cwd()}/node_modules/esbuild-wasm/esbuild.wasm`);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(wasm, { status: 200, headers: { 'content-type': 'application/wasm' } })),
    );
    const fixture = createBrowserPreviewBenchmarkFixture();
    const compiler = new BrowserProvisionalCompiler();
    const vfs = new BrowserPreviewVirtualFileSystem();
    vfs.replace(1, fixture.files);

    const initialization = await compiler.initialize('/assets/esbuild.wasm');
    const coldResult = await compiler.build(vfs, fixture.entries[0], 0);
    const warmBuildSamplesMs: number[] = [];
    for (let sampleIndex = 0; sampleIndex < BROWSER_PREVIEW_BENCHMARK_WARM_SAMPLE_COUNT; sampleIndex += 1) {
      vfs.applyDelta(sampleIndex + 2, [
        { operation: 'upsert', file: createBrowserPreviewBenchmarkWarmEdit(fixture, sampleIndex) },
      ]);
      const warmResult = await compiler.build(vfs, fixture.entries[sampleIndex], 0);
      expect(warmResult.accepted).toBe(true);
      expect(warmResult.metrics.inputFileCount).toBe(BROWSER_PREVIEW_BENCHMARK_FILE_COUNT);
      warmBuildSamplesMs.push(requireDuration(warmResult.metrics.warmBuildMs, 'warmBuildMs'));
    }

    const report = buildBrowserPreviewBenchmarkReport({
      environment: {
        runtime: 'vitest-jsdom',
        userAgent: navigator.userAgent,
        nodeVersion: process.version,
      },
      fixture,
      wasmDownloadMs: requireDuration(initialization.wasmDownloadMs, 'wasmDownloadMs'),
      wasmInitializeMs: requireDuration(initialization.wasmInitializeMs, 'wasmInitializeMs'),
      coldBuildSamplesMs: [requireDuration(coldResult.metrics.firstBuildMs, 'firstBuildMs')],
      warmBuildSamplesMs,
    });

    expect(coldResult.accepted).toBe(true);
    expect(fixture.entries).toHaveLength(BROWSER_PREVIEW_BENCHMARK_ENTRY_COUNT);
    expect(fixture.files).toHaveLength(BROWSER_PREVIEW_BENCHMARK_FILE_COUNT);
    expect(fixture.warmEditPaths).toHaveLength(BROWSER_PREVIEW_BENCHMARK_ENTRY_COUNT);
    expect(fixture.byteSize).toBeGreaterThan(0);
    expect(report).toMatchObject({
      schemaVersion: 1,
      compilerBuildId: 'esbuild-wasm-0.27.7-portable-v1',
      fixture: {
        entryCount: BROWSER_PREVIEW_BENCHMARK_ENTRY_COUNT,
        fileCount: BROWSER_PREVIEW_BENCHMARK_FILE_COUNT,
        byteSize: fixture.byteSize,
      },
      initialization: {
        wasmDownloadMs: expect.any(Number),
        wasmInitializeMs: expect.any(Number),
      },
      coldStartupMs: expect.any(Number),
      coldBuild: {
        sampleCount: 1,
        min: expect.any(Number),
        p50: expect.any(Number),
        p95: expect.any(Number),
        max: expect.any(Number),
      },
      warmBuild: {
        sampleCount: BROWSER_PREVIEW_BENCHMARK_WARM_SAMPLE_COUNT,
        min: expect.any(Number),
        p50: expect.any(Number),
        p95: expect.any(Number),
        max: expect.any(Number),
      },
    });
    expect(report.warmBuild.min).toBeLessThanOrEqual(report.warmBuild.p50);
    expect(report.warmBuild.p50).toBeLessThanOrEqual(report.warmBuild.p95);
    expect(report.warmBuild.p95).toBeLessThanOrEqual(report.warmBuild.max);
    expect(serializeBrowserPreviewBenchmarkJson(report)).toContain('"warmBuild"');
    expect(serializeBrowserPreviewBenchmarkMarkdown(report)).toContain('| Warm | 20 |');
    if (process.env.BROWSER_PREVIEW_BENCHMARK_REPORT === '1') {
      process.stdout.write(serializeBrowserPreviewBenchmarkJson(report));
    }
    compiler.dispose();
  });

  it('keeps the fixture and percentile report deterministic without absolute timing gates', () => {
    const first = createBrowserPreviewBenchmarkFixture();
    const second = createBrowserPreviewBenchmarkFixture();
    const report = buildBrowserPreviewBenchmarkReport({
      environment: { runtime: 'unit-test', userAgent: 'unit-test' },
      fixture: first,
      wasmDownloadMs: 4,
      wasmInitializeMs: 6,
      coldBuildSamplesMs: [10],
      warmBuildSamplesMs: Array.from({ length: BROWSER_PREVIEW_BENCHMARK_WARM_SAMPLE_COUNT }, (_, index) => index),
    });

    expect(second).toEqual(first);
    expect(report.coldStartupMs).toBe(20);
    expect(report.warmBuild).toEqual({
      sampleCount: 20,
      min: 0,
      p50: 9.5,
      p95: 18.05,
      max: 19,
    });
  });
});

async function loadBrowserCompiler() {
  const { TextDecoder, TextEncoder } = await import('node:util');
  vi.stubGlobal('TextEncoder', TextEncoder);
  vi.stubGlobal('TextDecoder', TextDecoder);
  vi.stubGlobal('Uint8Array', new TextEncoder().encode('').constructor);
  return import('../browser-preview/browserProvisionalCompiler');
}

function requireDuration(value: number | undefined, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`Expected ${label} to be a non-negative finite duration`);
  }
  return value;
}

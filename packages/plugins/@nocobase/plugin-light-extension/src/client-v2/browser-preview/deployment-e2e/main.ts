/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  BROWSER_PREVIEW_BENCHMARK_WARM_SAMPLE_COUNT,
  buildBrowserPreviewBenchmarkReport,
  createBrowserPreviewBenchmarkFixture,
  createBrowserPreviewBenchmarkWarmEdit,
  type BrowserPreviewBenchmarkReport,
} from '../browserPreviewBenchmark';
import {
  BrowserPreviewSession,
  isBrowserProvisionalPreviewEnabled,
  resolveBrowserPreviewWasmUrl,
} from '../BrowserPreviewSession';
import { BrowserProvisionalCompiler } from '../browserProvisionalCompiler';
import type { BrowserPreviewFile, ProvisionalCompileResult } from '../protocol';
import browserPreviewWorkerURL from '../browserPreview.worker.ts?worker&url';

type BrowserPreviewDeploymentRunResult =
  | {
      ok: true;
      result: ProvisionalCompileResult;
    }
  | {
      ok: false;
      code?: string;
      message: string;
    };

type BrowserPreviewWasmProbeResult =
  | {
      ok: true;
      metrics: {
        wasmDownloadMs?: number;
        wasmInitializeMs?: number;
      };
    }
  | {
      ok: false;
      code?: string;
      message: string;
    };

type BrowserPreviewDeploymentApi = {
  getResolvedUrls(): { workerURL: string; wasmURL: string };
  probeWasm(wasmURL: string): Promise<BrowserPreviewWasmProbeResult>;
  runBenchmark(): Promise<BrowserPreviewBenchmarkReport>;
  runIfEnabled(options?: BrowserPreviewDeploymentRunOptions): Promise<
    | BrowserPreviewDeploymentRunResult
    | {
        ok: false;
        code: 'PREVIEW_DISABLED';
        message: string;
      }
  >;
  runSmoke(options?: BrowserPreviewDeploymentRunOptions): Promise<BrowserPreviewDeploymentRunResult>;
  setFeatureEnabled(enabled: boolean): void;
};

type BrowserPreviewDeploymentRunOptions = {
  wasmURL?: string;
  workerURL?: string;
};

type BrowserPreviewGlobals = typeof globalThis & {
  __NOCOBASE_LIGHT_EXTENSION_BROWSER_PREVIEW__?: boolean;
  __NOCOBASE_LIGHT_EXTENSION_PREVIEW_WASM_URL__?: string;
  __NOCOBASE_LIGHT_EXTENSION_PREVIEW_WORKER_URL__?: string;
};

declare global {
  interface Window {
    browserPreviewDeploymentE2E: BrowserPreviewDeploymentApi;
  }
}

function setFeatureEnabled(enabled: boolean): void {
  (globalThis as BrowserPreviewGlobals).__NOCOBASE_LIGHT_EXTENSION_BROWSER_PREVIEW__ = enabled;
}

function applyRunOptions(options: BrowserPreviewDeploymentRunOptions = {}): void {
  const globals = globalThis as BrowserPreviewGlobals;
  if (options.wasmURL) {
    globals.__NOCOBASE_LIGHT_EXTENSION_PREVIEW_WASM_URL__ = options.wasmURL;
  } else {
    delete globals.__NOCOBASE_LIGHT_EXTENSION_PREVIEW_WASM_URL__;
  }
  if (options.workerURL) {
    globals.__NOCOBASE_LIGHT_EXTENSION_PREVIEW_WORKER_URL__ = options.workerURL;
  } else {
    delete globals.__NOCOBASE_LIGHT_EXTENSION_PREVIEW_WORKER_URL__;
  }
}

async function runSmoke(options: BrowserPreviewDeploymentRunOptions = {}): Promise<BrowserPreviewDeploymentRunResult> {
  applyRunOptions(options);
  const fixture = createBrowserPreviewBenchmarkFixture();
  const session = new BrowserPreviewSession();
  try {
    await session.syncWorkspace(fixture.files);
    const result = await session.build(fixture.entries[0]);
    if (!result) {
      return { ok: false, code: 'PREVIEW_BUILD_FAILED', message: 'Browser preview returned a stale result' };
    }
    return { ok: true, result };
  } catch (error) {
    return {
      ok: false,
      code: readErrorCode(error),
      message: error instanceof Error ? error.message : String(error),
    };
  } finally {
    session.dispose();
  }
}

async function probeWasm(wasmURL: string): Promise<BrowserPreviewWasmProbeResult> {
  const compiler = new BrowserProvisionalCompiler();
  try {
    return { ok: true, metrics: await compiler.initialize(wasmURL) };
  } catch (error) {
    return {
      ok: false,
      code: readErrorCode(error),
      message: error instanceof Error ? error.message : String(error),
    };
  } finally {
    compiler.dispose();
  }
}

async function runIfEnabled(
  options: BrowserPreviewDeploymentRunOptions = {},
): Promise<BrowserPreviewDeploymentRunResult | { ok: false; code: 'PREVIEW_DISABLED'; message: string }> {
  if (!isBrowserProvisionalPreviewEnabled()) {
    return { ok: false, code: 'PREVIEW_DISABLED', message: 'Browser provisional preview is disabled' };
  }
  return runSmoke(options);
}

async function runBenchmark(): Promise<BrowserPreviewBenchmarkReport> {
  applyRunOptions();
  const fixture = createBrowserPreviewBenchmarkFixture();
  let files = fixture.files.map((file) => ({ ...file }));
  const session = new BrowserPreviewSession();
  try {
    await session.syncWorkspace(files);
    const coldResult = requireBuildResult(await session.build(fixture.entries[0]));
    const warmBuildSamplesMs: number[] = [];

    for (let sampleIndex = 0; sampleIndex < BROWSER_PREVIEW_BENCHMARK_WARM_SAMPLE_COUNT; sampleIndex += 1) {
      const edit = createBrowserPreviewBenchmarkWarmEdit(fixture, sampleIndex);
      files = replaceFile(files, edit);
      await session.syncWorkspace(files);
      const warmResult = requireBuildResult(await session.build(fixture.entries[sampleIndex]));
      warmBuildSamplesMs.push(requireDuration(warmResult.metrics.warmBuildMs, 'warmBuildMs'));
    }

    return buildBrowserPreviewBenchmarkReport({
      environment: {
        runtime: 'playwright-chromium-http',
        userAgent: navigator.userAgent,
      },
      fixture,
      wasmDownloadMs: requireDuration(coldResult.metrics.wasmDownloadMs, 'wasmDownloadMs'),
      wasmInitializeMs: requireDuration(coldResult.metrics.wasmInitializeMs, 'wasmInitializeMs'),
      coldBuildSamplesMs: [requireDuration(coldResult.metrics.firstBuildMs, 'firstBuildMs')],
      warmBuildSamplesMs,
    });
  } finally {
    session.dispose();
  }
}

function replaceFile(files: BrowserPreviewFile[], replacement: BrowserPreviewFile): BrowserPreviewFile[] {
  return files.map((file) => (file.path === replacement.path ? replacement : file));
}

function requireBuildResult(result: ProvisionalCompileResult | null): ProvisionalCompileResult {
  if (!result?.accepted) {
    throw new Error('Browser provisional preview benchmark build was not accepted');
  }
  return result;
}

function requireDuration(value: number | undefined, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`Expected ${label} to be a non-negative finite duration`);
  }
  return value;
}

function readErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

window.browserPreviewDeploymentE2E = {
  getResolvedUrls: () => ({
    workerURL: new URL(browserPreviewWorkerURL, document.baseURI).toString(),
    wasmURL: resolveBrowserPreviewWasmUrl(),
  }),
  probeWasm,
  runBenchmark,
  runIfEnabled,
  runSmoke,
  setFeatureEnabled,
};

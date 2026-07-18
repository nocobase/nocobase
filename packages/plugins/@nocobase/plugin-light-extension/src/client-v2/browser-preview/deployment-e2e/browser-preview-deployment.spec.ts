/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Page, Response } from '@playwright/test';
import { expect, test } from '@playwright/test';

const ROOT_BASE_URL = 'http://127.0.0.1:43110/';
const SUB_PATH_BASE_URL = 'http://127.0.0.1:43111/nocobase/';
const WARM_P95_LIMIT_MS = Number(process.env.BROWSER_PREVIEW_E2E_WARM_P95_MS || 1000);

test.describe('browser provisional preview production assets', () => {
  test.describe.configure({ mode: 'serial' });

  for (const deployment of [
    { name: 'root path', baseURL: ROOT_BASE_URL, expectedPathPrefix: '/' },
    { name: '/nocobase/ sub-path', baseURL: SUB_PATH_BASE_URL, expectedPathPrefix: '/nocobase/' },
  ]) {
    test(`loads Worker and WASM over HTTP at ${deployment.name}`, async ({ page }) => {
      const assets = trackPreviewAssetResponses(page);
      const documentResponse = await page.goto(deployment.baseURL);
      expectAllowedCsp(documentResponse);

      const result = await page.evaluate(() => window.browserPreviewDeploymentE2E.runSmoke());

      expect(result.ok).toBe(true);
      if (!result.ok) {
        throw new Error(result.message);
      }
      expect(result.result.accepted).toBe(true);
      expect(result.result.provisional).toBe(true);
      expect(result.result.artifact.metadata).toMatchObject({
        provisional: true,
        trust: 'client-advisory',
        canonical: false,
      });
      expect(result.result.metrics.inputFileCount).toBe(200);
      const wasmResponse = await assets.wasmResponse;
      const workerResponse = await assets.workerResponse;
      expect(wasmResponse.status()).toBe(200);
      expect(wasmResponse.headers()['content-type']).toContain('application/wasm');
      expect(new URL(wasmResponse.url()).pathname.startsWith(deployment.expectedPathPrefix)).toBe(true);
      expect(workerResponse.status()).toBe(200);
      expect(workerResponse.headers()['content-type']).toMatch(/javascript/u);
      expect(new URL(workerResponse.url()).pathname.startsWith(deployment.expectedPathPrefix)).toBe(true);
    });
  }

  test('keeps the feature flag disabled without Worker or WASM requests', async ({ page }) => {
    await page.goto(ROOT_BASE_URL);
    const requestedAssets: string[] = [];
    page.on('request', (request) => {
      if (isPreviewAssetUrl(request.url())) {
        requestedAssets.push(request.url());
      }
    });

    const result = await page.evaluate(() => {
      window.browserPreviewDeploymentE2E.setFeatureEnabled(false);
      return window.browserPreviewDeploymentE2E.runIfEnabled();
    });

    expect(result).toEqual({
      ok: false,
      code: 'PREVIEW_DISABLED',
      message: 'Browser provisional preview is disabled',
    });
    await page.waitForTimeout(250);
    expect(requestedAssets).toEqual([]);
  });

  test('maps HTTP 404 and wrong MIME responses to stable degradation codes', async ({ page }) => {
    await page.goto(ROOT_BASE_URL);

    const missing = await runWithWasmPath(page, 'test-assets/missing.wasm');
    expect(missing).toMatchObject({ ok: false, code: 'PREVIEW_WASM_FETCH_FAILED' });

    const wrongMime = await runWithWasmPath(page, 'test-assets/wrong-mime.wasm');
    expect(wrongMime).toMatchObject({ ok: false, code: 'PREVIEW_WASM_MIME_INVALID' });
  });

  test('maps browser offline mode to a stable WASM fetch failure', async ({ page, context }) => {
    await page.goto(ROOT_BASE_URL);
    await context.setOffline(true);
    const wasmURL = new URL(`test-assets/esbuild.wasm?offline=${Date.now()}`, ROOT_BASE_URL).toString();
    const offline = await page.evaluate((url) => window.browserPreviewDeploymentE2E.probeWasm(url), wasmURL);
    await context.setOffline(false);

    expect(offline).toMatchObject({ ok: false, code: 'PREVIEW_WASM_FETCH_FAILED' });
  });

  test('rejects WASM compilation when the Worker response CSP omits wasm-unsafe-eval', async ({ page }) => {
    await page.goto(ROOT_BASE_URL);
    const resolved = await page.evaluate(() => window.browserPreviewDeploymentE2E.getResolvedUrls());
    const workerURL = new URL(resolved.workerURL);
    workerURL.searchParams.set('csp', 'blocked');
    const wasmURL = new URL('test-assets/esbuild.wasm', ROOT_BASE_URL).toString();

    const result = await page.evaluate(
      ({ workerURL, wasmURL }) => window.browserPreviewDeploymentE2E.runSmoke({ workerURL, wasmURL }),
      { workerURL: workerURL.toString(), wasmURL },
    );

    expect(result).toMatchObject({ ok: false, code: 'PREVIEW_WASM_COMPILE_FAILED' });
  });

  test('records 20 warm edits and enforces the deployed-browser p95 target', async ({ page }, testInfo) => {
    await page.goto(ROOT_BASE_URL);

    const report = await page.evaluate(() => window.browserPreviewDeploymentE2E.runBenchmark());
    await testInfo.attach('browser-preview-benchmark.json', {
      body: Buffer.from(`${JSON.stringify(report, null, 2)}\n`),
      contentType: 'application/json',
    });
    if (process.env.BROWSER_PREVIEW_E2E_REPORT === '1') {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    }

    expect(report.fixture).toMatchObject({ entryCount: 20, fileCount: 200 });
    expect(report.warmBuild.sampleCount).toBe(20);
    expect(report.warmBuild.p95).toBeLessThanOrEqual(WARM_P95_LIMIT_MS);
  });
});

async function runWithWasmPath(page: Page, path: string) {
  const wasmURL = new URL(path, ROOT_BASE_URL).toString();
  return page.evaluate((url) => window.browserPreviewDeploymentE2E.runSmoke({ wasmURL: url }), wasmURL);
}

function trackPreviewAssetResponses(page: Page): {
  wasmResponse: Promise<Response>;
  workerResponse: Promise<Response>;
} {
  return {
    wasmResponse: page.waitForResponse((response) => isWasmUrl(response.url())),
    workerResponse: page.waitForResponse((response) => isWorkerUrl(response.url())),
  };
}

function expectAllowedCsp(response: Response | null): void {
  expect(response).not.toBeNull();
  const csp = response?.headers()['content-security-policy'] || '';
  expect(csp).toContain("worker-src 'self' blob:");
  expect(csp).toContain("script-src 'self' 'wasm-unsafe-eval'");
  expect(csp).toContain("connect-src 'self'");
  expect(csp).not.toContain("'unsafe-eval'");
}

function isPreviewAssetUrl(url: string): boolean {
  return isWasmUrl(url) || isWorkerUrl(url);
}

function isWasmUrl(url: string): boolean {
  return new URL(url).pathname.endsWith('.wasm');
}

function isWorkerUrl(url: string): boolean {
  return /browserPreview\.worker|browser-preview\.worker/iu.test(new URL(url).pathname);
}

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cpus, totalmem } from 'node:os';

import type { APIResponse, Locator, Page, Request, TestInfo } from '@playwright/test';
import { expect, test } from '@nocobase/test/e2e';

import {
  assertApiResponseOk,
  createLightExtensionAcceptanceRepo,
  getErrorMessage,
  getModernFlowPagePath,
  isRecord,
  openHostRuntimeSettingsMenu,
  openHostSettingsMenu,
  readApiResponse,
  removeLightExtensionAcceptanceRepo,
  saveLightExtensionAcceptanceSource,
  selectHostCodeSourceEntry,
  signInRootApiAndInstallBrowserSession,
  type LightExtensionAcceptanceRepo,
  type RootApiSession,
} from './helpers';
import type { LightExtensionPullResult, LightExtensionTreeEntryInput } from '../../shared/types';

const REFERENCE_RUNNER_ENV = 'LIGHT_EXTENSION_REFERENCE_PERF';
const COLD_OPEN_BUDGET_MS = 3_000;
const WARM_P95_BUDGET_MS = 1_500;
const WARM_UP_SAMPLES = 5;
const MEASURED_SAMPLES = 30;
const LOOP_SETTLE_MS = 500;

type ReferencePerformancePage = {
  pageUid: string;
  pageSchemaUid: string;
  tabSchemaUid: string;
  routePath: string;
  blockUids: string[];
};

type RequestCounts = {
  artifact: number;
  listSelectable: number;
  resolve: number;
  flowModelSave: number;
};

type ReferenceMetrics = {
  coldOpenMs: number;
  warmMenuOpenMs: number[];
  warmMenuOpenP95Ms: number;
  saveToStableMs: number[];
  saveToStableP95Ms: number;
  initialRunRequests: RequestCounts;
  coldOpenRequests: RequestCounts;
  menuOpenRequests: RequestCounts;
  saveRequests: RequestCounts;
};

const referenceRunnerSkipReason = getReferenceRunnerSkipReason();

test.describe('Light Extension reference runner performance', () => {
  test.skip(!!referenceRunnerSkipReason, referenceRunnerSkipReason || 'Reference runner enabled');
  test.setTimeout(900_000);

  test('meets dynamic settings menu and immutable artifact budgets', async ({ page }, testInfo) => {
    page.setDefaultTimeout(15_000);
    const session = await signInRootApiAndInstallBrowserSession(page);
    const repo = await createLightExtensionAcceptanceRepo(page, session, {
      title: `Light Extension reference performance ${Date.now()}`,
    });
    let fixture: ReferencePerformancePage | undefined;

    try {
      repo.headCommitId = await installPressureJsBlockEntry(page, session, repo);
      fixture = await createReferencePerformancePage(page, session);
      await page.goto(fixture.routePath);
      await expect(page.getByTestId('reference-inline-js-block')).toHaveCount(4);

      for (const blockUid of fixture.blockUids) {
        await selectHostCodeSourceEntry(page, {
          hostUid: blockUid,
          repoTitle: repo.title,
          entryTitle: repo.entries['js-block'].title,
        });
      }
      await expectPressureBlockModes(page, fixture.blockUids, 1);

      const requests = createRequestCounter(page);
      try {
        requests.reset();
        await page.reload();
        await expectPressureBlockModes(page, fixture.blockUids, 1);
        await page.waitForTimeout(LOOP_SETTLE_MS);
        const initialRunRequests = requests.snapshot();
        expect(initialRunRequests.artifact).toBeLessThanOrEqual(1);
        expect(initialRunRequests.listSelectable).toBe(0);

        requests.reset();
        const measuredHostUid = fixture.blockUids[0];
        const coldOpen = await measureMenuOpen(page, measuredHostUid, 'Perf B 5');
        const coldOpenMs = coldOpen.durationMs;
        await closeSettingsMenu(page, coldOpen.menu);
        const coldOpenRequests = requests.snapshot();
        expect(coldOpenRequests.resolve).toBe(0);
        expect(coldOpenRequests.artifact).toBe(0);
        expect(coldOpenRequests.listSelectable).toBeLessThanOrEqual(1);
        expect(coldOpenRequests.flowModelSave).toBe(0);

        for (let index = 0; index < WARM_UP_SAMPLES; index += 1) {
          const warmup = await measureMenuOpen(page, measuredHostUid, 'Perf B 5');
          await closeSettingsMenu(page, warmup.menu);
        }

        requests.reset();
        const warmMenuOpenMs: number[] = [];
        for (let index = 0; index < MEASURED_SAMPLES; index += 1) {
          const sample = await measureMenuOpen(page, measuredHostUid, 'Perf B 5');
          warmMenuOpenMs.push(sample.durationMs);
          await closeSettingsMenu(page, sample.menu);
        }
        const menuOpenRequests = requests.snapshot();
        expect(menuOpenRequests.resolve).toBe(0);
        expect(menuOpenRequests.artifact).toBe(0);
        expect(menuOpenRequests.listSelectable).toBe(0);
        expect(menuOpenRequests.flowModelSave).toBe(0);

        for (let index = 0; index < WARM_UP_SAMPLES; index += 1) {
          await restoreReferenceBlockMode(page, session, measuredHostUid, 1);
          await page.reload();
          await expectPressureBlockModes(page, fixture.blockUids, 1);
          await page.waitForTimeout(LOOP_SETTLE_MS);
          const warmup = await measureModeSaveToStable(page, measuredHostUid, 2);
          await expectPressureBlockModes(page, fixture.blockUids, 2);
          await closeSettingsMenu(page, warmup.menu);
        }

        const saveToStableMs: number[] = [];
        const saveRequests = emptyRequestCounts();
        for (let index = 0; index < MEASURED_SAMPLES; index += 1) {
          await restoreReferenceBlockMode(page, session, measuredHostUid, 1);
          await page.reload();
          await expectPressureBlockModes(page, fixture.blockUids, 1);
          await page.waitForTimeout(LOOP_SETTLE_MS);
          const sample = await measureModeSaveToStable(page, measuredHostUid, 2, () => requests.reset());
          saveToStableMs.push(sample.durationMs);
          await expectPressureBlockModes(page, fixture.blockUids, 2);

          const stableCounts = requests.snapshot();
          expect(stableCounts.flowModelSave).toBe(1);
          expect(stableCounts.resolve).toBe(0);
          const menuMutations = await countSettingsMenuMutations(sample.menu, LOOP_SETTLE_MS);
          expect(menuMutations).toBe(0);
          expect(requests.snapshot()).toEqual(stableCounts);
          addRequestCounts(saveRequests, stableCounts);
          await closeSettingsMenu(page, sample.menu);
        }

        const metrics: ReferenceMetrics = {
          coldOpenMs,
          warmMenuOpenMs,
          warmMenuOpenP95Ms: percentile95(warmMenuOpenMs),
          saveToStableMs,
          saveToStableP95Ms: percentile95(saveToStableMs),
          initialRunRequests,
          coldOpenRequests,
          menuOpenRequests,
          saveRequests,
        };
        await recordReferenceMetrics(testInfo, metrics);

        expect(metrics.coldOpenMs).toBeLessThanOrEqual(COLD_OPEN_BUDGET_MS);
        expect(metrics.warmMenuOpenP95Ms).toBeLessThanOrEqual(WARM_P95_BUDGET_MS);
        expect(metrics.saveToStableP95Ms).toBeLessThanOrEqual(WARM_P95_BUDGET_MS);
        expect(metrics.saveRequests.resolve).toBe(0);
        expect(metrics.saveRequests.artifact).toBe(0);
        expect(metrics.saveRequests.listSelectable).toBe(0);
        expect(metrics.saveRequests.flowModelSave).toBe(MEASURED_SAMPLES);
      } finally {
        requests.dispose();
      }
    } finally {
      const cleanupFailures: string[] = [];
      if (fixture) {
        try {
          await destroyReferencePerformancePage(page, session, fixture);
        } catch (error) {
          cleanupFailures.push(getErrorMessage(error));
        }
      }
      try {
        await removeLightExtensionAcceptanceRepo(page, session, repo.id);
      } catch (error) {
        cleanupFailures.push(getErrorMessage(error));
      }
      expect(cleanupFailures, `Reference performance cleanup failed: ${cleanupFailures.join('; ')}`).toEqual([]);
    }
  });
});

function getReferenceRunnerSkipReason(): string | undefined {
  if (process.env[REFERENCE_RUNNER_ENV] !== '1') {
    return `Set ${REFERENCE_RUNNER_ENV}=1 to run the reference performance test`;
  }
  return undefined;
}

function createPressureSettings(): Record<string, unknown> {
  const settings: Record<string, unknown> = {
    mode: {
      type: 'integer',
      title: 'Perf mode',
      enum: [1, 2],
      default: 1,
    },
  };
  for (let index = 1; index <= 5; index += 1) {
    settings[`static${index}`] = {
      type: 'string',
      title: `Perf static ${index}`,
      default: `static-${index}`,
    };
    settings[`branchB${index}`] = {
      type: 'string',
      title: `Perf B ${index}`,
      default: `branch-b-${index}`,
      'x-visible-when': { path: 'mode', operator: '$eq', value: 1 },
    };
    settings[`branchC${index}`] = {
      type: 'string',
      title: `Perf C ${index}`,
      default: `branch-c-${index}`,
      'x-visible-when': { path: 'mode', operator: '$eq', value: 2 },
    };
  }
  for (let objectIndex = 1; objectIndex <= 4; objectIndex += 1) {
    settings[`object${objectIndex}`] = {
      type: 'object',
      title: `Perf object ${objectIndex}`,
      properties: {
        enabled: {
          type: 'boolean',
          title: 'Enabled',
          default: true,
        },
        label: {
          type: 'string',
          title: 'Label',
          default: `object-${objectIndex}`,
        },
        threshold: {
          type: 'integer',
          title: 'Threshold',
          default: objectIndex,
        },
        detailA: {
          type: 'string',
          title: 'Detail A',
          default: `detail-a-${objectIndex}`,
          'x-visible-when': { path: `object${objectIndex}.enabled`, operator: '$eq', value: true },
        },
        detailB: {
          type: 'string',
          title: 'Detail B',
          default: `detail-b-${objectIndex}`,
          'x-visible-when': { path: `object${objectIndex}.enabled`, operator: '$eq', value: true },
        },
      },
    };
  }
  assertPressureSettingsShape(settings);
  return settings;
}

function assertPressureSettingsShape(settings: Record<string, unknown>): void {
  const definitions = Object.values(settings);
  const dynamicDefinitions = definitions.filter(
    (definition) => isRecord(definition) && Object.prototype.hasOwnProperty.call(definition, 'x-visible-when'),
  );
  const objectDefinitions = definitions.filter((definition) => isRecord(definition) && definition.type === 'object');
  if (definitions.length !== 20 || dynamicDefinitions.length !== 10 || objectDefinitions.length !== 4) {
    throw new Error(
      `Reference performance schema shape mismatch: topLevel=${definitions.length}, dynamic=${dynamicDefinitions.length}, objects=${objectDefinitions.length}`,
    );
  }
  for (const definition of objectDefinitions) {
    if (!isRecord(definition) || !isRecord(definition.properties)) {
      throw new Error('Reference performance object menu does not contain properties');
    }
    const childDefinitions = Object.values(definition.properties);
    const dynamicChildren = childDefinitions.filter(
      (child) => isRecord(child) && Object.prototype.hasOwnProperty.call(child, 'x-visible-when'),
    );
    if (childDefinitions.length !== 5 || dynamicChildren.length !== 2) {
      throw new Error(
        `Reference performance object shape mismatch: children=${childDefinitions.length}, dynamic=${dynamicChildren.length}`,
      );
    }
  }
}

async function installPressureJsBlockEntry(
  page: Page,
  session: RootApiSession,
  repo: LightExtensionAcceptanceRepo,
): Promise<string> {
  const response = await page.request.post('/api/lightExtensionFiles:pull', {
    headers: session.headers,
    data: { repoId: repo.id, includeContent: 'all' },
  });
  const pullResult = await readApiResponse<LightExtensionPullResult>(response, 'Pull reference performance source');
  if (!pullResult.repo.headCommitId || !Array.isArray(pullResult.files)) {
    throw new Error('Reference performance source pull is missing the Head or files');
  }

  const entry = repo.entries['js-block'];
  const descriptorPath = entry.entryPath.replace(/\/[^/]+$/u, '/entry.json');
  let sourceCount = 0;
  let descriptorCount = 0;
  const files = pullResult.files.map<LightExtensionTreeEntryInput>((file) => {
    if (typeof file.content !== 'string') {
      throw new Error(`Reference performance file "${file.path}" does not contain content`);
    }
    let content = file.content;
    if (file.path === entry.entryPath) {
      sourceCount += 1;
      content =
        'ctx.render(<div data-testid="light-extension-reference-perf-block">{String(ctx.settings.mode)}</div>);\n';
    }
    if (file.path === descriptorPath) {
      descriptorCount += 1;
      const parsed: unknown = JSON.parse(file.content);
      if (!isRecord(parsed)) {
        throw new Error('Reference performance js-block entry descriptor is invalid');
      }
      content = `${JSON.stringify({ ...parsed, settings: createPressureSettings() }, null, 2)}\n`;
    }
    return {
      path: file.path,
      content,
      language: file.language,
      mode: file.mode,
    };
  });
  if (sourceCount !== 1 || descriptorCount !== 1) {
    throw new Error(
      `Reference performance fixture expected one source and descriptor, found source=${sourceCount}, descriptor=${descriptorCount}`,
    );
  }
  return saveLightExtensionAcceptanceSource(page, session, {
    repoId: repo.id,
    expectedHeadCommitId: pullResult.repo.headCommitId,
    files,
    message: 'Install reference performance js-block entry',
  });
}

async function createReferencePerformancePage(page: Page, session: RootApiSession): Promise<ReferencePerformancePage> {
  const pageResponse = await page.request.post('/api/flowSurfaces:createPage', {
    headers: session.headers,
    data: {
      icon: 'DashboardOutlined',
      title: 'Light Extension reference performance',
      tabTitle: 'Performance',
    },
  });
  const created = await readApiResponse<unknown>(pageResponse, 'Create reference performance page');
  if (!isRecord(created)) {
    throw new Error('Reference performance page response is invalid');
  }
  const pageUid = requireString(created, 'pageUid', 'Reference performance page response');
  const pageSchemaUid = requireString(created, 'pageSchemaUid', 'Reference performance page response');
  const tabSchemaUid = requireString(created, 'tabSchemaUid', 'Reference performance page response');
  const blockUids: string[] = [];

  try {
    for (let index = 1; index <= 4; index += 1) {
      const blockResponse = await page.request.post('/api/flowSurfaces:addBlock', {
        headers: session.headers,
        data: {
          target: { uid: tabSchemaUid },
          type: 'jsBlock',
          settings: {
            title: `Reference performance JS Block ${index}`,
            version: 'v2',
            code: `ctx.render(<div data-testid="reference-inline-js-block">Inline ${index}</div>);`,
          },
        },
      });
      const block = await readApiResponse<unknown>(blockResponse, `Create reference performance JS Block ${index}`);
      if (!isRecord(block)) {
        throw new Error(`Reference performance JS Block ${index} response is invalid`);
      }
      blockUids.push(requireString(block, 'uid', `Reference performance JS Block ${index} response`));
    }
    return {
      pageUid,
      pageSchemaUid,
      tabSchemaUid,
      routePath: getModernFlowPagePath(pageSchemaUid),
      blockUids,
    };
  } catch (error) {
    const destroyResponse = await page.request.post('/api/flowSurfaces:destroyPage', {
      headers: session.headers,
      data: { uid: pageUid },
    });
    await assertCleanupResponse(destroyResponse, 'Destroy incomplete reference performance page');
    throw error;
  }
}

async function destroyReferencePerformancePage(
  page: Page,
  session: RootApiSession,
  fixture: ReferencePerformancePage,
): Promise<void> {
  const failures: string[] = [];
  for (const uid of fixture.blockUids) {
    try {
      await switchReferenceBlockToInline(page, session, uid);
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
  }
  if (failures.length) {
    throw new Error(`Failed to reset reference performance blocks: ${failures.join('; ')}`);
  }

  const response = await page.request.post('/api/flowSurfaces:destroyPage', {
    headers: session.headers,
    data: { uid: fixture.pageUid },
  });
  await assertCleanupResponse(response, 'Destroy reference performance page');
}

async function switchReferenceBlockToInline(page: Page, session: RootApiSession, uid: string): Promise<void> {
  const readResponse = await page.request.get('/api/flowModels:findOne', {
    headers: session.headers,
    params: { uid },
  });
  if (readResponse.status() === 404) {
    return;
  }
  const model = await readApiResponse<unknown>(readResponse, `Read reference performance block ${uid}`);
  if (!isRecord(model)) {
    throw new Error(`Reference performance block ${uid} is invalid`);
  }
  const stepParams = isRecord(model.stepParams) ? { ...model.stepParams } : {};
  const jsSettings = isRecord(stepParams.jsSettings) ? { ...stepParams.jsSettings } : {};
  const runJs = isRecord(jsSettings.runJs) ? { ...jsSettings.runJs } : {};
  runJs.sourceMode = 'inline';
  delete runJs.sourceBinding;
  delete runJs.settings;
  jsSettings.runJs = runJs;
  delete jsSettings.sourceMode;
  delete jsSettings.sourceBinding;
  delete jsSettings.settings;
  stepParams.jsSettings = jsSettings;

  const saveResponse = await page.request.post('/api/flowModels:save', {
    headers: session.headers,
    data: { ...model, stepParams },
  });
  await assertApiResponseOk(saveResponse, `Reset reference performance block ${uid}`);
}

async function restoreReferenceBlockMode(page: Page, session: RootApiSession, uid: string, mode: 1 | 2): Promise<void> {
  const readResponse = await page.request.get('/api/flowModels:findOne', {
    headers: session.headers,
    params: { uid },
  });
  const model = await readApiResponse<unknown>(readResponse, `Read reference performance block ${uid} for reset`);
  if (!isRecord(model)) {
    throw new Error(`Reference performance block ${uid} is invalid during reset`);
  }
  const stepParams = isRecord(model.stepParams) ? { ...model.stepParams } : {};
  const jsSettings = isRecord(stepParams.jsSettings) ? { ...stepParams.jsSettings } : {};
  const runJs = isRecord(jsSettings.runJs) ? { ...jsSettings.runJs } : {};
  const settings = isRecord(runJs.settings) ? { ...runJs.settings } : {};
  settings.mode = mode;
  runJs.settings = settings;
  jsSettings.runJs = runJs;
  stepParams.jsSettings = jsSettings;

  const saveResponse = await page.request.post('/api/flowModels:save', {
    headers: session.headers,
    data: { ...model, stepParams },
  });
  await assertApiResponseOk(saveResponse, `Restore reference performance block ${uid} mode`);
}

async function assertCleanupResponse(response: APIResponse, operation: string): Promise<void> {
  if (response.ok() || response.status() === 404) {
    return;
  }
  await assertApiResponseOk(response, operation);
}

async function expectPressureBlockModes(page: Page, blockUids: string[], measuredMode: 1 | 2): Promise<void> {
  expect(blockUids).toHaveLength(4);
  for (const [index, uid] of blockUids.entries()) {
    const host = page.locator(`[data-float-menu-model-uid="${uid}"]`).first();
    await expect(host.getByTestId('light-extension-reference-perf-block')).toHaveText(
      String(index === 0 ? measuredMode : 1),
    );
  }
}

async function prepareSettingsButton(page: Page, hostUid: string): Promise<Locator> {
  const host = page.locator(`[data-float-menu-model-uid="${hostUid}"]`).first();
  await expect(host).toBeVisible();
  await host.hover({ force: true });
  const toolbar = page.locator(`[data-model-uid="${hostUid}"]`).first();
  await expect(toolbar).toBeVisible();
  const button = toolbar.getByRole('button', { name: 'flows-settings', exact: true });
  await expect(button).toBeVisible();
  return button;
}

async function measureMenuOpen(
  page: Page,
  hostUid: string,
  expectedDynamicTitle: string,
): Promise<{ durationMs: number; menu: Locator }> {
  const button = await prepareSettingsButton(page, hostUid);
  const startedAt = await browserNow(page);
  await button.click();
  const expectedItem = getExactMenuItem(page, expectedDynamicTitle);
  await expect(expectedItem).toBeVisible();
  const menu = expectedItem.locator('xpath=ancestor::*[@role="menu"][1]');
  await expect(menu).toBeVisible();
  const finishedAt = await browserNow(page);
  return { durationMs: finishedAt - startedAt, menu };
}

async function measureModeSaveToStable(
  page: Page,
  hostUid: string,
  mode: 1 | 2,
  beforeSave?: () => void,
): Promise<{ durationMs: number; menu: Locator }> {
  const dialog = await openHostRuntimeSettingsMenu(page, { hostUid, menuTitle: 'Perf mode' });
  await selectModeOption(page, dialog, mode);
  beforeSave?.();
  const saveResponsePromise = waitForFlowModelSave(page);
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  const saveResponse = await saveResponsePromise;
  expect(saveResponse.ok()).toBe(true);
  const startedAt = await browserNow(page);
  await expect(dialog).toBeHidden();
  await openHostSettingsMenu(page, { hostUid });
  const expectedItem = getExactMenuItem(page, mode === 1 ? 'Perf B 5' : 'Perf C 5');
  await expect(expectedItem).toBeVisible();
  await expect(getExactMenuItem(page, mode === 1 ? 'Perf C 5' : 'Perf B 5')).toHaveCount(0);
  const menu = expectedItem.locator('xpath=ancestor::*[@role="menu"][1]');
  const finishedAt = await browserNow(page);
  return { durationMs: finishedAt - startedAt, menu };
}

async function selectModeOption(page: Page, dialog: Locator, mode: 1 | 2): Promise<void> {
  const combobox = dialog.getByRole('combobox').last();
  await expect(combobox).toBeVisible();
  await dialog.locator('.ant-select-selector').last().click();
  await page
    .getByRole('option', { name: String(mode), exact: true })
    .last()
    .click();
}

async function waitForFlowModelSave(page: Page) {
  return page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' && new URL(response.url()).pathname.endsWith('/api/flowModels:save'),
  );
}

async function closeSettingsMenu(page: Page, menu: Locator): Promise<void> {
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
}

function getExactMenuItem(page: Page, title: string): Locator {
  return page
    .locator('[role="menuitem"]')
    .filter({ hasText: new RegExp(`^${escapeRegExp(title)}$`, 'u') })
    .last();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

async function browserNow(page: Page): Promise<number> {
  return page.evaluate(() => performance.now());
}

async function countSettingsMenuMutations(menu: Locator, settleMs: number): Promise<number> {
  return menu.evaluate(async (element, duration) => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    return new Promise<number>((resolve) => {
      let mutations = 0;
      const observer = new MutationObserver((records) => {
        mutations += records.length;
      });
      observer.observe(element, { attributes: true, characterData: true, childList: true, subtree: true });
      window.setTimeout(() => {
        observer.disconnect();
        resolve(mutations);
      }, duration);
    });
  }, settleMs);
}

function createRequestCounter(page: Page) {
  let counts = emptyRequestCounts();
  const listener = (request: Request) => {
    const pathname = new URL(request.url()).pathname;
    if (pathname.includes('/api/light-extension-runtime/artifacts/')) {
      counts.artifact += 1;
    }
    if (pathname.endsWith('/api/lightExtensionEntries:listSelectable')) {
      counts.listSelectable += 1;
    }
    if (
      pathname.endsWith('/api/light-extension-runtime/resolve') ||
      pathname.endsWith('/api/lightExtensionRuntime:resolve')
    ) {
      counts.resolve += 1;
    }
    if (pathname.endsWith('/api/flowModels:save')) {
      counts.flowModelSave += 1;
    }
  };
  page.on('request', listener);
  return {
    dispose() {
      page.off('request', listener);
    },
    reset() {
      counts = emptyRequestCounts();
    },
    snapshot(): RequestCounts {
      return { ...counts };
    },
  };
}

function emptyRequestCounts(): RequestCounts {
  return { artifact: 0, listSelectable: 0, resolve: 0, flowModelSave: 0 };
}

function addRequestCounts(target: RequestCounts, sample: RequestCounts): void {
  target.artifact += sample.artifact;
  target.listSelectable += sample.listSelectable;
  target.resolve += sample.resolve;
  target.flowModelSave += sample.flowModelSave;
}

function percentile95(samples: number[]): number {
  if (!samples.length) {
    throw new Error('Cannot calculate p95 without samples');
  }
  const sorted = [...samples].sort((left, right) => left - right);
  return sorted[Math.ceil(sorted.length * 0.95) - 1];
}

async function recordReferenceMetrics(testInfo: TestInfo, metrics: ReferenceMetrics): Promise<void> {
  const summary = {
    runner: {
      platform: process.platform,
      arch: process.arch,
      cpuCount: cpus().length,
      memoryGb: Number((totalmem() / 1024 / 1024 / 1024).toFixed(1)),
      appEnv: process.env.APP_ENV,
    },
    budgets: {
      coldOpenMs: COLD_OPEN_BUDGET_MS,
      warmP95Ms: WARM_P95_BUDGET_MS,
      warmUpSamples: WARM_UP_SAMPLES,
      measuredSamples: MEASURED_SAMPLES,
      loopSettleMs: LOOP_SETTLE_MS,
    },
    metrics,
  };
  testInfo.annotations.push({
    type: 'reference-performance',
    description: `cold=${metrics.coldOpenMs.toFixed(1)}ms, menu-p95=${metrics.warmMenuOpenP95Ms.toFixed(
      1,
    )}ms, save-p95=${metrics.saveToStableP95Ms.toFixed(1)}ms, save-resolve=${metrics.saveRequests.resolve}`,
  });
  await testInfo.attach('light-extension-reference-performance.json', {
    body: Buffer.from(`${JSON.stringify(summary, null, 2)}\n`, 'utf8'),
    contentType: 'application/json',
  });
}

function requireString(record: Record<string, unknown>, key: string, context: string): string {
  const value = record[key];
  if ((typeof value !== 'string' && typeof value !== 'number') || String(value).trim() === '') {
    throw new Error(`${context} does not contain ${key}`);
  }
  return String(value);
}

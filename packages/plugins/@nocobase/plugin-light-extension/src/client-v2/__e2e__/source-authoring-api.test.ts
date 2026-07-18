/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { APIResponse, ConsoleMessage, Page, TestInfo } from '@playwright/test';
import { expect, test } from '@nocobase/test/e2e';
import JSZip from 'jszip';

import type {
  LightExtensionCompilePreviewEntryResult,
  LightExtensionDiagnostic,
  LightExtensionEntryRecord,
  LightExtensionFileResult,
  LightExtensionPullResult,
  LightExtensionReferenceRecord,
  LightExtensionSaveSourceResult,
  LightExtensionTreeEntryInput,
  LightExtensionWorkspacePreviewResult,
} from '../../shared/types';
import {
  assertApiResponseOk,
  createFlowHostAcceptancePage,
  createLightExtensionAcceptanceRepo,
  destroyFlowHostAcceptancePage,
  getAcceptanceSourceBinding,
  getAcceptanceEntryKinds,
  getErrorMessage,
  getModernFlowPagePath,
  isRecord,
  readApiResponse,
  removeLightExtensionAcceptanceRepo,
  signInRootApiAndInstallBrowserSession,
  unwrapApiData,
  type FlowHostAcceptancePage,
  type LightExtensionAcceptanceRepo,
  type LightExtensionAcceptanceSourceBinding,
  type RootApiSession,
} from './helpers';

type WorkspaceFile = {
  path: string;
  content: string;
  language?: string;
  mode?: string;
};

type FlowRunJsReadback = {
  code?: string;
  version?: string;
  sourceMode?: string;
  sourceBinding?: Record<string, unknown>;
  settings?: Record<string, unknown>;
};

type SourceRoute = 'flow-surface' | 'light-extension' | 'runjs-workspace' | 'blocked';

type SourceAuthoringScenarioReport = {
  scenario: string;
  route: SourceRoute;
  baselineHeadCommitId: string | null;
  previewStatus?: number;
  previewAccepted?: boolean;
  saveAttempted: boolean;
  savedFiles: string[];
  newHeadCommitId: string | null;
  diagnostics: LightExtensionDiagnostic[];
  referenceCount?: number;
  invariants: Record<string, unknown>;
};

type RunJSSourceLocator = {
  kind: 'flowModel.step';
  modelUid: string;
  flowKey: string;
  stepKey: string;
  paramPath: string[];
};

type RunJSOpenResult = {
  ownerFingerprint: string;
  repository: {
    repoId: string;
    headCommitId: string | null;
  };
  files: WorkspaceFile[];
};

type ApiErrorEvidence = {
  code?: string;
  message?: string;
  details?: Record<string, unknown>;
};

type SourceAuthoringCleanupReport = {
  attempted: true;
  success: boolean;
  failures: string[];
  runJsOwnerDestroyedWithPage: boolean;
};

type JSPageAcceptanceHost = {
  pageUid: string;
  pageSchemaUid: string;
  routeId: string;
  routePath: string;
};

const SINGLE_FILE_TEST_ID = 'light-extension-source-authoring-single';
const SHARED_BLOCK_TEST_ID = 'light-extension-source-authoring-shared-block';
const SHARED_ITEM_TEST_ID = 'light-extension-source-authoring-shared-item';
const RUNJS_WORKSPACE_TEST_ID = 'runjs-source-authoring-workspace';
const RUNJS_VALUE_SUBMIT_TITLE = 'RunJS value submit';

test.describe('Light Extension source authoring public API', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(900_000);

  test('routes, previews, saves, recovers, and blocks unsafe source changes', async ({ page }, testInfo) => {
    page.setDefaultTimeout(20_000);
    const session = await signInRootApiAndInstallBrowserSession(page);
    const reports: SourceAuthoringScenarioReport[] = [];
    let repo: LightExtensionAcceptanceRepo | undefined;
    let fixture: FlowHostAcceptancePage | undefined;
    let jsPageHost: JSPageAcceptanceHost | undefined;
    let runJSValueSubmitUid: string | undefined;

    try {
      repo = await createLightExtensionAcceptanceRepo(page, session, {
        title: `Light Extension source authoring ${Date.now()}`,
      });
      fixture = await createFlowHostAcceptancePage(page, session, {
        pageTitle: `Source authoring ${Date.now()}`,
      });

      await test.step('all supported RunJS entries are created, selectable, and compiled', async () => {
        const supportedKinds = [...getAcceptanceEntryKinds()];
        expect(Object.keys(repo.entries).sort()).toEqual([...supportedKinds].sort());

        for (const kind of supportedKinds) {
          const entry = repo.entries[kind];
          expect(entry.kind).toBe(kind);
          expect(entry.entryName).toBe(`acceptance-${kind}`);
          const readback = await readEntry(page, session, entry.id);
          expect(readback).toMatchObject({
            id: entry.id,
            repoId: repo.id,
            kind,
            entryName: entry.entryName,
            entryPath: entry.entryPath,
            compiledCommitId: repo.headCommitId,
          });
          expect(readback.runtimeCodeHash).toEqual(expect.any(String));
        }
      });

      await test.step('JS Page entry binds to a created page and executes in the browser', async () => {
        const entry = repo.entries['js-page'];
        const binding = getAcceptanceSourceBinding(repo, 'js-page');
        jsPageHost = await createJSPageAcceptanceHost(page, session, binding);

        const surface = await readFlowRunJs(page, session, jsPageHost.pageUid);
        expect(surface).toMatchObject({
          version: 'v2',
          sourceMode: 'light-extension',
          sourceBinding: binding,
          settings: { outputLabel: 'JS page selected', mode: 1 },
        });
        await expect
          .poll(async () => (await readReferences(page, session, repo.id, entry.id)).length)
          .toBeGreaterThanOrEqual(1);

        const runtimeErrors: string[] = [];
        const capturePageError = (error: Error) => runtimeErrors.push(error.message);
        const captureConsoleError = (message: ConsoleMessage) => {
          if (message.type() === 'error') {
            runtimeErrors.push(message.text());
          }
        };
        page.on('pageerror', capturePageError);
        page.on('console', captureConsoleError);
        try {
          await page.goto(jsPageHost.routePath);
          const jsPage = page.getByTestId('light-extension-acceptance-js-page');
          await expect(jsPage, `JS Page runtime errors: ${runtimeErrors.join('; ')}`).toHaveText(
            `${jsPageHost.pageUid}:JS page selected`,
          );
          await expect(jsPage).toHaveAttribute('data-sdk-get-status', '200');
          await expect(jsPage).toHaveAttribute('data-sdk-post-status', '200');
        } finally {
          page.off('pageerror', capturePageError);
          page.off('console', captureConsoleError);
        }

        reports.push({
          scenario: 'light-extension-js-page-execution',
          route: 'light-extension',
          baselineHeadCommitId: repo.headCommitId,
          saveAttempted: false,
          savedFiles: [],
          newHeadCommitId: repo.headCommitId,
          diagnostics: [],
          referenceCount: (await readReferences(page, session, repo.id, entry.id)).length,
          invariants: {
            pageCreated: true,
            selectableBinding: binding.entryId === entry.id,
            compiledCommitId: (await readEntry(page, session, entry.id)).compiledCommitId,
            uiBehavior: `${jsPageHost.pageUid}:JS page selected`,
            clientSdkGetStatus: 200,
            clientSdkPostStatus: 200,
          },
        });
      });

      await test.step('RunJS value entry binds to a form submit value and executes in the browser', async () => {
        const entry = repo.entries.runjs;
        const binding = getAcceptanceSourceBinding(repo, 'runjs');
        const expectedName = 'runjs-value:RunJS selected:2';
        runJSValueSubmitUid = await createRunJSValueSubmitAction(page, session, fixture, binding);
        const submitModel = await readFlowModel(page, session, runJSValueSubmitUid);
        expect(readRunJSAssignedValue(submitModel, 'name')).toMatchObject({
          version: 'v2',
          sourceMode: 'light-extension',
          sourceBinding: binding,
          settings: { outputLabel: 'RunJS selected', mode: 2 },
        });
        await expect
          .poll(async () => (await readReferences(page, session, repo.id, entry.id)).length)
          .toBeGreaterThanOrEqual(1);

        await page.goto(fixture.routePath);
        await page.getByRole('button', { name: RUNJS_VALUE_SUBMIT_TITLE, exact: true }).click();
        await expect
          .poll(async () => findAcceptanceRecord(page, session, fixture.collectionName, expectedName))
          .toMatchObject({ name: expectedName, status: 'published' });

        reports.push({
          scenario: 'light-extension-runjs-value-execution',
          route: 'light-extension',
          baselineHeadCommitId: repo.headCommitId,
          saveAttempted: false,
          savedFiles: [],
          newHeadCommitId: repo.headCommitId,
          diagnostics: [],
          referenceCount: (await readReferences(page, session, repo.id, entry.id)).length,
          invariants: {
            submitActionCreated: true,
            selectableBinding: binding.entryId === entry.id,
            compiledCommitId: (await readEntry(page, session, entry.id)).compiledCommitId,
            persistedValue: expectedName,
          },
        });
      });

      await test.step('legacy inline source stays on the Flow Surface route', async () => {
        const baseline = await pullWorkspace(page, session, repo.id);
        const before = await readFlowRunJs(page, session, fixture.hosts.jsBlock.uid);
        expect(before).not.toHaveProperty('sourceMode');

        await configureFlowRunJs(page, session, fixture.hosts.jsBlock.uid, {
          code: 'ctx.render(<div data-testid="source-authoring-inline">Inline updated</div>);',
          version: 'v2',
        });
        const after = await readFlowRunJs(page, session, fixture.hosts.jsBlock.uid);
        expect(after).toMatchObject({
          code: 'ctx.render(<div data-testid="source-authoring-inline">Inline updated</div>);',
          version: 'v2',
        });
        expect(after).not.toHaveProperty('sourceMode');
        expect(after).not.toHaveProperty('sourceBinding');

        await page.goto(fixture.routePath);
        await expect(page.getByTestId('source-authoring-inline')).toHaveText('Inline updated');
        const readback = await pullWorkspace(page, session, repo.id);
        expect(readback.headCommitId).toBe(baseline.headCommitId);

        reports.push({
          scenario: 'legacy-inline-update',
          route: 'flow-surface',
          baselineHeadCommitId: baseline.headCommitId,
          saveAttempted: true,
          savedFiles: [],
          newHeadCommitId: readback.headCommitId,
          diagnostics: [],
          invariants: {
            sourceModeAbsentBefore: true,
            sourceModeAbsentAfter: true,
            lightExtensionHeadUnchanged: true,
            uiBehavior: 'Inline updated',
          },
        });
      });

      await test.step('single-file Light Extension update uses targeted preview and delta save', async () => {
        const entry = repo.entries['js-block'];
        const binding = getAcceptanceSourceBinding(repo, 'js-block');
        await configureFlowRunJs(page, session, fixture.hosts.jsBlock.uid, {
          sourceMode: 'light-extension',
          sourceBinding: binding,
          settings: { outputLabel: 'Source authoring', mode: 1 },
        });
        const surfaceBefore = await readFlowRunJs(page, session, fixture.hosts.jsBlock.uid);
        const baseline = await pullWorkspace(page, session, repo.id);
        const entryBefore = await readEntry(page, session, entry.id);
        const references = await readReferences(page, session, repo.id, entry.id);
        expect(references.length).toBeGreaterThanOrEqual(1);

        const source = `ctx.render(<div data-testid="${SINGLE_FILE_TEST_ID}">single:{String(ctx.settings.outputLabel)}:{String(ctx.settings.mode)}</div>);\n`;
        const candidate = replaceWorkspaceFiles(baseline.files, [{ path: entry.entryPath, content: source }]);
        const preview = await previewWorkspace(page, session, {
          repoId: repo.id,
          entryId: entry.id,
          kind: 'js-block',
          entryPath: entry.entryPath,
          files: candidate,
        });
        expect(preview.status).toBe(200);
        expect(preview.data.accepted).toBe(true);

        const saved = await saveDelta(page, session, {
          repoId: repo.id,
          expectedHeadCommitId: baseline.headCommitId,
          message: 'Update source authoring JS block',
          files: [{ path: entry.entryPath, content: source, language: 'typescript' }],
        });
        repo.headCommitId = saved.commit.id;

        const fileAfter = await readFile(page, session, repo.id, entry.entryPath);
        const entryAfter = await readEntry(page, session, entry.id);
        const surfaceAfter = await readFlowRunJs(page, session, fixture.hosts.jsBlock.uid);
        expect(fileAfter.content).toBe(source);
        expect(entryAfter.compiledCommitId).toBe(saved.commit.id);
        expect(entryAfter.runtimeCodeHash).not.toBe(entryBefore.runtimeCodeHash);
        expect(surfaceAfter.code).toBe(surfaceBefore.code);
        expect(surfaceAfter.sourceBinding).toEqual(surfaceBefore.sourceBinding);
        expect(surfaceAfter.settings).toEqual(surfaceBefore.settings);

        await page.reload();
        await expect(page.getByTestId(SINGLE_FILE_TEST_ID)).toHaveText('single:Source authoring:1');

        reports.push({
          scenario: 'light-extension-single-file',
          route: 'light-extension',
          baselineHeadCommitId: baseline.headCommitId,
          previewStatus: preview.status,
          previewAccepted: preview.data.accepted,
          saveAttempted: true,
          savedFiles: [entry.entryPath],
          newHeadCommitId: saved.commit.id,
          diagnostics: preview.data.diagnostics,
          referenceCount: references.length,
          invariants: {
            deltaFileCount: 1,
            fallbackPreserved: surfaceAfter.code === surfaceBefore.code,
            bindingPreserved:
              JSON.stringify(surfaceAfter.sourceBinding) === JSON.stringify(surfaceBefore.sourceBinding),
            settingsPreserved: JSON.stringify(surfaceAfter.settings) === JSON.stringify(surfaceBefore.settings),
            compiledCommitAdvanced: entryAfter.compiledCommitId === saved.commit.id,
            uiBehavior: 'single:Source authoring:1',
          },
        });
      });

      await test.step('shared helper update previews the whole workspace and updates both bound surfaces', async () => {
        await configureFlowRunJs(page, session, fixture.hosts.jsItem.uid, {
          sourceMode: 'light-extension',
          sourceBinding: getAcceptanceSourceBinding(repo, 'js-item'),
          settings: { outputLabel: 'Shared item', mode: 1 },
        });
        const baseline = await pullWorkspace(page, session, repo.id);
        const blockEntry = repo.entries['js-block'];
        const itemEntry = repo.entries['js-item'];
        const unrelatedEntry = repo.entries['js-field'];
        const unrelatedBefore = requireWorkspaceFile(baseline.files, unrelatedEntry.entryPath).content;
        const sharedPath = 'src/shared/source-authoring.ts';
        const sharedSource = 'export const sharedLabel = "shared-v2";\n';
        const blockSource = `import { sharedLabel } from '../../../shared/source-authoring';\nctx.render(<div data-testid="${SHARED_BLOCK_TEST_ID}">{sharedLabel}:block</div>);\n`;
        const itemSource = `import { sharedLabel } from '../../../shared/source-authoring';\nctx.render(<span data-testid="${SHARED_ITEM_TEST_ID}">{sharedLabel}:item</span>);\n`;
        const delta = [
          { path: blockEntry.entryPath, content: blockSource, language: 'typescript' },
          { path: itemEntry.entryPath, content: itemSource, language: 'typescript' },
          { path: sharedPath, content: sharedSource, language: 'typescript' },
        ];
        const candidate = replaceWorkspaceFiles(baseline.files, delta);
        const preview = await previewWorkspace(page, session, { repoId: repo.id, files: candidate });
        expect(preview.status).toBe(200);
        expect(preview.data.accepted).toBe(true);
        expect(preview.data.entries?.length).toBeGreaterThanOrEqual(4);
        expect(preview.data.entries?.every((entry) => entry.accepted)).toBe(true);

        const saved = await saveDelta(page, session, {
          repoId: repo.id,
          expectedHeadCommitId: baseline.headCommitId,
          message: 'Update shared source authoring helper',
          files: delta,
        });
        repo.headCommitId = saved.commit.id;
        const unrelatedAfter = await readFile(page, session, repo.id, unrelatedEntry.entryPath);
        expect(unrelatedAfter.content).toBe(unrelatedBefore);

        await page.reload();
        await expect(page.getByTestId(SHARED_BLOCK_TEST_ID)).toHaveText('shared-v2:block');
        await expect(page.getByTestId(SHARED_ITEM_TEST_ID)).toHaveText('shared-v2:item');

        reports.push({
          scenario: 'light-extension-shared-helper',
          route: 'light-extension',
          baselineHeadCommitId: baseline.headCommitId,
          previewStatus: preview.status,
          previewAccepted: preview.data.accepted,
          saveAttempted: true,
          savedFiles: delta.map((file) => file.path),
          newHeadCommitId: saved.commit.id,
          diagnostics: preview.data.diagnostics,
          invariants: {
            wholeWorkspacePreview: true,
            everyEntryAccepted: preview.data.entries?.every((entry) => entry.accepted) === true,
            unrelatedEntryPreserved: unrelatedAfter.content === unrelatedBefore,
            uiBehaviors: ['shared-v2:block', 'shared-v2:item'],
          },
        });
      });

      await test.step('422 diagnostics are repaired before save', async () => {
        const entry = repo.entries['js-field'];
        const baseline = await pullWorkspace(page, session, repo.id);
        const brokenSource = 'const broken: = 1;\nctx.render(String(broken));\n';
        const brokenCandidate = replaceWorkspaceFiles(baseline.files, [
          { path: entry.entryPath, content: brokenSource },
        ]);
        const brokenPreview = await previewWorkspace(page, session, {
          repoId: repo.id,
          entryId: entry.id,
          kind: 'js-field',
          entryPath: entry.entryPath,
          files: brokenCandidate,
        });
        expect(brokenPreview.status).toBe(422);
        expect(brokenPreview.data.accepted).toBe(false);
        expect(
          brokenPreview.data.diagnostics.some(
            (diagnostic) =>
              diagnostic.path === entry.entryPath &&
              typeof diagnostic.code === 'string' &&
              typeof diagnostic.line === 'number' &&
              typeof diagnostic.column === 'number',
          ),
        ).toBe(true);
        expect((await pullWorkspace(page, session, repo.id)).headCommitId).toBe(baseline.headCommitId);

        const fixedSource = 'ctx.render(<span data-testid="source-authoring-field-fixed">fixed</span>);\n';
        const fixedCandidate = replaceWorkspaceFiles(baseline.files, [{ path: entry.entryPath, content: fixedSource }]);
        const fixedPreview = await previewWorkspace(page, session, {
          repoId: repo.id,
          entryId: entry.id,
          kind: 'js-field',
          entryPath: entry.entryPath,
          files: fixedCandidate,
        });
        expect(fixedPreview.status).toBe(200);
        expect(fixedPreview.data.accepted).toBe(true);
        const saved = await saveDelta(page, session, {
          repoId: repo.id,
          expectedHeadCommitId: baseline.headCommitId,
          message: 'Repair source authoring compile diagnostics',
          files: [{ path: entry.entryPath, content: fixedSource, language: 'typescript' }],
        });
        repo.headCommitId = saved.commit.id;

        reports.push({
          scenario: 'compile-error-recovery',
          route: 'light-extension',
          baselineHeadCommitId: baseline.headCommitId,
          previewStatus: brokenPreview.status,
          previewAccepted: brokenPreview.data.accepted,
          saveAttempted: true,
          savedFiles: [entry.entryPath],
          newHeadCommitId: saved.commit.id,
          diagnostics: brokenPreview.data.diagnostics,
          invariants: {
            failedPreviewCreatedNoCommit: true,
            diagnosticsBatchRepaired: fixedPreview.data.accepted,
          },
        });
      });

      await test.step('whole-workspace 207 blocks save and keeps Head unchanged', async () => {
        const baseline = await pullWorkspace(page, session, repo.id);
        const entry = repo.entries['js-action'];
        const candidate = replaceWorkspaceFiles(baseline.files, [
          { path: entry.entryPath, content: 'const invalid: = ;\n' },
        ]);
        const preview = await previewWorkspace(page, session, { repoId: repo.id, files: candidate });
        expect(preview.status).toBe(207);
        expect(preview.data.accepted).toBe(false);
        expect(preview.data.entries?.some((item) => item.accepted)).toBe(true);
        expect(preview.data.entries?.some((item) => !item.accepted)).toBe(true);
        const current = await pullWorkspace(page, session, repo.id);
        expect(current.headCommitId).toBe(baseline.headCommitId);

        reports.push({
          scenario: 'whole-workspace-partial-preview',
          route: 'blocked',
          baselineHeadCommitId: baseline.headCommitId,
          previewStatus: preview.status,
          previewAccepted: preview.data.accepted,
          saveAttempted: false,
          savedFiles: [],
          newHeadCommitId: current.headCommitId,
          diagnostics: preview.data.diagnostics,
          invariants: {
            acceptedEntryCount: countPreviewEntries(preview.data.entries, true),
            rejectedEntryCount: countPreviewEntries(preview.data.entries, false),
            headUnchanged: true,
          },
        });
      });

      await test.step('non-overlapping concurrent changes rebase after 409 and preserve both edits', async () => {
        const baseline = await pullWorkspace(page, session, repo.id);
        const actionEntry = repo.entries['js-action'];
        const itemEntry = repo.entries['js-item'];
        const actionSource = 'ctx.message.success("concurrent-a");\n';
        const itemSource = `import { sharedLabel } from '../../../shared/source-authoring';\nctx.render(<span data-testid="${SHARED_ITEM_TEST_ID}">{sharedLabel}:concurrent-b</span>);\n`;
        const actionCandidate = replaceWorkspaceFiles(baseline.files, [
          { path: actionEntry.entryPath, content: actionSource },
        ]);
        const itemCandidate = replaceWorkspaceFiles(baseline.files, [
          { path: itemEntry.entryPath, content: itemSource },
        ]);
        expect(
          (
            await previewWorkspace(page, session, {
              repoId: repo.id,
              entryId: actionEntry.id,
              kind: 'js-action',
              entryPath: actionEntry.entryPath,
              files: actionCandidate,
            })
          ).data.accepted,
        ).toBe(true);
        expect(
          (
            await previewWorkspace(page, session, {
              repoId: repo.id,
              entryId: itemEntry.id,
              kind: 'js-item',
              entryPath: itemEntry.entryPath,
              files: itemCandidate,
            })
          ).data.accepted,
        ).toBe(true);

        const savedA = await saveDelta(page, session, {
          repoId: repo.id,
          expectedHeadCommitId: baseline.headCommitId,
          message: 'Save concurrent source authoring change A',
          files: [{ path: actionEntry.entryPath, content: actionSource, language: 'typescript' }],
        });
        const staleB = await page.request.post('/api/lightExtensionFiles:saveSource', {
          headers: session.headers,
          data: {
            repoId: repo.id,
            expectedHeadCommitId: baseline.headCommitId,
            message: 'Reject stale concurrent source authoring change B',
            files: [{ path: itemEntry.entryPath, content: itemSource, language: 'typescript' }],
          },
        });
        expect(staleB.status()).toBe(409);
        const staleError = await readApiError(staleB);
        expect(staleError.code).toBe('LIGHT_EXTENSION_SOURCE_OUTDATED');

        const rebased = await pullWorkspace(page, session, repo.id);
        expect(rebased.headCommitId).toBe(savedA.commit.id);
        const rebasedCandidate = replaceWorkspaceFiles(rebased.files, [
          { path: itemEntry.entryPath, content: itemSource },
        ]);
        const rebasedPreview = await previewWorkspace(page, session, {
          repoId: repo.id,
          entryId: itemEntry.id,
          kind: 'js-item',
          entryPath: itemEntry.entryPath,
          files: rebasedCandidate,
        });
        expect(rebasedPreview.data.accepted).toBe(true);
        const savedB = await saveDelta(page, session, {
          repoId: repo.id,
          expectedHeadCommitId: rebased.headCommitId,
          message: 'Rebase concurrent source authoring change B',
          files: [{ path: itemEntry.entryPath, content: itemSource, language: 'typescript' }],
        });
        repo.headCommitId = savedB.commit.id;
        expect((await readFile(page, session, repo.id, actionEntry.entryPath)).content).toBe(actionSource);
        expect((await readFile(page, session, repo.id, itemEntry.entryPath)).content).toBe(itemSource);

        reports.push({
          scenario: 'concurrent-non-overlapping',
          route: 'light-extension',
          baselineHeadCommitId: baseline.headCommitId,
          previewStatus: rebasedPreview.status,
          previewAccepted: rebasedPreview.data.accepted,
          saveAttempted: true,
          savedFiles: [actionEntry.entryPath, itemEntry.entryPath],
          newHeadCommitId: savedB.commit.id,
          diagnostics: rebasedPreview.data.diagnostics,
          invariants: {
            staleSaveStatus: staleB.status(),
            staleSaveCode: staleError.code,
            rebasedFrom: savedA.commit.id,
            bothChangesPreserved: true,
          },
        });
      });

      await test.step('overlapping concurrent changes stop after the stale save conflict', async () => {
        const baseline = await pullWorkspace(page, session, repo.id);
        const entry = repo.entries['js-field'];
        const sourceA = 'ctx.render(<span>overlap-a</span>);\n';
        const sourceB = 'ctx.render(<span>overlap-b</span>);\n';
        for (const source of [sourceA, sourceB]) {
          const preview = await previewWorkspace(page, session, {
            repoId: repo.id,
            entryId: entry.id,
            kind: 'js-field',
            entryPath: entry.entryPath,
            files: replaceWorkspaceFiles(baseline.files, [{ path: entry.entryPath, content: source }]),
          });
          expect(preview.data.accepted).toBe(true);
        }
        const savedA = await saveDelta(page, session, {
          repoId: repo.id,
          expectedHeadCommitId: baseline.headCommitId,
          message: 'Save overlapping source authoring change A',
          files: [{ path: entry.entryPath, content: sourceA, language: 'typescript' }],
        });
        const staleB = await page.request.post('/api/lightExtensionFiles:saveSource', {
          headers: session.headers,
          data: {
            repoId: repo.id,
            expectedHeadCommitId: baseline.headCommitId,
            message: 'Reject overlapping source authoring change B',
            files: [{ path: entry.entryPath, content: sourceB, language: 'typescript' }],
          },
        });
        expect(staleB.status()).toBe(409);
        const staleError = await readApiError(staleB);
        expect(staleError.code).toBe('LIGHT_EXTENSION_SOURCE_OUTDATED');
        const current = await pullWorkspace(page, session, repo.id);
        expect(current.headCommitId).toBe(savedA.commit.id);
        expect(requireWorkspaceFile(current.files, entry.entryPath).content).toBe(sourceA);
        repo.headCommitId = savedA.commit.id;

        reports.push({
          scenario: 'concurrent-overlapping',
          route: 'blocked',
          baselineHeadCommitId: baseline.headCommitId,
          saveAttempted: true,
          savedFiles: [entry.entryPath],
          newHeadCommitId: savedA.commit.id,
          diagnostics: [],
          invariants: {
            decision: 'blocked',
            overlapPaths: [entry.entryPath],
            staleSaveStatus: staleB.status(),
            staleSaveCode: staleError.code,
            secondChangeSaved: false,
          },
        });
      });

      await test.step('shared reference visibility blocks current-only edits', async () => {
        const secondBlockUid = await addInlineJsBlock(page, session, fixture, 'Shared reference owner');
        await configureFlowRunJs(page, session, secondBlockUid, {
          sourceMode: 'light-extension',
          sourceBinding: getAcceptanceSourceBinding(repo, 'js-block'),
          settings: { outputLabel: 'Second owner', mode: 1 },
        });
        const baseline = await pullWorkspace(page, session, repo.id);
        const entry = repo.entries['js-block'];
        await expect
          .poll(async () => (await readReferences(page, session, repo.id, entry.id)).length)
          .toBeGreaterThanOrEqual(2);
        const references = await readReferences(page, session, repo.id, entry.id);
        const current = await pullWorkspace(page, session, repo.id);
        expect(current.headCommitId).toBe(baseline.headCommitId);

        await configureFlowRunJs(page, session, secondBlockUid, {
          sourceMode: 'inline',
        });

        reports.push({
          scenario: 'shared-scope-current-only',
          route: 'blocked',
          baselineHeadCommitId: baseline.headCommitId,
          saveAttempted: false,
          savedFiles: [],
          newHeadCommitId: current.headCommitId,
          diagnostics: [],
          referenceCount: references.length,
          invariants: {
            requestedScope: 'current-only',
            visibleReferenceCount: references.length,
            completeVisibilityProven: false,
            decision: 'blocked',
          },
        });
      });

      await test.step('raw VSC and RunJS bypasses are denied while archive inspection stays read-only', async () => {
        const baseline = await pullWorkspace(page, session, repo.id);
        const rawVsc = await page.request.post('/api/vscFile:createRepository', {
          headers: session.headers,
          data: {
            ownerType: 'light-extension',
            ownerId: repo.id,
            name: 'source-authoring-bypass',
            defaultRef: 'head',
          },
        });
        expect(rawVsc.status()).toBe(403);

        const locator = flowModelStepLocator(fixture.hosts.jsBlock.uid);
        const rawRunJs = await page.request.post('/api/runJSSources:save', {
          headers: session.headers,
          data: {
            locator,
            message: 'Attempt RunJS bypass',
            entryPath: 'src/client/index.tsx',
            version: 'v2',
            files: [
              {
                path: 'src/client/index.tsx',
                content: 'ctx.render(<div>bypass</div>);',
                language: 'typescript',
                operation: 'upsert',
              },
            ],
          },
        });
        expect(rawRunJs.status()).toBe(403);

        const zip = new JSZip();
        for (const file of baseline.files) {
          zip.file(file.path, file.content);
        }
        const inspect = await page.request.post('/api/lightExtensionRepos:inspectSourceArchive', {
          headers: session.headers,
          data: {
            repoId: repo.id,
            zipBase64: await zip.generateAsync({ type: 'base64' }),
          },
        });
        const inspected = await readApiResponse<{ files: WorkspaceFile[] }>(
          inspect,
          'Inspect source authoring archive',
        );
        expect(inspected.files).toHaveLength(baseline.files.length);
        const current = await pullWorkspace(page, session, repo.id);
        expect(current.headCommitId).toBe(baseline.headCommitId);

        reports.push({
          scenario: 'forbidden-source-bypasses',
          route: 'blocked',
          baselineHeadCommitId: baseline.headCommitId,
          saveAttempted: false,
          savedFiles: [],
          newHeadCommitId: current.headCommitId,
          diagnostics: [],
          invariants: {
            rawVscStatus: rawVsc.status(),
            rawRunJsStatus: rawRunJs.status(),
            inspectFileCount: inspected.files.length,
            inspectCreatedCommit: false,
          },
        });
      });

      await test.step('ordinary RunJS workspace uses open, full-snapshot preview, and save', async () => {
        const runJsBlockUid = await addInlineJsBlock(page, session, fixture, 'Ordinary RunJS workspace');
        const locator = flowModelStepLocator(runJsBlockUid);
        const lightExtensionBaseline = await pullWorkspace(page, session, repo.id);
        const opened = await postData<RunJSOpenResult>(page, session, '/api/runJSSources:open', {
          locator,
        });
        expect(opened.files.length).toBeGreaterThanOrEqual(2);
        const entryPath = 'src/client/index.tsx';
        const entrySource = `import { workspaceLabel } from './shared';\nctx.render(<div data-testid="${RUNJS_WORKSPACE_TEST_ID}">{workspaceLabel}</div>);\n`;
        const snapshot = replaceWorkspaceFiles(opened.files, [
          { path: entryPath, content: entrySource, language: 'typescript' },
          { path: 'src/client/shared.ts', content: 'export const workspaceLabel = "runjs-workspace-v2";\n' },
        ]).map((file) => ({ ...file, operation: 'upsert' as const }));
        const preview = await postData<{ artifact: { diagnostics: Array<Record<string, unknown>> } }>(
          page,
          session,
          '/api/runJSSources:compilePreview',
          {
            locator,
            repoId: opened.repository.repoId,
            baseCommitId: opened.repository.headCommitId,
            entryPath,
            version: 'v2',
            files: snapshot,
          },
        );
        expect(preview.artifact.diagnostics.filter((diagnostic) => diagnostic.severity === 'error')).toEqual([]);
        const saved = await postData<{
          commit: { id: string };
          repository: { headCommitId: string | null };
          artifact: { diagnostics: Array<Record<string, unknown>> };
        }>(page, session, '/api/runJSSources:save', {
          locator,
          repoId: opened.repository.repoId,
          baseCommitId: opened.repository.headCommitId,
          baseOwnerFingerprint: opened.ownerFingerprint,
          message: 'Save ordinary RunJS source workspace',
          entryPath,
          version: 'v2',
          files: snapshot,
        });
        expect(saved.repository.headCommitId).toBe(saved.commit.id);
        expect(saved.artifact.diagnostics.filter((diagnostic) => diagnostic.severity === 'error')).toEqual([]);
        expect((await pullWorkspace(page, session, repo.id)).headCommitId).toBe(lightExtensionBaseline.headCommitId);

        await page.reload();
        await expect(page.getByTestId(RUNJS_WORKSPACE_TEST_ID)).toHaveText('runjs-workspace-v2');

        reports.push({
          scenario: 'ordinary-runjs-workspace',
          route: 'runjs-workspace',
          baselineHeadCommitId: opened.repository.headCommitId,
          previewStatus: 200,
          previewAccepted: true,
          saveAttempted: true,
          savedFiles: snapshot.map((file) => file.path),
          newHeadCommitId: saved.commit.id,
          diagnostics: [],
          invariants: {
            fullSnapshotFileCount: snapshot.length,
            sourceRoutes: ['runJSSources:open', 'runJSSources:compilePreview', 'runJSSources:save'],
            lightExtensionApiUsedForSave: false,
            lightExtensionHeadUnchanged: true,
            uiBehavior: 'runjs-workspace-v2',
          },
        });
      });
    } finally {
      const cleanupFailures: string[] = [];
      if (runJSValueSubmitUid) {
        try {
          await switchRunJSValueSubmitActionToInline(page, session, runJSValueSubmitUid);
        } catch (error) {
          cleanupFailures.push(getErrorMessage(error));
        }
      }
      if (jsPageHost) {
        try {
          await destroyJSPageAcceptanceHost(page, session, jsPageHost);
        } catch (error) {
          cleanupFailures.push(getErrorMessage(error));
        }
      }
      if (fixture) {
        try {
          await destroyFlowHostAcceptancePage(page, session, fixture);
        } catch (error) {
          cleanupFailures.push(getErrorMessage(error));
        }
      }
      if (repo) {
        try {
          await removeLightExtensionAcceptanceRepo(page, session, repo.id);
        } catch (error) {
          cleanupFailures.push(getErrorMessage(error));
        }
      }
      let reportFailure: string | undefined;
      try {
        await attachSourceAuthoringReport(testInfo, reports, {
          attempted: true,
          success: cleanupFailures.length === 0,
          failures: cleanupFailures,
          runJsOwnerDestroyedWithPage: Boolean(fixture),
        });
      } catch (error) {
        reportFailure = getErrorMessage(error);
      }
      expect(cleanupFailures, `Source authoring cleanup failed: ${cleanupFailures.join('; ')}`).toEqual([]);
      expect(reportFailure, `Source authoring report failed: ${reportFailure}`).toBeUndefined();
    }
  });
});

async function pullWorkspace(
  page: Page,
  session: RootApiSession,
  repoId: string,
): Promise<{ headCommitId: string; files: WorkspaceFile[] }> {
  const response = await page.request.post('/api/lightExtensionFiles:pull', {
    headers: session.headers,
    data: { repoId, includeContent: 'all' },
  });
  const result = await readApiResponse<LightExtensionPullResult>(response, `Pull Light Extension workspace ${repoId}`);
  if (!result.repo.headCommitId || !Array.isArray(result.files)) {
    throw new Error(`Light Extension workspace ${repoId} is missing Head or files`);
  }
  return {
    headCommitId: result.repo.headCommitId,
    files: result.files.map((file) => {
      if (typeof file.content !== 'string') {
        throw new Error(`Pulled file "${file.path}" does not contain content`);
      }
      return {
        path: file.path,
        content: file.content,
        language: file.language,
        mode: file.mode,
      };
    }),
  };
}

function replaceWorkspaceFiles(files: WorkspaceFile[], changes: WorkspaceFile[]): WorkspaceFile[] {
  const byPath = new Map(files.map((file) => [file.path, { ...file }]));
  for (const change of changes) {
    const existing = byPath.get(change.path);
    byPath.set(change.path, {
      ...existing,
      ...change,
      language: change.language || existing?.language || inferLanguage(change.path),
      mode: change.mode || existing?.mode,
    });
  }
  return Array.from(byPath.values()).sort((left, right) => left.path.localeCompare(right.path));
}

function inferLanguage(path: string): string | undefined {
  if (path.endsWith('.json')) {
    return 'json';
  }
  if (/\.(?:ts|tsx)$/u.test(path)) {
    return 'typescript';
  }
  if (path.endsWith('.md')) {
    return 'markdown';
  }
  return undefined;
}

function requireWorkspaceFile(files: WorkspaceFile[], path: string): WorkspaceFile {
  const file = files.find((candidate) => candidate.path === path);
  if (!file) {
    throw new Error(`Workspace does not contain "${path}"`);
  }
  return file;
}

async function previewWorkspace(
  page: Page,
  session: RootApiSession,
  input: {
    repoId: string;
    files: WorkspaceFile[];
    entryId?: string;
    kind?: string;
    entryPath?: string;
  },
): Promise<{ status: number; data: LightExtensionWorkspacePreviewResult }> {
  const response = await page.request.post('/api/lightExtensions:compileWorkspacePreview', {
    headers: session.headers,
    data: input,
  });
  const body: unknown = await response.json();
  const data = unwrapApiData<LightExtensionWorkspacePreviewResult>(body);
  if (![200, 207, 422].includes(response.status())) {
    throw new Error(`Compile workspace preview failed with HTTP ${response.status()}: ${JSON.stringify(body)}`);
  }
  return { status: response.status(), data };
}

async function saveDelta(
  page: Page,
  session: RootApiSession,
  input: {
    repoId: string;
    expectedHeadCommitId: string;
    message: string;
    files: LightExtensionTreeEntryInput[];
  },
): Promise<LightExtensionSaveSourceResult> {
  const response = await page.request.post('/api/lightExtensionFiles:saveSource', {
    headers: session.headers,
    data: input,
  });
  return readApiResponse<LightExtensionSaveSourceResult>(response, `Save Light Extension delta for ${input.repoId}`);
}

async function readEntry(page: Page, session: RootApiSession, entryId: string): Promise<LightExtensionEntryRecord> {
  const response = await page.request.post('/api/lightExtensionEntries:get', {
    headers: session.headers,
    data: { entryId },
  });
  return readApiResponse<LightExtensionEntryRecord>(response, `Read Light Extension entry ${entryId}`);
}

async function readFile(
  page: Page,
  session: RootApiSession,
  repoId: string,
  path: string,
): Promise<LightExtensionFileResult> {
  const response = await page.request.post('/api/lightExtensionFiles:getFile', {
    headers: session.headers,
    data: { repoId, path },
  });
  return readApiResponse<LightExtensionFileResult>(response, `Read Light Extension file ${path}`);
}

async function readReferences(
  page: Page,
  session: RootApiSession,
  repoId: string,
  entryId: string,
): Promise<LightExtensionReferenceRecord[]> {
  const response = await page.request.post('/api/lightExtensionReferences:readReferences', {
    headers: session.headers,
    data: { repoId, entryId },
  });
  return readApiResponse<LightExtensionReferenceRecord[]>(response, `Read Light Extension references ${entryId}`);
}

async function configureFlowRunJs(
  page: Page,
  session: RootApiSession,
  uid: string,
  changes: Record<string, unknown>,
): Promise<void> {
  const response = await page.request.post('/api/flowSurfaces:configure', {
    headers: session.headers,
    data: { target: { uid }, changes },
  });
  await assertApiResponseOk(response, `Configure Flow Surface ${uid}`);
}

async function readFlowRunJs(page: Page, session: RootApiSession, uid: string): Promise<FlowRunJsReadback> {
  const response = await page.request.get('/api/flowSurfaces:get', {
    headers: session.headers,
    params: { uid },
  });
  const value = await readApiResponse<unknown>(response, `Read Flow Surface ${uid}`);
  const tree = isRecord(value) && isRecord(value.tree) ? value.tree : {};
  const stepParams = isRecord(tree.stepParams) ? tree.stepParams : {};
  const groupKey = tree.use === 'JSActionModel' ? 'clickSettings' : 'jsSettings';
  const group = isRecord(stepParams[groupKey]) ? stepParams[groupKey] : {};
  return isRecord(group.runJs) ? group.runJs : {};
}

async function createJSPageAcceptanceHost(
  page: Page,
  session: RootApiSession,
  binding: LightExtensionAcceptanceSourceBinding,
): Promise<JSPageAcceptanceHost> {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const pageUid = `source-authoring-js-page-${suffix}`;
  const pageSchemaUid = `source-authoring-js-page-schema-${suffix}`;
  const title = `Source authoring JS Page ${suffix}`;
  const routeResponse = await page.request.post('/api/desktopRoutes:create', {
    headers: session.headers,
    data: {
      type: 'flowPage',
      title,
      icon: 'CodeOutlined',
      schemaUid: pageSchemaUid,
      enableTabs: false,
      displayTitle: false,
      options: { pageType: 'js-page' },
      children: [
        {
          type: 'tabs',
          title: 'Hidden JS Page tab',
          schemaUid: `source-authoring-js-page-tab-${suffix}`,
          tabSchemaName: `source-authoring-js-page-tab-name-${suffix}`,
          hidden: true,
        },
      ],
    },
  });
  const route = await readApiResponse<unknown>(routeResponse, 'Create source authoring JS Page route');
  if (!isRecord(route) || (typeof route.id !== 'string' && typeof route.id !== 'number')) {
    throw new Error('Create source authoring JS Page route response does not contain id');
  }
  const routeId = String(route.id);
  const host = {
    pageUid,
    pageSchemaUid,
    routeId,
    routePath: getModernFlowPagePath(pageSchemaUid),
  };

  try {
    const saveResponse = await page.request.post('/api/flowModels:save', {
      headers: session.headers,
      data: {
        uid: pageUid,
        parentId: pageSchemaUid,
        subKey: 'page',
        subType: 'object',
        use: 'JSPageModel',
        props: {
          routeId,
          title,
          displayTitle: false,
        },
        stepParams: {
          pageSettings: {
            general: {
              title,
              displayTitle: false,
              enableTabs: false,
            },
          },
          jsSettings: {
            runJs: {
              code: 'ctx.render(<div>Inline JS Page fallback</div>);',
              version: 'v2',
              sourceMode: 'light-extension',
              sourceBinding: binding,
              settings: { outputLabel: 'JS page selected', mode: 1 },
            },
          },
        },
      },
    });
    await assertApiResponseOk(saveResponse, 'Save source authoring JS Page model');
    return host;
  } catch (error) {
    const cleanupResponse = await page.request.post('/api/desktopRoutes:destroy', {
      headers: session.headers,
      params: { filterByTk: routeId },
    });
    if (!cleanupResponse.ok() && cleanupResponse.status() !== 404) {
      throw new Error(
        `Create source authoring JS Page failed: ${getErrorMessage(
          error,
        )}; route cleanup failed with HTTP ${cleanupResponse.status()}`,
      );
    }
    throw error;
  }
}

async function destroyJSPageAcceptanceHost(
  page: Page,
  session: RootApiSession,
  host: JSPageAcceptanceHost,
): Promise<void> {
  const failures: string[] = [];
  try {
    const model = await readFlowModel(page, session, host.pageUid);
    const stepParams = isRecord(model.stepParams) ? { ...model.stepParams } : {};
    const jsSettings = isRecord(stepParams.jsSettings) ? { ...stepParams.jsSettings } : {};
    const runJs = isRecord(jsSettings.runJs) ? { ...jsSettings.runJs } : {};
    runJs.sourceMode = 'inline';
    delete runJs.sourceBinding;
    delete runJs.settings;
    jsSettings.runJs = runJs;
    stepParams.jsSettings = jsSettings;
    await saveFlowModel(page, session, model, stepParams, `Switch JS Page ${host.pageUid} to Inline`);
  } catch (error) {
    failures.push(getErrorMessage(error));
  }

  try {
    const response = await page.request.post('/api/flowSurfaces:destroyPage', {
      headers: session.headers,
      data: { uid: host.pageUid },
    });
    if (response.status() !== 404) {
      await assertApiResponseOk(response, `Destroy source authoring JS Page ${host.pageUid}`);
    }
  } catch (error) {
    failures.push(getErrorMessage(error));
  }

  if (failures.length) {
    throw new Error(failures.join('; '));
  }
}

async function createRunJSValueSubmitAction(
  page: Page,
  session: RootApiSession,
  fixture: FlowHostAcceptancePage,
  binding: LightExtensionAcceptanceSourceBinding,
): Promise<string> {
  const response = await page.request.post('/api/flowSurfaces:addAction', {
    headers: session.headers,
    data: {
      target: { uid: fixture.containers.createFormUid },
      type: 'submit',
      settings: { title: RUNJS_VALUE_SUBMIT_TITLE },
    },
  });
  const result = await readApiResponse<unknown>(response, 'Create RunJS value submit action');
  if (!isRecord(result) || (typeof result.uid !== 'string' && typeof result.uid !== 'number')) {
    throw new Error('Create RunJS value submit action response does not contain uid');
  }
  const uid = String(result.uid);
  const model = await readFlowModel(page, session, uid);
  const stepParams = isRecord(model.stepParams) ? { ...model.stepParams } : {};
  const submitSettings = isRecord(stepParams.submitSettings) ? { ...stepParams.submitSettings } : {};
  const assignFieldValues = isRecord(submitSettings.assignFieldValues) ? { ...submitSettings.assignFieldValues } : {};
  assignFieldValues.assignedValues = {
    name: {
      code: 'return "inline-runjs-value-fallback";',
      version: 'v2',
      sourceMode: 'light-extension',
      sourceBinding: binding,
      settings: { outputLabel: 'RunJS selected', mode: 2 },
    },
    status: 'published',
  };
  submitSettings.assignFieldValues = assignFieldValues;
  stepParams.submitSettings = submitSettings;

  await saveFlowModel(page, session, model, stepParams, 'Bind RunJS value entry to submit action');
  return uid;
}

async function switchRunJSValueSubmitActionToInline(page: Page, session: RootApiSession, uid: string): Promise<void> {
  const model = await readFlowModel(page, session, uid);
  const stepParams = isRecord(model.stepParams) ? { ...model.stepParams } : {};
  const submitSettings = isRecord(stepParams.submitSettings) ? { ...stepParams.submitSettings } : {};
  const assignFieldValues = isRecord(submitSettings.assignFieldValues) ? { ...submitSettings.assignFieldValues } : {};
  const assignedValues = isRecord(assignFieldValues.assignedValues) ? { ...assignFieldValues.assignedValues } : {};
  const currentValue = assignedValues.name;
  if (isRecord(currentValue)) {
    const inlineValue: Record<string, unknown> = {
      ...currentValue,
      sourceMode: 'inline',
    };
    assignedValues.name = inlineValue;
  }
  assignFieldValues.assignedValues = assignedValues;
  submitSettings.assignFieldValues = assignFieldValues;
  stepParams.submitSettings = submitSettings;
  await saveFlowModel(page, session, model, stepParams, `Switch RunJS value submit action ${uid} to Inline`);
}

async function saveFlowModel(
  page: Page,
  session: RootApiSession,
  model: Record<string, unknown>,
  stepParams: Record<string, unknown>,
  operation: string,
): Promise<void> {
  const response = await page.request.post('/api/flowModels:save', {
    headers: session.headers,
    data: {
      ...model,
      stepParams,
    },
  });
  await assertApiResponseOk(response, operation);
}

async function readFlowModel(page: Page, session: RootApiSession, uid: string): Promise<Record<string, unknown>> {
  const response = await page.request.get('/api/flowModels:findOne', {
    headers: session.headers,
    params: { uid },
  });
  const model = await readApiResponse<unknown>(response, `Read FlowModel ${uid}`);
  if (!isRecord(model)) {
    throw new Error(`FlowModel ${uid} response is invalid`);
  }
  return model;
}

function readRunJSAssignedValue(model: Record<string, unknown>, fieldName: string): Record<string, unknown> {
  const stepParams = isRecord(model.stepParams) ? model.stepParams : {};
  const submitSettings = isRecord(stepParams.submitSettings) ? stepParams.submitSettings : {};
  const assignFieldValues = isRecord(submitSettings.assignFieldValues) ? submitSettings.assignFieldValues : {};
  const assignedValues = isRecord(assignFieldValues.assignedValues) ? assignFieldValues.assignedValues : {};
  const value = assignedValues[fieldName];
  if (!isRecord(value)) {
    throw new Error(`RunJS assigned value ${fieldName} is missing`);
  }
  return value;
}

async function findAcceptanceRecord(
  page: Page,
  session: RootApiSession,
  collectionName: string,
  expectedName: string,
): Promise<Record<string, unknown> | null> {
  const response = await page.request.get(`/api/${encodeURIComponent(collectionName)}:list`, {
    headers: session.headers,
    params: { pageSize: 100 },
  });
  const result = await readApiResponse<unknown>(response, `List ${collectionName} records`);
  const rows = Array.isArray(result) ? result : isRecord(result) && Array.isArray(result.rows) ? result.rows : [];
  const record = rows.find((row) => isRecord(row) && row.name === expectedName);
  return isRecord(record) ? record : null;
}

async function addInlineJsBlock(
  page: Page,
  session: RootApiSession,
  fixture: FlowHostAcceptancePage,
  title: string,
): Promise<string> {
  const response = await page.request.post('/api/flowSurfaces:addBlock', {
    headers: session.headers,
    data: {
      target: { uid: fixture.tabSchemaUid },
      type: 'jsBlock',
      settings: {
        title,
        version: 'v2',
        code: `ctx.render(<div>${title}</div>);`,
      },
    },
  });
  const result = await readApiResponse<unknown>(response, `Create ${title}`);
  if (!isRecord(result) || (typeof result.uid !== 'string' && typeof result.uid !== 'number')) {
    throw new Error(`${title} response does not contain uid`);
  }
  return String(result.uid);
}

function flowModelStepLocator(modelUid: string): RunJSSourceLocator {
  return {
    kind: 'flowModel.step',
    modelUid,
    flowKey: 'jsSettings',
    stepKey: 'runJs',
    paramPath: ['code'],
  };
}

async function postData<T>(
  page: Page,
  session: RootApiSession,
  route: string,
  data: Record<string, unknown>,
): Promise<T> {
  const response = await page.request.post(route, { headers: session.headers, data });
  return readApiResponse<T>(response, route);
}

async function readApiError(response: APIResponse): Promise<ApiErrorEvidence> {
  const body: unknown = await response.json();
  if (!isRecord(body) || !Array.isArray(body.errors) || !isRecord(body.errors[0])) {
    return {};
  }
  const error = body.errors[0];
  return {
    code: typeof error.code === 'string' ? error.code : undefined,
    message: typeof error.message === 'string' ? error.message : undefined,
    details: isRecord(error.details) ? error.details : undefined,
  };
}

function countPreviewEntries(
  entries: LightExtensionCompilePreviewEntryResult[] | undefined,
  accepted: boolean,
): number {
  return entries?.filter((entry) => entry.accepted === accepted).length || 0;
}

async function attachSourceAuthoringReport(
  testInfo: TestInfo,
  scenarios: SourceAuthoringScenarioReport[],
  cleanup: SourceAuthoringCleanupReport,
): Promise<void> {
  await testInfo.attach('source-authoring-report.json', {
    body: Buffer.from(
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          nodeVersion: process.version,
          appVersion: process.env.NB_APP_VERSION || process.env.npm_package_version || null,
          cliVersion: process.env.NB_CLI_VERSION || null,
          skillVersion: process.env.NB_SKILLS_VERSION || null,
          enabledPlugins: (process.env.NB_ENABLED_PLUGINS || '')
            .split(',')
            .map((plugin) => plugin.trim())
            .filter(Boolean),
          rollbackReadiness: process.env.NB_ROLLBACK_READINESS || null,
          releaseDecision: process.env.NB_RELEASE_DECISION || null,
          scenarios,
          cleanup,
        },
        null,
        2,
      ),
    ),
    contentType: 'application/json',
  });
}

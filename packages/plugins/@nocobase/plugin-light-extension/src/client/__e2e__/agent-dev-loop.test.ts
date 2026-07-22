/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { uid } from '@formily/shared';
import { expect, test } from '@nocobase/test/e2e';
import type { APIResponse, Page } from '@playwright/test';

const execFileAsync = promisify(execFile);
const CLI_BIN = resolve('packages/core/cli/bin/run.js');
const PREVIEW_TOKEN_PREFIX = 'light-preview-v1.';

type EntryKind = 'js-block' | 'js-page';

interface ApiResult {
  response: APIResponse;
  data: unknown;
  body: unknown;
}

interface BrowserSession {
  apiBaseUrl: string;
  authenticator: string;
  headers: Record<string, string>;
  role: string;
  token: string;
}

interface EntryRecord {
  id: string;
  entryName: string;
  entryPath: string;
  kind: EntryKind;
}

interface RepoFixture {
  id: string;
  title: string;
  entries: Record<EntryKind, EntryRecord>;
}

interface HostFixture {
  kind: EntryKind;
  modelUid: string;
  ownerLocator: Record<string, unknown>;
  persistedTestId: string;
  routePath: string;
  routeId?: string;
}

interface PreviewSessionDescriptor {
  schemaVersion: 1;
  sessionId: string;
  repoId: string;
  entryId: string;
  ownerLocator: Record<string, unknown>;
  snapshotId: string;
  contextHash: string;
  artifactHash: string;
  executionId: string;
}

interface CliResult {
  code: number;
  stdout: string;
  stderr: string;
}

test.describe('Light Extension Agent development loop', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(900_000);

  test('runs real CLI and manual Host Preview loops for JS Block and JS Page without bypassing review or CAS', async ({
    page,
  }) => {
    page.setDefaultTimeout(25_000);
    const suffix = uid()
      .toLowerCase()
      .replace(/[^a-z0-9]+/gu, '')
      .slice(0, 10);
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'nocobase-agent-loop-e2e-'));
    const blockWorkspace = join(workspaceRoot, 'block');
    const pageWorkspace = join(workspaceRoot, 'page');
    const session = await prepareBrowserSession(page);
    let repo: RepoFixture | undefined;
    let blockHost: HostFixture | undefined;
    let pageHost: HostFixture | undefined;

    try {
      repo = await createRepo(page, session, suffix);
      blockHost = await createBlockHost(page, session, repo, suffix);
      pageHost = await createPageHost(page, session, repo, suffix);

      await test.step('JS Block: pull, reject a static error, then accept the runtime-error candidate', async () => {
        const entry = repo.entries['js-block'];
        const pull = await runLightCli(session, [
          'pull',
          '--repo',
          repo.id,
          '--entry',
          entry.id,
          '--dir',
          blockWorkspace,
          '--owner-locator',
          JSON.stringify(blockHost.ownerLocator),
          '--json-output',
        ]);
        expect(pull.code, pull.stderr).toBe(0);

        const staticFailureSource = blockStaticFailureSource();
        await writeFile(join(blockWorkspace, entry.entryPath), staticFailureSource);
        const rejected = await runLightCli(session, ['dev', '--dir', blockWorkspace, '--once']);
        expect(rejected.code, rejected.stderr).toBe(2);
        expect(rejected.stdout).toContain('source_parse_error');
        expect(rejected.stdout).toContain('"agentState":"check_failed"');
        expect(rejected.stdout).toContain(`"path":"${entry.entryPath}"`);
        expect(rejected.stdout).toContain('"line":2');

        const workspace = await openHostWorkspace(page, blockHost);
        await replaceEditorSource(page, staticFailureSource);
        const checkResponsePromise = page.waitForResponse((response) =>
          response.url().includes('/api/lightExtensions:compileWorkspacePreview'),
        );
        await workspace.getByRole('button', { name: 'Run', exact: true }).click();
        const checkResponse = await checkResponsePromise;
        expect(checkResponse.status()).toBe(422);
        await expect(workspace.getByText('source_parse_error', { exact: true })).toBeVisible();
        const openProblem = workspace.getByRole('button', { name: /Open problem source:.*Line 2/u });
        await expect(openProblem).toBeVisible();
        await openProblem.click();
        await expect(page.locator('.cm-activeLine').last()).toContainText('const broken = ;');
        await discardWorkspace(page, workspace);

        await writeFile(join(blockWorkspace, entry.entryPath), blockPromiseFailureSource());
        const accepted = await runLightCli(session, ['dev', '--dir', blockWorkspace, '--once']);
        expect(accepted.code, accepted.stderr).toBe(0);
        expect(accepted.stdout).toContain('"accepted":true');
        expect(accepted.stdout).toContain('"agentState":"ready_for_preview"');
      });

      await test.step('JS Block: stream a real Promise rejection, stale it, repair, review Diff, and save explicitly', async () => {
        const entry = repo.entries['js-block'];
        const workspace = await openHostWorkspace(page, blockHost);
        await replaceEditorSource(page, blockPromiseFailureSource());
        const failedPreview = await runHostPreview(page, session, workspace, repo, entry, blockHost);
        await expect(workspace.getByText('host_preview_promise_rejection', { exact: true })).toBeVisible();
        await expect(workspace.getByText('agent runtime promise failure', { exact: true })).toBeVisible();
        await expect(workspace.getByText('Active', { exact: true })).toBeVisible();
        await expect(workspace.getByRole('button', { name: 'Copy', exact: true })).toBeVisible();

        const followedFailure = await runLightCli(session, [
          'problems',
          '--dir',
          blockWorkspace,
          '--follow',
          encodePreviewToken(failedPreview),
          '--once',
        ]);
        expect(followedFailure.code, followedFailure.stderr).toBe(2);
        expect(followedFailure.stdout).toContain('host_preview_promise_rejection');
        expect(followedFailure.stdout).toContain('"agentState":"runtime_failed"');

        const repairedSource = blockRepairedSource();
        await writeFile(join(blockWorkspace, entry.entryPath), repairedSource);
        const repairedCheck = await runLightCli(session, ['dev', '--dir', blockWorkspace, '--once']);
        expect(repairedCheck.code, repairedCheck.stderr).toBe(0);
        const staleLocalFollow = await runLightCli(session, [
          'problems',
          '--dir',
          blockWorkspace,
          '--follow',
          encodePreviewToken(failedPreview),
          '--once',
        ]);
        expect(staleLocalFollow.code).not.toBe(0);
        expect(await readFile(join(blockWorkspace, entry.entryPath), 'utf8')).toBe(repairedSource);

        await replaceEditorSource(page, repairedSource);
        const repairedPreview = await runHostPreview(page, session, workspace, repo, entry, blockHost);
        await expect(workspace.getByText('No problems', { exact: true })).toBeVisible();
        await expect(page.getByTestId('agent-loop-block-repaired')).toHaveText('Block repaired');
        const staleRemote = await watchPreviewSession(page, session, failedPreview);
        expect(requireRecord(staleRemote).state).toBe('stale');

        await reviewDiffAndClose(page, workspace);
        const completed = await watchPreviewSession(page, session, repairedPreview);
        expect(requireRecord(completed).state).toBe('completed');
        await expect(page.getByTestId('agent-loop-block-initial')).toHaveText('Initial block');

        const followedRepair = await runLightCli(session, [
          'problems',
          '--dir',
          blockWorkspace,
          '--follow',
          encodePreviewToken(repairedPreview),
          '--once',
        ]);
        expect(followedRepair.code, followedRepair.stderr).toBe(0);
        expect(followedRepair.stdout).toContain('"previewState":"completed"');
        expect(followedRepair.stdout).toContain('"agentState":"ready_to_save"');

        const saved = await runLightCli(session, [
          'save',
          '--dir',
          blockWorkspace,
          '--message',
          'Save reviewed Agent block patch',
          '--yes',
          '--json-output',
        ]);
        expect(saved.code, saved.stderr).toBe(0);
        expect(saved.stdout).toContain('"ok": true');
        await page.reload();
        await expect(page.getByTestId('agent-loop-block-repaired')).toHaveText('Block repaired');
      });

      await test.step('JS Page: report React and API 403 Problems, repair, and retain the patch on CAS conflict', async () => {
        const entry = repo.entries['js-page'];
        const pull = await runLightCli(session, [
          'pull',
          '--repo',
          repo.id,
          '--entry',
          entry.id,
          '--dir',
          pageWorkspace,
          '--owner-locator',
          JSON.stringify(pageHost.ownerLocator),
          '--json-output',
        ]);
        expect(pull.code, pull.stderr).toBe(0);

        const reactSource = pageReactFailureSource();
        await writeFile(join(pageWorkspace, entry.entryPath), reactSource);
        expect((await runLightCli(session, ['dev', '--dir', pageWorkspace, '--once'])).code).toBe(0);

        let workspace = await openHostWorkspace(page, pageHost);
        await replaceEditorSource(page, reactSource);
        const reactPreview = await runHostPreview(page, session, workspace, repo, entry, pageHost);
        await expect(workspace.getByText('host_preview_react_error', { exact: true })).toBeVisible();
        await expect(workspace.getByText('agent page react failure', { exact: true })).toBeVisible();
        const followedReact = await runLightCli(session, [
          'problems',
          '--dir',
          pageWorkspace,
          '--follow',
          encodePreviewToken(reactPreview),
          '--once',
        ]);
        expect(followedReact.code, followedReact.stderr).toBe(2);
        expect(followedReact.stdout).toContain('host_preview_react_error');

        const promiseFailureSource = pagePromiseFailureSource();
        await writeFile(join(pageWorkspace, entry.entryPath), promiseFailureSource);
        expect((await runLightCli(session, ['dev', '--dir', pageWorkspace, '--once'])).code).toBe(0);
        await replaceEditorSource(page, promiseFailureSource);
        const promisePreview = await runHostPreview(page, session, workspace, repo, entry, pageHost);
        await expect(workspace.getByText('host_preview_promise_rejection', { exact: true })).toBeVisible();
        await expect(workspace.getByText('agent page promise failure', { exact: true })).toBeVisible();
        const followedPromise = await runLightCli(session, [
          'problems',
          '--dir',
          pageWorkspace,
          '--follow',
          encodePreviewToken(promisePreview),
          '--once',
        ]);
        expect(followedPromise.code, followedPromise.stderr).toBe(2);
        expect(followedPromise.stdout).toContain('host_preview_promise_rejection');

        const apiFailureSource = pageApiFailureSource(repo.id);
        await writeFile(join(pageWorkspace, entry.entryPath), apiFailureSource);
        expect((await runLightCli(session, ['dev', '--dir', pageWorkspace, '--once'])).code).toBe(0);
        await replaceEditorSource(page, apiFailureSource);
        const apiPreview = await runHostPreview(page, session, workspace, repo, entry, pageHost);
        await expect(workspace.getByText('host_preview_api_permission_denied', { exact: true })).toBeVisible();
        const followedApi = await runLightCli(session, [
          'problems',
          '--dir',
          pageWorkspace,
          '--follow',
          encodePreviewToken(apiPreview),
          '--once',
        ]);
        expect(followedApi.code, followedApi.stderr).toBe(2);
        expect(followedApi.stdout).toContain('host_preview_api_permission_denied');
        expect(requireRecord(await watchPreviewSession(page, session, reactPreview)).state).toBe('stale');
        expect(requireRecord(await watchPreviewSession(page, session, promisePreview)).state).toBe('stale');

        const repairedSource = pageRepairedSource();
        await writeFile(join(pageWorkspace, entry.entryPath), repairedSource);
        expect((await runLightCli(session, ['dev', '--dir', pageWorkspace, '--once'])).code).toBe(0);
        await replaceEditorSource(page, repairedSource);
        const repairedPreview = await runHostPreview(page, session, workspace, repo, entry, pageHost);
        await expect(workspace.getByText('No problems', { exact: true })).toBeVisible();
        await expect(page.getByTestId('agent-loop-page-repaired')).toHaveText('Page repaired');
        await reviewDiffAndClose(page, workspace);
        expect(requireRecord(await watchPreviewSession(page, session, repairedPreview)).state).toBe('completed');
        const followedRepair = await runLightCli(session, [
          'problems',
          '--dir',
          pageWorkspace,
          '--follow',
          encodePreviewToken(repairedPreview),
          '--once',
        ]);
        expect(followedRepair.code, followedRepair.stderr).toBe(0);
        expect(followedRepair.stdout).toContain('"agentState":"ready_to_save"');

        const current = requireRecord(
          await postApi(page, session.headers, '/api/lightExtensionFiles:pull', {
            repoId: repo.id,
            includeContent: 'none',
          }).then((result) => result.data),
        );
        const currentRepo = requireRecord(current.repo);
        const currentHead = requireNullableString(currentRepo.headCommitId, 'current repository Head');
        const conflictingSave = await postApi(page, session.headers, '/api/lightExtensionFiles:saveSource', {
          repoId: repo.id,
          expectedHeadCommitId: currentHead,
          message: 'Create Agent loop CAS conflict',
          files: [
            {
              path: repo.entries['js-block'].entryPath,
              operation: 'upsert',
              content: `${blockRepairedSource()}// Agent loop conflict ${suffix}\n`,
              encoding: 'utf8',
              language: 'typescript',
              mode: '100644',
            },
          ],
        });
        expect(conflictingSave.response.ok(), JSON.stringify(conflictingSave.body)).toBe(true);

        const conflicted = await runLightCli(session, [
          'save',
          '--dir',
          pageWorkspace,
          '--message',
          'Reject stale Agent page patch',
          '--yes',
          '--json-output',
        ]);
        expect(conflicted.code).toBe(3);
        expect(`${conflicted.stdout}\n${conflicted.stderr}`).toContain('LIGHT_EXTENSION_SOURCE_OUTDATED');
        expect(`${conflicted.stdout}\n${conflicted.stderr}`).toContain('"httpStatus": 409');
        expect(await readFile(join(pageWorkspace, entry.entryPath), 'utf8')).toBe(repairedSource);

        const repull = await runLightCli(session, [
          'pull',
          '--repo',
          repo.id,
          '--entry',
          entry.id,
          '--dir',
          pageWorkspace,
          '--owner-locator',
          JSON.stringify(pageHost.ownerLocator),
          '--force',
          '--json-output',
        ]);
        expect(repull.code, repull.stderr).toBe(0);
        await writeFile(join(pageWorkspace, entry.entryPath), repairedSource);
        expect((await runLightCli(session, ['dev', '--dir', pageWorkspace, '--once'])).code).toBe(0);

        workspace = await openHostWorkspace(page, pageHost);
        await replaceEditorSource(page, repairedSource);
        const finalPreview = await runHostPreview(page, session, workspace, repo, entry, pageHost);
        await expect(workspace.getByText('No problems', { exact: true })).toBeVisible();
        await reviewDiffAndClose(page, workspace);
        expect(requireRecord(await watchPreviewSession(page, session, finalPreview)).state).toBe('completed');
        const finalFollow = await runLightCli(session, [
          'problems',
          '--dir',
          pageWorkspace,
          '--follow',
          encodePreviewToken(finalPreview),
          '--once',
        ]);
        expect(finalFollow.code, finalFollow.stderr).toBe(0);
        expect(finalFollow.stdout).toContain('"agentState":"ready_to_save"');
        const saved = await runLightCli(session, [
          'save',
          '--dir',
          pageWorkspace,
          '--message',
          'Save reviewed Agent page patch',
          '--yes',
          '--json-output',
        ]);
        expect(saved.code, saved.stderr).toBe(0);
        await page.reload();
        await expect(page.getByTestId('agent-loop-page-repaired')).toHaveText('Page repaired');
      });
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
      if (blockHost) {
        await cleanupHost(page, session, blockHost);
      }
      if (pageHost) {
        await cleanupHost(page, session, pageHost);
      }
      if (repo) {
        await safePostApi(page, session.headers, '/api/lightExtensionRepos:delete', { repoId: repo.id });
      }
    }
  });
});

async function prepareBrowserSession(page: Page): Promise<BrowserSession> {
  await page.goto('/v/');
  await expect(page.getByTestId('user-center-button')).toBeVisible();
  await page.evaluate(() => {
    window.localStorage.setItem('NOCOBASE_V2_FLOW_SETTINGS_ENABLED', '1');
  });
  await page.reload();
  await expect(page.getByTestId('user-center-button')).toBeVisible();
  const values = await page.evaluate(() => ({
    authenticator: window.localStorage.getItem('NOCOBASE_AUTH') || 'basic',
    role: window.localStorage.getItem('NOCOBASE_ROLE') || 'root',
    token: window.localStorage.getItem('NOCOBASE_TOKEN') || '',
  }));
  if (!values.token) {
    throw new Error('The Playwright browser session does not contain a NocoBase token');
  }
  const apiBaseUrl = `${new URL(page.url()).origin}/api`;
  return {
    ...values,
    apiBaseUrl,
    headers: {
      Authorization: `Bearer ${values.token}`,
      'X-Authenticator': values.authenticator,
      'X-Role': values.role,
      'X-With-Acl-Meta': 'true',
    },
  };
}

async function createRepo(page: Page, session: BrowserSession, suffix: string): Promise<RepoFixture> {
  const title = `Agent loop ${suffix}`;
  const created = await postApi(page, session.headers, '/api/lightExtensionRepos:create', {
    name: `agent-loop-${suffix}`,
    title,
    message: 'Create Agent loop E2E source',
    initialFiles: createInitialFiles(),
  });
  expect(created.response.ok(), JSON.stringify(created.body)).toBe(true);
  const repoId = requireString(requireRecord(created.data).id, 'repository id');
  const listed = await postApi(page, session.headers, '/api/lightExtensionEntries:list', { repoId });
  expect(listed.response.ok(), JSON.stringify(listed.body)).toBe(true);
  const entries = readArrayPayload(listed.data, 'entries').map(readEntryRecord);
  const block = entries.find((entry) => entry.kind === 'js-block');
  const jsPage = entries.find((entry) => entry.kind === 'js-page');
  if (!block || !jsPage) {
    throw new Error('The Agent loop repository did not create both JS Block and JS Page entries');
  }
  return { id: repoId, title, entries: { 'js-block': block, 'js-page': jsPage } };
}

async function createBlockHost(
  page: Page,
  session: BrowserSession,
  repo: RepoFixture,
  suffix: string,
): Promise<HostFixture> {
  const createdPage = requireRecord(
    await postApi(page, session.headers, '/api/flowSurfaces:createPage', {
      icon: 'FileOutlined',
      title: `Agent block host ${suffix}`,
      tabTitle: 'Main',
    }).then((result) => result.data),
  );
  const pageUid = requireString(createdPage.pageUid, 'block host page uid');
  const pageSchemaUid = requireString(createdPage.pageSchemaUid, 'block host page schema uid');
  const tabSchemaUid = requireString(createdPage.tabSchemaUid, 'block host tab schema uid');
  const block = requireRecord(
    await postApi(page, session.headers, '/api/flowSurfaces:addBlock', {
      target: { uid: tabSchemaUid },
      type: 'jsBlock',
      settings: {
        title: 'Agent loop JS Block',
        version: 'v2',
        code: 'ctx.render(<div>Inline Agent block fallback</div>);',
      },
    }).then((result) => result.data),
  );
  const modelUid = requireString(block.uid, 'JS Block model uid');
  const entry = repo.entries['js-block'];
  await configureHost(page, session, modelUid, createSourceBinding(repo, entry));
  return {
    kind: 'js-block',
    modelUid,
    ownerLocator: {
      kind: 'flowModel.step',
      modelUid,
      use: 'JSBlockModel',
      stepPath: ['stepParams', 'jsSettings'],
    },
    persistedTestId: 'agent-loop-block-initial',
    routePath: `/v/admin/${encodeURIComponent(pageSchemaUid)}`,
    routeId: pageUid,
  };
}

async function createPageHost(
  page: Page,
  session: BrowserSession,
  repo: RepoFixture,
  suffix: string,
): Promise<HostFixture> {
  const modelUid = `agent-loop-page-${suffix}`;
  const pageSchemaUid = `agent-loop-page-schema-${suffix}`;
  const title = `Agent page host ${suffix}`;
  const route = requireRecord(
    await postApi(page, session.headers, '/api/desktopRoutes:create', {
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
          title: 'Hidden Agent page tab',
          schemaUid: `agent-loop-page-tab-${suffix}`,
          tabSchemaName: `agent-loop-page-tab-name-${suffix}`,
          hidden: true,
        },
      ],
    }).then((result) => result.data),
  );
  const routeId = requireString(route.id, 'JS Page route id');
  const entry = repo.entries['js-page'];
  const saved = await postApi(page, session.headers, '/api/flowModels:save', {
    uid: modelUid,
    parentId: pageSchemaUid,
    subKey: 'page',
    subType: 'object',
    use: 'JSPageModel',
    props: { routeId, title, displayTitle: false },
    stepParams: {
      pageSettings: { general: { title, displayTitle: false, enableTabs: false } },
      jsSettings: {
        runJs: {
          code: 'ctx.render(<div>Inline Agent page fallback</div>);',
          version: 'v2',
          sourceMode: 'light-extension',
          sourceBinding: createSourceBinding(repo, entry),
          settings: {},
        },
      },
    },
  });
  expect(saved.response.ok(), JSON.stringify(saved.body)).toBe(true);
  return {
    kind: 'js-page',
    modelUid,
    ownerLocator: {
      kind: 'flowModel.pageSettings',
      modelUid,
      use: 'JSPageModel',
      stepPath: ['stepParams', 'jsSettings', 'runJs'],
    },
    persistedTestId: 'agent-loop-page-initial',
    routePath: `/v/admin/${encodeURIComponent(pageSchemaUid)}`,
    routeId,
  };
}

async function configureHost(
  page: Page,
  session: BrowserSession,
  modelUid: string,
  sourceBinding: Record<string, unknown>,
): Promise<void> {
  const configured = await postApi(page, session.headers, '/api/flowSurfaces:configure', {
    target: { uid: modelUid },
    changes: { sourceMode: 'light-extension', sourceBinding, settings: {} },
  });
  expect(configured.response.ok(), JSON.stringify(configured.body)).toBe(true);
}

async function openHostWorkspace(page: Page, host: HostFixture) {
  await page.goto(host.routePath);
  await expect(page.getByTestId(host.persistedTestId)).toBeVisible();
  const floatMenuHost = page.locator(`[data-float-menu-model-uid="${host.modelUid}"]`);
  await expect(floatMenuHost).toBeVisible();
  await floatMenuHost.hover();
  await page.locator('[role="button"][aria-label="flows-settings"]').click();
  await page.getByRole('menuitem', { name: 'Write JavaScript', exact: true }).click();
  const workspace = page.getByTestId('light-extension-source-workspace-editor');
  await expect(workspace).toBeVisible();
  await expect(
    workspace.getByText('Host Preview runs this code in the current application and may create side effects.'),
  ).toBeVisible();
  return workspace;
}

async function replaceEditorSource(page: Page, source: string): Promise<void> {
  const editor = page.locator('.cm-content[role="textbox"]').last();
  await expect(editor).toBeVisible();
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.insertText(source);
}

async function runHostPreview(
  page: Page,
  session: BrowserSession,
  workspace: ReturnType<Page['getByTestId']>,
  repo: RepoFixture,
  entry: EntryRecord,
  host: HostFixture,
): Promise<PreviewSessionDescriptor> {
  const openResponsePromise = page.waitForResponse((response) =>
    response.url().includes('/api/lightExtensionPreviewProblems:open'),
  );
  await workspace.getByRole('button', { name: 'Run', exact: true }).click();
  const openResponse = await openResponsePromise;
  expect(openResponse.ok(), await openResponse.text()).toBe(true);
  const openData = requireRecord(unwrapApiBody(await openResponse.json()));
  const context = requireRecord(
    await postApi(page, session.headers, '/api/lightExtensionContexts:get', {
      repoId: repo.id,
      entryId: entry.id,
      ownerLocator: host.ownerLocator,
    }).then((result) => result.data),
  );
  const descriptor: PreviewSessionDescriptor = {
    schemaVersion: 1,
    sessionId: requireString(openData.sessionId, 'Preview session id'),
    repoId: repo.id,
    entryId: entry.id,
    ownerLocator: host.ownerLocator,
    snapshotId: requireString(openData.snapshotId, 'Preview snapshot id'),
    contextHash: requireString(context.contextHash, 'Context Pack hash'),
    artifactHash: requireString(openData.artifactHash, 'Preview artifact hash'),
    executionId: requireString(openData.executionId, 'Preview execution id'),
  };
  await expect(workspace.getByText('Active', { exact: true })).toBeVisible();
  await expect(workspace.getByText(PREVIEW_TOKEN_PREFIX, { exact: false })).toBeVisible();
  return descriptor;
}

async function reviewDiffAndClose(page: Page, workspace: ReturnType<Page['getByTestId']>): Promise<void> {
  await workspace.getByRole('button', { name: 'Diff', exact: true }).click();
  await expect(workspace.getByText('Reviewed', { exact: true })).toBeVisible();
  await expect(workspace.getByText('Ready', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save', exact: true }).last()).toBeEnabled();
  await discardWorkspace(page, workspace);
}

async function discardWorkspace(page: Page, workspace: ReturnType<Page['getByTestId']>): Promise<void> {
  await page.getByRole('button', { name: 'Cancel', exact: true }).last().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Discard changes', exact: true }).click();
  await expect(workspace).toBeHidden();
}

async function watchPreviewSession(
  page: Page,
  session: BrowserSession,
  descriptor: PreviewSessionDescriptor,
): Promise<unknown> {
  const watched = await postApi(page, session.headers, '/api/lightExtensionPreviewProblems:watch', {
    ...descriptor,
    cursor: 0,
  });
  expect(watched.response.ok(), JSON.stringify(watched.body)).toBe(true);
  return watched.data;
}

async function cleanupHost(page: Page, session: BrowserSession, host: HostFixture): Promise<void> {
  try {
    const response = await page.request.get('/api/flowModels:findOne', {
      headers: session.headers,
      params: { uid: host.modelUid },
    });
    if (response.ok()) {
      const model = requireRecord(unwrapApiBody(await response.json()));
      const stepParams = isRecord(model.stepParams) ? { ...model.stepParams } : {};
      const jsSettings = isRecord(stepParams.jsSettings) ? { ...stepParams.jsSettings } : {};
      const runJs = isRecord(jsSettings.runJs) ? { ...jsSettings.runJs } : {};
      runJs.sourceMode = 'inline';
      delete runJs.sourceBinding;
      delete runJs.settings;
      delete runJs.sourceRef;
      jsSettings.runJs = runJs;
      stepParams.jsSettings = jsSettings;
      await safePostApi(page, session.headers, '/api/flowModels:save', { ...model, stepParams });
    }
  } catch {
    // Continue best-effort fixture cleanup.
  }
  if (host.kind === 'js-block') {
    await safePostApi(page, session.headers, '/api/flowSurfaces:destroyPage', { uid: host.routeId });
    return;
  }
  await safePostApi(page, session.headers, '/api/flowSurfaces:destroyPage', { uid: host.modelUid });
  if (host.routeId) {
    await safePostApi(page, session.headers, '/api/desktopRoutes:destroy', {}, { filterByTk: host.routeId });
  }
}

async function runLightCli(session: BrowserSession, args: string[]): Promise<CliResult> {
  const commandArgs = [
    CLI_BIN,
    'light',
    ...args,
    '--api-base-url',
    session.apiBaseUrl,
    '--role',
    session.role,
    '--authenticator',
    session.authenticator,
    '--token',
    session.token,
  ];
  try {
    const result = await execFileAsync(process.execPath, commandArgs, {
      cwd: resolve('.'),
      env: {
        ...process.env,
        FORCE_COLOR: '0',
        NB_SKIP_STARTUP_UPDATE: '1',
      },
      maxBuffer: 10 * 1024 * 1024,
    });
    return { code: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error: unknown) {
    if (!isExecFileError(error)) {
      throw error;
    }
    return {
      code: typeof error.code === 'number' ? error.code : 1,
      stdout: error.stdout || '',
      stderr: error.stderr || '',
    };
  }
}

async function postApi(
  page: Page,
  headers: Record<string, string>,
  path: string,
  data: Record<string, unknown>,
  params?: Record<string, string>,
): Promise<ApiResult> {
  const response = await page.request.post(path, { headers, data, params });
  const body: unknown = await response.json();
  return { response, body, data: unwrapApiBody(body) };
}

async function safePostApi(
  page: Page,
  headers: Record<string, string>,
  path: string,
  data: Record<string, unknown>,
  params?: Record<string, string>,
): Promise<void> {
  try {
    await page.request.post(path, { headers, data, params });
  } catch {
    // Continue best-effort fixture cleanup.
  }
}

function createSourceBinding(repo: RepoFixture, entry: EntryRecord): Record<string, unknown> {
  return {
    type: 'light-extension-entry',
    repoId: repo.id,
    repoTitle: repo.title,
    entryId: entry.id,
    entryName: entry.entryName,
    entryPath: entry.entryPath,
    entryTitle: entry.entryName,
    kind: entry.kind,
  };
}

function createInitialFiles(): Array<Record<string, unknown>> {
  return [
    {
      path: 'src/client/js-blocks/agent-block/entry.json',
      content: '{"schemaVersion":1,"key":"agent-block","title":"Agent block"}\n',
      language: 'json',
    },
    {
      path: 'src/client/js-blocks/agent-block/index.tsx',
      content: 'ctx.render(<div data-testid="agent-loop-block-initial">Initial block</div>);\n',
      language: 'typescript',
    },
    {
      path: 'src/client/js-pages/agent-page/entry.json',
      content: '{"schemaVersion":1,"key":"agent-page","title":"Agent page"}\n',
      language: 'json',
    },
    {
      path: 'src/client/js-pages/agent-page/index.tsx',
      content: 'ctx.render(<div data-testid="agent-loop-page-initial">Initial page</div>);\n',
      language: 'typescript',
    },
  ];
}

function blockPromiseFailureSource(): string {
  return [
    'ctx.render(<div>Promise failure preview</div>);',
    "await Promise.reject(new Error('agent runtime promise failure'));",
    '',
  ].join('\n');
}

function blockStaticFailureSource(): string {
  return ['ctx.render(<div>Static failure preview</div>);', 'const broken = ;', ''].join('\n');
}

function blockRepairedSource(): string {
  return 'ctx.render(<div data-testid="agent-loop-block-repaired">Block repaired</div>);\n';
}

function pageReactFailureSource(): string {
  return [
    'const BrokenAgentPage = () => {',
    "  throw new Error('agent page react failure');",
    '};',
    'ctx.render(<BrokenAgentPage />);',
    '',
  ].join('\n');
}

function pagePromiseFailureSource(): string {
  return [
    'ctx.render(<div>Page Promise failure preview</div>);',
    "await Promise.reject(new Error('agent page promise failure'));",
    '',
  ].join('\n');
}

function pageApiFailureSource(repoId: string): string {
  return [
    'ctx.render(<div>API permission preview</div>);',
    'await ctx.api.request({',
    "  url: 'vscFile:createRepository',",
    "  method: 'post',",
    '  data: {',
    "    ownerType: 'light-extension',",
    `    ownerId: ${JSON.stringify(repoId)},`,
    "    name: 'forbidden-agent-preview',",
    "    defaultRef: 'head',",
    '  },',
    '});',
    '',
  ].join('\n');
}

function pageRepairedSource(): string {
  return 'ctx.render(<div data-testid="agent-loop-page-repaired">Page repaired</div>);\n';
}

function readEntryRecord(value: unknown): EntryRecord {
  const entry = requireRecord(value);
  const kind = requireString(entry.kind, 'entry kind');
  if (kind !== 'js-block' && kind !== 'js-page') {
    throw new Error(`Unexpected Agent loop entry kind: ${kind}`);
  }
  return {
    id: requireString(entry.id, 'entry id'),
    entryName: requireString(entry.entryName, 'entry name'),
    entryPath: requireString(entry.entryPath, 'entry path'),
    kind,
  };
}

function readArrayPayload(value: unknown, label: string): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (isRecord(value) && Array.isArray(value[label])) {
    return value[label];
  }
  throw new Error(`Expected ${label}`);
}

function encodePreviewToken(descriptor: PreviewSessionDescriptor): string {
  return `${PREVIEW_TOKEN_PREFIX}${Buffer.from(JSON.stringify(descriptor), 'utf8').toString('base64url')}`;
}

function unwrapApiBody(value: unknown): unknown {
  return isRecord(value) && 'data' in value ? value.data : value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error('Expected an object response');
  }
  return value;
}

function requireString(value: unknown, label: string): string {
  if ((typeof value !== 'string' && typeof value !== 'number') || !String(value).trim()) {
    throw new Error(`Expected ${label}`);
  }
  return String(value);
}

function requireNullableString(value: unknown, label: string): string | null {
  if (value === null) {
    return null;
  }
  return requireString(value, label);
}

function isExecFileError(
  value: unknown,
): value is Error & { code?: number | string; stdout?: string; stderr?: string } {
  return value instanceof Error && ('stdout' in value || 'stderr' in value || 'code' in value);
}

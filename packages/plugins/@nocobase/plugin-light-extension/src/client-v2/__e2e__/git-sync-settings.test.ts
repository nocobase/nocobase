/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import type { Locator, Page } from '@playwright/test';
import JSZip from 'jszip';

import { createLightExtensionBaseTemplate } from '../../shared/default-template';
import type { LightExtensionRepoRecord } from '../../shared/types';
import {
  createLightExtensionAcceptanceRepo,
  createLightExtensionSyncFacade,
  createLightExtensionSyncPlan,
  LIGHT_EXTENSION_SYNC_FORBIDDEN_TOKEN,
  LIGHT_EXTENSION_SYNC_PULL_DESCRIPTION,
  LIGHT_EXTENSION_SYNC_TEST_AUTH_REF,
  LIGHT_EXTENSION_SYNC_TEST_AUTH_REF_DISPLAY,
  readApiResponse,
  removeLightExtensionAcceptanceRepo,
  signInRootApiAndInstallBrowserSession,
  type RootApiSession,
} from './helpers';

test.describe('light extension Git sync settings', () => {
  test('covers safe GitHub configuration and deterministic Pull, Push, blocked, and error states', async ({ page }) => {
    test.setTimeout(300_000);
    const session = await signInRootApiAndInstallBrowserSession(page);
    const repo = await createLightExtensionAcceptanceRepo(page, session, { title: 'Task 16 Git sync acceptance' });
    const sync = createLightExtensionSyncFacade(page, repo, session);
    const createdRepoIds: string[] = [];
    const externalGitHubRequests: string[] = [];
    const consoleMessages: string[] = [];
    page.on('request', (request) => {
      if (['api.github.com', 'github.com'].includes(new URL(request.url()).hostname)) {
        externalGitHubRequests.push(request.url());
      }
    });
    page.on('console', (message) => consoleMessages.push(message.text()));
    await sync.install();

    try {
      await page.goto('/admin/settings/light-extension');
      const row = page.getByRole('row', { name: new RegExp(repo.title, 'u') });
      await expect(row).toBeVisible();
      await expectActionOrder(row);

      const templateTitle = `Task 16 template ${Date.now()}`;
      let createDialog = await openCreateDialog(page);
      await createDialog.getByRole('textbox', { name: 'Title' }).fill(templateTitle);
      await createDialog.getByRole('button', { name: 'Create' }).click();
      await expect(createDialog).toBeHidden({ timeout: 75_000 });
      createdRepoIds.push((await findRepoByTitle(page, session, templateTitle)).id);

      const zipTitle = `Task 16 ZIP ${Date.now()}`;
      createDialog = await openCreateDialog(page);
      await createDialog.getByText('ZIP file', { exact: true }).click();
      await createDialog.locator('input[type="file"]').setInputFiles({
        name: 'task16-source.zip',
        mimeType: 'application/zip',
        buffer: await createSourceZip(),
      });
      await createDialog.getByRole('textbox', { name: 'Title' }).fill(zipTitle);
      await createDialog.getByRole('button', { name: 'Create' }).click();
      await expect(createDialog).toBeHidden({ timeout: 75_000 });
      createdRepoIds.push((await findRepoByTitle(page, session, zipTitle)).id);

      const githubTitle = `Task 16 GitHub source ${Date.now()}`;
      createDialog = await openCreateDialog(page);
      await createDialog.getByRole('textbox', { name: 'Title' }).fill(githubTitle);
      await createDialog.getByText('GitHub source', { exact: true }).click();
      await createDialog.getByRole('textbox', { name: 'GitHub repository' }).fill('nocobase/task16');
      await createDialog.getByRole('textbox', { name: 'Branch' }).fill('main');
      await createDialog.getByRole('textbox', { name: 'Subdirectory' }).fill('packages/task16');
      const tokenInput = createDialog.getByRole('combobox', { name: 'Token secret' });
      await tokenInput.click();
      await expect(page.getByText('TEST_GITHUB_TOKEN', { exact: true })).toBeVisible();
      await expect(page.getByText('PUBLIC_TASK16_VALUE', { exact: true })).toHaveCount(0);
      await page.getByText('TEST_GITHUB_TOKEN', { exact: true }).click();
      await expect(tokenInput).toHaveValue(LIGHT_EXTENSION_SYNC_TEST_AUTH_REF);
      await expect(createDialog.getByRole('button', { name: 'Create' })).toBeEnabled();
      await createDialog.getByRole('button', { name: 'Create' }).click();
      await expect(createDialog).toBeHidden({ timeout: 75_000 });
      const githubRepo = await findRepoByTitle(page, session, githubTitle);
      createdRepoIds.push(githubRepo.id);
      const githubRow = page.getByRole('row', { name: new RegExp(githubTitle, 'u') });
      await expect(githubRow).toBeVisible();
      expect(new URL(page.url()).searchParams.get('repoId')).toBe(githubRepo.id);
      const createFromGitCall = sync.getCalls().find((call) => call.action === 'createFromGit');
      expect(createFromGitCall?.body).toMatchObject({
        provider: 'github',
        config: {
          owner: 'nocobase',
          repository: 'task16',
          branch: 'main',
          subdirectory: 'packages/task16',
        },
        title: githubTitle,
        authRef: LIGHT_EXTENSION_SYNC_TEST_AUTH_REF,
      });
      expect(Object.keys(createFromGitCall?.body || {}).sort()).toEqual([
        'authRef',
        'config',
        'description',
        'name',
        'provider',
        'title',
      ]);
      expect(findUnsafeCredentialPaths(createFromGitCall?.body)).toEqual([]);

      const syncButton = row.getByRole('button', { name: 'Sync code' });
      await syncButton.focus();
      await page.keyboard.press('Enter');
      let drawer = page.getByRole('dialog', { name: 'Sync code' });
      await expect(drawer).toBeVisible();
      await expect(drawer.getByText(LIGHT_EXTENSION_SYNC_TEST_AUTH_REF_DISPLAY, { exact: true })).toBeVisible();
      await expect(drawer.getByText('Remote changes', { exact: true })).toBeVisible();
      const planCountBeforeConnectionTest = sync.getPlanRequestCount();
      await drawer.getByRole('button', { name: 'Test connection' }).click();
      await expect(drawer).toBeVisible();
      expect(sync.getCalls().some((call) => call.action === 'testConnection')).toBe(true);
      const testConnectionCall = sync.getCalls().find((call) => call.action === 'testConnection');
      expect(testConnectionCall?.body).toEqual({ repoId: repo.id });
      expect(findUnsafeCredentialPaths(testConnectionCall?.body)).toEqual([]);
      expect(sync.getPlanRequestCount()).toBeGreaterThan(planCountBeforeConnectionTest);
      const pullButton = drawer.getByRole('button', { name: 'Pull from Git' });
      await expect(pullButton).toBeEnabled();
      await pullButton.focus();
      await page.keyboard.press('Enter');
      await expect(drawer.getByText('In sync', { exact: true })).toBeVisible();
      await expect(row).toContainText(LIGHT_EXTENSION_SYNC_PULL_DESCRIPTION);
      expect(sync.getCalls().some((call) => call.action === 'pull')).toBe(true);

      await closeDrawerWithKeyboard(page, drawer);
      const planCountBeforeReopen = sync.getPlanRequestCount();
      sync.setPlan(createLightExtensionSyncPlan('local-ahead'));
      await syncButton.focus();
      await page.keyboard.press('Enter');
      drawer = page.getByRole('dialog', { name: 'Sync code' });
      await expect(drawer.getByText('Local changes', { exact: true })).toBeVisible();
      expect(sync.getPlanRequestCount()).toBeGreaterThan(planCountBeforeReopen);

      await drawer.getByRole('button', { name: 'Push to Git' }).focus();
      await page.keyboard.press('Enter');
      let confirmation = page.getByRole('dialog', { name: 'Push changes to GitHub?' });
      await expect(confirmation).toBeVisible();
      await confirmation.getByRole('button', { name: 'Cancel' }).focus();
      await page.keyboard.press('Enter');
      await expect(confirmation).toBeHidden();
      expect(sync.getCalls().some((call) => call.action === 'push')).toBe(false);

      await drawer.getByRole('button', { name: 'Push to Git' }).click();
      confirmation = page.getByRole('dialog', { name: 'Push changes to GitHub?' });
      await confirmation.getByRole('button', { name: 'Push to Git' }).focus();
      await page.keyboard.press('Enter');
      await expect(drawer.getByText('In sync', { exact: true })).toBeVisible();
      expect(sync.getCalls().some((call) => call.action === 'push')).toBe(true);

      await closeDrawerWithKeyboard(page, drawer);
      sync.setPlan(createLightExtensionSyncPlan('diverged'));
      await syncButton.click();
      drawer = page.getByRole('dialog', { name: 'Sync code' });
      await expect(drawer.getByText('Diverged', { exact: true })).toBeVisible();
      await expect(drawer.getByRole('button', { name: 'Pull from Git' })).toBeDisabled();
      await expect(drawer.getByRole('button', { name: 'Push to Git' })).toBeDisabled();
      await expect(drawer.getByRole('button', { name: /overwrite/iu })).toHaveCount(0);

      await closeDrawerWithKeyboard(page, drawer);
      sync.setPlan(
        createLightExtensionSyncPlan('diverged', {
          reasonCode: 'initial-ambiguous',
          canPull: false,
          canPush: false,
        }),
      );
      await syncButton.click();
      drawer = page.getByRole('dialog', { name: 'Sync code' });
      await expect(drawer.getByText('Initial sync needs a clear source', { exact: true })).toBeVisible();

      await closeDrawerWithKeyboard(page, drawer);
      for (const [reasonCode, message] of [
        ['LIGHT_EXTENSION_SYNC_CREDENTIAL_UNAVAILABLE', 'The configured credential is unavailable'],
        ['LIGHT_EXTENSION_SYNC_AUTH_FAILED', 'GitHub authentication failed'],
        ['LIGHT_EXTENSION_SYNC_REMOTE_UNAVAILABLE', 'The sync provider is unavailable'],
      ] as const) {
        sync.setPlan(createLightExtensionSyncPlan('error', { reasonCode }));
        await syncButton.click();
        drawer = page.getByRole('dialog', { name: 'Sync code' });
        await expect(drawer.getByText(message, { exact: true })).toBeVisible();
        await closeDrawerWithKeyboard(page, drawer);
      }

      sync.setPlan(createLightExtensionSyncPlan('in-sync'));
      sync.setError('testConnection', {
        code: 'LIGHT_EXTENSION_PERMISSION_DENIED',
        status: 403,
        message: `Unsafe provider detail: ${LIGHT_EXTENSION_SYNC_FORBIDDEN_TOKEN}`,
      });
      await syncButton.click();
      drawer = page.getByRole('dialog', { name: 'Sync code' });
      await drawer.getByRole('button', { name: 'Test connection' }).click();
      const permissionAlert = drawer
        .getByRole('alert')
        .filter({ hasText: 'You do not have permission to perform this sync operation' });
      await expect(permissionAlert).toBeVisible();
      await expect(drawer).toBeVisible();

      expect(sync.getResponseBodies().join('\n')).toContain(LIGHT_EXTENSION_SYNC_FORBIDDEN_TOKEN);
      const pageContent = await page.content();
      expect(pageContent).not.toContain(LIGHT_EXTENSION_SYNC_FORBIDDEN_TOKEN);
      expect(pageContent).not.toContain('vscRepoId');
      expect(externalGitHubRequests).toEqual([]);
      expect(JSON.stringify(sync.getCalls())).not.toContain(LIGHT_EXTENSION_SYNC_FORBIDDEN_TOKEN);
      expect(consoleMessages.join('\n')).not.toContain(LIGHT_EXTENSION_SYNC_FORBIDDEN_TOKEN);
      const syncRequestBodies = sync
        .getCalls()
        .map((call) => JSON.stringify(call.body))
        .join('\n');
      expect(syncRequestBodies).not.toMatch(/api\.github\.com|raw-token-value/iu);
    } finally {
      const cleanupRepoIds = [...new Set([...createdRepoIds, ...sync.getCreatedRepoIds()])].reverse();
      for (const repoId of cleanupRepoIds) {
        await removeLightExtensionAcceptanceRepo(page, session, repoId);
      }
      await removeLightExtensionAcceptanceRepo(page, session, repo.id);
    }
  });
});

async function openCreateDialog(page: Page): Promise<Locator> {
  const addButton = page.getByRole('button', { name: 'Add new' });
  await addButton.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Create light extension' });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function createSourceZip(): Promise<Buffer> {
  const zip = new JSZip();
  for (const file of createLightExtensionBaseTemplate()) {
    if (typeof file.content === 'string') {
      zip.file(file.path, file.content);
    }
  }
  return zip.generateAsync({ type: 'nodebuffer' });
}

async function findRepoByTitle(page: Page, session: RootApiSession, title: string): Promise<LightExtensionRepoRecord> {
  const response = await page.request.post('/api/lightExtensionRepos:list', { headers: session.headers });
  const repos = await readApiResponse<LightExtensionRepoRecord[]>(response, 'List Task 16 repos');
  const repo = repos.find((item) => item.title === title);
  if (!repo) {
    throw new Error(`Task 16 repo "${title}" was not found after creation`);
  }
  return repo;
}

async function expectActionOrder(row: Locator): Promise<void> {
  const labels = (await row.getByRole('button').allTextContents()).map((label) => label.trim()).filter(Boolean);
  expect(labels).toEqual(['Edit code', 'Sync code', 'Edit details', 'Remove']);
}

async function closeDrawerWithKeyboard(page: Page, drawer: Locator): Promise<void> {
  await drawer.getByRole('button', { name: 'Close' }).focus();
  await page.keyboard.press('Enter');
  await expect(drawer).toBeHidden();
}

function findUnsafeCredentialPaths(value: unknown, path: string[] = []): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }
  const unsafePaths: string[] = [];
  for (const [key, child] of Object.entries(value)) {
    const nextPath = [...path, key];
    if (key !== 'authRef' && /(token|authorization|password|secret|credential|privatekey)/iu.test(key)) {
      unsafePaths.push(nextPath.join('.'));
    }
    unsafePaths.push(...findUnsafeCredentialPaths(child, nextPath));
  }
  return unsafePaths;
}

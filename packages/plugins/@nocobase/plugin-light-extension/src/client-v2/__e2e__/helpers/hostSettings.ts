/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, type Locator, type Page } from '@playwright/test';

export type HostSettingsTarget = {
  hostUid: string;
  toolbarUid?: string;
};

export type HostCodeSourceEntryTarget = HostSettingsTarget & {
  repoTitle: string;
  entryTitle: string;
};

export type HostRuntimeSettingsTarget = HostSettingsTarget & {
  menuTitle: string;
};

function getHostLocator(page: Page, hostUid: string): Locator {
  return page.locator(`[data-float-menu-model-uid="${hostUid}"]`).first();
}

function getToolbarLocator(page: Page, toolbarUid: string): Locator {
  return page.locator(`[data-model-uid="${toolbarUid}"]`).first();
}

function getCodeSourceMenuItem(page: Page): Locator {
  return page.getByRole('menuitem', { name: /^Code source/u }).last();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function getExactMenuItem(page: Page, title: string): Locator {
  return page
    .locator('[role="menuitem"]')
    .filter({ hasText: new RegExp(`^${escapeRegExp(title)}$`, 'u') })
    .last();
}

async function openCodeSourceCascade(page: Page, target: HostSettingsTarget): Promise<Locator> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await openHostSettingsMenu(page, target);
    const codeSourceMenuItem = getCodeSourceMenuItem(page);
    try {
      await expect(codeSourceMenuItem).toBeVisible({ timeout: 15_000 });
      await codeSourceMenuItem.click();
      await expect(codeSourceMenuItem).toHaveAttribute('aria-expanded', 'true');
      return codeSourceMenuItem;
    } catch (error) {
      lastError = error;
      await page.keyboard.press('Escape');
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error('Code source menu did not become available');
}

async function waitForConfigurationSaved(page: Page, codeSourceMenuItem: Locator): Promise<void> {
  await expect(page.getByText('Configuration saved', { exact: true }).last()).toBeVisible();
  await expect(codeSourceMenuItem).toBeHidden();
}

export async function openHostSettingsMenu(page: Page, target: HostSettingsTarget): Promise<Locator> {
  const host = getHostLocator(page, target.hostUid);
  await expect(host).toBeVisible();
  await host.hover();

  const toolbar = getToolbarLocator(page, target.toolbarUid || target.hostUid);
  await expect(toolbar).toBeVisible();
  const settingsButton = toolbar.getByRole('button', { name: 'flows-settings', exact: true });
  await expect(settingsButton).toBeVisible();
  await settingsButton.click();

  const menu = page.getByRole('menu').last();
  await expect(menu).toBeVisible();
  return menu;
}

export async function selectHostCodeSourceEntry(page: Page, target: HostCodeSourceEntryTarget): Promise<void> {
  const codeSourceMenuItem = await openCodeSourceCascade(page, target);

  const repoMenuItem = getExactMenuItem(page, target.repoTitle);
  await expect(repoMenuItem).toBeVisible();
  await repoMenuItem.click();
  await expect(repoMenuItem).toHaveAttribute('aria-expanded', 'true');

  const entryMenuItem = getExactMenuItem(page, target.entryTitle);
  await expect(entryMenuItem).toBeVisible();
  await entryMenuItem.click();
  await waitForConfigurationSaved(page, codeSourceMenuItem);
}

export async function selectHostInlineCode(page: Page, target: HostSettingsTarget): Promise<void> {
  const codeSourceMenuItem = await openCodeSourceCascade(page, target);

  const inlineCodeMenuItem = getExactMenuItem(page, 'Inline code');
  await expect(inlineCodeMenuItem).toBeVisible();
  await inlineCodeMenuItem.click();
  await waitForConfigurationSaved(page, codeSourceMenuItem);
}

export async function openHostRuntimeSettingsMenu(page: Page, target: HostRuntimeSettingsTarget): Promise<Locator> {
  await openHostSettingsMenu(page, target);

  const runtimeSettingsMenuItem = getExactMenuItem(page, target.menuTitle);
  await expect(runtimeSettingsMenuItem).toBeVisible();
  await runtimeSettingsMenuItem.click();

  const dialog = page.getByRole('dialog').filter({ hasText: target.menuTitle }).last();
  await expect(dialog).toBeVisible();
  return dialog;
}

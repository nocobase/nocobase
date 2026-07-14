/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Locator, Page } from '@playwright/test';
import { expect, test } from '@nocobase/test/e2e';

import {
  createFlowHostAcceptancePage,
  createLightExtensionAcceptanceRepo,
  destroyFlowHostAcceptancePage,
  isRecord,
  openHostRuntimeSettingsMenu,
  openHostSettingsMenu,
  readApiResponse,
  removeLightExtensionAcceptanceRepo,
  replaceLightExtensionAcceptanceEntrySource,
  selectHostCodeSourceEntry,
  selectHostInlineCode,
  signInRootApiAndInstallBrowserSession,
  type FlowHostAcceptancePage,
  type HostSettingsTarget,
  type LightExtensionAcceptanceRepo,
  type RootApiSession,
} from './helpers';

type HostKind = 'js-block' | 'js-field' | 'js-action' | 'js-item';
type RunJsSettingsGroupKey = 'jsSettings' | 'clickSettings';

type HostCase = {
  kind: HostKind;
  label: string;
  surfaceUid: string;
  target: HostSettingsTarget;
  settingsGroupKey: RunJsSettingsGroupKey;
  outputLabel: string;
  mode1Value: string;
  mode2Value: string;
  advancedColor: string;
};

type HostRunJsReadback = {
  group: Record<string, unknown>;
  runJs: Record<string, unknown>;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function getExactMenuItem(page: Page, title: string): Locator {
  return page
    .locator('[role="menuitem"]')
    .filter({ hasText: new RegExp(`^${escapeRegExp(title)}$`, 'u') })
    .last();
}

function createHostCases(fixture: FlowHostAcceptancePage): HostCase[] {
  return [
    {
      kind: 'js-block',
      label: 'JS Block',
      surfaceUid: fixture.hosts.jsBlock.uid,
      target: { hostUid: fixture.hosts.jsBlock.uid },
      settingsGroupKey: 'jsSettings',
      outputLabel: 'JS Block output',
      mode1Value: 'JS Block branch B',
      mode2Value: 'JS Block branch C',
      advancedColor: '#cf1322',
    },
    {
      kind: 'js-field',
      label: 'JS Field',
      surfaceUid: fixture.hosts.jsField.uid,
      target: {
        hostUid: fixture.hosts.jsField.wrapperUid,
        toolbarUid: fixture.hosts.jsField.wrapperUid,
      },
      settingsGroupKey: 'jsSettings',
      outputLabel: 'JS Field output',
      mode1Value: 'JS Field branch B',
      mode2Value: 'JS Field branch C',
      advancedColor: '#d46b08',
    },
    {
      kind: 'js-action',
      label: 'JS Action',
      surfaceUid: fixture.hosts.jsAction.uid,
      target: { hostUid: fixture.hosts.jsAction.uid },
      settingsGroupKey: 'clickSettings',
      outputLabel: 'JS Action output',
      mode1Value: 'JS Action branch B',
      mode2Value: 'JS Action branch C',
      advancedColor: '#08979c',
    },
    {
      kind: 'js-item',
      label: 'JS Item',
      surfaceUid: fixture.hosts.jsItem.uid,
      target: { hostUid: fixture.hosts.jsItem.uid },
      settingsGroupKey: 'jsSettings',
      outputLabel: 'JS Item output',
      mode1Value: 'JS Item branch B',
      mode2Value: 'JS Item branch C',
      advancedColor: '#389e0d',
    },
  ];
}

async function readHostRunJs(
  page: Page,
  session: RootApiSession,
  host: HostCase,
  operation: string,
): Promise<HostRunJsReadback> {
  const response = await page.request.get('/api/flowSurfaces:get', {
    headers: session.headers,
    params: { uid: host.surfaceUid },
  });
  const readback = await readApiResponse<unknown>(response, operation);
  const tree = isRecord(readback) && isRecord(readback.tree) ? readback.tree : {};
  const stepParams = isRecord(tree.stepParams) ? tree.stepParams : {};
  const group = isRecord(stepParams[host.settingsGroupKey]) ? stepParams[host.settingsGroupKey] : {};
  const runJs = isRecord(group.runJs) ? group.runJs : {};
  return { group, runJs };
}

async function saveRuntimeSettingsDialog(page: Page, dialog: Locator): Promise<void> {
  await page.getByRole('button', { name: 'Save', exact: true }).last().click();
  await expect(dialog).toBeHidden();
}

async function cancelRuntimeSettingsDialog(page: Page, dialog: Locator): Promise<void> {
  await page.getByRole('button', { name: 'Cancel', exact: true }).last().click();
  await expect(dialog).toBeHidden();
}

async function setRuntimeTextSetting(page: Page, host: HostCase, menuTitle: string, value: string): Promise<void> {
  const dialog = await openHostRuntimeSettingsMenu(page, {
    ...host.target,
    menuTitle,
  });
  const input = dialog.locator('input').last();
  await expect(input).toBeVisible();
  await input.fill(value);
  await saveRuntimeSettingsDialog(page, dialog);
}

async function expectRuntimeTextSetting(page: Page, host: HostCase, menuTitle: string, value: string): Promise<void> {
  const dialog = await openHostRuntimeSettingsMenu(page, {
    ...host.target,
    menuTitle,
  });
  await expect(dialog.locator('input').last()).toHaveValue(value);
  await cancelRuntimeSettingsDialog(page, dialog);
}

async function setRuntimeMode(page: Page, host: HostCase, mode: 1 | 2): Promise<void> {
  const dialog = await openHostRuntimeSettingsMenu(page, {
    ...host.target,
    menuTitle: 'Mode',
  });
  const combobox = dialog.getByRole('combobox').last();
  await expect(combobox).toBeVisible();
  await dialog.locator('.ant-select-selector').last().click();
  await page
    .getByRole('option', { name: String(mode), exact: true })
    .last()
    .click();
  await saveRuntimeSettingsDialog(page, dialog);
}

async function setDisplayOptions(page: Page, host: HostCase): Promise<void> {
  const dialog = await openHostRuntimeSettingsMenu(page, {
    ...host.target,
    menuTitle: 'Display settings',
  });
  const enableColor = dialog.getByRole('switch').last();
  await expect(enableColor).toHaveAttribute('aria-checked', 'false');
  await enableColor.click();
  await expect(enableColor).toHaveAttribute('aria-checked', 'true');
  await expect(dialog.getByText('Advanced color', { exact: true })).toBeVisible();
  const advancedColor = dialog.locator('input').last();
  await expect(advancedColor).toBeVisible();
  await advancedColor.fill(host.advancedColor);
  await saveRuntimeSettingsDialog(page, dialog);
}

async function expectDisplayOptionsHiddenByExternalMode(page: Page, host: HostCase): Promise<void> {
  const dialog = await openHostRuntimeSettingsMenu(page, {
    ...host.target,
    menuTitle: 'Display settings',
  });
  await expect(dialog.getByRole('switch').last()).toHaveAttribute('aria-checked', 'true');
  await expect(dialog.getByText('Advanced color', { exact: true })).toHaveCount(0);
  await cancelRuntimeSettingsDialog(page, dialog);
}

async function expectDisplayOptionsRestored(page: Page, host: HostCase): Promise<void> {
  const dialog = await openHostRuntimeSettingsMenu(page, {
    ...host.target,
    menuTitle: 'Display settings',
  });
  await expect(dialog.getByRole('switch').last()).toHaveAttribute('aria-checked', 'true');
  await expect(dialog.getByText('Advanced color', { exact: true })).toBeVisible();
  await expect(dialog.locator('input').last()).toHaveValue(host.advancedColor);
  await cancelRuntimeSettingsDialog(page, dialog);
}

async function expectRuntimeMenuMode(page: Page, host: HostCase, mode: 1 | 2): Promise<void> {
  await openHostSettingsMenu(page, host.target);
  await expect(getExactMenuItem(page, 'Output label')).toBeVisible();
  await expect(getExactMenuItem(page, 'Mode')).toBeVisible();
  await expect(getExactMenuItem(page, 'Display settings')).toBeVisible();
  await expect(getExactMenuItem(page, mode === 1 ? 'Mode 1 settings' : 'Mode 2 settings')).toBeVisible();
  await expect(getExactMenuItem(page, mode === 1 ? 'Mode 2 settings' : 'Mode 1 settings')).toHaveCount(0);
  await expect(getExactMenuItem(page, 'Light extension settings')).toHaveCount(0);
  await page.keyboard.press('Escape');
}

async function expectHostRuntimeOutput(page: Page, host: HostCase): Promise<void> {
  if (host.kind === 'js-block') {
    await expect(page.getByTestId('light-extension-acceptance-js-block')).toHaveText(`${host.outputLabel}:2`);
    return;
  }
  if (host.kind === 'js-field') {
    await expect(page.getByTestId('light-extension-acceptance-js-field')).toContainText(host.outputLabel);
    return;
  }
  if (host.kind === 'js-item') {
    await expect(page.getByTestId('light-extension-acceptance-js-item')).toHaveText(`${host.outputLabel}:2`);
    return;
  }

  const actionHost = page.locator(`[data-float-menu-model-uid="${host.target.hostUid}"]`).first();
  await expect(actionHost).toBeVisible();
  const actionButton = actionHost.getByRole('button').first();
  await expect(actionButton).toBeVisible();
  await actionButton.click();
  await expect(page.getByText(`${host.outputLabel}:2`, { exact: true }).last()).toBeVisible();
}

function getUpdatedAcceptanceSource(kind: HostKind): string {
  if (kind === 'js-block') {
    return 'ctx.render(<div data-testid="light-extension-acceptance-js-block-updated">updated:{String(ctx.settings.outputLabel)}:{String(ctx.settings.mode)}</div>);\n';
  }
  if (kind === 'js-field') {
    return 'ctx.render(<span data-testid="light-extension-acceptance-js-field-updated">updated:{String(ctx.settings.outputLabel)}:{String(ctx.settings.mode)}</span>);\n';
  }
  if (kind === 'js-item') {
    return 'ctx.render(<span data-testid="light-extension-acceptance-js-item-updated">updated:{String(ctx.settings.outputLabel)}:{String(ctx.settings.mode)}</span>);\n';
  }
  return 'ctx.message.success(`updated:${String(ctx.settings.outputLabel)}:${String(ctx.settings.mode)}`);\n';
}

async function expectUpdatedHostRuntimeOutput(page: Page, host: HostCase): Promise<void> {
  if (host.kind === 'js-block') {
    await expect(page.getByTestId('light-extension-acceptance-js-block-updated')).toHaveText(
      `updated:${host.outputLabel}:2`,
    );
    return;
  }
  if (host.kind === 'js-field') {
    await expect(page.getByTestId('light-extension-acceptance-js-field-updated')).toHaveText(
      `updated:${host.outputLabel}:2`,
    );
    return;
  }
  if (host.kind === 'js-item') {
    await expect(page.getByTestId('light-extension-acceptance-js-item-updated')).toHaveText(
      `updated:${host.outputLabel}:2`,
    );
    return;
  }

  const actionHost = page.locator(`[data-float-menu-model-uid="${host.target.hostUid}"]`).first();
  await expect(actionHost).toBeVisible();
  await actionHost.getByRole('button').first().click();
  await expect(page.getByText(`updated:${host.outputLabel}:2`, { exact: true }).last()).toBeVisible();
}

test.describe('light extension host settings matrix', () => {
  test.setTimeout(300_000);

  test('persists canonical dynamic settings across JS Block, Field, Action and Item hosts', async ({ page }) => {
    page.setDefaultTimeout(20_000);
    const session = await signInRootApiAndInstallBrowserSession(page);
    const repo: LightExtensionAcceptanceRepo = await createLightExtensionAcceptanceRepo(page, session, {
      title: `Light Extension acceptance repo ${Date.now()}`,
    });
    const fixture = await createFlowHostAcceptancePage(page, session);
    const hosts = createHostCases(fixture);

    try {
      await page.goto(fixture.routePath);
      await expect(page.getByTestId('inline-acceptance-js-block')).toBeVisible();

      for (const host of hosts) {
        await selectHostCodeSourceEntry(page, {
          ...host.target,
          repoTitle: repo.title,
          entryTitle: repo.entries[host.kind].title,
        });

        await expect
          .poll(
            async () =>
              (await readHostRunJs(page, session, host, `Poll ${host.label} after source binding`)).runJs.sourceMode,
          )
          .toBe('light-extension');

        const { group, runJs } = await readHostRunJs(page, session, host, `Read ${host.label} after source binding`);
        expect(runJs).toMatchObject({
          sourceMode: 'light-extension',
          sourceBinding: {
            type: 'light-extension-entry',
            repoId: repo.id,
            entryId: repo.entries[host.kind].id,
            kind: host.kind,
          },
          settings: {
            outputLabel: 'Initial output',
            mode: 1,
          },
        });
        expect(group).not.toHaveProperty('sourceMode');
        expect(group).not.toHaveProperty('sourceBinding');
        expect(group).not.toHaveProperty('settings');
      }

      for (const host of hosts) {
        await expectRuntimeMenuMode(page, host, 1);
        await setRuntimeTextSetting(page, host, 'Output label', host.outputLabel);
        await setRuntimeTextSetting(page, host, 'Mode 1 settings', host.mode1Value);
        await setRuntimeMode(page, host, 2);
        await expectRuntimeMenuMode(page, host, 2);
        await setRuntimeTextSetting(page, host, 'Mode 2 settings', host.mode2Value);
        await setDisplayOptions(page, host);

        await setRuntimeMode(page, host, 1);
        await expectRuntimeMenuMode(page, host, 1);
        await expectRuntimeTextSetting(page, host, 'Mode 1 settings', host.mode1Value);
        await expectDisplayOptionsHiddenByExternalMode(page, host);

        const mode1Readback = await readHostRunJs(page, session, host, `Read ${host.label} hidden settings`);
        expect(mode1Readback.runJs.settings).toMatchObject({
          outputLabel: host.outputLabel,
          mode: 1,
          mode1Options: { message: host.mode1Value },
          mode2Options: { color: host.mode2Value },
          displayOptions: {
            enableColor: true,
            advancedColor: host.advancedColor,
          },
        });

        await setRuntimeMode(page, host, 2);
        await expectRuntimeMenuMode(page, host, 2);
        await expectRuntimeTextSetting(page, host, 'Mode 2 settings', host.mode2Value);
        await expectDisplayOptionsRestored(page, host);
      }

      await page.reload();
      for (const host of hosts) {
        await expectRuntimeMenuMode(page, host, 2);
        await expectHostRuntimeOutput(page, host);
      }

      for (const host of hosts) {
        await replaceLightExtensionAcceptanceEntrySource(page, session, {
          repo,
          kind: host.kind,
          source: getUpdatedAcceptanceSource(host.kind),
        });
      }
      await page.reload();
      for (const host of hosts) {
        await expectUpdatedHostRuntimeOutput(page, host);
      }

      for (const host of hosts) {
        await test.step(`switch ${host.label} back to Inline`, async () => {
          await selectHostInlineCode(page, host.target);
          await expect
            .poll(
              async () =>
                (await readHostRunJs(page, session, host, `Poll ${host.label} after Inline switch`)).runJs.sourceMode,
            )
            .toBe('inline');
          const { group, runJs } = await readHostRunJs(page, session, host, `Read ${host.label} after Inline switch`);
          expect(runJs.sourceMode).toBe('inline');
          expect(runJs).not.toHaveProperty('sourceBinding');
          expect(group).not.toHaveProperty('sourceMode');
          expect(group).not.toHaveProperty('sourceBinding');
          expect(group).not.toHaveProperty('settings');
        });
      }
      await expect(page.getByTestId('inline-acceptance-js-block')).toBeVisible();
    } finally {
      await destroyFlowHostAcceptancePage(page, session, fixture);
      await removeLightExtensionAcceptanceRepo(page, session, repo.id);
    }
  });
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Page, PageConfig, expectSettingsMenu, test } from '@nocobase/test/e2e';

test.describe('group page side menus schema settings', () => {
  test('group page', async ({ page, mockPage }) => {
    await mockPage({ type: 'group', name: 'group page' }).goto();
    await createSubPage({ page, type: 'group', name: 'group page in side' });

    await expectSettingsMenu({
      page,
      showMenu: () => showSettingsInSide(page, 'group page in side'),
      supportedOptions: ['Edit', 'Edit tooltip', 'Move to', 'Insert before', 'Insert after', 'Insert inner', 'Delete'],
    });
  });

  test('link page', async ({ page, mockPage }) => {
    await mockPage({ type: 'group', name: 'group page' }).goto();
    await createSubPage({ page, type: 'link', name: 'link page in side' });

    await expectSettingsMenu({
      page,
      showMenu: () => showSettingsInSide(page, 'link page in side'),
      supportedOptions: ['Edit', 'Edit tooltip', 'Move to', 'Insert before', 'Insert after', 'Delete'],
    });
  });

  test('single page', async ({ page, mockPage }) => {
    await mockPage({ type: 'group', name: 'group page' }).goto();
    await createSubPage({ page, type: 'page', name: 'single page in side' });

    await expectSettingsMenu({
      page,
      showMenu: () => showSettingsInSide(page, 'single page in side'),
      supportedOptions: ['Edit', 'Edit tooltip', 'Move to', 'Insert before', 'Insert after', 'Delete'],
    });
  });
});

test.describe('link page menu schema settings', () => {
  test('supported options', async ({ page, mockPage }) => {
    await mockPage({ type: 'link', name: 'link page' }).goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.locator('.ant-layout-header').getByText('link page', { exact: true }).hover();
        await page.getByRole('button', { name: 'designer-schema-settings-' }).hover();
      },
      supportedOptions: ['Edit', 'Move to', 'Insert before', 'Insert after', 'Delete'],
    });
  });
});

test.describe('single page menu schema settings', () => {
  test('supported options', async ({ page, mockPage }) => {
    await mockPage({ name: 'single page' }).goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.locator('.ant-layout-header').getByText('single page', { exact: true }).hover();
        await page.getByRole('button', { name: 'designer-schema-settings-' }).click();
      },
      supportedOptions: ['Edit', 'Move to', 'Insert before', 'Insert after', 'Delete'],
    });
  });
});

async function showSettingsInSide(page: Page, pageName: string) {
  await page.locator('.ant-layout-sider').getByText(pageName, { exact: true }).hover();
  await page.getByRole('button', { name: 'designer-schema-settings-' }).hover();
}

async function createSubPage({ page, name, type }: { page: Page; name: string; type: PageConfig['type'] }) {
  const typeToOptionName = {
    group: 'Group',
    page: 'Page',
    link: 'Link',
  };

  await page.getByTestId('schema-initializer-Menu-side').hover();
  await page.getByRole('menuitem', { name: typeToOptionName[type], exact: true }).click();
  await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').click();
  await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').fill(name);
  await page.getByRole('button', { name: 'OK', exact: true }).click();
}

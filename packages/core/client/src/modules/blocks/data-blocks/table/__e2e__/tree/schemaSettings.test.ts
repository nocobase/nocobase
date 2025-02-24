/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Page, expect, expectSettingsMenu, oneEmptyTableWithTreeCollection, test } from '@nocobase/test/e2e';

test.describe('tree table block schema settings', () => {
  test('supported options', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTableWithTreeCollection).goto();

    await expectSettingsMenu({
      page,
      showMenu: () => showSettingsMenu(page),
      supportedOptions: [
        'Edit block title',
        'Set block height',
        'Tree table',
        'Enable drag and drop sorting',
        'Set the data scope',
        'Set default sorting rules',
        'Records per page',
        'Connect data blocks',
        // 'Save as template',
        'Delete',
      ],
    });
  });

  // TODO: 这里的问题是：使用 mockRecords 生成固定数据，但是表格中的展开按钮有时显示有时不显示，导致测试不稳定，所以先注释掉了
  test('tree table', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneEmptyTableWithTreeCollection).waitForInit();
    // await mockRecords('treeCollection', 30);
    await nocoPage.goto();

    // 默认情况下的 tree table 是开启状态，且有显示展开按钮
    // await expect(page.getByLabel('Expand row').first()).toBeVisible({ timeout: 1000 * 60 });

    await showSettingsMenu(page);
    //默认不启用
    await expect(page.getByRole('menuitem', { name: 'Tree table' }).getByRole('switch')).not.toBeChecked();
    await page.getByRole('menuitem', { name: 'Tree table' }).click();
    await expect(page.getByRole('menuitem', { name: 'Tree table' }).getByRole('switch')).toBeChecked();
    // await expect(page.getByLabel('Expand row')).toBeHidden();
  });
});

async function showSettingsMenu(page: Page) {
  await page.getByLabel('block-item-CardItem-treeCollection-table').hover();
  // hover 方法有时会失效，所以这里使用 click 方法。原因未知
  await page.getByLabel('designer-schema-settings-CardItem-TableBlockDesigner-treeCollection').click();
}

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  expect,
  expectSettingsMenu,
  oneCollapseAndOneTableWithSameCollection,
  oneEmptyFilterCollapseBlock,
  test,
} from '@nocobase/test/e2e';

test.describe('collapse schema settings', () => {
  test('supported options', async ({ page, mockPage }) => {
    await mockPage(oneEmptyFilterCollapseBlock).goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('block-item-CardItem-general-filter-collapse').hover();
        await page.getByLabel('designer-schema-settings-CardItem-AssociationFilter.BlockDesigner-general').hover();
      },
      supportedOptions: ['Edit block title', 'Connect data blocks', 'Delete'],
    });
  });

  test.describe('connect data blocks', () => {
    test('connecting two blocks of the same collection', async ({ page, mockPage, mockRecords }) => {
      const nocoPage = await mockPage(oneCollapseAndOneTableWithSameCollection).waitForInit();
      const records = await mockRecords('general', [
        { singleSelect: 'option1' },
        { singleSelect: 'option2' },
        { singleSelect: 'option3' },
      ]);
      await nocoPage.goto();

      // 将上面的 Collapse 连接到下面的 Table
      await page.getByLabel('block-item-CardItem-general-filter-collapse').hover();
      await page.getByLabel('designer-schema-settings-CardItem-AssociationFilter.BlockDesigner-general').hover();
      await page.getByRole('menuitem', { name: 'Connect data blocks' }).hover();
      await page.getByRole('menuitem', { name: 'General' }).click();

      // 点击一个选项，进行筛选
      await page.getByRole('button', { name: 'collapsed singleSelect search' }).click();
      await page.getByLabel('block-item-CardItem-general-filter-collapse').getByText('Option1').click();

      // 注意：在本地运行时，由于运行结束后不会清空之前创建的数据，所以在第一次运行之后，下面会报错。如果遇到这种情况，可以先不管
      await expect(
        page.getByLabel('block-item-CardItem-general-table').getByRole('row', { name: 'Option2' }),
      ).toBeHidden();
      await expect(
        page.getByLabel('block-item-CardItem-general-table').getByRole('row', { name: 'Option3' }),
      ).toBeHidden();
      await expect(
        page.getByLabel('block-item-CardItem-general-table').getByRole('row', { name: 'Option1' }),
      ).toBeVisible();

      // 再次点击，重置筛选
      await page.getByLabel('block-item-CardItem-general-filter-collapse').getByText('Option1').click();
      await expect(page.getByLabel('block-item-CardItem-general-table').getByRole('row')).toHaveCount(
        records.length + 1,
      );
    });
  });
});

test.describe('fields schema settings', () => {});

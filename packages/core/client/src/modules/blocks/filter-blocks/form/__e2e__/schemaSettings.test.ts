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
  oneEmptyFilterFormBlock,
  oneFormAndOneTableWithSameCollection,
  test,
} from '@nocobase/test/e2e';
import { T4798 } from './templates';

test.describe('filter block schema settings', () => {
  test('supported options', async ({ page, mockPage }) => {
    await mockPage(oneEmptyFilterFormBlock).goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('block-item-CardItem-general-filter-form').hover();
        await page.getByLabel('designer-schema-settings-CardItem-FormV2.FilterDesigner-general').hover();
      },
      supportedOptions: [
        'Edit block title',
        // 'Save as block template',
        'Field linkage rules',
        'Block linkage rules',
        'Connect data blocks',
        'Delete',
      ],
    });
  });

  test.describe('connect data blocks', () => {
    test.skip('connecting two blocks of the same collection', async ({
      page,
      mockPage,
      mockRecords,
      clearBlockTemplates,
    }) => {
      const nocoPage = await mockPage(oneFormAndOneTableWithSameCollection).waitForInit();
      const records = await mockRecords('general', 3);
      await nocoPage.goto();

      // 将上面的 Form 连接到下面的 Table
      await page.getByLabel('block-item-CardItem-general-filter-form').hover();
      await page.getByLabel('designer-schema-settings-CardItem-FormV2.FilterDesigner-general').hover();
      await page.getByRole('menuitem', { name: 'Connect data blocks' }).hover();
      await page.getByRole('menuitem', { name: 'General' }).click();

      // 输入值，点击筛选按钮
      await page
        .getByLabel('block-item-CollectionField-general-filter-form-general.singleLineText-singleLineText')
        .getByRole('textbox')
        .click();
      await page
        .getByLabel('block-item-CollectionField-general-filter-form-general.singleLineText-singleLineText')
        .getByRole('textbox')
        .fill(records[0].singleLineText);

      // 点击筛选按钮
      await page.getByLabel('action-Action-Filter records-submit-general-filter-form').click();

      await expect(
        page.getByLabel('block-item-CardItem-general-table').getByRole('row', { name: records[1].singleLineText }),
      ).toBeHidden();
      await expect(
        page.getByLabel('block-item-CardItem-general-table').getByRole('row', { name: records[2].singleLineText }),
      ).toBeHidden();
      await expect(
        page.getByLabel('block-item-CardItem-general-table').getByRole('row', { name: records[0].singleLineText }),
      ).toBeVisible();

      // 点击重置按钮
      await page.getByLabel('action-Action-Reset records-general-filter-form').click();
      await expect(
        page.getByLabel('block-item-CardItem-general-table').getByRole('row', { name: records[1].singleLineText }),
      ).toBeVisible();
      await expect(
        page.getByLabel('block-item-CardItem-general-table').getByRole('row', { name: records[2].singleLineText }),
      ).toBeVisible();
      await expect(
        page.getByLabel('block-item-CardItem-general-table').getByRole('row', { name: records[0].singleLineText }),
      ).toBeVisible();

      // 更改操作符为 “is not”
      await page.getByLabel('block-item-CollectionField-').hover();
      await page.getByLabel('designer-schema-settings-CollectionField-FormItem.FilterFormDesigner-general-').hover();
      await page.getByRole('menuitem', { name: 'Operator contains' }).click();
      await page.getByRole('option', { name: 'is not', exact: true }).click();

      // 输入值，点击筛选按钮
      await page
        .getByLabel('block-item-CollectionField-general-filter-form-general.singleLineText-singleLineText')
        .getByRole('textbox')
        .click();
      await page
        .getByLabel('block-item-CollectionField-general-filter-form-general.singleLineText-singleLineText')
        .getByRole('textbox')
        .fill(records[0].singleLineText);

      // 点击筛选按钮
      await page.getByLabel('action-Action-Filter records-submit-general-filter-form').click();

      await expect(
        page.getByLabel('block-item-CardItem-general-table').getByRole('row', { name: records[1].singleLineText }),
      ).toBeVisible();
      await expect(
        page.getByLabel('block-item-CardItem-general-table').getByRole('row', { name: records[2].singleLineText }),
      ).toBeVisible();
      await expect(
        page.getByLabel('block-item-CardItem-general-table').getByRole('row', { name: records[0].singleLineText }),
      ).toBeHidden();

      // 点击重置按钮
      await page.getByLabel('action-Action-Reset records-general-filter-form').click();

      // 将筛选表单区块保存为模板
      await page.getByLabel('block-item-CardItem-general-filter-form').hover();
      await page.getByLabel('designer-schema-settings-CardItem-FormV2.FilterDesigner-general').hover();
      await page.getByRole('menuitem', { name: 'Save as block template' }).click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();

      // 输入值，点击筛选按钮
      await page
        .getByLabel('block-item-CollectionField-general-filter-form-general.singleLineText-singleLineText')
        .getByRole('textbox')
        .click();
      await page
        .getByLabel('block-item-CollectionField-general-filter-form-general.singleLineText-singleLineText')
        .getByRole('textbox')
        .fill(records[0].singleLineText);

      // 点击筛选按钮
      await page.getByLabel('action-Action-Filter records-submit-general-filter-form').click();

      await expect(
        page.getByLabel('block-item-CardItem-general-table').getByRole('row', { name: records[1].singleLineText }),
      ).toBeVisible();
      await expect(
        page.getByLabel('block-item-CardItem-general-table').getByRole('row', { name: records[2].singleLineText }),
      ).toBeVisible();
      await expect(
        page.getByLabel('block-item-CardItem-general-table').getByRole('row', { name: records[0].singleLineText }),
      ).toBeHidden();

      // 点击重置按钮
      await page.getByLabel('action-Action-Reset records-general-filter-form').click();
      await expect(
        page.getByLabel('block-item-CardItem-general-table').getByRole('row', { name: records[1].singleLineText }),
      ).toBeVisible();
      await expect(
        page.getByLabel('block-item-CardItem-general-table').getByRole('row', { name: records[2].singleLineText }),
      ).toBeVisible();
      await expect(
        page.getByLabel('block-item-CardItem-general-table').getByRole('row', { name: records[0].singleLineText }),
      ).toBeVisible();

      await clearBlockTemplates();
    });

    test('the operator of association field should work', async ({ page, mockPage, mockRecords }) => {
      const nocoPage = await mockPage(T4798).waitForInit();
      await mockRecords('general', 3);
      await nocoPage.goto();

      // 默认操作符为 “contains”，更改为 “is”
      await page.getByLabel('block-item-CollectionField-').hover();
      // hover 方法有时会失效，所以用 click 替代，原因未知
      await page.getByLabel('designer-schema-settings-CollectionField-fieldSettings:FilterFormItem-general-').click();
      await page.getByRole('menuitem', { name: 'Operator contains' }).click();
      await page.getByRole('option', { name: 'is', exact: true }).click();

      // 刷新页面后，操作符应该还是 “is”
      await page.reload();
      await page.getByLabel('block-item-CollectionField-').hover();
      // hover 方法有时会失效，所以用 click 替代，原因未知
      await page.getByLabel('designer-schema-settings-CollectionField-fieldSettings:FilterFormItem-general-').click();
      await expect(page.getByRole('menuitem', { name: 'Operator is' })).toBeVisible();
    });
  });
});

test.describe('actions schema settings', () => {
  test('supported options', async ({ page, mockPage }) => {
    await mockPage(oneEmptyFilterFormBlock).goto();

    // 创建 Filter & Reset 两个按钮
    await page.getByLabel('schema-initializer-ActionBar-filterForm:configureActions-general').hover();
    await page.getByRole('menuitem', { name: 'Filter' }).click();
    await page.getByRole('menuitem', { name: 'Reset' }).click();

    // Filter settings -------------------------------------------------------------------
    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('action-Action-Filter-submit-general-filter-form').hover();
        await page.getByRole('button', { name: 'designer-schema-settings-Action' }).hover();
      },
      supportedOptions: ['Edit button', 'Delete'],
    });

    // Reset settings --------------------------------------------------------------------
    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('action-Action-Reset-general-filter-form').hover();
        await page.getByRole('button', { name: 'designer-schema-settings-Action' }).hover();
      },
      supportedOptions: ['Edit button', 'Delete'],
    });
  });
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { oneFormAndOneTable } from '../../templates';

const img = 'https://static-docs.nocobase.com/logo-nocobase.png';

test.describe('Input.Preview', () => {
  test('switch to Input.Preview from Input.URL', async ({ page, mockPage }) => {
    await mockPage(oneFormAndOneTable).goto();

    // 1. 在表单中的 URL 字段中输入图片地址
    await page.getByLabel('block-item-CollectionField-').getByRole('textbox').fill(img);

    // 2. 将组建切换到 Input.Preview
    await page.getByLabel('block-item-CollectionField-').hover();
    await page.getByLabel('designer-schema-settings-CollectionField-fieldSettings:FormItem-general-general').hover();
    await page.getByRole('menuitem', { name: 'Field component URL' }).click();
    await page.getByRole('option', { name: 'Preview' }).click();

    // 3. 图片正常显示
    await expect(page.getByLabel('block-item-CollectionField-').getByRole('img').first()).toHaveAttribute('src', img);
    await expect(page.getByLabel('block-item-CollectionField-').getByRole('img').first()).toHaveJSProperty('width', 24);

    // 4. 切换图片大小到 Large，大小切换正常
    await page.getByLabel('block-item-CollectionField-').hover();
    await page.getByLabel('designer-schema-settings-CollectionField-fieldSettings:FormItem-general-general').hover();
    await page.getByRole('menuitem', { name: 'Size Small' }).click({
      position: {
        x: 160,
        y: 10,
      },
    });
    await page.getByRole('option', { name: 'Large' }).click();
    await expect(page.getByLabel('block-item-CollectionField-').getByRole('img').first()).toHaveJSProperty('width', 72);

    // 5. 点击保存按钮，保存成功
    await page.getByLabel('action-Action-Submit-submit-').click();

    // 6. Table 区块中显示图片链接
    await page.getByLabel('action-Action-Refresh-refresh').click();
    await expect(page.getByLabel('block-item-CardItem-general-table').getByRole('link', { name: img })).toBeVisible();

    // 7. 将 Table 中的单元格组建切换到 Input.Preview，应该正常显示图片
    await page
      .getByLabel('block-item-CardItem-general-table')
      .getByRole('button', { name: 'url', exact: true })
      .hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-general' })
      .hover();
    await page.getByRole('menuitem', { name: 'Field component URL' }).click();
    await page.getByRole('option', { name: 'Preview' }).click();
    await expect(
      page.getByLabel('block-item-CardItem-general-table').getByRole('cell').getByRole('img').first(),
    ).toHaveAttribute('src', img);
    await expect(
      page.getByLabel('block-item-CardItem-general-table').getByRole('cell').getByRole('img').first(),
    ).toHaveJSProperty('width', 24);

    // 8. 切换图片大小到 Large，大小切换正常
    await page
      .getByLabel('block-item-CardItem-general-table')
      .getByRole('button', { name: 'url', exact: true })
      .hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-general' })
      .hover();
    await page.getByRole('menuitem', { name: 'Size Small' }).click();
    await page.getByRole('option', { name: 'Large' }).click();
    await expect(
      page.getByLabel('block-item-CardItem-general-table').getByRole('cell').getByRole('img').first(),
    ).toHaveJSProperty('width', 72);
  });
});

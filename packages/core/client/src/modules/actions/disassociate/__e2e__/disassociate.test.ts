/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { disassociatePage } from './templatesOfPage';

test('basic', async ({ page, mockPage, mockRecord }) => {
  await mockPage(disassociatePage).goto();
  const record = await mockRecord('collection1');

  // 1. 打开弹窗，并创建一个 Table 关系区块
  await page.getByLabel('action-Action.Link-Edit record-update-collection1-table-0').click();
  await page.getByLabel('schema-initializer-Grid-popup').hover();
  await page.getByRole('menuitem', { name: 'Table right' }).hover();
  await page.getByRole('menuitem', { name: 'Associated records' }).last().hover();
  await page.getByRole('menuitem', { name: 'manyToMany' }).click();

  // 2. Table 中显示 Role UID 字段
  await page.getByLabel('Edit', { exact: true }).getByLabel('schema-initializer-TableV2-').hover();
  await page.getByRole('menuitem', { name: 'singleLineText' }).click();

  // 3. 显示 Disassociate 按钮
  await page.getByLabel('Edit', { exact: true }).getByRole('button', { name: 'Actions', exact: true }).hover();
  await page
    .getByLabel('Edit', { exact: true })
    .getByLabel('designer-schema-initializer-TableV2.Column-fieldSettings:TableColumn-collection2')
    .hover();
  await page.getByRole('menuitem', { name: 'Disassociate' }).click();

  // 4. 点击 Disassociate 按钮，解除关联
  await expect(
    page
      .getByLabel('Edit', { exact: true })
      .getByLabel('block-item-CardItem-')
      .getByText(record.manyToMany[0].singleLineText),
  ).toBeVisible();
  await page.getByLabel('action-Action.Link-Disassociate-disassociate-collection2-table-0').click();
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(
    page
      .getByLabel('Edit', { exact: true })
      .getByLabel('block-item-CardItem-')
      .getByText(record.manyToMany[0].singleLineText),
  ).toBeHidden();

  // 5. 刷新页面后，页面中 collection2 的表格中的 singleLineText 字段不应该被删除
  await page.reload();
  await expect(
    page.getByLabel('block-item-CardItem-collection2-table').getByText(record.manyToMany[0].singleLineText),
  ).toBeVisible();
});

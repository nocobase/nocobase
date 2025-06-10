/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Page, expect, test } from '@nocobase/test/e2e';
import { createTable } from './utils';

const deleteButton = async (page: Page, name: string) => {
  await page.getByRole('button', { name }).hover();
  await page.getByRole('button', { name }).getByLabel('designer-schema-settings-').hover();
  await page.waitForTimeout(300);
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'OK', exact: true }).click();
};

test.describe('where table data selector can be added', () => {
  test('popup', async ({ page, mockPage }) => {
    await createTable({ page, mockPage, fieldName: 'manyToOne' });

    // 选中一行数据之后，弹窗自动关闭，且数据被填充到关联字段中
    await page.getByLabel('checkbox').click();
    await expect(
      page
        .getByLabel('block-item-CollectionField-general-form-general.manyToOne-manyToOne')
        .getByTestId('select-data-picker'),
    ).toHaveText(`1`);
  });
});

test.describe('configure actions', () => {
  test('filter & add new & delete & refresh', async ({ page, mockPage }) => {
    await createTable({ page, mockPage, fieldName: 'manyToOne' });

    // add buttons
    await page.getByLabel('schema-initializer-ActionBar-table:configureActions-users').hover();
    await page.getByRole('menuitem', { name: 'Filter' }).click();
    await page.getByLabel('schema-initializer-ActionBar-table:configureActions-users').hover();
    await page.getByRole('menuitem', { name: 'Add new' }).click();
    await page.getByLabel('schema-initializer-ActionBar-table:configureActions-users').hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByLabel('schema-initializer-ActionBar-table:configureActions-users').hover();
    await page.getByRole('menuitem', { name: 'Refresh' }).click();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Filter' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add new' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible();

    // delete buttons
    await deleteButton(page, 'Filter');
    await deleteButton(page, 'Add new');
    await deleteButton(page, 'Delete');
    await deleteButton(page, 'Refresh');

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Filter' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Add new' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Refresh' })).not.toBeVisible();
  });

  test('customize: bulk update', async ({ page, mockPage }) => {
    await createTable({ page, mockPage, fieldName: 'manyToOne' });

    await page.getByLabel('schema-initializer-ActionBar-table:configureActions-users').hover();
    await page.getByRole('menuitem', { name: 'Bulk update' }).click();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Bulk update' })).toBeVisible();
  });
});

test.describe('configure actions column', () => {
  test('column width', async ({ page, mockPage }) => {
    await createTable({ page, mockPage, fieldName: 'manyToOne' });
    await createActionColumn(page);

    const expectActionsColumnWidth = async (width: number) => {
      // 移动鼠标，防止悬浮到 Actions 列，不然会导致 page.getByRole('columnheader', { name: 'Actions', exact: true }) 无效
      await page.mouse.move(0, 300);
      const box = await page.getByRole('columnheader', { name: 'Actions', exact: true }).boundingBox();
      expect(Math.floor(box.width)).toBe(width);
    };

    // 列宽度默认为 100
    await expectActionsColumnWidth(100);

    await page.getByText('Actions', { exact: true }).hover({ force: true });
    await page.getByLabel('designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-users').hover();
    await page.getByRole('menuitem', { name: 'Column width' }).click();

    await expect(page.getByRole('dialog').getByText('Column width')).toBeVisible();

    // 修改列宽度为 400
    await page.getByRole('dialog').getByRole('spinbutton').click();
    await page.getByRole('dialog').getByRole('spinbutton').fill('400');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await expectActionsColumnWidth(400);
  });
});

async function createActionColumn(page: Page) {
  await page.getByLabel('schema-initializer-TableV2.Selector-table:configureColumns-users').hover();
  await page.getByRole('menuitem', { name: 'Action column' }).click();
}

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { tableWithInherit, tableWithInheritWithoutAssociation, tableWithRoles, tableWithUsers } from './templatesOfBug';

test.describe('add blocks to the popup', () => {
  test('no inheritance, no views, no association fields', async ({ page, mockPage }) => {
    await mockPage(tableWithRoles).goto();

    // 打开弹窗
    await page.getByLabel('action-Action.Link-View-view-roles-table-root').click();

    // 点击 Details -> Current record 选项创建详情区块
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'Details' }).hover();
    await page.getByRole('menuitem', { name: 'Current record' }).click();
    await page.getByLabel('schema-initializer-Grid-details:configureFields-roles').hover();
    await page.getByRole('menuitem', { name: 'Role UID' }).click();
    await expect(page.getByLabel('block-item-CollectionField-Role').getByText('root')).toBeVisible();
    await page.mouse.move(300, 0);

    // 直接点击 Form(Edit) 选项创建表单区块
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'form Form (Edit)' }).click();
    await page.getByLabel('schema-initializer-Grid-form:').hover();
    await page.getByRole('menuitem', { name: 'Role UID' }).click();
    await page.mouse.move(300, 0);
    await expect(
      page.getByLabel('block-item-CollectionField-roles-form-roles.name-Role UID').getByRole('textbox'),
    ).toHaveValue('root');
  });

  test('no inheritance, no views, with association fields', async ({ page, mockPage }) => {
    await mockPage(tableWithUsers).goto();

    // 打开弹窗
    await page.getByLabel('action-Action.Link-View-view-').click();

    // 通过点击 Current record 选项创建详情区块
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'Details right' }).hover();
    await page.getByRole('menuitem', { name: 'Current record' }).click();
    await page.getByLabel('schema-initializer-Grid-details:configureFields-users').hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-users').getByText('Super Admin')).toBeVisible();

    // 通过 Association records 创建一个关系区块
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'Details right' }).hover();
    await page.getByRole('menuitem', { name: 'Associated records' }).last().hover();
    await page.getByRole('menuitem', { name: 'Roles' }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('schema-initializer-Grid-details:configureFields-roles').hover();
    await page.getByRole('menuitem', { name: 'Role UID' }).click();
    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-roles').getByText('admin')).toBeVisible();
  });

  test('with inheritance, with association fields', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(tableWithInherit).waitForInit();
    const fatherRecord = await mockRecord('father');
    await nocoPage.goto();

    // 打开弹窗
    await page.getByLabel('action-Action.Link-View-view-father-table-0').click();

    // 通过 Current record 创建详情区块
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'Details right' }).hover();
    await page.getByRole('menuitem', { name: 'Current record right' }).hover();
    await page.getByRole('menuitem', { name: 'father' }).click();
    await page.mouse.move(-300, 0);
    await page.getByLabel('schema-initializer-Grid-details:configureFields-father').hover();
    await page.getByRole('menuitem', { name: 'singleLineText' }).click();
    await page.mouse.move(300, 0);
    await expect(
      page.getByLabel('block-item-CollectionField-father').getByText(fatherRecord.singleLineText),
    ).toBeVisible();

    // 通过 Association records 创建关系区块
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'Table right' }).hover();
    await page.getByRole('menuitem', { name: 'Associated records' }).last().hover();
    await page.getByRole('menuitem', { name: 'manyToMany' }).click();
    await page.mouse.move(-300, 0);
    await page
      .getByTestId('drawer-Action.Container-father-View record')
      .getByLabel('schema-initializer-TableV2-')
      .hover();
    await page.getByRole('menuitem', { name: 'singleLineText' }).click();
    await page.mouse.move(300, 0);
    await expect(
      page
        .getByTestId('drawer-Action.Container-father-View record')
        .getByLabel('block-item-CardItem-')
        .getByRole('row')
        .getByText(fatherRecord.manyToMany[0].singleLineText),
    ).toBeVisible();
  });

  test('with inheritance, no association fields', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(tableWithInheritWithoutAssociation).waitForInit();
    const fatherRecord = await mockRecord('father');
    await nocoPage.goto();

    // 打开弹窗
    await page.getByLabel('action-Action.Link-View-view-father-table-0').click();

    // 通过 Current record 创建详情区块
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'Details right' }).hover();
    await page.getByRole('menuitem', { name: 'Current record right' }).hover();
    await page.getByRole('menuitem', { name: 'father' }).click();
    await page.getByLabel('schema-initializer-Grid-details:configureFields-father').hover();
    await page.getByRole('menuitem', { name: 'singleLineText' }).click();
    await page.mouse.move(300, 0);
    await expect(
      page.getByLabel('block-item-CollectionField-father').getByText(fatherRecord.singleLineText),
    ).toBeVisible();
  });

  test('only support association fields', async ({ page, mockPage }) => {
    await mockPage(tableWithUsers).goto();

    // 打开弹窗
    await page.getByLabel('action-Action.Link-View-view-').click();

    // 通过 Association records 创建一个关系区块
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'Table right' }).hover();
    await page.getByRole('menuitem', { name: 'Associated records' }).last().hover();
    await page.getByRole('menuitem', { name: 'Roles' }).click();
    await page
      .getByTestId('drawer-Action.Container-users-View record')
      .getByLabel('schema-initializer-TableV2-')
      .hover();
    await page.getByRole('menuitem', { name: 'Role UID' }).click();
    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CardItem-roles-').getByRole('row').getByText('root')).toBeVisible();
  });
});

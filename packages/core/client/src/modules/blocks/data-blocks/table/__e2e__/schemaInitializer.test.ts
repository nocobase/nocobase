/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Page, expect, oneEmptyTable, test } from '@nocobase/test/e2e';
import { addAssociationFields } from '../../form/__e2e__/form-edit/templatesOfBug';
import { oneTableWithInheritFields } from './templatesOfBug';

const deleteButton = async (page: Page, name: string) => {
  await page.getByLabel(`action-Action.Link-${name}-`).hover();
  await page.getByLabel(`action-Action.Link-${name}-`).getByLabel('designer-schema-settings-').hover();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'OK', exact: true }).click();
};

test.describe('configure columns', () => {
  // 该用例在 CI 并发环境下容易报错，原因未知，通过增加重试次数可以解决
  test.describe.configure({ retries: process.env.CI ? 4 : 0 });
  test('action column & display collection fields & display association fields', async ({
    page,
    mockPage,
    mockRecord,
  }) => {
    await mockPage(oneEmptyTable).goto();
    const record = await mockRecord('t_unp4scqamw9');
    const configureColumnButton = page.getByLabel('schema-initializer-TableV2-table:configureColumns-t_unp4scqamw9');

    // Action column -------------------------------------------------------------
    // 1. 点击开关，可以开启和关闭 Action column
    // 2. 点击开关之后，如果不移出鼠标，下拉框不应该关闭
    await expect(page.getByText('Actions', { exact: true })).toBeVisible();
    await configureColumnButton.hover();

    await expect(page.getByRole('menuitem', { name: 'Action column' }).getByRole('switch')).toBeChecked();
    await page.getByRole('menuitem', { name: 'Action column' }).click();
    await expect(page.getByRole('menuitem', { name: 'Action column' }).getByRole('switch')).not.toBeChecked();

    // 移动鼠标关闭下拉框
    await page.mouse.move(300, 0);
    await expect(page.getByText('Actions', { exact: true })).not.toBeVisible();

    // 再次开启 Action column
    await configureColumnButton.hover();
    await page.getByRole('menuitem', { name: 'Action column' }).click();
    await expect(page.getByRole('menuitem', { name: 'Action column' }).getByRole('switch')).toBeChecked();
    await page.mouse.move(300, 0);
    await expect(page.getByText('Actions', { exact: true })).toBeVisible();

    // display collection fields -------------------------------------------------------------
    await configureColumnButton.hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await page.mouse.move(300, 0);

    await configureColumnButton.hover();
    await page.getByRole('menuitem', { name: 'One to one (belongs to)' }).first().click();
    await page.mouse.move(300, 0);

    await configureColumnButton.hover();
    await page.getByRole('menuitem', { name: 'One to one (has one)' }).first().click();
    await page.mouse.move(300, 0);

    await configureColumnButton.hover();
    await page.getByRole('menuitem', { name: 'Many to one' }).first().click();
    await page.mouse.move(300, 0);

    await configureColumnButton.hover();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch')).toBeChecked();
    await expect(
      page.getByRole('menuitem', { name: 'One to one (belongs to)' }).first().getByRole('switch'),
    ).toBeChecked();
    await expect(
      page.getByRole('menuitem', { name: 'One to one (has one)' }).first().getByRole('switch'),
    ).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Many to one' }).first().getByRole('switch')).toBeChecked();
    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'ID', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'One to one (belongs to)', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'One to one (has one)', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Many to one', exact: true })).toBeVisible();

    // 点击开关，删除创建的字段
    await configureColumnButton.hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click({
      position: {
        x: 30,
        y: 10,
      },
    });
    await page.mouse.move(300, 0);

    await configureColumnButton.hover();
    await page.getByRole('menuitem', { name: 'One to one (belongs to)' }).first().click();
    await page.mouse.move(300, 0);

    await configureColumnButton.hover();
    await page.getByRole('menuitem', { name: 'One to one (has one)' }).first().click();
    await page.mouse.move(300, 0);

    await configureColumnButton.hover();
    await page.getByRole('menuitem', { name: 'Many to one' }).first().click();
    await page.mouse.move(300, 0);

    await configureColumnButton.hover();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch')).not.toBeChecked();
    await expect(
      page.getByRole('menuitem', { name: 'One to one (belongs to)' }).first().getByRole('switch'),
    ).not.toBeChecked();
    await expect(
      page.getByRole('menuitem', { name: 'One to one (has one)' }).first().getByRole('switch'),
    ).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Many to one' }).first().getByRole('switch')).not.toBeChecked();
    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'ID', exact: true })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'One to one (belongs to)', exact: true })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'One to one (has one)', exact: true })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Many to one', exact: true })).not.toBeVisible();

    // display association fields -------------------------------------------------------------
    await configureColumnButton.hover();
    await page.getByRole('menuitem', { name: 'One to one (belongs to)' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).toBeChecked();
    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Nickname', exact: true })).toBeVisible();
    await expect(page.getByLabel('block-item-CardItem-').getByText(record.f_pw7uiecc8uc.nickname)).toBeVisible();

    // 点击开关，删除创建的字段
    await configureColumnButton.hover();
    await page.getByRole('menuitem', { name: 'One to one (belongs to)' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).not.toBeChecked();
    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Nickname', exact: true })).not.toBeVisible();
  });

  test('multiple depths of association fields', async ({ page, mockPage, mockRecord, mockRecords }) => {
    const nocoPage = await mockPage(addAssociationFields).waitForInit();

    // The purpose here is to make the IDs in the same row different
    await mockRecords('targetCollection1', 2, 0);
    await mockRecords('targetCollection2', 1, 0);

    const record = await mockRecord('general', 3);
    await nocoPage.goto();

    // 1. Create association fields for the first, second, and third levels
    await page.getByLabel('schema-initializer-TableV2-').hover();
    await page.getByRole('menuitem', { name: 'manyToOne1', exact: true }).click();
    await page.getByRole('menuitem', { name: 'manyToOne1 right' }).hover();
    await page.getByRole('menuitem', { name: 'manyToOne2', exact: true }).click();
    await page.getByRole('menuitem', { name: 'manyToOne2 right' }).hover();
    await page.getByRole('menuitem', { name: 'manyToOne3' }).click();
    await page.mouse.move(600, 0);
    await page.reload();

    // 2. Click on the association field, create a details block in the popup, display the ID field, and assert if it's correct
    await page
      .getByRole('button', { name: `${record.manyToOne1.id}`, exact: true })
      .getByText(record.manyToOne1.id)
      .click();
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'Details right' }).hover();
    await page.getByRole('menuitem', { name: 'Current record' }).click();
    await page.getByLabel('schema-initializer-Grid-details:configureFields-targetCollection1').hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await page.mouse.move(600, 0);
    await expect(page.getByLabel('block-item-CollectionField-')).toHaveText(`ID:${record.manyToOne1.id}`);
    await page.getByLabel('drawer-AssociationField.Viewer-targetCollection1-View record-mask').click();

    await page
      .getByRole('button', { name: `${record.manyToOne1.manyToOne2.id}`, exact: true })
      .getByText(record.manyToOne1.manyToOne2.id)
      .click();
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'Details right' }).hover();
    await page.getByRole('menuitem', { name: 'Current record' }).click();
    await page.getByLabel('schema-initializer-Grid-details:configureFields-targetCollection2').hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await page.mouse.move(600, 0);
    await expect(page.getByLabel('block-item-CollectionField-')).toHaveText(`ID:${record.manyToOne1.manyToOne2.id}`);
    await page.getByLabel('drawer-AssociationField.Viewer-targetCollection2-View record-mask').click();

    await page
      .getByRole('button', { name: `${record.manyToOne1.manyToOne2.manyToOne3.id}`, exact: true })
      .getByText(record.manyToOne1.manyToOne2.manyToOne3.id)
      .click();
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'Details right' }).hover();
    await page.getByRole('menuitem', { name: 'Current record' }).click();
    await page.getByLabel('schema-initializer-Grid-details:configureFields-emptyCollection').hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await page.mouse.move(600, 0);

    await expect(page.getByLabel('block-item-CollectionField-')).toHaveText(
      `ID:${record.manyToOne1.manyToOne2.manyToOne3.id}`,
    );
    await page.getByLabel('drawer-AssociationField.Viewer-emptyCollection-View record-mask').click();

    // 测试详情区块的关系字段
    // 1. 点击行操作按钮打开弹窗，创建一个详情区块，并配置第一、二、三级关系字段
    await page.getByLabel('action-Action.Link-Edit-').first().click();
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'Details right' }).hover();
    await page.getByRole('menuitem', { name: 'Current record' }).click();
    await page.getByLabel('schema-initializer-Grid-details:configureFields-general').hover();
    await page.getByRole('menuitem', { name: 'manyToOne1', exact: true }).click();
    await page.getByRole('menuitem', { name: 'manyToOne1 right' }).hover();
    await page.getByRole('menuitem', { name: 'manyToOne2', exact: true }).click();
    await page.getByRole('menuitem', { name: 'manyToOne2 right' }).hover();
    await page.getByRole('menuitem', { name: 'manyToOne3' }).click();
    await page.mouse.move(600, 0);
    await page.reload();

    // 2. 点击每一个关系字段，创建一个详情区块，显示 ID 字段，断言 ID 是否正确
    await page
      .getByLabel('block-item-CollectionField-general-details-general.manyToOne1-manyToOne1')
      .getByText(String(record.manyToOne1.id), { exact: true })
      .click();
    await page
      .getByTestId('drawer-AssociationField.Viewer-targetCollection1-View record')
      .getByLabel('schema-initializer-Grid-popup')
      .hover();
    await page.getByRole('menuitem', { name: 'Details right' }).hover();
    await page.getByRole('menuitem', { name: 'Current record' }).click();
    await page.getByLabel('schema-initializer-Grid-details:configureFields-targetCollection1').hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await expect(
      page
        .getByTestId('drawer-AssociationField.Viewer-targetCollection1-View record')
        .getByLabel('block-item-CollectionField-'),
    ).toHaveText(`ID:${record.manyToOne1.id}`);
    await page.getByLabel('drawer-AssociationField.Viewer-targetCollection1-View record-mask').click();

    // another field
    await page
      .getByLabel('block-item-CollectionField-general-details-targetCollection1.manyToOne2-')
      .getByText(String(record.manyToOne1.manyToOne2.id), { exact: true })
      .click();
    await page
      .getByTestId('drawer-AssociationField.Viewer-targetCollection2-View record')
      .getByLabel('schema-initializer-Grid-popup')
      .hover();
    await page.getByRole('menuitem', { name: 'Details right' }).hover();
    await page.getByRole('menuitem', { name: 'Current record' }).click();
    await page.getByLabel('schema-initializer-Grid-details:configureFields-targetCollection2').hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await expect(
      page
        .getByTestId('drawer-AssociationField.Viewer-targetCollection2-View record')
        .getByLabel('block-item-CollectionField-'),
    ).toHaveText(`ID:${record.manyToOne1.manyToOne2.id}`);
    await page.getByLabel('drawer-AssociationField.Viewer-targetCollection2-View record-mask').click();

    // another field
    await page
      .getByLabel('block-item-CollectionField-general-details-targetCollection2.manyToOne3-')
      .getByText(String(record.manyToOne1.manyToOne2.manyToOne3.id), { exact: true })
      .click();
    await page
      .getByTestId('drawer-AssociationField.Viewer-emptyCollection-View record')
      .getByLabel('schema-initializer-Grid-popup')
      .hover();
    await page.getByRole('menuitem', { name: 'Details right' }).hover();
    await page.getByRole('menuitem', { name: 'Current record' }).click();
    await page.getByLabel('schema-initializer-Grid-details:configureFields-emptyCollection').hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await expect(
      page
        .getByTestId('drawer-AssociationField.Viewer-emptyCollection-View record')
        .getByLabel('block-item-CollectionField-'),
    ).toHaveText(`ID:${record.manyToOne1.manyToOne2.manyToOne3.id}`);
  });

  test.pgOnly('display inherit fields', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableWithInheritFields).waitForInit();
    const record = await mockRecord('child');
    await nocoPage.goto();

    // 选择继承字段
    await page.getByLabel('schema-initializer-TableV2-').hover();
    await page.getByRole('menuitem', { name: 'parentField1' }).click();
    await page.getByRole('menuitem', { name: 'parentField2' }).click();
    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CardItem-child-').getByText(record.parentField1)).toBeVisible();
    await expect(page.getByLabel('block-item-CardItem-child-').getByText(record.parentField2)).toBeVisible();
  });
});

test.describe('configure actions column', () => {
  test('view & edit & delete & duplicate & customize', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyTable).waitForInit();
    await mockRecord('t_unp4scqamw9');
    await nocoPage.goto();

    // add view & Edit & Delete & Duplicate ------------------------------------------------------------
    await page.getByText('Actions', { exact: true }).hover({ force: true });
    await page.getByLabel('designer-schema-initializer-TableV2.Column-TableV2.ActionColumnDesigner-').hover();
    await page.getByRole('menuitem', { name: 'View' }).click();

    await page.getByText('Actions', { exact: true }).hover({ force: true });
    await page.getByLabel('designer-schema-initializer-TableV2.Column-TableV2.ActionColumnDesigner-').hover();
    await page.getByRole('menuitem', { name: 'Edit' }).click();

    await page.getByText('Actions', { exact: true }).hover({ force: true });
    await page.getByLabel('designer-schema-initializer-TableV2.Column-TableV2.ActionColumnDesigner-').hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.mouse.move(500, 0);

    // await page.getByText('Actions', { exact: true }).hover({ force: true });
    // await page.getByLabel('designer-schema-initializer-TableV2.Column-TableV2.ActionColumnDesigner-').hover();
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-View-view-t_unp4scqamw9-table-0')).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Edit-update-t_unp4scqamw9-table-0')).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Delete-destroy-t_unp4scqamw9-table-0')).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Duplicate-duplicate-t_unp4scqamw9-table-0')).toBeVisible();

    // delete view & Edit & Delete & Duplicate ------------------------------------------------------------
    await deleteButton(page, 'View');
    await deleteButton(page, 'Edit');
    await deleteButton(page, 'Delete');
    await deleteButton(page, 'Duplicate');

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-View-view-t_unp4scqamw9-table-0')).not.toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Edit-update-t_unp4scqamw9-table-0')).not.toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Delete-destroy-t_unp4scqamw9-table-0')).not.toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Duplicate-duplicate-t_unp4scqamw9-table-0')).not.toBeVisible();

    // add custom action ------------------------------------------------------------
    await page.getByText('Actions', { exact: true }).hover({ force: true });
    await page.getByLabel('designer-schema-initializer-TableV2.Column-TableV2.ActionColumnDesigner-').hover();
    await page.getByRole('menuitem', { name: 'Popup' }).click();

    await page.getByText('Actions', { exact: true }).hover({ force: true });
    await page.getByLabel('designer-schema-initializer-TableV2.Column-TableV2.ActionColumnDesigner-').hover();
    await page.getByRole('menuitem', { name: 'Update record' }).click();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-Popup-customize:popup-t_unp4scqamw9-table-0')).toBeVisible();
    await expect(
      page.getByLabel('action-Action.Link-Update record-customize:update-t_unp4scqamw9-table-0'),
    ).toBeVisible();
  });

  test('column width', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTable).goto();

    // 列宽度默认为 100
    await expect(page.getByRole('columnheader', { name: 'Actions', exact: true })).toHaveJSProperty('offsetWidth', 100);

    await page.getByText('Actions', { exact: true }).hover({ force: true });
    await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-').hover();
    await page.getByRole('menuitem', { name: 'Column width' }).click();

    await expect(page.getByRole('dialog').getByText('Column width')).toBeVisible();

    await page.getByRole('dialog').getByRole('spinbutton').click();
    await page.getByRole('dialog').getByRole('spinbutton').fill('400');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await expect(page.getByRole('columnheader', { name: 'Actions', exact: true })).toHaveJSProperty('offsetWidth', 400);
  });
});

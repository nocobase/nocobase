/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, oneEmptyTableBlockWithActions, test } from '@nocobase/test/e2e';
import { T3848 } from '../../../details-single/__e2e__/templatesOfBug';

test.describe('where edit form block can be added', () => {
  test('popup', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await page.getByLabel('action-Action.Link-Edit-update-general-table-0').click();
    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-general').hover();
    await page.getByText('Form').first().click();
    await page.mouse.move(300, 0);

    await expect(page.getByLabel('block-item-CardItem-general-form')).toBeVisible();
  });

  // https://nocobase.height.app/T-3848/description
  test('popup opened by clicking on the button for the relationship field', async ({
    page,
    mockPage,
    mockRecord,
    clearBlockTemplates,
  }) => {
    const nocoPage = await mockPage(T3848).waitForInit();
    await mockRecord('example');
    await nocoPage.goto();

    // 1.打开弹窗
    await page.getByRole('button', { name: '2', exact: true }).getByText('2').hover();
    await page.getByRole('button', { name: '2', exact: true }).getByText('2').click();

    // 2.创建一个编辑表单区块
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'form Form (Edit)' }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('schema-initializer-Grid-form:').hover();
    await page.getByRole('menuitem', { name: 'ID' }).click();
    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-').getByText('2')).toBeVisible();

    // 3.将上面的编辑表单区块保存为模板，然后再使用该模板创建区块
    await page.getByLabel('block-item-CardItem-example-form').hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:editForm-example').hover();
    await page.getByRole('menuitem', { name: 'Save as block template' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    // 通过模板创建区块
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'form Form (Edit)' }).hover();
    await page.getByRole('menuitem', { name: 'Duplicate template' }).hover();
    await page.getByRole('menuitem', { name: 'example_Form (Fields only)' }).click();
    await page.mouse.move(300, 0);
    // 通过模板创建的数据应该和普通区块一样
    await expect(page.getByLabel('block-item-CollectionField-').nth(1).getByText('2')).toBeVisible();

    // 4.删除模板，避免影响后续测试
    await clearBlockTemplates();
  });
});

test.describe('configure actions', () => {});

test.describe('configure fields', () => {});

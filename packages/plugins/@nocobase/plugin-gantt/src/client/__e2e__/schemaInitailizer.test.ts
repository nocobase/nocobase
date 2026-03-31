/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { generalWithDatetimeFields, oneEmptyGantt } from './utils';

test('BlockInitializers should add gantt block', async ({ page, mockPage, mockCollections }) => {
  await mockCollections(generalWithDatetimeFields);
  await mockPage().goto();
  await page.getByLabel('schema-initializer-Grid-page:addBlock').click();
  await page.getByRole('menuitem', { name: 'Gantt right' }).click();
  await page.getByRole('menuitem', { name: 'General' }).click();
  await page.getByLabel('block-item-Select-Title field').click();
  await page.getByRole('option', { name: 'Single line text2' }).last().click();
  await page.getByLabel('block-item-Select-Start date field').click();
  await page.getByRole('option', { name: 'Start date time2' }).click();
  await page.getByLabel('block-item-Select-End date field').click();
  await page.getByRole('option', { name: 'End date time2' }).last().click();
  await page.getByLabel('block-item-Select-Progress field').click();
  await page.getByRole('option', { name: 'Percent2' }).last().click();
  await page.getByLabel('block-item-Select-Time scale').click();
  await page.getByRole('option', { name: 'Day', exact: true }).last().click();
  await page.getByRole('button', { name: 'OK', exact: true }).last().click();
  await expect(page.getByLabel('block-item-gantt')).toBeVisible();
});

//配置字段
test.describe('configure fields', () => {
  test('add field,then remove field in gantt block', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneEmptyGantt).goto();
    await page.getByLabel('schema-initializer-TableV2-table:configureColumns-general').hover();
    await page.getByRole('menuitem', { name: 'ID' }).click();
    await page.getByRole('menuitem', { name: 'Single line text2' }).click();
    //添加字段
    await expect(page.getByRole('button', { name: 'ID', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Single line text2' })).toBeVisible();
    //激活的状态
    await expect(page.getByRole('menuitem', { name: 'ID' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Single line text2' }).getByRole('switch')).toBeChecked();
    //移除字段
    await page.getByRole('menuitem', { name: 'ID' }).click();
    await page.getByRole('menuitem', { name: 'Single line text2' }).click();
    await expect(page.getByRole('menuitem', { name: 'ID' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Single line text2' }).getByRole('switch')).not.toBeChecked();
  });
  test('add association field should appends association', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneEmptyGantt).goto();
    await mockRecord('general', { singleLineText: 'singleLineText', manyToOne: { id: 1 } });
    await page.getByLabel('schema-initializer-TableV2-table:configureColumns-general').hover();

    //关系字段,断言请求的appends是否符合预期
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('api/general:list')),
      page.getByRole('menuitem', { name: 'Many to one', exact: true }).click(),
    ]);
    // 获取请求参数
    const requestUrl = request.url();
    // 解析查询参数
    const queryParams = new URLSearchParams(new URL(requestUrl).search);
    const appends = queryParams.get('appends[]');
    await expect(appends).toContain('manyToOne');
    //支持修改标题字段
    await page.getByRole('button', { name: 'Many to one' }).hover();
    await page.getByLabel('designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-general').hover();
    await page.getByRole('menuitem', { name: 'Title field' }).click();
    await page.getByText('Username').click();
    await expect(
      page.getByLabel('block-item-CardItem-general-table').getByRole('button', { name: 'nocobase' }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByLabel('block-item-CardItem-general-table').getByRole('button', { name: 'nocobase' }),
    ).toBeVisible();
  });
});

//配置操作
test.describe('configure actions', () => {
  test('configure button in gannt block', async ({ page, mockPage }) => {
    await mockPage(oneEmptyGantt).goto();
    await page.getByLabel('schema-initializer-ActionBar-gantt:configureActions-general').hover();
    await page.getByRole('menuitem', { name: 'Filter' }).click();
    await page.getByLabel('schema-initializer-ActionBar-gantt:configureActions-general').hover();
    await page.getByRole('menuitem', { name: 'Add new' }).click();
    await page.getByLabel('schema-initializer-ActionBar-gantt:configureActions-general').hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByLabel('schema-initializer-ActionBar-gantt:configureActions-general').hover();
    await page.getByRole('menuitem', { name: 'Refresh' }).click();
    await page.getByLabel('schema-initializer-ActionBar-gantt:configureActions-general').hover();
    await page.getByRole('menuitem', { name: 'Bulk update' }).click();
    await page.getByLabel('schema-initializer-ActionBar-gantt:configureActions-general').hover();
    await page.getByRole('menuitem', { name: 'Bulk edit' }).click();
    await expect(page.getByLabel('action-Filter.Action-Filter-filter-general-table')).toBeVisible();
    await expect(page.getByLabel('action-Action-Add new-create-general-table')).toBeVisible();
    await expect(page.getByLabel('action-Action-Delete-destroy-general-table')).toBeVisible();
    await expect(page.getByLabel('action-Action-Refresh-refresh-general-table')).toBeVisible();
    await expect(page.getByLabel('action-Action-Bulk update-customize:bulkUpdate-general-table')).toBeVisible();
    await expect(page.getByLabel('action-Action-Bulk edit-customize:bulkEdit-general-table')).toBeVisible();
  });
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { detailsTableListGridCardInPopup, tableDetailsListGridCardWithUsers } from './templates';

test.describe('where filter block can be added', () => {
  test('page', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(tableDetailsListGridCardWithUsers).waitForInit();
    const newUserRecords = await mockRecords('users', 3);
    await nocoPage.goto();

    // 1. 页面中创建一个 filter form，一个 filter collapse
    await page.getByLabel('schema-initializer-Grid-page:').hover();
    await page.getByRole('menuitem', { name: 'Form right' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();
    await page.getByLabel('schema-initializer-Grid-page:').hover();
    await page.getByRole('menuitem', { name: 'Collapse right' }).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();

    // 2. 区块中能正常创建字段和按钮，且能正常显示字段值
    await page.getByLabel('schema-initializer-Grid-filterForm:configureFields-users').hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await page.getByLabel('schema-initializer-ActionBar-filterForm:configureActions-users').hover();
    await page.getByRole('menuitem', { name: 'Filter' }).click();
    await page.getByRole('menuitem', { name: 'Reset' }).click();
    await page.getByLabel('schema-initializer-AssociationFilter-filterCollapse:configureFields-users').hover();
    await page.getByRole('menuitem', { name: 'Roles' }).click();

    // 3. 与 Table、Details、List、GridCard 等区块建立连接
    const connectByForm = async (name: string) => {
      await page
        .getByLabel('designer-schema-settings-CardItem-blockSettings:filterForm-users')
        .waitFor({ state: 'hidden' });
      await page.getByLabel('block-item-CardItem-users-filter-form').hover();
      await page.getByRole('menuitem', { name: 'Connect data blocks right' }).waitFor({ state: 'detached' });
      await page.getByLabel('designer-schema-settings-CardItem-blockSettings:filterForm-users').hover();
      await page.getByRole('menuitem', { name: 'Connect data blocks right' }).hover();
      await page.getByRole('menuitem', { name }).click();
    };
    const connectByCollapse = async (name: string) => {
      await page.mouse.move(-500, 0);
      await page.getByLabel('block-item-CardItem-users-filter-collapse').hover();
      await page.getByRole('menuitem', { name: 'Connect data blocks right' }).waitFor({ state: 'detached' });
      await page.getByLabel('designer-schema-settings-CardItem-blockSettings:filterCollapse-users').hover();
      await page.getByRole('menuitem', { name: 'Connect data blocks right' }).hover();
      await page.getByRole('menuitem', { name }).click();
    };
    await connectByForm('Users #79xm');
    await connectByForm('Users #4whf');
    await connectByForm('Users #qztm');
    await connectByForm('Users #2nig');
    await connectByCollapse('Users #79xm');
    await connectByCollapse('Users #4whf');
    await connectByCollapse('Users #qztm');
    await connectByCollapse('Users #2nig');

    // 4. 筛选区块能正常筛选数据
    await page
      .getByLabel('block-item-CollectionField-users-filter-form-users.nickname-Nickname')
      .getByRole('textbox')
      .fill(newUserRecords[0].nickname);

    // filter
    await page.getByLabel('action-Action-Filter-submit-').click({ position: { x: 10, y: 10 } });
    await page.waitForLoadState('load');
    for (const record of newUserRecords) {
      await expect(page.getByLabel('block-item-CardItem-users-table').getByText(record.nickname)).toBeVisible({
        visible: record === newUserRecords[0],
      });
      await expect(page.getByLabel('block-item-CardItem-users-details').getByText(record.nickname)).toBeVisible({
        visible: record === newUserRecords[0],
      });
      await expect(page.getByLabel('block-item-CardItem-users-list').getByText(record.nickname)).toBeVisible({
        visible: record === newUserRecords[0],
      });
      await expect(page.getByLabel('block-item-BlockItem-users-grid').getByText(record.nickname)).toBeVisible({
        visible: record === newUserRecords[0],
      });
    }

    // reset
    await page.getByLabel('action-Action-Reset-users-').click({ position: { x: 10, y: 10 } });
    await page.waitForLoadState('load');
    for (const record of newUserRecords) {
      await expect(page.getByLabel('block-item-CardItem-users-table').getByText(record.nickname)).toBeVisible();
      await expect(page.getByLabel('block-item-CardItem-users-list').getByText(record.nickname)).toBeVisible();
      await expect(page.getByLabel('block-item-BlockItem-users-grid').getByText(record.nickname)).toBeVisible();
    }
  });

  test('popup', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(detailsTableListGridCardInPopup).waitForInit();
    const usersRecords = await mockRecords('users', 3);
    await nocoPage.goto();

    // 1. 测试用表单筛选关系区块
    await page.getByLabel('action-Action.Link-View record-view-users-table-1').click();
    await page.waitForTimeout(1000);
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'Form right' }).hover();
    await page.getByRole('menuitem', { name: 'Roles' }).click();
    await page.getByLabel('schema-initializer-Grid-filterForm:configureFields-roles').hover();
    await page.getByRole('menuitem', { name: 'Role UID' }).click();
    await page.getByLabel('schema-initializer-ActionBar-filterForm:configureActions-roles').hover();
    await page.getByRole('menuitem', { name: 'Filter' }).click();
    await page.getByRole('menuitem', { name: 'Reset' }).click();

    const connectToAssociationBlock = async (name: string) => {
      await page.mouse.move(-500, 0);
      await page.getByLabel('block-item-CardItem-roles-filter-form').hover();
      await page.getByLabel('designer-schema-settings-CardItem-blockSettings:filterForm-roles').hover();
      await page.getByRole('menuitem', { name: 'Connect data blocks right' }).hover();
      await page.getByRole('menuitem', { name }).click();
    };
    await connectToAssociationBlock('Roles #as4s');
    await connectToAssociationBlock('Roles #vp3q');
    await connectToAssociationBlock('Roles #ug18');
    await connectToAssociationBlock('Roles #q6hq');

    await page
      .getByLabel('block-item-CardItem-roles-filter-form')
      .getByRole('textbox')
      .fill(usersRecords[0].roles[0].name);
    await page.getByLabel('action-Action-Filter-submit-').click({ position: { x: 10, y: 10 } });
    await page.waitForLoadState('load');

    for (const record of usersRecords[0].roles) {
      await expect(page.getByLabel('block-item-CardItem-roles-details').getByText(record.name)).toBeVisible({
        visible: record.name === usersRecords[0].roles[0].name,
      });
      await expect(page.getByLabel('block-item-CardItem-roles-table').getByText(record.name)).toBeVisible({
        visible: record.name === usersRecords[0].roles[0].name,
      });
      await expect(page.getByLabel('block-item-CardItem-roles-list').getByText(record.name)).toBeVisible({
        visible: record.name === usersRecords[0].roles[0].name,
      });
      await expect(page.getByLabel('block-item-BlockItem-roles-').getByText(record.name)).toBeVisible({
        visible: record.name === usersRecords[0].roles[0].name,
      });
    }

    await page.getByLabel('action-Action-Reset-roles-').click({ position: { x: 10, y: 10 } });
    await page.waitForLoadState('load');
    for (const record of usersRecords[0].roles) {
      await expect(page.getByLabel('block-item-CardItem-roles-table').getByText(record.name)).toBeVisible();
      await expect(page.getByLabel('block-item-CardItem-roles-list').getByText(record.name)).toBeVisible();
      await expect(page.getByLabel('block-item-BlockItem-roles-').getByText(record.name)).toBeVisible();
    }

    // 2. 测试用表单筛选其它区块
    await page.getByRole('menuitem', { name: 'Form right' }).waitFor({ state: 'detached' });
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'Users' }).waitFor({ state: 'detached' });
    await page.getByRole('menuitem', { name: 'Form right' }).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();
    await page.getByLabel('schema-initializer-Grid-filterForm:configureFields-users').hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await page.getByLabel('schema-initializer-ActionBar-filterForm:configureActions-users').hover();
    await page.getByRole('menuitem', { name: 'Filter' }).click();
    await page.getByRole('menuitem', { name: 'Reset' }).click();

    const connectToOtherBlock = async (name: string) => {
      await page.mouse.move(-500, 0);
      await page.getByLabel('block-item-CardItem-users-filter-form').hover();
      await page.getByLabel('designer-schema-settings-CardItem-blockSettings:filterForm-users').hover();
      await page.getByRole('menuitem', { name: 'Connect data blocks right' }).hover();
      await page.getByRole('menuitem', { name }).click();
    };
    await connectToOtherBlock('Users #iwq7');
    await connectToOtherBlock('Users #1xi2');
    await connectToOtherBlock('Users #11h7');
    await connectToOtherBlock('Users #o1nq');

    await page.getByLabel('block-item-CardItem-users-filter-form').getByRole('textbox').fill(usersRecords[0].nickname);
    await page.getByLabel('action-Action-Filter-submit-users-filter-form').click({ position: { x: 10, y: 10 } });
    await page.waitForLoadState('load');
    for (const record of usersRecords) {
      await expect(page.getByLabel('block-item-CardItem-users-details').getByText(record.nickname)).toBeVisible({
        visible: record === usersRecords[0],
      });
      await expect(
        page
          .getByTestId('drawer-Action.Container-users-View record')
          .getByLabel('block-item-CardItem-users-table')
          .getByText(record.nickname),
      ).toBeVisible({
        visible: record === usersRecords[0],
      });
      await expect(page.getByLabel('block-item-CardItem-users-list').getByText(record.nickname)).toBeVisible({
        visible: record === usersRecords[0],
      });
      await expect(page.getByLabel('block-item-BlockItem-users-grid').getByText(record.nickname)).toBeVisible({
        visible: record === usersRecords[0],
      });
    }

    await page.getByLabel('action-Action-Reset-users-').click({ position: { x: 10, y: 10 } });
    await page.waitForLoadState('load');
    for (const record of usersRecords) {
      await expect(
        page
          .getByTestId('drawer-Action.Container-users-View record')
          .getByLabel('block-item-CardItem-users-table')
          .getByText(record.nickname),
      ).toBeVisible();
      await expect(page.getByLabel('block-item-CardItem-users-list').getByText(record.nickname)).toBeVisible();
      await expect(page.getByLabel('block-item-BlockItem-users-grid').getByText(record.nickname)).toBeVisible();
    }
  });
});

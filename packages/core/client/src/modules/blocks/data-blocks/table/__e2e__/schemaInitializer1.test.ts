/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Page, createBlockInPage, expect, oneEmptyTable, test } from '@nocobase/test/e2e';
import { T3686, T4005 } from './templatesOfBug';

const deleteButton = async (page: Page, name: string) => {
  await page.getByRole('button', { name }).hover();
  await page.getByRole('menuitem', { name: 'Delete' }).waitFor({ state: 'detached' });
  await page.getByRole('button', { name }).getByLabel('designer-schema-settings-').hover();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'OK', exact: true }).click();
};

test.describe('where table block can be added', () => {
  test('page', async ({ page, mockPage }) => {
    await mockPage().goto();

    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await createBlockInPage(page, 'Table');
    await expect(page.getByLabel('block-item-CardItem-users-table')).toBeVisible();
  });

  test('popup', async ({ page, mockPage, mockRecord }) => {
    await mockPage(T3686).goto();
    await mockRecord('parentCollection');
    const childRecord = await mockRecord('childCollection');

    // 打开弹窗
    await page.getByLabel('action-Action.Link-View').click();

    // 添加当前表关系区块
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'Table right' }).hover();
    await page.getByRole('menuitem', { name: 'childAssociationField' }).waitFor({ state: 'detached' });
    await page.getByRole('menuitem', { name: 'Associated records right' }).last().hover();
    await page.getByRole('menuitem', { name: 'childAssociationField' }).click();
    await page
      .getByTestId('drawer-Action.Container-childCollection-View record')
      .getByLabel('schema-initializer-TableV2-')
      .hover();
    await page.getByRole('menuitem', { name: 'childTargetText' }).click();

    // 添加父表关系区块
    await page.getByRole('menuitem', { name: 'Table right' }).waitFor({ state: 'detached' });
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'Associated records right' }).waitFor({ state: 'detached' });
    await page.getByRole('menuitem', { name: 'Table right' }).hover();
    await page.waitForTimeout(300);
    await page.getByRole('menuitem', { name: 'Associated records right' }).hover();
    await page.getByRole('menuitem', { name: 'parentAssociationField' }).click();
    await page.getByLabel('schema-initializer-TableV2-table:configureColumns-parentTargetCollection').hover();
    await page.getByRole('menuitem', { name: 'parentTargetText' }).click();

    // 普通关系区块应该显示正常
    await expect(
      page
        .getByLabel('block-item-CardItem-childTargetCollection-table')
        .getByText(childRecord.childAssociationField[0].childTargetText),
    ).toBeVisible();

    // 父表关系区块应该显示正常
    await expect(
      page
        .getByLabel('block-item-CardItem-parentTargetCollection-table')
        .getByText(childRecord.parentAssociationField[0].parentTargetText),
    ).toBeVisible();

    // 通过 Other records 创建一个表格区块
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'Other records right' }).waitFor({ state: 'detached' });
    await page.getByRole('menuitem', { name: 'Table right' }).hover();
    await page.getByRole('menuitem', { name: 'Other records right' }).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('schema-initializer-TableV2-table:configureColumns-users').hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Super Admin' })).toBeVisible();
  });

  test('verify assiciation block x-acl-action', async ({ page, mockPage, mockRecord }) => {
    function findNodeWithAclAction(obj) {
      if (obj && typeof obj === 'object') {
        if (obj['x-component'] === 'CardItem') {
          return obj['x-acl-action']; // 返回找到节点的 x-acl-action 值
        } else {
          for (const key in obj) {
            const found = findNodeWithAclAction(obj[key]);
            if (found) return found;
          }
        }
      }
      return null;
    }
    await mockPage(T4005).goto();
    await mockRecord('general');
    await page.getByLabel('block-item-CardItem-general-').click();
    await page.getByLabel('action-Action.Link-View-view-').first().click();
    //表格关系区块
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'Table right' }).click();
    await page.getByText('Associated records').hover();
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('uiSchemas:insertAdjacent')),
      page.getByRole('menuitem', { name: 'o2m' }).click(),
    ]);
    const postData = request.postDataJSON();
    // 调用函数查找符合条件的节点
    const aclValue = findNodeWithAclAction(postData);
    // 断言找到的节点的 x-acl-action 是否为预期值
    expect(aclValue).toBe('general.o2m:list');
  });
});
test.describe('configure actions', () => {
  test('filter & add new & delete & refresh', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTable).goto();

    // add buttons
    await page.getByLabel('schema-initializer-ActionBar-table:configureActions-t_unp4scqamw9').hover();
    await page.getByRole('menuitem', { name: 'Filter' }).click();
    await page.getByLabel('schema-initializer-ActionBar-table:configureActions-t_unp4scqamw9').hover();
    await page.getByRole('menuitem', { name: 'Add new' }).click();
    await page.getByLabel('schema-initializer-ActionBar-table:configureActions-t_unp4scqamw9').hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByLabel('schema-initializer-ActionBar-table:configureActions-t_unp4scqamw9').hover();
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
});

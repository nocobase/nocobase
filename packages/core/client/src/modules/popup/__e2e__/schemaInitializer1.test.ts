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
  oneDetailBlockWithM2oFieldToGeneral,
  oneEmptyTableBlockWithActions,
  oneEmptyTableBlockWithCustomizeActions,
  oneFormBlockWithRolesFieldBasedUsers,
  test,
} from '@nocobase/test/e2e';

test.describe('where to open a popup and what can be added to it', () => {
  test('add new', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTableBlockWithActions).goto();

    // open dialog
    await page.getByLabel('action-Action-Add new-create-general-table').click();

    // add a tab
    await page.getByLabel('schema-initializer-Tabs-').click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('test123');
    await page.getByLabel('action-Action-Submit-general').click();

    await expect(page.getByText('test123')).toBeVisible();

    // add blocks
    await page.getByLabel('schema-initializer-Grid-popup:addNew:addBlock-general').hover();
    await page.getByText('Markdown').click();
    await page.waitForTimeout(500);
    await page.getByLabel('schema-initializer-Grid-popup:addNew:addBlock-general').hover();
    await page.getByText('Form').hover();
    await page.getByRole('menuitem', { name: 'Current collection' }).click();

    await page.mouse.move(300, 0);

    await expect(page.getByLabel('block-item-CardItem-general-form')).toBeVisible();
    await expect(page.getByLabel('block-item-Markdown.Void-general-markdown')).toBeVisible();
  });

  test('add record', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTableBlockWithActions).goto();

    // open dialog
    await page.getByLabel('action-Action-Add record-customize:create-general-table').click();

    // add a tab
    await page.getByLabel('schema-initializer-Tabs-').click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('test7');
    await page.getByLabel('action-Action-Submit-general').click();

    await expect(page.getByText('test7')).toBeVisible();

    // add blocks
    await page.getByLabel('schema-initializer-Grid-popup:addRecord:addBlock-general').hover();
    await page.getByText('Form').hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();

    // add Markdown
    await page.getByLabel('schema-initializer-Grid-popup:addRecord:addBlock-general').hover();
    await page.getByRole('menuitem', { name: 'Markdown' }).click();

    await expect(page.getByLabel('block-item-CardItem-users-form')).toBeVisible();
    await expect(page.getByLabel('block-item-Markdown.Void-general-markdown')).toBeVisible();
  });

  test('view', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    // open dialog
    await page.getByLabel('action-Action.Link-View-view-general-table-0').click();

    // add a tab
    await page.getByLabel('schema-initializer-Tabs-').click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('test8');
    await page.getByLabel('action-Action-Submit-general').click();

    await expect(page.getByText('test8')).toBeVisible();

    // add blocks
    await addBlock(['Details right', 'Current record']);
    await addBlock(['Form (Edit)']);
    await addBlock(['Markdown']);

    await expect(page.getByLabel('block-item-CardItem-general-details')).toBeVisible();
    await expect(page.getByLabel('block-item-CardItem-general-form')).toBeVisible();
    await expect(page.getByLabel('block-item-Markdown.Void-')).toBeVisible();

    // 删除已创建的 blocks，腾出页面空间
    // delete details block
    await page.getByLabel('block-item-CardItem-general-details').hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:details-general').hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    // delete form block
    await page.getByLabel('block-item-CardItem-general-form').hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:editForm-general').hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    // delete markdown block
    await page.getByLabel('block-item-Markdown.Void-general-markdown').hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-Markdown.Void-blockSettings:markdown-general' })
      .hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // add relationship blocks
    await addBlock(['Details right', 'Associated records', 'Many to one']);
    await expect(page.getByLabel('block-item-CardItem-users-')).toBeVisible();
    await addBlock(['Table right', 'Associated records', 'One to many']);
    await expect(page.getByLabel('block-item-CardItem-users-table')).toBeVisible();

    async function addBlock(names: string[]) {
      await page.getByLabel('schema-initializer-Grid-popup').hover();
      await page.waitForTimeout(500);
      for (let i = 0; i < names.length - 1; i++) {
        const name = names[i];
        await page.getByRole('menuitem', { name }).hover();
        await page.waitForTimeout(500);
      }
      await expect(page.getByRole('menuitem', { name: names[names.length - 1] })).toHaveCount(1);
      await page.getByRole('menuitem', { name: names[names.length - 1] }).click();
      await page.mouse.move(300, 0);
    }
  });

  test('bulk edit', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTableBlockWithCustomizeActions).goto();

    // open dialog
    await page.getByLabel('action-Action-Bulk edit-customize:bulkEdit-general-table').click();
    await page.getByLabel('schema-initializer-Tabs-').click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('test1');
    await page.getByLabel('action-Action-Submit-general').click();

    await expect(page.getByText('test1')).toBeVisible();

    // add blocks
    await page.getByLabel('schema-initializer-Grid-popup:bulkEdit:addBlock-general').hover();
    await page.getByText('Form').click();
    await page.mouse.move(300, 0);
    await page.getByLabel('schema-initializer-Grid-popup:bulkEdit:addBlock-general').hover();
    await page.getByRole('menuitem', { name: 'Markdown' }).click();
    await page.mouse.move(300, 0);

    await expect(page.getByLabel('block-item-CardItem-general-form')).toBeVisible();
    await expect(page.getByLabel('block-item-Markdown.Void-general-markdown')).toBeVisible();
  });

  test('association link', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneDetailBlockWithM2oFieldToGeneral).waitForInit();
    const record = await mockRecord('targetToGeneral');
    await nocoPage.goto();

    // open dialog
    await page
      .getByLabel('block-item-CollectionField-targetToGeneral-details-targetToGeneral.toGeneral-toGeneral')
      .getByText(record.id, { exact: true })
      .click();

    // add a tab
    await page.getByLabel('schema-initializer-Tabs-').click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('test8');
    await page.getByLabel('action-Action-Submit-general').click();

    await expect(page.getByText('test8')).toBeVisible();

    // add blocks
    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-general').hover();
    await page.getByRole('menuitem', { name: 'Details' }).hover();
    await page.getByRole('menuitem', { name: 'Current record' }).click();
    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-general').hover();
    await page.getByRole('menuitem', { name: 'Form (Edit)' }).first().click();
    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-general').hover();
    await page.getByRole('menuitem', { name: 'Markdown' }).click();
    await page.mouse.move(300, 0);

    await expect(page.getByLabel('block-item-CardItem-general-details')).toBeVisible();
    await expect(page.getByLabel('block-item-CardItem-general-form')).toBeVisible();
    await expect(page.getByLabel('block-item-Markdown.Void-')).toBeVisible();

    // add relationship blocks
    // 下拉列表中，可选择以下区块进行创建
    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-general').hover();
    await expect(page.getByRole('menuitem', { name: 'Details right' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Form (Edit)' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Form (Add new) right' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Form (Add new) right' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Table right' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'List right' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Grid Card right' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Calendar' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Gantt' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Kanban' })).toBeVisible();

    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-general').hover();
    await page.getByRole('menuitem', { name: 'Details' }).hover();
    await page.getByRole('menuitem', { name: 'Associated records' }).last().hover();
    await page.getByRole('menuitem', { name: 'Many to one' }).click();
    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CardItem-users-')).toBeVisible();

    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-general').hover();
    await page.getByRole('menuitem', { name: 'Table right' }).click();
    await expect(page.getByRole('menuitem', { name: 'Associated records' })).toHaveCount(1);
    await page.getByRole('menuitem', { name: 'Associated records' }).hover();
    await page.getByRole('menuitem', { name: 'One to many' }).click();
    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CardItem-users-table')).toBeVisible();
    // 屏幕上没有显示错误提示
    await expect(page.locator('.ant-notification-notice').first()).toBeHidden({ timeout: 1000 });
  });

  test('association link after reload page', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneDetailBlockWithM2oFieldToGeneral).waitForInit();
    const record = await mockRecord('targetToGeneral');
    await nocoPage.goto();

    // open dialog
    await page
      .getByLabel('block-item-CollectionField-targetToGeneral-details-targetToGeneral.toGeneral-toGeneral')
      .getByText(record.id, { exact: true })
      .click();

    await page.reload();

    // add a tab
    await page.getByLabel('schema-initializer-Tabs-').click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('test8');
    await page.getByLabel('action-Action-Submit-general').click();

    await expect(page.getByText('test8')).toBeVisible();

    // add blocks
    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-general').hover();
    await page.getByRole('menuitem', { name: 'Details' }).hover();
    await page.getByRole('menuitem', { name: 'Current record' }).click();
    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-general').hover();
    await page.getByRole('menuitem', { name: 'Form (Edit)' }).first().click();
    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-general').hover();
    await page.getByRole('menuitem', { name: 'Markdown' }).click();
    await page.mouse.move(300, 0);

    await expect(page.getByLabel('block-item-CardItem-general-details')).toBeVisible();
    await expect(page.getByLabel('block-item-CardItem-general-form')).toBeVisible();
    await expect(page.getByLabel('block-item-Markdown.Void-')).toBeVisible();

    // add relationship blocks
    // 下拉列表中，可选择以下区块进行创建
    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-general').hover();
    await expect(page.getByRole('menuitem', { name: 'Details right' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Form (Edit)' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Form (Add new) right' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Form (Add new) right' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Table right' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'List right' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Grid Card right' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Calendar' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Gantt' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Kanban' })).toBeVisible();

    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-general').hover();
    await page.getByRole('menuitem', { name: 'Details' }).hover();
    await page.getByRole('menuitem', { name: 'Associated records' }).last().hover();
    await page.getByRole('menuitem', { name: 'Many to one' }).click();
    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CardItem-users-')).toBeVisible();

    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-general').hover();
    await page.getByRole('menuitem', { name: 'Table right' }).click();
    await expect(page.getByRole('menuitem', { name: 'Associated records' })).toHaveCount(1);
    await page.getByRole('menuitem', { name: 'Associated records' }).hover();
    await page.getByRole('menuitem', { name: 'One to many' }).click();
    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CardItem-users-table')).toBeVisible();
    // 屏幕上没有显示错误提示
    await expect(page.locator('.ant-notification-notice').first()).toBeHidden({ timeout: 1000 });
  });

  test('data picker', async ({ page, mockPage }) => {
    await mockPage(oneFormBlockWithRolesFieldBasedUsers).goto();

    // open dialog
    await page.getByTestId('select-data-picker').click();

    // add blocks
    await addBlock('form Table');
    await addBlock('form Form');
    await addBlock('Collapse');
    await addBlock('Markdown');

    await expect(page.getByLabel('block-item-CardItem-roles-table-selector')).toBeVisible();
    await expect(page.getByLabel('block-item-CardItem-roles-filter-form')).toBeVisible();
    await expect(page.getByLabel('block-item-CardItem-roles-filter-collapse')).toBeVisible();
    await expect(page.getByLabel('block-item-Markdown.Void-')).toBeVisible();

    async function addBlock(name: string) {
      await page.getByLabel('schema-initializer-Grid-popup:tableSelector:addBlock-roles').hover();
      await page.getByRole('menuitem', { name }).click();
      await page.mouse.move(300, 0);
    }
  });
});

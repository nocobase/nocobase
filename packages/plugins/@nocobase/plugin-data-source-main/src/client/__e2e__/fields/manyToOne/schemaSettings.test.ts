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
  expectSettingsMenu,
  oneFilterFormBlockWithAllAssociationFields,
  oneFilterFormBlockWithAllAssociationFieldsV1333Beta,
  oneTableBlockWithAddNewAndViewAndEditAndAssociationFields,
  test,
} from '@nocobase/test/e2e';
import { createColumnItem, showSettingsMenu } from '../../utils';
import { T3377 } from './templatesOfBug';

test.describe('form item & filter form', () => {
  test('supported options', async ({ page, mockPage }) => {
    const nocoPage = await mockPage(oneFilterFormBlockWithAllAssociationFields).waitForInit();
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('block-item-CollectionField-general-filter-form-general.manyToOne-manyToOne').hover();
        // hover 方法有时会失效，所以这里使用 click 方法。原因未知
        await page.getByRole('button', { name: 'designer-schema-settings-CollectionField' }).click();
      },
      supportedOptions: [
        'Edit field title',
        'Edit description',
        'Set the data scope',
        'Field component',
        'Title field',
        'Delete',
      ],
    });
  });

  test('v1.3: supported options', async ({ page, mockPage }) => {
    const nocoPage = await mockPage(oneFilterFormBlockWithAllAssociationFieldsV1333Beta).waitForInit();
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('block-item-CollectionField-general-filter-form-general.manyToOne-manyToOne').hover();
        // hover 方法有时会失效，所以这里使用 click 方法。原因未知
        await page.getByRole('button', { name: 'designer-schema-settings-CollectionField' }).click();
      },
      supportedOptions: [
        'Edit field title',
        'Edit description',
        'Set the data scope',
        'Field component',
        'Title field',
        'Delete',
        'Allow multiple selection',
      ],
    });
  });
});

test.describe('table column & table', () => {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await createColumnItem(page, 'manyToOne');
        await showSettingsMenu(page, 'manyToOne');
      },
      supportedOptions: [
        'Custom column title',
        'Column width',
        'Enable link',
        'Title field',
        'Field component',
        'Delete',
      ],
    });
  });

  test('enable link', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).waitForInit();
    const record = await mockRecord('general');
    await nocoPage.goto();

    await createColumnItem(page, 'manyToOne');
    await showSettingsMenu(page, 'manyToOne');

    // 默认开启 enable link
    await expect(page.getByRole('menuitem', { name: 'Enable link' }).getByRole('switch')).toBeChecked();
    await expect(page.locator('a').filter({ has: page.getByText(record.manyToOne.id, { exact: true }) })).toBeVisible();

    // 关闭 enable link
    await page.getByRole('menuitem', { name: 'Enable link' }).click();
    await expect(page.getByRole('menuitem', { name: 'Enable link' }).getByRole('switch')).not.toBeChecked();
    await expect(page.locator('a').filter({ has: page.getByText(record.manyToOne.id, { exact: true }) })).toBeHidden();

    // 再次开启
    await page.getByRole('menuitem', { name: 'Enable link' }).click();
    await expect(page.getByRole('menuitem', { name: 'Enable link' }).getByRole('switch')).toBeChecked();
    await expect(page.locator('a').filter({ has: page.getByText(record.manyToOne.id, { exact: true }) })).toBeVisible();
  });

  test('title field', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).waitForInit();
    const record = await mockRecord('general');
    await nocoPage.goto();

    await createColumnItem(page, 'manyToOne');
    await showSettingsMenu(page, 'manyToOne');

    // 默认是 ID
    await expect(page.getByRole('menuitem', { name: 'Title field' })).toHaveText('Title fieldID');
    await expect(page.getByRole('cell', { name: record.manyToOne.id, exact: true })).toBeVisible();

    // 修改为 nickname
    await page.getByRole('menuitem', { name: 'Title field' }).click();
    await page.getByRole('option', { name: 'Nickname' }).click();
    await page.mouse.move(300, 0);
    await expect(page.getByRole('cell', { name: record.manyToOne.nickname, exact: true })).toBeVisible();
  });

  test('field component', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).waitForInit();
    const record = await mockRecord('general');
    await nocoPage.goto();

    await createColumnItem(page, 'manyToOne');
    await showSettingsMenu(page, 'manyToOne');

    // 默认是 Title
    await expect(page.getByRole('menuitem', { name: 'Field component' })).toHaveText('Field componentTitle');

    // 修改为 Tag
    await page.getByRole('menuitem', { name: 'Field component' }).click();
    await page.getByRole('option', { name: 'Tag' }).click();
    // 修改成功之后会显示 Tag color field 选项
    await expect(page.getByRole('menuitem', { name: 'Tag color field' })).toBeVisible();
    await expect(
      page.getByRole('cell', { name: record.manyToOne.id, exact: true }).filter({ has: page.locator('.ant-tag') }),
    ).toBeVisible();
  });
});

test.describe('table column & sub-table', () => {
  test('title field', async ({ page, mockPage }) => {
    await mockPage(T3377).goto();

    await page.locator('.nb-sub-table-addNew').click();
    await page.getByTestId('select-object-multiple').click();

    // 下拉列表中应该有值
    await expect(page.getByRole('option', { name: 'admin', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'member', exact: true })).toBeVisible();

    // 1. 切换 title field
    await page.getByRole('button', { name: 'Roles', exact: true }).hover();
    await page.getByLabel('designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-users').hover();
    await page.getByRole('menuitem', { name: 'Title field Role UID' }).click();
    await page.getByRole('option', { name: 'Role name' }).click();

    // 2. 下拉列表的值会改变
    await page.getByTestId('select-object-multiple').click();
    await expect(page.getByRole('option', { name: 'Admin', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Member', exact: true })).toBeVisible();
  });
});

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
  oneTableBlockWithAddNewAndViewAndEditAndBasicFields,
  test,
} from '@nocobase/test/e2e';
import { createColumnItem, showSettingsMenu } from '../../utils';

test.describe('table column & table', () => {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await createColumnItem(page, 'singleLineText');
        await showSettingsMenu(page, 'singleLineText');
      },
      supportedOptions: ['Custom column title', 'Column width', 'Sortable', 'Delete'],
    });
  });

  test('custom column title', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecords('general');
    await nocoPage.goto();

    await createColumnItem(page, 'singleLineText');
    await showSettingsMenu(page, 'singleLineText');
    await page.getByRole('menuitem', { name: 'Custom column title' }).click();

    // 显示出原字段名称
    await expect(page.getByRole('dialog').getByText('Original field title: singleLineText')).toBeVisible();
    // 输入新字段名称
    await page.getByLabel('block-item-Input-general-').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-general-').getByRole('textbox').fill('new column title');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 新名称应该显示出来
    await expect(page.getByRole('button', { name: 'new column title', exact: true })).toBeVisible();
  });

  test('column width', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecords('general');
    await nocoPage.goto();

    await createColumnItem(page, 'singleLineText');
    await showSettingsMenu(page, 'singleLineText');
    await page.getByRole('menuitem', { name: 'Column width' }).click();
    await page.getByRole('dialog').getByRole('spinbutton').click();
    await page.getByRole('dialog').getByRole('spinbutton').fill('600');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    const columnHeadSize = await page.getByRole('columnheader', { name: 'singleLineText' }).boundingBox();
    expect(Math.floor(columnHeadSize.width)).toBe(600);
  });

  test('sortable', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecords('general', [{ singleLineText: 'a' }, { singleLineText: 'b' }]);
    await nocoPage.goto();

    await createColumnItem(page, 'singleLineText');
    await showSettingsMenu(page, 'singleLineText');

    // 默认不可排序
    await expect(page.getByRole('menuitem', { name: 'Sortable' }).getByRole('switch')).not.toBeChecked();

    // 开启排序
    await page.getByRole('menuitem', { name: 'Sortable' }).click();

    // FIXME: 表格样式在开启排序后出现问题，需要刷新页面才能恢复正常
    await page.reload();

    // TODO: 此处菜单在点击后不应该消失
    // await expect(page.getByRole('menuitem', { name: 'Sortable' }).getByRole('switch')).toBeChecked();
    // 鼠标 hover 时，有提示
    await page.getByRole('columnheader', { name: 'singleLineText' }).hover();
    await expect(page.getByRole('tooltip', { name: 'Click to sort ascending' })).toBeVisible();

    // 点击第一下，升序
    await page.getByRole('columnheader', { name: 'singleLineText' }).click();
    let sizeA = await page.getByRole('cell', { name: 'a', exact: true }).boundingBox();
    let sizeB = await page.getByRole('cell', { name: 'b', exact: true }).boundingBox();
    expect(sizeA.y).toBeLessThan(sizeB.y);

    // 点击第二下，降序
    await page.getByRole('columnheader', { name: 'singleLineText' }).click();
    sizeA = await page.getByRole('cell', { name: 'a', exact: true }).boundingBox();
    sizeB = await page.getByRole('cell', { name: 'b', exact: true }).boundingBox();
    expect(sizeA.y).toBeGreaterThan(sizeB.y);
  });

  test('delete', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecords('general');
    await nocoPage.goto();

    await createColumnItem(page, 'singleLineText');
    await showSettingsMenu(page, 'singleLineText');
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByRole('columnheader', { name: 'singleLineText' })).toBeHidden();
  });
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { oneEmptyTableBlockWithCustomizeActions } from './utils';

test.describe('bulk edit action setting', () => {
  test('data will be updated && edit form configure', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneEmptyTableBlockWithCustomizeActions).waitForInit();
    await mockRecords('general', 3);
    await nocoPage.goto();
    await page.getByLabel('Bulk edit').hover();
    await page.getByLabel('designer-schema-settings-Action-Action.Designer-general').hover();
    //默认是选中的数据
    await expect(page.getByTitle('Data will be updated').getByText('Selected')).toBeVisible();
    await page.getByRole('menuitem', { name: 'Data will be updated' }).click();
    //切换为全部数据
    await page.getByRole('option', { name: 'Entire collection' }).click();
    //配置更新规则
    await page.getByLabel('Bulk edit').click();
    await page.getByLabel('schema-initializer-Grid-popup:bulkEdit:addBlock-general').hover();
    await page.getByRole('menuitem', { name: 'form Form' }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('schema-initializer-Grid-bulkEditForm:configureFields-general').hover();
    await page.getByRole('menuitem', { name: 'Single line text' }).click();
    await page.getByRole('menuitem', { name: 'Start date time' }).click();
    await page.getByRole('menuitem', { name: 'Percent' }).click();
    await page.getByLabel('block-item-BulkEditField-general-form-general.singleLineText').click();
    await page.getByText('Clear').click();
    await page.getByLabel('block-item-BulkEditField-general-form-general.startDatetime').click();
    await page.getByRole('option', { name: 'Remains the same' }).locator('div').last().click();
    await page.getByLabel('block-item-BulkEditField-general-form-general.percent').click();
    await expect(page.getByRole('option', { name: 'Changed to' }).locator('div')).toHaveCount(1);
    await page.getByRole('option', { name: 'Changed to' }).locator('div').click();
    await page.getByRole('spinbutton').click();
    await page.getByRole('spinbutton').fill('0');
    await page.getByLabel('schema-initializer-ActionBar-bulkEditForm:configureActions-general').click();
    await page.getByRole('menuitem', { name: 'Submit' }).click();
    //更新提交的数据符合预期
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('api/general:update')),
      page.getByLabel('action-Action-Submit-submit-general-form').click(),
    ]);
    const postData = request.postDataJSON();
    //更新的数据符合预期
    expect(postData.singleLineText).toEqual(null);
    expect(postData.percent).toEqual(0);
  });
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { differentURL_DifferentPopupContent } from './templatesOfBug';

test.describe('popup opened by clicking the association field', async () => {
  test('different URL, different popup content', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(differentURL_DifferentPopupContent).waitForInit();
    await mockRecord('users', { roles: [{ name: 'test', title: 'Test' }] });
    await nocoPage.goto();

    await page.getByText('admin').click();
    await expect(page.getByLabel('block-item-CollectionField-')).toHaveText('Role name:Admin');
    const prevURL = page.url();
    await page.goBack();

    await page.getByText('test').click();
    await expect(page.getByLabel('block-item-CollectionField-')).toHaveText('Role name:Test');

    // 通过 URL 打开第一行的弹窗，弹窗中的内容应该是第一行的内容
    await page.goto(prevURL);
    await expect(page.getByLabel('block-item-CollectionField-')).toHaveText('Role name:Admin');
  });
});

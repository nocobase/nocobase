/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { oneDetailBlockFieldWidthFieldStyle } from './templates';

test.describe('field style linkage rule', () => {
  test('field style  support Color、Background Color、Text Align、Font Size、Font Weight、Font Style', async ({
    page,
    mockPage,
  }) => {
    await mockPage(oneDetailBlockFieldWidthFieldStyle).goto();
    await page.getByLabel('block-item-CardItem-users-').hover();
    await page.getByLabel('block-item-CollectionField-users-details-users.nickname-Nickname').hover();
    await page
      .getByLabel('designer-schema-settings-CollectionField-fieldSettings:FormItem-users-users.nickname', {
        exact: true,
      })
      .hover();
    await page.getByText('Style').click();
    await page.getByRole('button', { name: 'plus Add linkage rule' }).click();
    await page.getByText('Add property').click();
    await page.locator('div').filter({ hasText: 'Style Linkage' }).nth(2).click();
    await page.getByTestId('select-linkage-properties').click();
    await expect(page.getByText('Color', { exact: true })).toBeVisible();
    await expect(page.getByText('Background Color')).toBeVisible();
    await expect(page.getByText('Text Align')).toBeVisible();
    await expect(page.getByText('Font Size（px）')).toBeVisible();
    await expect(page.getByText('Font Weight')).toBeVisible();
    await expect(page.getByText('Font Style')).toBeVisible();
    // 配置字段样式
    await page.getByText('Font Size（px）').click();

    await page.getByPlaceholder('Valid range: 10-').click();
    await page.getByPlaceholder('Valid range: 10-').fill('40');
    await page.getByRole('button', { name: 'OK' }).click();
    // 获取元素并断言其 font-size 为 40px
    const fontSize = await page
      .locator('.ant-formily-item-control-content-component')
      .first()
      .evaluate((element) => {
        return window.getComputedStyle(element).fontSize;
      });

    // 断言 font-size 是 40px
    expect(fontSize).toBe('40px');
  });
});

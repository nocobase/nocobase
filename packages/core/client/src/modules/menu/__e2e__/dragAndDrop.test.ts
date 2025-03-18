/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';

test('single page', async ({ page, mockPage }) => {
  const pageTitle1 = 'page1';
  const pageTitle2 = 'page2';
  await mockPage({
    name: pageTitle1,
  }).goto();
  await mockPage({ name: pageTitle2 }).goto();
  await page.getByRole('menu').getByText(pageTitle1).click();
  await page.getByRole('menu').getByText(pageTitle1).hover();
  await page.getByRole('button', { name: 'designer-schema-settings-' }).hover();
  await page.getByRole('menuitem', { name: 'Move to' }).click();
  await page.getByLabel('block-item-TreeSelect-Target').locator('.ant-select').click();
  await page.locator('.ant-select-dropdown').getByText(pageTitle2).click();
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await page.waitForTimeout(500);
  const page1 = await page.getByRole('menu').getByText(pageTitle1).boundingBox();
  const page2 = await page.getByRole('menu').getByText(pageTitle2).boundingBox();
  //拖拽菜单排序符合预期
  expect(page2.x).toBeLessThan(page1.x);
});

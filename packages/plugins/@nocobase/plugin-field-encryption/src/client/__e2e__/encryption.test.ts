/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { test, expect } from '@nocobase/test/e2e';

import { pageConfig } from './utils';
test('encryption', async ({ page, mockPage }) => {
  const nocoPage = await mockPage(pageConfig).waitForInit();
  await nocoPage.goto();

  // 创建关联表的一条数据
  await expect(page.getByText('Encryption-Hidden')).toBeVisible();
  await page.getByLabel('block-item-CardItem-test2-form').getByRole('textbox').fill('test2-1');
  await page.getByLabel('action-Action-Test2 Submit-').click();

  // 创建主表的 2 条数据
  await page
    .getByLabel('block-item-CollectionField-test1-form-test1.test1_field1-Encryption')
    .getByRole('textbox')
    .fill('test1-1-Encryption');
  await page
    .getByLabel('block-item-CollectionField-test1-form-test1.test1_field2-Encryption-Hidden')
    .getByRole('textbox')
    .fill('test1-1-Encryption-Hidden');
  await page.getByTestId('select-object-single').click();
  await page.getByRole('option', { name: '1' }).click(); // 选择关联表的数据
  await page.getByLabel('action-Action-Submit-submit-').click();
  await expect(page.getByRole('button', { name: 'test1-1-Encryption' })).not.toBeVisible();

  await page
    .getByLabel('block-item-CollectionField-test1-form-test1.test1_field1-Encryption')
    .getByRole('textbox')
    .fill('test1-2-Encryption');
  await page
    .getByLabel('block-item-CollectionField-test1-form-test1.test1_field2-Encryption-Hidden')
    .getByRole('textbox')
    .fill('test1-2-Encryption-Hidden');
  await page.getByLabel('action-Action-Submit-submit-').click();

  // 断言主表的数据
  await page.reload();
  await expect(page.getByRole('button', { name: 'test1-1-Encryption' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'test1-1-Encryption-Hidden' })).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'test1-2-Encryption' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'test1-2-Encryption-Hidden' })).not.toBeVisible();

  // 筛选

  // 筛选 Encryption 字段
  await page.getByLabel('action-Filter.Action-Filter-').click();
  await page.getByText('Add condition', { exact: true }).click();
  await page.getByTestId('select-filter-field').click();
  await page.getByRole('menuitemcheckbox', { name: 'Encryption', exact: true }).click();
  await page
    .getByRole('tooltip', { name: 'Meet All   conditions in the' })
    .getByRole('textbox')
    .fill('test1-1-Encryption');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.getByRole('button', { name: 'test1-1-Encryption' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'test1-2-Encryption' })).not.toBeVisible();

  // 筛选 Hidden 字段
  await page.getByLabel('action-Filter.Action-1 filter').click();
  await page.getByTestId('select-filter-field').click();
  await page.getByRole('menuitemcheckbox', { name: 'Encryption-Hidden', exact: true }).click();
  await page
    .getByRole('tooltip', { name: 'Meet All   conditions in the' })
    .getByRole('textbox')
    .fill('test1-1-Encryption-Hidden');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.getByRole('button', { name: 'test1-1-Encryption' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'test1-2-Encryption' })).not.toBeVisible();

  // 关联筛选
  await page.getByLabel('action-Filter.Action-1 filter').click();
  await page.getByTestId('select-filter-field').click();
  await page.getByRole('menuitemcheckbox', { name: 'One to One right' }).click();
  await page.getByRole('menuitemcheckbox', { name: 'test2-Encryption' }).click();
  await page.getByRole('tooltip', { name: 'Meet All   conditions in the' }).getByRole('textbox').fill('test2-1');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.getByRole('button', { name: 'test1-1-Encryption' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'test1-2-Encryption' })).not.toBeVisible();
});

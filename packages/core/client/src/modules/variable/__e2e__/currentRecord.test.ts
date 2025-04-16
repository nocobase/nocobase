/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { test } from '@nocobase/test/e2e';
import { currentRecordShouldBeConsistentWithCurrentFormFieldValues } from './templates';

test.describe('variable: Current Record', () => {
  test('Current record should be consistent with current form field values', async ({ mockPage, page }) => {
    await mockPage(currentRecordShouldBeConsistentWithCurrentFormFieldValues).goto();

    // 1. 子表单联动规则中的“当前记录”应该指的是整个表单的值
    await page.getByLabel('block-item-CollectionField-users-form-users.roles-Roles').hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-CollectionField-fieldSettings:FormItem-users-users.' })
      .click();
    await page.getByRole('menuitem', { name: 'Linkage rules' }).click();
    await page.getByRole('button', { name: 'plus Add linkage rule' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByLabel('variable-button').first().click();

    // 当前表单中应该包含 “Nickname” 字段
    await page.getByRole('menuitemcheckbox', { name: 'Current form right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Nickname' }).click();

    // 当前对象中应该包含 “Role UID” 字段
    await page.getByLabel('variable-button').first().click();
    await page.getByText('Current object').click();
    await page.getByRole('menuitemcheckbox', { name: 'Current object right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Role UID' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();

    // 2. 子详情联动规则中的“当前记录”应该指的是整个详情的值
    await page.getByLabel('block-item-CollectionField-users-details-users.roles-Roles').hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-CollectionField-fieldSettings:FormItem-users-users.' })
      .hover();
    await page.getByRole('menuitem', { name: 'Linkage rules' }).click();
    await page.getByRole('button', { name: 'plus Add linkage rule' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByLabel('variable-button').first().click();

    // 当前记录中应该包含 “Nickname” 字段
    await page.getByRole('menuitemcheckbox', { name: 'Current record right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Nickname' }).click();
    await page.getByLabel('variable-button').first().click();

    // 当前对象中应该包含 “Role UID” 字段
    await page.getByRole('menuitemcheckbox', { name: 'Current object right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Role UID' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
  });
});

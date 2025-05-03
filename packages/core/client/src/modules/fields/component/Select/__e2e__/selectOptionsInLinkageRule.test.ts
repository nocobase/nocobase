/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { oneFormWithSelectField } from './templatesOfBug';

test.describe('options of  Select field in linkage rule', () => {
  test('options change with linkage rule ', async ({ page, mockPage }) => {
    await mockPage(oneFormWithSelectField).goto();
    // 联动规则控制选项
    await page.getByLabel('block-item-CardItem-general-').hover();
    await page.getByLabel('block-item-CollectionField-').click();
    await expect(page.getByRole('option', { name: 'option2' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'option3' })).not.toBeVisible();
    await page.getByRole('option', { name: 'option2' }).click();

    // 去掉联动规则恢复选项
    await page.getByLabel('block-item-CardItem-general-').hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:createForm-general').hover();
    await page.getByRole('menuitem', { name: 'Field linkage rules' }).click();
    await page.getByRole('switch', { name: 'On Off' }).click();
    await page.getByRole('button', { name: 'OK' }).click();
    await page.reload();
    await page.getByLabel('block-item-CollectionField-').click();
    await expect(page.getByRole('option', { name: 'option2' }).last()).toBeVisible();
    await expect(page.getByRole('option', { name: 'option3' })).toBeVisible();
  });
});

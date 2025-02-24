/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { accessControlActionWithTable } from './template';

test.describe('Access control', () => {
  test('popup、link、custom request support access control', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(accessControlActionWithTable).waitForInit();
    await nocoPage.goto();
    await page.getByLabel('block-item-CardItem-users-').hover();
    //popup
    await page.getByLabel('action-Action-Popup-customize').hover();
    await page.getByLabel('designer-schema-settings-Action-actionSettings:popup-users').hover();
    await expect(page.getByRole('menuitem', { name: 'Access control' })).toBeVisible();
    await page.getByLabel('designer-schema-settings-Action-actionSettings:popup-users').hover();
    await page.mouse.move(300, 0);

    //link
    await page.getByLabel('action-Action-Link-customize:').hover();

    await page.getByLabel('designer-schema-settings-Action-actionSettings:link-users').hover();
    await expect(page.getByRole('menuitem', { name: 'Access control' })).toBeVisible();
    await page.mouse.move(300, 0);

    // custom request
    await page.getByLabel('action-CustomRequestAction-').hover();
    await page.getByLabel('designer-schema-settings-CustomRequestAction-actionSettings:customRequest-users').hover();
    await expect(page.getByRole('menuitem', { name: 'Access control' })).toBeVisible();
    await page.mouse.move(300, 0);
  });
});

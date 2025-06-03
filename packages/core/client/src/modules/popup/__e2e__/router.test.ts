/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { shouldBackAfterClickBackButton } from './templatesOfBug';

test.describe('popup router', () => {
  test('should work opened by URL', async ({ page, mockPage }) => {
    const nocoPage = await mockPage({
      keepUid: true,
      ...shouldBackAfterClickBackButton,
    }).waitForInit();
    const url = await nocoPage.getUrl();

    // Directly navigate to the subpage, then click the back button to check if it can return to the parent page
    await page.goto(
      url +
        '/popups/56tsj7l3k35/filterbytk/1/popups/bd3nizznkdw/filterbytk/member/sourceid/1/popups/1ct9qd9jlbm/filterbytk/member/sourceid/1',
    );

    // close the sub page
    await page.getByLabel('back-button').click();

    // open the sub page again then close it
    await page.getByLabel('action-Action-Edit-update-roles-details-member').click();
    await page.getByLabel('back-button').click();

    // close the drawer
    await page.getByLabel('drawer-Action.Container-roles-View record-mask').click();
    await page.locator('.ant-drawer-mask').click();

    // expect to be back to the first page
    await page.getByText('单层子页面').hover();
    await expect(
      page.getByRole('button', { name: 'designer-schema-settings-CardItem-blockSettings:table-users' }),
    ).toBeVisible();

    // the same steps again by manual click -------------------------------------------------------------
    // first open the sub page
    await page.getByLabel('action-Action.Link-View-view-').nth(2).click();
    await page.getByLabel('action-Action.Link-View-view-roles-table-member').click();
    await page.getByLabel('action-Action-Edit-update-').click();

    // the same steps with above
    // close the sub page
    await page.getByLabel('back-button').click();

    // open the sub page again then close it
    await page.getByLabel('action-Action-Edit-update-roles-details-member').click();
    await page.getByLabel('back-button').click();

    // close the drawer
    await page.getByLabel('drawer-Action.Container-roles-View record-mask').click();
    await page.locator('.ant-drawer-mask').click();

    // expect to be back to the first page
    await page.getByText('单层子页面').hover();
    await expect(
      page.getByRole('button', { name: 'designer-schema-settings-CardItem-blockSettings:table-users' }),
    ).toBeVisible();
  });
});

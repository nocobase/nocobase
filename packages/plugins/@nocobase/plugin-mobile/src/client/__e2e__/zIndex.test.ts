/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { modalOfAssignFieldValuesAndModalOfBindWorkflows, shouldDisplayImageNormally } from './templates';

test.describe('zIndex', () => {
  test('should display image normally', async ({ page, mockMobilePage, mockRecord }) => {
    const nocoPage = await mockMobilePage(shouldDisplayImageNormally).waitForInit();
    const record = await mockRecord('image');
    await nocoPage.goto();

    const title = record.attachment[0].title;

    // 通过鼠标 hover 到 Add block 按钮来检查是否符合预期
    const check = async (level: number) => {
      try {
        switch (level) {
          case 0:
            await page.getByLabel('schema-initializer-Grid-').hover({ timeout: 300 });
            break;
          case 1:
            await page.getByLabel('schema-initializer-Grid-popup').hover({ timeout: 300 });
            break;
          case 2:
            await page.getByLabel('schema-initializer-Grid-popup').nth(1).hover({ timeout: 300 });
            break;
          case 3:
            await page.getByLabel('schema-initializer-Grid-popup').nth(2).hover({ timeout: 300 });
            break;
        }
      } catch (e) {
        return;
      }
      await page.waitForTimeout(300);
      await expect(page.getByText('Desktop data blocks')).not.toBeVisible();
    };

    // 1. 在主页面，点击图片预览，图片不能被主页面盖住
    await page.getByRole('link', { name: title }).click();
    await page.waitForTimeout(300);
    await check(0);
    await page.getByLabel('Close lightbox').click();

    // 2. 进入第一层子页面，然后点击图片预览， 图片不能被子页面盖住
    await page.getByLabel('action-Action.Link-View-view-').click();
    await page.getByRole('link', { name: title }).nth(1).click();
    await page.waitForTimeout(300);
    await check(1);
    await page.getByLabel('Close lightbox').click();

    // 3. 进入第二层子页面，然后点击图片预览， 图片不能被子页面盖住
    await page.getByLabel('action-Action-Edit-update-').click({
      position: {
        x: 5,
        y: 5,
      },
    });
    await page.getByRole('link', { name: title }).nth(2).click();
    await page.waitForTimeout(300);
    await check(2);
    await page.getByLabel('Close lightbox').click();

    // 4. 进入第三层子页面，然后点击图片预览， 图片不能被子页面盖住
    await page
      .getByLabel('action-Action-Edit-update-')
      .nth(2)
      .click({
        position: {
          x: 5,
          y: 5,
        },
      });
    await page.getByRole('link', { name: title }).nth(3).click();
    await page.waitForTimeout(300);
    await check(3);
    await page.getByLabel('Close lightbox').click();
  });

  test('modal of Assign field values and modal of Bind workflows', async ({ page, mockMobilePage, mockRecord }) => {
    await mockMobilePage(modalOfAssignFieldValuesAndModalOfBindWorkflows).goto();

    // 1. 打开 Assign field values 的弹窗
    await page.getByTestId('select-data-picker').click();
    await page.getByLabel('action-Action-Add new-create-').click();
    await page.getByLabel('block-item-CardItem-roles-form').getByLabel('action-Action-Submit-submit-').hover();
    await page.getByLabel('designer-schema-settings-Action-actionSettings:createSubmit-roles').hover();
    await page.getByRole('menuitem', { name: 'Assign field values' }).click();

    // 2. 检测弹窗是否被覆盖
    await page.getByRole('button', { name: 'Cancel' }).hover({ timeout: 300, position: { x: 5, y: 5 } });
    // 3. 关闭弹窗
    await page.getByLabel('Close', { exact: true }).click();

    // -----------------------------------------------------------------------------------------------------

    // 1. 打开 Bind workflows 弹窗
    await page.getByLabel('block-item-CardItem-roles-form').getByLabel('action-Action-Submit-submit-').hover();
    await page.getByLabel('designer-schema-settings-Action-actionSettings:createSubmit-roles').hover();
    await page.getByRole('menuitem', { name: 'Bind workflows' }).click();

    // 2. 检测弹窗是否被覆盖
    await page
      .getByLabel('Bind workflows')
      .getByRole('button', { name: 'Cancel' })
      .hover({ timeout: 300, position: { x: 5, y: 5 } });

    // 3. 关闭弹窗
    await page.getByLabel('Bind workflows').getByLabel('Close', { exact: true }).click();
  });
});

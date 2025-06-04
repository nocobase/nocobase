/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';

test.describe('PageHeader', () => {
  test.describe('PageHeader', () => {
    test('Display page header', async ({ page, mockMobilePage }) => {
      const nocoPage = mockMobilePage();
      await nocoPage.goto();

      // 默认有 header
      await page.getByLabel('block-item-MobilePageProvider').click();
      await expect(page.getByTestId('mobile-page-header')).toBeVisible();
      await expect(page.getByTestId('mobile-page-header')).toContainText(nocoPage.getTitle());

      await page.getByLabel('block-item-MobilePageProvider').click();
      await page.getByLabel('designer-schema-settings-MobilePageProvider-mobile:page').click();

      // 四个选项都显示
      await expect(page.getByRole('menuitem', { name: 'Display page header' })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Display navigation bar' })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Display page title' })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Display tabs' })).toBeVisible();

      // 启用 tabs
      await page.getByRole('menuitem', { name: 'Display tabs', exact: true }).click();
      await expect(page.getByTestId('mobile-page-header')).toContainText('Unnamed');

      // 点击后隐藏 tabs 和 title
      await page.getByLabel('block-item-MobilePageProvider').click();
      await page.getByLabel('designer-schema-settings-MobilePageProvider-mobile:page').click();
      await page.getByRole('menuitem', { name: 'Display page header', exact: true }).click();

      await expect(page.getByLabel('block-item-MobilePageProvider')).not.toContainText(nocoPage.getTitle());
      await expect(page.getByLabel('block-item-MobilePageProvider')).not.toContainText('Unnamed');

      await page.getByLabel('block-item-MobilePageProvider').click();
      await page.getByLabel('designer-schema-settings-MobilePageProvider-mobile:page').click();

      // 仅有 Display page header 显示
      await expect(page.getByRole('menuitem', { name: 'Display page header' })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Display navigation bar' })).not.toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Display page title' })).not.toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Display tabs' })).not.toBeVisible();

      // 再次点击显示
      await page.getByRole('menuitem', { name: 'Display page header', exact: true }).click();
      await expect(page.getByTestId('mobile-page-header')).toContainText(nocoPage.getTitle());
      await expect(page.getByTestId('mobile-page-header')).toContainText('Unnamed');
    });
  });

  test.describe('PageNavigationBar', () => {
    test('Display navigation bar', async ({ page, mockMobilePage }) => {
      const nocoPage = mockMobilePage();
      await nocoPage.goto();
      // 默认有 navigation bar
      await page.getByLabel('block-item-MobilePageProvider').click();
      await expect(page.getByTestId('mobile-page-navigation-bar')).toBeVisible();
      await expect(page.getByTestId('mobile-page-navigation-bar')).toContainText(nocoPage.getTitle());

      // 点击后隐藏
      await page.getByLabel('block-item-MobilePageProvider').click();
      await page.getByLabel('designer-schema-settings-MobilePageProvider-mobile:page').click();

      // 显示 Display navigation bar 和 Display page title
      await expect(page.getByRole('menuitem', { name: 'Display page title' })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Display navigation bar' })).toBeVisible();

      await page.getByRole('menuitem', { name: 'Display navigation bar', exact: true }).click();
      await expect(page.getByTestId('mobile-page-navigation-bar')).not.toBeVisible();

      // 再次点击显示
      await page.getByLabel('block-item-MobilePageProvider').click();
      await page.getByLabel('designer-schema-settings-MobilePageProvider-mobile:page').click();

      // Display navigation bar 为 false 时，Display page title 应该不显示
      await expect(page.getByRole('menuitem', { name: 'Display navigation bar' })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Display page title' })).not.toBeVisible();

      await page.getByRole('menuitem', { name: 'Display navigation bar' }).click();
      await expect(page.getByTestId('mobile-page-navigation-bar')).toBeVisible();
      await expect(page.getByTestId('mobile-page-navigation-bar')).toContainText(nocoPage.getTitle());
    });

    test('Display page title', async ({ page, mockMobilePage }) => {
      const nocoPage = mockMobilePage();
      await nocoPage.goto();

      // 默认有 title
      await page.getByLabel('block-item-MobilePageProvider').click();
      await expect(page.getByTestId('mobile-page-navigation-bar')).toContainText(nocoPage.getTitle());

      // 点击后隐藏
      await page.getByLabel('block-item-MobilePageProvider').click();
      await page.getByLabel('designer-schema-settings-MobilePageProvider-mobile:page').click();
      await page.getByRole('menuitem', { name: 'Display page title' }).click();
      await expect(page.getByTestId('mobile-page-navigation-bar')).not.toContainText(nocoPage.getTitle());

      // 再次点击显示
      await page.getByLabel('block-item-MobilePageProvider').click();
      await page.getByLabel('designer-schema-settings-MobilePageProvider-mobile:page').click();
      await page.getByRole('menuitem', { name: 'Display page title' }).click();
      await expect(page.getByTestId('mobile-page-navigation-bar')).toContainText(nocoPage.getTitle());
    });
  });

  test.describe('tabs', () => {
    test.beforeEach(async ({ page, mockMobilePage }) => {
      const nocoPage = mockMobilePage();
      await nocoPage.goto();
      await page.getByLabel('block-item-MobilePageProvider').click();
      await page.getByLabel('designer-schema-settings-MobilePageProvider-mobile:page').click();
      await page.getByRole('menuitem', { name: 'Display tabs' }).click();
      await expect(page.getByTestId('mobile-page-tabs')).toBeVisible();
      await expect(page.getByTestId('mobile-page-tabs')).toContainText('Unnamed');

      await page.getByTestId('mobile-page-tabs').click();
      await expect(page.getByRole('menuitem', { name: 'Display tabs' })).not.toBeVisible();
    });

    test('Display tabs', async ({ page, mockMobilePage }) => {
      const nocoPage = mockMobilePage();
      await nocoPage.goto();

      // 默认没有 tabs
      await page.getByLabel('block-item-MobilePageProvider').click();
      await expect(page.getByTestId('mobile-page-tabs')).not.toBeVisible();

      // 点击后现实
      await page.getByLabel('block-item-MobilePageProvider').click();
      await page.getByLabel('designer-schema-settings-MobilePageProvider-mobile:page').click();
      await page.getByRole('menuitem', { name: 'Display tabs' }).click();
      await expect(page.getByTestId('mobile-page-tabs')).toBeVisible();
      await expect(page.getByTestId('mobile-page-tabs')).toContainText('Unnamed');

      // 再次点击隐藏
      await page.getByLabel('block-item-MobilePageProvider').click();
      await page.getByLabel('designer-schema-settings-MobilePageProvider-mobile:page').click();
      await page.getByRole('menuitem', { name: 'Display tabs' }).click();
      await expect(page.getByTestId('mobile-page-tabs')).not.toBeVisible();
    });

    test('Item：settings', async ({ page }) => {
      await page.getByTestId('mobile-page-tabs').getByTestId(`mobile-page-tabs-Unnamed`).click();
      await page.getByTestId('mobile-page-tabs').getByLabel('designer-schema-settings-MobilePageTabs').click();

      await expect(page.getByRole('menuitem', { name: 'Edit', exact: true })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Remove' })).not.toBeVisible(); // 仅有一项的时候不显示删除

      await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
      const newTitle = Math.random().toString(36).substring(2);
      await page.getByRole('textbox').fill(newTitle);
      await page.getByRole('button', { name: 'Submit' }).click();
      await expect(page.getByTestId('mobile-page-tabs').getByTestId(`mobile-page-tabs-${newTitle}`)).toHaveText(
        newTitle,
      );

      await page.getByTestId('mobile-page-tabs').getByTestId(`mobile-page-tabs-${newTitle}`).click();
      await page.getByTestId('mobile-page-tabs').getByLabel('designer-schema-settings-MobilePageTabs').click();
      await page.getByRole('menuitem', { name: 'Edit' }).click();
      await expect(page.getByRole('textbox')).toHaveValue(newTitle);
    });

    test('Item：add and remove', async ({ page }) => {
      // 添加页面内容
      await page.getByLabel('schema-initializer-Grid-mobile:addBlock').hover();
      await page.getByRole('menuitem', { name: 'Markdown' }).click();
      await expect(page.getByLabel('block-item-Markdown.Void-')).toBeVisible();

      await page.getByLabel('action-Action-undefined').click();
      const title = Math.random().toString(36).substring(2);
      await page.getByRole('textbox').fill(title);
      await page.getByRole('button', { name: 'Submit' }).click();
      await expect(page.getByTestId('mobile-page-tabs').getByTestId(`mobile-page-tabs-${title}`)).toHaveText(title);

      // 第一项也显示删除了
      await page.getByTestId('mobile-page-tabs').getByTestId(`mobile-page-tabs-Unnamed`).hover();
      await page.getByTestId('mobile-page-tabs-Unnamed').getByLabel('designer-schema-settings-MobilePageTabs').hover();
      await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Edit', exact: true })).toBeVisible();

      // 新增显示删除和编辑
      await page.getByTestId('mobile-page-tabs').getByTestId(`mobile-page-tabs-${title}`).hover();
      await page.getByTestId(`mobile-page-tabs-${title}`).getByLabel('designer-schema-settings-MobilePageTabs').hover();
      await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Edit', exact: true })).toBeVisible();

      // 切换页面，第一个 tab 的内容不显示
      await page.getByTestId('mobile-page-tabs').getByTestId(`mobile-page-tabs-${title}`).click();
      await expect(page.getByLabel('block-item-Markdown.Void-')).not.toBeVisible();

      // 删除
      await page.getByTestId('mobile-page-tabs').getByTestId(`mobile-page-tabs-${title}`).hover();
      await page.getByTestId(`mobile-page-tabs-${title}`).getByLabel('designer-schema-settings-MobilePageTabs').hover();
      await page.getByRole('menuitem', { name: 'Delete' }).click();
      await page.getByRole('button', { name: 'OK' }).click();
      await expect(page.getByTestId('mobile-page-tabs')).not.toContainText(title);
      // 等待删除完成
      await page.waitForTimeout(500);

      // 删除后第一个 tab 的内容显示
      await expect(page.getByLabel('block-item-Markdown.Void-')).toBeVisible();
    });
  });

  test.describe('actions', () => {
    test('link', async ({ page, mockMobilePage }) => {
      const nocoPage = mockMobilePage();
      await nocoPage.goto();
      await expect(page.getByTestId('mobile-page-navigation-bar')).toBeVisible();
      async function doPosition(position: 'left' | 'right') {
        //  添加左侧 Action
        await expect(page.getByTestId(`mobile-navigation-action-bar-${position}`)).toBeVisible();
        const navigationBarPositionElement = page.getByTestId(`mobile-navigation-action-bar-${position}`);
        await navigationBarPositionElement
          .getByLabel('schema-initializer-MobileNavigationActionBar-mobile:navigation-bar:actions')
          .hover();
        await page.getByRole('menuitem', { name: 'Link' }).click();
        await page.getByRole('textbox').fill('Test________');
        await page.getByLabel('action-Action-Submit').click();
        await expect(navigationBarPositionElement).toContainText('Test________');

        // 隐藏下拉列表
        await navigationBarPositionElement
          .getByLabel('schema-initializer-MobileNavigationActionBar-mobile:navigation-bar:actions')
          .hover();
        await page.mouse.move(200, 0);

        // 编辑
        await navigationBarPositionElement.getByRole('button', { name: 'Test________' }).hover();
        await navigationBarPositionElement
          .getByLabel('designer-schema-settings-Action-mobile:navigation-bar:actions:link')
          .hover();
        await page.getByRole('menuitem', { name: 'Edit button' }).click();
        await page.getByRole('textbox').fill('Test_changed');
        await page.getByRole('button', { name: 'Submit' }).click();
        await expect(page.getByLabel('Edit button')).not.toBeVisible();
        await expect(navigationBarPositionElement).toContainText('Test_changed');

        // 编辑 URL
        await navigationBarPositionElement.getByText('Test_changed').hover();
        await navigationBarPositionElement
          .getByLabel('designer-schema-settings-Action-mobile:navigation-bar:actions:link')
          .hover();
        await page.getByRole('menuitem', { name: 'Edit link' }).click();
        await page.getByLabel('block-item-URL').getByLabel('textbox').fill('https://github.com');
        await page.getByRole('button', { name: 'OK' }).click();

        // 删除
        await navigationBarPositionElement.getByText('Test_changed').hover();
        await navigationBarPositionElement
          .getByLabel('designer-schema-settings-Action-mobile:navigation-bar:actions:link')
          .hover();
        await page.getByRole('menuitem', { name: 'Delete' }).click();
        await page.getByText('Delete action').click();
        await page.getByRole('dialog').getByRole('button', { name: 'OK' }).click();
        await expect(page.getByRole('dialog')).not.toBeVisible();
        await expect(navigationBarPositionElement).not.toContainText('Test_changed');
      }

      await doPosition('left');
      await page.reload();
      await doPosition('right');
    });
  });
});

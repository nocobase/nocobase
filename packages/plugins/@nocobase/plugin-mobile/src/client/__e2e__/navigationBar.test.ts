/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';

test.describe('NavBar', () => {
  test.describe('settings', () => {
    test('NavBar settings: hide and show', async ({ page, mockMobilePage }) => {
      const nocoPage = mockMobilePage();
      await nocoPage.goto();
      // 默认有 navigation bar
      await page.getByLabel('block-item-MobilePageProvider').click();
      await expect(page.getByTestId('mobile-page-navigation-bar')).toBeVisible();
      await expect(page.getByTestId('mobile-page-navigation-bar')).toContainText(nocoPage.getTitle());

      // 点击后隐藏
      await page.getByLabel('block-item-MobilePageProvider').click();
      await page.getByLabel('designer-schema-settings-MobilePageProvider-mobile:page').click();
      await page.getByRole('menuitem', { name: 'Enable Navigation Bar', exact: true }).click();
      await expect(page.getByTestId('mobile-page-navigation-bar')).not.toBeVisible();

      // 再次点击显示
      await page.getByLabel('block-item-MobilePageProvider').click();
      await page.getByLabel('designer-schema-settings-MobilePageProvider-mobile:page').click();
      await page.getByRole('menuitem', { name: 'Enable Navigation Bar' }).click();
      await expect(page.getByTestId('mobile-page-navigation-bar')).toBeVisible();
      await expect(page.getByTestId('mobile-page-navigation-bar')).toContainText(nocoPage.getTitle());
    });

    test('NavBar title: hide and show', async ({ page, mockMobilePage }) => {
      const nocoPage = mockMobilePage();
      await nocoPage.goto();

      // 默认有 title
      await page.getByLabel('block-item-MobilePageProvider').click();
      await expect(page.getByTestId('mobile-page-navigation-bar')).toContainText(nocoPage.getTitle());

      // 点击后隐藏
      await page.getByLabel('block-item-MobilePageProvider').click();
      await page.getByLabel('designer-schema-settings-MobilePageProvider-mobile:page').click();
      await page.getByRole('menuitem', { name: 'Enable Navigation Bar Title' }).click();
      await expect(page.getByTestId('mobile-page-navigation-bar')).not.toContainText(nocoPage.getTitle());

      // 再次点击显示
      await page.getByLabel('block-item-MobilePageProvider').click();
      await page.getByLabel('designer-schema-settings-MobilePageProvider-mobile:page').click();
      await page.getByRole('menuitem', { name: 'Enable Navigation Bar Title' }).click();
      await expect(page.getByTestId('mobile-page-navigation-bar')).toContainText(nocoPage.getTitle());
    });

    test('NavBar tabs: hide and show', async ({ page, mockMobilePage }) => {
      const nocoPage = mockMobilePage();
      await nocoPage.goto();

      // 默认没有 tabs
      await page.getByLabel('block-item-MobilePageProvider').click();
      await expect(page.getByTestId('mobile-mobile-page-navigation-bar-tabs')).not.toBeVisible();

      // 点击后现实
      await page.getByLabel('block-item-MobilePageProvider').click();
      await page.getByLabel('designer-schema-settings-MobilePageProvider-mobile:page').click();
      await page.getByRole('menuitem', { name: 'Enable Navigation Bar Tabs' }).click();
      await expect(page.getByTestId('mobile-mobile-page-navigation-bar-tabs')).toBeVisible();
      await expect(page.getByTestId('mobile-mobile-page-navigation-bar-tabs')).toContainText('Unnamed');

      // 再次点击隐藏
      await page.getByLabel('block-item-MobilePageProvider').click();
      await page.getByLabel('designer-schema-settings-MobilePageProvider-mobile:page').click();
      await page.getByRole('menuitem', { name: 'Enable Navigation Bar Tabs' }).click();
      await expect(page.getByTestId('mobile-mobile-page-navigation-bar-tabs')).not.toBeVisible();
    });
  });

  test.describe('tabs', () => {
    test.beforeEach(async ({ page, mockMobilePage }) => {
      const nocoPage = mockMobilePage();
      await nocoPage.goto();
      await page.getByLabel('block-item-MobilePageProvider').click();
      await page.getByLabel('designer-schema-settings-MobilePageProvider-mobile:page').click();
      await page.getByRole('menuitem', { name: 'Enable Navigation Bar Tabs' }).click();
      await expect(page.getByTestId('mobile-mobile-page-navigation-bar-tabs')).toBeVisible();
      await expect(page.getByTestId('mobile-mobile-page-navigation-bar-tabs')).toContainText('Unnamed');

      await page.getByTestId('mobile-mobile-page-navigation-bar-tabs').click();
      await expect(page.getByRole('menuitem', { name: 'Enable Navigation Bar Tabs' })).not.toBeVisible();
    });

    test('settings', async ({ page }) => {
      await page
        .getByTestId('mobile-mobile-page-navigation-bar-tabs')
        .getByTestId(`mobile-mobile-page-navigation-bar-tabs-Unnamed`)
        .click();
      await page
        .getByTestId('mobile-mobile-page-navigation-bar-tabs')
        .getByLabel('designer-schema-settings-MobilePageNavigationBar')
        .click();

      await expect(page.getByRole('menuitem', { name: 'Edit', exact: true })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Remove' })).not.toBeVisible(); // 仅有一项的时候不显示删除

      await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
      const newTitle = Math.random().toString(36).substring(2);
      await page.getByRole('textbox').fill(newTitle);
      await page.getByRole('button', { name: 'Submit' }).click();
      await expect(
        page
          .getByTestId('mobile-mobile-page-navigation-bar-tabs')
          .getByTestId(`mobile-mobile-page-navigation-bar-tabs-${newTitle}`),
      ).toHaveText(newTitle);

      await page
        .getByTestId('mobile-mobile-page-navigation-bar-tabs')
        .getByTestId(`mobile-mobile-page-navigation-bar-tabs-${newTitle}`)
        .click();
      await page
        .getByTestId('mobile-mobile-page-navigation-bar-tabs')
        .getByLabel('designer-schema-settings-MobilePageNavigationBar')
        .click();
      await page.getByRole('menuitem', { name: 'Edit' }).click();
      await expect(page.getByRole('textbox')).toHaveValue(newTitle);
    });

    test('add and remove', async ({ page }) => {
      // 添加页面内容
      await page.getByLabel('schema-initializer-Grid-mobile:addBlock').click();
      await page.getByRole('menuitem', { name: 'form Markdown' }).click();
      await expect(page.getByLabel('block-item-Markdown.Void-')).toBeVisible();

      await page.getByLabel('action-Action-undefined').click();
      const title = Math.random().toString(36).substring(2);
      await page.getByRole('textbox').fill(title);
      await page.getByRole('button', { name: 'Submit' }).click();
      await expect(
        page
          .getByTestId('mobile-mobile-page-navigation-bar-tabs')
          .getByTestId(`mobile-mobile-page-navigation-bar-tabs-${title}`),
      ).toHaveText(title);

      // 第一项也显示删除了
      await page
        .getByTestId('mobile-mobile-page-navigation-bar-tabs')
        .getByTestId(`mobile-mobile-page-navigation-bar-tabs-Unnamed`)
        .click();
      await page
        .getByTestId('mobile-mobile-page-navigation-bar-tabs-Unnamed')
        .getByLabel('designer-schema-settings-MobilePageNavigationBar')
        .click();
      await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Edit', exact: true })).toBeVisible();

      // 新增显示删除和编辑
      await page
        .getByTestId('mobile-mobile-page-navigation-bar-tabs')
        .getByTestId(`mobile-mobile-page-navigation-bar-tabs-${title}`)
        .click();
      await page
        .getByTestId(`mobile-mobile-page-navigation-bar-tabs-${title}`)
        .getByLabel('designer-schema-settings-MobilePageNavigationBar')
        .click();
      await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Edit', exact: true })).toBeVisible();

      // 切换页面，第一个 tab 的内容不显示
      await expect(page.getByLabel('block-item-Markdown.Void-')).not.toBeVisible();

      // 删除
      await page.getByRole('menuitem', { name: 'Delete' }).click();
      await page.getByRole('button', { name: 'OK' }).click();
      await expect(page.getByTestId('mobile-mobile-page-navigation-bar-tabs')).not.toContainText(title);
      // 等待删除完成
      await page.waitForTimeout(500);

      // 删除后第一个 tab 的内容显示
      await expect(page.getByLabel('block-item-Markdown.Void-')).toBeVisible();
    });
  });

  test.describe('actions', () => {
    test('link', async () => {});
  });
});

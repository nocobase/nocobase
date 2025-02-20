/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { oneCalenderWithViewAction, oneTableWithViewAction } from './utils';

test.describe('ReadPrettyFormActionInitializers & CalendarFormActionInitializers should add print action', () => {
  test('print action in ReadPrettyFormActionInitializers', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableWithViewAction).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();
    await page.getByLabel('block-item-CardItem-general-table').hover();
    await page.getByLabel('action-Action.Link-View-view-general').click();
    await page.getByLabel('schema-initializer-ActionBar-details:configureActions-general').hover();
    await page.getByRole('menuitem', { name: 'Print' }).click();
    await expect(page.getByLabel('action-Action-Print-print-general-form')).toBeVisible();
  });
  test('print action in CalendarFormActionInitializers', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneCalenderWithViewAction).waitForInit();
    await mockRecord('general', { singleLineText: 'test' });
    await nocoPage.goto();
    await page.getByLabel('block-item-CardItem-general-').getByLabel('event-title').click();
    await page.getByLabel('schema-initializer-ActionBar-details:configureActions-general').hover();
    await page.getByRole('menuitem', { name: 'Print' }).click();
    await page.getByLabel('action-Action-Print-print-general-form').click();
  });
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { emptyPageWithCalendarCollection, oneTableWithCalendarCollection } from './templates';

test.describe('where can be added', () => {
  test('page', async ({ page, mockPage }) => {
    await mockPage(emptyPageWithCalendarCollection).goto();

    await page.getByLabel('schema-initializer-Grid-page:').hover();
    await page.getByRole('menuitem', { name: 'Calendar right' }).hover();
    await page.getByRole('menuitem', { name: 'calendar', exact: true }).click();

    await page.getByLabel('block-item-Select-Title field').getByTestId('select-single').click();
    await page.getByRole('option', { name: 'Repeats' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await expect(page.getByLabel('block-item-CardItem-calendar-').getByText('Sun', { exact: true })).toBeVisible();
  });

  test('association block in popup', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneTableWithCalendarCollection).goto();
    const record = await mockRecord('toManyCalendar');

    // 打开弹窗
    await page.getByLabel('action-Action.Link-View-view-').first().click();
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'Calendar right' }).hover();
    await page.getByRole('menuitem', { name: 'Associated records' }).last().hover();
    await page.getByRole('menuitem', { name: 'manyToMany' }).click();

    await page.getByLabel('block-item-Select-Title field').getByTestId('select-single').click();
    await page.getByRole('option', { name: 'Repeats' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await expect(page.getByLabel('block-item-CardItem-calendar-').getByText('Sun', { exact: true })).toBeVisible();

    // 通过 Other records 创建一个日历区块
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'Calendar right' }).hover();
    await page.getByRole('menuitem', { name: 'Other records right' }).hover();
    await page.getByRole('menuitem', { name: 'calendar', exact: true }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('block-item-Select-Title field').getByTestId('select-single').click();
    await page.getByRole('option', { name: 'title' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByText(record.manyToMany[0].title).first()).toBeVisible();
  });
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { test, expect } from '@nocobase/test/e2e';
import { theDateStringShouldNotBeUTC } from './templates';

test.describe('FilterAction', () => {
  test('the date string should not be UTC', async ({ page, mockPage }) => {
    await mockPage(theDateStringShouldNotBeUTC).goto();

    // get current date, format: YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    await page.getByLabel('action-Filter.Action-Filter-').click();
    await page.getByPlaceholder('Select date').click();
    await page.getByTitle(today).click();
    const [request] = await Promise.all([
      page.waitForRequest((request) => {
        return request.url().includes('/api/users:list');
      }),

      page.getByRole('button', { name: 'Submit' }).click(),
    ]);
    const requestUrl = request.url();
    const queryParams1 = new URLSearchParams(new URL(requestUrl).search);
    const filter1 = queryParams1.get('filter');
    //请求参数符合预期
    await expect(JSON.parse(filter1)).toEqual({ $and: [{ createdAt: { $dateOn: today } }] });
  });
});

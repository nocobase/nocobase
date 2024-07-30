/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { test } from '@nocobase/test/e2e';
import { theDateStringShouldNotBeUTC } from './templates';

test.describe('FilterAction', () => {
  test('the date string should not be UTC', async ({ page, mockPage }) => {
    await mockPage(theDateStringShouldNotBeUTC).goto();

    // 获取当前的日期，格式为：YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    // 断言：应该会触发一个请求，请求参数包含了 filter: {"$and":[{"createdAt":{"$dateOn":"2024-07-10"}}]}
    const requestPromise = page.waitForRequest(
      // /api/users:list?pageSize=20&page=1&filter={"$and":[{"createdAt":{"$dateOn":"2024-07-10"}}]}
      `/api/users:list?pageSize=20&page=1&filter=%7B%22%24and%22%3A%5B%7B%22createdAt%22%3A%7B%22%24dateOn%22%3A%22${today}%22%7D%7D%5D%7D`,
    );

    await page.getByLabel('action-Filter.Action-Filter-').click();
    await page.getByPlaceholder('Select date').click();
    await page.getByTitle(today).click();
    await page.getByRole('button', { name: 'Submit' }).click();

    await requestPromise;
  });
});

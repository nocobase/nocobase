/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { associationSelectDataScope } from './templatesOfBug';

test.describe('AssociationSelect ', () => {
  test('data scope linkage with other association select field', async ({ page, mockPage, mockRecord }) => {
    await mockPage(associationSelectDataScope).goto();
    await mockRecord('school', { id: 1 });
    await mockRecord('class', {
      school: { id: 1 },
    });
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('api/class:list')),
      page.getByLabel('block-item-CollectionField-student-form-student.class-class').click(),
    ]);
    const requestUrl = request.url();
    const queryParams = new URLSearchParams(new URL(requestUrl).search);
    const filter = queryParams.get('filter');
    //请求参数符合预期
    expect(JSON.parse(filter)).toEqual({ $and: [{ school: { id: { $eq: null } } }] });
    // 选择数据后联动
    await page.getByLabel('block-item-CollectionField-student-form-student.school-school').click();

    await page.getByLabel('block-item-CollectionField-student-form-student.school-school').click();
    await page.getByRole('option', { name: '1' }).click();

    const [request1] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('api/class:list')),
      page.getByLabel('block-item-CollectionField-student-form-student.class-class').click(),
    ]);
    const requestUrl1 = request1.url();
    const queryParams1 = new URLSearchParams(new URL(requestUrl1).search);
    const filter1 = queryParams1.get('filter');
    //请求参数符合预期
    await expect(JSON.parse(filter1)).toEqual({ $and: [{ school: { id: { $eq: 1 } } }] });
  });
});

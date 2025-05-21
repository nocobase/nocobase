/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { associationSelectDataScope, usingMultiLevelAssociationFieldValuesInDataScope } from './templatesOfBug';

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

  test('using multi-level association field values in data scope', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(usingMultiLevelAssociationFieldValuesInDataScope).waitForInit();
    await nocoPage.goto();
    const record = await mockRecord('test', 2);

    // 1. 一开始字段 b 的下拉列表为空
    await page
      .getByLabel('block-item-CollectionField-test-form-test.b-b')
      .getByTestId('select-object-multiple')
      .click();
    await expect(page.getByText('No data').last()).toBeVisible();

    // 2. 当给字段 a 选择一个值后，字段 b 的下拉列表中会显示符合条件的值
    await page
      .getByLabel('block-item-CollectionField-test-form-test.a-a')
      .getByTestId('select-object-multiple')
      .click();
    await page.getByRole('option', { name: record.a[0].id }).click();
    // 关闭下拉框
    await page.click('body', {
      position: {
        x: 0,
        y: 0,
      },
    });
    await page
      .getByLabel('block-item-CollectionField-test-form-test.b-b')
      .getByTestId('select-object-multiple')
      .click();
    for (const item of record.a[0].b) {
      await expect(page.getByRole('option', { name: item.id })).toBeVisible();
    }

    // 3. 当给字段 a 的值变化时，字段 b 的下拉列表也会变化
    await page.click('body', {
      position: {
        x: 0,
        y: 0,
      },
    });
    await page
      .getByLabel('block-item-CollectionField-test-form-test.a-a')
      .getByTestId('select-object-multiple')
      .click();
    await page.getByRole('option', { name: record.a[1].id, exact: true }).click();
    await page.click('body', {
      position: {
        x: 0,
        y: 0,
      },
    });
    await page
      .getByLabel('block-item-CollectionField-test-form-test.b-b')
      .getByTestId('select-object-multiple')
      .click();
    for (const item of record.a[1].b) {
      await expect(page.getByRole('option', { name: item.id })).toBeVisible();
    }
  });
});

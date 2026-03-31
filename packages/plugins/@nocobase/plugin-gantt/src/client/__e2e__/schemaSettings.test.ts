/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { getYmd } from '../helpers/other-helper';
import { oneEmptyGantt } from './utils';
const mockData = {
  singleLineText: 'within apropos leaker whoever how',
  singleLineText2: 'the inasmuch unwelcome gah hm cleverly muscle worriedly lazily',
  startDatetime: '2023-04-26T11:02:51.129Z',
  startDatetime2: '2023-04-29T03:35:05.576Z',
  endDatetime: '2023-05-13T22:11:11.999Z',
  endDatetime2: '2023-07-26T00:47:52.859Z',
  percent: 66,
  percent2: 55,
};

//甘特图的区块参数配置
test.describe('configure params in gantt block', () => {
  test('set data scope in gantt block', async ({ page, mockPage, mockRecords }) => {
    await mockPage(oneEmptyGantt).goto();
    await mockRecords('general', 2);
    await page.getByLabel('block-item-gantt').hover();
    await page.getByLabel('designer-schema-settings-CardItem-Gantt.Designer-general').hover();
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByTitle('ID').getByText('ID').click();
    await page.getByRole('spinbutton').fill('1');
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('api/general:list')),
      page.getByRole('button', { name: 'OK', exact: true }).click(),
    ]);
    const requestUrl = request.url();
    const queryParams = new URLSearchParams(new URL(requestUrl).search);
    const filter = queryParams.get('filter');
    //请求参数符合预期
    expect(JSON.parse(filter)).toEqual({ $and: [{ id: { $eq: 1 } }] });
    await expect(page.getByLabel('table-index-2')).not.toBeVisible();
  });

  test('set title field', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneEmptyGantt).goto();
    await mockRecord('general', mockData);
    await page.getByLabel('block-item-gantt').hover();
    await page.getByLabel('designer-schema-settings-CardItem-Gantt.Designer-general').hover();
    await page.getByRole('menuitem', { name: 'Title field' }).click();
    await page.getByRole('option', { name: 'Single line text2' }).locator('div').click();
    await page.getByRole('button', { name: 'Actions', exact: true }).click();
    await page.mouse.move(300, 0);
    const barLabel = page.getByLabel('block-item-gantt').locator('.barLabel');
    await barLabel.hover();
    await expect(barLabel).toHaveText(mockData['singleLineText2']);
  });
  test('set start date field ', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneEmptyGantt).goto();
    await mockRecord('general', mockData);
    await page.getByLabel('block-item-gantt').hover();
    await page.getByLabel('designer-schema-settings-CardItem-Gantt.Designer-general').hover();
    await page.getByRole('menuitem', { name: 'Start date field' }).click();
    await page.getByRole('option', { name: 'Start date time2' }).locator('div').click();
    await page.mouse.move(300, 0);
    await page.getByRole('button', { name: 'Actions', exact: true }).click();
    await page.locator('.bar').hover({ position: { x: 20, y: 10 } });
    await expect(page.getByLabel('nb-gantt-tooltip')).toHaveText(
      new RegExp(String(getYmd(new Date(mockData['startDatetime2'])))),
    );
  });
  test('set end date field ', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneEmptyGantt).goto();
    await mockRecord('general', mockData);
    await page.getByLabel('block-item-gantt').hover();
    await page.getByLabel('designer-schema-settings-CardItem-Gantt.Designer-general').hover();
    //修改结束时间字段
    await page.getByRole('menuitem', { name: 'End date field' }).click();
    await page.getByRole('option', { name: 'End date time2' }).locator('div').click();
    await page.mouse.move(300, 0);
    await page.getByRole('button', { name: 'Actions', exact: true }).click();
    await page.locator('.bar').hover({ position: { x: 20, y: 10 } });
    await expect(page.getByLabel('nb-gantt-tooltip')).toHaveText(
      new RegExp(String(getYmd(new Date(mockData['endDatetime2'])))),
    );
  });
  test('set time scale ', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneEmptyGantt).goto();
    await mockRecord('general', mockData);
    await page.getByLabel('block-item-gantt').hover();
    await page.getByLabel('designer-schema-settings-CardItem-Gantt.Designer-general').hover();
    //修改时间缩放等级
    await page.getByRole('menuitem', { name: 'Time scale' }).click();
    await page.getByRole('option', { name: 'Week' }).click();
    await page.getByRole('menuitem', { name: 'Time scale' }).hover();
    await page.mouse.move(300, 0);
    await page.getByRole('button', { name: 'Actions', exact: true }).click();
    await page.locator('.bar').hover({ position: { x: 20, y: 10 } });
    await expect(page.getByText('within apropos leaker whoever how: 2023')).toBeVisible();
  });
});

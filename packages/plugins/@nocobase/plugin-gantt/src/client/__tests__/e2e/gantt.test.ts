import { expect, test } from '@nocobase/test/client';
import { generalWithDatetimeFields, oneEmptyGantt } from './utils';
import { getYmd } from '../../helpers/other-helper';
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
test('add gantt block to page', async ({ page, mockPage, mockCollections }) => {
  await mockCollections(generalWithDatetimeFields);
  await mockPage().goto();
  await page.getByLabel('schema-initializer-Grid-BlockInitializers').click();
  await page.getByRole('menuitem', { name: 'form Gantt right' }).click();
  await page.getByRole('menuitem', { name: 'General' }).click();
  await page.getByLabel('block-item-Select-Title field').click();
  await page.getByRole('option', { name: 'Single line text2' }).click();
  await page.getByLabel('block-item-Select-Start date field').click();
  await page.getByRole('option', { name: 'Start date time2' }).click();
  await page.getByLabel('block-item-Select-End date field').click();
  await page.getByRole('option', { name: 'End date time2' }).click();
  await page.getByLabel('block-item-Select-Progress field').click();
  await page.getByRole('option', { name: 'Percent2' }).click();
  await page.getByLabel('block-item-Select-Time scale').click();
  await page.getByRole('option', { name: 'Day', exact: true }).click();
  await page.getByRole('button', { name: 'OK' }).click();
  await expect(page.getByLabel('block-item-gantt')).toBeVisible();
});

//甘特图字段配置
test.describe('configure fields in gantt block', () => {
  test('add field,then remove field in gantt block', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneEmptyGantt).goto();
    await page.getByLabel('schema-initializer-TableV2-TableColumnInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'ID' }).click();
    await page.getByRole('menuitem', { name: 'Single line text2' }).click();
    //添加字段
    await expect(page.getByRole('button', { name: 'ID', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Single line text2' })).toBeVisible();
    //激活的状态
    await expect(page.getByRole('menuitem', { name: 'ID' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Single line text2' }).getByRole('switch')).toBeChecked();
    //移除字段
    await page.getByRole('menuitem', { name: 'ID' }).click();
    await page.getByRole('menuitem', { name: 'Single line text2' }).click();
    await expect(page.getByRole('menuitem', { name: 'ID' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Single line text2' }).getByRole('switch')).not.toBeChecked();
  });
  test('add assciation field should appends association', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneEmptyGantt).goto();
    await mockRecord('general', { singleLineText: 'singleLineText', manyToOne: { id: 1 } });
    await page.getByLabel('schema-initializer-TableV2-TableColumnInitializers-general').hover();

    //关系字段,断言请求的appends是否符合预期
    try {
      const [request] = await Promise.all([
        page.waitForRequest((request) => request.url().includes('api/general:list')),
        page.getByRole('menuitem', { name: 'Many to one', exact: true }).click(),
      ]);
      // 获取请求参数
      const requestUrl = request.url();
      // 解析查询参数
      const queryParams = new URLSearchParams(new URL(requestUrl).search);
      const appends = queryParams.get('appends[]');
      await expect(appends).toContain('manyToOne');
    } finally {
      console.log('error');
    }
    //支持修改标题字段
    await page.getByRole('button', { name: 'Many to one' }).hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-TableV2.Column-TableV2.Column.Designer-general' })
      .hover();
    await page.getByRole('menuitem', { name: 'Title field' }).click();
    await page.getByText('Username').click();
    await expect(
      page.getByLabel('block-item-CardItem-general-table').getByRole('button', { name: 'nocobase' }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByLabel('block-item-CardItem-general-table').getByRole('button', { name: 'nocobase' }),
    ).toBeVisible();
  });
});

//甘特图的区块参数配置
test.describe('configure params in gantt block', () => {
  test('set data scope in gantt block', async ({ page, mockPage, mockRecords }) => {
    await mockPage(oneEmptyGantt).goto();
    await mockRecords('general', 2);
    await page.getByLabel('block-item-gantt').hover();
    await page.getByLabel('designer-schema-settings-CardItem-Gantt.Designer-general').hover();
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').getByLabel('Search').click();
    await page.getByTitle('ID').getByText('ID').click();
    await page.getByRole('spinbutton').fill('1');
    try {
      const [request] = await Promise.all([
        page.waitForRequest((request) => request.url().includes('api/general:list')),
        page.getByRole('button', { name: 'OK' }).click(),
      ]);
      const requestUrl = request.url();
      const queryParams = new URLSearchParams(new URL(requestUrl).search);
      const filter = queryParams.get('filter');
      //请求参数符合预期
      expect(JSON.parse(filter)).toEqual({ $and: [{ id: { $eq: 1 } }] });
      await expect(page.getByLabel('table-index-2')).not.toBeVisible();
    } catch {
      console.log('error');
    }
  });

  test('set title field in gantt block', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneEmptyGantt).goto();
    await mockRecord('general', mockData);
    await page.getByLabel('block-item-gantt').hover();
    await page.getByLabel('designer-schema-settings-CardItem-Gantt.Designer-general').hover();
    await page.getByRole('menuitem', { name: 'Title field' }).click();
    await page.getByRole('option', { name: 'Single line text2' }).locator('div').click();
    await page.getByRole('button', { name: 'Actions' }).click();
    await page.mouse.move(300, 0);
    const barLabel = await page.getByLabel('block-item-gantt').locator('.barLabel');
    await barLabel.hover();
    expect(await barLabel.textContent()).toBe(mockData['singleLineText2']);
  });
  test('set start date field in gantt block', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneEmptyGantt).goto();
    await mockRecord('general', mockData);
    await page.getByLabel('block-item-gantt').hover();
    await page.getByLabel('designer-schema-settings-CardItem-Gantt.Designer-general').hover();
    await page.getByRole('menuitem', { name: 'Start date field' }).click();
    await page.getByRole('option', { name: 'Start date time2' }).locator('div').click();
    await page.mouse.move(300, 0);
    await page.getByRole('button', { name: 'Actions' }).click();
    await page.locator('.bar').hover();
    const tooltip2 = await page.getByLabel('nb-gantt-tooltip');
    await expect(await tooltip2.innerText()).toContain(getYmd(new Date(mockData['startDatetime2'])));
  });
  test('set end date field in gantt block', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneEmptyGantt).goto();
    await mockRecord('general', mockData);
    await page.getByLabel('block-item-gantt').hover();
    await page.getByLabel('designer-schema-settings-CardItem-Gantt.Designer-general').hover();
    //修改结束时间字段
    await page.getByRole('menuitem', { name: 'End date field' }).click();
    await page.getByRole('option', { name: 'End date time2' }).locator('div').click();
    await page.mouse.move(300, 0);
    await page.getByRole('button', { name: 'Actions' }).click();
    await page.locator('.bar').hover();
    const tooltip2 = await page.getByLabel('nb-gantt-tooltip');
    await expect(await tooltip2.innerText()).toContain(getYmd(new Date(mockData['endDatetime2'])));
  });
  test('set time scale in gantt block', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneEmptyGantt).goto();
    await mockRecord('general', mockData);
    await page.getByLabel('block-item-gantt').hover();
    await page.getByLabel('designer-schema-settings-CardItem-Gantt.Designer-general').hover();
    //修改时间缩放等级
    await page.getByRole('menuitem', { name: 'Time scale' }).click();
    await page.getByRole('option', { name: 'Week' }).click();
    await page.getByRole('menuitem', { name: 'Time scale' }).hover();
    await page.mouse.move(300, 0);
    await page.getByRole('button', { name: 'Actions' }).click();
    await page.locator('.bar').hover();
    await expect(await page.locator('.calendarBottomText').first().textContent()).toContain('W');
  });
});

test.describe('action in gantt block', () => {
  test('drag and adjust start time, end time, and progress', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneEmptyGantt).goto();
    await mockRecord('general', {
      singleLineText: 'within apropos leaker whoever how',
      startDatetime: '2023-04-26T11:02:51.129Z',
      endDatetime: '2023-06-13T22:11:11.999Z',
      percent: 0,
    });
    await page.getByLabel('block-item-gantt').hover();
    await page.getByLabel('designer-schema-settings-CardItem-Gantt.Designer-general').hover();
    await page.getByRole('menuitem', { name: 'Time scale' }).click();
    await page.getByRole('option', { name: 'Week' }).click();
    await page.getByRole('menuitem', { name: 'Time scale' }).hover();
    await page.mouse.move(300, 0);
    await page.getByRole('button', { name: 'Actions' }).click();
    await expect(await page.locator('.calendarBottomText').first().textContent()).toContain('W');
    await page.locator('svg.ganttBody').hover();
    await page.locator('.bar ').hover();
    await page.locator('.handleGroup').hover();
    console.log('Before hover');
    const barHandle = await page.locator('rect.barHandle').first();
    await page.mouse.down();
    await page.mouse.move(1000, 0);
    await page.mouse.up();
    console.log('After hover action');

    // await page.getByRole('button', { name: 'Actions' }).click();
    // try {
    //   const [request] = await Promise.all([
    //     page.waitForRequest((request) => request.url().includes('api/general:update')),
    //     page.mouse.move(500, 0),
    //   ]);
    //   const postData = request.postDataJSON();
    //   console.log(postData);
    // } catch {
    //   console.log('error');
    // }
  });
  test('configure button in gannt block', async ({ page, mockPage }) => {
    await mockPage(oneEmptyGantt).goto();
    await page.getByLabel('schema-initializer-ActionBar-GanttActionInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Filter' }).getByRole('switch').click();
    await page.getByRole('menuitem', { name: 'Add new' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('menuitem', { name: 'Refresh' }).click();
    await page.getByRole('menuitem', { name: 'Customize right' }).hover();
    await page.getByRole('menuitem', { name: 'Bulk update' }).click();
    await page.getByRole('menuitem', { name: 'Bulk edit' }).click();
    await page.getByRole('menuitem', { name: 'Add record' }).click();
    await expect(page.getByLabel('action-Filter.Action-Filter-filter-general-table')).toBeVisible();
    await expect(page.getByLabel('action-Action-Add new-create-general-table')).toBeVisible();
    await expect(page.getByLabel('action-Action-Delete-destroy-general-table')).toBeVisible();
    await expect(page.getByLabel('action-Action-Refresh-refresh-general-table')).toBeVisible();
    await expect(page.getByLabel('action-Action-Bulk update-customize:bulkUpdate-general-table')).toBeVisible();
    await expect(page.getByLabel('action-Action-Bulk edit-customize:bulkEdit-general-table')).toBeVisible();
    await expect(page.getByLabel('action-Action-Add record-customize:create-general-table')).toBeVisible();
  });
});

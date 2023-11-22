import { expect, test } from '@nocobase/test/client';
import { generalWithDatetimeFields, oneEmptyGantt } from './utils';

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
    const data = await mockRecord('general');
    await page.getByLabel('block-item-gantt').hover();
    await page.getByLabel('designer-schema-settings-CardItem-Gantt.Designer-general').click();
    await page.getByRole('menuitem', { name: 'Title field Search Single line text' }).click();
    await page.getByRole('option', { name: 'Single line text2' }).locator('div').click();
    const barLabel = await page.locator('.ganttBody .bar .barLabel');
    await barLabel.hover();
    expect(await barLabel.textContent()).toBe(data['singleLineText2']);
    await page.locator('.ganttBody .bar > rect').hover();
    await expect(page.locator('.ganttBody .bar .nbGanttTooltip').textContent()).toContain(data['singleLineText2']);
  });
});

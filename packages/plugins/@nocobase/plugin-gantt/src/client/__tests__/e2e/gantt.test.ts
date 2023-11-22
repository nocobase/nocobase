import { expect, test } from '@nocobase/test/client';
import { generalWithDatetimeFields, oneEmptyGantt } from './utils';

test('add gantt block to page', async ({ page, mockPage, mockCollections }) => {
  await mockCollections(generalWithDatetimeFields);
  await mockPage().goto();
  await page.getByLabel('schema-initializer-Grid-BlockInitializers').click();
  await page.getByRole('menuitem', { name: 'form Gantt right' }).click();
  await page.getByRole('menuitem', { name: 'General' }).click();
  await page.getByLabel('block-item-Select-Title field').click();
  await page.getByRole('option', { name: 'Single line text' }).click();
  await page.getByLabel('block-item-Select-Start date field').click();
  await page.getByRole('option', { name: 'Start date time' }).click();
  await page.getByLabel('block-item-Select-End date field').click();
  await page.getByRole('option', { name: 'End date time' }).click();
  await page.getByLabel('block-item-Select-Progress field').click();
  await page.getByRole('option', { name: 'Percent' }).click();
  await page.getByLabel('block-item-Select-Time scale').click();
  await page.getByRole('option', { name: 'Day', exact: true }).click();
  await page.getByRole('button', { name: 'OK' }).click();
  await expect(await page.getByLabel('block-item-gantt')).toBeVisible();
});

//甘特图字段配置
test.describe('configure fields in gantt block', () => {
  test('add field,then remove field in gantt block', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneEmptyGantt).goto();
    await page.getByLabel('schema-initializer-TableV2-TableColumnInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'ID' }).click();
    await page.getByRole('menuitem', { name: 'Single line text' }).click();
    //添加字段
    await expect(page.getByRole('button', { name: 'ID', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Single line text' })).toBeVisible();
    //激活的状态
    await expect(page.getByRole('menuitem', { name: 'ID' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Single line text' }).getByRole('switch')).toBeChecked();
    //移除字段
    await page.getByRole('menuitem', { name: 'ID' }).click();
    await page.getByRole('menuitem', { name: 'Single line text' }).click();

    await expect(page.getByRole('menuitem', { name: 'ID' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Single line text' }).getByRole('switch')).not.toBeChecked();
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
    // await expect(page.getByLabel('block-item-CollectionField-users-form-users.nickname')).not.toBeVisible();
    // await expect(page.getByLabel('block-item-CollectionField-users-form-users.username')).not.toBeVisible();
    // await expect(page.getByLabel('block-item-CollectionField-users-form-users.email')).not.toBeVisible();
    // await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).not.toBeChecked();
    // await expect(page.getByRole('menuitem', { name: 'Username' }).getByRole('switch')).not.toBeChecked();
    // await expect(page.getByRole('menuitem', { name: 'Email' }).getByRole('switch')).not.toBeChecked();
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

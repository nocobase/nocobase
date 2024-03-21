import { expect, test } from '@nocobase/test/e2e';
import { oneEmptyKanbanBlock } from './utils';

//看板的区块参数配置
test.describe('configure setting', () => {
  test('set the data scope', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneEmptyKanbanBlock).waitForInit();
    await mockRecords('general', 10);
    await nocoPage.goto();
    await expect(page.getByLabel('block-item-CardItem-general-kanban')).toBeVisible();
    //设置数据范围
    await page.getByLabel('block-item-CardItem-general-kanban').hover();
    await page.getByLabel('designer-schema-settings-CardItem-Kanban.Designer-general').hover();
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
    await page.getByRole('spinbutton').fill('1');
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('api/general:list')),
      page.getByRole('button', { name: 'OK', exact: true }).click(),
    ]);
    const requestUrl = request.url();
    const queryParams = new URLSearchParams(new URL(requestUrl).search);
    const filter = queryParams.get('filter');
    //请求参数符合预期,数据显示符合预期
    expect(JSON.parse(filter)).toEqual({ $and: [{ id: { $eq: 1 } }] });
    await expect(page.getByTestId('card-1')).toBeVisible();
    await expect(page.getByTestId('card-2')).not.toBeVisible();
  });
});

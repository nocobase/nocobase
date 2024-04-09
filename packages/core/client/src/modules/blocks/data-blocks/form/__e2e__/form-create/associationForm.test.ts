import { expect, test } from '@nocobase/test/e2e';
import { T3529, T3953 } from './templatesOfBug';

test.describe('association form block', () => {
  // https://nocobase.height.app/T-3529
  test('should be created instead of updated', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(T3529).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await page.getByLabel('action-Action.Link-View-view-general-table-0').click();
    void page.getByLabel('action-Action-Submit-submit-').click();

    const request = await page.waitForRequest((request) => {
      return request.url().includes('m2mField0:create');
    });

    // 应该有包含 :create 的请求
    expect(request).toBeTruthy();
  });

  // https://nocobase.height.app/T-3953/description
  test('form (Add new)', async ({ page, mockPage }) => {
    await mockPage(T3953).goto();

    // 1. 打开弹窗，填写表单
    await page.getByLabel('action-Action.Link-View-view-').click();
    await page.getByLabel('block-item-CollectionField-').getByRole('textbox').fill('1234');
    await page.getByLabel('action-Action-Submit-submit-').click();

    // 2. 提交后，Table 会显示新增的数据
    await expect(page.getByLabel('block-item-CardItem-users-').getByText('1234')).toBeVisible();
  });
});

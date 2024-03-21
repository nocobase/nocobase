import { test, expect } from '@nocobase/test/e2e';
import { T3529 } from './templatesOfBug';

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
});

import { expect, test, twoTabsPage } from '@nocobase/test/e2e';

test('tabs', async ({ page, mockPage }) => {
  await mockPage(twoTabsPage).goto();

  await page.locator('span:has-text("tab 2")').hover();
  await page.getByRole('button', { name: 'drag' }).hover();
  const sourceBoundingBox = await page.locator('span:has-text("tab 2")').boundingBox();
  const targetBoundingBox = await page.locator('span:has-text("tab 1")').boundingBox();
  //拖拽标签调整排序 拖拽前 1-2
  expect(targetBoundingBox.x).toBeLessThan(sourceBoundingBox.x);
  await page.getByRole('button', { name: 'drag' }).dragTo(page.locator('span:has-text("tab 1")'));
  await page.locator('span:has-text("tab 2")').dragTo(page.locator('span:has-text("tab 1")'));
  const tab2 = await page.locator('span:has-text("tab 2")').boundingBox();
  const tab1 = await page.locator('span:has-text("tab 1")').boundingBox();
  //拖拽后 2-1
  expect(tab2.x).toBeLessThan(tab1.x);
});

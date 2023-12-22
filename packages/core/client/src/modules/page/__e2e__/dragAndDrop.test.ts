import { expect, test, twoTabsPage } from '@nocobase/test/e2e';

test('tabs', async ({ page, mockPage }) => {
  await mockPage(twoTabsPage).goto();

  const sourceElement = page.locator('span:has-text("tab 2")');
  await sourceElement.hover();
  const source = page.getByRole('button', { name: 'drag' });
  await source.hover();
  const targetElement = page.locator('span:has-text("tab 1")');
  const sourceBoundingBox = await sourceElement.boundingBox();
  const targetBoundingBox = await targetElement.boundingBox();
  //拖拽标签调整排序 拖拽前 1-2
  expect(targetBoundingBox.x).toBeLessThan(sourceBoundingBox.x);
  await source.dragTo(targetElement);
  await sourceElement.dragTo(targetElement);
  const tab2 = await page.locator('span:has-text("tab 2")').boundingBox();
  const tab1 = await page.locator('span:has-text("tab 1")').boundingBox();
  //拖拽后 2-1
  expect(tab2.x).toBeLessThan(tab1.x);
});

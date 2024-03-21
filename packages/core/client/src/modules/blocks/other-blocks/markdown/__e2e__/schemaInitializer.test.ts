import { createBlockInPage, expect, test } from '@nocobase/test/e2e';

test.describe('where markdown block can be added', () => {
  test('page', async ({ page, mockPage }) => {
    await mockPage().goto();

    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await createBlockInPage(page, 'Markdown');
    await expect(page.getByLabel('block-item-Markdown.Void-markdown')).toBeVisible();
  });
});

import { expect, expectSettingsMenu, oneEmptyMarkdown, test } from '@nocobase/test/e2e';

test.describe('markdown block schema settings', () => {
  test('supported options', async ({ page, mockPage }) => {
    await mockPage(oneEmptyMarkdown).goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('block-item-Markdown.Void-markdown').hover();
        await page.getByLabel('designer-schema-settings-Markdown.Void-Markdown.Void.Designer').hover();
      },
      supportedOptions: ['Edit markdown', 'Delete'],
    });
  });

  test('edit markdown', async ({ page, mockPage }) => {
    await mockPage(oneEmptyMarkdown).goto();

    await page.getByLabel('block-item-Markdown.Void-markdown').hover();
    await page.getByLabel('designer-schema-settings-Markdown.Void-Markdown.Void.Designer').hover();
    await page.getByRole('menuitem', { name: 'Edit markdown' }).click();

    // 输入新的值，并保存
    await page.getByLabel('block-item-Markdown.Void-markdown').getByRole('textbox').click();
    await page.getByLabel('block-item-Markdown.Void-markdown').getByRole('textbox').fill('hello markdown');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByLabel('block-item-Markdown.Void-markdown').getByText('hello markdown')).toBeVisible();
  });
});

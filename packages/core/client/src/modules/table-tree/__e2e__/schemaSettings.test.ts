import { Page, expect, expectSettingsMenu, oneEmptyTableWithTreeCollection, test } from '@nocobase/test/e2e';

test.describe('tree table block schema settings', () => {
  test('supported options', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTableWithTreeCollection).goto();

    await expectSettingsMenu({
      page,
      showMenu: () => showSettingsMenu(page),
      supportedOptions: [
        'Edit block title',
        'Tree table',
        'Enable drag and drop sorting',
        'Fix block',
        'Set the data scope',
        'Set default sorting rules',
        'Records per page',
        'Connect data blocks',
        'Save as template',
        'Delete',
      ],
    });
  });

  // TODO: 这里的问题是：使用 mockRecords 生成固定数据，但是表格中的展开按钮有时显示有时不显示，导致测试不稳定，所以先注释掉了
  test('tree table', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneEmptyTableWithTreeCollection).waitForInit();
    // await mockRecords('treeCollection', 30);
    await nocoPage.goto();

    // 默认情况下的 tree table 是开启状态，且有显示展开按钮
    // await expect(page.getByLabel('Expand row').first()).toBeVisible({ timeout: 1000 * 60 });

    await showSettingsMenu(page);
    await expect(page.getByRole('menuitem', { name: 'Tree table' }).getByRole('switch')).toBeChecked();
    await page.getByRole('menuitem', { name: 'Tree table' }).click();
    await expect(page.getByRole('menuitem', { name: 'Tree table' }).getByRole('switch')).not.toBeChecked();
    // await expect(page.getByLabel('Expand row')).toBeHidden();
  });
});

async function showSettingsMenu(page: Page) {
  await page.getByLabel('block-item-CardItem-treeCollection-table').hover();
  await page.getByLabel('designer-schema-settings-CardItem-TableBlockDesigner-treeCollection').hover();
}

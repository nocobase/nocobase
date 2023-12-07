import { expect, oneTableBlockWithAddNewAndViewAndEditAndBasicFields, test } from '@nocobase/test/client';
import { expectOptions } from '../expectOptions';

test.describe('table block', () => {
  test('supported options', async ({ page, mockPage }) => {
    await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).goto();

    await expectOptions({
      page,
      showMenu: () => showSettingsMenu(page),
      supportedOptions: [
        'Edit block title',
        'Enable drag and drop sorting',
        'Fix block',
        'Set the data scope',
        'Records per page',
        'Connect data blocks',
        'Save as template',
        'Delete',
      ],
    });
  });

  test('fix block', async ({ page, mockPage }) => {
    await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).goto();

    const tableSize = await page.getByLabel('block-item-CardItem-general-table').boundingBox();

    await showSettingsMenu(page);
    await page.getByRole('menuitem', { name: 'Fix block' }).click();
    await expect(page.getByRole('menuitem', { name: 'Fix block' }).getByRole('switch')).toBeChecked();

    // 等待页面重新渲染
    await page.waitForTimeout(100);
    const fixedTableSize = await page.getByLabel('block-item-CardItem-general-table').boundingBox();
    expect(fixedTableSize.height).toBeGreaterThan(570);
    expect(fixedTableSize.height).toBeLessThan(575);

    // 取消固定
    await page.getByRole('menuitem', { name: 'Fix block' }).click();
    await expect(page.getByRole('menuitem', { name: 'Fix block' }).getByRole('switch')).not.toBeChecked();

    // 等待页面重新渲染
    await page.waitForTimeout(100);
    const unfixedTableSize = await page.getByLabel('block-item-CardItem-general-table').boundingBox();

    expect(unfixedTableSize.height).toBe(tableSize.height);
  });

  test('records per page', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecords('general', 40);
    await nocoPage.goto();

    // 默认每页显示 20 条（算上顶部 head 一共 21 行）
    await expect(page.getByRole('row')).toHaveCount(21);
    // 底部 pagination 的显示布局：[Total 40 items] [1] [2] [20 / page]
    await expect(page.locator('.ant-pagination')).toHaveText('Total 40 items1220 / page');

    await showSettingsMenu(page);
    await page.getByRole('menuitem', { name: 'Records per page' }).click();
    await page.getByRole('option', { name: '10', exact: true }).click();

    await expect(page.getByRole('row')).toHaveCount(11);
    // 底部 pagination 的显示布局：[Total 40 items] [1] [2] [3] [4] [10 / page]
    await expect(page.locator('.ant-pagination')).toHaveText('Total 40 items123410 / page');
  });
});

async function showSettingsMenu(page) {
  await page.getByLabel('block-item-CardItem-general-table').hover();
  await page.getByLabel('designer-schema-settings-CardItem-TableBlockDesigner-general').hover();
}

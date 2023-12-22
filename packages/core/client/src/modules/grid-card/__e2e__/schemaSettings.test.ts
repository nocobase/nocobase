import { expect, expectSettingsMenu, oneEmptyGridCardBlock, test } from '@nocobase/test/e2e';

test.describe('grid card block schema settings', () => {
  test('supported options', async ({ page, mockPage }) => {
    await mockPage(oneEmptyGridCardBlock).goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('block-item-BlockItem-general-grid-card').hover();
        await page.getByLabel('designer-schema-settings-BlockItem-GridCard.Designer-general').hover();
      },
      supportedOptions: [
        'Set the count of columns displayed in a row',
        'Set the data scope',
        'Set default sorting rules',
        'Records per page',
        'Save as template',
        'Delete',
      ],
    });
  });

  test('set the count of columns displayed in a row', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneEmptyGridCardBlock).waitForInit();
    await mockRecords('general', 10);
    await nocoPage.goto();

    let boxSize = await page.getByLabel('grid-card-item').first().boundingBox();
    // 默认是 3 列
    // 之所以这样断言，是因为不同平台的浏览器渲染的 width 可能会有一点点差异，所以这里只能用一个范围来判断
    expect(boxSize.width).toBeGreaterThan(400);
    expect(boxSize.width).toBeLessThan(410);

    // 修改成 2 列（在桌面端）
    await page.getByLabel('block-item-BlockItem-general-grid-card').hover();
    await page.getByLabel('designer-schema-settings-BlockItem-GridCard.Designer-general').hover();
    await page.getByRole('menuitem', { name: 'Set the count of columns displayed in a row' }).click();
    await page.getByLabel('block-item-Slider-general-Desktop device').getByText('2', { exact: true }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 需要刷新页面才会生效
    await page.reload();

    boxSize = await page.getByLabel('grid-card-item').first().boundingBox();
    expect(boxSize.width).toBeGreaterThan(600);
    expect(boxSize.width).toBeLessThan(620);
  });
});

test.describe('actions schema settings', () => {});

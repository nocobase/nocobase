import { expect, oneTableBlockWithAddNewAndViewAndEditAndBasicFields, test } from '@nocobase/test/client';

test.describe('enable drag and drop sorting', () => {
  test('basic usage', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    const records = await mockRecords('general', 3);
    await nocoPage.goto();

    await page.getByLabel('block-item-CardItem-general-table').hover();
    await page.getByLabel('designer-schema-settings-CardItem-TableBlockDesigner-general').hover();

    // 默认是关闭状态
    await expect(
      page.getByRole('menuitem', { name: 'Enable drag and drop sorting' }).getByRole('switch'),
    ).not.toBeChecked();

    // 开启之后，隐藏 Set default sorting rules 选项
    await page.getByRole('menuitem', { name: 'Enable drag and drop sorting' }).click();
    await expect(
      page.getByRole('menuitem', { name: 'Enable drag and drop sorting' }).getByRole('switch'),
    ).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Set default sorting rules' })).toBeHidden();

    // 显示出来 email 和 ID
    await page.getByLabel('schema-initializer-TableV2-TableColumnInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'email' }).click();
    await page.getByRole('menuitem', { name: 'ID' }).click();
    await page.mouse.move(300, 0);

    // 默认的排序
    let email1 = await page.getByText(records[0].email).boundingBox();
    let email2 = await page.getByText(records[1].email).boundingBox();
    let email3 = await page.getByText(records[2].email).boundingBox();

    expect(email1.y).toBeLessThan(email2.y);
    expect(email2.y).toBeLessThan(email3.y);

    // 将第二行拖动到第一行
    await page
      .getByLabel('table-index-2')
      .getByRole('img', { name: 'menu' })
      .dragTo(page.getByLabel('table-index-1').getByRole('img', { name: 'menu' }));

    // 等待表格刷新
    await page.waitForTimeout(1000);

    email1 = await page.getByText(records[0].email).boundingBox();
    email2 = await page.getByText(records[1].email).boundingBox();
    email3 = await page.getByText(records[2].email).boundingBox();

    expect(email2.y).toBeLessThan(email1.y);
    expect(email1.y).toBeLessThan(email3.y);
  });
});

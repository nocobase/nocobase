import { expect, oneTableBlockWithAddNewAndViewAndEditAndBasicFields, test } from '@nocobase/test/client';

test.describe('set default sorting rules', () => {
  test('basic usage', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    const records = await mockRecords('general', 3);
    await nocoPage.goto();

    // 打开配置弹窗
    await page.getByLabel('block-item-CardItem-general-table').hover();
    await page.getByLabel('designer-schema-settings-CardItem-TableBlockDesigner-general').hover();
    await page.getByRole('menuitem', { name: 'Set default sorting rules' }).click();

    // 设置一个按 ID 降序的规则
    await page.getByRole('button', { name: 'plus Add sort field' }).click();
    await page.getByTestId('select-single').click();
    await page.getByRole('option', { name: 'ID' }).click();
    await page.getByText('DESC', { exact: true }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 显示出来 email 和 ID
    await page.getByLabel('schema-initializer-TableV2-TableColumnInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'email' }).click();
    await page.getByRole('menuitem', { name: 'ID' }).click();
    await page.mouse.move(300, 0);

    // 规则生效后的顺序：3，2，1
    const email1 = await page.getByText(records[0].email).boundingBox();
    const email2 = await page.getByText(records[1].email).boundingBox();
    const email3 = await page.getByText(records[2].email).boundingBox();

    expect(email3.y).toBeLessThan(email2.y);
    expect(email2.y).toBeLessThan(email1.y);
  });
});

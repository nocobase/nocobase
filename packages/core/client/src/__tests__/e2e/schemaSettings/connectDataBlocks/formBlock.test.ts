import { expect, test } from '@nocobase/test/client';
import { oneFormAndOneTableWithSameCollection } from './templatesOfPage';

test.describe('connect data blocks: form block', () => {
  test('connections between same collections', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneFormAndOneTableWithSameCollection).waitForInit();
    const records = await mockRecords('general', 3);
    await nocoPage.goto();

    // 将上面的 Form 连接到下面的 Table
    await page.getByLabel('block-item-CardItem-general-filter-form').hover();
    await page.getByLabel('designer-schema-settings-CardItem-FormV2.FilterDesigner-general').hover();
    await page.getByRole('menuitem', { name: 'Connect data blocks' }).hover();
    await page.getByRole('menuitem', { name: 'General' }).click();

    // 输入值，点击筛选按钮
    await page
      .getByLabel('block-item-CollectionField-general-filter-form-general.singleLineText-singleLineText')
      .getByRole('textbox')
      .click();
    await page
      .getByLabel('block-item-CollectionField-general-filter-form-general.singleLineText-singleLineText')
      .getByRole('textbox')
      .fill(records[0].singleLineText);

    // 点击筛选按钮
    await page.getByLabel('action-Action-Filter records-submit-general-filter-form').click();

    // 等待 Table 数据刷新
    await page.waitForTimeout(1000);

    // 筛选之后，下面的 Table 只有一行数据（其中有一行是空白的，所以最终的 count 是 2）
    await expect(page.getByLabel('block-item-CardItem-general-table').getByRole('row')).toHaveCount(2);
    await expect(
      page.getByLabel('block-item-CardItem-general-table').getByRole('row', { name: records[0].singleLineText }),
    ).toBeVisible();

    // 点击重置按钮
    await page.getByLabel('action-Action-Reset records-general-filter-form').click();
    await expect(page.getByLabel('block-item-CardItem-general-table').getByRole('row')).toHaveCount(4);
  });
});

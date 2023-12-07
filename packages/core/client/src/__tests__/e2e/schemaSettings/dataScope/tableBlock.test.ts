import { Page, expect, oneTableBlockWithActionsAndFormBlocks, test } from '@nocobase/test/client';

test.describe('constants', () => {
  test('id', async ({ page, mockRecords, mockPage }) => {
    const nocoPage = await mockPage(oneTableBlockWithActionsAndFormBlocks).waitForInit();
    await mockRecords('general', 3);
    await nocoPage.goto();
    await createColumnItem(page, 'ID');

    await showDialog(page);

    // 添加一个 ID 为 1 的条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
    await page.getByRole('spinbutton').click();
    await page.getByRole('spinbutton').fill('1');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 被筛选之后数据只有一条（有一行是空的）
    await expect(page.getByRole('row')).toHaveCount(2);
    // 有一行 id 为 1 的数据
    await expect(page.getByRole('cell', { name: '1', exact: true })).toBeVisible();
  });
});

test.describe('variables', () => {
  test('current user', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithActionsAndFormBlocks).waitForInit();
    // Super Admin 是当前的用户的名字
    await mockRecords('general', [{ singleLineText: 'Super Admin' }, {}, {}]);
    await nocoPage.goto();
    await createColumnItem(page, 'singleLineText');

    await showDialog(page);

    // 添加一个 singleLineText 为 current user 的 Nickname 的条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByRole('menuitemcheckbox', { name: 'singleLineText' }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Current user' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Nickname' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 被筛选之后数据只有一条（有一行是空的）
    await expect(page.getByRole('row')).toHaveCount(2);
    await expect(page.getByRole('cell', { name: 'Super Admin', exact: true })).toBeVisible();
  });
});

async function showDialog(page: Page) {
  await page.getByLabel('block-item-CardItem-general-table').hover();
  await page.getByLabel('designer-schema-settings-CardItem-TableBlockDesigner-general').hover();
  await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
}

async function createColumnItem(page: Page, fieldName: string) {
  await page.getByLabel('schema-initializer-TableV2-TableColumnInitializers-general').hover();
  await page.getByRole('menuitem', { name: fieldName, exact: true }).click();
  await page.mouse.move(300, 0);
}

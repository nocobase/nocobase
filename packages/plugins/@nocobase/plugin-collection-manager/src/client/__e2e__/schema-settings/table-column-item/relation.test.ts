import { expect, oneTableBlockWithAddNewAndViewAndEditAndAssociationFields, test } from '@nocobase/test/client';
import { createColumnItem, showSettingsMenu, testSupportedOptions } from './utils';

test.describe('many to one', () => {
  testSupportedOptions({
    name: 'manyToOne',
    options: ['Custom column title', 'Column width', 'Enable link', 'Title field', 'Field component', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndAssociationFields,
  });

  test('enable link', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).waitForInit();
    const record = await mockRecord('general');
    await nocoPage.goto();

    await createColumnItem(page, 'manyToOne');
    await showSettingsMenu(page, 'manyToOne');

    // 默认开启 enable link
    await expect(page.getByRole('menuitem', { name: 'Enable link' }).getByRole('switch')).toBeChecked();
    await expect(page.locator('a').filter({ has: page.getByText(record.manyToOne.id, { exact: true }) })).toBeVisible();

    // 关闭 enable link
    await page.getByRole('menuitem', { name: 'Enable link' }).click();
    await expect(page.getByRole('menuitem', { name: 'Enable link' }).getByRole('switch')).not.toBeChecked();
    await expect(page.locator('a').filter({ has: page.getByText(record.manyToOne.id, { exact: true }) })).toBeHidden();

    // 再次开启
    await page.getByRole('menuitem', { name: 'Enable link' }).click();
    await expect(page.getByRole('menuitem', { name: 'Enable link' }).getByRole('switch')).toBeChecked();
    await expect(page.locator('a').filter({ has: page.getByText(record.manyToOne.id, { exact: true }) })).toBeVisible();
  });

  test('title field', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).waitForInit();
    const record = await mockRecord('general');
    await nocoPage.goto();

    await createColumnItem(page, 'manyToOne');
    await showSettingsMenu(page, 'manyToOne');

    // 默认是 ID
    await expect(page.getByRole('menuitem', { name: 'Title field' })).toHaveText('Title fieldID');
    await expect(page.getByRole('cell', { name: record.manyToOne.id, exact: true })).toBeVisible();

    // 修改为 nickname
    await page.getByRole('menuitem', { name: 'Title field' }).click();
    await page.getByRole('option', { name: 'Nickname' }).click();
    await page.mouse.move(300, 0);
    await expect(page.getByRole('cell', { name: record.manyToOne.nickname, exact: true })).toBeVisible();
  });

  test('field component', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).waitForInit();
    const record = await mockRecord('general');
    await nocoPage.goto();

    await createColumnItem(page, 'manyToOne');
    await showSettingsMenu(page, 'manyToOne');

    // 默认是 Title
    await expect(page.getByRole('menuitem', { name: 'Field component' })).toHaveText('Field componentTitle');

    // 修改为 Tag
    await page.getByRole('menuitem', { name: 'Field component' }).click();
    await page.getByRole('option', { name: 'Tag' }).click();
    // 修改成功之后会显示 Tag color field 选项
    await expect(page.getByRole('menuitem', { name: 'Tag color field' })).toBeVisible();
    await expect(
      page.getByRole('cell', { name: record.manyToOne.id, exact: true }).filter({ has: page.locator('.ant-tag') }),
    ).toBeVisible();
  });
});

test.describe('many to many', () => {
  testSupportedOptions({
    name: 'manyToMany',
    options: ['Custom column title', 'Column width', 'Enable link', 'Title field', 'Field component', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndAssociationFields,
  });
});

test.describe('one to many', () => {
  testSupportedOptions({
    name: 'oneToMany',
    options: ['Custom column title', 'Column width', 'Enable link', 'Title field', 'Field component', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndAssociationFields,
  });
});

test.describe('one to one (belongs to)', () => {
  testSupportedOptions({
    name: 'oneToOneBelongsTo',
    options: ['Custom column title', 'Column width', 'Enable link', 'Title field', 'Field component', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndAssociationFields,
  });
});

test.describe('one to one (has one)', () => {
  testSupportedOptions({
    name: 'oneToOneHasOne',
    options: ['Custom column title', 'Column width', 'Enable link', 'Title field', 'Field component', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndAssociationFields,
  });
});

import { expect, oneTableBlockWithAddNewAndViewAndEditAndBasicFields, test } from '@nocobase/test/e2e';
import { createColumnItem, showSettingsMenu, testSupportedOptions } from './utils';

test.describe('single line text', () => {
  testSupportedOptions({
    name: 'singleLineText',
    options: ['Custom column title', 'Column width', 'Sortable', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndBasicFields,
  });

  test('custom column title', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecords('general');
    await nocoPage.goto();

    await createColumnItem(page, 'singleLineText');
    await showSettingsMenu(page, 'singleLineText');
    await page.getByRole('menuitem', { name: 'Custom column title' }).click();

    // 显示出原字段名称
    await expect(page.getByRole('dialog').getByText('Original field title: singleLineText')).toBeVisible();
    // 输入新字段名称
    await page.getByLabel('block-item-Input-general-column title').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-general-column title').getByRole('textbox').fill('new column title');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 新名称应该显示出来
    await expect(page.getByRole('button', { name: 'new column title', exact: true })).toBeVisible();
  });

  test('column width', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecords('general');
    await nocoPage.goto();

    await createColumnItem(page, 'singleLineText');
    await showSettingsMenu(page, 'singleLineText');
    await page.getByRole('menuitem', { name: 'Column width' }).click();
    await page.getByRole('dialog').getByRole('spinbutton').click();
    await page.getByRole('dialog').getByRole('spinbutton').fill('600');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    const columnHeadSize = await page.getByRole('columnheader', { name: 'singleLineText' }).boundingBox();
    expect(Math.floor(columnHeadSize.width)).toBe(600);
  });

  test('sortable', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecords('general', [{ singleLineText: 'a' }, { singleLineText: 'b' }]);
    await nocoPage.goto();

    await createColumnItem(page, 'singleLineText');
    await showSettingsMenu(page, 'singleLineText');

    // 默认不可排序
    await expect(page.getByRole('menuitem', { name: 'Sortable' }).getByRole('switch')).not.toBeChecked();

    // 开启排序
    await page.getByRole('menuitem', { name: 'Sortable' }).click();
    // TODO: 此处菜单在点击后不应该消失
    // await expect(page.getByRole('menuitem', { name: 'Sortable' }).getByRole('switch')).toBeChecked();

    // 鼠标 hover 时，有提示
    await page.getByRole('columnheader', { name: 'singleLineText' }).hover();
    await expect(page.getByRole('tooltip', { name: 'Click to sort ascending' })).toBeVisible();

    // 点击第一下，升序
    await page.getByRole('columnheader', { name: 'singleLineText' }).click();
    let sizeA = await page.getByRole('cell', { name: 'a', exact: true }).boundingBox();
    let sizeB = await page.getByRole('cell', { name: 'b', exact: true }).boundingBox();
    expect(sizeA.y).toBeLessThan(sizeB.y);

    // 点击第二下，降序
    await page.getByRole('columnheader', { name: 'singleLineText' }).click();
    sizeA = await page.getByRole('cell', { name: 'a', exact: true }).boundingBox();
    sizeB = await page.getByRole('cell', { name: 'b', exact: true }).boundingBox();
    expect(sizeA.y).toBeGreaterThan(sizeB.y);
  });

  test('delete', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecords('general');
    await nocoPage.goto();

    await createColumnItem(page, 'singleLineText');
    await showSettingsMenu(page, 'singleLineText');
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByRole('columnheader', { name: 'singleLineText' })).toBeHidden();
  });
});

test.describe('color', () => {
  testSupportedOptions({
    name: 'color',
    options: ['Custom column title', 'Column width', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndBasicFields,
  });
});

test.describe('email', () => {
  testSupportedOptions({
    name: 'email',
    options: ['Custom column title', 'Column width', 'Sortable', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndBasicFields,
  });
});

test.describe('icon', () => {
  testSupportedOptions({
    name: 'icon',
    options: ['Custom column title', 'Column width', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndBasicFields,
  });
});

test.describe('integer', () => {
  testSupportedOptions({
    name: 'integer',
    options: ['Custom column title', 'Column width', 'Sortable', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndBasicFields,
  });
});

test.describe('number', () => {
  testSupportedOptions({
    name: 'number',
    options: ['Custom column title', 'Column width', 'Sortable', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndBasicFields,
  });
});

test.describe('password', () => {
  testSupportedOptions({
    name: 'password',
    options: ['Custom column title', 'Column width', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndBasicFields,
  });
});

test.describe('percent', () => {
  testSupportedOptions({
    name: 'percent',
    options: ['Custom column title', 'Column width', 'Sortable', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndBasicFields,
  });
});

test.describe('phone', () => {
  testSupportedOptions({
    name: 'phone',
    options: ['Custom column title', 'Column width', 'Sortable', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndBasicFields,
  });
});

test.describe('long text', () => {
  testSupportedOptions({
    name: 'longText',
    options: ['Custom column title', 'Column width', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndBasicFields,
  });
});

test.describe('url', () => {
  testSupportedOptions({
    name: 'url',
    options: ['Custom column title', 'Column width', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndBasicFields,
  });
});

import { createBlockInPage, expect, oneEmptyForm, test } from '@nocobase/test/e2e';
import { T3106 } from './templatesOfBug';

test.describe('where creation form block can be added', () => {
  test('page', async ({ page, mockPage }) => {
    await mockPage().goto();

    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await createBlockInPage(page, 'Form');
    await expect(page.getByLabel('block-item-CardItem-users-form')).toBeVisible();
  });
});

test.describe('configure fields', () => {
  test('display collection fields & display association fields & add text', async ({ page, mockPage }) => {
    await mockPage(oneEmptyForm).goto();

    // collection fields
    await page.getByLabel('schema-initializer-Grid-form:configureFields-general').hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch')).toBeChecked();

    // add association fields
    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.id-ID')).toBeVisible();
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.manyToOne.nickname')).toBeVisible();

    // delete fields
    await page.getByLabel('schema-initializer-Grid-form:configureFields-general').hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch')).not.toBeChecked();

    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.id-ID')).not.toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-general-form-general.manyToOne.nickname'),
    ).not.toBeVisible();

    // add text
    await page.getByLabel('schema-initializer-Grid-form:configureFields-general').hover();
    await page.getByRole('menuitem', { name: 'Text' }).click();
    await expect(page.getByLabel('block-item-Markdown.Void-general-form')).toBeVisible();
  });

  test.pgOnly('display inherit fields', async ({ page, mockPage }) => {});
});

test.describe('configure actions', () => {
  test('submit', async ({ page, mockPage }) => {
    await mockPage(oneEmptyForm).goto();

    await page.getByLabel('schema-initializer-ActionBar-createForm:configureActions-general').hover();

    // add button
    await page.getByRole('menuitem', { name: 'Submit' }).click();
    await expect(page.getByRole('menuitem', { name: 'Submit' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();

    // delete button
    await page.getByLabel('schema-initializer-ActionBar-createForm:configureActions-general').hover();
    await page.getByRole('menuitem', { name: 'Submit' }).click();
    await expect(page.getByRole('menuitem', { name: 'Submit' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Submit' })).not.toBeVisible();
  });

  // https://nocobase.height.app/T-3106
  test('subTable: should clear form value after submit', async ({ page, mockPage }) => {
    await mockPage(T3106).goto();

    await page.getByRole('button', { name: 'Add new' }).click();
    await expect(
      page.getByLabel('block-item-CollectionField-users-form-users.nickname-Nickname').getByRole('textbox'),
    ).toHaveValue('test name');

    // 点击提交后，应该清空子表格中的值
    await page.getByLabel('action-Action-Submit-submit-').click();
    await expect(
      page.getByLabel('block-item-CollectionField-users-form-users.nickname-Nickname').getByRole('textbox'),
    ).toBeHidden();

    // 再次点击添加按钮，默认值应该正常显示出来
    await page.getByRole('button', { name: 'Add new' }).click();
    await expect(
      page.getByLabel('block-item-CollectionField-users-form-users.nickname-Nickname').getByRole('textbox'),
    ).toHaveValue('test name');
  });

  test('customize: save record', async ({ page, mockPage }) => {
    await mockPage(oneEmptyForm).goto();

    await page.getByLabel('schema-initializer-ActionBar-createForm:configureActions-general').hover();
    await page.getByRole('menuitem', { name: 'Customize' }).hover();
    await page.getByRole('menuitem', { name: 'Save record' }).click();

    await expect(page.getByRole('button', { name: 'Save record' })).toBeVisible();
  });
});

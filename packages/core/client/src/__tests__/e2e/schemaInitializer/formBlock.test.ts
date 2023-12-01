import { expect, oneEmptyForm, test } from '@nocobase/test/client';

test.describe('Form', () => {
  test('add fields', async ({ page, mockPage }) => {
    await mockPage(oneEmptyForm).goto();

    await page.getByLabel('schema-initializer-Grid-FormItemInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'ID' }).click();
    await expect(page.getByRole('menuitem', { name: 'ID' }).getByRole('switch')).toBeChecked();

    // add association fields
    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.id-ID')).toBeVisible();
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.manyToOne.nickname')).toBeVisible();

    // delete fields
    await page.getByLabel('schema-initializer-Grid-FormItemInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'ID' }).click();
    await expect(page.getByRole('menuitem', { name: 'ID' }).getByRole('switch')).not.toBeChecked();

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
    await page.getByLabel('schema-initializer-Grid-FormItemInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Text' }).click();
    await expect(page.getByLabel('block-item-Markdown.Void-general-form')).toBeVisible();
  });

  test.pgOnly('add inherit fields', async ({ page, mockPage }) => {});

  test('add action buttons', async ({ page, mockPage }) => {
    await mockPage(oneEmptyForm).goto();

    await page.getByLabel('schema-initializer-ActionBar-FormActionInitializers-general').hover();

    // add button
    await page.getByRole('menuitem', { name: 'Submit' }).click();
    await expect(page.getByRole('menuitem', { name: 'Submit' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();

    // delete button
    await page.getByLabel('schema-initializer-ActionBar-FormActionInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Submit' }).click();
    await expect(page.getByRole('menuitem', { name: 'Submit' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Submit' })).not.toBeVisible();
  });

  test('add custom action buttons', async ({ page, mockPage }) => {
    await mockPage(oneEmptyForm).goto();

    await page.getByLabel('schema-initializer-ActionBar-FormActionInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Customize' }).hover();
    await page.getByRole('menuitem', { name: 'Save record' }).click();

    await expect(page.getByRole('button', { name: 'Save record' })).toBeVisible();
  });
});

import { expect, oneEmptyFilterFormBlock, test } from '@nocobase/test/client';

test.describe('Filter Form Block', () => {
  test('add fields', async ({ page, mockPage }) => {
    await mockPage(oneEmptyFilterFormBlock).goto();

    const formItemInitializer = page.getByLabel('schema-initializer-Grid-FilterFormItemInitializers-general');

    // add fields
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'ID' }).click();
    await expect(page.getByRole('menuitem', { name: 'ID' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-filter-form-general.id-ID')).toBeVisible();

    // delete fields
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'ID' }).click();
    await expect(page.getByRole('menuitem', { name: 'ID' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-filter-form-general.id-ID')).not.toBeVisible();

    // add association fields
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(
      page.getByLabel('block-item-CollectionField-general-filter-form-general.manyToOne.nickname'),
    ).toBeVisible();

    // delete association fields
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(
      page.getByLabel('block-item-CollectionField-general-filter-form-general.manyToOne.nickname'),
    ).not.toBeVisible();

    // add text
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'Add text' }).click();

    await expect(page.getByLabel('block-item-Markdown.Void-general-filter-form')).toBeVisible();
  });

  test.pgOnly('add inherit fields', async ({ page, mockPage }) => {});

  test('add action buttons', async ({ page, mockPage }) => {
    await mockPage(oneEmptyFilterFormBlock).goto();

    await page.getByLabel('schema-initializer-ActionBar-FilterFormActionInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Filter' }).click();
    await page.getByRole('menuitem', { name: 'Reset' }).click();

    await expect(page.getByRole('menuitem', { name: 'Filter' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Reset' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action-Filter-submit-general-filter-form')).toBeVisible();
    await expect(page.getByLabel('action-Action-Reset-general-filter-form')).toBeVisible();

    // delete buttons
    await page.getByLabel('schema-initializer-ActionBar-FilterFormActionInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Filter' }).click();
    await page.getByRole('menuitem', { name: 'Reset' }).click();

    await expect(page.getByRole('menuitem', { name: 'Filter' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Reset' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action-Filter-submit-general-filter-form')).not.toBeVisible();
    await expect(page.getByLabel('action-Action-Reset-general-filter-form')).not.toBeVisible();
  });
});

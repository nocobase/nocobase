import { createBlockInPage, expect, oneEmptyDetailsBlock, test } from '@nocobase/test/e2e';

test.describe('where multi data details block can be added', () => {
  test('page', async ({ page, mockPage }) => {
    await mockPage().goto();
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await createBlockInPage(page, 'Details');
    await expect(page.getByLabel('block-item-CardItem-users-details')).toBeVisible();
  });
});

test.describe('configure fields', () => {
  test('display collection fields & display association fields & add text', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneEmptyDetailsBlock).goto();
    await mockRecord('general');

    const formItemInitializer = page.getByLabel('schema-initializer-Grid-details:configureFields-general');

    // add fields
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'Single select', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'Single select', exact: true }).getByRole('switch')).toBeChecked();

    // add association fields
    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(
      page.getByLabel('block-item-CollectionField-general-details-general.singleSelect-Single select'),
    ).toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-general-details-general.manyToOne.nickname'),
    ).toBeVisible();

    // delete fields
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'Single select', exact: true }).click();
    await expect(
      page.getByRole('menuitem', { name: 'Single select', exact: true }).getByRole('switch'),
    ).not.toBeChecked();

    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(
      page.getByLabel('block-item-CollectionField-general-details-general.singleSelect-Single select'),
    ).not.toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-general-details-general.manyToOne.nickname'),
    ).not.toBeVisible();

    // add text
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'Add text' }).click();
    await expect(page.getByLabel('block-item-Markdown.Void-general-details')).toBeVisible();
  });
});

test.describe('configure actions', () => {
  test('edit & delete & duplicate', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneEmptyDetailsBlock).goto();
    await mockRecord('general');

    await page.getByLabel('schema-initializer-ActionBar-detailsWithPaging:configureActions-general').hover();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();

    await expect(page.getByRole('menuitem', { name: 'Edit' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Delete' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();

    // delete buttons
    await page.getByLabel('schema-initializer-ActionBar-detailsWithPaging:configureActions-general').hover();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();

    await expect(page.getByRole('menuitem', { name: 'Edit' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Delete' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Edit' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' })).not.toBeVisible();
  });
});

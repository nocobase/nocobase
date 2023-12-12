import { createBlockInPage, expect, oneEmptyFilterCollapseBlock, test } from '@nocobase/test/client';

test('create block in page', async ({ page, mockPage }) => {
  await mockPage().goto();

  await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
  await createBlockInPage(page, 'Collapse');
  await expect(page.getByLabel('block-item-CardItem-users-filter-collapse')).toBeVisible();
});

test('add fields', async ({ page, mockPage }) => {
  await mockPage(oneEmptyFilterCollapseBlock).goto();

  // add fields
  await page
    .getByLabel('schema-initializer-AssociationFilter-AssociationFilter.FilterBlockInitializer-general')
    .hover();
  await page.getByRole('menuitem', { name: 'Created by' }).click();
  await page.getByRole('menuitem', { name: 'Single select' }).click();

  await expect(page.getByRole('menuitem', { name: 'Created by' }).getByRole('switch')).toBeChecked();
  await expect(page.getByRole('menuitem', { name: 'Single select' }).getByRole('switch')).toBeChecked();

  await page.mouse.move(300, 0);
  await expect(page.getByRole('button', { name: 'Created by' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Single select' })).toBeVisible();

  // delete fields
  await page
    .getByLabel('schema-initializer-AssociationFilter-AssociationFilter.FilterBlockInitializer-general')
    .hover();
  await page.getByRole('menuitem', { name: 'Created by' }).click();
  await page.getByRole('menuitem', { name: 'Single select' }).click();

  await expect(page.getByRole('menuitem', { name: 'Created by' }).getByRole('switch')).not.toBeChecked();
  await expect(page.getByRole('menuitem', { name: 'Single select' }).getByRole('switch')).not.toBeChecked();

  await page.mouse.move(300, 0);
  await expect(page.getByRole('button', { name: 'Created by' })).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Single select' })).not.toBeVisible();
});

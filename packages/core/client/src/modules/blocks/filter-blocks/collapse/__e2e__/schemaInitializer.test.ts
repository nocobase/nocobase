import { createBlockInPage, expect, oneEmptyFilterCollapseBlock, test } from '@nocobase/test/e2e';

test.describe('where collapse block can be added', () => {
  test('page', async ({ page, mockPage }) => {
    await mockPage().goto();

    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await createBlockInPage(page, 'Collapse');
    await expect(page.getByLabel('block-item-CardItem-users-filter-collapse')).toBeVisible();
  });

  test('data selector popup', async ({ page, mockPage }) => {});
});

test.describe('configure fields', () => {
  test('association fields & choices fields', async ({ page, mockPage }) => {
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
});

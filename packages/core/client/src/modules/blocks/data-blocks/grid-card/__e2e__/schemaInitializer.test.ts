import { createBlockInPage, expect, oneEmptyGridCardBlock, test } from '@nocobase/test/e2e';

test.describe('where grid card block can be added', () => {
  test('page', async ({ page, mockPage }) => {
    await mockPage().goto();

    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await createBlockInPage(page, 'Grid Card');
    await expect(page.getByLabel('block-item-BlockItem-users-grid-card')).toBeVisible();
  });

  test('data selector popup', async ({ page, mockPage }) => {});
});

test.describe('configure global actions', () => {
  test('filter & add new & refresh', async ({ page, mockPage }) => {
    await mockPage(oneEmptyGridCardBlock).goto();

    await page.getByLabel('schema-initializer-ActionBar-gridCard:configureActions-general').hover();
    await page.getByRole('menuitem', { name: 'Filter' }).click();
    await page.getByRole('menuitem', { name: 'Add new' }).click();
    await page.getByRole('menuitem', { name: 'Refresh' }).click();

    await expect(page.getByRole('menuitem', { name: 'Filter' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Refresh' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Filter' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add new' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible();

    // delete buttons
    await page.getByLabel('schema-initializer-ActionBar-gridCard:configureActions-general').hover();
    await page.getByRole('menuitem', { name: 'Filter' }).click();
    await page.getByRole('menuitem', { name: 'Add new' }).click();
    await page.getByRole('menuitem', { name: 'Refresh' }).click();

    await expect(page.getByRole('menuitem', { name: 'Filter' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Refresh' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Filter' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Add new' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Refresh' })).not.toBeVisible();
  });
});

test.describe('configure item actions', () => {
  test('view & edit & delete', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyGridCardBlock).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await page.getByLabel('schema-initializer-ActionBar-gridCard:configureItemActions-general').first().hover();
    await page.getByRole('menuitem', { name: 'View' }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();

    await expect(page.getByRole('menuitem', { name: 'View' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Edit' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Delete' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-View-view-general-grid-card').first()).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Edit-update-general-grid-card').first()).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Delete-destroy-general-grid-card').first()).toBeVisible();

    // delete buttons
    await page.getByLabel('schema-initializer-ActionBar-gridCard:configureItemActions-general').first().hover();
    await page.getByRole('menuitem', { name: 'View' }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();

    await expect(page.getByRole('menuitem', { name: 'View' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Edit' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Delete' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-View-view-general-grid-card').first()).not.toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Edit-update-general-grid-card').first()).not.toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Delete-destroy-general-grid-card').first()).not.toBeVisible();
  });

  test('customize: popup & update record', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyGridCardBlock).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await page.getByLabel('schema-initializer-ActionBar-gridCard:configureItemActions-general').first().hover();
    await page.getByRole('menuitem', { name: 'Customize' }).hover();
    await page.getByRole('menuitem', { name: 'Popup' }).click();
    await page.getByRole('menuitem', { name: 'Update record' }).click();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-Popup-customize:popup-general-grid-card').first()).toBeVisible();
    await expect(
      page.getByLabel('action-Action.Link-Update record-customize:update-general-grid-card').first(),
    ).toBeVisible();
  });
});

test.describe('configure fields', () => {
  test('display collection fields & display association fields & add text', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyGridCardBlock).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    const formItemInitializer = page.getByLabel('schema-initializer-Grid-details:configureFields-general').first();

    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch')).toBeChecked();

    // add association fields
    await page.mouse.wheel(0, 300);
    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-grid-card-general.id-ID').first()).toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-general-grid-card-general.manyToOne.nickname').first(),
    ).toBeVisible();

    // delete fields
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch')).not.toBeChecked();

    await page.mouse.wheel(0, 300);
    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(
      page.getByLabel('block-item-CollectionField-general-grid-card-general.id-ID').first(),
    ).not.toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-general-grid-card-general.manyToOne.nickname').first(),
    ).not.toBeVisible();

    // add text
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).hover();
    await page.mouse.wheel(0, 300);
    await page.getByRole('menuitem', { name: 'Add text' }).click();

    await expect(page.getByLabel('block-item-Markdown.Void-general-grid-card').first()).toBeVisible();
  });
  test.pgOnly('display inherit fields', async () => {});
});

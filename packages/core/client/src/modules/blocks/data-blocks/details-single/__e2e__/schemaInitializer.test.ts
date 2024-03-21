import { Page, expect, expectSettingsMenu, oneEmptyTableBlockWithActions, test } from '@nocobase/test/e2e';

test.describe('where single data details block can be added', () => {
  test('popup', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await page.getByLabel('action-Action.Link-View-view-general-table-0').click();
    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-general').hover();
    await page.getByRole('menuitem', { name: 'Details' }).hover();
    await page.getByRole('menuitem', { name: 'General' }).click();
    await page.mouse.move(300, 0);

    await expect(page.getByLabel('block-item-CardItem-general-details')).toBeVisible();
  });
});

test.describe('configure actions', () => {
  test('edit & delete & duplicate & print & customize', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await page.getByLabel('action-Action.Link-View-view-general-table-0').click();
    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-general').hover();
    await page.getByRole('menuitem', { name: 'Details' }).hover();
    await page.getByRole('menuitem', { name: 'General' }).click();
    await page.mouse.move(300, 0);

    // create edit ------------------------------------------------------------------------------------
    await createAction(page, 'Edit');
    await expect(page.getByLabel('action-Action-Edit-update-')).toBeVisible();
    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('action-Action-Edit-update-').hover();
        await page.getByRole('button', { name: 'designer-schema-settings-Action-actionSettings:edit-general' }).hover();
      },
      supportedOptions: ['Edit button', 'Linkage rules', 'Open mode', 'Popup size', 'Delete'],
    });
    await deleteAction(page, 'action-Action-Edit-update-');

    // create delete ------------------------------------------------------------------------------------
    await createAction(page, 'Delete');
    await expect(page.getByLabel('action-Action-Delete-destroy-general-details-')).toBeVisible();

    // create print
    await createAction(page, 'Print');
    await expect(page.getByLabel('action-Action-Print-print-')).toBeVisible();

    // create customize actions ----------------------------------------------------------------------------
    // Popup
    await createCustomAction(page, 'Popup');
    await expect(page.getByLabel('action-Action-Popup-customize')).toBeVisible();

    // Update record
    await createCustomAction(page, 'Update record');
    await expect(page.getByLabel('action-Action-Update record-')).toBeVisible();
  });
});

test.describe('configure fields', () => {});

async function createAction(page: Page, name: string) {
  await page.getByLabel('schema-initializer-ActionBar-details:configureActions-general').hover();
  await page.getByRole('menuitem', { name: name }).click();
  await expect(page.getByRole('menuitem', { name: name }).getByRole('switch')).toBeChecked();
  await page.mouse.move(300, 0);
}

async function createCustomAction(page: Page, name: string) {
  await page.getByLabel('schema-initializer-ActionBar-details:configureActions-general').hover();
  await page.getByRole('menuitem', { name: 'Customize' }).hover();
  await page.getByRole('menuitem', { name: name }).click();
  await page.mouse.move(0, 400);
}

async function deleteAction(page: Page, label: string) {
  await page.getByLabel(label).hover();
  await page.getByRole('button', { name: 'designer-schema-settings-Action-' }).hover();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.mouse.move(0, 300);
  await page.getByRole('button', { name: 'OK', exact: true }).click();
}

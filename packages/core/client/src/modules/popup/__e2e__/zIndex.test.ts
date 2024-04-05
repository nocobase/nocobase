import { expect, test } from '@nocobase/test/e2e';
import { T2797, T2838 } from './templatesOfBug';

test.describe('z-index of dialog', () => {
  // https://nocobase.height.app/T-2797
  test('edit block title', async ({ page, mockPage }) => {
    await mockPage(T2797).goto();

    await page.getByLabel('action-Action.Link-Popup').click();
    await page.getByLabel('action-Action-Popup drawer-').click();
    await page.getByText('UsersConfigure fieldsSubmitConfigure actions').hover();
    await page.getByRole('button', { name: 'designer-schema-settings-' }).hover();
    await page.getByRole('menuitem', { name: 'Edit block title' }).click();

    await expect(page.getByLabel('block-item-Input-users-Block')).toBeVisible();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByLabel('block-item-Input-users-Block')).not.toBeVisible();
  });

  // https://nocobase.height.app/T-2838
  test('multilevel modal', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(T2838).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await page.getByLabel('action-Action.Link-Edit').click();
    await page.getByLabel('action-Action-Edit button 1-').click();
    await page.getByLabel('action-Action-Edit button 2-').click();
    await expect(page.getByLabel('block-item-CollectionField-')).toBeVisible();
    await page.getByLabel('action-Action-Submit-submit-').click();
    await expect(page.getByLabel('block-item-CollectionField-')).not.toBeVisible();
  });
});

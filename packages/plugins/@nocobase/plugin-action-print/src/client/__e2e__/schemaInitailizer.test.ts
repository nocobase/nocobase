import { expect, test } from '@nocobase/test/e2e';
import { oneCalenderWithViewAction, oneTableWithViewAction } from './utils';

test.describe('ReadPrettyFormActionInitializers & CalendarFormActionInitializers should add print action', () => {
  test('print action in ReadPrettyFormActionInitializers', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableWithViewAction).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();
    await page.getByLabel('block-item-CardItem-general-table').hover();
    await page.getByLabel('action-Action.Link-View-view-general').click();
    await page.getByLabel('schema-initializer-ActionBar-details:configureActions-general').hover();
    await page.getByRole('menuitem', { name: 'Print' }).click();
    await expect(page.getByLabel('action-Action-Print-print-general-form')).toBeVisible();
  });
  test('print action in CalendarFormActionInitializers', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneCalenderWithViewAction).waitForInit();
    await mockRecord('general', { singleLineText: 'test' });
    await nocoPage.goto();
    await page.getByTitle('test').click();
    await page.getByLabel('schema-initializer-ActionBar-details:configureActions-general').hover();
    await page.getByRole('menuitem', { name: 'Print' }).click();
    await page.getByLabel('action-Action-Print-print-general-form').click();
  });
});

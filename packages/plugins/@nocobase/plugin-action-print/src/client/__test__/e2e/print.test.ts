import { expect, test } from '@nocobase/test/client';
import { oneCalenderWithViewAction, oneTableWithViewAction } from './utils';

test.describe('where print action can be created', () => {
  test('print action can be set in table block view action detail block', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableWithViewAction).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();
    await page.getByLabel('block-item-CardItem-general-table').hover();
    await page.getByLabel('action-Action.Link-View-view-general').click();
    await page.getByLabel('schema-initializer-ActionBar-ReadPrettyFormActionInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Print' }).click();
    await expect(page.getByLabel('action-Action-Print-print-general-form')).toBeVisible();
  });
  test('print action can be set in calender block view action detail blokc', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneCalenderWithViewAction).waitForInit();
    await mockRecord('general', { singleLineText: 'test' });
    await nocoPage.goto();
    await page.getByTitle('test').click();
    await page.getByLabel('schema-initializer-ActionBar-CalendarFormActionInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Print' }).click();
    await page.getByLabel('action-Action-Print-print-general-form').click();
  });
});

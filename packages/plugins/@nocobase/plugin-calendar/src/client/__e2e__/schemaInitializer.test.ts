import { test, expect } from '@nocobase/test/e2e';
import { emptyPageWithCalendarCollection, oneTableWithCalendarCollection } from './templates';

test.describe('where can be added', () => {
  test('page', async ({ page, mockPage }) => {
    await mockPage(emptyPageWithCalendarCollection).goto();

    await page.getByLabel('schema-initializer-Grid-page:').hover();
    await page.getByRole('menuitem', { name: 'form Calendar right' }).hover();
    await page.getByRole('menuitem', { name: 'calendar', exact: true }).click();

    await page.getByLabel('block-item-Select-Title field').getByTestId('select-single').click();
    await page.getByRole('option', { name: 'Repeats' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await expect(page.getByLabel('block-item-CardItem-calendar-').getByText('Sun', { exact: true })).toBeVisible();
  });

  test('association block in popup', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneTableWithCalendarCollection).goto();
    await mockRecord('toManyCalendar');

    // 打开弹窗
    await page.getByLabel('action-Action.Link-View-view-').first().click();
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'form Calendar right' }).hover();
    await page.getByRole('menuitem', { name: 'manyToMany -> calendar' }).click();

    await page.getByLabel('block-item-Select-Title field').getByTestId('select-single').click();
    await page.getByRole('option', { name: 'Repeats' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await expect(page.getByLabel('block-item-CardItem-calendar-').getByText('Sun', { exact: true })).toBeVisible();
  });
});

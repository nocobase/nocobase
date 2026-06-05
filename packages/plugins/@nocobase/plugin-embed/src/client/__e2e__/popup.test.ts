import { expect, test } from '@nocobase/test/e2e';
import { popupInEmbed, shouldCanOpenSubpageInEmbed } from './templates';

test.describe('popup in embed', () => {
  test('should can open popup in all blocks', async ({ page, mockPage, mockRecord }) => {
    const baseURL = process.env.APP_BASE_URL || `http://localhost:${process.env.APP_PORT || 20000}`;
    await mockPage(popupInEmbed).waitForInit();
    await mockRecord('testEmbed');
    await page.goto(`${baseURL}/embed/azco21q3to8`);

    // Table ------------------------------------------------------------------------------
    await page.getByLabel('action-Action-Add new table-').click();
    await expect(page.getByTestId('drawer-Action.Container-testEmbed-Add record')).toBeVisible();
    await page.getByLabel('drawer-Action.Container-testEmbed-Add record-mask').click();

    await page.getByLabel('action-Action.Link-View table').click();
    await expect(page.getByTestId('drawer-Action.Container-testEmbed-View record')).toBeVisible();
    await page.getByLabel('drawer-Action.Container-testEmbed-View record-mask').click();

    // Details ------------------------------------------------------------------------------
    await page.getByLabel('action-Action-Edit details-').click();
    await expect(page.getByTestId('drawer-Action.Container-testEmbed-Edit record')).toBeVisible();
    await page.getByLabel('drawer-Action.Container-testEmbed-Edit record-mask').click();

    // List ------------------------------------------------------------------------------
    await page.getByLabel('action-Action-Add new list-').click();
    await expect(page.getByTestId('drawer-Action.Container-testEmbed-Add record')).toBeVisible();
    await page.getByLabel('drawer-Action.Container-testEmbed-Add record-mask').click();

    await page.getByLabel('action-Action.Link-View list-').click();
    await expect(page.getByTestId('drawer-Action.Container-testEmbed-View record')).toBeVisible();
    await page.getByLabel('drawer-Action.Container-testEmbed-View record-mask').click();

    // Grid Card ------------------------------------------------------------------------------
    await page.getByLabel('action-Action-Add new grid').click();
    await expect(page.getByTestId('drawer-Action.Container-testEmbed-Add record')).toBeVisible();
    await page.getByLabel('drawer-Action.Container-testEmbed-Add record-mask').click();

    await page.getByLabel('action-Action.Link-View grid').click();
    await expect(page.getByTestId('drawer-Action.Container-testEmbed-View record')).toBeVisible();
    await page.getByLabel('drawer-Action.Container-testEmbed-View record-mask').click();

    // Calendar ------------------------------------------------------------------------------
    await page.getByLabel('action-Action-Add new calendar-create-testEmbed-calendar').click();
    await expect(page.getByTestId('drawer-Action.Container-testEmbed-Add record')).toBeVisible();
    await page.getByLabel('drawer-Action.Container-testEmbed-Add record-mask').click();

    await page.locator('.rbc-event-content').click();
    await expect(page.getByTestId('drawer-Action.Container-testEmbed-View record')).toBeVisible();
    await page.getByLabel('drawer-Action.Container-testEmbed-View record-mask').click();

    // Gantt ------------------------------------------------------------------------------
    await page.getByLabel('action-Action-Add new gantt-').click();
    await expect(page.getByTestId('drawer-Action.Container-testEmbed-Add record')).toBeVisible();
    await page.getByLabel('drawer-Action.Container-testEmbed-Add record-mask').click();

    await page.getByLabel('action-Action.Link-View gantt').click();
    await expect(page.getByTestId('drawer-Action.Container-testEmbed-View record')).toBeVisible();
    await page.getByLabel('drawer-Action.Container-testEmbed-View record-mask').click();

    // Kanban ------------------------------------------------------------------------------
    await page.getByLabel('action-Action-Add new kanban-').click();
    await expect(page.getByTestId('drawer-Action.Container-testEmbed-Add record')).toBeVisible();
    await page.getByLabel('drawer-Action.Container-testEmbed-Add record-mask').click();

    await page.getByLabel('block-item-Kanban.Card-').click();
    await expect(page.getByTestId('drawer-Action.Container-testEmbed-View record')).toBeVisible();
    await page.getByLabel('drawer-Action.Container-testEmbed-View record-mask').click();
  });

  test('should can open subpage in embed', async ({ page, mockPage, mockRecord }) => {
    const baseURL = process.env.APP_BASE_URL || `http://localhost:${process.env.APP_PORT || 20000}`;
    await mockPage(shouldCanOpenSubpageInEmbed).waitForInit();
    await page.goto(`${baseURL}/embed/wdbmnbtknkv`);

    await page.getByText('open subpage level 1').click();
    await page.getByText('open subpage level 2').click();
    await page.getByText('open drawer level 3').click();
    await page.getByText('open subpage level 4').click();
    await page.getByText('open dialog level 5').click();
    await page.getByText('open drawer level 6').click();
    await page.getByText('open dialog level 7').click();
    await page.getByText('open subpage level 8').click();
    await page.getByText('open drawer level 9').click();

    await expect(page.getByLabel('block-item-Markdown.Void-').getByText('The end level.')).toBeVisible();
  });
});

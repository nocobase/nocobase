import { expect, oneEmptyTableBlockWithActions, test } from '@nocobase/test/client';

test('create block in dialog', async ({ page, mockPage, mockRecord }) => {
  const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
  await mockRecord('general');
  await nocoPage.goto();

  await page.getByLabel('action-Action.Link-Edit-update-general-table-0').click();
  await page.getByLabel('schema-initializer-Grid-RecordBlockInitializers-general').hover();
  await page.getByText('Form').click();
  await page.mouse.move(300, 0);

  await expect(page.getByLabel('block-item-CardItem-general-form')).toBeVisible();
});

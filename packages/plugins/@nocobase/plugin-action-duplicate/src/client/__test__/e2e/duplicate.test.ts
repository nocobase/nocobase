import { expect, test, oneEmptyDetailsBlock, oneEmptyTableBlockWithCustomizeActions } from '@nocobase/test/client';
import { oneEmptyGantt, oneEmptyTableBlockWithDuplicateActions } from './utils';

test.describe('places where duplicate action can be created', () => {
  test('duplicate action in table block', async ({ page, mockPage, mockCollections, mockRecords }) => {
    const nocoPage = await mockPage(oneEmptyTableBlockWithCustomizeActions).waitForInit();
    await mockRecords('general', 3);
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Actions' }).hover();
    await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-general').hover();
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();
    await expect(await page.getByLabel('action-Action.Link-Duplicate-duplicate-general-table-0')).toBeVisible();
  });
  test('duplicate action in gantt block', async ({ page, mockPage, mockCollections, mockRecords }) => {
    const nocoPage = await mockPage(oneEmptyGantt).waitForInit();
    await mockRecords('general', 3);
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Actions' }).hover();
    await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-general').hover();
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();
    await expect(await page.getByLabel('action-Action.Link-Duplicate-duplicate-general-table-0')).toBeVisible();
  });
  test('duplicate action in detail block', async ({ page, mockPage }) => {
    await mockPage(oneEmptyDetailsBlock).goto();
    await page.getByLabel('schema-initializer-ActionBar-DetailsActionInitializers-general').click();
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();
    await expect(page.getByLabel('action-Action-Duplicate-duplicate-general-details')).toBeVisible();
  });
});

test('direct duplicaten', async ({ page, mockPage, mockCollections, mockRecords }) => {
  const nocoPage = await mockPage(oneEmptyTableBlockWithDuplicateActions).waitForInit();
  const data = await mockRecords('general', 3);
  await nocoPage.goto();
  await expect(await page.getByLabel('action-Action.Link-Duplicate-duplicate-general-table-0')).toBeVisible();
  await page.getByLabel('action-Action.Link-Duplicate-duplicate-general-table-0').hover();
  await page.getByRole('button', { name: 'designer-schema-settings-Action.Link-Action.Designer-general' }).click();
  await page.getByRole('menuitem', { name: 'Duplicate mode' }).click();
  await page.getByLabel('Direct duplicate').check();
  await page.getByRole('button', { name: 'singleLineText (Duplicate)' }).click();
  await page.getByRole('button', { name: 'OK' }).click();

  try {
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('api/general:create')),
      page.getByLabel('action-Action.Link-Duplicate-duplicate-general-table-0').click(),
    ]);
    const postData = request.postDataJSON();
    //直接复制,复制的数据符合预期
    expect(postData.singleLineText).toEqual(data[0].singleLineText);
  } catch {
    console.log('error');
  }
});

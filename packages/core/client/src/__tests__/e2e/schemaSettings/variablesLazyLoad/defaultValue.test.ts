import { expect, test } from '@nocobase/test/client';
import { testingLazyLoadingOfAssociationFieldsForTheCurrentRecord } from './templatesOfPage';

test.describe('default value: lazy load value of variables', () => {
  test('current form', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(testingLazyLoadingOfAssociationFieldsForTheCurrentRecord).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await page.getByRole('button', { name: 'Add new' }).click();
    await page
      .getByLabel('block-item-CollectionField-general-form-general.m2oField0-m2oField0')
      .getByLabel('Search')
      .click();
    await page.getByRole('option', { name: '1', exact: true }).click();

    await expect(
      page
        .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
        .getByRole('textbox'),
    ).toHaveValue('1');
  });
});

import { expect, formBlockDefaultValueTemplate, test } from '@nocobase/test/client';

test.describe('variables with default value', () => {
  test('current form', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(formBlockDefaultValueTemplate).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await page.getByRole('button', { name: 'Add new' }).click();
    await page
      .getByLabel('block-item-CollectionField-general-form-general.m2oField0-m2oField0')
      .getByTestId('select-object-single')
      .click();
    await page.getByRole('option', { name: '1', exact: true }).click();

    await expect(
      page
        .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
        .getByRole('textbox'),
    ).toHaveValue('1');
  });
});

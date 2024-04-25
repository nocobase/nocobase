import { T3879 } from './utils';

import { test, expect } from '@nocobase/test/e2e';

// https://nocobase.height.app/T-3529
test('formula field calculation', async ({ page, mockPage }) => {
  const nocoPage = await mockPage(T3879).waitForInit();
  await nocoPage.goto();
  await page.getByLabel('block-item-CardItem-general-').click();
  await page
    .getByLabel('block-item-CollectionField-general-form-general.number1-number1')
    .getByRole('spinbutton')
    .click();
  await page
    .getByLabel('block-item-CollectionField-general-form-general.number1-number1')
    .getByRole('spinbutton')
    .fill('3');
  await page.getByLabel('block-item-CollectionField-general-form-general.number2-number2').click();
  await page
    .getByLabel('block-item-CollectionField-general-form-general.number2-number2')
    .getByRole('spinbutton')
    .fill('3');
  await expect(await page.locator('.nb-read-pretty-input-number').innerText()).toBe('6');
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { T3879 } from './utils';

import { expect, test } from '@nocobase/test/e2e';

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
  await expect(page.getByLabel('block-item-CollectionField-general-form-general.formula-formula')).toHaveText(
    'formula:6',
  );
});

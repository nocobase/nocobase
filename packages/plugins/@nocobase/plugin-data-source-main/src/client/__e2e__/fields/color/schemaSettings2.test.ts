/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, oneTableBlockWithAddNewAndViewAndEditAndBasicFields, test } from '@nocobase/test/e2e';
import { clickDeleteAndOk, testDisplayTitle, testEditFieldTitle } from '../../utils';

test.describe('form item & view form', () => {
  test('edit field title', async ({ page, mockPage, mockRecord, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();
    await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();
    await page.getByLabel(`block-item-CollectionField-general-form-general.color-color`).hover();
    await page.getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.color`).hover();
    await testEditFieldTitle(page);
  });

  test('display title', async ({ page, mockPage, mockRecord, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();
    await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();
    await page.getByLabel(`block-item-CollectionField-general-form-general.color-color`).hover();
    await page.getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.color`).hover();
    await testDisplayTitle(page, 'color');
  });

  test('delete', async ({ page, mockPage, mockRecord, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();
    await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();
    await page.getByLabel(`block-item-CollectionField-general-form-general.color-color`).hover();
    await page.getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.color`).hover();
    await clickDeleteAndOk(page);
    await expect(page.getByText(`color:`)).not.toBeVisible();
  });

  test('edit tooltip', async ({ page, mockPage, mockRecord, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();
    await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();
    await page.getByLabel(`block-item-CollectionField-general-form-general.color-color`).hover();
    await page.getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.color`).hover();

    await page.getByRole('menuitem', { name: 'Edit tooltip' }).click();
    await page.getByRole('dialog').getByRole('textbox').click();
    await page.getByRole('dialog').getByRole('textbox').fill('testing edit tooltip');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await page
      .getByLabel('block-item-CollectionField-general-form-general.color-color')
      .getByRole('img', { name: 'question-circle' })
      .hover();
    await expect(page.getByText('testing edit tooltip')).toBeVisible();
  });
});

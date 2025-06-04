/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { associatePage } from './templatesOfPage';

test('basic', async ({ page, mockPage, mockRecord }) => {
  await mockPage(associatePage).goto();
  await mockRecord('aa', { oho: { id: 1 }, o2m: [{ id: 1 }] });
  await expect(page.getByLabel('block-item-CardItem-aa-table')).toBeVisible();
  await page.getByLabel('action-Action.Link-Edit-').click();
  await page.getByLabel('block-item-CardItem-bb-details').hover();
  await page.getByLabel('schema-initializer-ActionBar-details:configureActions-bb').hover();
  await expect(page.getByText('Disassociate')).toBeVisible();
  await page.getByText('Disassociate').click();
  await expect(page.getByLabel('action-Action-Disassociate-')).toBeVisible();

  await page
    .getByTestId('drawer-Action.Container-aa-Edit record')
    .getByRole('button', { name: 'Actions', exact: true })
    .hover();
  await page.getByLabel('designer-schema-initializer-TableV2.Column-fieldSettings:TableColumn-cc').hover();
  await expect(page.getByRole('tooltip').getByText('Disassociate')).toBeVisible();

  await page.getByLabel('block-item-CardItem-cc-table').hover();
  await page.getByRole('menuitem', { name: 'Associate' }).waitFor({ state: 'detached' });
  await page.getByLabel('schema-initializer-ActionBar-table:configureActions-cc').hover();
  await page.getByRole('menuitem', { name: 'Associate' }).click();
  //点击 associate 出现弹窗
  await page.getByLabel('action-Action-Associate-').click();
  await page.getByTestId('drawer-Action.Container-cc-Select record').click();
  await page
    .getByTestId('drawer-Action.Container-cc-Select record')
    .getByLabel('schema-initializer-Grid-popup')
    .hover();
  await page.getByRole('menuitem', { name: 'form Table' }).click();
  await expect(
    page.getByTestId('drawer-Action.Container-cc-Select record').getByLabel('block-item-CardItem-cc-'),
  ).toBeVisible();
});

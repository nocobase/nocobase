/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  expect,
  oneTableSubformWithMultiLevelAssociationFields,
  oneTableSubtableWithMultiLevelAssociationFields,
  test,
} from '@nocobase/test/e2e';
import { T2200 } from './templatesOfBug';

test.describe('association fields', () => {
  test('subform: load association fields', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableSubformWithMultiLevelAssociationFields).waitForInit();
    const record = await mockRecord('general', 4);
    await nocoPage.goto();

    // 查看详情
    await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.id-ID')).toHaveText(
      `ID:${record.id}`,
    );
    await expect(page.getByLabel('block-item-CollectionField-m2oField1-form-m2oField1.id-ID')).toHaveText(
      `ID:${record.m2oField0.id}`,
    );
    await expect(page.getByLabel('block-item-CollectionField-m2oField2-form-m2oField2.id-ID')).toHaveText(
      `ID:${record.m2oField0.m2oField1.id}`,
    );
    await expect(page.getByLabel('block-item-CollectionField-m2oField3-form-m2oField3.id-ID')).toHaveText(
      `ID:${record.m2oField0.m2oField1.m2oField2.id}`,
    );
    await expect(page.getByLabel('block-item-CollectionField-m2oField3-form-m2oField3.m2oField3-m2oField3')).toHaveText(
      `m2oField3:${record.m2oField0.m2oField1.m2oField2.m2oField3.id}`,
    );
    await page.getByLabel('drawer-Action.Container-general-View record-mask').click();

    // 编辑详情
    await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.id-ID')).toHaveText(
      `ID:${record.id}`,
    );
    await expect(page.getByLabel('block-item-CollectionField-m2oField1-form-m2oField1.id-ID')).toHaveText(
      `ID:${record.m2oField0.id}`,
    );
    await expect(page.getByLabel('block-item-CollectionField-m2oField2-form-m2oField2.id-ID')).toHaveText(
      `ID:${record.m2oField0.m2oField1.id}`,
    );
    await expect(page.getByLabel('block-item-CollectionField-m2oField3-form-m2oField3.id-ID')).toHaveText(
      `ID:${record.m2oField0.m2oField1.m2oField2.id}`,
    );
    await expect(page.getByLabel('block-item-CollectionField-m2oField3-form-m2oField3.m2oField3-m2oField3')).toHaveText(
      `m2oField3:${record.m2oField0.m2oField1.m2oField2.m2oField3.id}`,
    );
  });

  test('subtable: load association fields', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableSubtableWithMultiLevelAssociationFields).waitForInit();
    const record = await mockRecord('general', 2);
    await nocoPage.goto();

    // 查看详情
    await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.id-ID')).toHaveText(
      `ID:${record.id}`,
    );

    for (let index = 0; index < record.m2mField0.length; index++) {
      await expect(
        page
          .getByLabel('block-item-CollectionField-general-form-general.m2mField0-m2mField0')
          .getByLabel('block-item-CollectionField-m2mField1-form-m2mField1.m2mField1-m2mField1')
          .nth(index),
      ).toHaveText(new RegExp(record.m2mField0[index].m2mField1.map((item) => item.id).join(',')));
    }

    await page.getByLabel('drawer-Action.Container-general-View record-mask').click();

    // 编辑详情
    await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.id-ID')).toHaveText(
      `ID:${record.id}`,
    );
    for (let index = 0; index < record.m2mField0.length; index++) {
      await expect(
        page
          .getByLabel('block-item-CollectionField-general-form-general.m2mField0-m2mField0')
          .getByLabel('block-item-CollectionField-m2mField1-form-m2mField1.m2mField1-m2mField1')
          .nth(index),
      ).toHaveText(new RegExp(record.m2mField0[index].m2mField1.map((item) => item.id).join('')));
    }
  });

  // fix https://nocobase.height.app/T-2200
  test('should be possible to change the value of the association field normally', async ({ page, mockPage }) => {
    await mockPage(T2200).goto();

    await page.getByLabel('action-Action.Link-Edit-update-users-table-0').click();
    await expect(page.getByLabel('Admin')).toBeVisible();
    await expect(page.getByLabel('Member')).toBeVisible();
    await expect(page.getByLabel('Root')).toBeVisible();

    await page.getByTestId('select-object-multiple').click();
    await page.getByTitle('Member').locator('div').click();
    // 再次点击，关闭下拉框。
    await page.getByTestId('select-object-multiple').click();

    await expect(page.getByTestId('select-object-multiple').getByLabel('Admin')).toBeVisible();
    await expect(page.getByLabel('Member')).toBeHidden();
    await expect(page.getByTestId('select-object-multiple').getByLabel('Root')).toBeVisible();

    await page.getByLabel('schema-initializer-Grid-form:configureFields-users').hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    await page.mouse.move(200, 0);

    await page.waitForTimeout(200);
    await expect(page.getByTestId('select-object-multiple').getByLabel('Admin')).toBeVisible();
    await expect(page.getByLabel('Member')).toBeHidden();
    await expect(page.getByTestId('select-object-multiple').getByLabel('Root')).toBeVisible();
  });
});

import { expect, test } from '@nocobase/test/client';
import {
  testingLazyLoadingOfAssociationFieldsOfSubForm,
  testingLazyLoadingOfAssociationFieldsOfSubTable,
  testingLazyLoadingOfDisplayAssociationFields,
  testingLazyLoadingOfDisplayAssociationFieldsOfSubForm,
} from './templatesOfPage';

test.describe('display association fields', () => {
  test('form: should display correctly', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(testingLazyLoadingOfDisplayAssociationFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    // 为关系字段选中一个值
    await page
      .getByLabel('block-item-CollectionField-general-form-general.m2oField0-m2oField0')
      .getByLabel('Search')
      .click();
    await page.getByRole('option', { name: '1', exact: true }).click();

    // 相应的字段应显示出来对应的值
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.m2oField0.id')).toHaveText('ID:1');
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.m2oField0.m2oField1')).toHaveText(
      'm2oField1:1',
    );
  });

  test('subform: should display correctly', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(testingLazyLoadingOfDisplayAssociationFieldsOfSubForm).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    // 为子表单中的关系字段选中一个值
    await page
      .getByLabel('block-item-CollectionField-m2oField1-form-m2oField1.m2oField1-m2oField1')
      .getByLabel('Search')
      .click();
    await page.getByRole('option', { name: '1', exact: true }).click();

    // 相应的字段应显示出来对应的值
    await expect(page.getByLabel('block-item-CollectionField-m2oField1-form-m2oField1.m2oField1.id')).toHaveText(
      'ID:1',
    );
    await expect(page.getByLabel('block-item-CollectionField-m2oField1-form-m2oField1.m2oField1.m2oField2')).toHaveText(
      'm2oField2:1',
    );
  });

  test('subform: load association fields', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(testingLazyLoadingOfAssociationFieldsOfSubForm).waitForInit();
    const record = await mockRecord('general');
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
    const nocoPage = await mockPage(testingLazyLoadingOfAssociationFieldsOfSubTable).waitForInit();
    const record = await mockRecord('general');
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
});

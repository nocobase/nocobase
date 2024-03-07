import {
  expect,
  oneFormWithMultiLevelAssociationFields,
  oneSubformWithMultiLevelAssociationFields,
  oneTableSubformWithMultiLevelAssociationFields,
  oneTableSubtableWithMultiLevelAssociationFields,
  test,
} from '@nocobase/test/e2e';
import { T2200, T2614, T2615, T2845, T2993 } from './templatesOfBug';

test.describe('display association fields', () => {
  test('form: should display correctly', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneFormWithMultiLevelAssociationFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    // 为关系字段选中一个值
    await page
      .getByLabel('block-item-CollectionField-general-form-general.m2oField0-m2oField0')
      .getByTestId('select-object-single')
      .click();
    await page.getByRole('option', { name: '1', exact: true }).click();

    // 相应的字段应显示出来对应的值
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.m2oField0.id')).toHaveText('ID:1');
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.m2oField0.m2oField1')).toHaveText(
      'm2oField1:1',
    );
  });

  test('subform: should display correctly', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneSubformWithMultiLevelAssociationFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    // 为子表单中的关系字段选中一个值
    await page
      .getByLabel('block-item-CollectionField-m2oField1-form-m2oField1.m2oField1-m2oField1')
      .getByTestId('select-object-single')
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

  // https://nocobase.height.app/T-2615
  test('should load association data', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(T2615).waitForInit();
    await mockRecord('T2615');
    await nocoPage.goto();

    // 1. 新增表单中应该显示关系字段的数据
    await page.getByRole('button', { name: 'Add new' }).click();
    await page
      .getByLabel('block-item-CollectionField-T2615-form-T2615.m2o-m2o')
      .getByTestId('select-object-single')
      .click();
    await page.getByRole('option', { name: '1' }).click();
    await expect(page.getByLabel('block-item-CollectionField-T2615-form-T2615.m2o.m2oOfTarget1')).toHaveText(
      `m2oOfTarget1:1`,
    );

    // 关闭弹窗
    await page.getByLabel('drawer-Action.Container-T2615-Add record-mask').click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 2. 编辑表单中应该显示关系字段的数据
    await page.getByLabel('action-Action.Link-Edit record-update-T2615-table-0').click();
    await expect(page.getByLabel('block-item-CollectionField-T2615-form-T2615.m2o-m2o')).toHaveText(`m2o:1`);
    await expect(page.getByLabel('block-item-CollectionField-T2615-form-T2615.m2o.m2oOfTarget1')).toHaveText(
      `m2oOfTarget1:1`,
    );

    await page.getByLabel('drawer-Action.Container-T2615-Edit record-mask').click();

    // 3. 详情中应该显示关系字段的数据
    await page.getByLabel('action-Action.Link-View record-view-T2615-table-0').click();
    await expect(page.getByLabel('block-item-CollectionField-T2615-form-T2615.m2o-m2o')).toHaveText(`m2o:1`);
    await expect(page.getByLabel('block-item-CollectionField-T2615-form-T2615.m2o.m2oOfTarget1')).toHaveText(
      `m2oOfTarget1:1`,
    );
  });

  // https://nocobase.height.app/T-2845
  test('should load association data of subform', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(T2845).waitForInit();
    // 和 T2615 使用一样的数据表结构
    const record = await mockRecord('T2615');
    await nocoPage.goto();

    // 1. 新增表单中应该显示关系字段的数据
    await page.getByRole('button', { name: 'Add new' }).click();
    await page
      .getByLabel('block-item-CollectionField-T2615-form-T2615.m2o-m2o')
      .getByTestId('select-object-single')
      .click();
    await page.getByRole('option', { name: String(record.m2o.id) }).click();
    await expect(page.getByLabel('block-item-CollectionField-T2615Target2-form-T2615Target2.id-ID')).toHaveText(
      `ID:${record.m2o.m2oOfTarget1.id}`,
    );
    await expect(page.getByLabel('block-item-CollectionField-T2615Target2-form-T2615Target2.m2oOfTarget2-')).toHaveText(
      `m2oOfTarget2:${record.m2o.m2oOfTarget1.m2oOfTarget2.id}`,
    );

    // 关闭弹窗
    await page.getByLabel('drawer-Action.Container-T2615-Add record-mask').click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 2. 编辑表单中应该显示关系字段的数据
    await page.getByLabel(`action-Action.Link-Edit record-update-T2615-table-${record.id - 1}`).click();
    await expect(page.getByLabel('block-item-CollectionField-T2615Target2-form-T2615Target2.id-ID')).toHaveText(
      `ID:${record.m2o.m2oOfTarget1.id}`,
    );
    await expect(page.getByLabel('block-item-CollectionField-T2615Target2-form-T2615Target2.m2oOfTarget2-')).toHaveText(
      `m2oOfTarget2:${record.m2o.m2oOfTarget1.m2oOfTarget2.id}`,
    );

    await page.getByLabel('drawer-Action.Container-T2615-Edit record-mask').click();

    // 3. 详情中应该显示关系字段的数据
    await page.getByLabel(`action-Action.Link-View record-view-T2615-table-${record.id - 1}`).click();
    await expect(page.getByLabel('block-item-CollectionField-T2615-form-T2615.m2o-m2o')).toHaveText(
      `m2o:${record.m2o.id}`,
    );
    await expect(page.getByLabel('block-item-CollectionField-T2615Target2-form-T2615Target2.id-ID')).toHaveText(
      `ID:${record.m2o.m2oOfTarget1.id}`,
    );
    await expect(page.getByLabel('block-item-CollectionField-T2615Target2-form-T2615Target2.m2oOfTarget2-')).toHaveText(
      `m2oOfTarget2:${record.m2o.m2oOfTarget1.m2oOfTarget2.id}`,
    );
  });

  // https://nocobase.height.app/T-2614
  test('should load association data in subform', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(T2614).waitForInit();
    await mockRecord('T2614');
    await nocoPage.goto();

    // 查看详情
    await page.getByLabel('action-Action.Link-View record-view-T2614-table-0').click();
    await expect(
      page.getByLabel('block-item-CollectionField-T2614Target1-form-T2614Target1.m2oOfTarget1-m2oOfTarget1'),
    ).toHaveText(`m2oOfTarget1:1`);
    await expect(
      page.getByLabel('block-item-CollectionField-T2614Target1-form-T2614Target1.m2oOfTarget1.id'),
    ).toHaveText(`ID:1`);

    // 关闭弹窗
    await page.getByLabel('drawer-Action.Container-T2614-View record-mask').click();

    // 编辑详情
    await page.getByLabel('action-Action.Link-Edit record-update-T2614-table-0').click();
    await expect(
      page.getByLabel('block-item-CollectionField-T2614Target1-form-T2614Target1.m2oOfTarget1-m2oOfTarget1'),
    ).toHaveText(`m2oOfTarget1:1`);
    await expect(
      page.getByLabel('block-item-CollectionField-T2614Target1-form-T2614Target1.m2oOfTarget1.id'),
    ).toHaveText(`ID:1`);
  });

  // https://nocobase.height.app/T-2993
  test('should load association data of sub details', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(T2993).waitForInit();
    const record = await mockRecord('T2993');
    await nocoPage.goto();

    await page.getByLabel('action-Action-Add new-create-').click();
    await page
      .getByLabel('block-item-CollectionField-T2993Target1-form-T2993Target1.m2oOfTarget1-')
      .getByTestId('select-object-single')
      .click();
    await page.getByRole('option', { name: '1' }).click();

    await expect(page.getByLabel('block-item-CollectionField-users-form-users.nickname-Nickname')).toHaveText(
      new RegExp(record.m2o.m2oOfTarget1.m2oOfTarget2.nickname),
    );
  });
});

test.describe('association fields', () => {
  test('subform: load association fields', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableSubformWithMultiLevelAssociationFields).waitForInit();
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
    const nocoPage = await mockPage(oneTableSubtableWithMultiLevelAssociationFields).waitForInit();
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

  // fix https://nocobase.height.app/T-2200
  test('should be possible to change the value of the association field normally', async ({ page, mockPage }) => {
    await mockPage(T2200).goto();

    await page.getByLabel('action-Action.Link-Edit-update-users-table-0').click();
    await expect(page.getByLabel('Admin')).toBeVisible();
    await expect(page.getByLabel('Member')).toBeVisible();
    await expect(page.getByLabel('Root')).toBeVisible();

    await page.getByTestId('select-object-multiple').click();
    await page.getByRole('option', { name: 'Member' }).click();
    // 再次点击，关闭下拉框。
    await page.getByTestId('select-object-multiple').click();

    await expect(page.getByLabel('Admin')).toBeVisible();
    await expect(page.getByLabel('Member')).toBeHidden();
    await expect(page.getByLabel('Root')).toBeVisible();

    await page.getByLabel('schema-initializer-Grid-form:configureFields-users').hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    await page.mouse.move(200, 0);

    await page.waitForTimeout(200);
    await expect(page.getByLabel('Admin')).toBeVisible();
    await expect(page.getByLabel('Member')).toBeHidden();
    await expect(page.getByLabel('Root')).toBeVisible();
  });
});

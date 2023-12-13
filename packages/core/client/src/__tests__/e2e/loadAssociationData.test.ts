import { T2614, T2615, expect, test } from '@nocobase/test/client';

test.describe('load association data', () => {
  // https://nocobase.height.app/T-2615
  test('should load association data', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(T2615).waitForInit();
    await mockRecord('T2615');
    await nocoPage.goto();

    // 1. 新增表单中应该显示关系字段的数据
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel('block-item-CollectionField-T2615-form-T2615.m2o-m2o').getByLabel('Search').click();
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
});

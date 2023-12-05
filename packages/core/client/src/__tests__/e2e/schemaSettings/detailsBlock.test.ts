import {
  oneDetailBlockWithM2oFieldToGeneral,
  oneTableBlockWithAddNewAndViewAndEditAndBasicFields,
  test,
} from '@nocobase/test/client';
import { expectOptions } from './expectOptions';

test.describe('details block when viewing record', () => {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    // 打开抽屉
    await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();

    await expectOptions({
      page,
      showMenu: async () => {
        await page.getByLabel('block-item-CardItem-general-form').hover();
        await page.getByLabel('designer-schema-settings-CardItem-FormV2.ReadPrettyDesigner-general').hover();
      },
      supportedOptions: ['Edit block title', 'Save as block template', 'Delete'],
    });
  });
});

test.describe('details block in page', () => {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneDetailBlockWithM2oFieldToGeneral).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await expectOptions({
      page,
      showMenu: async () => {
        await page.getByLabel('block-item-CardItem-targetToGeneral-details').hover();
        await page.getByLabel('designer-schema-settings-CardItem-DetailsDesigner-targetToGeneral').hover();
      },
      supportedOptions: [
        'Edit block title',
        'Set the data scope',
        'Set default sorting rules',
        'Save as block template',
        'Delete',
      ],
    });
  });
});

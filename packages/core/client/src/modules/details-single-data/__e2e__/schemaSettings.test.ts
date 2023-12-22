import { expectSettingsMenu, oneTableBlockWithAddNewAndViewAndEditAndBasicFields, test } from '@nocobase/test/e2e';

test.describe('single details block schema settings', () => {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    // 打开抽屉
    await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('block-item-CardItem-general-form').hover();
        await page.getByLabel('designer-schema-settings-CardItem-FormV2.ReadPrettyDesigner-general').hover();
      },
      supportedOptions: ['Edit block title', 'Save as block template', 'Delete'],
    });
  });
});

test.describe('actions schema settings', () => {});

test.describe('fields schema settings', () => {});

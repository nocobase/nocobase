import { expectSettingsMenu, oneEmptyListBlock, test } from '@nocobase/test/e2e';

test.describe('list block schema settings', () => {
  test('supported options', async ({ page, mockPage }) => {
    await mockPage(oneEmptyListBlock).goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('block-item-CardItem-general-list').hover();
        await page.getByLabel('designer-schema-settings-CardItem-List.Designer-general').hover();
      },
      supportedOptions: [
        'Edit block title',
        'Set the data scope',
        'Set default sorting rules',
        'Records per page',
        'Save as template',
        'Delete',
      ],
    });
  });
});

test.describe('actions schema settings', () => {});

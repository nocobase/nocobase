import { oneEmptyFilterFormBlock, test } from '@nocobase/test/client';
import { expectOptions } from './expectOptions';

test.describe('filter form block', () => {
  test('supported options', async ({ page, mockPage }) => {
    await mockPage(oneEmptyFilterFormBlock).goto();

    await expectOptions({
      page,
      showMenu: async () => {
        await page.getByLabel('block-item-CardItem-general-filter-form').hover();
        await page.getByLabel('designer-schema-settings-CardItem-FormV2.FilterDesigner-general').hover();
      },
      supportedOptions: [
        'Edit block title',
        'Save as block template',
        'Linkage rules',
        'Connect data blocks',
        'Delete',
      ],
    });
  });
});

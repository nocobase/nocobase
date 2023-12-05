import { oneEmptyFilterCollapseBlock, test } from '@nocobase/test/client';
import { expectOptions } from './expectOptions';

test.describe('filter collapse block', () => {
  test('supported options', async ({ page, mockPage }) => {
    await mockPage(oneEmptyFilterCollapseBlock).goto();

    await expectOptions({
      page,
      showMenu: async () => {
        await page.getByLabel('block-item-CardItem-general-filter-collapse').hover();
        await page.getByLabel('designer-schema-settings-CardItem-AssociationFilter.BlockDesigner-general').hover();
      },
      supportedOptions: ['Edit block title', 'Save as template', 'Connect data blocks', 'Delete'],
    });
  });
});

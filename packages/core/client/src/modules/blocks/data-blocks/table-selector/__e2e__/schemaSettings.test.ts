import { expectSettingsMenu, test } from '@nocobase/test/e2e';
import { createTable } from './utils';

test.describe('table data selector schema settings', () => {
  test('supported options', async ({ page, mockPage }) => {
    await createTable({ page, mockPage, fieldName: 'manyToOne' });

    await expectSettingsMenu({
      page,
      showMenu: () => showSettingsMenu(page),
      supportedOptions: ['Set the data scope', 'Set default sorting rules', 'Records per page', 'Delete'],
    });
  });
});

async function showSettingsMenu(page) {
  await page.getByLabel('block-item-CardItem-users-table-selector').hover();
  await page.getByLabel('designer-schema-settings-CardItem-blockSettings:tableSelector-users').hover();
}

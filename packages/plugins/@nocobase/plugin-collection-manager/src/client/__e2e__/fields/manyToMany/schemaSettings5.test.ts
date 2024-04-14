import {
  expectSettingsMenu,
  oneTableBlockWithAddNewAndViewAndEditAndAssociationFields,
  test,
} from '@nocobase/test/e2e';
import { createColumnItem, showSettingsMenu } from '../../utils';

test.describe('table column & table', () => {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await createColumnItem(page, 'manyToMany');
        await showSettingsMenu(page, 'manyToMany');
      },
      supportedOptions: [
        'Custom column title',
        'Column width',
        'Enable link',
        'Title field',
        'Field component',
        'Delete',
      ],
    });
  });
});

import { expectSettingsMenu, oneFilterFormBlockWithAllAssociationFields, test } from '@nocobase/test/e2e';

test.describe('form item & filter form', () => {
  test('supported options', async ({ page, mockPage }) => {
    const nocoPage = await mockPage(oneFilterFormBlockWithAllAssociationFields).waitForInit();
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('block-item-CollectionField-general-filter-form-general.manyToMany-manyToMany').hover();
        await page.getByRole('button', { name: 'designer-schema-settings-CollectionField' }).hover();
      },
      supportedOptions: [
        'Edit field title',
        'Edit description',
        'Set the data scope',
        'Field component',
        'Title field',
        'Delete',
      ],
    });
  });
});

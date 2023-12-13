import { Page, PageConfig, expectSettingsMenu, test } from '@nocobase/test/client';

export function testSupportedOptions({
  name,
  options,
  template,
}: {
  name: string;
  options: string[];
  template: PageConfig;
}) {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(template).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await createColumnItem(page, name);
        await showSettingsMenu(page, name);
      },
      supportedOptions: options,
    });
  });
}

export async function showSettingsMenu(page: Page, fieldName: string) {
  await page.getByRole('columnheader', { name: fieldName, exact: true }).hover();
  await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.Column.Designer-').hover();
}

export async function createColumnItem(page: Page, fieldName: string) {
  await page.getByLabel('schema-initializer-TableV2-TableColumnInitializers-general').hover();
  await page.getByRole('menuitem', { name: fieldName, exact: true }).click();
  await page.mouse.move(300, 0);
}

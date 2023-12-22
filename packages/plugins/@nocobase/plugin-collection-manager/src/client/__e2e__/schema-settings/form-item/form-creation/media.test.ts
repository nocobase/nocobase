import { Page, expect, oneTableBlockWithAddNewAndViewAndEditAndMediaFields, test } from '@nocobase/test/e2e';
import { commonTesting, testDefaultValue, testPattern, testSetValidationRules } from '../commonTesting';

test.describe('markdown', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'markdown', mode: 'options' });

  test('set default value', async ({ page, mockPage, mockRecord }) => {
    await testDefaultValue({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      closeDialog: () => page.getByLabel('drawer-Action.Container-general-Add record-mask').click(),
      showMenu: () => showMenu(page, 'markdown'),
      supportVariables: ['Constant', 'Current user', 'Date variables', 'Current form'],
      constantValue: 'test markdown',
      expectConstantValue: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.markdown-markdown').getByRole('textbox'),
        ).toHaveValue('test markdown');
      },
    });
  });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    await testPattern({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'markdown'),
      expectEditable: async () => {
        await page
          .getByLabel('block-item-CollectionField-general-form-general.markdown-markdown')
          .getByRole('textbox')
          .click();
        await page
          .getByLabel('block-item-CollectionField-general-form-general.markdown-markdown')
          .getByRole('textbox')
          .fill('test markdown pattern');
      },
      expectReadonly: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.markdown-markdown').getByRole('textbox'),
        ).toBeDisabled();
      },
      expectEasyReading: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.markdown-markdown').getByRole('textbox'),
        ).not.toBeVisible();
        await expect(page.getByLabel('block-item-CollectionField-general-form-general.markdown-markdown')).toHaveText(
          `markdown:test markdown pattern`,
        );
      },
    });
  });

  test('Set validation rules', async ({ page, mockPage }) => {
    await testSetValidationRules({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'markdown'),
    });
  });
});

test.describe('rich text', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'richText', mode: 'options' });

  test('set default value', async ({ page, mockPage, mockRecord }) => {
    await testDefaultValue({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      closeDialog: () => page.getByLabel('drawer-Action.Container-general-Add record-mask').click(),
      showMenu: () => showMenu(page, 'richText'),
      supportVariables: ['Constant', 'Current user', 'Date variables', 'Current form'],
      inputConstantValue: async () => {
        await page.getByLabel('block-item-CollectionField-general-general.richText').locator('.ql-editor').click();
        await page.keyboard.type('test rich text');
      },
      expectConstantValue: async () => {
        await expect(page.getByLabel('block-item-CollectionField-general-form-general.richText-richText')).toHaveText(
          /test rich text/,
        );
      },
    });
  });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    await testPattern({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'richText'),
      expectEditable: async () => {
        await page
          .getByLabel('block-item-CollectionField-general-form-general.richText-richText')
          .locator('.ql-editor')
          .click();
        await page.keyboard.type('test rich text pattern');
      },
      expectReadonly: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.richText-richText').locator('.ql-container'),
        ).toHaveClass(/ql-disabled/);
      },
      expectEasyReading: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.richText-richText').locator('.ql-container'),
        ).not.toBeVisible();
        await expect(page.getByLabel('block-item-CollectionField-general-form-general.richText-richText')).toHaveText(
          /test rich text pattern/,
        );
      },
    });
  });

  test('Set validation rules', async ({ page, mockPage }) => {
    await testSetValidationRules({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'markdown'),
    });
  });
});

test.describe('attachment', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'attachment', mode: 'options' });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    await testPattern({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'attachment'),
      expectEditable: async () => {
        await expect(page.getByRole('button', { name: 'plus Upload' })).toBeVisible();
      },
      expectReadonly: async () => {
        await expect(page.getByRole('button', { name: 'plus Upload' })).not.toBeVisible();
      },
      expectEasyReading: async () => {
        await expect(page.getByRole('button', { name: 'plus Upload' })).not.toBeVisible();
      },
    });
  });
});

const gotoPage = async (mockPage) => {
  const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndMediaFields).waitForInit();
  await nocoPage.goto();
};

const openDialog = async (page: Page) => {
  await page.getByRole('button', { name: 'Add new' }).click();
};

const showMenu = async (page: Page, fieldName: string) => {
  await page
    .getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`, { exact: true })
    .hover();
  await page
    .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`, {
      exact: true,
    })
    .hover();
};

async function openDialogAndShowMenu({
  page,
  mockPage,
  mockRecord,
  fieldName,
}: {
  page: Page;
  mockPage;
  mockRecord;
  fieldName: string;
}) {
  await gotoPage(mockPage);
  await openDialog(page);
  await showMenu(page, fieldName);
}

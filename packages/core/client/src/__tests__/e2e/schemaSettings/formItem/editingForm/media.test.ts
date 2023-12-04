import { Page, expect, oneTableBlockWithAddNewAndViewAndEditAndMediaFields, test } from '@nocobase/test/client';
import { commonTesting, testPattern, testSetValidationRules } from '../commonTesting';

const gotoPage = async (mockPage, mockRecord) => {
  const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndMediaFields).waitForInit();
  const record = await mockRecord('general');
  await nocoPage.goto();

  return record;
};

const openDialog = async (page: Page) => {
  await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
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

const openDialogAndShowMenu = async ({
  page,
  mockPage,
  mockRecord,
  fieldName,
}: {
  page: Page;
  mockPage;
  mockRecord;
  fieldName: string;
}) => {
  await gotoPage(mockPage, mockRecord);
  await openDialog(page);
  await showMenu(page, fieldName);
};

test.describe('markdown', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'markdown', blockType: 'editing', mode: 'options' });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    let record = null;
    await testPattern({
      page,
      gotoPage: async () => {
        record = await gotoPage(mockPage, mockRecord);
      },
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'markdown'),
      expectEditable: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.markdown-markdown').getByRole('textbox'),
        ).toHaveValue(record.markdown);
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
          `markdown:${record.markdown}`,
        );
      },
    });
  });

  test('Set validation rules', async ({ page, mockPage, mockRecord }) => {
    await testSetValidationRules({
      page,
      gotoPage: () => gotoPage(mockPage, mockRecord),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'markdown'),
    });
  });
});

test.describe('rich text', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'richText', blockType: 'editing', mode: 'options' });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    let record = null;
    await testPattern({
      page,
      gotoPage: async () => {
        record = await gotoPage(mockPage, mockRecord);
      },
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'richText'),
      expectEditable: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.richText-richText').locator('.ql-editor'),
        ).toHaveText(record.richText);
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
          `richText:${record.richText}`,
        );
      },
    });
  });

  test('Set validation rules', async ({ page, mockPage, mockRecord }) => {
    await testSetValidationRules({
      page,
      gotoPage: () => gotoPage(mockPage, mockRecord),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'markdown'),
    });
  });
});

test.describe('attachment', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'attachment', blockType: 'editing', mode: 'options' });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    let record = null;
    await testPattern({
      page,
      gotoPage: async () => {
        record = await gotoPage(mockPage, mockRecord);
      },
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'attachment'),
      expectEditable: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.attachment-attachment')
            .getByRole('link', { name: record.attachment.title })
            .first(),
        ).toBeVisible();
      },
      expectReadonly: async () => {
        await page
          .getByLabel('block-item-CollectionField-general-form-general.attachment-attachment')
          .getByRole('link', { name: record.attachment.title })
          .first()
          .hover();
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.attachment-attachment')
            .getByRole('button', { name: 'delete' }),
        ).not.toBeVisible();
      },
      expectEasyReading: async () => {
        await page
          .getByLabel('block-item-CollectionField-general-form-general.attachment-attachment')
          .getByRole('link', { name: record.attachment.title })
          .first()
          .hover();
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.attachment-attachment')
            .getByRole('button', { name: 'delete' }),
        ).not.toBeVisible();
      },
    });
  });
});

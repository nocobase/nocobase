import { Page, expect, oneTableBlockWithAddNewAndViewAndEditAndMediaFields, test } from '@nocobase/test/client';
import { commonTesting } from '../commonTesting';

const gotoPage = async (mockPage, mockRecord) => {
  const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndMediaFields).waitForInit();
  const record = await mockRecord('general');
  await nocoPage.goto();

  return record;
};

const openDialog = async (page: Page) => {
  await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();
};

const showMenu = async (page: Page, fieldName: string) => {
  // 这里是为了等弹窗中的内容渲染稳定后，再去 hover，防止错位导致测试报错
  await page.waitForTimeout(1000);
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
  commonTesting({ openDialogAndShowMenu, fieldName: 'markdown', blockType: 'viewing', mode: 'options' });
});

test.describe('rich text', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'richText', blockType: 'viewing', mode: 'options' });
});

test.describe('attachment', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'attachment', blockType: 'viewing', mode: 'options' });

  test('size', async ({ page, mockPage, mockRecord }) => {
    const record = await gotoPage(mockPage, mockRecord);
    await openDialog(page);

    // 默认尺寸
    // 这里的尺寸不稳定，所以用 try catch 来处理
    const testDefault = async (value) => {
      await expect(
        page
          .getByLabel('block-item-CollectionField-general-form-general.attachment-attachment')
          .getByRole('link', { name: record.attachment.title })
          .first(),
      ).toHaveJSProperty('offsetWidth', value, { timeout: 1000 });
    };
    try {
      await testDefault(94);
    } catch (error) {
      try {
        await testDefault(95);
      } catch (err) {
        await testDefault(96);
      }
    }

    // 改为大尺寸
    const testLarge = async (value) => {
      await expect(
        page
          .getByLabel('block-item-CollectionField-general-form-general.attachment-attachment')
          .getByRole('link', { name: record.attachment.title })
          .first(),
      ).toHaveJSProperty('offsetWidth', value, { timeout: 1000 });
    };
    await showMenu(page, 'attachment');
    await page.getByRole('menuitem', { name: 'Size' }).click();
    await page.getByRole('option', { name: 'Large' }).click();
    try {
      await testLarge(153);
    } catch (err) {
      try {
        await testLarge(154);
      } catch (err) {
        await testLarge(152);
      }
    }

    // 改为小尺寸
    const testSmall = async (value) => {
      await expect(
        page
          .getByLabel('block-item-CollectionField-general-form-general.attachment-attachment')
          .getByRole('link', { name: record.attachment.title })
          .first(),
      ).toHaveJSProperty('offsetWidth', value, { timeout: 1000 });
    };
    await showMenu(page, 'attachment');
    await page.getByRole('menuitem', { name: 'Size' }).click();
    await page.getByRole('option', { name: 'Small' }).click();
    try {
      await testSmall(25);
    } catch (err) {
      try {
        await testSmall(26);
      } catch (err) {
        await testSmall(24);
      }
    }
  });
});

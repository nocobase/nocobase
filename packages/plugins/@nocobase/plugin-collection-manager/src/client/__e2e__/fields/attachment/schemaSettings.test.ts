import {
  Page,
  expect,
  expectSettingsMenu,
  oneTableBlockWithAddNewAndViewAndEditAndMediaFields,
  test,
} from '@nocobase/test/e2e';
import { createColumnItem, showSettingsMenu, testPattern } from '../../utils';

test.describe('form item & create form', () => {
  test('supported options', async ({ page, mockPage }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndMediaFields).waitForInit();
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByRole('button', { name: 'Add new' }).click();
        await page.getByLabel(`block-item-CollectionField-general-form-general.attachment-attachment`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.attachment`)
          .hover();
      },
      supportedOptions: ['Edit field title', 'Display title', 'Edit description', 'Required', 'Pattern', 'Delete'],
    });
  });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    await testPattern({
      page,
      gotoPage: async () => {
        await mockPage(oneTableBlockWithAddNewAndViewAndEditAndMediaFields).goto();
      },
      openDialog: async () => {
        await page.getByRole('button', { name: 'Add new' }).click();
      },
      showMenu: async () => {
        await page
          .getByLabel(`block-item-CollectionField-general-form-general.attachment-attachment`, { exact: true })
          .hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.attachment`, {
            exact: true,
          })
          .hover();
      },
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

test.describe('form item & edit form', () => {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndMediaFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();
    await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
    await page
      .getByLabel(`block-item-CollectionField-general-form-general.attachment-attachment`, { exact: true })
      .hover();
    await page
      .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.attachment`, {
        exact: true,
      })
      .hover();

    await expectSettingsMenu({
      page,
      showMenu: async () => {},
      supportedOptions: ['Edit field title', 'Display title', 'Edit description', 'Required', 'Pattern', 'Delete'],
      unsupportedOptions: ['Set default value'],
    });
  });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    let record = null;
    await testPattern({
      page,
      gotoPage: async () => {
        record = await (async (mockPage, mockRecord) => {
          const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndMediaFields).waitForInit();
          const record = await mockRecord('general');
          await nocoPage.goto();

          return record;
        })(mockPage, mockRecord);
      },
      openDialog: () =>
        (async (page: Page) => {
          await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
        })(page),
      showMenu: () =>
        (async (page: Page, fieldName: string) => {
          await page
            .getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`, { exact: true })
            .hover();
          await page
            .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`, {
              exact: true,
            })
            .hover();
        })(page, 'attachment'),
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

test.describe('form item & view form', () => {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndMediaFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();
        await page.getByLabel(`block-item-CollectionField-general-form-general.attachment-attachment`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.attachment`)
          .hover();
      },
      supportedOptions: ['Edit field title', 'Display title', 'Delete', 'Edit tooltip', 'Size'],
      unsupportedOptions: ['Set default value'],
    });
  });

  test('size', async ({ page, mockPage, mockRecord }) => {
    const record = await (async (mockPage, mockRecord) => {
      const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndMediaFields).waitForInit();
      const record = await mockRecord('general');
      await nocoPage.goto();

      return record;
    })(mockPage, mockRecord);
    await (async (page: Page) => {
      await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();
    })(page);

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
    await (async (page: Page, fieldName: string) => {
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
    })(page, 'attachment');
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
    await (async (page: Page, fieldName: string) => {
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
    })(page, 'attachment');
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

test.describe('form item & filter form', () => {
  test('supported options', async ({ page }) => {});
});

test.describe('table column & table', () => {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndMediaFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await createColumnItem(page, 'attachment');
        await showSettingsMenu(page, 'attachment');
      },
      supportedOptions: ['Custom column title', 'Column width', 'Delete'],
    });
  });
});

test.describe('table column & table & record picker', () => {
  test('supported options', async ({ page }) => {});
});

test.describe('table column & table & Relationship block', () => {
  test('supported options', async ({ page }) => {});
});

test.describe('table column & sub table & create from', () => {
  test('supported options', async ({ page }) => {});
});

test.describe('table column & sub table & edit from', () => {
  test('supported options', async ({ page }) => {});
});

test.describe('table column & sub table & view from', () => {
  test('supported options', async ({ page }) => {});
});

import {
  expect,
  expectSettingsMenu,
  oneEmptyFilterFormBlock,
  oneFormAndOneTableWithSameCollection,
  test,
} from '@nocobase/test/e2e';

test.describe('filter block schema settings', () => {
  test('supported options', async ({ page, mockPage }) => {
    await mockPage(oneEmptyFilterFormBlock).goto();

    await expectSettingsMenu({
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

  test.describe('connect data blocks', () => {
    test('connecting two blocks of the same collection', async ({ page, mockPage, mockRecords }) => {
      const nocoPage = await mockPage(oneFormAndOneTableWithSameCollection).waitForInit();
      const records = await mockRecords('general', 3);
      await nocoPage.goto();

      // 将上面的 Form 连接到下面的 Table
      await page.getByLabel('block-item-CardItem-general-filter-form').hover();
      await page.getByLabel('designer-schema-settings-CardItem-FormV2.FilterDesigner-general').hover();
      await page.getByRole('menuitem', { name: 'Connect data blocks' }).hover();
      await page.getByRole('menuitem', { name: 'General' }).click();

      // 输入值，点击筛选按钮
      await page
        .getByLabel('block-item-CollectionField-general-filter-form-general.singleLineText-singleLineText')
        .getByRole('textbox')
        .click();
      await page
        .getByLabel('block-item-CollectionField-general-filter-form-general.singleLineText-singleLineText')
        .getByRole('textbox')
        .fill(records[0].singleLineText);

      // 点击筛选按钮
      await page.getByLabel('action-Action-Filter records-submit-general-filter-form').click();

      await expect(
        page.getByLabel('block-item-CardItem-general-table').getByRole('row', { name: records[1].singleLineText }),
      ).toBeHidden();
      await expect(
        page.getByLabel('block-item-CardItem-general-table').getByRole('row', { name: records[2].singleLineText }),
      ).toBeHidden();
      await expect(
        page.getByLabel('block-item-CardItem-general-table').getByRole('row', { name: records[0].singleLineText }),
      ).toBeVisible();

      // 点击重置按钮
      await page.getByLabel('action-Action-Reset records-general-filter-form').click();
      await expect(
        page.getByLabel('block-item-CardItem-general-table').getByRole('row', { name: records[1].singleLineText }),
      ).toBeVisible();
      await expect(
        page.getByLabel('block-item-CardItem-general-table').getByRole('row', { name: records[2].singleLineText }),
      ).toBeVisible();
      await expect(
        page.getByLabel('block-item-CardItem-general-table').getByRole('row', { name: records[0].singleLineText }),
      ).toBeVisible();
    });
  });
});

test.describe('actions schema settings', () => {
  test('supported options', async ({ page, mockPage }) => {
    await mockPage(oneEmptyFilterFormBlock).goto();

    // 创建 Filter & Reset 两个按钮
    await page.getByLabel('schema-initializer-ActionBar-filterForm:configureActions-general').hover();
    await page.getByRole('menuitem', { name: 'Filter' }).click();
    await page.getByRole('menuitem', { name: 'Reset' }).click();

    // Filter settings -------------------------------------------------------------------
    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('action-Action-Filter-submit-general-filter-form').hover();
        await page.getByRole('button', { name: 'designer-schema-settings-Action' }).hover();
      },
      supportedOptions: ['Edit button', 'Delete'],
    });

    // Reset settings --------------------------------------------------------------------
    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('action-Action-Reset-general-filter-form').hover();
        await page.getByRole('button', { name: 'designer-schema-settings-Action' }).hover();
      },
      supportedOptions: ['Edit button', 'Delete'],
    });
  });
});

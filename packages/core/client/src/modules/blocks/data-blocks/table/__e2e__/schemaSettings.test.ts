/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  Page,
  expect,
  expectSettingsMenu,
  expectSupportedVariables,
  oneEmptyTableBlockWithActions,
  oneEmptyTableWithTreeCollection,
  oneTableBlockWithAddNewAndViewAndEditAndBasicFields,
  test,
} from '@nocobase/test/e2e';
import { T3843, oneTableWithColumnFixed, oneTableWithUpdateRecord } from './templatesOfBug';

const addSomeCustomActions = async (page: Page) => {
  // 先删除掉之前的 actions
  const deleteAction = async (name: string) => {
    await page.getByLabel(`action-Action.Link-${name}-`).hover();
    await page.getByRole('button', { name: 'designer-schema-settings-Action.Link-Action.Designer-general' }).hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
  };

  await deleteAction('View');
  await deleteAction('Edit');
  await deleteAction('Delete');
  await deleteAction('Duplicate');

  // 再增加两个自定义的 actions
  await page.getByRole('button', { name: 'Actions', exact: true }).hover();
  await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-general').hover();
  await page.getByRole('menuitem', { name: 'Popup' }).click();
  await page.getByRole('menuitem', { name: 'Update record' }).click();
};

test.describe('actions schema settings', () => {
  test.describe('add new', () => {
    const showMenu = async (page: Page) => {
      await page.getByRole('button', { name: 'Add new' }).hover();
      await page.getByRole('button', { name: 'designer-schema-settings-Action-Action.Designer-general' }).hover();
    };

    test('supported options', async ({ page, mockPage, mockRecord }) => {
      await mockPage(oneEmptyTableBlockWithActions).goto();

      await expectSettingsMenu({
        page,
        showMenu: () => showMenu(page),
        supportedOptions: ['Edit button', 'Open mode', 'Popup size', 'Delete'],
      });
    });

    test('edit button', async ({ page, mockPage, mockRecord }) => {
      await mockPage(oneEmptyTableBlockWithActions).goto();

      await showMenu(page);
      await page.getByRole('menuitem', { name: 'Edit button' }).click();
      await page.getByLabel('block-item-Input-general-').getByRole('textbox').click();
      await page.getByLabel('block-item-Input-general-').getByRole('textbox').fill('1234');
      await page.getByRole('button', { name: 'OK', exact: true }).click();

      await expect(page.getByRole('button', { name: '1234' })).toBeVisible();
    });

    test('open mode', async ({ page, mockPage, mockRecord }) => {
      await mockPage(oneEmptyTableBlockWithActions).goto();
      await showMenu(page);

      // 默认是 drawer
      await expect(page.getByRole('menuitem', { name: 'Open mode' }).getByText('Drawer')).toBeVisible();

      // 切换为 dialog
      await page.getByRole('menuitem', { name: 'Open mode' }).click();
      await page.getByRole('option', { name: 'Dialog' }).click();

      await page.getByRole('button', { name: 'Add new' }).click();
      await expect(page.getByTestId('modal-Action.Container-general-Add record')).toBeVisible();
    });

    test('popup size', async ({ page, mockPage, mockRecord }) => {
      await mockPage(oneEmptyTableBlockWithActions).goto();

      await showMenu(page);
      // 默认值 middle
      await expect(page.getByRole('menuitem', { name: 'Popup size' }).getByText('Middle')).toBeVisible();

      // 切换为 small
      await page.getByRole('menuitem', { name: 'Popup size' }).click();
      await page.getByRole('option', { name: 'Small' }).click();

      await page.getByRole('button', { name: 'Add new' }).click();
      const drawerWidth =
        (await page.getByTestId('drawer-Action.Container-general-Add record').boundingBox())?.width || 0;
      expect(drawerWidth).toBeLessThanOrEqual(400);

      await page.getByLabel('drawer-Action.Container-general-Add record-mask').click();

      // 切换为 large
      await showMenu(page);
      await page.getByRole('menuitem', { name: 'Popup size' }).click();
      await page.getByRole('option', { name: 'Large' }).click();

      await page.getByRole('button', { name: 'Add new' }).click();
      const drawerWidth2 =
        (await page.getByTestId('drawer-Action.Container-general-Add record').boundingBox())?.width || 0;
      expect(drawerWidth2).toBeGreaterThanOrEqual(800);
    });

    test('delete', async ({ page, mockPage, mockRecord }) => {
      await mockPage(oneEmptyTableBlockWithActions).goto();

      await showMenu(page);
      await page.getByRole('menuitem', { name: 'Delete' }).click();
      await page.mouse.move(300, 0);
      await page.getByRole('button', { name: 'OK', exact: true }).click();

      await expect(page.getByRole('button', { name: 'Add new' })).toBeHidden();
    });
  });

  test.describe('bulk delete', () => {
    test('supported options', async ({ page, mockPage }) => {
      await mockPage(oneEmptyTableBlockWithActions).goto();

      await expectSettingsMenu({
        page,
        showMenu: async () => {
          await page.getByRole('button', { name: 'Delete' }).hover();
          await page.getByRole('button', { name: 'designer-schema-settings-Action-Action.Designer-general' }).hover();
        },
        supportedOptions: ['Edit button', 'Delete'],
      });
    });
  });

  test.describe('filter', () => {
    const showMenu = async (page: Page) => {
      await page.getByRole('button', { name: 'Filter' }).hover();
      await page.getByLabel('designer-schema-settings-Filter.Action-Filter.Action.Designer-general').hover();
    };

    test('supported options', async ({ page, mockPage, mockRecord }) => {
      await mockPage(oneEmptyTableBlockWithActions).goto();

      await expectSettingsMenu({
        page,
        showMenu: () => showMenu(page),
        supportedOptions: [
          'Edit button',
          'Delete',
          'Many to one',
          'One to many',
          'Single select',
          'ID',
          'Created at',
          'Last updated at',
          'Created by',
          'Last updated by',
        ],
      });
    });
  });

  test.describe('delete', () => {
    const showMenu = async (page: Page) => {
      await page.getByLabel('action-Action.Link-Delete-destroy-general-table-0').hover();
      await page.getByRole('button', { name: 'designer-schema-settings-Action.Link-Action.Designer-general' }).hover();
    };

    test('supported options', async ({ page, mockPage, mockRecord }) => {
      const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
      await mockRecord('general');
      await nocoPage.goto();

      await expectSettingsMenu({
        page,
        showMenu: () => showMenu(page),
        supportedOptions: ['Edit button', 'Linkage rules', 'Delete'],
      });
    });

    test('edit button', async ({ page, mockPage, mockRecord }) => {
      const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
      await mockRecord('general');
      await nocoPage.goto();

      await showMenu(page);
      await page.getByRole('menuitem', { name: 'Edit button' }).click();
      await page.getByLabel('block-item-Input-general-').getByRole('textbox').click();
      await page.getByLabel('block-item-Input-general-').getByRole('textbox').fill('Delete record');
      await page.getByRole('button', { name: 'OK', exact: true }).click();

      await expect(page.getByLabel('action-Action.Link-Delete record-destroy-general-table-0')).toBeVisible();
    });
  });

  test.describe('edit', () => {
    const showMenu = async (page: Page) => {
      await page.getByLabel('action-Action.Link-Edit-update-general-table-0').hover();
      await page.getByRole('button', { name: 'designer-schema-settings-Action.Link-Action.Designer-general' }).hover();
    };

    test('supported options', async ({ page, mockPage, mockRecord }) => {
      const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
      await mockRecord('general');
      await nocoPage.goto();

      await expectSettingsMenu({
        page,
        showMenu: () => showMenu(page),
        supportedOptions: ['Edit button', 'Linkage rules', 'Open mode', 'Popup size', 'Delete'],
      });
    });
  });

  test.describe('refresh', () => {
    test('supported options', async ({ page, mockPage }) => {
      await mockPage(oneEmptyTableBlockWithActions).goto();

      await expectSettingsMenu({
        page,
        showMenu: async () => {
          await page.getByRole('button', { name: 'Refresh' }).hover();
          await page.getByRole('button', { name: 'designer-schema-settings-Action-Action.Designer-general' }).hover();
        },
        supportedOptions: ['Edit button', 'Delete'],
      });
    });
  });

  test.describe('view', () => {
    const showMenu = async (page: Page) => {
      await page.getByLabel('action-Action.Link-View-view-general-table-0').hover();
      await page.getByRole('button', { name: 'designer-schema-settings-Action.Link-Action.Designer-general' }).hover();
    };

    test('supported options', async ({ page, mockPage, mockRecord }) => {
      const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
      await mockRecord('general');
      await nocoPage.goto();

      await expectSettingsMenu({
        page,
        showMenu: () => showMenu(page),
        supportedOptions: ['Edit button', 'Linkage rules', 'Open mode', 'Popup size', 'Delete'],
      });
    });

    test('linkage rules', async ({ page, mockPage, mockRecord }) => {
      const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
      await mockRecord('general');
      await nocoPage.goto();

      const openLinkageRules = async () => {
        await page.getByLabel('action-Action.Link-View record-view-general-table-0').hover();
        await page
          .getByRole('button', { name: 'designer-schema-settings-Action.Link-Action.Designer-general' })
          .hover();
        await page.getByRole('menuitem', { name: 'Linkage rules' }).click();
      };

      // 设置第一组规则 --------------------------------------------------------------------------
      await openLinkageRules();
      await page.getByRole('button', { name: 'plus Add linkage rule' }).click();

      // 添加一个条件：ID 等于 1
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('select-filter-field').click();
      await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
      await page.getByRole('spinbutton').click();
      await page.getByRole('spinbutton').fill('1');

      // action: 禁用按钮
      await page.getByText('Add property').click();
      await page.getByLabel('block-item-ArrayCollapse-general').click();
      await page.getByTestId('select-linkage-properties').click();
      await page.getByRole('option', { name: 'Disabled' }).click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();

      await expect(page.getByLabel('action-Action.Link-View record-view-general-table-0')).toHaveAttribute(
        'disabled',
        '',
      );

      // 设置第二组规则 --------------------------------------------------------------------------
      await openLinkageRules();
      await page.getByRole('button', { name: 'plus Add linkage rule' }).click();
      await page.locator('.ant-collapse-header').nth(1).getByRole('img', { name: 'right' }).click();

      // 添加一个条件：ID 等于 1
      await page.getByRole('tabpanel').getByText('Add condition', { exact: true }).click();
      await page.getByRole('button', { name: 'Select field' }).click();
      await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
      await page.getByRole('spinbutton').click();
      await page.getByRole('spinbutton').fill('1');

      // action: 使按钮可用
      await page.getByRole('tabpanel').getByText('Add property').click();
      await page.locator('.ant-select', { hasText: 'action' }).click();
      await page.getByRole('option', { name: 'Enabled' }).click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();

      // 后面的 action 会覆盖前面的
      await expect(page.getByLabel('action-Action.Link-View record-view-general-table-0')).not.toHaveAttribute(
        'disabled',
        '',
      );
    });
  });

  test.describe('popup', () => {
    const showMenu = async (page: Page) => {
      await page.getByLabel('action-Action.Link-Popup-customize:popup-general-table-0').hover();
      await page
        .getByRole('button', { name: 'designer-schema-settings-Action.Link-actionSettings:popup-general' })
        .hover();
    };

    test('supported options', async ({ page, mockPage, mockRecord }) => {
      const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
      await mockRecord('general');
      await nocoPage.goto();
      await addSomeCustomActions(page);

      await showMenu(page);
      await expectSettingsMenu({
        page,
        showMenu: () => showMenu(page),
        supportedOptions: ['Edit button', 'Linkage rules', 'Open mode', 'Popup size', 'Delete'],
      });
    });
  });

  test.describe('duplicate', () => {
    const showMenu = async (page: Page) => {
      await page.getByLabel('action-Action.Link-Duplicate-duplicate-general-table-0').hover();
      await page.getByRole('button', { name: 'designer-schema-settings-Action.Link-Action.Designer-general' }).hover();
    };

    test('supported options', async ({ page, mockPage, mockRecord }) => {
      const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
      await mockRecord('general');
      await nocoPage.goto();

      await expectSettingsMenu({
        page,
        showMenu: () => showMenu(page),
        supportedOptions: ['Edit button', 'Linkage rules', 'Duplicate mode', 'Open mode', 'Popup size', 'Delete'],
      });
    });
  });

  test.describe('update record', () => {
    const showMenu = async (page: Page) => {
      await page.getByLabel('action-Action.Link-Update record-customize:update-general-table-0').hover();
      await page
        .getByRole('button', { name: 'designer-schema-settings-Action.Link-actionSettings:updateRecord-general' })
        .hover();
    };

    test('supported options', async ({ page, mockPage, mockRecord }) => {
      const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
      await mockRecord('general');
      await nocoPage.goto();
      await addSomeCustomActions(page);

      await showMenu(page);
      await expectSettingsMenu({
        page,
        showMenu: () => showMenu(page),
        supportedOptions: [
          'Edit button',
          'Linkage rules',
          'Assign field values',
          'After successful submission',
          'Delete',
        ],
      });
    });

    test('Assign field values', async ({ page, mockPage, mockRecord }) => {
      const nocoPage = await mockPage(oneTableWithUpdateRecord).waitForInit();
      await mockRecord('users2');
      await nocoPage.goto();

      const openPopup = async () => {
        if (!(await page.getByLabel('action-Action.Link-Update record-customize:update-users2-table-0').isVisible())) {
          await page.getByRole('button', { name: 'Actions', exact: true }).hover();
          await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-users2').hover();
          await page.getByRole('menuitem', { name: 'Update record' }).click();
        }

        await page.getByLabel('action-Action.Link-Update record-customize:update-users2-table-0').hover();
        await page
          .getByLabel('designer-schema-settings-Action.Link-actionSettings:updateRecord-users2')
          .first()
          .hover();
        await page.getByRole('menuitem', { name: 'Assign field values' }).click();

        if (!(await page.getByLabel('block-item-AssignedField-').getByRole('textbox').isVisible())) {
          await page.getByLabel('schema-initializer-Grid-assignFieldValuesForm:configureFields-users').hover();
          await page.getByRole('menuitem', { name: 'Nickname' }).click();
        }
      };

      const expectNewValue = async (value: string) => {
        await page.getByLabel('action-Action.Link-Update record-customize:update-users2-table-0').click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.getByLabel('action-Action-Refresh-refresh').click();
        await expect(page.getByLabel('block-item-CardItem-users2-').getByText(value)).toBeVisible();
      };

      // 1. 打开 Assign field values 配置弹窗
      await openPopup();

      // 2. 将 Nickname 字段的值设置为 `123456`
      await page.getByLabel('block-item-AssignedField-').getByRole('textbox').click();
      await page.getByLabel('block-item-AssignedField-').getByRole('textbox').fill('123456');
      await page.getByRole('button', { name: 'Submit' }).click();

      // 3. 保存后点击 Save record 按钮，然后刷新表格，应该显示一条 Nickname 为 “123456” 的记录
      await expectNewValue('123456');

      // 4. 再次打开 Assign field values 配置弹窗，这次为 Nickname 设置一个变量值（Current role）
      await openPopup();
      await page.getByLabel('variable-button').click();
      await expectSupportedVariables(page, [
        'Constant',
        'Current user',
        'Current role',
        'Date variables',
        'Current record',
      ]);
      await page.getByRole('menuitemcheckbox', { name: 'Current role' }).click();
      await page.getByRole('button', { name: 'Submit' }).click();

      // 5. 保存后点击 Save record 按钮，然后刷新表格，应该显示一条 Nickname 为 “root” 的记录
      await expectNewValue('root');
    });
  });

  test.describe('add child', () => {
    const showMenu = async (page: Page) => {
      await page.getByLabel('action-Action.Link-Add child-create-treeCollection-table-0').hover();
      await page.getByLabel('designer-schema-settings-Action.Link-actionSettings:addChild-tree').hover();
    };

    test('supported options', async ({ page, mockPage, mockRecord }) => {
      const nocoPage = await mockPage(oneEmptyTableWithTreeCollection).waitForInit();
      await nocoPage.goto();
      await page.getByLabel('block-item-CardItem-treeCollection-table').hover();

      // 添加一行数据
      // TODO: 使用 mockRecord 为 tree 表添加一行数据无效
      await page.getByLabel('schema-initializer-ActionBar-table:configureActions-treeCollection').hover();
      await page.getByRole('menuitem', { name: 'Add new' }).click();
      await page.getByRole('button', { name: 'Add new' }).click();
      await page.getByLabel('schema-initializer-Grid-popup:addNew:addBlock-treeCollection').hover();
      await page.getByRole('menuitem', { name: 'form Form' }).hover();
      await page.getByRole('menuitem', { name: 'Current collection' }).click();
      await page.mouse.move(300, 0);
      await page.getByLabel('schema-initializer-ActionBar-createForm:configureActions-treeCollection').hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();
      await page.mouse.move(300, 0);
      await page.getByRole('button', { name: 'Submit' }).click();

      await page.getByLabel('designer-schema-settings-CardItem-TableBlockDesigner-treeCollection').hover();
      await page.getByRole('menuitem', { name: 'Tree table' }).click();

      // 添加 add child 按钮
      await page.getByRole('button', { name: 'Actions', exact: true }).hover();
      await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-tree').hover();
      await page.getByRole('menuitem', { name: 'Add child' }).click();

      await expectSettingsMenu({
        page,
        showMenu: () => showMenu(page),
        supportedOptions: ['Edit button', 'Linkage rules', 'Open mode', 'Popup size', 'Delete'],
      });

      // https://nocobase.height.app/T-3235
      // add child 表单中的 Parent 字段应该有数据
      await page.getByLabel('action-Action.Link-Add child-').click({
        position: { x: 5, y: 5 }, // 防止按钮被遮挡
      });
      await page.getByLabel('schema-initializer-Grid-popup').hover();
      await page.getByRole('menuitem', { name: 'form Form' }).hover();
      await page.getByRole('menuitem', { name: 'Current collection' }).click();
      await page.mouse.move(300, 0);
      await page.getByLabel('schema-initializer-Grid-form:').hover();
      await page.getByRole('menuitem', { name: 'Parent', exact: true }).click();
      await page.mouse.move(300, 0);
      await expect(
        page
          .getByLabel('block-item-CollectionField-')
          .getByTestId('select-object-single')
          .getByText('1', { exact: true }),
      ).toBeVisible();
    });
  });

  test.describe('add record', () => {
    const showMenu = async (page: Page) => {
      await page.getByRole('button', { name: 'Add record' }).hover();
      await page.getByRole('button', { name: 'designer-schema-settings-Action-Action.Designer-general' }).hover();
    };

    test('supported options', async ({ page, mockPage, mockRecord }) => {
      await mockPage(oneEmptyTableBlockWithActions).goto();

      await expectSettingsMenu({
        page,
        showMenu: () => showMenu(page),
        supportedOptions: ['Edit button', 'Open mode', 'Popup size', 'Delete'],
      });
    });
  });
});

test.describe('table column schema settings', () => {
  // https://nocobase.height.app/T-3843
  test('set data scope', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(T3843).waitForInit();
    const record1 = await mockRecord('collection1');
    await nocoPage.goto();

    // 1. 关系字段下拉框中应该有数据
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByTestId('select-object-multiple').click();
    await expect(page.getByRole('option', { name: record1.singleLineText, exact: true })).toBeVisible();

    // 2. 为该关系字段设置一个数据范围后，下拉框中应该有一个匹配项
    await page.getByRole('button', { name: 'manyToMany1', exact: true }).hover();
    await page.getByLabel('designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-collection2').hover();
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByRole('menuitemcheckbox', { name: 'ID' }).click();
    await page.getByRole('spinbutton').click();
    await page.getByRole('spinbutton').fill('1');
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.reload();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByTestId('select-object-multiple').click();
    await expect(page.getByRole('option', { name: record1.singleLineText, exact: true })).toBeVisible();
  });

  test('fixed column', async ({ page, mockPage }) => {
    const nocoPage = await mockPage(oneTableWithColumnFixed).waitForInit();
    await nocoPage.goto();
    await expect(page.getByRole('button', { name: 'Roles' })).toBeVisible();
    const element = await page.getByRole('button', { name: 'Roles' });
    const hasClassName = await element.evaluate((el) =>
      el.parentElement.parentElement.className.includes('ant-table-cell-fix-left'),
    );

    await expect(hasClassName).toBe(true);
    //取消固定
    await page.getByRole('button', { name: 'Roles' }).hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-users' })
      .hover();
    await page.getByTestId('schema-settings-menu').getByText('FixedLeft fixed').click();
    await page.getByText('Not fixed').click();
    const hasClassName1 = await element.evaluate((el) =>
      el.parentElement.parentElement.className.includes('ant-table-cell-fix-left'),
    );

    await expect(hasClassName1).toBe(false);
  });
});

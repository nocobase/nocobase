import {
  Page,
  expect,
  expectSettingsMenu,
  oneEmptyTableBlockWithActions,
  oneEmptyTableWithTreeCollection,
  oneTableBlockWithActionsAndFormBlocks,
  oneTableBlockWithAddNewAndViewAndEditAndBasicFields,
  test,
  twoTableWithAssociationFields,
  twoTableWithSameCollection,
} from '@nocobase/test/e2e';

test.describe('table block schema settings', () => {
  test('supported options', async ({ page, mockPage }) => {
    await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).goto();

    await expectSettingsMenu({
      page,
      showMenu: () => showSettingsMenu(page),
      supportedOptions: [
        'Edit block title',
        'Enable drag and drop sorting',
        'Fix block',
        'Set the data scope',
        'Records per page',
        'Connect data blocks',
        'Save as template',
        'Delete',
      ],
    });
  });

  test('fix block', async ({ page, mockPage }) => {
    await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).goto();

    const tableSize = await page.getByLabel('block-item-CardItem-general-table').boundingBox();

    await showSettingsMenu(page);
    await page.getByRole('menuitem', { name: 'Fix block' }).click();
    await expect(page.getByRole('menuitem', { name: 'Fix block' }).getByRole('switch')).toBeChecked();

    // 等待页面重新渲染
    await page.waitForTimeout(1000);
    const fixedTableSize = await page.getByLabel('block-item-CardItem-general-table').boundingBox();
    expect(fixedTableSize.height).toBeGreaterThan(570);
    expect(fixedTableSize.height).toBeLessThan(575);

    // 取消固定
    await page.getByRole('menuitem', { name: 'Fix block' }).click();
    await expect(page.getByRole('menuitem', { name: 'Fix block' }).getByRole('switch')).not.toBeChecked();

    // 等待页面重新渲染
    await page.waitForTimeout(100);
    const unfixedTableSize = await page.getByLabel('block-item-CardItem-general-table').boundingBox();

    expect(unfixedTableSize.height).toBe(tableSize.height);
  });

  test('records per page', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecords('general', 40);
    await nocoPage.goto();

    // 默认每页显示 20 条（算上顶部 head 一共 21 行）
    await expect(page.getByRole('row')).toHaveCount(21);
    // 底部 pagination 的显示布局：[Total 40 items] [1] [2] [20 / page]
    await expect(page.locator('.ant-pagination')).toHaveText('Total 40 items1220 / page');

    await showSettingsMenu(page);
    await page.getByRole('menuitem', { name: 'Records per page' }).click();
    await page.getByRole('option', { name: '10', exact: true }).click();

    await expect(page.getByRole('row')).toHaveCount(11);
    // 底部 pagination 的显示布局：[Total 40 items] [1] [2] [3] [4] [10 / page]
    await expect(page.locator('.ant-pagination')).toHaveText('Total 40 items123410 / page');
  });

  test.describe('enable drag and drop sorting', () => {
    // 该用例在 CI 并发环境下容易报错，原因未知，通过增加重试次数可以解决
    test.describe.configure({ retries: process.env.CI ? 4 : 0 });
    test('enable drag and drop sorting', async ({ page, mockPage, mockRecords }) => {
      const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
      const records = await mockRecords('general', 3);
      await nocoPage.goto();

      await page.getByLabel('block-item-CardItem-general-table').hover();
      await page.getByLabel('designer-schema-settings-CardItem-TableBlockDesigner-general').hover();

      // 默认是关闭状态
      await expect(
        page.getByRole('menuitem', { name: 'Enable drag and drop sorting' }).getByRole('switch'),
      ).not.toBeChecked();

      // 开启之后，隐藏 Set default sorting rules 选项
      await page.getByRole('menuitem', { name: 'Enable drag and drop sorting' }).click();
      await page.getByText('Drag and drop sorting field').click();
      await page.getByText('sort', { exact: true }).click();
      await expect(
        page.getByRole('menuitem', { name: 'Enable drag and drop sorting' }).getByRole('switch'),
      ).toBeChecked();
      await expect(page.getByRole('menuitem', { name: 'Set default sorting rules' })).toBeHidden();
      // 显示出来 email 和 ID
      await page.getByLabel('schema-initializer-TableV2-table:configureColumns-general').hover();
      await page.getByRole('menuitem', { name: 'email' }).click();
      await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
      await page.getByLabel('schema-initializer-TableV2-').click();

      await page.mouse.move(300, 0);

      // 默认的排序
      let email1 = await page.getByText(records[0].email).boundingBox();
      let email2 = await page.getByText(records[1].email).boundingBox();
      let email3 = await page.getByText(records[2].email).boundingBox();

      expect(email1.y).toBeLessThan(email2.y);
      expect(email2.y).toBeLessThan(email3.y);

      // 将第二行拖动到第一行
      await page
        .getByLabel('table-index-2')
        .getByRole('img', { name: 'menu' })
        .dragTo(page.getByLabel('table-index-1').getByRole('img', { name: 'menu' }));

      await page.reload();

      email1 = await page.getByText(records[0].email).boundingBox();
      email2 = await page.getByText(records[1].email).boundingBox();
      email3 = await page.getByText(records[2].email).boundingBox();

      expect(email2.y).toBeLessThan(email1.y);
      expect(email1.y).toBeLessThan(email3.y);
    });
  });

  test.describe('set the data scope', () => {
    async function showDialog(page: Page) {
      await page.getByLabel('block-item-CardItem-general-table').hover();
      await page.getByLabel('designer-schema-settings-CardItem-TableBlockDesigner-general').hover();
      await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    }

    async function createColumnItem(page: Page, fieldName: string) {
      await page.getByLabel('schema-initializer-TableV2-table:configureColumns-general').hover();
      await page.getByRole('menuitem', { name: fieldName, exact: true }).click();
      await page.mouse.move(300, 0);
    }

    test('use constants', async ({ page, mockRecords, mockPage }) => {
      const nocoPage = await mockPage(oneTableBlockWithActionsAndFormBlocks).waitForInit();
      await mockRecords('general', 3);
      await nocoPage.goto();
      await createColumnItem(page, 'ID');

      await showDialog(page);

      // 添加一个 ID 为 1 的条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('select-filter-field').click();
      await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
      await page.getByRole('spinbutton').click();
      await page.getByRole('spinbutton').fill('1');
      await page.getByRole('button', { name: 'OK', exact: true }).click();

      // 被筛选之后数据只有一条（有一行是空的）
      await expect(page.getByRole('row')).toHaveCount(2);
      // 有一行 id 为 1 的数据
      await expect(page.getByRole('cell', { name: '1', exact: true })).toBeVisible();
    });

    test('use variable called current user', async ({ page, mockPage, mockRecords }) => {
      const nocoPage = await mockPage(oneTableBlockWithActionsAndFormBlocks).waitForInit();
      // Super Admin 是当前的用户的名字
      await mockRecords('general', [{ singleLineText: 'Super Admin' }, {}, {}]);
      await nocoPage.goto();
      await createColumnItem(page, 'singleLineText');

      await showDialog(page);

      // 添加一个 singleLineText 为 current user 的 Nickname 的条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('select-filter-field').click();
      await page.getByRole('menuitemcheckbox', { name: 'singleLineText' }).click();
      await page.getByLabel('variable-button').click();
      await page.getByRole('menuitemcheckbox', { name: 'Current user' }).click();
      await page.getByRole('menuitemcheckbox', { name: 'Nickname' }).click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();

      // 被筛选之后数据只有一条（有一行是空的）
      await expect(page.getByRole('row')).toHaveCount(2);
      await expect(page.getByRole('cell', { name: 'Super Admin', exact: true })).toBeVisible();
    });
  });

  test.describe('set default sorting rules', () => {
    // 该用例在 CI 并发环境下容易报错，原因未知，通过增加重试次数可以解决
    test.describe.configure({ retries: process.env.CI ? 4 : 0 });
    test('set default sorting rules', async ({ page, mockPage, mockRecords }) => {
      const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
      const records = await mockRecords('general', 3);
      await nocoPage.goto();

      // 打开配置弹窗
      await page.getByLabel('block-item-CardItem-general-table').hover();
      await page.getByLabel('designer-schema-settings-CardItem-TableBlockDesigner-general').hover();
      await page.getByRole('menuitem', { name: 'Set default sorting rules' }).click();

      // 设置一个按 ID 降序的规则
      await page.getByRole('button', { name: 'plus Add sort field' }).click();
      await page.getByTestId('select-single').click();
      await page.getByRole('option', { name: 'ID', exact: true }).click();
      await page.getByText('DESC', { exact: true }).click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();

      // 显示出来 email 和 ID
      await page.getByLabel('schema-initializer-TableV2-table:configureColumns-general').hover();
      await page.getByRole('menuitem', { name: 'email' }).click();
      await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
      await page.mouse.move(300, 0);

      // 规则生效后的顺序：3，2，1
      const email1 = await page.getByText(records[0].email).boundingBox();
      const email2 = await page.getByText(records[1].email).boundingBox();
      const email3 = await page.getByText(records[2].email).boundingBox();

      expect(email3.y).toBeLessThan(email2.y);
      expect(email2.y).toBeLessThan(email1.y);
    });
  });

  test.describe('connect data blocks', () => {
    test('connecting two blocks of the same collection', async ({ page, mockPage, mockRecords }) => {
      const nocoPage = await mockPage(twoTableWithSameCollection).waitForInit();
      const records = await mockRecords('users', 3);
      await nocoPage.goto();

      // 将左边的 Table 连接到右边的 Table
      await page.getByLabel('block-item-CardItem-users-table').first().hover();
      await page.getByRole('button', { name: 'designer-schema-settings-CardItem-TableBlockDesigner-users' }).hover();
      await page.getByRole('menuitem', { name: 'Connect data blocks' }).hover();
      await page.getByRole('menuitem', { name: 'Users' }).click();

      // 点击左边 Table 的某一行，右边 Table 的数据会被筛选为当前点中行的数据
      await page.getByLabel('block-item-CardItem-users-table').nth(0).getByText('Super Admin').click();
      await expect(
        page.getByLabel('block-item-CardItem-users-table').nth(1).getByText(records[0].nickname),
      ).toBeHidden();
      await expect(
        page.getByLabel('block-item-CardItem-users-table').nth(1).getByText(records[1].nickname),
      ).toBeHidden();
      await expect(
        page.getByLabel('block-item-CardItem-users-table').nth(1).getByText(records[2].nickname),
      ).toBeHidden();
      await expect(page.getByLabel('block-item-CardItem-users-table').nth(1).getByText('Super Admin')).toBeVisible();
    });

    test('connecting two blocks connected by a relationship field', async ({ page, mockPage, mockRecords }) => {
      const nocoPage = await mockPage(twoTableWithAssociationFields).waitForInit();
      await mockRecords('users', 3);
      await nocoPage.goto();

      // 将左边的 Table 连接到右边的 Table
      await page.getByLabel('block-item-CardItem-roles-table').hover();
      await page.getByRole('button', { name: 'designer-schema-settings-CardItem-TableBlockDesigner-roles' }).hover();
      await page.getByRole('menuitem', { name: 'Connect data blocks' }).hover();
      await page.getByRole('menuitem', { name: 'Users' }).click();
      await page.getByRole('option', { name: 'Roles' }).click();

      // 点击左边 Table 的某一行
      await page.getByLabel('block-item-CardItem-roles-table').getByRole('cell', { name: 'Root', exact: true }).click();
      await expect(
        page.getByLabel('block-item-CardItem-users-table').getByRole('row').filter({ hasNotText: 'Root' }),
      ).toHaveCount(1, {
        timeout: 1000 * 10,
      });
      await expect(page.getByLabel('block-item-CardItem-users-table').getByRole('row', { name: 'Root' })).toBeVisible();

      // 再次点击，会取消筛选效果
      await page.getByLabel('block-item-CardItem-roles-table').getByRole('cell', { name: 'Root', exact: true }).click();
      await expect(
        page.getByLabel('block-item-CardItem-users-table').getByRole('row').filter({ hasNotText: 'Root' }),
      ).toHaveCount(4, {
        timeout: 1000 * 10,
      });
      await expect(page.getByLabel('block-item-CardItem-users-table').getByRole('row', { name: 'Root' })).toBeVisible();
    });

    test('connecting two blocks connected by a foreign key', async ({ page, mockPage, mockRecords }) => {});
  });
});

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
      await page.getByLabel('block-item-Input-general-Button title').getByRole('textbox').click();
      await page.getByLabel('block-item-Input-general-Button title').getByRole('textbox').fill('1234');
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
      await page.getByLabel('block-item-Input-general-Button title').getByRole('textbox').click();
      await page.getByLabel('block-item-Input-general-Button title').getByRole('textbox').fill('Delete record');
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
    const addSomeCustomActions = async (page: Page) => {
      // 先删除掉之前的 actions
      await page.getByRole('button', { name: 'Actions', exact: true }).hover();
      await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-general').hover();
      await page.getByRole('menuitem', { name: 'View' }).click();
      await page.getByRole('menuitem', { name: 'Edit' }).click();
      await page.getByRole('menuitem', { name: 'Delete' }).click();
      await page.getByRole('menuitem', { name: 'Duplicate' }).click();

      // 再增加两个自定义的 actions
      await page.getByRole('menuitem', { name: 'Customize' }).hover();
      await page.getByRole('menuitem', { name: 'Popup' }).click();
      await page.getByRole('menuitem', { name: 'Update record' }).click();
    };

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
    const addSomeCustomActions = async (page: Page) => {
      // 先删除掉之前的 actions
      await page.getByRole('button', { name: 'Actions', exact: true }).hover();
      await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-general').hover();
      await page.getByRole('menuitem', { name: 'View' }).click();
      await page.getByRole('menuitem', { name: 'Edit' }).click();
      await page.getByRole('menuitem', { name: 'Delete' }).click();
      await page.getByRole('menuitem', { name: 'Duplicate' }).click();

      // 再增加两个自定义的 actions
      await page.getByRole('menuitem', { name: 'Customize' }).hover();
      await page.getByRole('menuitem', { name: 'Popup' }).click();
      await page.getByRole('menuitem', { name: 'Update record' }).click();
    };

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
  });

  test.describe('add child', () => {
    const showMenu = async (page: Page) => {
      await page.getByLabel('action-Action.Link-Add child-create-treeCollection-table-0').hover();
      await page.getByLabel('designer-schema-settings-Action.Link-actionSettings:addChild-tree').hover();
    };

    test('supported options', async ({ page, mockPage, mockRecord }) => {
      const nocoPage = await mockPage(oneEmptyTableWithTreeCollection).waitForInit();
      await nocoPage.goto();

      // 添加一行数据
      // TODO: 使用 mockRecord 为 tree 表添加一行数据无效
      await page.getByLabel('schema-initializer-ActionBar-table:configureActions-treeCollection').hover();
      await page.getByRole('menuitem', { name: 'Add new' }).click();
      await page.getByRole('button', { name: 'Add new' }).click();
      await page.getByLabel('schema-initializer-Grid-popup:addNew:addBlock-treeCollection').hover();
      await page.getByRole('menuitem', { name: 'form Form' }).click();
      await page.mouse.move(300, 0);
      await page.getByLabel('schema-initializer-ActionBar-createForm:configureActions-treeCollection').hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();
      await page.mouse.move(300, 0);
      await page.getByRole('button', { name: 'Submit' }).click();

      // 添加 add child 按钮
      await page.getByRole('button', { name: 'Actions', exact: true }).hover();
      await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-tree').hover();
      await page.getByRole('menuitem', { name: 'Add child' }).click();

      await expectSettingsMenu({
        page,
        showMenu: () => showMenu(page),
        supportedOptions: ['Edit button', 'Linkage rules', 'Open mode', 'Popup size', 'Delete'],
      });
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

async function showSettingsMenu(page) {
  await page.getByLabel('block-item-CardItem-general-table').hover();
  await page.getByLabel('designer-schema-settings-CardItem-TableBlockDesigner-general').hover();
}

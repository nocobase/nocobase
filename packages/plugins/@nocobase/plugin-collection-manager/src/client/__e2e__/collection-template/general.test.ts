import { expect, test } from '@nocobase/test/e2e';
import { uid } from '@nocobase/utils';
import { CollectionManagerPage, FieldInterface } from '../utils';

test.describe('create collection', () => {
  test('basic', async ({ page }) => {
    const collectionDisplayName = uid();
    // 避免以数字开头，会报错
    const collectionName = `t_${uid()}`;
    const description = uid();
    const collectionManagerPage = new CollectionManagerPage(page);
    await collectionManagerPage.goto();

    const collectionSettings = await collectionManagerPage.createCollection('General collection');
    await collectionSettings.change('Collection display name', collectionDisplayName);
    await collectionSettings.change('Collection name', collectionName);
    await collectionSettings.change('Description', description);
    await collectionSettings.submit();

    await expect(page.getByRole('cell', { name: collectionDisplayName, exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: collectionName, exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: description, exact: true })).toBeVisible();

    // Delete --------------------------------------------------------------------------------
    await collectionManagerPage.deleteItem(collectionName);
    await expect(page.getByRole('cell', { name: collectionName, exact: true })).toBeHidden();
  });

  test('inherits', async ({ page }) => {
    const collectionDisplayName = uid();
    // 避免以数字开头，会报错
    const collectionName = `t_${uid()}`;
    const description = uid();
    const collectionManagerPage = new CollectionManagerPage(page);
    await collectionManagerPage.goto();

    const collectionSettings = await collectionManagerPage.createCollection('General collection');
    await collectionSettings.change('Collection display name', collectionDisplayName);
    await collectionSettings.change('Collection name', collectionName);
    await collectionSettings.change('Description', description);
    await collectionSettings.change('Inherits', ['Users']);
    await collectionSettings.submit();

    await expect(page.getByRole('cell', { name: collectionDisplayName, exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: collectionName, exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: description, exact: true })).toBeVisible();

    await collectionManagerPage.deleteItem(collectionName);
  });

  test('categories', async ({ page }) => {
    const categoriesName = uid();
    const collectionDisplayName = uid();
    // 避免以数字开头，会报错
    const collectionName = `t_${uid()}`;
    const description = uid();
    const collectionManagerPage = new CollectionManagerPage(page);
    await collectionManagerPage.goto();
    await collectionManagerPage.addCategory(categoriesName, 'Red');

    const collectionSettings = await collectionManagerPage.createCollection('General collection');
    await collectionSettings.change('Collection display name', collectionDisplayName);
    await collectionSettings.change('Collection name', collectionName);
    await collectionSettings.change('Description', description);
    await collectionSettings.change('Categories', [categoriesName]);
    await collectionSettings.submit();

    await expect(page.getByRole('cell', { name: collectionDisplayName, exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: collectionName, exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: description, exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: categoriesName, exact: true })).toBeVisible();

    await collectionManagerPage.deleteCategory(categoriesName);
    await collectionManagerPage.deleteItem(collectionName);
  });

  test('uncheck presetFields', async ({ page }) => {
    const collectionDisplayName = uid();
    // 避免以数字开头，会报错
    const collectionName = `t_${uid()}`;
    const collectionManagerPage = new CollectionManagerPage(page);
    await collectionManagerPage.goto();

    const collectionSettings = await collectionManagerPage.createCollection('General collection');
    await collectionSettings.change('Collection display name', collectionDisplayName);
    await collectionSettings.change('Collection name', collectionName);
    await collectionSettings.change('Primary key, unique identifier, self growth', false);
    await collectionSettings.change('Store the creation user of each record', false);
    await collectionSettings.change('Store the last update user of each record', false);
    await collectionSettings.change('Store the creation time of each record', false);
    await collectionSettings.change('Store the last update time of each record', false);
    await collectionSettings.submit();

    await expect(page.getByRole('cell', { name: collectionDisplayName, exact: true })).toBeVisible();

    await collectionManagerPage.deleteItem(collectionName);
  });
});

// //预设字段
test.describe('create collection with preset fields', () => {
  test('all preset fields by default', async ({ page }) => {
    await page.goto('/admin/settings/data-source-manager/list');
    await page.getByRole('button', { name: 'Configure' }).first().click();
    await page.getByRole('button', { name: 'plus Create collection down' }).click();
    await page.getByRole('menuitem', { name: 'General collection' }).locator('span').click();
    await page.getByLabel('block-item-Input-collections-Collection display name').getByRole('textbox').fill(uid());
    //断言提交的data是否符合预期
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('api/collections:create')),
      page.getByLabel('action-Action-Submit').click(),
    ]);
    const postData = request.postDataJSON();
    //默认提交的数据符合预期
    expect(postData).toMatchObject({
      autoGenId: true,
      createdAt: true,
      createdBy: true,
      updatedAt: true,
      updatedBy: true,
      fields: expect.arrayContaining([
        expect.objectContaining({
          name: 'id',
          type: 'bigInt',
          // 其他属性
        }),
        expect.objectContaining({
          name: 'createdAt',
          type: 'date',
          // 其他属性
        }),
        expect.objectContaining({
          name: 'createdBy',
          type: 'belongsTo',
          // 其他属性
        }),
        expect.objectContaining({
          name: 'updatedBy',
          type: 'belongsTo',
          // 其他属性
        }),
        expect.objectContaining({
          name: 'updatedAt',
          type: 'date',
          // 其他属性
        }),
      ]),
    });
  });

  test('id preset field', async ({ page }) => {
    await page.goto('/admin/settings/data-source-manager/list');
    await page.getByRole('button', { name: 'Configure' }).first().click();
    await page.getByRole('button', { name: 'plus Create collection down' }).click();
    await page.getByRole('menuitem', { name: 'General collection' }).locator('span').click();
    await page.getByLabel('block-item-Input-collections-Collection display name').getByRole('textbox').fill(uid());
    await page.locator('.ant-drawer-content-wrapper .ant-table-container .ant-table-selection-column').first().hover();
    await page.locator('.ant-drawer-content-wrapper .ant-table-container .ant-table-selection-column').first().click();
    await page.getByRole('row', { name: 'ID Integer Primary key' }).locator('.ant-checkbox-input').check();
    //断言提交的data是否符合预期
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('api/collections:create')),
      page.getByLabel('action-Action-Submit').click(),
    ]);
    const postData = request.postDataJSON();
    //提交的数据符合预期
    expect(postData).toMatchObject({
      autoGenId: true,
      createdAt: false,
      createdBy: false,
      updatedAt: false,
      updatedBy: false,
      fields: expect.arrayContaining([
        expect.objectContaining({
          name: 'id',
          type: 'bigInt',
          // 其他属性
        }),
      ]),
    });
  });
  test('createdAt preset field', async ({ page }) => {
    await page.goto('/admin/settings/data-source-manager/list');
    await page.getByRole('button', { name: 'Configure' }).first().click();
    await page.getByRole('button', { name: 'plus Create collection down' }).click();
    await page.getByRole('menuitem', { name: 'General collection' }).locator('span').click();
    await page.getByLabel('block-item-Input-collections-Collection display name').getByRole('textbox').fill(uid());
    await page.locator('.ant-drawer-content-wrapper .ant-table-container .ant-table-selection-column').first().hover();
    await page.locator('.ant-drawer-content-wrapper .ant-table-container .ant-table-selection-column').first().click();
    await page.getByRole('row', { name: 'Created at' }).locator('.ant-checkbox-input').check();
    //断言提交的data是否符合预期
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('api/collections:create')),
      page.getByLabel('action-Action-Submit').click(),
    ]);
    const postData = request.postDataJSON();
    //提交的数据符合预期
    expect(postData).toMatchObject({
      autoGenId: false,
      createdAt: true,
      createdBy: false,
      updatedAt: false,
      updatedBy: false,
      fields: expect.arrayContaining([
        expect.objectContaining({
          name: 'createdAt',
          type: 'date',
          // 其他属性
        }),
      ]),
    });
  });
  test('createdBy preset field', async ({ page }) => {
    await page.goto('/admin/settings/data-source-manager/list');
    await page.getByRole('button', { name: 'Configure' }).first().click();
    await page.getByRole('button', { name: 'plus Create collection down' }).click();
    await page.getByRole('menuitem', { name: 'General collection' }).locator('span').click();
    await page.getByLabel('block-item-Input-collections-Collection display name').getByRole('textbox').fill(uid());
    await page.locator('.ant-drawer-content-wrapper .ant-table-container .ant-table-selection-column').first().hover();
    await page.locator('.ant-drawer-content-wrapper .ant-table-container .ant-table-selection-column').first().click();
    await page.getByRole('row', { name: 'created By' }).locator('.ant-checkbox-input').check();
    //断言提交的data是否符合预期
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('api/collections:create')),
      page.getByLabel('action-Action-Submit').click(),
    ]);
    const postData = request.postDataJSON();
    //提交的数据符合预期
    expect(postData).toMatchObject({
      autoGenId: false,
      createdAt: false,
      createdBy: true,
      updatedAt: false,
      updatedBy: false,
      fields: expect.arrayContaining([
        expect.objectContaining({
          name: 'createdBy',
          type: 'belongsTo',
          // 其他属性
        }),
      ]),
    });
  });
  test('updatedBy preset field', async ({ page }) => {
    await page.goto('/admin/settings/data-source-manager/list');
    await page.getByRole('button', { name: 'Configure' }).first().click();
    await page.getByRole('button', { name: 'plus Create collection down' }).click();
    await page.getByRole('menuitem', { name: 'General collection' }).locator('span').click();
    await page.getByLabel('block-item-Input-collections-Collection display name').getByRole('textbox').fill(uid());
    await page.locator('.ant-drawer-content-wrapper .ant-table-container .ant-table-selection-column').first().hover();
    await page.locator('.ant-drawer-content-wrapper .ant-table-container .ant-table-selection-column').first().click();
    await page.getByRole('row', { name: 'Last updated by' }).locator('.ant-checkbox-input').check();
    //添加关系字段,断言提交的data是否符合预期
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('api/collections:create')),
      page.getByLabel('action-Action-Submit').click(),
    ]);
    const postData = request.postDataJSON();
    //提交的数据符合预期
    expect(postData).toMatchObject({
      autoGenId: false,
      createdAt: false,
      createdBy: false,
      updatedAt: false,
      updatedBy: true,
      fields: expect.arrayContaining([
        expect.objectContaining({
          name: 'updatedBy',
          type: 'belongsTo',
          // 其他属性
        }),
      ]),
    });
  });
  test('updatedAt preset field', async ({ page }) => {
    await page.goto('/admin/settings/data-source-manager/list');
    await page.getByRole('button', { name: 'Configure' }).first().click();
    await page.getByRole('button', { name: 'plus Create collection down' }).click();
    await page.getByRole('menuitem', { name: 'General collection' }).locator('span').click();
    await page.getByLabel('block-item-Input-collections-Collection display name').getByRole('textbox').fill(uid());
    await page.locator('.ant-drawer-content-wrapper .ant-table-container .ant-table-selection-column').first().hover();
    await page.locator('.ant-drawer-content-wrapper .ant-table-container .ant-table-selection-column').first().click();
    await page.getByRole('row', { name: 'Last updated at' }).locator('.ant-checkbox-input').check();
    //添加关系字段,断言提交的data是否符合预期
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('api/collections:create')),
      page.getByLabel('action-Action-Submit').click(),
    ]);
    const postData = request.postDataJSON();
    //提交的数据符合预期
    expect(postData).toMatchObject({
      autoGenId: false,
      createdAt: false,
      createdBy: false,
      updatedAt: true,
      updatedBy: false,
      fields: expect.arrayContaining([
        expect.objectContaining({
          name: 'updatedAt',
          type: 'date',
          // 其他属性
        }),
      ]),
    });
  });
  test('unselect preset fields', async ({ page }) => {
    await page.goto('/admin/settings/data-source-manager/list');
    await page.getByRole('button', { name: 'Configure' }).first().click();
    await page.getByRole('button', { name: 'plus Create collection down' }).click();
    await page.getByRole('menuitem', { name: 'General collection' }).locator('span').click();
    await page.getByLabel('block-item-Input-collections-Collection display name').getByRole('textbox').fill(uid());
    await page.locator('.ant-drawer-content-wrapper .ant-table-container .ant-table-selection-column').first().hover();
    await page.locator('.ant-drawer-content-wrapper .ant-table-container .ant-table-selection-column').first().click();
    //断言提交的data是否符合预期
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('api/collections:create')),
      page.getByLabel('action-Action-Submit').click(),
    ]);
    const postData = request.postDataJSON();
    //提交的数据符合预期
    expect(postData).toMatchObject({
      autoGenId: false,
      createdAt: false,
      createdBy: false,
      updatedAt: false,
      updatedBy: false,
      fields: [],
    });
  });
});

test.describe('configure fields', () => {
  test('basic', async ({ page, mockCollections }) => {
    test.slow();
    const collectionDisplayName = uid();
    // 避免以数字开头，会报错
    const collectionName = `t_${uid()}`;
    const collectionManagerPage = new CollectionManagerPage(page);
    const targetCollectionName = `t_${uid()}`;
    const targetKey = `f_${uid()}`;
    await mockCollections([
      {
        name: targetCollectionName,
        fields: [{ name: targetKey, unique: true, interface: 'input' }],
      },
      {
        name: collectionName,
        title: collectionDisplayName,
      },
    ]);
    await collectionManagerPage.goto();

    const fieldsSettings = await collectionManagerPage.configureFields(collectionName);
    // 应该有这些字段显示出来
    await expect(page.getByRole('cell', { name: 'id', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'createdAt', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'createdBy', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'updatedAt', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'updatedBy', exact: true })).toBeVisible();

    // 添加 table oid 字段
    const tableOIDDisplayName = uid();
    const tableOIDSettings = await fieldsSettings.addField('Table OID');
    await tableOIDSettings.change('Field display name', tableOIDDisplayName);
    await tableOIDSettings.submit();
    await expect(page.getByRole('cell', { name: tableOIDDisplayName, exact: true })).toBeVisible();

    // 添加 basic 类型的字段
    // 注意：有一些必填项之所以缺失，是因为其会被自动填充一个值
    await addField('Single line text');
    await addField('Long text');
    await addField('Phone');
    await addField('Email');
    await addField('URL');
    await addField('Integer');
    await addField('Number');
    await addField('Percent');
    await addField('Password');
    await addField('Color');
    await addField('Icon');

    // 添加 choices 字段
    await addField('Checkbox');
    await addField('Single select');
    await addField('Multiple select');
    await addField('Radio group');
    await addField('Checkbox group');
    await addField('China region');

    // 添加 media 字段
    await addField('Markdown');
    await addField('Rich Text');
    await addField('Attachment');

    // 添加 date & time 字段
    await addField('Datetime');
    await addField('Time');

    // 添加 relation 字段
    // One to one (belongs to)
    const belongsToDisplayName = uid();
    const belongsToSettings = await fieldsSettings.addField('One to one (belongs to)');
    await belongsToSettings.change('Field display name', belongsToDisplayName);
    await belongsToSettings.change('Target collection', targetCollectionName);
    await belongsToSettings.change('Target key', targetKey);
    await belongsToSettings.submit();
    await expect(page.getByRole('cell', { name: belongsToDisplayName, exact: true })).toBeVisible();
    // One to one (has one)
    const hasOneDisplayName = uid();
    const hasOneSettings = await fieldsSettings.addField('One to one (has one)');
    await hasOneSettings.change('Field display name', hasOneDisplayName);
    await hasOneSettings.change('Target collection', targetCollectionName);
    await hasOneSettings.submit();
    await expect(page.getByRole('cell', { name: hasOneDisplayName, exact: true })).toBeVisible();
    // One to many
    const oneToManyDisplayName = uid();
    const oneToManySettings = await fieldsSettings.addField('One to many');
    await oneToManySettings.change('Field display name', oneToManyDisplayName);
    await oneToManySettings.change('Target collection', targetCollectionName);
    await belongsToSettings.change('Target key', targetKey);
    await oneToManySettings.submit();
    await expect(page.getByRole('cell', { name: oneToManyDisplayName, exact: true })).toBeVisible();
    // Many to one
    const manyToOneDisplayName = uid();
    const manyToOneSettings = await fieldsSettings.addField('Many to one');
    await manyToOneSettings.change('Field display name', manyToOneDisplayName);
    await manyToOneSettings.change('Target collection', targetCollectionName);
    await belongsToSettings.change('Target key', targetKey);
    await manyToOneSettings.submit();
    await expect(page.getByRole('cell', { name: manyToOneDisplayName, exact: true })).toBeVisible();
    // Many to many
    const manyToManyDisplayName = uid();
    const manyToManyName = `f_${uid()}`;
    const manyToManySettings = await fieldsSettings.addField('Many to many');
    await manyToManySettings.change('Field display name', manyToManyDisplayName);
    await manyToManySettings.change('Field name', manyToManyName);
    await manyToManySettings.change('Target collection', targetCollectionName);
    await belongsToSettings.change('Target key', targetKey);
    await manyToManySettings.submit();
    await expect(page.getByRole('cell', { name: manyToManyDisplayName, exact: true })).toBeVisible();
    // 在这里测一下 many to many 字段的编辑和删除，其它字段先不测了
    const newManyToManyDisplayName = uid();
    const manyToManyEditing = await fieldsSettings.edit(manyToManyName, 'Many to many');
    await manyToManyEditing.change('Field display name', newManyToManyDisplayName);
    await manyToManyEditing.submit();
    await expect(page.getByRole('cell', { name: newManyToManyDisplayName, exact: true })).toBeVisible();
    await fieldsSettings.deleteItem(manyToManyName);
    await expect(page.getByRole('cell', { name: newManyToManyDisplayName, exact: true })).toBeHidden();

    // 添加 advanced 字段
    // Formula
    const formulaDisplayName = uid();
    const formulaSettings = await fieldsSettings.addField('Formula');
    await formulaSettings.change('Field display name', formulaDisplayName);
    await formulaSettings.change('Expression', '1+1');
    await formulaSettings.submit();
    await expect(page.getByRole('cell', { name: formulaDisplayName, exact: true })).toBeVisible();
    // Sequence
    const sequenceDisplayName = uid();
    const sequenceSettings = await fieldsSettings.addField('Sequence');
    await sequenceSettings.change('Field display name', sequenceDisplayName);
    await page.getByRole('button', { name: 'plus Add rule' }).click();
    await sequenceSettings.submit();
    await expect(page.getByRole('cell', { name: sequenceDisplayName, exact: true })).toBeVisible();
    // JSON
    await addField('JSON');
    // Collection
    await addField('Collection selector');

    async function addField(fieldType: FieldInterface) {
      const value = uid();
      const fieldSettings = await fieldsSettings.addField(fieldType);
      await fieldSettings.change('Field display name', value);
      await fieldSettings.submit();
      await expect(page.getByRole('cell', { name: value, exact: true })).toBeVisible();
    }
  });

  // https://nocobase.height.app/T-2868
  test('sequence rules: z-index of configure drawer', async ({ page, mockCollections }) => {
    const collectionManagerPage = new CollectionManagerPage(page);
    await collectionManagerPage.goto();
    const fieldsSettings = await collectionManagerPage.configureFields('users');
    await fieldsSettings.addField('Sequence');

    await page.getByRole('button', { name: 'plus Add rule' }).click();
    await page.getByRole('button', { name: 'Configure', exact: true }).click();
    await expect(page.getByLabel('block-item-InputNumber-Digits')).toBeVisible();

    // 即使 drawer 被遮挡，toBeVisible 也能通过，所以这里在通过点击按钮来关闭 drawer 进行测试
    await page.getByRole('button', { name: 'Submit', exact: true }).first().click();
    await expect(page.getByLabel('block-item-InputNumber-Digits')).not.toBeVisible();
  });
});

//创建非Id为主键/唯一索引
test.describe('create primary key  or unique index other than ID.', () => {
  test('integer field as primary key', async ({ page, mockCollection }) => {
    const name = uid();
    await page.goto('/admin/settings/data-source-manager/list');
    await page.getByRole('button', { name: 'Configure' }).first().click();
    await mockCollection({
      name: name,
      autoGenId: false,
      fields: [],
    });
    await page.getByLabel('action-Filter.Action-Filter-').click();
    await page.getByRole('textbox').nth(1).click();
    await page.getByRole('textbox').nth(1).fill(name);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Configure fields-collections-${name}`).click();
    await page.getByRole('button', { name: 'plus Add field' }).click();
    await page.getByRole('menuitem', { name: 'Integer' }).click();
    await page.getByLabel('block-item-Input-fields-Field display name').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-fields-Field display name').getByRole('textbox').fill(uid());
    await page.getByLabel('Primary').check();
    //断言提交的data是否符合预期
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('/fields:create')),
      page.getByLabel('action-Action-Submit-fields-').click(),
    ]);
    const postData = request.postDataJSON();
    //提交的数据符合预期
    expect(postData).toMatchObject({
      unique: false,
      interface: 'integer',
      primaryKey: true,
      type: 'bigInt',
    });
  });
  test('integer field set unique index', async ({ page, mockCollection }) => {
    const name = uid();
    await page.goto('/admin/settings/data-source-manager/list');
    await page.getByRole('button', { name: 'Configure' }).first().click();
    await mockCollection({
      name: name,
      autoGenId: false,
      fields: [],
    });
    await page.getByLabel('action-Filter.Action-Filter-').click();
    await page.getByRole('textbox').nth(1).click();
    await page.getByRole('textbox').nth(1).fill(name);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Configure fields-collections-${name}`).click();
    await page.getByRole('button', { name: 'plus Add field' }).click();
    await page.getByRole('menuitem', { name: 'Integer' }).click();
    await page.getByLabel('block-item-Input-fields-Field display name').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-fields-Field display name').getByRole('textbox').fill(uid());
    // Primary 和 Unique选中一个，其中一个自动取消勾选
    await page.getByLabel('Primary').check();
    await page.getByLabel('Unique').check();
    //断言提交的data是否符合预期
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('/fields:create')),
      page.getByLabel('action-Action-Submit-fields-').click(),
    ]);
    const postData = request.postDataJSON();
    //提交的数据符合预期
    expect(postData).toMatchObject({
      unique: true,
      interface: 'integer',
      primaryKey: false,
      type: 'bigInt',
    });
  });
  test('input(string) field set unique index', async ({ page, mockCollection }) => {
    const name = uid();
    await page.goto('/admin/settings/data-source-manager/list');
    await page.getByRole('button', { name: 'Configure' }).first().click();
    await mockCollection({
      name: name,
      autoGenId: false,
      fields: [],
    });
    await page.getByLabel('action-Filter.Action-Filter-').click();
    await page.getByRole('textbox').nth(1).click();
    await page.getByRole('textbox').nth(1).fill(name);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Configure fields-collections-${name}`).click();
    await page.getByRole('button', { name: 'plus Add field' }).click();
    await page.getByRole('menuitem', { name: 'Single line text' }).click();
    await page.getByLabel('block-item-Input-fields-Field display name').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-fields-Field display name').getByRole('textbox').fill(uid());
    // Primary 和 Unique选中一个，其中一个自动取消勾选
    await page.getByLabel('Primary').check();
    await page.getByLabel('Unique').check();
    //断言提交的data是否符合预期
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('/fields:create')),
      page.getByLabel('action-Action-Submit-fields-').click(),
    ]);
    const postData = request.postDataJSON();
    //提交的数据符合预期
    expect(postData).toMatchObject({
      unique: true,
      interface: 'input',
      primaryKey: false,
      type: 'string',
    });
  });
  test('input(string) field set as primary key', async ({ page, mockCollection }) => {
    const name = uid();
    await page.goto('/admin/settings/data-source-manager/list');
    await page.getByRole('button', { name: 'Configure' }).first().click();
    await mockCollection({
      name: name,
      autoGenId: false,
      fields: [],
    });
    await page.getByLabel('action-Filter.Action-Filter-').click();
    await page.getByRole('textbox').nth(1).click();
    await page.getByRole('textbox').nth(1).fill(name);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Configure fields-collections-${name}`).click();
    await page.getByRole('button', { name: 'plus Add field' }).click();
    await page.getByRole('menuitem', { name: 'Single line text' }).click();
    await page.getByLabel('block-item-Input-fields-Field display name').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-fields-Field display name').getByRole('textbox').fill(uid());
    // Primary 和 Unique选中一个，其中一个自动取消勾选
    await page.getByLabel('Unique').check();
    await page.getByLabel('Primary').check();
    //断言提交的data是否符合预期
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('/fields:create')),
      page.getByLabel('action-Action-Submit-fields-').click(),
    ]);
    const postData = request.postDataJSON();
    //提交的数据符合预期
    expect(postData).toMatchObject({
      unique: false,
      interface: 'input',
      primaryKey: true,
      type: 'string',
    });
  });
});

test.describe('edit', () => {
  test('basic', async ({ page, mockCollection }) => {
    const collectionDisplayName = uid();
    // 避免以数字开头，会报错
    const collectionName = `t_${uid()}`;
    const collectionManagerPage = new CollectionManagerPage(page);
    await mockCollection({
      name: collectionName,
      title: collectionDisplayName,
    });
    await collectionManagerPage.goto();

    const newCollectionDisplayName = uid();
    const newDescription = uid();
    const newCollectionSettings = await collectionManagerPage.edit(collectionName);
    await newCollectionSettings.change('Collection display name', newCollectionDisplayName);
    await newCollectionSettings.change('Description', newDescription);
    await newCollectionSettings.submit();
    await expect(page.getByRole('cell', { name: newCollectionDisplayName, exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: newDescription, exact: true })).toBeVisible();
  });
});

//创建关系字段
//sourceKey, targetKey, optional field types are [string ',' bigInt ',' integer ',' uuid ',' uid '] and are non primary key field with a Unique index set
test.describe('association constraints support selecting non-primary key fields with Unique indexes', () => {
  const fields = [
    { name: 'id', interface: 'id', type: 'bigInt' },
    { name: 'string', interface: 'input', type: 'string', unique: true },
    { name: 'bigInt', type: 'bigInt', interface: 'integer', unique: true },
    { name: 'integer', type: 'integer', interface: 'input', unique: true },
    { name: 'uuid', type: 'uuid', interface: 'input', unique: true },
    { name: 'uid', type: 'uid', interface: 'input', unique: true },
    { name: 'string1', interface: 'input', type: 'string' },
    { name: 'bigInt1', type: 'bigInt', interface: 'integer' },
    { name: 'integer1', type: 'integer', interface: 'input' },
    { name: 'uuid1', type: 'uuid', interface: 'input' },
    { name: 'uid1', type: 'uid', interface: 'input' },
  ];
  test('oho sourceKey', async ({ page, mockCollection }) => {
    const collectionName = uid();
    await mockCollection({
      name: collectionName,
      autoGenId: true,
      fields,
    });
    await page.goto('/admin/settings/data-source-manager/list');
    await page.getByRole('button', { name: 'Configure' }).first().click();
    await page.getByLabel('action-Filter.Action-Filter-').click();
    await page.getByRole('textbox').nth(1).click();
    await page.getByRole('textbox').nth(1).fill(collectionName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Configure fields-collections-${collectionName}`).click();
    await page.getByRole('button', { name: 'plus Add field' }).click();
    await page.getByRole('menuitem', { name: 'One to one (has one)' }).click();
    await page.getByLabel('block-item-SourceKey-fields-').click();
    // 获取所有选项的文本内容
    const options = await page.locator('.rc-virtual-list').evaluate(() => {
      const optionElements = document.querySelectorAll('.ant-select-item-option');
      return Array.from(optionElements).map((option) => option.textContent);
    });

    // 断言下拉列表是否符合预期
    expect(options).toEqual(expect.arrayContaining(['ID', 'string', 'bigInt', 'integer', 'uuid', 'uid']));
  });
  test('obo targetKey', async ({ page, mockCollection }) => {
    const collectionName = uid();
    await mockCollection({
      name: collectionName,
      autoGenId: true,
      fields,
    });
    await page.goto('/admin/settings/data-source-manager/list');
    await page.getByRole('button', { name: 'Configure' }).first().click();
    await page.getByLabel('action-Filter.Action-Filter-').click();
    await page.getByRole('textbox').nth(1).click();
    await page.getByRole('textbox').nth(1).fill(collectionName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Configure fields-collections-${collectionName}`).click();
    await page.getByRole('button', { name: 'plus Add field' }).click();
    await page.getByRole('menuitem', { name: 'One to one (belongs to)' }).click();
    await page.getByLabel('block-item-Select-fields-Target collection').click();
    await page.getByRole('option', { name: collectionName }).locator('div').click();
    await page.getByLabel('block-item-TargetKey-fields-').click();
    // 获取所有选项的文本内容
    const options = await page
      .locator('.rc-virtual-list')
      .nth(1)
      .evaluate((element) => {
        const optionElements = element.querySelectorAll('.ant-select-item-option');
        return Array.from(optionElements).map((option) => option.textContent);
      });

    // 断言下拉列表是否符合预期
    expect(options).toEqual(expect.arrayContaining(['ID', 'string', 'bigInt', 'integer', 'uuid', 'uid']));
  });
  test('o2m targetKey & sourceKey', async ({ page, mockCollection }) => {
    const collectionName = uid();

    await mockCollection({
      name: collectionName,
      autoGenId: true,
      fields,
    });
    await page.goto('/admin/settings/data-source-manager/list');
    await page.getByRole('button', { name: 'Configure' }).first().click();
    await page.getByLabel('action-Filter.Action-Filter-').click();
    await page.getByRole('textbox').nth(1).click();
    await page.getByRole('textbox').nth(1).fill(collectionName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Configure fields-collections-${collectionName}`).click();
    await page.getByRole('button', { name: 'plus Add field' }).click();
    await page.getByRole('menuitem', { name: 'One to many' }).click();

    await page.getByLabel('block-item-SourceKey-fields-').click();
    // sourceKey 选项符合预期
    const sourcekeyOptions = await page.locator('.rc-virtual-list').evaluate((element) => {
      const optionElements = element.querySelectorAll('.ant-select-item-option');
      return Array.from(optionElements).map((option) => option.textContent);
    });

    // 断言下拉列表是否符合预期
    expect(sourcekeyOptions).toEqual(['ID', 'string', 'bigInt', 'integer', 'uuid', 'uid']);

    await page.getByLabel('block-item-Select-fields-Target collection').click();
    await page.getByRole('option', { name: collectionName }).locator('div').click();
    await page.getByLabel('block-item-TargetKey-fields-').click();

    //targetKey 选项符合预期
    const targetKeyOptions = await page
      .locator('.rc-virtual-list')
      .nth(2)
      .evaluate((element) => {
        const optionElements = element.querySelectorAll('.ant-select-item-option');
        return Array.from(optionElements).map((option) => option.textContent);
      });

    // 断言下拉列表是否符合预期,o2m的targetkey 不限制unique
    expect(targetKeyOptions).toEqual(
      expect.arrayContaining([
        'ID',
        'string',
        'bigInt',
        'integer',
        'uuid',
        'uid',
        'string1',
        'bigInt1',
        'integer1',
        'uuid1',
        'uid1',
      ]),
    );
  });

  test('m2o targetKey & foreignKey', async ({ page, mockCollection }) => {
    const collectionName = uid();
    const foreignKey = `f_${uid()}`;
    await mockCollection({
      name: collectionName,
      autoGenId: true,
      fields,
    });
    await page.goto('/admin/settings/data-source-manager/list');
    await page.getByRole('button', { name: 'Configure' }).first().click();
    await page.getByLabel('action-Filter.Action-Filter-').click();
    await page.getByRole('textbox').nth(1).click();
    await page.getByRole('textbox').nth(1).fill(collectionName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Configure fields-collections-${collectionName}`).click();
    await page.getByRole('button', { name: 'plus Add field' }).click();
    await page.getByRole('menuitem', { name: 'Many to one' }).click();

    await page.getByLabel('block-item-ForeignKey-fields-').locator('input').click();
    // ForeignKey 选项符合预期
    const foreignKeyOptions = await page.locator('.rc-virtual-list').evaluate((element) => {
      const optionElements = element.querySelectorAll('.ant-select-item-option');
      return Array.from(optionElements).map((option) => option.textContent);
    });

    // 断言下拉列表是否符合预期
    expect(foreignKeyOptions).toEqual(
      expect.arrayContaining([
        'ID',
        'string',
        'bigInt',
        'integer',
        'uuid',
        'uid',
        'string1',
        'bigInt1',
        'integer1',
        'uuid1',
        'uid1',
      ]),
    );
    //ForeignKey 支持自定义输入和选择
    await page.getByLabel('block-item-ForeignKey-fields-').locator('input').clear();
    await page.getByLabel('block-item-ForeignKey-fields-').locator('input').fill(foreignKey);

    const inputValue = await page.getByLabel('block-item-ForeignKey-fields-').locator('input').inputValue();
    expect(inputValue).toEqual(foreignKey);
    await page.getByRole('option', { name: 'uuid1' }).locator('div').click();
    const optionValue = await page.getByLabel('block-item-ForeignKey-fields-').locator('input').inputValue();
    expect(optionValue).toEqual('uuid1');

    await page.getByLabel('block-item-Select-fields-Target collection').click();
    await page.getByRole('option', { name: collectionName }).locator('div').click();
    await page.getByLabel('block-item-TargetKey-fields-').click();

    //targetKey 选项符合预期
    const targetKeyOptions = await page
      .locator('.rc-virtual-list')
      .nth(2)
      .evaluate((element) => {
        const optionElements = element.querySelectorAll('.ant-select-item-option');
        return Array.from(optionElements).map((option) => option.textContent);
      });

    // 断言下拉列表是否符合预期, 限制unique
    expect(targetKeyOptions).toEqual(expect.arrayContaining(['ID', 'string', 'bigInt', 'integer', 'uuid', 'uid']));
  });

  test('m2m sourceKey & foreignKey & targetKey', async ({ page, mockCollection }) => {
    const collectionName = uid();
    const foreignKey = `f_${uid()}`;
    await mockCollection({
      name: collectionName,
      autoGenId: true,
      fields,
    });
    await page.goto('/admin/settings/data-source-manager/list');
    await page.getByRole('button', { name: 'Configure' }).first().click();
    await page.getByLabel('action-Filter.Action-Filter-').click();
    await page.getByRole('textbox').nth(1).click();
    await page.getByRole('textbox').nth(1).fill(collectionName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Configure fields-collections-${collectionName}`).click();
    await page.getByRole('button', { name: 'plus Add field' }).click();
    await page.getByRole('menuitem', { name: 'Many to many' }).click();

    await page.getByLabel('block-item-SourceKey-fields-').click();
    // sourceKey 选项符合预期
    const sourcekeyOptions = await page.locator('.rc-virtual-list').evaluate((element) => {
      const optionElements = element.querySelectorAll('.ant-select-item-option');
      return Array.from(optionElements).map((option) => option.textContent);
    });
    expect(sourcekeyOptions).toEqual(['ID', 'string', 'bigInt', 'integer', 'uuid', 'uid']);

    // ForeignKey1 选项符合预期
    await page.getByLabel('block-item-ThroughCollection-').click();
    await page.getByRole('option', { name: collectionName }).locator('div').click();
    await page.getByLabel('block-item-ForeignKey-fields-Foreign key 1').locator('input').click();
    const foreignKeyOptions = await page
      .locator('.rc-virtual-list')
      .nth(2)
      .evaluate((element) => {
        const optionElements = element.querySelectorAll('.ant-select-item-option');
        return Array.from(optionElements).map((option) => option.textContent);
      });

    // 断言下拉列表是否符合预期
    expect(foreignKeyOptions).toEqual(
      expect.arrayContaining([
        'ID',
        'string',
        'bigInt',
        'integer',
        'uuid',
        'uid',
        'string1',
        'bigInt1',
        'integer1',
        'uuid1',
        'uid1',
      ]),
    );
    //ForeignKey1 支持自定义输入和选择
    await page.getByLabel('block-item-ForeignKey-fields-Foreign key 1').locator('input').clear();
    await page.getByLabel('block-item-ForeignKey-fields-Foreign key 1').locator('input').fill(foreignKey);

    const inputValue = await page
      .getByLabel('block-item-ForeignKey-fields-Foreign key 1')
      .locator('input')
      .inputValue();
    expect(inputValue).toEqual(foreignKey);
    await page.getByRole('option', { name: 'uuid1' }).locator('div').click();
    const optionValue = await page
      .getByLabel('block-item-ForeignKey-fields-Foreign key 1')
      .locator('input')
      .inputValue();
    expect(optionValue).toEqual('uuid1');

    await page.getByLabel('block-item-Select-fields-Target collection').click();
    await page.getByRole('option', { name: collectionName }).locator('div').click();
    await page.getByLabel('block-item-TargetKey-fields-').click();

    //targetKey 选项符合预期
    const targetKeyOptions = await page
      .locator('.rc-virtual-list')
      .nth(2)
      .evaluate((element) => {
        const optionElements = element.querySelectorAll('.ant-select-item-option');
        return Array.from(optionElements).map((option) => option.textContent);
      });

    // 断言下拉列表是否符合预期, 限制unique
    expect(targetKeyOptions).toEqual(expect.arrayContaining(['ID', 'string', 'bigInt', 'integer', 'uuid', 'uid']));
  });
});

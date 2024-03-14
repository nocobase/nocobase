import { expect, test } from '@nocobase/test/e2e';
import { uid } from '@nocobase/utils';

test('initializing main data source by default', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('plugin-settings-button').click();
  await page.getByRole('link', { name: 'Data sources' }).click();
  await expect(page.getByText('main', { exact: true })).toBeVisible();
});

//预设字段
test.describe('create collection with preset fields', () => {
  test('all preset fields by default', async ({ page }) => {
    await page.goto('/admin/settings/data-source-manager/list');
    await page.getByRole('button', { name: 'Configure' }).click();
    await page.getByRole('button', { name: 'plus Create collection down' }).click();
    await page.getByRole('menuitem', { name: 'General collection' }).locator('span').click();
    await page.getByLabel('block-item-Input-collections-Collection display name').getByRole('textbox').click();
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
    await page.getByRole('button', { name: 'Configure' }).click();
    await page.getByRole('button', { name: 'plus Create collection down' }).click();
    await page.getByRole('menuitem', { name: 'General collection' }).locator('span').click();
    await page.getByLabel('block-item-Input-collections-Collection display name').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-collections-Collection display name').getByRole('textbox').fill(uid());
    await page.getByLabel('block-item-collections-Preset').getByLabel('Select all').uncheck();
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
    await page.getByRole('button', { name: 'Configure' }).click();
    await page.getByRole('button', { name: 'plus Create collection down' }).click();
    await page.getByRole('menuitem', { name: 'General collection' }).locator('span').click();
    await page.getByLabel('block-item-Input-collections-Collection display name').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-collections-Collection display name').getByRole('textbox').fill(uid());
    await page.getByLabel('block-item-collections-Preset').getByLabel('Select all').uncheck();
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
    await page.getByRole('button', { name: 'Configure' }).click();
    await page.getByRole('button', { name: 'plus Create collection down' }).click();
    await page.getByRole('menuitem', { name: 'General collection' }).locator('span').click();
    await page.getByLabel('block-item-Input-collections-Collection display name').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-collections-Collection display name').getByRole('textbox').fill(uid());
    await page.getByLabel('block-item-collections-Preset').getByLabel('Select all').uncheck();
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
    await page.getByRole('button', { name: 'Configure' }).click();
    await page.getByRole('button', { name: 'plus Create collection down' }).click();
    await page.getByRole('menuitem', { name: 'General collection' }).locator('span').click();
    await page.getByLabel('block-item-Input-collections-Collection display name').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-collections-Collection display name').getByRole('textbox').fill(uid());
    await page.getByLabel('block-item-collections-Preset').getByLabel('Select all').uncheck();
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
    await page.getByRole('button', { name: 'Configure' }).click();
    await page.getByRole('button', { name: 'plus Create collection down' }).click();
    await page.getByRole('menuitem', { name: 'General collection' }).locator('span').click();
    await page.getByLabel('block-item-Input-collections-Collection display name').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-collections-Collection display name').getByRole('textbox').fill(uid());
    await page.getByLabel('block-item-collections-Preset').getByLabel('Select all').uncheck();
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
    await page.getByRole('button', { name: 'Configure' }).click();
    await page.getByRole('button', { name: 'plus Create collection down' }).click();
    await page.getByRole('menuitem', { name: 'General collection' }).locator('span').click();
    await page.getByLabel('block-item-Input-collections-Collection display name').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-collections-Collection display name').getByRole('textbox').fill(uid());
    await page.getByLabel('block-item-collections-Preset').getByLabel('Select all').uncheck();
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

//创建非Id为主键/唯一索引
test.describe('create primary key  or unique index other than ID.', () => {
  test('integer field as primary key', async ({ page, mockCollection }) => {
    await page.goto('/admin/settings/data-source-manager/list');
    await page.getByRole('button', { name: 'Configure' }).click();
    await mockCollection({
      name: 'general',
      autoGenId: false,
      fields: [],
    });
    await page.getByLabel('action-Filter.Action-Filter-').click();
    await page.getByRole('textbox').nth(1).click();
    await page.getByRole('textbox').nth(1).fill('general');
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel('action-Action.Link-Configure fields-collections-general').click();
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
    await page.goto('/admin/settings/data-source-manager/list');
    await page.getByRole('button', { name: 'Configure' }).click();
    await mockCollection({
      name: 'general',
      autoGenId: false,
      fields: [],
    });
    await page.getByLabel('action-Filter.Action-Filter-').click();
    await page.getByRole('textbox').nth(1).click();
    await page.getByRole('textbox').nth(1).fill('general');
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel('action-Action.Link-Configure fields-collections-general').click();
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
    await page.goto('/admin/settings/data-source-manager/list');
    await page.getByRole('button', { name: 'Configure' }).click();
    await mockCollection({
      name: 'general',
      autoGenId: false,
      fields: [],
    });
    await page.getByLabel('action-Filter.Action-Filter-').click();
    await page.getByRole('textbox').nth(1).click();
    await page.getByRole('textbox').nth(1).fill('general');
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel('action-Action.Link-Configure fields-collections-general').click();
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
    await page.goto('/admin/settings/data-source-manager/list');
    await page.getByRole('button', { name: 'Configure' }).click();
    await mockCollection({
      name: 'general',
      autoGenId: false,
      fields: [],
    });
    await page.getByLabel('action-Filter.Action-Filter-').click();
    await page.getByRole('textbox').nth(1).click();
    await page.getByRole('textbox').nth(1).fill('general');
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel('action-Action.Link-Configure fields-collections-general').click();
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

//创建关系字段
test.describe("sourceKey, targetKey, optional field types are [string ',' bigInt ',' integer ',' uuid ',' uid '] and are non primary key field with a Unique index set", () => {
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
    await page.getByRole('button', { name: 'Configure' }).click();
    await page.getByLabel('action-Filter.Action-Filter-').click();
    await page.getByRole('textbox').nth(1).click();
    await page.getByRole('textbox').nth(1).fill(collectionName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Configure fields-collections-${collectionName}`).click();
    await page.getByRole('button', { name: 'plus Add field' }).click();
    await page.getByRole('menuitem', { name: 'One to one (has one)' }).click();
    await page.getByLabel('block-item-Input-fields-Field display name').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-fields-Field display name').getByRole('textbox').fill('oho');
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
    await page.getByRole('button', { name: 'Configure' }).click();
    await page.getByLabel('action-Filter.Action-Filter-').click();
    await page.getByRole('textbox').nth(1).click();
    await page.getByRole('textbox').nth(1).fill(collectionName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Configure fields-collections-${collectionName}`).click();
    await page.getByRole('button', { name: 'plus Add field' }).click();
    await page.getByRole('menuitem', { name: 'One to one (belongs to)' }).click();
    await page.getByLabel('block-item-Input-fields-Field display name').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-fields-Field display name').getByRole('textbox').fill('obo');
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
    await page.getByRole('button', { name: 'Configure' }).click();
    await page.getByLabel('action-Filter.Action-Filter-').click();
    await page.getByRole('textbox').nth(1).click();
    await page.getByRole('textbox').nth(1).fill(collectionName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Configure fields-collections-${collectionName}`).click();
    await page.getByRole('button', { name: 'plus Add field' }).click();
    await page.getByRole('menuitem', { name: 'One to many' }).click();
    await page.getByLabel('block-item-Input-fields-Field display name').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-fields-Field display name').getByRole('textbox').fill('o2m');

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
    await page.getByRole('button', { name: 'Configure' }).click();
    await page.getByLabel('action-Filter.Action-Filter-').click();
    await page.getByRole('textbox').nth(1).click();
    await page.getByRole('textbox').nth(1).fill(collectionName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Configure fields-collections-${collectionName}`).click();
    await page.getByRole('button', { name: 'plus Add field' }).click();
    await page.getByRole('menuitem', { name: 'Many to one' }).click();
    await page.getByLabel('block-item-Input-fields-Field display name').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-fields-Field display name').getByRole('textbox').fill('m2o');

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

  test('m2m targetKey & foreignKey', async ({ page, mockCollection }) => {
    const collectionName = uid();
    const foreignKey = `f_${uid()}`;
    await mockCollection({
      name: collectionName,
      autoGenId: true,
      fields,
    });
    await page.goto('/admin/settings/data-source-manager/list');
    await page.getByRole('button', { name: 'Configure' }).click();
    await page.getByLabel('action-Filter.Action-Filter-').click();
    await page.getByRole('textbox').nth(1).click();
    await page.getByRole('textbox').nth(1).fill(collectionName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Configure fields-collections-${collectionName}`).click();
    await page.getByRole('button', { name: 'plus Add field' }).click();
    await page.getByRole('menuitem', { name: 'Many to many' }).click();
    await page.getByLabel('block-item-Input-fields-Field display name').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-fields-Field display name').getByRole('textbox').fill('obo');

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

//排序字段，全局排序、分组排序
test.describe('sort fied', () => {});

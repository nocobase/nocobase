import { expect, test, expectSettingsMenu } from '@nocobase/test/e2e';
import { uid } from '@nocobase/utils';

const PGDataSource = 'pg';
const o2mAssociationField = 'o2m';

//添加数据源
test.describe('add external data source', () => {
  test('pg external data source', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('plugin-settings-button').click();
    await page.getByRole('link', { name: 'Data sources' }).click();
    await page.getByRole('button', { name: 'plus Add new down' }).click();
    await page.getByRole('menuitem', { name: 'PostgreSQL' }).click();
    await page.getByLabel('Data source name').click();
    await page.getByLabel('Data source name').getByRole('textbox').fill(PGDataSource);
    await page.getByLabel('Data source display name').getByRole('textbox').fill(PGDataSource);
    await page.getByLabel('Port').getByRole('textbox').fill(`${process.env.DB_PORT}`);
    await page.getByLabel('Database').getByRole('textbox').fill(`${process.env.DB_DATABASE}_external_test`);
    await page.getByLabel('Username').getByRole('textbox').fill(`${process.env.USER}`);
    await page.locator('input[type="password"]').fill(`${process.env.DB_PASSWORD}`);
    //测试连接
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('api/dataSources:testConnection')),
      page.getByLabel('action-Action-Test Connection').click(),
    ]);
    const response = await (await request.response()).json();
    await expect(response).toMatchObject({
      data: {
        success: true,
      },
    });
    await page.getByLabel('action-Action-Submit-').click();
    await page.waitForTimeout(1000);
    await expect(page.getByLabel(`${PGDataSource}-Configure`)).toBeVisible();
  });
});

//配置数据源
test.describe('configure external data source', () => {
  //进入外部数据源数据表管理页
  test('external data source collection configure', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('plugin-settings-button').click();
    await page.getByRole('link', { name: 'Data sources' }).click();
    await page.getByLabel(`${PGDataSource}-Configure`).click();
    await expect(await page.getByRole('menuitem', { name: 'Collections' })).toBeVisible();
    await expect(await page.getByLabel('action-Action-Refresh-')).toBeVisible();
  });

  test('synchronize(refresh) external data source collection', async ({ page }) => {});
});

//管理数据源数据表字段
test.describe('configure collection field', () => {
  test('field display name', async ({ page }) => {
    await page.goto(`/admin/settings/data-source-manager/${PGDataSource}/collections`);
    await page.getByLabel('action-Action.Link-Configure fields').first().click();
    const fieldTitle = uid();
    //断言提交的data是否符合预期
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('/fields:update')),
      page.getByLabel('field-title-input').first().fill(fieldTitle),
    ]);
    const postData = request.postDataJSON();
    expect(postData).toHaveProperty(
      'uiSchema',
      expect.objectContaining({
        title: fieldTitle,
      }),
    );
  });
  test('field interface', async ({ page }) => {
    await page.goto(`/admin/settings/data-source-manager/${PGDataSource}/collections`);
    await page.getByLabel('action-Action.Link-Configure fields').first().click();
    await page.getByLabel('field-interface-string').first().click();
    const interfaceOptions = await page
      .locator('.rc-virtual-list')
      .last()
      .evaluate((element) => {
        const optionElements = element.querySelectorAll('.ant-select-item-option');
        return Array.from(optionElements).map((option) => option.textContent);
      });
    //断言下拉列表是否符合预期
    expect(interfaceOptions).toEqual(
      expect.arrayContaining([
        'Single line text',
        'Phone',
        'Email',
        'URL',
        'Color',
        'Icon',
        'Single select',
        'Radio group',
        'Sequence',
        'Collection selector',
        'ID',
      ]),
    );
    //断言提交的data是否符合预期
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('/fields:update')),
      page.getByRole('option', { name: 'Email' }).click(),
    ]);
    const postData = request.postDataJSON();
    await expect(postData).toMatchObject({
      interface: 'email',
    });
    expect(postData).toHaveProperty(
      'uiSchema',
      expect.objectContaining({
        'x-validator': 'email',
      }),
    );
    await page.getByLabel('field-interface-string').first().click();
    await page.getByRole('option', { name: 'Single line text' }).locator('div').click();
  });
  test('synchronize(refresh) external data source collection', async ({ page }) => {});
});

//添加关系字段
test.describe('add association field', () => {
  test('oho forignkey', async ({ page }) => {
    await page.goto(`/admin/settings/data-source-manager/${PGDataSource}/collections`);
    await page.getByLabel('action-Action.Link-Configure fields').first().click();
    await page.getByRole('button', { name: 'plus Add field' }).hover();
    await page.getByRole('menuitem', { name: 'One to one (has one)' }).click();

    await page.getByLabel('block-item-Select-fields-Target collection').click();
    await page.getByRole('option', { name: 'users' }).locator('div').click();
    await page.getByLabel('block-item-ForeignKey-fields-').locator('input').click();

    // ForeignKey 选项符合预期
    const foreignKeyOptions = await page
      .locator('.rc-virtual-list')
      .nth(1)
      .evaluate((element) => {
        const optionElements = element.querySelectorAll('.ant-select-item-option');
        return Array.from(optionElements).map((option) => option.textContent);
      });

    // 断言下拉列表是否符合预期
    expect(foreignKeyOptions).toEqual(expect.arrayContaining(['user_uuid', 'username']));
  });

  test('obo targetKey', async ({ page }) => {
    const ohoFieldTitle = uid();
    await page.goto(`/admin/settings/data-source-manager/${PGDataSource}/collections`);
    await page.getByLabel('action-Action.Link-Configure fields').first().click();
    await page.getByRole('button', { name: 'plus Add field' }).hover();
    await page.getByRole('menuitem', { name: 'One to one (belongs to)' }).click();

    await page.getByLabel('block-item-Input-fields-Field display name').getByRole('textbox').fill(ohoFieldTitle);
    await page.getByLabel('block-item-Select-fields-Target collection').click();
    await page.getByRole('option', { name: 'users' }).locator('div').click();
    await page.getByLabel('block-item-TargetKey-fields-').click();
    // 获取所有选项的文本内容
    const options = await page
      .locator('.rc-virtual-list')
      .nth(1)
      .evaluate((element) => {
        const optionElements = element.querySelectorAll('.ant-select-item-option');
        return Array.from(optionElements).map((option) => option.textContent);
      });

    // 断言下拉列表是否符合预期,现在unique
    expect(options).toEqual(expect.arrayContaining(['user_uuid']));
  });
  test('o2m targetKey & forignkey', async ({ page }) => {
    await page.goto(`/admin/settings/data-source-manager/${PGDataSource}/collections`);
    await page.getByLabel('action-Action.Link-Configure fields').first().click();
    await page.getByRole('button', { name: 'plus Add field' }).hover();
    await page.getByRole('menuitem', { name: 'One to many' }).click();
    await page.getByLabel('block-item-Input-fields-Field display name').getByRole('textbox').fill(o2mAssociationField);

    await page.getByLabel('block-item-Select-fields-Target collection').click();
    await page.getByRole('option', { name: 'posts' }).locator('div').click();
    //targetkey
    await page.getByLabel('block-item-TargetKey-fields-').click();
    // 获取所有选项的文本内容
    const options = await page
      .locator('.rc-virtual-list')
      .nth(1)
      .evaluate((element) => {
        const optionElements = element.querySelectorAll('.ant-select-item-option');
        return Array.from(optionElements).map((option) => option.textContent);
      });

    // 断言下拉列表是否符合预期,现在unique
    expect(options).toEqual(expect.arrayContaining(['author_id', 'post_id', 'post_title']));
    await page.getByRole('option', { name: 'post_id' }).locator('div').click();

    await page.getByLabel('block-item-ForeignKey-fields-').locator('input').click();

    // foreignKey 选项符合预期
    const foreignKeyOptions = await page
      .locator('.rc-virtual-list')
      .nth(2)
      .evaluate((element) => {
        const optionElements = element.querySelectorAll('.ant-select-item-option');
        return Array.from(optionElements).map((option) => option.textContent);
      });

    // 断言下拉列表是否符合预期
    expect(foreignKeyOptions).toEqual(expect.arrayContaining(['author_id', 'post_id', 'post_title']));
    await page.getByRole('option', { name: 'author_id' }).locator('div').click();
    await page.getByLabel('action-Action-Submit-fields-').click();
  });

  test('m2o targetKey & forignkey', async ({ page }) => {
    await page.goto(`/admin/settings/data-source-manager/${PGDataSource}/collections`);
    await page.getByLabel('action-Filter.Action-Filter-').click();
    await page.getByRole('textbox').nth(1).fill('users');
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel('action-Action.Link-Configure fields').first().click();
    await page.getByRole('button', { name: 'plus Add field' }).hover();
    await page.getByRole('menuitem', { name: 'Many to one' }).click();

    await page.getByLabel('block-item-Select-fields-Target collection').click();
    await page.getByRole('option', { name: 'users' }).locator('div').click();

    await page.getByLabel('block-item-ForeignKey-fields-').locator('input').click();
    // foreignKey 选项符合预期
    const foreignKeyOptions = await page
      .locator('.rc-virtual-list')
      .nth(1)
      .evaluate((element) => {
        const optionElements = element.querySelectorAll('.ant-select-item-option');
        return Array.from(optionElements).map((option) => option.textContent);
      });

    // 断言下拉列表是否符合预期
    expect(foreignKeyOptions).toEqual(expect.arrayContaining(['user_uuid', 'username']));

    await page.getByLabel('block-item-TargetKey-fields-').click();
    //targetKey 选项符合预期,限制unique
    const targetKeyOptions = await page
      .locator('.rc-virtual-list')
      .nth(2)
      .evaluate((element) => {
        const optionElements = element.querySelectorAll('.ant-select-item-option');
        return Array.from(optionElements).map((option) => option.textContent);
      });

    // 断言下拉列表是否符合预期
    expect(targetKeyOptions).toEqual(expect.arrayContaining(['user_uuid']));
  });

  test('m2m targetKey & forignkey', async ({ page }) => {
    await page.goto(`/admin/settings/data-source-manager/${PGDataSource}/collections`);
    await page.getByLabel('action-Action.Link-Configure fields').first().click();
    await page.getByRole('button', { name: 'plus Add field' }).hover();
    await page.getByRole('menuitem', { name: 'Many to many' }).click();
    await page.getByLabel('block-item-ThroughCollection-').click();
    await page.getByRole('option', { name: 'users' }).locator('div').click();

    await page.getByLabel('block-item-ForeignKey-fields-').locator('input').first().click();
    // foreignKey 选项符合预期
    const foreignKeyOptions = await page
      .locator('.rc-virtual-list')
      .nth(1)
      .evaluate((element) => {
        const optionElements = element.querySelectorAll('.ant-select-item-option');
        return Array.from(optionElements).map((option) => option.textContent);
      });

    // 断言下拉列表是否符合预期
    expect(foreignKeyOptions).toEqual(expect.arrayContaining(['user_uuid', 'username']));
    await page.getByLabel('block-item-Select-fields-Target collection').click();
    await page.getByRole('option', { name: 'users' }).locator('div').click();
    await page.getByLabel('block-item-TargetKey-fields-').click();

    //targetKey 选项符合预期
    const targetKeyOptions = await page
      .locator('.rc-virtual-list')
      .last()
      .evaluate((element) => {
        const optionElements = element.querySelectorAll('.ant-select-item-option');
        return Array.from(optionElements).map((option) => option.textContent);
      });

    // 断言下拉列表是否符合预期，限制unique
    expect(targetKeyOptions).toEqual(expect.arrayContaining(['user_uuid']));
  });
});

test.describe('add block', () => {
  test('data block ', async ({ page, mockPage }) => {
    const nocobasePage = mockPage();
    await nocobasePage.goto();
    await page.getByLabel('schema-initializer-Grid-page').click();
    await page.getByText('Table').hover();
    //多数源选项/数据表
    await expect(await page.getByRole('menuitem', { name: 'Main' })).toBeVisible();
    await expect(await page.getByRole('menuitem', { name: PGDataSource })).toBeVisible();
    await page.getByRole('menuitem', { name: PGDataSource }).click();
    await page.getByRole('menuitem', { name: 'users' }).click();
    await page.getByLabel('block-item-CardItem-users-').hover();
    await expect(page.getByLabel('block-item-CardItem-users-').locator('.ant-space-item').innerText()).toBe(
      `${PGDataSource} > users`,
    );
  });
  test('filter block ', async ({ page, mockPage }) => {
    const nocobasePage = mockPage();
    await nocobasePage.goto();
    await page.getByLabel('schema-initializer-Grid-page:').click();
    await page.getByText('Filter blocks').click();
    await page.getByRole('menuitem', { name: 'form Form right' }).nth(1).click();
    await expect(await page.getByRole('menuitem', { name: 'Main' })).toBeVisible();
    await expect(await page.getByRole('menuitem', { name: PGDataSource })).toBeVisible();
    await page.getByRole('menuitem', { name: 'users' }).click();
    await page.getByLabel('block-item-CardItem-users-').hover();
    await expect(page.getByLabel('block-item-CardItem-users-').locator('.ant-space-item').innerText()).toBe(
      `${PGDataSource} > users`,
    );
  });
  test('association block ', async ({ page }) => {});
});

test.describe('add filed', () => {
  test('data block ', async ({ page }) => {});
  test('filter block ', async ({ page }) => {});
  test('association block ', async ({ page }) => {});
});

test.describe('add action', () => {
  test('data block ', async ({ page }) => {});
  test('filter block ', async ({ page }) => {});
  test('association block ', async ({ page }) => {});
});

test.describe('permissions', () => {
  test('view', async ({ page }) => {});
  test('create', async ({ page }) => {});
  test('update', async ({ page }) => {});
  test('delete', async ({ page }) => {});
});

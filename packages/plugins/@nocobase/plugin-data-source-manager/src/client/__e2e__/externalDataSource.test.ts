import { expect, test } from '@nocobase/test/e2e';
import { uid } from '@nocobase/utils';

test.describe('add external data source', () => {
  test('pg external data source', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('plugin-settings-button').click();
    await page.getByRole('link', { name: 'Data sources' }).click();
    await page.getByRole('button', { name: 'plus Add new down' }).click();
    await page.getByRole('menuitem', { name: 'PostgreSQL' }).click();
    await page.getByLabel('Data source name').click();
    await page.getByLabel('Data source name').getByRole('textbox').fill('pg');
    await page.getByLabel('Data source display name').getByRole('textbox').fill('pg');
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
    await expect(page.getByLabel('pg-Configure')).toBeVisible();
  });
});

test.describe('configure external data source', () => {
  //进入外部数据源数据表管理页
  test('external data source collection configure', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('plugin-settings-button').click();
    await page.getByRole('link', { name: 'Data sources' }).click();
    await page.getByLabel('pg-Configure').click();
    await expect(await page.getByRole('menuitem', { name: 'Collections' })).toBeVisible();
    await expect(await page.getByLabel('action-Action-Refresh-')).toBeVisible();
  });

  test('synchronize(refresh) external data source collection', async ({ page }) => {});
});

test.describe('configure collection field', () => {
  test('field display name', async ({ page }) => {
    await page.goto('/admin/settings/data-source-manager/pg/collections');
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
    await page.goto('/admin/settings/data-source-manager/pg/collections');
    await page.getByLabel('action-Action.Link-Configure fields').first().click();
    await page.getByLabel('field-interface').first().click();

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
  });
  // 字段配置
  test('add association field(oho)', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('plugin-settings-button').click();
    await page.getByRole('link', { name: 'Data sources' }).click();
    await page.getByLabel('pg-Configure').click();
    await expect(await page.getByRole('menuitem', { name: 'Collections' })).toBeVisible();
    await expect(await page.getByLabel('action-Action-Refresh-')).toBeVisible();
  });

  test('synchronize(refresh) external data source collection', async ({ page }) => {});
});

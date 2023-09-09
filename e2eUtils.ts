import { uid } from '@formily/shared';
import { request, test } from '@playwright/test';

export * from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // 每个测试运行前，都新建一个页面
  await page.goto(`/admin/${await createPage()}`);

  // 确保每个测试中配置按钮都是可见的
  if (!(await page.getByRole('button', { name: 'plus Add menu item' }).isVisible({ timeout: 100 }))) {
    await page.getByRole('button', { name: 'highlight' }).click();
  }
});

test.afterEach(async ({ page }) => {
  const pageUid = page.url().split('/').pop();
  // 每个测试运行后，都删除当前页面
  if (pageUid) {
    await deletePage(pageUid);
  }
});

const getStorageItem = (key: string, storageState: any) => {
  return storageState.origins
    .find((item) => item.origin === 'http://localhost:20000')
    ?.localStorage.find((item) => item.name === key)?.value;
};

/**
 * 在 NocoBase 中创建一个页面
 * @param name 页面名称
 * @returns 页面的 uid，可根据此跳转到页面
 */
export const createPage = async (name?: string) => {
  const api = await request.newContext({
    storageState: require.resolve('./playwright/.auth/admin.json'),
  });

  const state = await api.storageState();
  const systemSettings = getStorageItem('NOCOBASE_SYSTEM_SETTINGS', state);
  const token = getStorageItem('NOCOBASE_TOKEN', state);

  const pageUid = uid();
  const gridName = uid();

  if (systemSettings) {
    const { data } = JSON.parse(systemSettings);
    await api.post(`/api/uiSchemas:insertAdjacent/${data.options.adminSchemaUid}?position=beforeEnd`, {
      data: {
        schema: {
          _isJSONSchemaObject: true,
          version: '2.0',
          type: 'void',
          title: name || pageUid,
          'x-component': 'Menu.Item',
          'x-decorator': 'ACLMenuItemProvider',
          'x-component-props': {},
          'x-server-hooks': [
            { type: 'onSelfCreate', method: 'bindMenuToRole' },
            { type: 'onSelfSave', method: 'extractTextToLocale' },
          ],
          properties: {
            page: {
              _isJSONSchemaObject: true,
              version: '2.0',
              type: 'void',
              'x-component': 'Page',
              'x-async': true,
              properties: {
                [gridName]: {
                  _isJSONSchemaObject: true,
                  version: '2.0',
                  type: 'void',
                  'x-component': 'Grid',
                  'x-initializer': 'BlockInitializers',
                  'x-uid': uid(),
                  name: gridName,
                },
              },
              'x-uid': uid(),
              name: 'page',
            },
          },
          name: uid(),
          'x-uid': pageUid,
        },
        wrap: null,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } else {
    throw new Error('systemSettings is null');
  }

  return pageUid;
};

/**
 * 删除一个 NocoBase 的页面
 */
export const deletePage = async (pageUid: string) => {
  const api = await request.newContext({
    storageState: require.resolve('./playwright/.auth/admin.json'),
  });

  const state = await api.storageState();
  const token = getStorageItem('NOCOBASE_TOKEN', state);

  await api.post(`/api/uiSchemas:remove/${pageUid}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

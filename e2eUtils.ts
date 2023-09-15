import { uid } from '@formily/shared';
import { Page, request, test } from '@playwright/test';

interface CollectionSetting {
  title: string;
  name: string;
  /**
   * @default 'general'
   */
  template?: string;
  /**
   * @default true
   */
  logging?: boolean;
  /**
   * Generate ID field automatically
   * @default true
   */
  autoGenId?: boolean;
  /**
   * Store the creation user of each record
   * @default true
   */
  createdBy?: boolean;
  /**
   * Store the last update user of each record
   * @default true
   */
  updatedBy?: boolean;
  /**
   * Store the creation time of each record
   * @default true
   */
  createdAt?: boolean;
  /**
   * Store the last update time of each record
   * @default true
   */
  updatedAt?: boolean;
  /**
   * Records can be sorted
   * @default true
   */
  sortable?: boolean;
  /**
   * @default false
   */
  inherit?: boolean;
  hidden?: boolean;
  description?: string;
  view?: boolean;
  key?: string;
  fields: Array<{
    type: string;
    interface: string;
    name: string;
    uiSchema: {
      type: string;
      title: string;
      'x-component': string;
      'x-read-pretty': boolean;
      'x-component-props'?: Record<string, any>;
    };
    field?: string;
    target?: string;
    targetKey?: string;
    foreignKey?: string;
    allowNull?: boolean;
    autoIncrement?: boolean;
    primaryKey?: boolean;
    key?: string;
    description?: string;
    collectionName?: string;
    parentKey?: any;
    reverseKey?: any;
  }>;
}

/**
 * 为每个测试文件注册 beforeEach 和 afterEach 钩子。
 *
 * 主要的作用有：
 * 1. 在每个测试运行前，创建一个页面，运行后，删除这个页面。
 * 2. 在每个测试运行结束后，删除测试期间创建的一个或多个 collection。
 * 3. 确保每个测试中配置按钮都是可见的。
 */
export const registerHooks = () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试运行前，都新建一个页面
    await page.goto(`/admin/${await createPage()}`);

    // 确保每个测试中配置按钮都是可见的
    if (!(await page.getByRole('button', { name: 'plus Add menu item' }).isVisible({ timeout: 100 }))) {
      await page.getByRole('button', { name: 'highlight' }).click();
    }
  });

  test.afterEach(async ({ page }) => {
    const pageUid = page.url().split('/').pop();
    // 每个测试运行结束后，删除当前页面
    if (pageUid) {
      await deletePage(pageUid);
    }

    // 删除创建的 collections
    // @ts-ignore
    if (page._collectionNames) {
      // @ts-ignore
      await deleteCollections(page._collectionNames);
    }
  });
};

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
export const createPage = async ({ name, pageSchema }: { name?: string; pageSchema?: any } = {}) => {
  const api = await request.newContext({
    storageState: require.resolve('./playwright/.auth/admin.json'),
  });

  const state = await api.storageState();
  const token = getStorageItem('NOCOBASE_TOKEN', state);

  const systemSettings = await api.get(`/api/systemSettings:get/1`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const pageUid = uid();
  const gridName = uid();

  if (systemSettings.ok()) {
    const { data } = await systemSettings.json();
    const result = await api.post(`/api/uiSchemas:insertAdjacent/${data.options.adminSchemaUid}?position=beforeEnd`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
            page: pageSchema || {
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
    });

    if (!result.ok()) {
      throw new Error(await result.text());
    }
  } else {
    throw new Error('systemSettings is not ok');
  }

  return pageUid;
};

/**
 * 根据页面 uid 删除一个 NocoBase 的页面
 */
export const deletePage = async (pageUid: string) => {
  const api = await request.newContext({
    storageState: require.resolve('./playwright/.auth/admin.json'),
  });

  const state = await api.storageState();
  const token = getStorageItem('NOCOBASE_TOKEN', state);

  const result = await api.post(`/api/uiSchemas:remove/${pageUid}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
};

const createCollection = async (collectionSetting: CollectionSetting) => {
  const api = await request.newContext({
    storageState: require.resolve('./playwright/.auth/admin.json'),
  });

  const state = await api.storageState();
  const token = getStorageItem('NOCOBASE_TOKEN', state);
  const defaultCollectionSetting: Partial<CollectionSetting> = {
    template: 'general',
    logging: true,
    autoGenId: true,
    createdBy: true,
    updatedBy: true,
    createdAt: true,
    updatedAt: true,
    sortable: true,
    view: false,
  };

  const result = await api.post(`/api/collections:create`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: Object.assign(defaultCollectionSetting, collectionSetting),
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
};

const deleteCollections = async (collectionNames: string[]) => {
  const api = await request.newContext({
    storageState: require.resolve('./playwright/.auth/admin.json'),
  });

  const state = await api.storageState();
  const token = getStorageItem('NOCOBASE_TOKEN', state);
  const params = collectionNames.map((name) => `filterByTk[]=${name}`).join('&');

  const result = await api.post(`/api/collections:destroy?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
};

/**
 * 根据配置创建一个或多个 collection
 * @param page 运行测试的 page 实例
 * @param collectionSettings
 * @returns
 */
export const createCollections = async (page: Page, collectionSettings: CollectionSetting | CollectionSetting[]) => {
  if (Array.isArray(collectionSettings)) {
    // TODO: 这里如果改成并发创建的话性能会更好，但是会出现只创建一个 collection 的情况，暂时不知道原因
    for (const item of collectionSettings) {
      await createCollection(item);
    }
    // @ts-ignore
    page._collectionNames = collectionSettings.map((item) => item.name);
  } else {
    await createCollection(collectionSettings);
    // @ts-ignore
    page._collectionNames = [collectionSettings.name];
  }

  await page.reload();
};

/**
 * 根据传进来的 uiSchema 创建一个新的页面，并跳转过去
 * @param page
 * @param uiSchema
 */
export const createPageWithUISchema = async (page: Page, uiSchema: any) => {
  // 1. 先把之前创建的空页面删除
  await deletePage(page.url().split('/').pop());
  // 2. 再根据传进来的 uiSchema 创建一个新的页面，并跳转过去
  await page.goto(`/admin/${await createPage({ pageSchema: uiSchema })}`);
};

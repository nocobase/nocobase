import { uid } from '@formily/shared';
import { Page, expect, request, test } from '@playwright/test';
import { PORT } from './scripts/utils';

export { expect, test };

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
  category?: any[];
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

interface PageOptions {
  collections?: CollectionSetting[];
  pageSchema?: any;
}

interface CreatePageOptions {
  name?: string;
  pageSchema?: any;
}

const registerHooks = () => {
  test.afterEach(async ({ page }) => {
    // 每个测试运行结束后，删除当前页面
    // @ts-ignore
    if (page._currentPageUidList) {
      // @ts-ignore
      await Promise.all(page._currentPageUidList.map((pageUid) => deletePage(pageUid)));
    }

    // 删除创建的 collections
    // @ts-ignore
    if (page._collectionNames) {
      // @ts-ignore
      await deleteCollections(page._collectionNames);
    }
  });
};

registerHooks();

// @ts-ignore
export const describe: typeof test.describe = (title, callback) => {
  return test.describe(title, () => {
    registerHooks();
    callback();
  });
};

Object.assign(describe, test.describe);

const getStorageItem = (key: string, storageState: any) => {
  return storageState.origins
    .find((item) => item.origin === `http://localhost:${PORT}`)
    ?.localStorage.find((item) => item.name === key)?.value;
};

/**
 * 更新直接从浏览器中复制过来的 Schema 中的 uid
 */
const updateUidOfPageSchema = (uiSchema: any) => {
  if (!uiSchema) {
    return;
  }

  if (uiSchema['x-uid']) {
    uiSchema['x-uid'] = uid();
  }

  if (uiSchema.properties) {
    Object.keys(uiSchema.properties).forEach((key) => {
      updateUidOfPageSchema(uiSchema.properties[key]);
    });
  }

  return uiSchema;
};

/**
 * 在 NocoBase 中创建一个页面
 */
const createPage = async (page: Page, options?: CreatePageOptions) => {
  const { name, pageSchema } = options || {};
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
            page: updateUidOfPageSchema(pageSchema) || {
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

  // @ts-ignore
  (page._currentPageUidList || (page._currentPageUidList = [])).push(pageUid);

  return pageUid;
};

/**
 * 根据页面 uid 删除一个 NocoBase 的页面
 */
const deletePage = async (pageUid: string) => {
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
 * 更新 collection name 以保持唯一性
 *
 * 注意：目前的方法实现起来比较简单，但问题是容易出错，因为它是全量替换的，可能会替换错。
 * 防止错误的方法就是尽量在创建 collection name 的时候使用随机值。
 * @param collectionSettings
 */
const updateCollectionName = (collectionSettings: CollectionSetting[]): CollectionSetting[] => {
  let result = JSON.stringify(collectionSettings);

  collectionSettings.map((item) => {
    result = result.replaceAll(item.name, uid());
  });

  return JSON.parse(result);
};

/**
 * 根据配置创建一个或多个 collection
 * @param page 运行测试的 page 实例
 * @param collectionSettings
 * @returns
 */
const createCollections = async (page: Page, collectionSettings: CollectionSetting[]) => {
  collectionSettings = updateCollectionName(collectionSettings);
  // TODO: 这里如果改成并发创建的话性能会更好，但是会出现只创建一个 collection 的情况，暂时不知道原因
  for (const item of collectionSettings) {
    await createCollection(item);
  }
  // @ts-ignore
  page._collectionNames = collectionSettings.map((item) => item.name);
};

/**
 * 根据提供的 UISchema 创建一个页面并跳转过去
 * @param page
 * @param options
 */
export const gotoPage = async (page: Page, options?: PageOptions) => {
  if (!options) {
    await page.goto(`/admin/${await createPage(page)}`);
    return await enableToConfig(page);
  }

  if (options.collections) {
    await createCollections(page, options.collections);
  }

  if (options.pageSchema) {
    await page.goto(`/admin/${await createPage(page, { pageSchema: options.pageSchema })}`);
  } else {
    await page.goto(`/admin/${await createPage(page)}`);
  }

  await enableToConfig(page);
};

/**
 * 是页面成为可配置态
 */
async function enableToConfig(page: Page) {
  if (!(await page.getByRole('button', { name: 'plus Add menu item' }).isVisible())) {
    await page.getByRole('button', { name: 'highlight' }).click();
  }
}

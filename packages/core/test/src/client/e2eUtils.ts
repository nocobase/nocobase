import { faker } from '@faker-js/faker';
import { uid } from '@formily/shared';
import { Page, test as base, request } from '@playwright/test';
import _ from 'lodash';

export * from '@playwright/test';

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
    unique?: boolean;
    uiSchema: {
      type?: string;
      title?: string;
      required?: boolean;
      'x-component'?: string;
      'x-read-pretty'?: boolean;
      'x-validator'?: string;
      'x-component-props'?: Record<string, any>;
      [key: string]: any;
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
    [key: string]: any;
  }>;
}

interface PageConfig {
  /**
   * 用户可见的页面名称
   * @default uid()
   */
  name?: string;
  /**
   * 页面的基础路径
   * @default '/admin/'
   */
  basePath?: string;
  /**
   * 页面数据表的配置
   * @default undefined
   */
  collections?: CollectionSetting[];
  /**
   * 页面整体的 Schema
   * @default undefined
   */
  pageSchema?: any;
}

interface CreatePageOptions {
  name?: string;
  pageSchema?: any;
}

class NocoPage {
  private url: string;
  private uid: string;
  private collectionsName: string[];
  private waitForInit: Promise<void>;

  constructor(
    private page: Page,
    private options?: PageConfig,
  ) {
    this.waitForInit = this.init();
  }

  async init() {
    if (this.options?.collections?.length) {
      const collections: any = deleteKeyOfCollection(this.options.collections);
      this.collectionsName = collections.map((item) => item.name);

      await createCollections(this.page, collections);

      // 默认为每个 collection 生成 3 条数据
      await createFakerData(collections);
      await createFakerData(collections);
      await createFakerData(collections);
    }

    this.uid = await createPage(this.page, {
      name: this.options?.name,
      pageSchema: this.options?.pageSchema,
    });
    this.url = `${this.options?.basePath || '/admin/'}${this.uid}`;
  }

  async goto() {
    await this.waitForInit;
    await this.page.goto(this.url);
    await enableToConfig(this.page);
  }

  async destroy() {
    if (this.uid) {
      await deletePage(this.uid);
      this.uid = undefined;
    }
    if (this.collectionsName?.length) {
      await deleteCollections(this.collectionsName);
      this.collectionsName = undefined;
    }
  }
}

export const test = base.extend<{ mockPage: (config?: PageConfig) => NocoPage }>({
  mockPage: async ({ page }, use) => {
    // 保证每个测试运行时 faker 的随机值都是一样的
    faker.seed(1);

    const nocoPages: NocoPage[] = [];
    const mockPage = (config?: PageConfig) => {
      const nocoPage = new NocoPage(page, config);
      nocoPages.push(nocoPage);
      return nocoPage;
    };

    await use(mockPage);

    // 测试运行完自动销毁页面
    for (const nocoPage of nocoPages) {
      await nocoPage.destroy();
    }
  },
});

const getStorageItem = (key: string, storageState: any) => {
  return storageState.origins
    .find((item) => item.origin === `http://localhost:${process.env.APP_PORT}`)
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
    storageState: require.resolve('../../../../../playwright/.auth/admin.json'),
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
    storageState: require.resolve('../../../../../playwright/.auth/admin.json'),
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
    storageState: require.resolve('../../../../../playwright/.auth/admin.json'),
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
    storageState: require.resolve('../../../../../playwright/.auth/admin.json'),
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
 * 如果不删除 key 会报错
 * @param collectionSettings
 * @returns
 */
const deleteKeyOfCollection = (collectionSettings: CollectionSetting[]) => {
  return collectionSettings.map((collection) => {
    return {
      ..._.omit(collection, ['key']),
      fields: collection.fields.map((field) => _.omit(field, ['key'])),
    };
  });
};

/**
 * 根据配置创建一个或多个 collection
 * @param page 运行测试的 page 实例
 * @param collectionSettings
 * @returns
 */
const createCollections = async (page: Page, collectionSettings: CollectionSetting[]) => {
  // TODO: 这里如果改成并发创建的话性能会更好，但是会出现只创建一个 collection 的情况，暂时不知道原因
  for (const item of collectionSettings) {
    await createCollection(item);
  }
  // @ts-ignore
  page._collectionNames = collectionSettings.map((item) => item.name);
};

/**
 * 根据 collection 的配置生成 Faker 数据
 * @param collectionSetting
 * @param all
 * @returns
 */
const generateFakerData = (collectionSetting: CollectionSetting) => {
  const excludeField = ['id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'];
  const basicInterfaceToData = {
    input: () => faker.lorem.words(),
    textarea: () => faker.lorem.paragraph(),
    richText: () => faker.lorem.paragraph(),
    phone: () => faker.phone.number('1##########'),
    email: () => faker.internet.email(),
    url: () => faker.internet.url(),
    integer: () => faker.datatype.number(),
    number: () => faker.datatype.number(),
    percent: () => faker.datatype.float(),
    password: () => faker.internet.password(),
    color: () => faker.internet.color(),
    icon: () => 'checkcircleoutlined',
    datetime: () => faker.date.anytime({ refDate: '2023-09-21T00:00:00.000Z' }),
    time: () => '00:00:00',
  };
  const result = {};

  collectionSetting.fields.forEach((field) => {
    if (excludeField.includes(field.name)) {
      return;
    }

    if (basicInterfaceToData[field.interface]) {
      result[field.name] = basicInterfaceToData[field.interface]();
      return;
    }
  });

  return result;
};

/**
 * 使用 Faker 为 collection 创建数据
 */
const createFakerData = async (collectionSettings: CollectionSetting[]) => {
  const api = await request.newContext({
    storageState: require.resolve('../../../../../playwright/.auth/admin.json'),
  });

  const state = await api.storageState();
  const token = getStorageItem('NOCOBASE_TOKEN', state);

  for (const item of collectionSettings) {
    const data = generateFakerData(item);
    const result = await api.post(`/api/${item.name}:create`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      form: data,
    });

    if (!result.ok()) {
      throw new Error(await result.text());
    }
  }
};

/**
 * 使页面成为可配置态
 */
export async function enableToConfig(page: Page) {
  if (!(await page.getByRole('button', { name: 'plus Add menu item' }).isVisible())) {
    await page.getByRole('button', { name: 'highlight' }).click();
  }
}

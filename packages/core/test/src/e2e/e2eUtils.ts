/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { faker } from '@faker-js/faker';
import { uid } from '@formily/shared';
import { Browser, Page, test as base, expect, request } from '@playwright/test';
import _ from 'lodash';
import { defineConfig } from './defineConfig';

function getPageMenuSchema({ pageSchemaUid, tabSchemaUid, tabSchemaName }) {
  return {
    type: 'void',
    'x-component': 'Page',
    properties: {
      [tabSchemaName]: {
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {},
        'x-uid': tabSchemaUid,
        'x-async': true,
      },
    },
    'x-uid': pageSchemaUid,
  };
}

function getPageMenuSchemaWithTabSchema({ tabSchema }) {
  if (!tabSchema) {
    return null;
  }

  return {
    type: 'void',
    'x-component': 'Page',
    properties: {
      [tabSchema.name]: tabSchema,
    },
    'x-uid': uid(),
  };
}

export * from '@playwright/test';

export { defineConfig };

export interface CollectionSetting {
  name: string;
  title?: string;
  titleField?: string;
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
  sortable?: boolean | string;
  /**
   * @default false
   */
  inherit?: boolean;
  inherits?: string[];
  category?: any[];
  hidden?: boolean;
  description?: string;
  view?: boolean;
  key?: string;
  fields?: Array<{
    interface: string;
    type?: string;
    name?: string;
    unique?: boolean;
    uiSchema?: {
      type?: string;
      title?: string;
      required?: boolean;
      'x-component'?: string;
      'x-read-pretty'?: boolean;
      'x-validator'?: any;
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

interface AclActionsSetting {
  name: string; //操作标识，如cretae
  fields?: any[]; //有该操作权限的字段
  scope?: any; // 数据范围
}
interface AclResourcesSetting {
  name: string; //数据表标识
  usingActionsConfig: boolean; //是否开启单独配置
  actions?: AclActionsSetting[];
}
interface AclRoleSetting {
  name?: string;
  title?: string;
  /**
   * @default true
   */
  allowNewMenu?: boolean;
  //配置权限，如 ["app", "pm", "pm.*", "ui.*"]
  snippets?: string[];
  //操作权限策略
  strategy?: any;
  //数据表单独操作权限配置
  resources?: AclResourcesSetting[];
  /**
   * @default false
   */
  default?: boolean;
  key?: string;
  //菜单权限配置
  desktopRoutes?: number[];
  dataSourceKey?: string;
}

interface DatabaseSetting {
  database: string;
  host: string;
  port: string;
  schema?: string;
  username?: string;
  password?: string;
}
interface DataSourceSetting {
  key: string;
  displayName: string;
  type: string;
  options: DatabaseSetting;
  enabled?: boolean;
}

export interface PageConfig {
  /**
   * 页面类型
   * @default 'page'
   */
  type?: 'group' | 'page' | 'link';
  /**
   * type 为 link 时，表示跳转的链接
   */
  url?: string;
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
   * @deprecate 在菜单被重构之后，没有办法直接复制完整的页面 Schema 了。所以这个选项不推荐使用了。
   * 推荐使用 tabSchema，复制一个页面 tab 的 Schema 传给 tabSchema。
   *
   * 页面整体的 Schema
   * @default undefined
   */
  pageSchema?: any;
  /**
   * 页面 Tab 的 Schema。当 pageSchema 和 tabSchema 都存在时，最终显示的会是 tabSchema 的内容
   */
  tabSchema?: any;
  /** 如果为 true 则表示不会更改 PageSchema 的 uid */
  keepUid?: boolean;
  /** 在 URL 中的 uid，例如：/admin/0ig6xhe03u2 */
  pageUid?: string;
}

export interface MobilePageConfig extends Omit<PageConfig, 'type'> {
  type?: 'page' | 'link';
  /**
   * 页面的基础路径
   * @default '/m/'
   */
  basePath?: string;
}

interface CreatePageOptions {
  type?: PageConfig['type'];
  url?: PageConfig['url'];
  name?: string;
  pageSchema?: any;
  tabSchema?: any;
  /** 如果为 true 则表示不会更改 PageSchema 的 uid */
  keepUid?: boolean;
  /** 在 URL 中的 uid，例如：/admin/0ig6xhe03u2 */
  pageUid?: string;
}

interface CreateMobilePageOptions extends Omit<CreatePageOptions, 'type'> {
  type?: Omit<PageConfig['type'], 'group'>;
}

interface ExtendUtils {
  page?: Page;
  /**
   * 根据配置，生成一个 NocoBase 的页面
   * @param pageConfig 页面配置
   * @returns
   */
  mockPage: (pageConfig?: PageConfig) => NocoPage;
  /**
   * 根据配置，生成一个移动端 NocoBase 的页面
   * @param pageConfig 页面配置
   * @returns
   */
  mockMobilePage: (pageConfig?: MobilePageConfig) => NocoMobilePage;
  /**
   * 根据配置，生成一个需要手动销毁的 NocoPage 页面
   * @param pageConfig
   * @returns
   */
  mockManualDestroyPage: (pageConfig?: PageConfig) => NocoPage;
  /**
   * 根据配置，生成多个 collections
   * @param collectionSettings
   * @returns 返回一个 destroy 方法，用于销毁创建的 collections
   */
  mockCollections: (collectionSettings: CollectionSetting[]) => Promise<any>;
  /**
   * 根据配置，生成一个 collection
   * @param collectionSetting
   * @returns 返回一个 destroy 方法，用于销毁创建的 collection
   */
  mockCollection: (collectionSetting: CollectionSetting) => Promise<any>;
  /**
   * 自动生成一条对应 collection 的数据
   * @returns 返回一条生成的数据
   */
  mockRecord: {
    /**
     * @param collectionName 数据表名称
     * @param data 自定义的数据，缺失时会生成随机数据
     * @param maxDepth - 生成的数据的最大深度，默认为 1，当想生成多层级数据时可以设置一个较高的值
     */
    <T = any>(collectionName: string, data?: any, maxDepth?: number): Promise<T>;
    /**
     * @param collectionName 数据表名称
     * @param maxDepth - 生成的数据的最大深度，默认为 1，当想生成多层级数据时可以设置一个较高的值
     */
    <T = any>(collectionName: string, maxDepth?: number): Promise<T>;
  };
  /**
   * 自动生成多条对应 collection 的数据
   */
  mockRecords: {
    /**
     * @param collectionName - 数据表名称
     * @param count - 生成的数据条数
     * @param maxDepth - 生成的数据的最大深度，默认为 1，当想生成多层级数据时可以设置一个较高的值
     */
    <T = any>(collectionName: string, count?: number, maxDepth?: number): Promise<T[]>;
    /**
     * @param collectionName - 数据表名称
     * @param data - 指定生成的数据
     * @param maxDepth - 生成的数据的最大深度，默认为 1，当想生成多层级数据时可以设置一个较高的值
     */
    <T = any>(collectionName: string, data?: any[], maxDepth?: number): Promise<T[]>;
  };
  /**
   * 该方法已弃用，请使用 mockCollections
   * @deprecated
   * @param collectionSettings
   * @returns
   */
  createCollections: (collectionSettings: CollectionSetting | CollectionSetting[]) => Promise<void>;
  /**
   * 根据页面 title 删除对应的页面
   * @param pageName 显示在页面菜单中的名称
   * @returns
   */
  deletePage: (pageName: string) => Promise<void>;
  /**
   * 生成一个新的角色，并和admin关联上
   */
  mockRole: <T = any>(roleSetting: AclRoleSetting) => Promise<T>;
  /**
   * 更新角色权限配置
   */
  updateRole: <T = any>(roleSetting: AclRoleSetting) => Promise<T>;
  /**
   * 创建一个外部数据源（pg）
   */
  mockExternalDataSource: <T = any>(DataSourceSetting: DataSourceSetting) => Promise<T>;
  /**
   * 删除外部数据源
   * @param key 外部数据源key
   */
  destoryExternalDataSource: <T = any>(key: string) => Promise<T>;
  /**
   * 清空区块模板，该方法应该放到测试用例开始的位置（放在末尾的话，如果测试报错会导致模板不会被清空）
   */
  clearBlockTemplates: ({
    immediate,
  }?: {
    /**
     * 是否立即清空，默认为 false。如果为 true，则会立即清空，否则会等到测试用例结束后再清空
     */
    immediate: boolean;
  }) => Promise<void>;
}

const PORT = process.env.APP_PORT || 20000;
const APP_BASE_URL = process.env.APP_BASE_URL || `http://localhost:${PORT}`;

export class NocoPage {
  protected url: string;
  protected uid: string | undefined;
  protected desktopRouteId: number | undefined;
  protected collectionsName: string[] | undefined;
  protected _waitForInit: Promise<void>;

  constructor(
    protected options?: PageConfig,
    protected page?: Page,
  ) {
    this._waitForInit = this.init();
  }

  async init() {
    const waitList = [];
    if (this.options?.collections?.length) {
      const collections: any = omitSomeFields(this.options.collections);
      this.collectionsName = collections.map((item) => item.name);

      waitList.push(createCollections(collections));
    }

    waitList.push(
      createPage({
        type: this.options?.type,
        name: this.options?.name,
        pageSchema: this.options?.pageSchema,
        tabSchema: this.options?.tabSchema,
        url: this.options?.url,
        keepUid: this.options?.keepUid,
        pageUid: this.options?.pageUid,
      }),
    );

    const result = await Promise.all(waitList);
    const { schemaUid, routeId } = result[result.length - 1] || {};

    this.uid = schemaUid;
    this.desktopRouteId = routeId;
    this.url = `${this.options?.basePath || '/admin/'}${this.uid || this.desktopRouteId}`;
  }

  async goto() {
    await this._waitForInit;
    await this.page?.goto(this.url);
  }

  async getUrl() {
    await this._waitForInit;
    return this.url;
  }
  async getUid() {
    await this._waitForInit;
    return this.uid;
  }
  async getDesktopRouteId() {
    await this._waitForInit;
    return this.desktopRouteId;
  }
  /**
   * If you are using mockRecords, then you need to use this method.
   * Wait until the mockRecords create the records successfully before navigating to the page.
   * @param this
   * @returns
   */
  async waitForInit(this: NocoPage) {
    await this._waitForInit;
    return this;
  }

  async destroy() {
    const waitList: any[] = [];
    if (this.uid || this.desktopRouteId !== undefined) {
      waitList.push(deletePage(this.uid, this.desktopRouteId));
      this.uid = undefined;
      this.desktopRouteId = undefined;
    }
    if (this.collectionsName?.length) {
      waitList.push(deleteCollections(this.collectionsName));
      this.collectionsName = undefined;
    }
    await Promise.all(waitList);
  }
}

export class NocoMobilePage extends NocoPage {
  protected mobileRouteId: number;
  protected title: string;
  constructor(
    protected options?: MobilePageConfig,
    protected page?: Page,
  ) {
    super(options, page);
  }

  getTitle() {
    return this.title;
  }

  async init() {
    const waitList = [];
    if (this.options?.collections?.length) {
      const collections: any = omitSomeFields(this.options.collections);
      this.collectionsName = collections.map((item) => item.name);

      waitList.push(createCollections(collections));
    }

    waitList.push(createMobilePage(this.options));

    const result = await Promise.all(waitList);

    const { url, pageSchemaUid, routeId, title } = result[result.length - 1];
    this.title = title;
    this.mobileRouteId = routeId;
    this.uid = pageSchemaUid;
    if (this.options?.type == 'link') {
      // 内部 URL 和外部 URL
      if (url?.startsWith('/')) {
        this.url = `${this.options?.basePath || '/m'}${url}`;
      } else {
        this.url = url;
      }
    } else {
      this.url = `${this.options?.basePath || '/m'}${url}`;
    }
  }

  async mobileDestroy() {
    // 移除 mobile routes
    await deleteMobileRoutes(this.mobileRouteId);
    // 移除 schema
    await this.destroy();
  }
}

let _page: Page;
const getPage = async (browser: Browser) => {
  if (!_page) {
    _page = await browser.newPage();
  }
  return _page;
};
const _test = base.extend<ExtendUtils>({
  page: async ({ browser }, use) => {
    await use(await getPage(browser));
  },
  mockPage: async ({ browser }, use) => {
    // 保证每个测试运行时 faker 的随机值都是一样的
    // faker.seed(1);

    const page = await getPage(browser);
    const nocoPages: NocoPage[] = [];
    const mockPage = (config?: PageConfig) => {
      const nocoPage = new NocoPage(config, page);
      nocoPages.push(nocoPage);
      return nocoPage;
    };

    await use(mockPage);

    const waitList = [];

    // 测试运行完自动销毁页面
    for (const nocoPage of nocoPages) {
      // 这里之所以不加入 waitList 是因为会导致 acl 的测试报错
      await nocoPage.destroy();
    }
    waitList.push(setDefaultRole('root'));
    // 删除掉 id 不是 1 的 users 和 name 不是 root admin member 的 roles
    waitList.push(removeRedundantUserAndRoles());

    await Promise.all(waitList);
  },
  mockMobilePage: async ({ browser }, use) => {
    // 保证每个测试运行时 faker 的随机值都是一样的
    // faker.seed(1);

    const page = await getPage(browser);
    const nocoPages: NocoMobilePage[] = [];
    const mockPage = (config?: MobilePageConfig) => {
      const nocoPage = new NocoMobilePage(config, page);
      nocoPages.push(nocoPage);
      return nocoPage;
    };

    await use(mockPage);

    const waitList = [];

    // 测试运行完自动销毁页面
    for (const nocoPage of nocoPages) {
      // 这里之所以不加入 waitList 是因为会导致 acl 的测试报错
      await nocoPage.mobileDestroy();
    }
    waitList.push(setDefaultRole('root'));
    // 删除掉 id 不是 1 的 users 和 name 不是 root admin member 的 roles
    waitList.push(removeRedundantUserAndRoles());

    await Promise.all(waitList);
  },
  mockManualDestroyPage: async ({ browser }, use) => {
    const mockManualDestroyPage = (config?: PageConfig) => {
      const nocoPage = new NocoPage(config);
      return nocoPage;
    };

    await use(mockManualDestroyPage);
  },
  createCollections: async ({ browser }, use) => {
    let collectionsName: string[] = [];

    const _createCollections = async (collectionSettings: CollectionSetting | CollectionSetting[]) => {
      collectionSettings = omitSomeFields(
        Array.isArray(collectionSettings) ? collectionSettings : [collectionSettings],
      );
      collectionsName = [...collectionsName, ...collectionSettings.map((item) => item.name)];
      await createCollections(collectionSettings);
    };

    await use(_createCollections);

    if (collectionsName.length) {
      await deleteCollections(_.uniq(collectionsName));
    }
  },
  mockCollections: async ({ browser }, use) => {
    let collectionsName: string[] = [];
    const destroy = async () => {
      if (collectionsName.length) {
        await deleteCollections(_.uniq(collectionsName));
      }
    };

    const mockCollections = async (collectionSettings: CollectionSetting[]) => {
      collectionSettings = omitSomeFields(collectionSettings);
      collectionsName = [...collectionsName, ...collectionSettings.map((item) => item.name)];
      return createCollections(collectionSettings);
    };

    await use(mockCollections);
    await destroy();
  },
  mockCollection: async ({ browser }, use) => {
    let collectionsName: string[] = [];
    const destroy = async () => {
      if (collectionsName.length) {
        await deleteCollections(_.uniq(collectionsName));
      }
    };

    const mockCollection = async (collectionSetting: CollectionSetting, options?: { manualDestroy: boolean }) => {
      const collectionSettings = omitSomeFields([collectionSetting]);
      collectionsName = [...collectionsName, ...collectionSettings.map((item) => item.name)];
      return createCollections(collectionSettings);
    };

    await use(mockCollection);
    await destroy();
  },
  mockRecords: async ({ browser }, use) => {
    const mockRecords = async (collectionName: string, count: any = 3, data?: any) => {
      let maxDepth: number;
      if (_.isNumber(data)) {
        maxDepth = data;
        data = undefined;
      }
      if (_.isArray(count)) {
        data = count;
        count = data.length;
      }
      return createRandomData(collectionName, count, data, maxDepth);
    };

    await use(mockRecords);
  },
  mockRecord: async ({ browser }, use) => {
    const mockRecord = async (collectionName: string, data?: any, maxDepth?: any) => {
      if (_.isNumber(data)) {
        maxDepth = data;
        data = undefined;
      }

      const result = await createRandomData(collectionName, 1, data, maxDepth);
      return result[0];
    };

    await use(mockRecord);
  },
  deletePage: async ({ browser }, use) => {
    const page = await getPage(browser);

    const deletePage = async (pageName: string) => {
      await page.getByLabel(pageName, { exact: true }).hover();
      await page.getByRole('button', { name: 'designer-schema-settings-' }).hover();
      await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
    };

    await use(deletePage);
  },
  mockRole: async ({ browser }, use) => {
    const mockRole = async (roleSetting: AclRoleSetting) => {
      return createRole(roleSetting);
    };

    await use(mockRole);
  },
  updateRole: async ({ browser }, use) => {
    await use(updateRole);
  },
  mockExternalDataSource: async ({ browser }, use) => {
    const mockExternalDataSource = async (DataSourceSetting: DataSourceSetting) => {
      return createExternalDataSource(DataSourceSetting);
    };

    await use(mockExternalDataSource);
  },
  destoryExternalDataSource: async ({ browser }, use) => {
    const destoryDataSource = async (key: string) => {
      return destoryExternalDataSource(key);
    };

    await use(destoryDataSource);
  },
  clearBlockTemplates: async ({ browser }, use) => {
    // 用来标记当前测试用例是否已经结束，只有结束了才会清空区块模板
    let ended = false;
    let isImmediate = false;
    const clearBlockTemplates = async ({ immediate } = { immediate: false }) => {
      isImmediate = immediate;
      if (!ended && !immediate) {
        return;
      }

      const api = await request.newContext({
        storageState: process.env.PLAYWRIGHT_AUTH_FILE,
      });

      const state = await api.storageState();
      const headers = getHeaders(state);
      const filter = {
        key: { $exists: true },
      };

      const result = await api.post(`/api/uiSchemaTemplates:destroy?filter=${JSON.stringify(filter)}`, {
        headers,
      });

      if (!result.ok()) {
        throw new Error(await result.text());
      }
    };

    await use(clearBlockTemplates);
    ended = true;
    if (!isImmediate) {
      await clearBlockTemplates();
    }
  },
});

export const test = Object.assign(_test, {
  /** 只运行在 postgres 数据库中 */
  pgOnly: process.env.DB_DIALECT == 'postgres' ? _test : _test.skip,
});

const getStorageItem = (key: string, storageState: any) => {
  return storageState.origins
    .find((item) => item.origin === APP_BASE_URL)
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
const createPage = async (options?: CreatePageOptions) => {
  const { type = 'page', url, name, pageSchema, tabSchema, keepUid, pageUid: pageUidFromOptions } = options || {};
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });

  const schema = getPageMenuSchemaWithTabSchema({ tabSchema }) || pageSchema;

  const state = await api.storageState();
  const headers = getHeaders(state);
  const newPageSchema = keepUid ? schema : updateUidOfPageSchema(schema);
  const pageSchemaUid = newPageSchema?.['x-uid'] || uid();
  const newTabSchemaUid = uid();
  const newTabSchemaName = uid();

  const title = name || pageSchemaUid;

  let routeId;
  let schemaUid;

  if (type === 'group') {
    const result = await api.post('/api/desktopRoutes:create', {
      headers,
      data: {
        type: 'group',
        title,
        hideInMenu: false,
      },
    });

    if (!result.ok()) {
      throw new Error(await result.text());
    }

    const data = await result.json();
    routeId = data.data?.id;
  }

  if (type === 'page') {
    const routeResult = await api.post('/api/desktopRoutes:create', {
      headers,
      data: {
        type: 'page',
        title,
        schemaUid: pageSchemaUid,
        hideInMenu: false,
        enableTabs: !!newPageSchema?.['x-component-props']?.enablePageTabs,
        children: newPageSchema
          ? schemaToRoutes(newPageSchema)
          : [
              {
                type: 'tabs',
                title: '{{t("Unnamed")}}',
                schemaUid: newTabSchemaUid,
                tabSchemaName: newTabSchemaName,
                hideInMenu: false,
              },
            ],
      },
    });

    if (!routeResult.ok()) {
      throw new Error(await routeResult.text());
    }

    const schemaResult = await api.post(`/api/uiSchemas:insert`, {
      headers,
      data:
        newPageSchema ||
        getPageMenuSchema({
          pageSchemaUid,
          tabSchemaUid: newTabSchemaUid,
          tabSchemaName: newTabSchemaName,
        }),
    });

    if (!schemaResult.ok()) {
      throw new Error(await routeResult.text());
    }

    const data = await routeResult.json();
    routeId = data.data?.id;
    schemaUid = pageSchemaUid;
  }

  if (type === 'link') {
    const result = await api.post('/api/desktopRoutes:create', {
      headers,
      data: {
        type: 'link',
        title,
        hideInMenu: false,
        options: {
          href: url,
        },
      },
    });

    if (!result.ok()) {
      throw new Error(await result.text());
    }

    const data = await result.json();
    routeId = data.data?.id;
  }

  return { schemaUid, routeId };
};

/**
 * 在 NocoBase 中创建一个移动端页面
 */
const createMobilePage = async (options?: CreateMobilePageOptions) => {
  const { type = 'page', url, name, pageSchema, keepUid } = options || {};
  function randomStr() {
    return Math.random().toString(36).substring(2);
  }
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });
  const state = await api.storageState();
  const headers = getHeaders(state);
  const pageSchemaUid = name || uid();
  const schemaUrl = `/page/${pageSchemaUid}`;
  const firstTabUid = uid();
  const title = name || randomStr();

  // 创建路由
  const routerResponse: any = await api.post(`/api/mobileRoutes:create`, {
    headers,
    data: {
      type: type,
      schemaUid: pageSchemaUid,
      title: title,
      icon: 'appstoreoutlined',
      options: {
        url,
      },
    },
  });
  const responseData = await routerResponse.json();
  const routeId = responseData.data.id;
  if (!routerResponse.ok()) {
    throw new Error(await routerResponse.text());
  }

  if (type === 'link') return { url, routeId, title };

  // 创建空页面
  const createSchemaResult = await api.post(`/api/uiSchemas:insertAdjacent?resourceIndex=mobile&position=beforeEnd`, {
    headers,
    data: {
      schema: {
        type: 'void',
        name: pageSchemaUid,
        'x-uid': pageSchemaUid,
        'x-component': 'MobilePageProvider',
        'x-settings': 'mobile:page',
        'x-decorator': 'BlockItem',
        'x-toolbar-props': {
          draggable: false,
          spaceWrapperStyle: {
            right: -15,
            top: -15,
          },
          spaceClassName: 'css-m1q7xw',
          toolbarStyle: {
            overflowX: 'hidden',
          },
        },
        properties: {
          header: {
            type: 'void',
            'x-component': 'MobilePageHeader',
            properties: {
              pageNavigationBar: {
                type: 'void',
                'x-component': 'MobilePageNavigationBar',
                properties: {
                  actionBar: {
                    type: 'void',
                    'x-component': 'MobileNavigationActionBar',
                    'x-initializer': 'mobile:navigation-bar:actions',
                    'x-component-props': {
                      spaceProps: {
                        style: {
                          flexWrap: 'nowrap',
                        },
                      },
                    },
                    name: 'actionBar',
                  },
                },
                name: 'pageNavigationBar',
              },
              pageTabs: {
                type: 'void',
                'x-component': 'MobilePageTabs',
                name: 'pageTabs',
              },
            },
            name: 'header',
          },
          content: {
            type: 'void',
            'x-component': 'MobilePageContent',
            properties: {
              [firstTabUid]: {
                ...((keepUid ? pageSchema : updateUidOfPageSchema(pageSchema)) || {
                  type: 'void',
                  'x-uid': firstTabUid,
                  'x-async': true,
                  'x-component': 'Grid',
                  'x-initializer': 'mobile:addBlock',
                }),
                name: firstTabUid,
                'x-uid': firstTabUid,
              },
            },
          },
        },
      },
    },
  });

  if (!createSchemaResult.ok()) {
    throw new Error(await createSchemaResult.text());
  }

  // 创建第一个 tab
  const createTabResponse = await api.post(`/api/mobileRoutes:create`, {
    headers,
    data: {
      parentId: routeId,
      type: 'tabs',
      title: 'Unnamed',
      schemaUid: firstTabUid,
    },
  });

  if (!createTabResponse.ok()) {
    throw new Error(await createTabResponse.text());
  }

  return { url: schemaUrl, pageSchemaUid, routeId, title };
};

export const removeAllMobileRoutes = async () => {
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });

  const state = await api.storageState();
  const headers = getHeaders(state);

  const result = await api.post(
    `/api/mobileRoutes:destroy?filter=%7B%22%24and%22%3A%5B%7B%22id%22%3A%7B%22%24ne%22%3A0%7D%7D%5D%7D`,
    {
      headers,
    },
  );

  if (!result.ok()) {
    throw new Error(await result.text());
  }
};

/**
 * 根据页面 id 删除一个 Mobile Routes 的页面
 */
const deleteMobileRoutes = async (mobileRouteId: number) => {
  if (!mobileRouteId) return;
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });

  const state = await api.storageState();
  const headers = getHeaders(state);

  const result = await api.post(`/api/mobileRoutes:destroy?filterByTk=${mobileRouteId}`, {
    headers,
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }

  const result2 = await api.post(
    `/api/mobileRoutes:destroy?filter=${encodeURIComponent(JSON.stringify({ parentId: mobileRouteId }))}`,
    {
      headers,
    },
  );

  if (!result2.ok()) {
    throw new Error(await result2.text());
  }
};

/**
 * 根据页面 uid 删除一个页面的 schema，根据页面路由的 id 删除一个页面的路由
 */
const deletePage = async (pageUid: string, routeId: number) => {
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });

  const state = await api.storageState();
  const headers = getHeaders(state);

  if (routeId !== undefined) {
    const routeResult = await api.post(`/api/desktopRoutes:destroy?filterByTk=${routeId}`, {
      headers,
    });

    if (!routeResult.ok()) {
      throw new Error(await routeResult.text());
    }
  }

  if (pageUid) {
    const result = await api.post(`/api/uiSchemas:remove/${pageUid}`, {
      headers,
    });

    if (!result.ok()) {
      throw new Error(await result.text());
    }
  }
};

const deleteCollections = async (collectionNames: string[]) => {
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });

  const state = await api.storageState();
  const headers = getHeaders(state);
  const params = collectionNames.map((name) => `filterByTk[]=${name}`).join('&');

  const result = await api.post(`/api/collections:destroy?${params}`, {
    headers,
    params: {
      cascade: true,
    },
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
};

/**
 * 将数据表中 mock 出来的 records 删除掉
 * @param collectionName
 * @param records
 */
export const deleteRecords = async (collectionName: string, filter: any) => {
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });

  const state = await api.storageState();
  const headers = getHeaders(state);

  const result = await api.post(`/api/${collectionName}:destroy?filter=${JSON.stringify(filter)}`, {
    headers,
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
};

/**
 * 删除一些不需要的字段，如 key
 * @param collectionSettings
 * @returns
 */
export const omitSomeFields = (collectionSettings: CollectionSetting[]): any[] => {
  return collectionSettings.map((collection) => {
    return {
      ..._.omit(collection, ['key']),
      fields: collection.fields?.map((field) => _.omit(field, ['key', 'collectionName'])),
    };
  });
};

/**
 * 根据配置创建一个或多个 collection
 * @param page 运行测试的 page 实例
 * @param collectionSettings
 * @returns
 */
const createCollections = async (collectionSettings: CollectionSetting | CollectionSetting[]) => {
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });

  const state = await api.storageState();
  const headers = getHeaders(state);
  collectionSettings = Array.isArray(collectionSettings) ? collectionSettings : [collectionSettings];

  const result = await api.post(`/api/collections:mock`, {
    headers,
    data: collectionSettings,
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }

  return (await result.json()).data;
};

/**
 * 根据配置创建一个角色并将角色关联给superAdmin且切换到新角色
 * @param page 运行测试的 page 实例
 * @param AclRoleSetting
 * @returns
 */
const createRole = async (roleSetting: AclRoleSetting) => {
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });

  const state = await api.storageState();
  const headers = getHeaders(state);
  const name = roleSetting.name || uid();

  const result = await api.post(`/api/users/1/roles:create`, {
    headers,
    data: { ...roleSetting, name, title: name },
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
  const roleData = (await result.json()).data;
  await setDefaultRole(name);
  return roleData;
};

/**
 * 根据配置更新角色权限
 * @param page 运行测试的 page 实例
 * @param AclRoleSetting
 * @returns
 */
const updateRole = async (roleSetting: AclRoleSetting) => {
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });
  const state = await api.storageState();
  const headers = getHeaders(state);
  const name = roleSetting.name;
  const dataSourceKey = roleSetting.dataSourceKey;

  const url = !dataSourceKey
    ? `/api/roles:update?filterByTk=${name}`
    : `/api/dataSources/${dataSourceKey}/roles:update?filterByTk=${name}`;
  const result = await api.post(url, {
    headers,
    data: { ...roleSetting },
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
  const roleData = (await result.json()).data;
  return roleData;
};

/**
 * 设置默认角色
 * @param name
 */
const setDefaultRole = async (name) => {
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });
  const state = await api.storageState();
  const headers = getHeaders(state);
  const result = await api.post(`/api/users:setDefaultRole`, {
    headers,
    data: { roleName: name },
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
};

/**
 * 创建外部数据源
 * @paramn
 */
const createExternalDataSource = async (dataSourceSetting: DataSourceSetting) => {
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });
  const state = await api.storageState();
  const headers = getHeaders(state);
  const result = await api.post(`/api/dataSources:create`, {
    headers,
    data: { ...dataSourceSetting },
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
  return (await result.json()).data;
};

/**
 * 删除外部数据源
 * @paramn
 */
const destoryExternalDataSource = async (key) => {
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });
  const state = await api.storageState();
  const headers = getHeaders(state);
  const result = await api.post(`/api/dataSources:destroy?filterByTk=${key}`, {
    headers,
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
  return (await result.json()).data;
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
    phone: () => faker.phone.number(),
    email: () => faker.internet.email(),
    url: () => faker.internet.url(),
    integer: () => faker.number.int(),
    number: () => faker.number.int(),
    percent: () => faker.number.float(),
    password: () => faker.internet.password(),
    color: () => faker.internet.color(),
    icon: () => 'checkcircleoutlined',
    datetime: () => faker.date.anytime({ refDate: '2023-09-21T00:00:00.000Z' }),
    time: () => '00:00:00',
  };
  const result = {};

  collectionSetting.fields?.forEach((field) => {
    if (field.name && excludeField.includes(field.name)) {
      return;
    }

    if (basicInterfaceToData[field.interface] && field.name) {
      result[field.name] = basicInterfaceToData[field.interface]();
    }
  });

  return result;
};

const createRandomData = async (collectionName: string, count = 10, data?: any, maxDepth?: number) => {
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });

  const state = await api.storageState();
  const headers = getHeaders(state);

  const result = await api.post(
    `/api/${collectionName}:mock?count=${count}&maxDepth=${_.isNumber(maxDepth) ? maxDepth : 1}`,
    {
      headers,
      data,
    },
  );

  if (!result.ok()) {
    throw new Error(await result.text());
  }

  return (await result.json()).data;
};

// 删除掉 id 不是 1 的 users 和 name 不是 root admin member 的 roles
async function removeRedundantUserAndRoles() {
  const deletePromises = [
    deleteRecords('users', { id: { $ne: 1 } }),
    deleteRecords('roles', { name: { $ne: ['root', 'admin', 'member'] } }),
  ];
  await Promise.all(deletePromises);
}

function getHeaders(storageState: any) {
  const headers: any = {};
  const token = getStorageItem('NOCOBASE_TOKEN', storageState);
  const auth = getStorageItem('NOCOBASE_AUTH', storageState);
  const subAppName = new URL(APP_BASE_URL).pathname.match(/^\/apps\/([^/]*)\/*/)?.[1];
  const hostName = new URL(APP_BASE_URL).host;
  const locale = getStorageItem('NOCOBASE_LOCALE', storageState);
  const timezone = '+08:00';
  const withAclMeta = 'true';
  const role = getStorageItem('NOCOBASE_ROLE', storageState);

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (auth) {
    headers['X-Authenticator'] = auth;
  }
  if (subAppName) {
    headers['X-App'] = subAppName;
  }
  if (hostName) {
    headers['X-Hostname'] = hostName;
  }
  if (locale) {
    headers['X-Locale'] = locale;
  }
  if (timezone) {
    headers['X-Timezone'] = timezone;
  }
  if (withAclMeta) {
    headers['X-With-Acl-Meta'] = withAclMeta;
  }
  if (role) {
    headers['X-Role'] = role;
  }

  return headers;
}

interface ExpectSettingsMenuParams {
  showMenu: () => Promise<void>;
  supportedOptions: string[];
  page: Page;
  unsupportedOptions?: string[];
}

/**
 * 辅助断言 SchemaSettings 的菜单项是否存在
 * @param param0
 */
export async function expectSettingsMenu({
  showMenu,
  supportedOptions,
  page,
  unsupportedOptions,
}: ExpectSettingsMenuParams) {
  await page.waitForTimeout(100);
  await showMenu();
  await page.waitForTimeout(2000);
  for (const option of supportedOptions) {
    await expect(page.getByRole('menuitem', { name: option, exact: option === 'Edit' })).toBeVisible();
  }
  if (unsupportedOptions) {
    for (const option of unsupportedOptions) {
      await expect(page.getByRole('menuitem', { name: option, exact: option === 'Edit' })).not.toBeVisible();
    }
  }
}

/**
 * 辅助断言 Initializer 的菜单项是否存在
 * @param param0
 */
export async function expectInitializerMenu({
  showMenu,
  supportedOptions,
  page,
  expectValue,
}: {
  showMenu: () => Promise<void>;
  supportedOptions: string[];
  page: Page;
  expectValue?: () => Promise<void>;
}) {
  await showMenu();
  for (const option of supportedOptions) {
    // 使用 first 方法避免有重名的导致报错
    await expect(page.getByRole('menuitem', { name: option }).first()).toBeVisible();
  }
  await page.mouse.move(300, 0);
  if (expectValue) {
    await expectValue();
  }
}

/**
 * 用于辅助在 page 中创建区块
 * @param page
 * @param name
 */
export const createBlockInPage = async (page: Page, name: string) => {
  await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();

  if (name === 'Form') {
    await page.getByText('Form', { exact: true }).first().hover();
  } else if (name === 'Filter form') {
    await page.getByText('Form', { exact: true }).nth(1).hover();
  } else {
    await page.getByText(name, { exact: true }).hover();
  }

  if (name === 'Markdown') {
    await page.getByRole('menuitem', { name: 'Markdown' }).click();
  } else {
    await page.getByRole('menuitem', { name: 'Users' }).click();
  }

  await page.mouse.move(300, 0);
};

export const mockUserRecordsWithoutDepartments = (mockRecords: ExtendUtils['mockRecords'], count: number) => {
  return mockRecords(
    'users',
    Array.from({ length: count }).map(() => ({
      departments: null,
      mainDepartment: null,
    })),
  );
};

/**
 * 用来辅助断言是否支持某些变量
 * @param page
 * @param variables
 */
export async function expectSupportedVariables(page: Page, variables: string[]) {
  for (const name of variables) {
    await expect(page.getByRole('menuitemcheckbox', { name })).toBeVisible();
  }
}

function schemaToRoutes(schema: any) {
  const schemaKeys = Object.keys(schema.properties || {});

  if (schemaKeys.length === 0) {
    return [];
  }

  const result = schemaKeys.map((key: string) => {
    const item = schema.properties[key];

    // Tab
    return {
      type: 'tabs',
      title: item.title || '{{t("Unnamed")}}',
      icon: item['x-component-props']?.icon,
      schemaUid: item['x-uid'],
      tabSchemaName: key,
      hideInMenu: false,
    };
  });

  return result;
}

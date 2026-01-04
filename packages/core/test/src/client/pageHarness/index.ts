/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  Application,
  PluginFlowEngine,
  LocalDataSource,
  DEFAULT_DATA_SOURCE_KEY,
  DEFAULT_DATA_SOURCE_TITLE,
} from '@nocobase/client';
import type { CollectionOptions, DataSourceOptions } from '@nocobase/client';
import type { FlowModel, FlowView } from '@nocobase/flow-engine';
import { observable } from '@nocobase/flow-engine';
import type { PageTestHarnessConfig, ApiMockConfig, HarnessDataSourceConfig, NormalizedPageSpec } from './types';
import MockAdapter from 'axios-mock-adapter';
import { PageTestHarness } from './PageTestHarness';
import { normalizePageConfig } from './normalizer';

/**
 * 设置 API Mocks
 */
function setupApiMocks(mockAdapter: MockAdapter, mocks: ApiMockConfig[]): void {
  if (!mockAdapter || !mocks || mocks.length === 0) {
    return;
  }

  for (const mock of mocks) {
    const { url, method = 'get', response, delay = 0 } = mock;
    const handlerName = `on${method.charAt(0).toUpperCase()}${method.slice(1)}` as keyof MockAdapter;
    const handler = (mockAdapter as any)[handlerName]?.call(mockAdapter, url);
    if (!handler || typeof handler.reply !== 'function') {
      console.warn(`Unknown HTTP method: ${method}`);
      continue;
    }

    handler.reply(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, response]);
        }, delay);
      });
    });
  }
}

/**
 * 设置模拟数据
 */
function setupMockData(mockAdapter: MockAdapter, data: Record<string, any[]>): void {
  if (!mockAdapter || !data) {
    return;
  }

  for (const [collection, records] of Object.entries(data)) {
    const listPattern = new RegExp(`${collection}:list`);
    const getPattern = new RegExp(`${collection}:get`);
    const createPattern = new RegExp(`${collection}:create`);
    const updatePattern = new RegExp(`${collection}:update`);
    const destroyPattern = new RegExp(`${collection}:destroy`);

    // Mock list endpoint
    mockAdapter.onGet(listPattern).reply(() => {
      return [
        200,
        {
          data: records,
          meta: {
            count: records.length,
            page: 1,
            pageSize: records.length,
            totalPage: 1,
          },
        },
      ];
    });

    // Mock get endpoint
    mockAdapter.onGet(getPattern).reply((config) => {
      const filterByTk = config.params?.filterByTk;
      const record = records.find((r) => r.id === filterByTk);
      return [200, { data: record || null }];
    });

    // Mock create endpoint
    mockAdapter.onPost(createPattern).reply((config) => {
      const newRecord = JSON.parse(config.data);
      const id = Math.max(...records.map((r) => r.id || 0), 0) + 1;
      const record = { id, ...newRecord };
      records.push(record);
      return [200, { data: record }];
    });

    // Mock update endpoint
    mockAdapter.onPost(updatePattern).reply((config) => {
      const filterByTk = config.params?.filterByTk;
      const updates = JSON.parse(config.data);
      const index = records.findIndex((r) => r.id === filterByTk);
      if (index !== -1) {
        records[index] = { ...records[index], ...updates };
        return [200, { data: records[index] }];
      }
      return [404, { error: 'Record not found' }];
    });

    // Mock delete endpoint
    mockAdapter.onPost(destroyPattern).reply((config) => {
      const filterByTk = config.params?.filterByTk;
      const index = records.findIndex((r) => r.id === filterByTk);
      if (index !== -1) {
        records.splice(index, 1);
        return [200, { data: { success: true } }];
      }
      return [404, { error: 'Record not found' }];
    });
  }
}

/**
 * 创建数据源
 */
function ensureAppDataSource(app: Application, key: string, options: DataSourceOptions): void {
  const existing = app.dataSourceManager.getDataSource(key);
  if (existing) {
    existing.setOptions(options);
    existing.collectionManager.setCollections(options.collections || []);
    return;
  }
  app.dataSourceManager.addDataSource(LocalDataSource, options);
}

function createHarnessRootView(model: FlowModel): FlowView {
  return {
    type: 'embed',
    inputArgs: {
      viewUid: model.uid,
      dataSourceKey: DEFAULT_DATA_SOURCE_KEY,
      hidden: { value: false },
    },
    Header: null,
    Footer: null,
    close: () => undefined,
    update: () => undefined,
    destroy: () => undefined,
  };
}

function attachHarnessRootView(app: Application, model: FlowModel): void {
  const view = createHarnessRootView(model);
  app.flowEngine.context.defineProperty('view', { value: view });
  model.context.defineProperty('view', { value: view });
  const pageActiveRef = observable.ref(true);
  app.flowEngine.context.defineProperty('pageActive', { value: pageActiveRef });
  model.context.defineProperty('pageActive', { value: pageActiveRef });
}

function ensureDefaultApiMocks(spec: NormalizedPageSpec, config: PageTestHarnessConfig): void {
  if (!spec.apiMocks) {
    spec.apiMocks = [];
  }

  const apiMocks = spec.apiMocks;

  const ensureMock = (url: string, payload: ApiMockConfig) => {
    const exists = apiMocks.some((mock) => mock.url === url);
    if (!exists) {
      apiMocks.push(payload);
    }
  };

  ensureMock('desktopRoutes:getAccessible', {
    url: 'desktopRoutes:getAccessible',
    method: 'get',
    response: {
      data: {
        id: spec.rootPageModelConfig.uid,
        schemaUid: spec.rootPageModelConfig.uid,
        title: config.pageTitle || 'Test page',
        type: 'page',
        hideInMenu: false,
        children: [],
      },
    },
  });

  ensureMock('roles:check', {
    url: 'roles:check',
    method: 'get',
    response: {
      data: {
        role: 'root',
        roleMode: 'default',
        snippets: ['ui.*'],
        allowAll: true,
        allowConfigure: true,
        allowAnonymous: false,
        allowMenuItemIds: [],
        availableActions: ['create', 'view', 'update', 'destroy'],
        uiButtonSchemasBlacklist: [],
        resources: [],
        actions: {},
        actionAlias: {},
        strategy: {},
      },
      meta: {
        dataSources: {
          [DEFAULT_DATA_SOURCE_KEY]: {
            snippets: ['ui.*'],
            allowAll: true,
            resources: [],
            actions: {},
            actionAlias: {},
            strategy: {},
          },
        },
      },
    },
  });
}

function setupDataSources(app: Application, dataSources: Record<string, HarnessDataSourceConfig>): void {
  if (!dataSources || Object.keys(dataSources).length === 0) {
    return;
  }

  for (const [entryKey, config] of Object.entries(dataSources)) {
    const key = config?.key || entryKey;
    const {
      displayName = key === DEFAULT_DATA_SOURCE_KEY ? DEFAULT_DATA_SOURCE_TITLE : key,
      collections: rawCollections = [] as CollectionOptions[],
      status = 'loaded',
      ...rest
    } = config || {};
    const collections = rawCollections;

    const normalizedOptions: DataSourceOptions = {
      key,
      displayName,
      status,
      collections,
      ...rest,
    } as DataSourceOptions;

    ensureAppDataSource(app, key, normalizedOptions);

    const flowDataSourceManager = app.flowEngine?.context?.dataSourceManager;
    if (flowDataSourceManager) {
      flowDataSourceManager.upsertDataSource({
        key,
        displayName,
        status,
        ...rest,
      });
      const flowDS = flowDataSourceManager.getDataSource(key);
      flowDS?.upsertCollections(collections as any[]);
    }
  }
}

/**
 * 创建 collections
 */
async function setupCollections(mockAdapter: MockAdapter, collections: any[]): Promise<void> {
  if (!mockAdapter || !collections || collections.length === 0) {
    return;
  }

  mockAdapter.onGet(/collections:list/).reply(() => {
    return [
      200,
      {
        data: collections.map((c) => ({
          name: c.name,
          title: c.title || c.name,
          fields: c.fields || [],
        })),
      },
    ];
  });

  for (const collection of collections) {
    mockAdapter.onGet(new RegExp(`collections:get.*filterByTk=${collection.name}`)).reply(() => {
      return [
        200,
        {
          data: {
            name: collection.name,
            title: collection.title || collection.name,
            fields: collection.fields || [],
          },
        },
      ];
    });
  }
}

/**
 * 创建页面测试工具
 *
 * @example
 * ```typescript
 * // 简单示例
 * const harness = await createPageTestHarness({
 *   blocks: [
 *     { type: 'Table', collection: 'users' }
 *   ]
 * });
 *
 * // 带数据和多个区块
 * const harness = await createPageTestHarness({
 *   blocks: [
 *     {
 *       type: 'Table',
 *       collection: 'users',
 *       stepParams: {
 *         tableSettings: {
 *           showIndex: true,
 *           pageSize: 20
 *         }
 *       }
 *     }
 *   ],
 *   data: {
 *     users: [
 *       { id: 1, name: 'Alice' },
 *       { id: 2, name: 'Bob' }
 *     ]
 *   }
 * });
 *
 * await harness.render();
 * const tableBlock = harness.findBlock((b) => b.collection === 'users');
 * ```
 */
export async function createPageTestHarness(config: PageTestHarnessConfig = {}): Promise<PageTestHarness> {
  // 规范化配置
  const spec = normalizePageConfig(config);

  // 确保 Flow 引擎插件始终可用
  const plugins: (typeof PluginFlowEngine)[] = [...(spec.plugins || [])];
  if (!plugins.includes(PluginFlowEngine)) {
    plugins.unshift(PluginFlowEngine);
  }

  // 创建 Application
  const app = new Application({
    router: {
      type: 'memory',
      initialEntries: ['/'],
    },
    plugins,
    designable: true,
  });

  await app.pm.load();

  const mockAdapter = new MockAdapter(app.apiClient.axios);

  // 设置 collections
  await setupCollections(mockAdapter, spec.collections);

  // 设置数据源
  setupDataSources(app, spec.dataSources);

  // 设置模拟数据
  if (config.data) {
    setupMockData(mockAdapter, config.data);
  }

  ensureDefaultApiMocks(spec, config);

  // 设置 API Mocks
  setupApiMocks(mockAdapter, spec.apiMocks);

  // 注册自定义区块
  if (config.customBlocks) {
    for (const [name, ModelClass] of Object.entries(config.customBlocks)) {
      app.flowEngine.registerModels({
        [name]: ModelClass,
      });
    }
  }

  // 注册 FlowEngine models 和 actions
  if (config.flowEngine) {
    if (config.flowEngine.models) {
      app.flowEngine.registerModels(config.flowEngine.models);
    }
    if (config.flowEngine.actions) {
      for (const action of config.flowEngine.actions) {
        (app.flowEngine as any).registerAction?.(action);
      }
    }
  }

  // 创建根页面模型
  const rootPageModel = app.flowEngine.createModel(spec.rootPageModelConfig);
  attachHarnessRootView(app, rootPageModel);

  // 创建 PageTestHarness 实例
  const harness = new PageTestHarness(app, spec);
  harness.setRootPageModel(rootPageModel);

  return harness;
}

// 导出类型
export * from './types';
export { PageTestHarness } from './PageTestHarness';
export { normalizePageConfig } from './normalizer';

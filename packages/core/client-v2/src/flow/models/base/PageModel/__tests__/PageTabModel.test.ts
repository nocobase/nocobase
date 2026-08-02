/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { registerFlowMock } = vi.hoisted(() => ({
  registerFlowMock: vi.fn(),
}));

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    FlowModel: class {
      props: any;
      context: any;
      stepParams: any;

      constructor(options: any = {}) {
        this.props = options.props || {};
        this.context = options.context || {};
        this.stepParams = options.stepParams || {};
      }

      serialize() {
        return { flowRegistry: {} };
      }

      setProps(key: string, value: any) {
        this.props[key] = value;
      }

      onInit() {}
      static registerFlow(flow: any) {
        registerFlowMock(flow);
      }
      static registerEvents() {}
      static define() {}
    },
    tExpr: (str: string) => str,
    FlowModelRenderer: () => null,
    observable: {
      ref: (value: any) => value,
    },
  };
});

vi.mock('ahooks', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useRequest: () => ({ data: null, loading: false }),
  };
});

type RootPageTabModelClass = typeof import('../PageTabModel').RootPageTabModel;

type TestRoute = {
  schemaUid?: string;
  options?: Record<string, unknown>;
} & Record<string, unknown>;

type RootPageTabModelTestOptions = {
  props?: {
    route?: TestRoute;
  };
  stepParams?: {
    pageTabSettings?: {
      tab?: {
        title?: string;
        icon?: string;
        documentTitle?: string;
      };
    };
  };
  context: {
    api: {
      request: ReturnType<typeof vi.fn>;
    };
    routeRepository?: {
      getRouteBySchemaUid?: (schemaUid: string) => TestRoute | undefined;
      refreshAccessible?: () => Promise<unknown>;
    };
    refreshDesktopRoutes?: () => Promise<unknown>;
    logger?: {
      warn?: (context: { err: unknown }, message: string) => void;
    };
    t: (value: string) => string;
  };
};

type RootPageTabModelTestConstructor = new (
  options: RootPageTabModelTestOptions,
) => InstanceType<RootPageTabModelClass>;

function createRootPageTabModel(Model: RootPageTabModelClass, options: RootPageTabModelTestOptions) {
  const TestModel = Model as unknown as RootPageTabModelTestConstructor;
  return new TestModel(options);
}

describe('PageTabModel', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('should expose documentTitle field in Edit tab settings', async () => {
    await import('../PageTabModel');
    const flow = registerFlowMock.mock.calls.find((call) => call[0]?.key === 'pageTabSettings')?.[0];

    expect(flow).toBeTruthy();
    expect(flow.steps.tab.uiSchema.documentTitle).toMatchObject({
      type: 'string',
      title: 'Document title',
      'x-decorator': 'FormItem',
    });
    expect(flow.steps.tab.uiSchema.documentTitle.description).toContain('browser tab title');
  });

  it('should place documentTitle right below tab name in Edit tab settings', async () => {
    await import('../PageTabModel');
    const flow = registerFlowMock.mock.calls.find((call) => call[0]?.key === 'pageTabSettings')?.[0];
    const keys = Object.keys(flow.steps.tab.uiSchema);

    expect(keys.indexOf('documentTitle')).toBe(keys.indexOf('title') + 1);
  });

  it('should trigger parent page title update in tab settings handler', async () => {
    await import('../PageTabModel');
    const flow = registerFlowMock.mock.calls.find((call) => call[0]?.key === 'pageTabSettings')?.[0];
    const handler = flow.steps.tab.handler;

    const setProps = vi.fn();
    const updateDocumentTitle = vi.fn().mockResolvedValue(undefined);
    const ctx = {
      model: {
        parentId: 'page-1',
        setProps,
      },
      engine: {
        getModel: vi.fn(() => ({ updateDocumentTitle })),
      },
    } as any;

    await handler(ctx, { title: 'New tab', icon: 'TableOutlined', documentTitle: 'Tab doc title' });

    expect(setProps).toHaveBeenCalledWith('title', 'New tab');
    expect(setProps).toHaveBeenCalledWith('icon', 'TableOutlined');
    expect(updateDocumentTitle).toHaveBeenCalledTimes(1);
  });

  it('should persist tab documentTitle to route options on save', async () => {
    const { RootPageTabModel } = await import('../PageTabModel');
    const request = vi.fn().mockResolvedValue({});
    const model = createRootPageTabModel(RootPageTabModel, {
      props: {
        route: {
          schemaUid: 'tab-1',
        },
      },
      stepParams: {
        pageTabSettings: {
          tab: {
            title: 'Tab title',
            icon: 'TableOutlined',
            documentTitle: 'Tab doc title',
          },
        },
      },
      context: {
        api: { request },
        t: (value: string) => value,
      },
    });

    await model.save();

    const call = request.mock.calls[0][0];
    expect(call.url).toBe('desktopRoutes:updateOrCreate');
    expect(call.data.options.documentTitle).toBe('Tab doc title');
  });

  it('should update a persisted tab route by id with only editable fields and latest options', async () => {
    const { RootPageTabModel } = await import('../PageTabModel');
    const request = vi.fn().mockResolvedValue({});
    const model = createRootPageTabModel(RootPageTabModel, {
      props: {
        route: {
          id: 123,
          parentId: 456,
          schemaUid: 'tab-1',
          type: 'tabs',
          sort: 1,
          hidden: true,
          tabSchemaName: 'tab-name-1',
          hideInMenu: false,
          enableTabs: false,
          roles: [{ name: 'admin', title: 'Admin' }],
          createdAt: '2026-07-16T00:00:00.000Z',
          updatedAt: '2026-07-16T01:00:00.000Z',
          options: {
            badge: {
              showZero: false,
            },
            pluginState: 'stale',
            removedPluginState: 'stale-only',
            flowRegistry: { stale: true },
            documentTitle: 'Stale document title',
          },
        },
      },
      stepParams: {
        pageTabSettings: {
          tab: {
            title: 'Renamed tab',
            icon: 'TableOutlined',
            documentTitle: 'Current document title',
          },
        },
      },
      context: {
        api: { request },
        routeRepository: {
          getRouteBySchemaUid: vi.fn(() => ({
            schemaUid: 'tab-1',
            options: {
              badge: {
                showZero: true,
              },
              pluginState: 'fresh',
              flowRegistry: { fresh: true },
              documentTitle: 'Fresh document title',
            },
          })),
        },
        t: (value: string) => value,
      },
    });

    await model.save();

    const call = request.mock.calls[0][0];
    expect(call).toEqual({
      method: 'post',
      url: 'desktopRoutes:update?filter[id]=123',
      data: {
        schemaUid: 'tab-1',
        title: 'Renamed tab',
        icon: 'TableOutlined',
        options: {
          badge: {
            showZero: true,
          },
          pluginState: 'fresh',
          flowRegistry: {},
          documentTitle: 'Current document title',
        },
      },
    });
    expect(Object.keys(call.data).sort()).toEqual(['icon', 'options', 'schemaUid', 'title']);
  });

  it('should fall back to model route options when the current route is unavailable', async () => {
    const { RootPageTabModel } = await import('../PageTabModel');
    const request = vi.fn().mockResolvedValue({});
    const model = createRootPageTabModel(RootPageTabModel, {
      props: {
        route: {
          id: 123,
          parentId: 456,
          schemaUid: 'tab-1',
          type: 'tabs',
          sort: 1,
          hidden: true,
          options: {
            badge: {
              showZero: true,
            },
          },
        },
      },
      stepParams: {
        pageTabSettings: {
          tab: {
            title: 'Renamed tab',
          },
        },
      },
      context: {
        api: { request },
        routeRepository: {
          getRouteBySchemaUid: vi.fn(() => undefined),
        },
        t: (value: string) => value,
      },
    });

    await model.save();

    const call = request.mock.calls[0][0];
    expect(call).toEqual({
      method: 'post',
      url: 'desktopRoutes:update?filter[id]=123',
      data: {
        schemaUid: 'tab-1',
        title: 'Renamed tab',
        icon: undefined,
        options: {
          badge: {
            showZero: true,
          },
          flowRegistry: {},
          documentTitle: undefined,
        },
      },
    });
  });

  it('should await a route refresh after the request before a subsequent persisted tab save', async () => {
    const { RootPageTabModel } = await import('../PageTabModel');
    const events: string[] = [];
    let resolveFirstRefresh: () => void = () => {};
    const firstRefreshDone = new Promise<void>((resolve) => {
      resolveFirstRefresh = resolve;
    });
    let currentRoute = {
      schemaUid: 'tab-1',
      options: {
        pluginState: 'before-save',
      },
    };
    let requestCall = 0;
    const request = vi.fn(async () => {
      requestCall += 1;
      events.push(`request:${requestCall}`);
      if (requestCall === 1) {
        return {
          data: {
            data: [
              {
                id: 123,
                schemaUid: 'tab-1',
                options: {
                  pluginState: 'after-save',
                  serverHookState: true,
                },
              },
            ],
          },
        };
      }
      return {};
    });
    let refreshCall = 0;
    const refreshAccessible = vi.fn(async () => {
      refreshCall += 1;
      events.push(`refresh:${refreshCall}:start`);
      if (refreshCall === 1) {
        await firstRefreshDone;
        currentRoute = {
          schemaUid: 'tab-1',
          options: {
            pluginState: 'after-save',
            serverHookState: true,
          },
        };
      }
      events.push(`refresh:${refreshCall}:end`);
    });
    const model = createRootPageTabModel(RootPageTabModel, {
      props: {
        route: {
          id: 123,
          schemaUid: 'tab-1',
        },
      },
      stepParams: {
        pageTabSettings: {
          tab: {
            title: 'Renamed tab',
          },
        },
      },
      context: {
        api: { request },
        routeRepository: {
          getRouteBySchemaUid: vi.fn(() => currentRoute),
          refreshAccessible,
        },
        t: (value: string) => value,
      },
    });

    let firstSaveResolved = false;
    const firstSave = model.save().then(() => {
      firstSaveResolved = true;
      events.push('save:1:end');
    });

    await vi.waitFor(() => expect(refreshAccessible).toHaveBeenCalledTimes(1));
    expect(events.slice(0, 2)).toEqual(['request:1', 'refresh:1:start']);
    await Promise.resolve();
    expect(firstSaveResolved).toBe(false);

    resolveFirstRefresh();
    await firstSave;
    expect(events.indexOf('request:1')).toBeLessThan(events.indexOf('refresh:1:start'));
    expect(events.indexOf('refresh:1:end')).toBeLessThan(events.indexOf('save:1:end'));

    await model.save();

    expect(refreshAccessible).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[1][0].data.options).toMatchObject({
      pluginState: 'after-save',
      serverHookState: true,
    });
  });

  it('should serialize route refreshes when new tabs are saved concurrently', async () => {
    const { RootPageTabModel } = await import('../PageTabModel');
    let releaseFirstRefresh: () => void = () => {};
    const firstRefreshDone = new Promise<void>((resolve) => {
      releaseFirstRefresh = resolve;
    });
    let refreshCall = 0;
    let activeRefreshes = 0;
    let maxActiveRefreshes = 0;
    const refreshAccessible = vi.fn(async () => {
      refreshCall += 1;
      activeRefreshes += 1;
      maxActiveRefreshes = Math.max(maxActiveRefreshes, activeRefreshes);
      if (refreshCall === 1) {
        await firstRefreshDone;
      }
      activeRefreshes -= 1;
    });
    const request = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          data: {
            id: 101,
            schemaUid: 'tab-1',
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            id: 102,
            schemaUid: 'tab-2',
          },
        },
      });
    const routeRepository = {
      refreshAccessible,
    };
    const createModel = (schemaUid: string, title: string) =>
      createRootPageTabModel(RootPageTabModel, {
        props: {
          route: {
            parentId: 999,
            schemaUid,
            tabSchemaName: `${schemaUid}-name`,
            type: 'tabs',
          },
        },
        stepParams: {
          pageTabSettings: {
            tab: {
              title,
            },
          },
        },
        context: {
          api: { request },
          routeRepository,
          t: (value: string) => value,
        },
      });

    const saves = Promise.all([createModel('tab-1', 'Tab 1').save(), createModel('tab-2', 'Tab 2').save()]);

    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(refreshAccessible).toHaveBeenCalled());
    await Promise.resolve();
    await Promise.resolve();
    const refreshCallsBeforeRelease = refreshAccessible.mock.calls.length;

    releaseFirstRefresh();
    await saves;

    expect(refreshCallsBeforeRelease).toBe(1);
    expect(refreshAccessible).toHaveBeenCalledTimes(2);
    expect(maxActiveRefreshes).toBe(1);
  });

  it('should keep a successful route save when refreshing the route cache fails', async () => {
    const { RootPageTabModel } = await import('../PageTabModel');
    const refreshError = new Error('refresh failed');
    const request = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          data: {
            id: 123,
            schemaUid: 'tab-1',
          },
        },
      })
      .mockResolvedValueOnce({});
    const refreshAccessible = vi.fn().mockRejectedValueOnce(refreshError).mockResolvedValueOnce([]);
    const warn = vi.fn();
    const model = createRootPageTabModel(RootPageTabModel, {
      props: {
        route: {
          parentId: 999,
          schemaUid: 'tab-1',
          tabSchemaName: 'tab-name-1',
          type: 'tabs',
        },
      },
      stepParams: {
        pageTabSettings: {
          tab: {
            title: 'Tab title',
          },
        },
      },
      context: {
        api: { request },
        routeRepository: {
          refreshAccessible,
        },
        logger: { warn },
        t: (value: string) => value,
      },
    });

    await expect(model.save()).resolves.toBeUndefined();

    expect(model.props.route.id).toBe(123);
    expect(warn).toHaveBeenCalledWith(
      { err: refreshError },
      '[client-v2] Failed to refresh desktop routes after saving a page tab',
    );

    await expect(model.save()).resolves.toBeUndefined();
    expect(refreshAccessible).toHaveBeenCalledTimes(2);
  });

  it('should still reject when writing the tab route fails', async () => {
    const { RootPageTabModel } = await import('../PageTabModel');
    const writeError = new Error('write failed');
    const request = vi.fn().mockRejectedValue(writeError);
    const refreshAccessible = vi.fn().mockResolvedValue([]);
    const warn = vi.fn();
    const model = createRootPageTabModel(RootPageTabModel, {
      props: {
        route: {
          parentId: 999,
          schemaUid: 'tab-1',
          tabSchemaName: 'tab-name-1',
          type: 'tabs',
        },
      },
      stepParams: {
        pageTabSettings: {
          tab: {
            title: 'Tab title',
          },
        },
      },
      context: {
        api: { request },
        routeRepository: {
          refreshAccessible,
        },
        logger: { warn },
        t: (value: string) => value,
      },
    });

    await expect(model.save()).rejects.toBe(writeError);
    expect(refreshAccessible).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(model.props.route.id).toBeUndefined();
  });

  it('should sync persisted route id after save', async () => {
    const { RootPageTabModel } = await import('../PageTabModel');
    const request = vi.fn().mockResolvedValue({
      data: {
        data: {
          id: 123,
          schemaUid: 'tab-1',
          sort: 9,
        },
      },
    });
    const model = createRootPageTabModel(RootPageTabModel, {
      props: {
        route: {
          parentId: 999,
          schemaUid: 'tab-1',
          tabSchemaName: 'tab-name-1',
          type: 'tabs',
          params: [],
          hideInMenu: false,
          enableTabs: false,
        },
      },
      stepParams: {
        pageTabSettings: {
          tab: {
            title: 'Tab title',
            icon: 'TableOutlined',
            documentTitle: 'Tab document title',
          },
        },
      },
      context: {
        api: { request },
        t: (value: string) => value,
      },
    });

    await model.save();

    const call = request.mock.calls[0][0];
    expect(call).toEqual({
      method: 'post',
      url: 'desktopRoutes:updateOrCreate',
      params: {
        filterKeys: ['schemaUid'],
      },
      data: {
        parentId: 999,
        schemaUid: 'tab-1',
        tabSchemaName: 'tab-name-1',
        type: 'tabs',
        params: [],
        hideInMenu: false,
        enableTabs: false,
        title: 'Tab title',
        icon: 'TableOutlined',
        options: {
          flowRegistry: {},
          documentTitle: 'Tab document title',
        },
      },
    });
    expect(model.props.route.id).toBe(123);
    expect(model.props.route.sort).toBe(9);
  });

  it('should sync persisted route when updateOrCreate returns array', async () => {
    const { RootPageTabModel } = await import('../PageTabModel');
    const request = vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            id: 456,
            schemaUid: 'tab-1',
            options: {
              documentTitle: 'Server doc title',
            },
          },
        ],
      },
    });
    const model = createRootPageTabModel(RootPageTabModel, {
      props: {
        route: {
          schemaUid: 'tab-1',
          options: {
            flowRegistry: {},
          },
        },
      },
      stepParams: {
        pageTabSettings: {
          tab: {
            title: 'Tab title',
          },
        },
      },
      context: {
        api: { request },
        t: (value: string) => value,
      },
    });

    await model.save();

    expect(model.props.route.id).toBe(456);
    expect(model.props.route.options).toMatchObject({
      flowRegistry: {},
      documentTitle: 'Server doc title',
    });
  });
});

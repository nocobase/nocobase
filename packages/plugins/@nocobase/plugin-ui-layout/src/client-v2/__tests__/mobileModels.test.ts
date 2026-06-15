/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  BaseLayoutModel,
  ChildPageModel,
  KeepAlive,
  linkageSetMenuItemProps,
  menuLinkageRules,
  RootPageModel,
  RootPageTabModel,
  RouteModel,
  useLayoutRoutePage,
} from '@nocobase/client-v2';
import { NocoBaseDesktopRouteType, type NocoBaseDesktopRoute } from '@nocobase/client-v2/flow-compat';
import { App as AntdApp } from 'antd';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createViewScopedEngine,
  FlowEngine,
  FlowEngineProvider,
  GLOBAL_EMBED_CONTAINER_ID,
  useFlowEngine,
  type FlowSettingsContext,
} from '@nocobase/flow-engine';
import React from 'react';
import { MemoryRouter, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createMobileAddBlockMenuItems,
  createFakeMobileDesktopRoutes,
  createMobileHomeAddMenuItems,
  createMobileTabSettingsMenuItems,
  createMobileHomeMenuItems,
  createMobileHomeTabItemsFromDesktopRoutes,
  createMobileHomeTabItems,
  MOBILE_TAB_FLOW_SETTINGS_OPTIONS,
  createMobileDesktopRouteCreationValues,
  FLOW_SETTINGS_PREFERENCE_CHANGE_EVENT,
  FLOW_SETTINGS_PREFERENCE_STORAGE_KEY,
  MobileLayoutModel,
  normalizeAccessibleDesktopRoutesToMobileRoutes,
  readMobileFlowSettingsPreference,
  writeMobileFlowSettingsPreference,
} from '../models/MobileLayoutModel';
import {
  MobileChildPageModel as ExportedMobileChildPageModel,
  MobileLayoutModel as ExportedMobileLayoutModel,
  MobileRootPageModel as ExportedMobileRootPageModel,
} from '@nocobase/plugin-ui-layout/client-v2';
import {
  collectMobileTabRoutes,
  getMobilePagePath,
  MobileLayoutMenuItemModel,
  MobileMenuSettingsIconPicker,
} from '../models/MobileMenuModels';
import { getMobileMenuItemUid } from '../models/MobileMenuUtils';
import { MobileChildPageModel, MobileRootPageModel } from '../models/MobilePageModels';
import { registerMobilePageModelResolution } from '../mobilePageModelResolution';
import enUS from '../../locale/en-US.json';
import zhCN from '../../locale/zh-CN.json';

type MobileRouteRepositoryForTest = {
  listAccessible: () => NocoBaseDesktopRoute[];
  setRoutes?: (routes: NocoBaseDesktopRoute[]) => void;
  subscribe?: (subscriber: () => void) => void;
  unsubscribe?: (subscriber: () => void) => void;
  isAccessibleLoaded?: () => boolean;
  refreshAccessible?: () => Promise<NocoBaseDesktopRoute[]>;
  ensureAccessibleLoaded?: () => Promise<NocoBaseDesktopRoute[]>;
  activateLayout?: (layout: { uid?: unknown }) => () => void;
  createRoute?: (
    route: NocoBaseDesktopRoute,
    options?: {
      refreshAfterMutation?: boolean;
    },
  ) => Promise<unknown>;
  updateRoute?: (
    filterByTk: string | number,
    values: Partial<Omit<NocoBaseDesktopRoute, 'options'>> & {
      options?: NocoBaseDesktopRoute['options'] | null;
    },
  ) => Promise<unknown>;
};

describe('plugin-ui-layout mobile models', () => {
  it('should not import unpublished client-v2 subpaths in mobile model sources', () => {
    const mobileModelSources = import.meta.glob('../models/*.{ts,tsx}', {
      as: 'raw',
      eager: true,
    }) as Record<string, string>;

    expect(Object.values(mobileModelSources).join('\n')).not.toContain('@nocobase/client-v2/flow-compat');
  });

  it('should export the core KeepAlive component for client-v2 layouts', () => {
    expect(KeepAlive).toBeDefined();
  });

  it('should export mobile model classes from the stable client-v2 package entry', () => {
    expect(ExportedMobileLayoutModel).toBe(MobileLayoutModel);
    expect(ExportedMobileRootPageModel).toBe(MobileRootPageModel);
    expect(ExportedMobileChildPageModel).toBe(MobileChildPageModel);
  });

  beforeEach(() => {
    window.localStorage.removeItem(FLOW_SETTINGS_PREFERENCE_STORAGE_KEY);
  });

  function renderMobileLayoutWithRouteRepository(
    routeRepository: MobileRouteRepositoryForTest,
    options: {
      beforeRender?: (model: MobileLayoutModel) => void;
      api?: {
        request: (options: Record<string, unknown>) => Promise<{ data?: { data?: NocoBaseDesktopRoute[] } }>;
      };
      initialEntries?: string[];
      memoryRouterBasename?: string;
      outletElement?: React.ReactNode;
      routerBasename?: string;
    } = {},
  ) {
    const engine = new FlowEngine();
    const routerRoutePath = options.memoryRouterBasename ? '/mobile' : '/v/mobile';

    engine.registerModels({
      MobileLayoutModel,
      MobileLayoutMenuItemModel,
      RouteModel,
    });
    engine.registerActions({
      menuLinkageRules,
      linkageSetMenuItemProps,
    });
    engine.context.defineProperty('t', {
      value: (key: string) => key,
    });
    engine.context.defineProperty('themeToken', {
      value: {
        borderRadiusLG: 8,
      },
    });
    engine.context.defineProperty('api', {
      value: options.api || {
        request: vi.fn(async () => ({ data: { data: [] } })),
      },
    });
    engine.context.defineProperty('routeRepository', {
      value: routeRepository,
    });
    engine.context.defineProperty('app', {
      value: {
        router: {
          getBasename: () => options.routerBasename || '',
        },
        jsonLogic: {
          apply: () => true,
        },
      },
    });

    const model = engine.createModel<MobileLayoutModel>({
      uid: 'mobile-layout-model-render-test',
      use: 'MobileLayoutModel',
      props: {
        layout: {
          routeName: 'mobile',
          routePath: '/v/mobile',
          uid: 'mobile-layout-model-render-test',
        },
      },
    });
    options.beforeRender?.(model);

    const renderResult = render(
      React.createElement(
        FlowEngineProvider,
        { engine },
        React.createElement(
          AntdApp,
          null,
          React.createElement(
            MemoryRouter,
            {
              initialEntries: options.initialEntries || [
                options.memoryRouterBasename ? `${options.memoryRouterBasename}/mobile` : '/v/mobile',
              ],
              basename: options.memoryRouterBasename,
            },
            React.createElement(
              Routes,
              null,
              options.outletElement
                ? React.createElement(
                    Route,
                    {
                      path: routerRoutePath,
                      element: model.render(),
                    },
                    React.createElement(Route, {
                      path: ':name',
                      element: options.outletElement,
                    }),
                  )
                : React.createElement(Route, {
                    path: `${routerRoutePath}/*`,
                    element: model.render(),
                  }),
            ),
          ),
        ),
      ),
    );

    return {
      engine,
      model,
      ...renderResult,
    };
  }

  function createMobileMenuSettingsContext(
    route: NocoBaseDesktopRoute,
    modelOverrides: Partial<MobileLayoutMenuItemModel> = {},
  ): FlowSettingsContext<MobileLayoutMenuItemModel> {
    return {
      t: (key: string) => key,
      model: {
        getRoute: () => route,
        ...modelOverrides,
      },
    } as unknown as FlowSettingsContext<MobileLayoutMenuItemModel>;
  }

  function getDocumentStyleText() {
    return Array.from(document.querySelectorAll('style'))
      .map((style) => style.textContent || '')
      .join('\n');
  }

  function MobileRoutePageProbe(props: {
    events: string[];
    getModel: () => MobileLayoutModel;
    layoutBasePathname?: string;
  }) {
    const { events, getModel, layoutBasePathname = '/v/mobile' } = props;
    const flowEngine = useFlowEngine();
    const location = useLocation();
    const params = useParams();
    const layoutContentRef = React.useRef<HTMLDivElement>(null);
    const pageUid = params.name || '';
    const model = getModel();

    React.useEffect(() => {
      if (!pageUid) {
        return;
      }

      model.syncLayoutRoute({
        layoutRouteName: 'mobile',
        layoutBasePathname,
        pathname: location.pathname,
        params: {
          name: pageUid,
        },
      });
    }, [layoutBasePathname, location.pathname, model, pageUid]);

    useLayoutRoutePage({
      flowEngine,
      pageUid,
      layoutContentRef,
      getLayoutModel: () => model,
    });

    React.useEffect(() => {
      events.push(`mount:${pageUid}`);
      return () => {
        events.push(`unmount:${pageUid}`);
      };
    }, [events, pageUid]);

    return React.createElement(
      'div',
      {
        ref: layoutContentRef,
        'data-testid': `mobile-route-page-${pageUid}`,
      },
      pageUid,
    );
  }

  function MobileCurrentPathProbe() {
    const location = useLocation();

    return React.createElement(
      'span',
      {
        'data-testid': 'mobile-current-path',
      },
      location.pathname,
    );
  }

  type MobileMenuItemLinkageSnapshot = MobileLayoutMenuItemModel & {
    __originalProps?: {
      hiddenModel?: boolean;
    };
  };

  function mockDesktopBreakpoint() {
    const originalMatchMedia = window.matchMedia;

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('min-width'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    return () => {
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: originalMatchMedia,
      });
    };
  }

  it('should extend the standard layout and page models', () => {
    expect(MobileLayoutModel.prototype).toBeInstanceOf(BaseLayoutModel);
    expect(MobileRootPageModel.prototype).toBeInstanceOf(RootPageModel);
    expect(MobileChildPageModel.prototype).toBeInstanceOf(ChildPageModel);
  });

  it('should resolve persisted root and child pages to mobile page models inside mobile layouts', () => {
    registerMobilePageModelResolution();

    const engine = new FlowEngine();
    engine.registerModels({
      RootPageModel,
      ChildPageModel,
      MobileRootPageModel,
      MobileChildPageModel,
      RouteModel,
    });
    const routeModel = engine.createModel<RouteModel>({
      uid: 'mobile-route-parent',
      use: 'RouteModel',
    });
    routeModel.context.defineProperty('isMobileLayout', {
      value: true,
    });

    const rootPage = engine.createModel({
      uid: 'persisted-root-page',
      parentId: routeModel.uid,
      subKey: 'page',
      subType: 'object',
      use: 'RootPageModel',
    });
    const childPage = engine.createModel({
      uid: 'persisted-child-page',
      parentId: routeModel.uid,
      subKey: 'page',
      subType: 'object',
      use: 'ChildPageModel',
    });

    expect(rootPage).toBeInstanceOf(MobileRootPageModel);
    expect(childPage.constructor).toBe(MobileChildPageModel);
  });

  it('should keep persisted page models unchanged outside mobile layouts', () => {
    registerMobilePageModelResolution();

    const engine = new FlowEngine();
    engine.registerModels({
      RootPageModel,
      ChildPageModel,
      MobileRootPageModel,
      MobileChildPageModel,
      RouteModel,
    });
    const routeModel = engine.createModel<RouteModel>({
      uid: 'desktop-route-parent',
      use: 'RouteModel',
    });

    const rootPage = engine.createModel({
      uid: 'desktop-root-page',
      parentId: routeModel.uid,
      subKey: 'page',
      subType: 'object',
      use: 'RootPageModel',
    });
    const childPage = engine.createModel({
      uid: 'desktop-child-page',
      parentId: routeModel.uid,
      subKey: 'page',
      subType: 'object',
      use: 'ChildPageModel',
    });

    expect(rootPage).toBeInstanceOf(RootPageModel);
    expect(rootPage).not.toBeInstanceOf(MobileRootPageModel);
    expect(childPage).toBeInstanceOf(ChildPageModel);
    expect(childPage).not.toBeInstanceOf(MobileChildPageModel);
  });

  it('should resolve persisted child pages to mobile page models from mobile view input args', () => {
    registerMobilePageModelResolution();

    const engine = new FlowEngine();
    engine.registerModels({
      ChildPageModel,
      MobileChildPageModel,
    });
    const actionModel = engine.createModel({
      uid: 'mobile-view-action-parent',
      use: 'FlowModel',
    });
    actionModel.context.defineProperty('view', {
      value: {
        inputArgs: {
          isMobileLayout: true,
        },
      },
    });

    const childPage = engine.createModel({
      uid: 'mobile-view-child-page',
      parentId: actionModel.uid,
      subKey: 'page',
      subType: 'object',
      use: 'ChildPageModel',
    });

    expect(childPage.constructor).toBe(MobileChildPageModel);
  });

  it('should resolve persisted child pages from mobile page model class input args', () => {
    registerMobilePageModelResolution();

    const engine = new FlowEngine();
    engine.registerModels({
      ChildPageModel,
      MobileChildPageModel,
    });
    engine.context.defineProperty('view', {
      value: {
        inputArgs: {
          pageModelClass: 'MobileChildPageModel',
        },
      },
    });
    const actionModel = engine.createModel({
      uid: 'mobile-page-model-class-parent',
      use: 'FlowModel',
    });

    const childPage = engine.createModel({
      uid: 'mobile-page-model-class-child-page',
      parentId: actionModel.uid,
      subKey: 'page',
      subType: 'object',
      use: 'ChildPageModel',
    });

    expect(childPage.constructor).toBe(MobileChildPageModel);
  });

  it('should resolve persisted child pages to mobile page models from the current layout definition', () => {
    registerMobilePageModelResolution();

    const engine = new FlowEngine();
    engine.registerModels({
      ChildPageModel,
      MobileChildPageModel,
    });
    const actionModel = engine.createModel({
      uid: 'mobile-layout-action-parent',
      use: 'FlowModel',
    });
    actionModel.context.defineProperty('layout', {
      value: {
        layoutModelClass: 'MobileLayoutModel',
        childPageModelClass: 'MobileChildPageModel',
      },
    });

    const childPage = engine.createModel({
      uid: 'mobile-layout-child-page',
      parentId: actionModel.uid,
      subKey: 'page',
      subType: 'object',
      use: 'ChildPageModel',
    });

    expect(childPage.constructor).toBe(MobileChildPageModel);
  });

  it('should resolve persisted child pages from a mobile parent in the view engine stack', () => {
    registerMobilePageModelResolution();

    const rootEngine = new FlowEngine();
    rootEngine.registerModels({
      ChildPageModel,
      MobileChildPageModel,
      RouteModel,
    });
    const actionParent = rootEngine.createModel<RouteModel>({
      uid: 'mobile-stacked-action-parent',
      use: 'RouteModel',
    });
    actionParent.context.defineProperty('layout', {
      value: {
        layoutModelClass: 'MobileLayoutModel',
        childPageModelClass: 'MobileChildPageModel',
      },
    });

    const rootViewEngine = createViewScopedEngine(rootEngine);
    const childViewEngine = createViewScopedEngine(rootViewEngine);

    const childPage = childViewEngine.createModel({
      uid: 'mobile-stacked-child-page',
      parentId: actionParent.uid,
      subKey: 'page',
      subType: 'object',
      use: 'ChildPageModel',
    });

    expect(childPage.constructor).toBe(MobileChildPageModel);
  });

  it('should resolve persisted mobile child pages before the mobile class is registered', () => {
    registerMobilePageModelResolution();

    const engine = new FlowEngine();
    engine.registerModels({
      ChildPageModel,
      RouteModel,
    });
    const actionParent = engine.createModel<RouteModel>({
      uid: 'mobile-unregistered-child-parent',
      use: 'RouteModel',
    });
    actionParent.context.defineProperty('layout', {
      value: {
        layoutModelClass: 'MobileLayoutModel',
        childPageModelClass: 'MobileChildPageModel',
      },
    });

    const childPage = engine.createModel({
      uid: 'mobile-unregistered-child-page',
      parentId: actionParent.uid,
      subKey: 'page',
      subType: 'object',
      use: 'ChildPageModel',
    });

    expect(engine.getModelClass('MobileChildPageModel')).toBeUndefined();
    expect(childPage).toBeInstanceOf(MobileChildPageModel);
  });

  it('should keep mobile context after FlowPage detaches mobile page parent delegates', () => {
    const engine = new FlowEngine();
    engine.registerModels({
      MobileRootPageModel,
      MobileChildPageModel,
      RouteModel,
    });
    const routeModel = engine.createModel<RouteModel>({
      uid: 'mobile-detached-route-parent',
      use: 'RouteModel',
    });
    routeModel.context.defineProperty('isMobileLayout', {
      value: true,
    });
    const rootPage = engine.createModel<MobileRootPageModel>({
      uid: 'mobile-detached-root-page',
      parentId: routeModel.uid,
      subKey: 'page',
      subType: 'object',
      use: 'MobileRootPageModel',
    });
    const childPage = engine.createModel<MobileChildPageModel>({
      uid: 'mobile-detached-child-page',
      parentId: routeModel.uid,
      subKey: 'page',
      subType: 'object',
      use: 'MobileChildPageModel',
    });

    rootPage.removeParentDelegate();
    childPage.removeParentDelegate();

    const rootSubModel = engine.createModel({
      uid: 'mobile-detached-root-sub-model',
      parentId: rootPage.uid,
      subKey: 'children',
      subType: 'array',
      use: 'FlowModel',
    });
    const childSubModel = engine.createModel({
      uid: 'mobile-detached-child-sub-model',
      parentId: childPage.uid,
      subKey: 'children',
      subType: 'array',
      use: 'FlowModel',
    });

    expect(rootPage.context.isMobileLayout).toBe(true);
    expect(childPage.context.isMobileLayout).toBe(true);
    expect(rootSubModel.context.isMobileLayout).toBe(true);
    expect(childSubModel.context.isMobileLayout).toBe(true);
  });

  it('should provide temporary mobile home menu data', () => {
    const t = (key: string) => `t:${key}`;

    expect(createMobileHomeMenuItems(t).map((item) => item.key)).toEqual([
      'workbench',
      'tasks',
      'customers',
      'reports',
    ]);
    expect(createMobileHomeTabItems(t).map((item) => item.key)).toEqual(['home', 'notifications', 'settings']);
    expect(createMobileHomeTabItems(t).find((item) => item.key === 'home')?.active).toBe(true);
  });

  it('should derive mobile tab bar items from fake desktop routes', () => {
    const t = (key: string) => `t:${key}`;
    const fakeRoutes = createFakeMobileDesktopRoutes(t);

    expect(fakeRoutes.map((route) => route.key)).toEqual(['home', 'notifications', 'settings']);
    expect(createMobileHomeTabItems(t).map((item) => [item.key, item.label])).toEqual([
      ['home', 't:Home'],
      ['notifications', 't:Notifications'],
      ['settings', 't:Settings'],
    ]);
  });

  it('should collect only flow pages and links for the mobile tab bar', () => {
    const t = (key: string) => `route:${key}`;
    const accessibleRoutes: NocoBaseDesktopRoute[] = [
      {
        id: 3,
        type: NocoBaseDesktopRouteType.group,
        title: 'Settings',
        sort: 30,
        children: [
          {
            id: 31,
            type: NocoBaseDesktopRouteType.flowPage,
            title: 'Profile',
            sort: 10,
          },
          {
            id: 32,
            type: NocoBaseDesktopRouteType.link,
            title: 'Hidden child',
            hidden: true,
            sort: 20,
          },
        ],
      },
      {
        id: 1,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Home',
        icon: 'HomeOutlined',
        schemaUid: 'home-page',
        sort: 10,
        children: [
          {
            id: 11,
            type: NocoBaseDesktopRouteType.tabs,
            title: 'Home tabs',
            schemaUid: 'home-tabs',
            hidden: true,
            children: [
              {
                id: 12,
                type: NocoBaseDesktopRouteType.link,
                title: 'Tab child link',
                schemaUid: 'tab-child-link',
              },
            ],
          },
        ],
      },
      {
        id: 2,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Hidden',
        hideInMenu: true,
        sort: 20,
      },
      {
        id: 4,
        type: NocoBaseDesktopRouteType.link,
        title: 'Docs',
        schemaUid: 'docs-link',
        sort: 40,
        options: {
          href: '/docs',
        },
      },
      {
        id: 5,
        type: NocoBaseDesktopRouteType.page,
        title: 'Legacy page',
        schemaUid: 'legacy-page',
        sort: 50,
      },
    ];

    const mobileRoutes = collectMobileTabRoutes(accessibleRoutes);

    expect(mobileRoutes.map((route) => [route.schemaUid, t(route.title || '')])).toEqual([
      ['home-page', 'route:Home'],
      ['docs-link', 'route:Docs'],
    ]);
  });

  it('should include hidden mobile tab routes only for design mode', () => {
    const accessibleRoutes: NocoBaseDesktopRoute[] = [
      {
        id: 1,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Home',
        schemaUid: 'home-page',
        sort: 10,
      },
      {
        id: 2,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Hidden',
        schemaUid: 'hidden-page',
        hidden: true,
        sort: 20,
      },
      {
        id: 3,
        type: NocoBaseDesktopRouteType.link,
        title: 'Hidden link',
        schemaUid: 'hidden-link',
        hideInMenu: true,
        sort: 30,
      },
      {
        id: 4,
        type: NocoBaseDesktopRouteType.tabs,
        title: 'Inner tabs',
        schemaUid: 'inner-tabs',
        sort: 40,
      },
      {
        id: 5,
        type: NocoBaseDesktopRouteType.group,
        title: 'Ignored group',
        sort: 50,
        children: [
          {
            id: 51,
            type: NocoBaseDesktopRouteType.flowPage,
            title: 'Ignored child',
            schemaUid: 'ignored-child',
          },
        ],
      },
    ];

    expect(collectMobileTabRoutes(accessibleRoutes).map((route) => route.schemaUid)).toEqual(['home-page']);
    expect(collectMobileTabRoutes(accessibleRoutes, { includeHidden: true }).map((route) => route.schemaUid)).toEqual([
      'home-page',
      'hidden-page',
      'hidden-link',
    ]);
  });

  it('should sync accessible routes into mobile menu item models', () => {
    const engine = new FlowEngine();
    engine.registerModels({
      MobileLayoutModel,
      MobileLayoutMenuItemModel,
    });
    engine.context.defineProperty('t', {
      value: (key: string) => `route:${key}`,
    });

    const model = engine.createModel<MobileLayoutModel>({
      uid: 'mobile-layout-model',
      use: 'MobileLayoutModel',
    });

    model.syncMenuRoutes([
      {
        id: 1,
        type: NocoBaseDesktopRouteType.group,
        title: 'Ignored group',
        children: [
          {
            id: 11,
            type: NocoBaseDesktopRouteType.flowPage,
            title: 'Ignored child',
            schemaUid: 'ignored-child',
          },
        ],
      },
      {
        id: 2,
        type: NocoBaseDesktopRouteType.link,
        title: 'Docs',
        schemaUid: 'docs-link',
        sort: 20,
        options: {
          href: '/docs',
        },
      },
      {
        id: 3,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Home',
        schemaUid: 'home-page',
        sort: 10,
      },
    ]);

    expect(model.subModels.menuItems?.map((item) => item.uid)).toEqual([
      'mobile-layout-model-mobile-menu-item-flowPage-3',
      'mobile-layout-model-mobile-menu-item-link-2',
    ]);
    expect(
      model
        .toMobileTabNodes({
          activeKey: 'home-page',
          basePathname: '/v/mobile',
          t: (key) => `route:${key}`,
        })
        .map((item) => [item.key, item.label, item.path, item.active]),
    ).toEqual([
      ['home-page', 'route:Home', '/v/mobile/home-page', true],
      ['docs-link', 'route:Docs', undefined, false],
    ]);
  });

  it('should refresh the mobile menu route tree when linkage hidden state changes', () => {
    const engine = new FlowEngine();
    engine.registerModels({
      MobileLayoutModel,
      MobileLayoutMenuItemModel,
    });
    engine.context.defineProperty('t', {
      value: (key: string) => key,
    });

    const model = engine.createModel<MobileLayoutModel>({
      uid: 'mobile-layout-model-hidden-refresh',
      use: 'MobileLayoutModel',
    });
    model.syncMenuRoutes([
      {
        id: 1,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Home',
        schemaUid: 'home-page',
        sort: 10,
      },
    ]);
    const menuItem = model.subModels.menuItems?.[0];
    const refreshVersion = model.menuRouteRefreshVersion;

    menuItem?.setHidden(true);

    expect(model.menuRouteRefreshVersion).toBe(refreshVersion + 1);
  });

  it('should seed mobile menu linkage hidden snapshots from linkage state', async () => {
    const engine = new FlowEngine();
    engine.registerModels({
      MobileLayoutMenuItemModel,
    });

    const route: NocoBaseDesktopRoute = {
      id: 1,
      type: NocoBaseDesktopRouteType.flowPage,
      title: 'Route hidden',
      schemaUid: 'route-hidden-page',
      hidden: true,
      sort: 10,
    };
    const model = engine.createModel<MobileLayoutMenuItemModel>({
      uid: 'mobile-menu-item-linkage-original-hidden',
      use: MobileLayoutMenuItemModel,
      props: {
        route,
        hiddenModel: true,
      },
    });
    model.setStepParams('mobileMenuSettings', 'linkageRules', {
      value: [{ key: 'r1' }],
    });

    await model.dispatchEvent('beforeRender');

    expect(model.hidden).toBe(true);
    expect((model as MobileMenuItemLinkageSnapshot).__originalProps?.hiddenModel).toBe(false);
  });

  it('should render mobile tab items after accessible routes are loaded asynchronously', async () => {
    const engine = new FlowEngine();
    const subscribers = new Set<() => void>();
    let accessibleRoutes: NocoBaseDesktopRoute[] = [];
    const loadedRoutes: NocoBaseDesktopRoute[] = [
      {
        id: 1,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Home',
        schemaUid: 'home-page',
        sort: 10,
      },
      {
        id: 2,
        type: NocoBaseDesktopRouteType.link,
        title: 'Docs',
        schemaUid: 'docs-link',
        sort: 20,
        options: {
          href: '/docs',
        },
      },
      {
        id: 3,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Hidden',
        schemaUid: 'hidden-page',
        hidden: true,
        sort: 30,
      },
      {
        id: 4,
        type: NocoBaseDesktopRouteType.tabs,
        title: 'Inner tabs',
        schemaUid: 'inner-tabs',
        sort: 40,
      },
      {
        id: 5,
        type: NocoBaseDesktopRouteType.group,
        title: 'Ignored group',
        sort: 50,
      },
    ];

    engine.registerModels({
      MobileLayoutModel,
      MobileLayoutMenuItemModel,
    });
    engine.context.defineProperty('t', {
      value: (key: string) => key,
    });
    engine.context.defineProperty('themeToken', {
      value: {
        borderRadiusLG: 8,
      },
    });
    engine.context.defineProperty('routeRepository', {
      value: {
        listAccessible: () => accessibleRoutes,
        subscribe: (subscriber: () => void) => {
          subscribers.add(subscriber);
        },
        unsubscribe: (subscriber: () => void) => {
          subscribers.delete(subscriber);
        },
        ensureAccessibleLoaded: vi.fn(async () => {
          accessibleRoutes = loadedRoutes;
          subscribers.forEach((subscriber) => subscriber());
          return accessibleRoutes;
        }),
      },
    });
    engine.context.defineProperty('app', {
      value: {
        router: {
          getBasename: () => '',
        },
      },
    });

    const model = engine.createModel<MobileLayoutModel>({
      uid: 'mobile-layout-model-render',
      use: 'MobileLayoutModel',
      props: {
        layout: {
          routeName: 'mobile',
          routePath: '/v/mobile',
          uid: 'mobile-layout-model-render',
        },
      },
    });

    render(
      React.createElement(
        FlowEngineProvider,
        { engine },
        React.createElement(
          AntdApp,
          null,
          React.createElement(
            MemoryRouter,
            { initialEntries: ['/v/mobile'] },
            React.createElement(
              Routes,
              null,
              React.createElement(Route, {
                path: '/v/mobile/*',
                element: model.render(),
              }),
            ),
          ),
        ),
      ),
    );

    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Docs')).toBeInTheDocument();
      expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
      expect(screen.queryByText('Inner tabs')).not.toBeInTheDocument();
      expect(screen.queryByText('Ignored group')).not.toBeInTheDocument();
    });
  });

  it('should hide hidden child menu routes outside design mode', async () => {
    renderMobileLayoutWithRouteRepository({
      listAccessible: () => [
        {
          id: 1,
          type: NocoBaseDesktopRouteType.flowPage,
          title: 'Home',
          schemaUid: 'home-page',
          children: [
            {
              id: 11,
              type: NocoBaseDesktopRouteType.flowPage,
              title: 'Visible child',
              schemaUid: 'visible-child',
            },
            {
              id: 12,
              type: NocoBaseDesktopRouteType.flowPage,
              title: 'Hidden child',
              schemaUid: 'hidden-child',
              hidden: true,
            },
            {
              id: 13,
              type: NocoBaseDesktopRouteType.link,
              title: 'Hidden link child',
              schemaUid: 'hidden-link-child',
              hideInMenu: true,
              options: {
                href: '/hidden-link',
              },
            },
          ],
        },
      ],
    });

    await waitFor(() => {
      expect(screen.getByText('Visible child')).toBeInTheDocument();
      expect(screen.queryByText('Hidden child')).not.toBeInTheDocument();
      expect(screen.queryByText('Hidden link child')).not.toBeInTheDocument();
    });
  });

  it('should keep hidden child menu routes visible in design mode', async () => {
    window.localStorage.setItem(FLOW_SETTINGS_PREFERENCE_STORAGE_KEY, '1');

    renderMobileLayoutWithRouteRepository({
      listAccessible: () => [
        {
          id: 1,
          type: NocoBaseDesktopRouteType.flowPage,
          title: 'Home',
          schemaUid: 'home-page',
          children: [
            {
              id: 11,
              type: NocoBaseDesktopRouteType.flowPage,
              title: 'Visible child',
              schemaUid: 'visible-child',
            },
            {
              id: 12,
              type: NocoBaseDesktopRouteType.flowPage,
              title: 'Hidden child',
              schemaUid: 'hidden-child',
              hidden: true,
            },
          ],
        },
      ],
    });

    await waitFor(() => {
      expect(screen.getByText('Visible child')).toBeInTheDocument();
      expect(screen.getByText('Hidden child')).toBeInTheDocument();
    });
  });

  it('should render hidden mobile tab items in design mode with a hidden marker', async () => {
    window.localStorage.setItem(FLOW_SETTINGS_PREFERENCE_STORAGE_KEY, '1');

    const engine = new FlowEngine();
    const subscribers = new Set<() => void>();
    let accessibleRoutes: NocoBaseDesktopRoute[] = [];
    const loadedRoutes: NocoBaseDesktopRoute[] = [
      {
        id: 1,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Home',
        schemaUid: 'home-page',
        sort: 10,
      },
      {
        id: 2,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Hidden',
        schemaUid: 'hidden-page',
        hidden: true,
        sort: 20,
      },
    ];

    engine.registerModels({
      MobileLayoutModel,
      MobileLayoutMenuItemModel,
    });
    engine.context.defineProperty('t', {
      value: (key: string) => key,
    });
    engine.context.defineProperty('themeToken', {
      value: {
        borderRadiusLG: 8,
      },
    });
    engine.context.defineProperty('routeRepository', {
      value: {
        listAccessible: () => accessibleRoutes,
        subscribe: (subscriber: () => void) => {
          subscribers.add(subscriber);
        },
        unsubscribe: (subscriber: () => void) => {
          subscribers.delete(subscriber);
        },
        ensureAccessibleLoaded: vi.fn(async () => {
          accessibleRoutes = loadedRoutes;
          subscribers.forEach((subscriber) => subscriber());
          return accessibleRoutes;
        }),
      },
    });
    engine.context.defineProperty('app', {
      value: {
        router: {
          getBasename: () => '',
        },
      },
    });

    const model = engine.createModel<MobileLayoutModel>({
      uid: 'mobile-layout-model-hidden-render',
      use: 'MobileLayoutModel',
      props: {
        layout: {
          routeName: 'mobile',
          routePath: '/v/mobile',
          uid: 'mobile-layout-model-hidden-render',
        },
      },
    });

    render(
      React.createElement(
        FlowEngineProvider,
        { engine },
        React.createElement(
          AntdApp,
          null,
          React.createElement(
            MemoryRouter,
            { initialEntries: ['/v/mobile'] },
            React.createElement(
              Routes,
              null,
              React.createElement(Route, {
                path: '/v/mobile/*',
                element: model.render(),
              }),
            ),
          ),
        ),
      ),
    );

    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Hidden')).toBeInTheDocument();
      expect(document.querySelectorAll('[data-nb-hidden-mobile-tab="true"]')).toHaveLength(1);
    });
  });

  it('should load mobile routes with the current layout uid instead of reusing the existing route cache', async () => {
    const subscribers = new Set<() => void>();
    const adminRoutes: NocoBaseDesktopRoute[] = [
      {
        id: 1,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Admin only',
        schemaUid: 'admin-only-page',
        sort: 10,
      },
    ];
    const mobileRoutes: NocoBaseDesktopRoute[] = [
      {
        id: 2,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Mobile only',
        schemaUid: 'mobile-only-page',
        sort: 10,
      },
    ];
    let cachedRoutes = adminRoutes;
    const api = {
      request: vi.fn(async () => ({
        data: {
          data: mobileRoutes,
        },
      })),
    };
    const routeRepository: MobileRouteRepositoryForTest = {
      listAccessible: vi.fn(() => cachedRoutes),
      setRoutes: vi.fn((routes) => {
        cachedRoutes = routes;
        subscribers.forEach((subscriber) => subscriber());
      }),
      subscribe: (subscriber) => {
        subscribers.add(subscriber);
      },
      unsubscribe: (subscriber) => {
        subscribers.delete(subscriber);
      },
    };

    renderMobileLayoutWithRouteRepository(routeRepository, { api });

    await waitFor(() => {
      expect(api.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/desktopRoutes:listAccessible',
          params: expect.objectContaining({
            layout: 'mobile-layout-model-render-test',
            sort: 'sort',
            tree: true,
          }),
        }),
      );
    });
    await waitFor(() => {
      expect(screen.getByText('Mobile only')).toBeInTheDocument();
    });
    expect(screen.queryByText('Admin only')).not.toBeInTheDocument();
    expect(routeRepository.setRoutes).toHaveBeenCalledWith(mobileRoutes);
  });

  it('should load portal mobile routes with the current portal scope', async () => {
    const portalRoutes: NocoBaseDesktopRoute[] = [
      {
        id: 2,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Portal mobile only',
        schemaUid: 'portal-mobile-page',
        sort: 10,
      },
    ];
    const api = {
      request: vi.fn(async () => ({
        data: {
          data: portalRoutes,
        },
      })),
    };
    const routeRepository: MobileRouteRepositoryForTest = {
      listAccessible: vi.fn(() => []),
      setRoutes: vi.fn(),
      activateLayout: vi.fn(() => vi.fn()),
    };

    renderMobileLayoutWithRouteRepository(routeRepository, {
      api,
      beforeRender: (model) => {
        model.setProps({
          ...model.props,
          layout: {
            ...model.props.layout,
            uid: 'portal:customer-portal',
          },
        });
      },
    });

    await waitFor(() => {
      expect(api.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/desktopRoutes:listAccessible',
          params: expect.objectContaining({
            portal: 'customer-portal',
            sort: 'sort',
            tree: true,
          }),
        }),
      );
    });
    expect(api.request.mock.calls[0][0].params).not.toHaveProperty('layout');
    expect(routeRepository.setRoutes).toHaveBeenCalledWith(portalRoutes);
  });

  it('should activate the current mobile layout while mounted', async () => {
    const deactivateLayout = vi.fn();
    const activateLayout = vi.fn(() => deactivateLayout);
    const routeRepository: MobileRouteRepositoryForTest = {
      listAccessible: () => [],
      setRoutes: vi.fn(),
      activateLayout,
    };

    const { unmount } = renderMobileLayoutWithRouteRepository(routeRepository);

    await waitFor(() => {
      expect(activateLayout).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: 'mobile-layout-model-render-test',
        }),
      );
    });

    unmount();

    expect(deactivateLayout).toHaveBeenCalledTimes(1);
  });

  it('should load mobile routes once when a child route also ensures accessible routes', async () => {
    const subscribers = new Set<() => void>();
    const adminRoutes: NocoBaseDesktopRoute[] = [
      {
        id: 1,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Admin only',
        schemaUid: 'admin-only-page',
        sort: 10,
      },
    ];
    const mobileRoutes: NocoBaseDesktopRoute[] = [
      {
        id: 2,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Mobile only',
        schemaUid: 'mobile-only-page',
        sort: 10,
      },
    ];
    const updatedMobileRoutes: NocoBaseDesktopRoute[] = [
      {
        id: 3,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Updated mobile only',
        schemaUid: 'updated-mobile-only-page',
        sort: 10,
      },
    ];
    let cachedRoutes: NocoBaseDesktopRoute[] = [];
    let accessibleLoaded = false;
    const api = {
      request: vi.fn(async (options: { params?: { layout?: string } }) => ({
        data: {
          data: options.params?.layout ? mobileRoutes : adminRoutes,
        },
      })),
    };
    const routeRepository: MobileRouteRepositoryForTest = {
      listAccessible: vi.fn(() => cachedRoutes),
      setRoutes: vi.fn((routes) => {
        cachedRoutes = routes;
        accessibleLoaded = true;
        subscribers.forEach((subscriber) => subscriber());
      }),
      isAccessibleLoaded: vi.fn(() => accessibleLoaded),
      refreshAccessible: vi.fn(async () => {
        const response = await api.request({
          params: {
            tree: true,
            sort: 'sort',
          },
        });
        const routes = response.data.data;
        routeRepository.setRoutes?.(routes);
        return routes;
      }),
      ensureAccessibleLoaded: vi.fn(async () => {
        if (accessibleLoaded) {
          return cachedRoutes;
        }

        return routeRepository.refreshAccessible?.() || [];
      }),
      subscribe: (subscriber) => {
        subscribers.add(subscriber);
      },
      unsubscribe: (subscriber) => {
        subscribers.delete(subscriber);
      },
    };
    const originalRefreshAccessible = routeRepository.refreshAccessible;
    const ChildRouteGuard = () => {
      React.useEffect(() => {
        routeRepository.ensureAccessibleLoaded?.();
      }, []);

      return React.createElement('div', null, 'Child route guard');
    };

    renderMobileLayoutWithRouteRepository(routeRepository, {
      api,
      initialEntries: ['/v/mobile/mobile-page'],
      outletElement: React.createElement(ChildRouteGuard),
    });

    await waitFor(() => {
      expect(screen.getByText('Mobile only')).toBeInTheDocument();
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(api.request).toHaveBeenCalledTimes(1);
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          layout: 'mobile-layout-model-render-test',
        }),
      }),
    );
    expect(originalRefreshAccessible).not.toHaveBeenCalled();

    await act(async () => {
      routeRepository.setRoutes?.(updatedMobileRoutes);
    });

    await expect(routeRepository.ensureAccessibleLoaded?.()).resolves.toBe(updatedMobileRoutes);
    expect(api.request).toHaveBeenCalledTimes(1);
  });

  it('should remove linked hidden mobile tab items without reserving tab bar space outside design mode', async () => {
    const routes: NocoBaseDesktopRoute[] = [
      {
        id: 1,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Home',
        schemaUid: 'home-page',
        sort: 10,
      },
      {
        id: 2,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Hidden by linkage',
        schemaUid: 'hidden-by-linkage-page',
        sort: 20,
      },
    ];
    const { model } = renderMobileLayoutWithRouteRepository({
      listAccessible: () => routes,
      ensureAccessibleLoaded: vi.fn(async () => routes),
    });

    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Hidden by linkage')).toBeInTheDocument();
      expect(document.querySelectorAll('.nb-ui-layout-mobile-home-tabbar-item-shell')).toHaveLength(2);
    });

    const linkedHiddenModel = model.subModels.menuItems?.find(
      (item) => item.getRoute()?.schemaUid === 'hidden-by-linkage-page',
    );
    expect(linkedHiddenModel).toBeDefined();

    act(() => {
      linkedHiddenModel?.setHidden(true);
    });

    await waitFor(() => {
      expect(screen.queryByText('Hidden by linkage')).not.toBeInTheDocument();
      expect(document.querySelectorAll('.nb-ui-layout-mobile-home-tabbar-item-shell')).toHaveLength(1);
    });
  });

  it('should keep mobile menu linkage hidden state during repeated design mode toggles', async () => {
    const routes: NocoBaseDesktopRoute[] = [
      {
        id: 1,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Home',
        schemaUid: 'home-page',
        sort: 10,
      },
      {
        id: 2,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Hidden by linkage',
        schemaUid: 'hidden-by-linkage-page',
        sort: 20,
        options: {
          hasPersistedMenuInstanceFlow: true,
        },
      },
    ];
    const hiddenMenuModelUid = getMobileMenuItemUid('mobile-layout-model-render-test', routes[1], 1);

    renderMobileLayoutWithRouteRepository(
      {
        listAccessible: () => routes,
        ensureAccessibleLoaded: vi.fn(async () => routes),
      },
      {
        beforeRender: (model) => {
          model.flowEngine.setModelRepository({
            findOne: vi.fn(async ({ uid }: { uid: string }) =>
              uid === hiddenMenuModelUid
                ? {
                    uid,
                    use: 'MobileLayoutMenuItemModel',
                    stepParams: {
                      mobileMenuSettings: {
                        linkageRules: {
                          value: [
                            {
                              key: 'r1',
                              title: 'Hide mobile tab',
                              enable: true,
                              condition: { logic: '$and', items: [] },
                              actions: [
                                {
                                  key: 'a1',
                                  name: 'linkageSetMenuItemProps',
                                  params: { value: 'hidden' },
                                },
                              ],
                            },
                          ],
                        },
                      },
                    },
                  }
                : null,
            ),
          } as never);
        },
      },
    );

    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.queryByText('Hidden by linkage')).not.toBeInTheDocument();
      expect(document.querySelectorAll('.nb-ui-layout-mobile-home-tabbar-item-shell')).toHaveLength(1);
    });

    await act(async () => {
      writeMobileFlowSettingsPreference(true);
    });

    await waitFor(() => {
      expect(screen.getByText('Hidden by linkage')).toBeInTheDocument();
      expect(document.querySelectorAll('[data-nb-hidden-mobile-tab="true"]')).toHaveLength(1);
    });

    await act(async () => {
      writeMobileFlowSettingsPreference(false);
    });

    await waitFor(() => {
      expect(screen.queryByText('Hidden by linkage')).not.toBeInTheDocument();
      expect(document.querySelectorAll('.nb-ui-layout-mobile-home-tabbar-item-shell')).toHaveLength(1);
    });

    await act(async () => {
      writeMobileFlowSettingsPreference(true);
    });

    await waitFor(() => {
      expect(screen.getByText('Hidden by linkage')).toBeInTheDocument();
      expect(document.querySelectorAll('[data-nb-hidden-mobile-tab="true"]')).toHaveLength(1);
    });

    await act(async () => {
      writeMobileFlowSettingsPreference(false);
    });

    await waitFor(() => {
      expect(screen.queryByText('Hidden by linkage')).not.toBeInTheDocument();
      expect(document.querySelectorAll('.nb-ui-layout-mobile-home-tabbar-item-shell')).toHaveLength(1);
    });
  });

  it('should rerun mobile menu linkage rules when design mode is toggled repeatedly', async () => {
    let matchesLinkageRule = true;
    const routes: NocoBaseDesktopRoute[] = [
      {
        id: 1,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Home',
        schemaUid: 'home-page',
        sort: 10,
      },
      {
        id: 2,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Conditionally hidden',
        schemaUid: 'conditionally-hidden-page',
        sort: 20,
        options: {
          hasPersistedMenuInstanceFlow: true,
        },
      },
    ];
    const hiddenMenuModelUid = getMobileMenuItemUid('mobile-layout-model-render-test', routes[1], 1);

    renderMobileLayoutWithRouteRepository(
      {
        listAccessible: () => routes,
        ensureAccessibleLoaded: vi.fn(async () => routes),
      },
      {
        beforeRender: (model) => {
          model.flowEngine.context.app.jsonLogic.apply = () => matchesLinkageRule;
          model.flowEngine.setModelRepository({
            findOne: vi.fn(async ({ uid }: { uid: string }) =>
              uid === hiddenMenuModelUid
                ? {
                    uid,
                    use: 'MobileLayoutMenuItemModel',
                    stepParams: {
                      mobileMenuSettings: {
                        linkageRules: {
                          value: [
                            {
                              key: 'r1',
                              title: 'Conditionally hide mobile tab',
                              enable: true,
                              condition: {
                                logic: '$and',
                                items: [{ path: 'visible', operator: '$eq', value: true }],
                              },
                              actions: [
                                {
                                  key: 'a1',
                                  name: 'linkageSetMenuItemProps',
                                  params: { value: 'hidden' },
                                },
                              ],
                            },
                          ],
                        },
                      },
                    },
                  }
                : null,
            ),
          } as never);
        },
      },
    );

    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.queryByText('Conditionally hidden')).not.toBeInTheDocument();
      expect(document.querySelectorAll('.nb-ui-layout-mobile-home-tabbar-item-shell')).toHaveLength(1);
    });

    await act(async () => {
      writeMobileFlowSettingsPreference(true);
    });

    await waitFor(() => {
      expect(screen.getByText('Conditionally hidden')).toBeInTheDocument();
      expect(document.querySelectorAll('[data-nb-hidden-mobile-tab="true"]')).toHaveLength(1);
    });

    await act(async () => {
      writeMobileFlowSettingsPreference(false);
    });

    await waitFor(() => {
      expect(screen.queryByText('Conditionally hidden')).not.toBeInTheDocument();
      expect(document.querySelectorAll('.nb-ui-layout-mobile-home-tabbar-item-shell')).toHaveLength(1);
    });

    matchesLinkageRule = false;
    await act(async () => {
      writeMobileFlowSettingsPreference(true);
    });

    await waitFor(() => {
      expect(screen.getByText('Conditionally hidden')).toBeInTheDocument();
      expect(document.querySelectorAll('[data-nb-hidden-mobile-tab="true"]')).toHaveLength(0);
    });

    await act(async () => {
      writeMobileFlowSettingsPreference(false);
    });

    await waitFor(() => {
      expect(screen.getByText('Conditionally hidden')).toBeInTheDocument();
      expect(document.querySelectorAll('.nb-ui-layout-mobile-home-tabbar-item-shell')).toHaveLength(2);
    });
  });

  it('should apply mobile menu linkage rules after the UI editor toggle state is synced', async () => {
    const restoreBreakpoint = mockDesktopBreakpoint();
    window.localStorage.setItem(FLOW_SETTINGS_PREFERENCE_STORAGE_KEY, '1');

    try {
      const routes: NocoBaseDesktopRoute[] = [
        {
          id: 1,
          type: NocoBaseDesktopRouteType.flowPage,
          title: 'Home',
          schemaUid: 'home-page',
          sort: 10,
        },
        {
          id: 2,
          type: NocoBaseDesktopRouteType.flowPage,
          title: 'Runtime hidden',
          schemaUid: 'runtime-hidden-page',
          sort: 20,
          options: {
            hasPersistedMenuInstanceFlow: true,
          },
        },
      ];
      const hiddenMenuModelUid = getMobileMenuItemUid('mobile-layout-model-render-test', routes[1], 1);
      const { engine } = renderMobileLayoutWithRouteRepository(
        {
          listAccessible: () => routes,
          ensureAccessibleLoaded: vi.fn(async () => routes),
        },
        {
          beforeRender: (model) => {
            model.flowEngine.context.app.jsonLogic.apply = () => !model.flowEngine.context.flowSettingsEnabled;
            model.flowEngine.setModelRepository({
              findOne: vi.fn(async ({ uid }: { uid: string }) =>
                uid === hiddenMenuModelUid
                  ? {
                      uid,
                      use: 'MobileLayoutMenuItemModel',
                      stepParams: {
                        mobileMenuSettings: {
                          linkageRules: {
                            value: [
                              {
                                key: 'r1',
                                title: 'Hide mobile tab outside UI editor',
                                enable: true,
                                condition: {
                                  logic: '$and',
                                  items: [{ path: 'designable', operator: '$eq', value: false }],
                                },
                                actions: [
                                  {
                                    key: 'a1',
                                    name: 'linkageSetMenuItemProps',
                                    params: { value: 'hidden' },
                                  },
                                ],
                              },
                            ],
                          },
                        },
                      },
                    }
                  : null,
              ),
            } as never);
          },
        },
      );

      await waitFor(() => {
        expect(engine.context.flowSettingsEnabled).toBe(true);
        expect(screen.getByText('Runtime hidden')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('ui-editor-button'));
      });

      await waitFor(() => {
        expect(engine.context.flowSettingsEnabled).toBe(false);
      });

      await waitFor(() => {
        expect(screen.queryByText('Runtime hidden')).not.toBeInTheDocument();
        expect(document.querySelectorAll('.nb-ui-layout-mobile-home-tabbar-item-shell')).toHaveLength(1);
      });
    } finally {
      restoreBreakpoint();
    }
  });

  it('should reapply mobile menu linkage rules after the UI editor enable state is synced', async () => {
    const restoreBreakpoint = mockDesktopBreakpoint();

    try {
      let resolvePreload: (() => void) | undefined;
      const routes: NocoBaseDesktopRoute[] = [
        {
          id: 1,
          type: NocoBaseDesktopRouteType.flowPage,
          title: 'Home',
          schemaUid: 'home-page',
          sort: 10,
        },
        {
          id: 2,
          type: NocoBaseDesktopRouteType.flowPage,
          title: 'Runtime hidden after enable',
          schemaUid: 'runtime-hidden-after-enable-page',
          sort: 20,
          options: {
            hasPersistedMenuInstanceFlow: true,
          },
        },
      ];
      const hiddenMenuModelUid = getMobileMenuItemUid('mobile-layout-model-render-test', routes[1], 1);
      const { engine } = renderMobileLayoutWithRouteRepository(
        {
          listAccessible: () => routes,
          ensureAccessibleLoaded: vi.fn(async () => routes),
        },
        {
          beforeRender: (model) => {
            model.flowEngine.preloadModelLoaders = vi.fn(
              () =>
                new Promise<void>((resolve) => {
                  resolvePreload = resolve;
                }),
            );
            model.flowEngine.context.app.jsonLogic.apply = () => !model.flowEngine.context.flowSettingsEnabled;
            model.flowEngine.setModelRepository({
              findOne: vi.fn(async ({ uid }: { uid: string }) =>
                uid === hiddenMenuModelUid
                  ? {
                      uid,
                      use: 'MobileLayoutMenuItemModel',
                      stepParams: {
                        mobileMenuSettings: {
                          linkageRules: {
                            value: [
                              {
                                key: 'r1',
                                title: 'Hide mobile tab outside UI editor',
                                enable: true,
                                condition: {
                                  logic: '$and',
                                  items: [{ path: 'designable', operator: '$eq', value: false }],
                                },
                                actions: [
                                  {
                                    key: 'a1',
                                    name: 'linkageSetMenuItemProps',
                                    params: { value: 'hidden' },
                                  },
                                ],
                              },
                            ],
                          },
                        },
                      },
                    }
                  : null,
              ),
            } as never);
          },
        },
      );

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.queryByText('Runtime hidden after enable')).not.toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('ui-editor-button'));
      });

      await waitFor(() => {
        expect(resolvePreload).toBeDefined();
        expect(screen.getByTestId('ui-editor-button')).toHaveAttribute('aria-pressed', 'true');
      });

      await act(async () => {
        resolvePreload?.();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(engine.context.flowSettingsEnabled).toBe(true);
        expect(screen.getByText('Runtime hidden after enable')).toBeInTheDocument();
        expect(document.querySelectorAll('[data-nb-hidden-mobile-tab="true"]')).toHaveLength(0);
        expect(document.querySelectorAll('.nb-ui-layout-mobile-home-tabbar-item-shell')).toHaveLength(2);
      });
    } finally {
      restoreBreakpoint();
    }
  });

  it('should keep linkage-hidden mobile tabs hidden after route-hidden is cleared', async () => {
    window.localStorage.setItem(FLOW_SETTINGS_PREFERENCE_STORAGE_KEY, '1');

    const subscribers = new Set<() => void>();
    const hiddenRoute: NocoBaseDesktopRoute = {
      id: 2,
      type: NocoBaseDesktopRouteType.flowPage,
      title: 'Route hidden with linkage',
      schemaUid: 'route-hidden-linkage-page',
      hidden: true,
      sort: 20,
      options: {
        hasPersistedMenuInstanceFlow: true,
      },
    };
    let routes: NocoBaseDesktopRoute[] = [
      {
        id: 1,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Home',
        schemaUid: 'home-page',
        sort: 10,
      },
      hiddenRoute,
    ];
    const hiddenMenuModelUid = getMobileMenuItemUid('mobile-layout-model-render-test', hiddenRoute, 1);

    renderMobileLayoutWithRouteRepository(
      {
        listAccessible: () => routes,
        subscribe: (subscriber) => {
          subscribers.add(subscriber);
        },
        unsubscribe: (subscriber) => {
          subscribers.delete(subscriber);
        },
        ensureAccessibleLoaded: vi.fn(async () => routes),
      },
      {
        beforeRender: (model) => {
          model.flowEngine.setModelRepository({
            findOne: vi.fn(async ({ uid }: { uid: string }) =>
              uid === hiddenMenuModelUid
                ? {
                    uid,
                    use: 'MobileLayoutMenuItemModel',
                    stepParams: {
                      mobileMenuSettings: {
                        linkageRules: {
                          value: [
                            {
                              key: 'r1',
                              title: 'Hide mobile tab',
                              enable: true,
                              condition: { logic: '$and', items: [] },
                              actions: [
                                {
                                  key: 'a1',
                                  name: 'linkageSetMenuItemProps',
                                  params: { value: 'hidden' },
                                },
                              ],
                            },
                          ],
                        },
                      },
                    },
                  }
                : null,
            ),
          } as never);
        },
      },
    );

    await waitFor(() => {
      expect(screen.getByText('Route hidden with linkage')).toBeInTheDocument();
      expect(document.querySelectorAll('[data-nb-hidden-mobile-tab="true"]')).toHaveLength(1);
    });

    routes = [
      routes[0],
      {
        ...hiddenRoute,
        hidden: false,
      },
    ];
    act(() => {
      subscribers.forEach((subscriber) => subscriber());
    });

    await waitFor(() => {
      expect(screen.getByText('Route hidden with linkage')).toBeInTheDocument();
      expect(document.querySelectorAll('[data-nb-hidden-mobile-tab="true"]')).toHaveLength(1);
    });

    await act(async () => {
      writeMobileFlowSettingsPreference(false);
    });

    await waitFor(() => {
      expect(screen.queryByText('Route hidden with linkage')).not.toBeInTheDocument();
      expect(document.querySelectorAll('.nb-ui-layout-mobile-home-tabbar-item-shell')).toHaveLength(1);
    });
  });

  it('should restore linkage-visible mobile tabs after route-hidden is cleared', async () => {
    window.localStorage.setItem(FLOW_SETTINGS_PREFERENCE_STORAGE_KEY, '1');

    const subscribers = new Set<() => void>();
    let matchesLinkageRule = true;
    const hiddenRoute: NocoBaseDesktopRoute = {
      id: 2,
      type: NocoBaseDesktopRouteType.flowPage,
      title: 'Route hidden then visible',
      schemaUid: 'route-hidden-visible-page',
      hidden: true,
      sort: 20,
      options: {
        hasPersistedMenuInstanceFlow: true,
      },
    };
    let routes: NocoBaseDesktopRoute[] = [
      {
        id: 1,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Home',
        schemaUid: 'home-page',
        sort: 10,
      },
      hiddenRoute,
    ];
    const hiddenMenuModelUid = getMobileMenuItemUid('mobile-layout-model-render-test', hiddenRoute, 1);
    const { model } = renderMobileLayoutWithRouteRepository(
      {
        listAccessible: () => routes,
        subscribe: (subscriber) => {
          subscribers.add(subscriber);
        },
        unsubscribe: (subscriber) => {
          subscribers.delete(subscriber);
        },
        ensureAccessibleLoaded: vi.fn(async () => routes),
      },
      {
        beforeRender: (layoutModel) => {
          layoutModel.flowEngine.context.app.jsonLogic.apply = () => matchesLinkageRule;
          layoutModel.flowEngine.setModelRepository({
            findOne: vi.fn(async ({ uid }: { uid: string }) =>
              uid === hiddenMenuModelUid
                ? {
                    uid,
                    use: 'MobileLayoutMenuItemModel',
                    stepParams: {
                      mobileMenuSettings: {
                        linkageRules: {
                          value: [
                            {
                              key: 'r1',
                              title: 'Conditionally hide mobile tab',
                              enable: true,
                              condition: {
                                logic: '$and',
                                items: [{ path: 'visible', operator: '$eq', value: true }],
                              },
                              actions: [
                                {
                                  key: 'a1',
                                  name: 'linkageSetMenuItemProps',
                                  params: { value: 'hidden' },
                                },
                              ],
                            },
                          ],
                        },
                      },
                    },
                  }
                : null,
            ),
          } as never);
        },
      },
    );

    await waitFor(() => {
      expect(screen.getByText('Route hidden then visible')).toBeInTheDocument();
      expect(document.querySelectorAll('[data-nb-hidden-mobile-tab="true"]')).toHaveLength(1);
    });

    routes = [
      routes[0],
      {
        ...hiddenRoute,
        hidden: false,
      },
    ];
    act(() => {
      subscribers.forEach((subscriber) => subscriber());
    });

    await waitFor(() => {
      expect(screen.getByText('Route hidden then visible')).toBeInTheDocument();
      expect(document.querySelectorAll('[data-nb-hidden-mobile-tab="true"]')).toHaveLength(1);
    });

    matchesLinkageRule = false;
    const linkedModel = model.subModels.menuItems?.find((item) => item.uid === hiddenMenuModelUid);
    await act(async () => {
      await linkedModel?.rerender();
    });

    await waitFor(() => {
      expect(screen.getByText('Route hidden then visible')).toBeInTheDocument();
      expect(document.querySelectorAll('[data-nb-hidden-mobile-tab="true"]')).toHaveLength(0);
    });

    await act(async () => {
      writeMobileFlowSettingsPreference(false);
    });

    await waitFor(() => {
      expect(screen.getByText('Route hidden then visible')).toBeInTheDocument();
      expect(document.querySelectorAll('.nb-ui-layout-mobile-home-tabbar-item-shell')).toHaveLength(2);
    });
  });

  it('should render an explicit empty state when no mobile routes are accessible', async () => {
    const subscribers = new Set<() => void>();
    const routeRepository: MobileRouteRepositoryForTest = {
      listAccessible: () => [],
      subscribe: (subscriber) => {
        subscribers.add(subscriber);
      },
      unsubscribe: (subscriber) => {
        subscribers.delete(subscriber);
      },
      ensureAccessibleLoaded: vi.fn(async () => []),
    };

    renderMobileLayoutWithRouteRepository(routeRepository);

    await waitFor(() => {
      expect(screen.getByText('No mobile pages yet')).toBeInTheDocument();
      expect(screen.getByText('Mobile')).toBeInTheDocument();
    });
    expect(document.querySelectorAll('.nb-ui-layout-mobile-home-tabbar-item')).toHaveLength(0);
  });

  it('should not flash the empty state while mobile routes are loading', async () => {
    const subscribers = new Set<() => void>();
    const loadedRoutes: NocoBaseDesktopRoute[] = [
      {
        id: 1,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Portal home',
        schemaUid: 'portal-home-page',
        sort: 10,
      },
    ];
    let cachedRoutes: NocoBaseDesktopRoute[] = [];
    let accessibleLoaded = false;
    let resolveRoutes: (() => void) | undefined;
    const routeLoadPromise = new Promise<void>((resolve) => {
      resolveRoutes = resolve;
    });
    const routeRepository: MobileRouteRepositoryForTest = {
      listAccessible: vi.fn(() => cachedRoutes),
      isAccessibleLoaded: vi.fn(() => accessibleLoaded),
      ensureAccessibleLoaded: vi.fn(async () => {
        await routeLoadPromise;
        cachedRoutes = loadedRoutes;
        accessibleLoaded = true;
        subscribers.forEach((subscriber) => subscriber());
        return loadedRoutes;
      }),
      subscribe: (subscriber) => {
        subscribers.add(subscriber);
      },
      unsubscribe: (subscriber) => {
        subscribers.delete(subscriber);
      },
    };

    renderMobileLayoutWithRouteRepository(routeRepository);

    await waitFor(() => {
      expect(routeRepository.ensureAccessibleLoaded).toHaveBeenCalled();
    });
    expect(screen.queryByText('No mobile pages yet')).not.toBeInTheDocument();

    await act(async () => {
      resolveRoutes?.();
      await routeLoadPromise;
    });

    await waitFor(() => {
      expect(screen.getByText('Portal home')).toBeInTheDocument();
    });
    expect(screen.queryByText('No mobile pages yet')).not.toBeInTheDocument();
  });

  it('should enable the UI editor by default when the mobile menu is empty and no preference is stored', async () => {
    const restoreBreakpoint = mockDesktopBreakpoint();
    const routeRepository: MobileRouteRepositoryForTest = {
      listAccessible: () => [],
      ensureAccessibleLoaded: vi.fn(async () => []),
    };

    try {
      renderMobileLayoutWithRouteRepository(routeRepository);

      await waitFor(() => {
        expect(screen.getByText('No mobile pages yet')).toBeInTheDocument();
        expect(screen.getByTestId('ui-editor-button')).toHaveAttribute('aria-pressed', 'true');
      });
      expect(screen.getByRole('button', { name: 'Add mobile tab' })).toBeInTheDocument();
      expect(screen.queryByText('Add block')).not.toBeInTheDocument();
    } finally {
      restoreBreakpoint();
    }
  });

  it('should keep the UI editor disabled for an empty mobile menu when the preference was disabled', async () => {
    const restoreBreakpoint = mockDesktopBreakpoint();
    window.localStorage.setItem(FLOW_SETTINGS_PREFERENCE_STORAGE_KEY, '0');
    const routeRepository: MobileRouteRepositoryForTest = {
      listAccessible: () => [],
      ensureAccessibleLoaded: vi.fn(async () => []),
    };

    try {
      renderMobileLayoutWithRouteRepository(routeRepository);

      await waitFor(() => {
        expect(screen.getByText('No mobile pages yet')).toBeInTheDocument();
        expect(screen.getByTestId('ui-editor-button')).toHaveAttribute('aria-pressed', 'false');
      });
      expect(screen.queryByRole('button', { name: 'Add mobile tab' })).not.toBeInTheDocument();
      expect(screen.queryByText('Add block')).not.toBeInTheDocument();
    } finally {
      restoreBreakpoint();
    }
  });

  it('should render an error state when accessible routes fail to load', async () => {
    const routeError = new Error('request failed');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const routeRepository: MobileRouteRepositoryForTest = {
      listAccessible: () => [],
      ensureAccessibleLoaded: vi.fn(async () => {
        throw routeError;
      }),
    };

    try {
      renderMobileLayoutWithRouteRepository(routeRepository);

      await waitFor(() => {
        expect(routeRepository.ensureAccessibleLoaded).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          '[NocoBase] plugin-ui-layout failed to initialize accessible routes.',
          routeError,
        );
      });
      await waitFor(() => {
        expect(screen.getByText('Failed to load mobile pages')).toBeInTheDocument();
        expect(screen.getByText('Mobile')).toBeInTheDocument();
      });
      expect(consoleError).toHaveBeenCalledWith(
        '[NocoBase] plugin-ui-layout failed to initialize accessible routes.',
        routeError,
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it('should ignore accessible route load failures after the mobile layout unmounts', async () => {
    const routeError = new Error('request failed after unmount');
    let rejectRoutes: ((error: Error) => void) | undefined;
    const routeLoadPromise = new Promise<NocoBaseDesktopRoute[]>((_resolve, reject) => {
      rejectRoutes = reject;
    });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const listAccessible = vi.fn(() => []);
    const routeRepository: MobileRouteRepositoryForTest = {
      listAccessible,
      ensureAccessibleLoaded: vi.fn(() => routeLoadPromise),
    };

    try {
      const { unmount } = renderMobileLayoutWithRouteRepository(routeRepository);

      const callCountBeforeUnmount = listAccessible.mock.calls.length;
      expect(callCountBeforeUnmount).toBeGreaterThan(0);
      unmount();
      rejectRoutes?.(routeError);
      await routeLoadPromise.catch(() => undefined);
      await Promise.resolve();

      expect(listAccessible).toHaveBeenCalledTimes(callCountBeforeUnmount);
      expect(consoleError).not.toHaveBeenCalledWith(
        '[NocoBase] plugin-ui-layout failed to initialize accessible routes.',
        routeError,
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it('should not write mobile routes to the shared route cache after unmount', async () => {
    const mobileRoutes: NocoBaseDesktopRoute[] = [
      {
        id: 2,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Late mobile route',
        schemaUid: 'late-mobile-route',
        sort: 10,
      },
    ];
    let resolveRoutes: ((response: { data: { data: NocoBaseDesktopRoute[] } }) => void) | undefined;
    const api = {
      request: vi.fn(
        () =>
          new Promise<{ data: { data: NocoBaseDesktopRoute[] } }>((resolve) => {
            resolveRoutes = resolve;
          }),
      ),
    };
    const routeRepository: MobileRouteRepositoryForTest = {
      listAccessible: vi.fn(() => []),
      setRoutes: vi.fn(),
    };

    const { unmount } = renderMobileLayoutWithRouteRepository(routeRepository, { api });

    await waitFor(() => {
      expect(api.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/desktopRoutes:listAccessible',
          params: expect.objectContaining({
            layout: 'mobile-layout-model-render-test',
          }),
        }),
      );
    });

    unmount();
    await act(async () => {
      resolveRoutes?.({
        data: {
          data: mobileRoutes,
        },
      });
    });

    expect(routeRepository.setRoutes).not.toHaveBeenCalled();
  });

  it('should keep hidden mobile menu item models for design mode rendering', () => {
    const engine = new FlowEngine();
    engine.registerModels({
      MobileLayoutModel,
      MobileLayoutMenuItemModel,
    });

    const model = engine.createModel<MobileLayoutModel>({
      uid: 'mobile-layout-model-hidden',
      use: 'MobileLayoutModel',
    });

    model.syncMenuRoutes(
      [
        {
          id: 1,
          type: NocoBaseDesktopRouteType.flowPage,
          title: 'Home',
          schemaUid: 'home-page',
        },
        {
          id: 2,
          type: NocoBaseDesktopRouteType.flowPage,
          title: 'Hidden',
          schemaUid: 'hidden-page',
          hidden: true,
        },
      ],
      { includeHidden: true },
    );

    expect(model.subModels.menuItems?.map((item) => [item.getRoute()?.schemaUid, item.hidden])).toEqual([
      ['home-page', false],
      ['hidden-page', true],
    ]);
    expect(model.toMobileTabNodes({ basePathname: '/v/mobile', t: (key) => key }).map((item) => item.key)).toEqual([
      'home-page',
      'hidden-page',
    ]);
  });

  it('should delete the persisted desktop route through the default settings menu delete path', async () => {
    const engine = new FlowEngine();
    const deleteRoute = vi.fn().mockResolvedValue({});
    engine.registerModels({
      MobileLayoutModel,
      MobileLayoutMenuItemModel,
    });
    engine.context.defineProperty('routeRepository', {
      value: {
        deleteRoute,
      },
    });

    const model = engine.createModel<MobileLayoutModel>({
      uid: 'mobile-layout-model-delete',
      use: 'MobileLayoutModel',
    });
    model.syncMenuRoutes([
      {
        id: 10,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Home',
        schemaUid: 'home-page',
      },
    ]);

    await model.subModels.menuItems?.[0].destroy();

    expect(deleteRoute).toHaveBeenCalledWith(10, { refreshAfterMutation: false });
  });

  it('should create mobile menu item models without preloading the item model loader', () => {
    const engine = new FlowEngine();
    engine.registerModels({
      MobileLayoutModel,
    });

    const model = engine.createModel<MobileLayoutModel>({
      uid: 'mobile-layout-model-without-loader',
      use: 'MobileLayoutModel',
    });

    model.syncMenuRoutes([
      {
        id: 1,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Home',
        schemaUid: 'home-page',
      },
    ]);

    expect(model.subModels.menuItems?.[0]).toBeInstanceOf(MobileLayoutMenuItemModel);
    expect(model.toMobileTabNodes({ basePathname: '/v/mobile', t: (key) => key }).map((item) => item.key)).toEqual([
      'home-page',
    ]);
  });

  it('should generate mobile page paths from the current mobile layout base path', () => {
    expect(getMobilePagePath('/v/mobile', { schemaUid: 'home-page' } as NocoBaseDesktopRoute)).toBe(
      '/v/mobile/home-page',
    );
    expect(getMobilePagePath('/apps/app1/v/mobile/', { schemaUid: 'home-page' } as NocoBaseDesktopRoute)).toBe(
      '/apps/app1/v/mobile/home-page',
    );
  });

  it('should keep the mobile tab bar for root pages and hide it for child pages', () => {
    const engine = new FlowEngine();
    engine.registerModels({
      MobileLayoutModel,
    });
    const model = engine.createModel<MobileLayoutModel>({
      uid: 'mobile-layout-model-route-state',
      use: 'MobileLayoutModel',
    });

    expect(model.shouldShowMobileTabBar()).toBe(true);
    expect(model.getActiveMobileTabKey('fallback-page')).toBe('fallback-page');

    model.currentLayoutRoute = {
      type: 'page',
      pathname: '/v/mobile/home-page',
      basePathname: '/v/mobile',
      relativePath: 'home-page',
      pageUid: 'home-page',
      viewStack: [{ viewUid: 'home-page' }],
    };

    expect(model.shouldShowMobileTabBar()).toBe(true);
    expect(model.getActiveMobileTabKey('fallback-page')).toBe('home-page');

    model.currentLayoutRoute = {
      type: 'page',
      pathname: '/v/mobile/home-page/view/detail-page',
      basePathname: '/v/mobile',
      relativePath: 'home-page/view/detail-page',
      pageUid: 'home-page',
      viewStack: [{ viewUid: 'home-page' }, { viewUid: 'detail-page' }],
    };

    expect(model.shouldShowMobileTabBar()).toBe(false);
    expect(model.getActiveMobileTabKey('fallback-page')).toBe('home-page');
  });

  it('should reserve a mobile page content slot before the tab bar', async () => {
    renderMobileLayoutWithRouteRepository({
      listAccessible: () => [
        {
          id: 1,
          type: NocoBaseDesktopRouteType.flowPage,
          title: 'Home',
          schemaUid: 'home-page',
        },
      ],
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Home/ })).toBeInTheDocument();
    });

    const shell = document.querySelector('.nb-ui-layout-mobile-viewport > div');
    expect(shell?.children[0]).toHaveClass('nb-ui-layout-mobile-page-slot');
    expect(shell?.children[1]).toHaveClass('nb-ui-layout-mobile-home-tabbar');
  });

  it('should render an embed settings container beside the mobile preview', async () => {
    renderMobileLayoutWithRouteRepository({
      listAccessible: () => [
        {
          id: 1,
          type: NocoBaseDesktopRouteType.flowPage,
          title: 'Home',
          schemaUid: 'home-page',
        },
      ],
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Home/ })).toBeInTheDocument();
    });

    const embedContainer = document.querySelector(`#${GLOBAL_EMBED_CONTAINER_ID}`);

    expect(embedContainer).toHaveClass('nb-ui-layout-mobile-embed-container');
    expect(embedContainer?.previousElementSibling).toHaveClass('nb-ui-layout-mobile-preview');
    expect(embedContainer?.parentElement).toHaveClass('nb-ui-layout-mobile-workspace');
  });

  it('should use the mobile page content slot as the layout content element', async () => {
    let setLayoutContentElement: ReturnType<typeof vi.spyOn>;
    renderMobileLayoutWithRouteRepository(
      {
        listAccessible: () => [
          {
            id: 1,
            type: NocoBaseDesktopRouteType.flowPage,
            title: 'Home',
            schemaUid: 'home-page',
          },
        ],
      },
      {
        beforeRender: (model) => {
          setLayoutContentElement = vi.spyOn(model, 'setLayoutContentElement');
        },
      },
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Home/ })).toBeInTheDocument();
    });

    expect(setLayoutContentElement).toBeDefined();
    const contentElementCalls = setLayoutContentElement?.mock.calls.filter((call) => call[0]) ?? [];
    expect(contentElementCalls.at(-1)?.[0]).toHaveClass('nb-ui-layout-mobile-page-slot');
  });

  it('should expose the mobile page surface inside the page content slot', async () => {
    renderMobileLayoutWithRouteRepository({
      listAccessible: () => [
        {
          id: 1,
          type: NocoBaseDesktopRouteType.flowPage,
          title: 'Home',
          schemaUid: 'home-page',
        },
      ],
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Home/ })).toBeInTheDocument();
    });

    const pageSlot = document.querySelector('.nb-ui-layout-mobile-page-slot');
    const pageSurface = pageSlot?.querySelector('.nb-ui-layout-mobile-surface');
    expect(pageSurface).toBeInTheDocument();
  });

  it('should remove page shell padding from mobile page and child page content', async () => {
    renderMobileLayoutWithRouteRepository({
      listAccessible: () => [
        {
          id: 1,
          type: NocoBaseDesktopRouteType.flowPage,
          title: 'Home',
          schemaUid: 'home-page',
        },
      ],
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Home/ })).toBeInTheDocument();
    });

    const styleText = getDocumentStyleText();

    expect(styleText).toMatch(/\.nb-ui-layout-mobile-body\s*\{[^}]*padding:\s*0/);
    expect(styleText).toMatch(/\.nb-ui-layout-mobile-tabs\s+\.ant-tabs-tabpane\s*\{[^}]*padding:\s*0/);
    expect(styleText).not.toMatch(
      /\.nb-ui-layout-mobile-viewport\[data-nb-mobile-view-stack-depth=["']1["']\]\s+\.nb-ui-layout-mobile-body[^}]*padding-bottom:\s*calc\(/,
    );
  });

  it('should not render a divider between mobile titlebar and tabs', async () => {
    renderMobileLayoutWithRouteRepository({
      listAccessible: () => [
        {
          id: 1,
          type: NocoBaseDesktopRouteType.flowPage,
          title: 'Home',
          schemaUid: 'home-page',
        },
      ],
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Home/ })).toBeInTheDocument();
    });

    const styleText = getDocumentStyleText();
    const titlebarRule = styleText.match(/\.nb-ui-layout-mobile-titlebar\s*\{[^}]+\}/)?.[0];

    expect(titlebarRule).toBeTruthy();
    expect(titlebarRule).not.toMatch(/border-bottom:/);
  });

  it('should render compact mobile page tabs', async () => {
    renderMobileLayoutWithRouteRepository({
      listAccessible: () => [
        {
          id: 1,
          type: NocoBaseDesktopRouteType.flowPage,
          title: 'Home',
          schemaUid: 'home-page',
        },
      ],
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Home/ })).toBeInTheDocument();
    });

    const styleText = getDocumentStyleText();
    const tabRule = styleText.match(/\.nb-ui-layout-mobile-tabs\s+\.ant-tabs-tab\s*\{[^}]+\}/)?.[0];
    const tabButtonRule = styleText.match(/\.nb-ui-layout-mobile-tabs\s+\.ant-tabs-tab-btn\s*\{[^}]+\}/)?.[0];
    const extraRule = styleText.match(/\.nb-ui-layout-mobile-tabs\s+\.ant-tabs-extra-content\s*\{[^}]+\}/)?.[0];
    const backRule = styleText.match(
      /[^{}]*nb-ui-layout-mobile-back-button[^{}]*nb-ui-layout-mobile-back-spacer\s*\{[^}]+\}/,
    )?.[0];
    const backButtonRule = styleText.match(/\.nb-ui-layout-mobile-back-button\s*\{[^}]+\}/)?.[0];
    const backHoverRule = styleText.match(
      /[^{}]*nb-ui-layout-mobile-back-button:hover[^{}]*nb-ui-layout-mobile-back-button:focus-visible\s*\{[^}]+\}/,
    )?.[0];
    const backActiveRule = styleText.match(/[^{}]*nb-ui-layout-mobile-back-button:active\s*\{[^}]+\}/)?.[0];
    const addTabRule = styleText.match(/\.nb-ui-layout-mobile-page-tab-add\s*\{[^}]+\}/)?.[0];
    const inkBarRule = styleText.match(/\.nb-ui-layout-mobile-tabs\s+\.ant-tabs-ink-bar\s*\{[^}]+\}/)?.[0];
    const inkBarAfterRule = styleText.match(/\.nb-ui-layout-mobile-tabs\s+\.ant-tabs-ink-bar::after\s*\{[^}]+\}/)?.[0];
    const leftSpacerRule = styleText.match(/\.nb-ui-layout-mobile-page-tab-left-spacer\s*\{[^}]+\}/)?.[0];

    expect(tabRule).toMatch(/height:\s*40px/);
    expect(tabRule).toMatch(/padding:\s*0 8px/);
    expect(tabButtonRule).toMatch(/font-size:\s*14px/);
    expect(extraRule).toMatch(/height:\s*40px/);
    expect(backRule).toMatch(/width:\s*40px/);
    expect(backRule).toMatch(/height:\s*40px/);
    expect(backRule).toMatch(/color:\s*rgba\(0,\s*0,\s*0,\s*0\.65\)/);
    expect(backButtonRule).toMatch(/font-size:\s*20px/);
    expect(backHoverRule).toMatch(/color:\s*rgba\(0,\s*0,\s*0,\s*0\.88\)/);
    expect(backHoverRule).toMatch(/background:\s*rgba\(0,\s*0,\s*0,\s*0\.04\)/);
    expect(backActiveRule).toMatch(/color:\s*rgba\(0,\s*0,\s*0,\s*0\.88\)/);
    expect(addTabRule).toMatch(/width:\s*32px/);
    expect(addTabRule).toMatch(/height:\s*32px/);
    expect(addTabRule).toMatch(/padding:\s*0/);
    expect(inkBarRule).toMatch(/background:\s*transparent/);
    expect(inkBarAfterRule).toMatch(/inset-inline:\s*8px/);
    expect(leftSpacerRule).toMatch(/width:\s*12px/);
  });

  it('should stretch flow settings wrappers inside the mobile page content slot', async () => {
    renderMobileLayoutWithRouteRepository({
      listAccessible: () => [
        {
          id: 1,
          type: NocoBaseDesktopRouteType.flowPage,
          title: 'Home',
          schemaUid: 'home-page',
        },
      ],
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Home/ })).toBeInTheDocument();
    });

    const styleText = Array.from(document.querySelectorAll('style'))
      .map((style) => style.textContent || '')
      .join('\n');
    expect(styleText).toMatch(/\.nb-ui-layout-mobile-page-slot\s*>\s*div\s*>\s*div\s*>\s*\[data-has-float-menu\]/);
  });

  it('should keep the layout content route host inside mobile page routes', async () => {
    renderMobileLayoutWithRouteRepository(
      {
        listAccessible: () => [
          {
            id: 1,
            type: NocoBaseDesktopRouteType.flowPage,
            title: 'Home',
            schemaUid: 'home-page',
          },
        ],
      },
      {
        initialEntries: ['/v/mobile/home-page'],
        outletElement: React.createElement('div', { 'data-testid': 'layout-content-route-host' }, 'Route host'),
        beforeRender: (model) => {
          model.syncLayoutRoute({
            layoutRouteName: 'mobile',
            pathname: '/v/mobile/home-page',
            layoutBasePathname: '/v/mobile',
          });
        },
      },
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Home/ })).toBeInTheDocument();
    });

    expect(screen.getByTestId('layout-content-route-host')).toBeInTheDocument();
  });

  it('should keep mobile route pages alive when switching bottom tabs', async () => {
    const events: string[] = [];
    let layoutModel: MobileLayoutModel | undefined;
    let unregisterRoutePage: ReturnType<typeof vi.spyOn> | undefined;

    renderMobileLayoutWithRouteRepository(
      {
        listAccessible: () => [
          {
            id: 1,
            type: NocoBaseDesktopRouteType.flowPage,
            title: 'Home',
            schemaUid: 'home-page',
            sort: 10,
          },
          {
            id: 2,
            type: NocoBaseDesktopRouteType.flowPage,
            title: 'Reports',
            schemaUid: 'reports-page',
            sort: 20,
          },
        ],
      },
      {
        initialEntries: ['/v/mobile/home-page'],
        outletElement: React.createElement(MobileRoutePageProbe, {
          events,
          getModel: () => {
            if (!layoutModel) {
              throw new Error('Mobile layout model is not ready.');
            }
            return layoutModel;
          },
        }),
        beforeRender: (model) => {
          layoutModel = model;
          unregisterRoutePage = vi.spyOn(model, 'unregisterRoutePage');
        },
      },
    );

    await waitFor(() => {
      expect(screen.getByTestId('mobile-route-page-home-page')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Reports/ }));

    await waitFor(() => {
      expect(screen.getByTestId('mobile-route-page-reports-page')).toBeInTheDocument();
    });

    expect(screen.getByTestId('mobile-route-page-home-page')).toBeInTheDocument();
    expect(events).toContain('mount:home-page');
    expect(events).toContain('mount:reports-page');
    expect(events).not.toContain('unmount:home-page');
    expect(unregisterRoutePage).toBeDefined();
    expect(unregisterRoutePage).not.toHaveBeenCalledWith('home-page');
    expect(layoutModel?.flowEngine.getModel<RouteModel>('home-page')?.context.pageActive.value).toBe(false);
    expect(layoutModel?.flowEngine.getModel<RouteModel>('reports-page')?.context.pageActive.value).toBe(true);
  });

  it('should keep an accessible child route instead of falling back to its ancestor', async () => {
    const events: string[] = [];
    const routeSnapshots: string[] = [];
    const routes: NocoBaseDesktopRoute[] = [
      {
        id: 1,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Parent',
        schemaUid: 'parent-page',
        sort: 10,
        children: [
          {
            id: 2,
            parentId: 1,
            type: NocoBaseDesktopRouteType.flowPage,
            title: 'Child',
            schemaUid: 'child-page',
            sort: 1,
            children: [
              {
                id: 3,
                parentId: 2,
                type: NocoBaseDesktopRouteType.tabs,
                title: 'Hidden tab',
                hidden: true,
                sort: 1,
              },
            ],
          },
        ],
      },
    ];
    const routeRepository: MobileRouteRepositoryForTest = {
      listAccessible: () => routes,
      ensureAccessibleLoaded: vi.fn(async () => routes),
    };
    let layoutModel: MobileLayoutModel | undefined;

    function RouteSnapshotProbe() {
      const location = useLocation();
      React.useEffect(() => {
        routeSnapshots.push(location.pathname);
      }, [location.pathname]);

      return React.createElement(MobileCurrentPathProbe);
    }

    renderMobileLayoutWithRouteRepository(routeRepository, {
      initialEntries: ['/v/mobile/child-page'],
      outletElement: React.createElement(
        React.Fragment,
        null,
        React.createElement(MobileRoutePageProbe, {
          events,
          getModel: () => {
            if (!layoutModel) {
              throw new Error('Mobile layout model is not ready.');
            }
            return layoutModel;
          },
        }),
        React.createElement(RouteSnapshotProbe),
      ),
      beforeRender: (model) => {
        layoutModel = model;
      },
    });

    await waitFor(() => {
      expect(routeRepository.ensureAccessibleLoaded).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByTestId('mobile-current-path')).toHaveTextContent('/v/mobile/child-page');
    });

    expect(screen.getByTestId('mobile-route-page-child-page')).toBeInTheDocument();
    expect(screen.queryByTestId('mobile-route-page-parent-page')).not.toBeInTheDocument();
    expect(routeSnapshots).not.toContain('/v/mobile/parent-page');
    expect(events).toContain('mount:child-page');
  });

  it('should navigate from mobile home child menu buttons to child pages', async () => {
    const events: string[] = [];
    const routes: NocoBaseDesktopRoute[] = [
      {
        id: 1,
        type: NocoBaseDesktopRouteType.link,
        title: 'Parent',
        schemaUid: 'parent-link',
        sort: 10,
        options: {
          href: 'https://example.com/parent',
        },
        children: [
          {
            id: 2,
            parentId: 1,
            type: NocoBaseDesktopRouteType.flowPage,
            title: 'Child',
            schemaUid: 'child-page',
            sort: 1,
          },
        ],
      },
    ];
    const routeRepository: MobileRouteRepositoryForTest = {
      listAccessible: () => routes,
      ensureAccessibleLoaded: vi.fn(async () => routes),
    };
    let layoutModel: MobileLayoutModel | undefined;

    renderMobileLayoutWithRouteRepository(routeRepository, {
      initialEntries: ['/v/mobile'],
      outletElement: React.createElement(
        React.Fragment,
        null,
        React.createElement(MobileRoutePageProbe, {
          events,
          getModel: () => {
            if (!layoutModel) {
              throw new Error('Mobile layout model is not ready.');
            }
            return layoutModel;
          },
        }),
        React.createElement(MobileCurrentPathProbe),
      ),
      beforeRender: (model) => {
        layoutModel = model;
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Child/ })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Child/ }));

    await waitFor(() => {
      expect(screen.getByTestId('mobile-current-path')).toHaveTextContent('/v/mobile/child-page');
    });
    expect(screen.getByTestId('mobile-route-page-child-page')).toBeInTheDocument();
    expect(events).toContain('mount:child-page');
  });

  it('should restore the default mobile page route from the layout root path', async () => {
    renderMobileLayoutWithRouteRepository(
      {
        listAccessible: () => [
          {
            id: 1,
            type: NocoBaseDesktopRouteType.flowPage,
            title: 'Home',
            schemaUid: 'home-page',
          },
          {
            id: 2,
            type: NocoBaseDesktopRouteType.flowPage,
            title: 'Reports',
            schemaUid: 'reports-page',
          },
        ],
      },
      {
        initialEntries: ['/v/mobile'],
        outletElement: React.createElement('div', { 'data-testid': 'default-route-content' }, 'Default route content'),
      },
    );

    await waitFor(() => {
      expect(screen.getByTestId('default-route-content')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Home/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByText('Mobile')).not.toBeInTheDocument();
  });

  it('should not render a selected mobile tab background', async () => {
    renderMobileLayoutWithRouteRepository({
      listAccessible: () => [
        {
          id: 1,
          type: NocoBaseDesktopRouteType.flowPage,
          title: 'Home',
          schemaUid: 'home-page',
        },
      ],
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Home/ })).toHaveAttribute('aria-current', 'page');
    });

    const styleText = Array.from(document.querySelectorAll('style'))
      .map((style) => style.textContent || '')
      .join('\n');
    const activeTabRule = styleText.match(
      /\.nb-ui-layout-mobile-home-tabbar-item\[aria-current=["']page["']\]\s*\{[^}]+\}/,
    )?.[0];

    expect(activeTabRule).toContain('color:');
    expect(activeTabRule).not.toContain('background:');
  });

  it('should keep mobile tabs scrollable instead of squeezing them', async () => {
    renderMobileLayoutWithRouteRepository({
      listAccessible: () =>
        Array.from({ length: 10 }, (_, index) => ({
          id: index + 1,
          type: NocoBaseDesktopRouteType.flowPage,
          title: `Page ${index + 1}`,
          schemaUid: `page-${index + 1}`,
          sort: index + 1,
        })),
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Page 10/ })).toBeInTheDocument();
    });

    const styleText = Array.from(document.querySelectorAll('style'))
      .map((style) => style.textContent || '')
      .join('\n');
    const tabbarRule = (styleText.match(/\.nb-ui-layout-mobile-home-tabbar\s*\{[^}]+\}/g) || []).find((rule) =>
      /grid-template-columns:\s*repeat\(10/.test(rule),
    );
    const itemShellRule = styleText.match(/\.nb-ui-layout-mobile-home-tabbar-item-shell\s*\{[^}]+\}/)?.[0];

    expect(tabbarRule).toMatch(/grid-template-columns:\s*repeat\(10,\s*minmax\(72px,\s*1fr\)\)/);
    expect(tabbarRule).toMatch(/overflow-x:\s*auto/);
    expect(itemShellRule).toMatch(/min-width:\s*72px/);
  });

  it('should register mobile route pages with the mobile root page model', () => {
    const engine = new FlowEngine();
    engine.registerModels({
      MobileLayoutModel,
      RouteModel,
    });
    const model = engine.createModel<MobileLayoutModel>({
      uid: 'mobile-layout-model-route-page',
      use: 'MobileLayoutModel',
      props: {
        layout: {
          routeName: 'mobile',
          routePath: '/v/mobile',
          uid: 'mobile-layout-model-route-page',
          layoutModelClass: 'MobileLayoutModel',
          rootPageModelClass: 'MobileRootPageModel',
          childPageModelClass: 'MobileChildPageModel',
          authCheck: true,
        },
      },
    });

    const routeModel = model.registerRoutePage('home-page', {
      active: true,
      layoutContentElement: document.createElement('div'),
    });

    expect(routeModel.getStepParams('popupSettings', 'openView')).toMatchObject({
      mode: 'embed',
      preventClose: true,
      pageModelClass: 'MobileRootPageModel',
    });
  });

  it('should keep mobile route replay context after the layout delegate is detached', () => {
    const engine = new FlowEngine();
    engine.registerModels({
      MobileLayoutModel,
      RouteModel,
    });
    const model = engine.createModel<MobileLayoutModel>({
      uid: 'mobile-layout-model-detached-route-context',
      use: 'MobileLayoutModel',
      props: {
        layout: {
          routeName: 'mobile',
          routePath: '/v/mobile',
          uid: 'mobile-layout-model-detached-route-context',
          layoutModelClass: 'MobileLayoutModel',
          rootPageModelClass: 'MobileRootPageModel',
          childPageModelClass: 'MobileChildPageModel',
          authCheck: true,
        },
      },
    });

    const routeModel = model.registerRoutePage('detached-home-page', {
      active: true,
      layoutContentElement: document.createElement('div'),
    });
    routeModel.context.removeDelegate(model.context);

    expect(routeModel.context.isMobileLayout).toBe(true);
    expect(routeModel.context.layout).toMatchObject({
      layoutModelClass: 'MobileLayoutModel',
      rootPageModelClass: 'MobileRootPageModel',
      childPageModelClass: 'MobileChildPageModel',
    });
  });

  it('should set the mobile root page model before the active route opens', () => {
    const dispatchSnapshots: Array<string | undefined> = [];
    const mobileLayoutSnapshots: Array<boolean | undefined> = [];
    const dispatchEvent = vi.spyOn(RouteModel.prototype, 'dispatchEvent').mockImplementation(function (
      this: RouteModel,
      eventName: string,
      inputArgs?: { isMobileLayout?: boolean },
    ) {
      if (eventName === 'click') {
        dispatchSnapshots.push(this.getStepParams('popupSettings', 'openView')?.pageModelClass as string | undefined);
        mobileLayoutSnapshots.push(inputArgs?.isMobileLayout);
      }

      return Promise.resolve([]);
    });
    const engine = new FlowEngine();
    engine.registerModels({
      MobileLayoutModel,
      RouteModel,
    });
    const model = engine.createModel<MobileLayoutModel>({
      uid: 'mobile-layout-model-active-route-page',
      use: 'MobileLayoutModel',
      props: {
        layout: {
          routeName: 'mobile',
          routePath: '/v/mobile',
          uid: 'mobile-layout-model-active-route-page',
          layoutModelClass: 'MobileLayoutModel',
          rootPageModelClass: 'MobileRootPageModel',
          childPageModelClass: 'MobileChildPageModel',
          authCheck: true,
        },
      },
    });

    model.syncLayoutRoute({
      layoutRouteName: 'mobile',
      pathname: '/v/mobile/home-page',
      layoutBasePathname: '/v/mobile',
    });
    model.registerRoutePage('home-page', {
      active: true,
      layoutContentElement: document.createElement('div'),
    });

    expect(dispatchSnapshots).toEqual(['MobileRootPageModel']);
    expect(mobileLayoutSnapshots).toEqual([true]);
    dispatchEvent.mockRestore();
  });

  it('should hide the mobile tab bar when the current pathname has a child view before route state catches up', () => {
    const engine = new FlowEngine();
    engine.registerModels({
      MobileLayoutModel,
    });
    engine.context.defineProperty('route', {
      value: {
        pathname: '/v/mobile/home-page/view/detail-page',
      },
    });
    const model = engine.createModel<MobileLayoutModel>({
      uid: 'mobile-layout-model-route-pathname',
      use: 'MobileLayoutModel',
    });
    model.currentLayoutRoute = {
      type: 'page',
      pathname: '/v/mobile/home-page',
      basePathname: '/v/mobile',
      relativePath: 'home-page',
      pageUid: 'home-page',
      viewStack: [{ viewUid: 'home-page' }],
    };

    expect(model.getMobileViewStackDepth()).toBe(2);
    expect(model.shouldShowMobileTabBar()).toBe(false);
  });

  it('should fall back to the first accessible flow page when the current route is inaccessible', () => {
    const engine = new FlowEngine();
    engine.registerModels({
      MobileLayoutModel,
      MobileLayoutMenuItemModel,
    });
    const model = engine.createModel<MobileLayoutModel>({
      uid: 'mobile-layout-model-permission-fallback',
      use: 'MobileLayoutModel',
      props: {
        layout: {
          routeName: 'mobile',
          routePath: '/v/mobile',
          uid: 'mobile-layout-model-permission-fallback',
        },
      },
    });

    model.syncMenuRoutes([
      {
        id: 1,
        type: NocoBaseDesktopRouteType.link,
        title: 'Docs',
        schemaUid: 'docs-link',
        sort: 10,
        options: {
          href: '/docs',
        },
      },
      {
        id: 2,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Home',
        schemaUid: 'home-page',
        sort: 20,
      },
      {
        id: 3,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Reports',
        schemaUid: 'reports-page',
        sort: 30,
      },
    ]);
    model.currentLayoutRoute = {
      type: 'page',
      pathname: '/v/mobile/removed-page',
      basePathname: '/v/mobile',
      relativePath: 'removed-page',
      pageUid: 'removed-page',
      viewStack: [{ viewUid: 'removed-page' }],
    };

    expect(
      model
        .toMobileTabNodes({
          activeKey: model.getActiveMobileTabKey(),
          basePathname: '/v/mobile',
          t: (key) => key,
        })
        .map((item) => [item.key, !!item.active]),
    ).toEqual([
      ['docs-link', false],
      ['home-page', true],
      ['reports-page', false],
    ]);
  });

  it('should read mobile link routes from url with href fallback', () => {
    const urlRoutes: NocoBaseDesktopRoute[] = [
      {
        id: 1,
        type: NocoBaseDesktopRouteType.link,
        title: 'Docs',
        schemaUid: 'docs-link',
        options: {
          url: '/mobile-docs',
        },
      },
    ];
    const hrefRoutes: NocoBaseDesktopRoute[] = [
      {
        id: 2,
        type: NocoBaseDesktopRouteType.link,
        title: 'Legacy docs',
        schemaUid: 'legacy-docs-link',
        options: {
          href: '/legacy-docs',
        },
      },
    ];
    const engine = new FlowEngine();
    engine.registerModels({
      MobileLayoutModel,
      MobileLayoutMenuItemModel,
    });
    engine.context.defineProperty('t', {
      value: (key: string) => key,
    });
    const model = engine.createModel<MobileLayoutModel>({
      uid: 'mobile-layout-link-url-test',
      use: 'MobileLayoutModel',
      props: {
        layout: {
          routeName: 'mobile',
          routePath: '/v/mobile',
          uid: 'mobile-layout-link-url-test',
        },
      },
    });

    expect(normalizeAccessibleDesktopRoutesToMobileRoutes(urlRoutes, (key) => key)[0]).toMatchObject({
      href: '/mobile-docs',
    });
    expect(normalizeAccessibleDesktopRoutesToMobileRoutes(hrefRoutes, (key) => key)[0]).toMatchObject({
      href: '/legacy-docs',
    });

    model.syncMenuRoutes(urlRoutes);

    expect(model.toMobileTabNodes({ basePathname: '/v/mobile', t: (key) => key })[0]).toMatchObject({
      href: '/mobile-docs',
    });
  });

  it('should keep the current flow page active when a link tab opens in a new window', async () => {
    const openWindow = vi.spyOn(window, 'open').mockImplementation(() => null);
    const routes: NocoBaseDesktopRoute[] = [
      {
        id: 1,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Home',
        schemaUid: 'home-page',
        sort: 1,
      },
      {
        id: 2,
        type: NocoBaseDesktopRouteType.link,
        title: 'Docs',
        schemaUid: 'docs-link',
        sort: 2,
        options: {
          href: 'https://docs.example.com',
        },
      },
    ];
    const routeRepository: MobileRouteRepositoryForTest = {
      listAccessible: () => routes,
      ensureAccessibleLoaded: vi.fn(async () => routes),
    };

    try {
      renderMobileLayoutWithRouteRepository(routeRepository);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Home/ })).toHaveAttribute('aria-current', 'page');
      });

      fireEvent.click(screen.getByRole('button', { name: /Docs/ }));

      await waitFor(() => {
        expect(openWindow).toHaveBeenCalledWith('https://docs.example.com', '_blank', 'noopener,noreferrer');
      });
      expect(screen.getByRole('button', { name: /Home/ })).toHaveAttribute('aria-current', 'page');
      expect(screen.getByRole('button', { name: /Docs/ })).not.toHaveAttribute('aria-current');
    } finally {
      openWindow.mockRestore();
    }
  });

  it('should include router basename when opening internal mobile links in a new window', async () => {
    const openWindow = vi.spyOn(window, 'open').mockImplementation(() => null);
    const routes: NocoBaseDesktopRoute[] = [
      {
        id: 1,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Home',
        schemaUid: 'home-page',
        sort: 1,
      },
      {
        id: 2,
        type: NocoBaseDesktopRouteType.link,
        title: 'Link',
        schemaUid: 'internal-link',
        sort: 2,
        options: {
          href: '/mobile/wxc8k79dysq',
        },
      },
    ];
    const routeRepository: MobileRouteRepositoryForTest = {
      listAccessible: () => routes,
      ensureAccessibleLoaded: vi.fn(async () => routes),
    };

    try {
      renderMobileLayoutWithRouteRepository(routeRepository, { routerBasename: '/v' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Home/ })).toHaveAttribute('aria-current', 'page');
      });

      fireEvent.click(screen.getByRole('button', { name: /Link/ }));

      await waitFor(() => {
        expect(openWindow).toHaveBeenCalledWith('/v/mobile/wxc8k79dysq', '_blank', 'noopener,noreferrer');
      });
    } finally {
      openWindow.mockRestore();
    }
  });

  it('should navigate internal mobile links in the current tab without duplicating router basename', async () => {
    const routes: NocoBaseDesktopRoute[] = [
      {
        id: 1,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Home',
        schemaUid: 'home-page',
        sort: 1,
      },
      {
        id: 2,
        type: NocoBaseDesktopRouteType.link,
        title: 'Link',
        schemaUid: 'internal-link',
        sort: 2,
        options: {
          href: '/mobile/wxc8k79dysq',
          openInNewWindow: false,
        },
      },
    ];
    const routeRepository: MobileRouteRepositoryForTest = {
      listAccessible: () => routes,
      ensureAccessibleLoaded: vi.fn(async () => routes),
    };

    renderMobileLayoutWithRouteRepository(routeRepository, {
      outletElement: React.createElement(MobileCurrentPathProbe),
      memoryRouterBasename: '/v',
      routerBasename: '/v',
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Home/ })).toHaveAttribute('aria-current', 'page');
    });

    fireEvent.click(screen.getByRole('button', { name: /Link/ }));

    await waitFor(() => {
      expect(screen.getAllByTestId('mobile-current-path').map((element) => element.textContent)).toContain(
        '/mobile/wxc8k79dysq',
      );
    });
  });

  it('should provide mobile tab add menu items', () => {
    const t = (key: string) => `t:${key}`;

    expect(createMobileHomeAddMenuItems(t).map((item) => [item.key, item.label])).toEqual([
      ['page', 't:Page'],
      ['link', 't:Link'],
    ]);
  });

  it('should expose only the mobile tab settings menu items', () => {
    const t = (key: string) => `t:${key}`;

    expect(createMobileTabSettingsMenuItems(t).map((item) => [item.key, item.label])).toEqual([
      ['edit', 't:Edit'],
      ['linkageRules', 't:Menu linkage rules'],
      ['copyUid', 't:Copy UID'],
      ['delete', 't:Delete'],
    ]);
    expect(createMobileTabSettingsMenuItems(t).map((item) => item.label)).not.toEqual(
      expect.arrayContaining(['t:Edit tooltip', 't:Move to', 't:Insert before', 't:Insert after']),
    );
  });

  it('should expose only supported mobile tab flow setting steps', () => {
    const mobileMenuSettings = MobileLayoutMenuItemModel.globalFlowRegistry.getFlow('mobileMenuSettings');

    expect(Object.keys(mobileMenuSettings?.steps || {})).toEqual(['edit', 'linkageRules']);
    expect(Object.keys(mobileMenuSettings?.steps || {})).not.toEqual(
      expect.arrayContaining(['editTooltip', 'moveTo', 'insertBefore', 'insertAfter']),
    );
  });

  it('should provide locale entries for the mobile menu settings title', () => {
    const mobileMenuSettings = MobileLayoutMenuItemModel.globalFlowRegistry.getFlow('mobileMenuSettings');
    const title = mobileMenuSettings?.title;

    expect(title).toBe('Mobile menu settings');
    expect(enUS).toHaveProperty(String(title));
    expect(zhCN).toHaveProperty(String(title));
  });

  it('should use the mobile menu icon picker for menu edit settings', async () => {
    const mobileMenuSettings = MobileLayoutMenuItemModel.globalFlowRegistry.getFlow('mobileMenuSettings');
    const uiSchema = await mobileMenuSettings?.steps?.edit?.uiSchema?.(
      createMobileMenuSettingsContext({
        type: NocoBaseDesktopRouteType.flowPage,
      }),
    );

    expect(uiSchema?.icon?.['x-component']).toBe('MobileMenuSettingsIconPicker');
  });

  it('should mark mobile menu edit fields as required', async () => {
    const mobileMenuSettings = MobileLayoutMenuItemModel.globalFlowRegistry.getFlow('mobileMenuSettings');
    const flowPageUiSchema = await mobileMenuSettings?.steps?.edit?.uiSchema?.(
      createMobileMenuSettingsContext({
        type: NocoBaseDesktopRouteType.flowPage,
      }),
    );
    const linkUiSchema = await mobileMenuSettings?.steps?.edit?.uiSchema?.(
      createMobileMenuSettingsContext({
        type: NocoBaseDesktopRouteType.link,
      }),
    );

    expect(flowPageUiSchema).toMatchObject({
      title: {
        required: true,
      },
      icon: {
        required: true,
      },
    });
    expect(linkUiSchema).toMatchObject({
      title: {
        required: true,
      },
      icon: {
        required: true,
      },
      href: {
        required: true,
      },
    });
  });

  it('should read and save mobile link edit settings with options.url', async () => {
    const mobileMenuSettings = MobileLayoutMenuItemModel.globalFlowRegistry.getFlow('mobileMenuSettings');
    const updateMenuRoute = vi.fn(async () => {});
    const route: NocoBaseDesktopRoute = {
      id: 1,
      type: NocoBaseDesktopRouteType.link,
      title: 'Docs',
      icon: 'LinkOutlined',
      schemaUid: 'docs-link',
      options: {
        href: '/legacy-docs',
        params: [{ name: 'from', value: 'menu' }],
        url: '/mobile-docs',
      },
    };
    const ctx = createMobileMenuSettingsContext(route, {
      updateMenuRoute,
    });

    await expect(mobileMenuSettings?.steps?.edit?.defaultParams?.(ctx)).resolves.toMatchObject({
      href: '/mobile-docs',
    });

    await mobileMenuSettings?.steps?.edit?.beforeParamsSave?.(ctx, {
      href: '/updated-mobile-docs',
      icon: 'LinkOutlined',
      openInNewWindow: false,
      title: 'Updated docs',
    });

    expect(updateMenuRoute).toHaveBeenCalledWith({
      icon: 'LinkOutlined',
      options: {
        openInNewWindow: false,
        params: [{ name: 'from', value: 'menu' }],
        url: '/updated-mobile-docs',
      },
      title: 'Updated docs',
    });
  });

  it('should render the menu edit icon picker above the settings dialog', async () => {
    render(React.createElement(MobileMenuSettingsIconPicker));

    fireEvent.click(screen.getByRole('button', { name: 'Select icon' }));

    await waitFor(() => {
      const popover = document.querySelector('.ant-popover') as HTMLElement | null;

      expect(popover).toBeInTheDocument();
      expect(Number(popover?.style.zIndex)).toBeGreaterThan(6000);
    });
  });

  it('should expose menu edit icon choices as keyboard accessible buttons', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(React.createElement(MobileMenuSettingsIconPicker, { onChange }));

    fireEvent.click(screen.getByRole('button', { name: 'Select icon' }));

    const rawIconOption = await waitFor(() => {
      const option = Array.from(document.querySelectorAll<HTMLElement>('[title]')).find((element) =>
        element.getAttribute('title'),
      );
      expect(option).toBeTruthy();
      return option as HTMLElement;
    });
    const iconLabel = rawIconOption.getAttribute('title') as string;
    const iconOption = screen.getByRole('button', { name: iconLabel });

    iconOption.focus();
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledWith(expect.any(String));
  });

  it('should not persist mobile menu item runtime props when saving settings', async () => {
    const engine = new FlowEngine();
    const saveModel = vi.spyOn(engine, 'saveModel').mockResolvedValue(undefined as never);
    const model = engine.createModel<MobileLayoutMenuItemModel>({
      uid: 'mobile-menu-item-save-settings',
      use: MobileLayoutMenuItemModel,
      props: {
        dom: React.createElement('button', { type: 'button' }, 'Home'),
        item: {
          route: {
            id: 1,
          },
        },
        route: {
          id: 1,
          title: 'Home',
          schemaUid: 'home-page',
          type: NocoBaseDesktopRouteType.flowPage,
        },
      },
    });

    await model.saveStepParams();
    await model.save();

    expect(saveModel.mock.calls.length).toBe(0);
  });

  it('should persist mobile menu linkage rules through flowModels and route flag', async () => {
    const engine = new FlowEngine();
    const saveModel = vi.spyOn(engine, 'saveModel').mockResolvedValue(undefined as never);
    const updateRoute = vi.fn().mockResolvedValue(undefined);
    engine.context.defineProperty('routeRepository', {
      value: {
        updateRoute,
      },
    });
    const route: NocoBaseDesktopRoute = {
      id: 1,
      title: 'Home',
      schemaUid: 'home-page',
      type: NocoBaseDesktopRouteType.flowPage,
    };
    const model = engine.createModel<MobileLayoutMenuItemModel>({
      uid: 'mobile-menu-item-linkage-persist',
      use: MobileLayoutMenuItemModel,
      props: {
        route,
      },
    });

    model.setStepParams('mobileMenuSettings', 'linkageRules', {
      value: [
        {
          key: 'r1',
          title: 'Hide menu item',
          enable: true,
          condition: { logic: '$and', items: [] },
          actions: [],
        },
      ],
    });

    await model.saveStepParams();

    expect(saveModel).toHaveBeenCalledWith(model, { onlyStepParams: true });
    expect(updateRoute).toHaveBeenCalledWith(
      1,
      {
        options: {
          hasPersistedMenuInstanceFlow: true,
        },
      },
      { refreshAfterMutation: false },
    );
  });

  it('should save mobile menu linkage rules without serializing runtime route props', async () => {
    type SerializedMobileMenuModel = {
      props?: Record<string, unknown>;
      stepParams?: {
        mobileMenuSettings?: {
          linkageRules?: {
            value?: Array<{ key?: string }>;
          };
        };
      };
    };
    const save = vi.fn(async (targetModel: { serialize: () => SerializedMobileMenuModel }) => {
      const data = targetModel.serialize();

      expect(data.props?.dom).toBeUndefined();
      expect(data.props?.item).toBeUndefined();
      expect(data.props?.route).toBeUndefined();
      expect(data.props?.parentRoute).toBeUndefined();
      expect(data.stepParams?.mobileMenuSettings?.linkageRules?.value).toEqual([
        expect.objectContaining({ key: 'r1' }),
      ]);
      expect(() => JSON.stringify(data)).not.toThrow();
      return data;
    });
    const updateRoute = vi.fn().mockResolvedValue(undefined);
    const engine = new FlowEngine();
    engine.setModelRepository({ save } as never);
    engine.context.defineProperty('routeRepository', {
      value: {
        updateRoute,
      },
    });
    const route: NocoBaseDesktopRoute = {
      id: 1,
      title: 'Home',
      schemaUid: 'home-page',
      type: NocoBaseDesktopRouteType.flowPage,
    };
    const model = engine.createModel<MobileLayoutMenuItemModel>({
      uid: 'mobile-menu-item-linkage-runtime-props',
      use: MobileLayoutMenuItemModel,
      props: {
        route,
        parentRoute: {
          id: 99,
          type: NocoBaseDesktopRouteType.group,
        },
      },
    });

    model.setProps({
      dom: React.createElement('button', { type: 'button' }, 'Home'),
      item: {
        key: 'home',
        label: 'Home',
      },
    });
    model.setStepParams('mobileMenuSettings', 'linkageRules', {
      value: [
        {
          key: 'r1',
          title: 'Hide menu item',
          enable: true,
          condition: { logic: '$and', items: [] },
          actions: [],
        },
      ],
    });

    await model.saveStepParams();

    expect(save).toHaveBeenCalledWith(model, { onlyStepParams: true });
    expect(updateRoute).toHaveBeenCalledWith(
      1,
      {
        options: {
          hasPersistedMenuInstanceFlow: true,
        },
      },
      { refreshAfterMutation: false },
    );
  });

  it('should clear persisted mobile menu linkage rules and route flag', async () => {
    const engine = new FlowEngine();
    const saveModel = vi.spyOn(engine, 'saveModel').mockResolvedValue(undefined as never);
    const destroy = vi.fn().mockResolvedValue(true);
    const updateRoute = vi.fn().mockResolvedValue(undefined);
    engine.setModelRepository({ destroy } as never);
    engine.context.defineProperty('routeRepository', {
      value: {
        updateRoute,
      },
    });
    const model = engine.createModel<MobileLayoutMenuItemModel>({
      uid: 'mobile-menu-item-linkage-clear',
      use: MobileLayoutMenuItemModel,
      props: {
        route: {
          id: 1,
          title: 'Home',
          schemaUid: 'home-page',
          type: NocoBaseDesktopRouteType.flowPage,
          options: {
            hasPersistedMenuInstanceFlow: true,
          },
        },
      },
    });

    model.setStepParams('mobileMenuSettings', 'linkageRules', { value: [] });
    await model.saveStepParams();

    expect(saveModel).not.toHaveBeenCalled();
    expect(destroy).toHaveBeenCalledWith('mobile-menu-item-linkage-clear');
    expect(updateRoute).toHaveBeenCalledWith(1, { options: null }, { refreshAfterMutation: false });
    expect(model.getRoute()?.options).toBeUndefined();
  });

  it('should delete persisted mobile menu state when deleting a mobile tab route', async () => {
    const engine = new FlowEngine();
    const destroy = vi.fn().mockResolvedValue(true);
    const deleteRoute = vi.fn().mockResolvedValue(undefined);
    engine.setModelRepository({ destroy } as never);
    engine.context.defineProperty('routeRepository', {
      value: {
        deleteRoute,
      },
    });
    const model = engine.createModel<MobileLayoutMenuItemModel>({
      uid: 'mobile-menu-item-linkage-delete',
      use: MobileLayoutMenuItemModel,
      props: {
        route: {
          id: 1,
          title: 'Home',
          schemaUid: 'home-page',
          type: NocoBaseDesktopRouteType.flowPage,
          options: {
            hasPersistedMenuInstanceFlow: true,
          },
        },
      },
    });

    await model.deleteMenuRoute();

    expect(deleteRoute).toHaveBeenCalledWith(1, { refreshAfterMutation: false });
    expect(destroy).toHaveBeenCalledWith('mobile-menu-item-linkage-delete');
  });

  it('should restore mobile menu linkage rules after hydrate', async () => {
    const engine = new FlowEngine();
    engine.context.defineProperty('flowSettingsEnabled', {
      value: false,
    });
    engine.setModelRepository({
      findOne: vi.fn().mockResolvedValue({
        uid: 'mobile-menu-item-linkage-hydrate',
        use: 'MobileLayoutMenuItemModel',
        stepParams: {
          mobileMenuSettings: {
            linkageRules: {
              value: [
                {
                  key: 'r1',
                  title: 'Persisted mobile linkage',
                  enable: true,
                  condition: { logic: '$and', items: [] },
                  actions: [],
                },
              ],
            },
          },
        },
      }),
    } as never);
    const rerenderSpy = vi.spyOn(MobileLayoutMenuItemModel.prototype, 'rerender').mockResolvedValue(undefined as never);
    try {
      const model = engine.createModel<MobileLayoutMenuItemModel>({
        uid: 'mobile-menu-item-linkage-hydrate',
        use: MobileLayoutMenuItemModel,
        props: {
          route: {
            id: 1,
            title: 'Home',
            schemaUid: 'home-page',
            type: NocoBaseDesktopRouteType.flowPage,
            options: {
              hasPersistedMenuInstanceFlow: true,
            },
          },
        },
      });

      await waitFor(() => {
        expect(model.getStepParams('mobileMenuSettings', 'linkageRules')).toMatchObject({
          value: [{ key: 'r1' }],
        });
      });
      expect(rerenderSpy).toHaveBeenCalledTimes(1);
    } finally {
      rerenderSpy.mockRestore();
    }
  });

  it('should keep the default mobile tab toolbar inside the hovered item', () => {
    expect(MOBILE_TAB_FLOW_SETTINGS_OPTIONS).toEqual({
      showBackground: false,
      showBorder: false,
      showDynamicFlowsEditor: false,
      toolbarPosition: 'inside',
    });
  });

  it('should open the desktop QR code popover by clicking the action button', async () => {
    const restoreBreakpoint = mockDesktopBreakpoint();
    const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    try {
      renderMobileLayoutWithRouteRepository({
        listAccessible: () => [
          {
            id: 1,
            type: NocoBaseDesktopRouteType.flowPage,
            title: 'Home',
            schemaUid: 'home-page',
          },
        ],
      });

      const qrCodeButton = await screen.findByRole('button', { name: 'QR code' });
      expect(qrCodeButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(qrCodeButton);

      await waitFor(() => {
        expect(qrCodeButton).toHaveAttribute('aria-expanded', 'true');
        expect(document.querySelector('.ant-popover')).toBeInTheDocument();
      });
    } finally {
      getContextSpy.mockRestore();
      restoreBreakpoint();
    }
  });

  it('should render the add tab icon picker above the mobile tab modal', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    window.localStorage.setItem(FLOW_SETTINGS_PREFERENCE_STORAGE_KEY, '1');

    try {
      renderMobileLayoutWithRouteRepository({
        listAccessible: () => [
          {
            id: 1,
            type: NocoBaseDesktopRouteType.flowPage,
            title: 'Home',
            schemaUid: 'home-page',
          },
        ],
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Home/ })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Add mobile tab' }));
      fireEvent.click(await screen.findByText('Page'));
      expect(await screen.findByText('Add page')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Select icon' }));

      await waitFor(() => {
        const popover = document.querySelector('.ant-popover') as HTMLElement | null;

        expect(popover).toBeInTheDocument();
        expect(Number(popover?.style.zIndex)).toBeGreaterThan(1000);
      });
      expect(
        consoleError.mock.calls.some((call) => call.join(' ').includes('Function components cannot be given refs')),
      ).toBe(false);
    } finally {
      consoleError.mockRestore();
    }
  });

  it('should show required markers for add link tab fields', async () => {
    window.localStorage.setItem(FLOW_SETTINGS_PREFERENCE_STORAGE_KEY, '1');

    renderMobileLayoutWithRouteRepository({
      listAccessible: () => [
        {
          id: 1,
          type: NocoBaseDesktopRouteType.flowPage,
          title: 'Home',
          schemaUid: 'home-page',
        },
      ],
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Home/ })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add mobile tab' }));
    fireEvent.click(await screen.findByText('Link'));
    expect(await screen.findByText('Add link')).toBeInTheDocument();

    const requiredLabels = Array.from(
      document.querySelectorAll('.ant-modal .ant-form-item-label > label.ant-form-item-required'),
    ).map((label) => label.textContent?.trim());

    expect(document.querySelector('.ant-modal .ant-form')).not.toHaveClass('ant-form-hide-required-mark');
    expect(requiredLabels).toEqual(expect.arrayContaining(['Title', 'URL', 'Icon']));
  });

  it('should create a link tab without changing the current flow page active state', async () => {
    const listeners = new Set<() => void>();
    const initialRoutes: NocoBaseDesktopRoute[] = [
      {
        id: 1,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Home',
        schemaUid: 'home-page',
      },
    ];
    const routesAfterCreate: NocoBaseDesktopRoute[] = [
      ...initialRoutes,
      {
        id: 2,
        type: NocoBaseDesktopRouteType.link,
        title: 'Docs',
        schemaUid: 'docs-link',
        icon: 'LinkOutlined',
        options: {
          href: 'https://docs.example.com',
          openInNewWindow: true,
        },
      },
    ];
    let cachedRoutes = initialRoutes;
    let created = false;
    const createRoute = vi.fn(async () => {
      created = true;
    });
    const api = {
      request: vi.fn(async () => ({
        data: {
          data: created ? routesAfterCreate : initialRoutes,
        },
      })),
    };
    const setRoutes = vi.fn((routes: NocoBaseDesktopRoute[]) => {
      cachedRoutes = routes;
      listeners.forEach((listener) => listener());
    });

    window.localStorage.setItem(FLOW_SETTINGS_PREFERENCE_STORAGE_KEY, '1');

    renderMobileLayoutWithRouteRepository(
      {
        createRoute,
        listAccessible: () => cachedRoutes,
        setRoutes,
        subscribe: (listener) => {
          listeners.add(listener);
        },
        unsubscribe: (listener) => {
          listeners.delete(listener);
        },
      },
      { api },
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Home/ })).toHaveAttribute('aria-current', 'page');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add mobile tab' }));
    fireEvent.click(await screen.findByText('Link'));
    expect(await screen.findByText('Add link')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Docs' } });
    fireEvent.change(screen.getByLabelText('URL'), { target: { value: 'https://docs.example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Select icon' }));
    await screen.findByPlaceholderText('Search');
    fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'link' } });
    fireEvent.click(await screen.findByTitle('link'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(createRoute).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NocoBaseDesktopRouteType.link,
          title: 'Docs',
          icon: expect.stringMatching(/link/i),
          options: expect.objectContaining({
            openInNewWindow: true,
            url: 'https://docs.example.com',
          }),
        }),
        {
          refreshAfterMutation: false,
        },
      );
    });
    expect(createRoute.mock.calls[0]?.[0]).not.toHaveProperty('uiLayouts');
    expect(api.request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        url: '/desktopRoutes:listAccessible',
        params: expect.objectContaining({
          layout: 'mobile-layout-model-render-test',
        }),
      }),
    );
    expect(setRoutes).toHaveBeenLastCalledWith(routesAfterCreate);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Docs/ })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Home/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: /Docs/ })).not.toHaveAttribute('aria-current');
  });

  it('should create mobile tab bar pages without serializing the current mobile UI layout', async () => {
    const createRoute = vi.fn(async () => {});

    window.localStorage.setItem(FLOW_SETTINGS_PREFERENCE_STORAGE_KEY, '1');

    renderMobileLayoutWithRouteRepository({
      createRoute,
      listAccessible: () => [
        {
          id: 1,
          type: NocoBaseDesktopRouteType.flowPage,
          title: 'Home',
          schemaUid: 'home-page',
        },
      ],
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Home/ })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add mobile tab' }));
    fireEvent.click(await screen.findByText('Page'));
    expect(await screen.findByText('Add page')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Mobile page' } });
    fireEvent.click(screen.getByRole('button', { name: 'Select icon' }));
    await screen.findByPlaceholderText('Search');
    fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'home' } });
    fireEvent.click(await screen.findByTitle('home'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(createRoute).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Mobile page',
          children: [
            expect.objectContaining({
              type: NocoBaseDesktopRouteType.tabs,
              hidden: true,
            }),
          ],
        }),
        {
          refreshAfterMutation: false,
        },
      );
    });
    const createdRoute = createRoute.mock.calls[0]?.[0];
    expect(createdRoute).not.toHaveProperty('uiLayouts');
    expect(createdRoute?.children?.[0]).not.toHaveProperty('uiLayouts');
  });

  it('should create persisted route values for mobile pages and links', () => {
    const pageValues = createMobileDesktopRouteCreationValues('page', {
      icon: 'HomeOutlined',
      title: 'Home',
    });
    const linkValues = createMobileDesktopRouteCreationValues('link', {
      href: '/docs',
      icon: 'LinkOutlined',
      title: 'Docs',
    });

    expect(pageValues.route).toEqual(
      expect.objectContaining({
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Home',
        icon: 'HomeOutlined',
        enableTabs: false,
      }),
    );
    expect(linkValues.route).toEqual(
      expect.objectContaining({
        type: NocoBaseDesktopRouteType.link,
        title: 'Docs',
        icon: 'LinkOutlined',
        options: expect.objectContaining({
          openInNewWindow: true,
          url: '/docs',
        }),
      }),
    );
  });

  it('should provide mobile add block menu groups', () => {
    const t = (key: string) => `t:${key}`;
    const groups = createMobileAddBlockMenuItems(t);

    expect(groups.map((group) => [group.key, group.label])).toEqual([
      ['dataBlocks', 't:Data blocks'],
      ['filterBlocks', 't:Filter blocks'],
      ['otherBlocks', 't:Other blocks'],
    ]);
    expect(groups[0].children.map((item) => [item.key, item.label])).toEqual([
      ['data-table', 't:Table'],
      ['data-form', 't:Form'],
      ['data-details', 't:Details'],
      ['data-grid-card', 't:Grid Card'],
    ]);
  });

  it('should render mobile page tab add buttons as icon-only controls', () => {
    const flowEngine = new FlowEngine();
    flowEngine.context.defineProperty('t', {
      value: (key: string) => key,
    });
    flowEngine.context.defineProperty('themeToken', {
      value: {
        paddingLG: 16,
      },
    });
    const rootPageModel = new MobileRootPageModel({ flowEngine } as never);
    const childPageModel = new MobileChildPageModel({ flowEngine } as never);
    const rootTabsElement = (rootPageModel.renderTabs() as React.ReactElement).props.children;
    const childTabsElement = (childPageModel.renderTabs() as React.ReactElement).props.children;
    const rootAddTabWrapper = rootPageModel.tabBarExtraContent.right as React.ReactElement;
    const childAddTabWrapper = childPageModel.tabBarExtraContent.right as React.ReactElement;
    const rootLeftSpacer = rootPageModel.tabBarExtraContent.left as React.ReactElement;
    const rootAddTabButton = (rootAddTabWrapper.props.children as React.ReactElement).props
      .children as React.ReactElement;
    const childAddTabButton = (childAddTabWrapper.props.children as React.ReactElement).props
      .children as React.ReactElement;

    expect(childPageModel.tabBarExtraContent.left).toBeTruthy();
    expect(rootLeftSpacer.props.className).toBe('nb-ui-layout-mobile-page-tab-left-spacer');
    expect(rootAddTabWrapper.props.className).toBe('nb-ui-layout-mobile-page-tab-add-wrapper');
    expect(childAddTabWrapper.props.className).toBe('nb-ui-layout-mobile-page-tab-add-wrapper');
    expect(rootAddTabButton.props.className).toBe('nb-ui-layout-mobile-page-tab-add');
    expect(childAddTabButton.props.className).toBe('nb-ui-layout-mobile-page-tab-add');
    expect(rootAddTabButton.props['aria-label']).toBe('Add tab');
    expect(childAddTabButton.props['aria-label']).toBe('Add tab');
    expect(rootAddTabButton.props.children).toBeNull();
    expect(childAddTabButton.props.children).toBeNull();
    expect(rootTabsElement.props.tabBarExtraContent.right).toBeTruthy();
    expect(childTabsElement.props.tabBarExtraContent.right).toBeTruthy();
  });

  it('should scope mobile page tabs to the current mobile UI layout', () => {
    const flowEngine = new FlowEngine();
    flowEngine.context.defineProperty('layout', {
      value: {
        uid: 'mobile-layout-model-tab-test',
      },
    });
    const rootPageModel = new MobileRootPageModel({
      flowEngine,
      props: {
        routeId: 'mobile-root-route',
      },
    } as never);
    const childPageModel = new MobileChildPageModel({ flowEngine } as never);
    const rootTabOptions = rootPageModel.createPageTabModelOptions();
    const childTabOptions = childPageModel.createPageTabModelOptions();

    expect(rootTabOptions.props?.route).toMatchObject({
      parentId: 'mobile-root-route',
      type: 'tabs',
      params: [],
      hideInMenu: false,
      enableTabs: false,
      uiLayouts: ['mobile-layout-model-tab-test'],
    });
    expect(rootTabOptions.props?.route).toHaveProperty('schemaUid');
    expect(rootTabOptions.props?.route).toHaveProperty('tabSchemaName');
    expect(childTabOptions.props?.route).toMatchObject({
      uiLayouts: ['mobile-layout-model-tab-test'],
    });
  });

  it('should not add invalid UI layout relations to mobile page tabs without a current layout', () => {
    const flowEngine = new FlowEngine();
    const rootPageModel = new MobileRootPageModel({ flowEngine } as never);
    const childPageModel = new MobileChildPageModel({ flowEngine } as never);
    const rootTabOptions = rootPageModel.createPageTabModelOptions();
    const childTabOptions = childPageModel.createPageTabModelOptions();

    expect(rootTabOptions.props?.route || {}).not.toHaveProperty('uiLayouts');
    expect(childTabOptions.props?.route || {}).not.toHaveProperty('uiLayouts');
  });

  it('should include the current mobile UI layout when saving page tab routes', async () => {
    const flowEngine = new FlowEngine();
    flowEngine.context.defineProperty('layout', {
      value: {
        uid: 'mobile-layout-model-tab-test',
      },
    });
    const request = vi.fn().mockResolvedValue({});
    flowEngine.context.defineProperty('api', {
      value: { request },
    });
    flowEngine.context.defineProperty('t', {
      value: (value: string) => value,
    });
    const rootPageModel = new MobileRootPageModel({
      flowEngine,
      props: {
        routeId: 'mobile-root-route',
      },
    } as never);
    const rootTabOptions = rootPageModel.createPageTabModelOptions();
    const tabModel = new RootPageTabModel({
      flowEngine,
      uid: rootTabOptions.uid,
      props: rootTabOptions.props,
      stepParams: {
        pageTabSettings: {
          tab: {
            title: 'Overview',
          },
        },
      },
    } as never);

    await tabModel.save();

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'desktopRoutes:updateOrCreate',
        data: expect.objectContaining({
          schemaUid: rootTabOptions.props?.route?.schemaUid,
          uiLayouts: ['mobile-layout-model-tab-test'],
        }),
      }),
    );
  });

  it('should render mobile child page titles with the back button in the titlebar', () => {
    const flowEngine = new FlowEngine();
    const close = vi.fn();

    flowEngine.registerModels({
      MobileChildPageModel,
    });
    flowEngine.context.defineProperty('t', {
      value: (key: string) => key,
    });
    flowEngine.context.defineProperty('themeToken', {
      value: {
        paddingLG: 16,
      },
    });
    flowEngine.context.defineProperty('view', {
      value: {
        type: 'embed',
        close,
        inputArgs: {},
        navigation: {
          viewParams: {},
        },
      },
    });

    const childPageModel = flowEngine.createModel<MobileChildPageModel>({
      uid: 'mobile-child-page-title-test',
      use: 'MobileChildPageModel',
      props: {
        displayTitle: true,
        enableTabs: true,
        title: 'Details',
      },
    });

    const { container } = render(
      React.createElement(
        FlowEngineProvider,
        { engine: flowEngine },
        React.createElement(AntdApp, null, childPageModel.render()),
      ),
    );

    const titlebar = container.querySelector('.nb-ui-layout-mobile-titlebar');

    expect(titlebar).toBeInTheDocument();
    expect(titlebar?.querySelector('.nb-ui-layout-mobile-title')).toHaveTextContent('Details');
    expect(titlebar?.querySelector('.nb-ui-layout-mobile-back-button')).toBeInTheDocument();
    expect(
      container.querySelector('.nb-ui-layout-mobile-tabs .nb-ui-layout-mobile-back-button'),
    ).not.toBeInTheDocument();
  });

  it('should show mobile page tab add menu items', async () => {
    const flowEngine = new FlowEngine();
    flowEngine.context.defineProperty('t', {
      value: (key: string) => key,
    });
    flowEngine.context.defineProperty('themeToken', {
      value: {
        paddingLG: 16,
      },
    });
    await flowEngine.flowSettings.forceEnable();
    const rootPageModel = new MobileRootPageModel({ flowEngine } as never);

    render(
      React.createElement(
        FlowEngineProvider,
        { engine: flowEngine },
        React.createElement(AntdApp, null, rootPageModel.renderTabs()),
      ),
    );

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Add tab' }));

    expect(await screen.findByText('Add tab')).toBeInTheDocument();
  });

  it('should render mobile root page tabs from the current desktop route before route id is synced', () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({
      MobileRootPageModel,
    });
    flowEngine.context.defineProperty('currentRoute', {
      value: {
        id: 1,
        schemaUid: 'home-page',
        enableTabs: true,
      },
    });
    flowEngine.context.defineProperty('view', {
      value: {
        inputArgs: {},
      },
    });
    flowEngine.context.defineProperty('pageActive', {
      value: {
        value: true,
      },
    });

    const model = flowEngine.createModel<MobileRootPageModel>({
      uid: 'home-page-model',
      parentId: 'home-page',
      use: 'MobileRootPageModel',
      props: {
        enableTabs: false,
        title: 'Home',
      },
    });
    const renderTabs = vi
      .spyOn(model, 'renderTabs')
      .mockReturnValue(React.createElement('div', { 'data-testid': 'desktop-tabs' }));
    const renderFirstTab = vi
      .spyOn(model, 'renderFirstTab')
      .mockReturnValue(React.createElement('div', { 'data-testid': 'first-tab' }));

    render(React.createElement(FlowEngineProvider, { engine: flowEngine }, model.render()));

    expect(screen.getByTestId('desktop-tabs')).toBeInTheDocument();
    expect(screen.queryByTestId('first-tab')).not.toBeInTheDocument();
    expect(renderTabs).toHaveBeenCalledTimes(1);
    expect(renderFirstTab).not.toHaveBeenCalled();
  });

  it('should show mobile root page tabs immediately after saving enable tabs', async () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({
      MobileRootPageModel,
    });
    vi.spyOn(flowEngine, 'saveModel').mockResolvedValue(undefined as never);
    const currentRoute = {
      id: 'route-123',
      schemaUid: 'home-page',
      enableTabs: false,
    };
    const request = vi.fn().mockResolvedValue({ data: { success: true } });
    const refreshDesktopRoutes = vi.fn().mockResolvedValue(undefined);

    flowEngine.context.defineProperty('api', {
      value: {
        request,
      },
    });
    flowEngine.context.defineProperty('refreshDesktopRoutes', {
      value: refreshDesktopRoutes,
    });
    flowEngine.context.defineProperty('currentRoute', {
      value: currentRoute,
    });
    flowEngine.context.defineProperty('view', {
      value: {
        inputArgs: {},
      },
    });
    flowEngine.context.defineProperty('pageActive', {
      value: {
        value: true,
      },
    });

    const model = flowEngine.createModel<MobileRootPageModel>({
      uid: 'home-page-model-save-tabs',
      parentId: 'home-page',
      use: 'MobileRootPageModel',
      props: {
        routeId: 'route-123',
        enableTabs: false,
        title: 'Home',
      },
    });
    vi.spyOn(model, 'renderTabs').mockReturnValue(React.createElement('div', { 'data-testid': 'desktop-tabs' }));
    vi.spyOn(model, 'renderFirstTab').mockReturnValue(React.createElement('div', { 'data-testid': 'first-tab' }));

    render(React.createElement(FlowEngineProvider, { engine: flowEngine }, model.render()));

    expect(screen.getByTestId('first-tab')).toBeInTheDocument();
    expect(screen.queryByTestId('desktop-tabs')).not.toBeInTheDocument();

    act(() => {
      model.setProps('enableTabs', true);
      model.setStepParams('pageSettings', 'general', {
        enableTabs: true,
      });
    });

    expect(screen.getByTestId('first-tab')).toBeInTheDocument();
    expect(screen.queryByTestId('desktop-tabs')).not.toBeInTheDocument();

    await act(async () => {
      await model.saveStepParams();
    });

    expect(currentRoute.enableTabs).toBe(true);
    expect(model.props.enableTabs).toBe(true);
    expect(screen.getByTestId('desktop-tabs')).toBeInTheDocument();
    expect(screen.queryByTestId('first-tab')).not.toBeInTheDocument();
  });

  it('should persist mobile UI editor preference to localStorage', () => {
    const listener = vi.fn();
    window.addEventListener(FLOW_SETTINGS_PREFERENCE_CHANGE_EVENT, listener);

    expect(readMobileFlowSettingsPreference()).toBe(false);

    writeMobileFlowSettingsPreference(true);
    expect(window.localStorage.getItem(FLOW_SETTINGS_PREFERENCE_STORAGE_KEY)).toBe('1');
    expect(readMobileFlowSettingsPreference()).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);

    writeMobileFlowSettingsPreference(false);
    expect(window.localStorage.getItem(FLOW_SETTINGS_PREFERENCE_STORAGE_KEY)).toBe('0');
    expect(readMobileFlowSettingsPreference()).toBe(false);
    expect(listener).toHaveBeenCalledTimes(2);

    window.removeEventListener(FLOW_SETTINGS_PREFERENCE_CHANGE_EVENT, listener);
  });
});

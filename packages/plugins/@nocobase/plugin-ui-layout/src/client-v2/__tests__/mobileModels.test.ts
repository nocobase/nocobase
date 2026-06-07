/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseLayoutModel, ChildPageModel, RootPageModel, RouteModel } from '@nocobase/client-v2';
import { NocoBaseDesktopRouteType, type NocoBaseDesktopRoute } from '@nocobase/client-v2/flow-compat';
import { App as AntdApp } from 'antd';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  createViewScopedEngine,
  FlowEngine,
  FlowEngineProvider,
  type FlowSettingsContext,
} from '@nocobase/flow-engine';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
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
  readMobileFlowSettingsPreference,
  writeMobileFlowSettingsPreference,
} from '../models/MobileLayoutModel';
import {
  collectMobileTabRoutes,
  getMobilePagePath,
  MobileLayoutMenuItemModel,
  MobileMenuSettingsIconPicker,
} from '../models/MobileMenuModels';
import { MobileChildPageModel, MobileRootPageModel } from '../models/MobilePageModels';
import { registerMobilePageModelResolution } from '../mobilePageModelResolution';

type MobileRouteRepositoryForTest = {
  listAccessible: () => NocoBaseDesktopRoute[];
  subscribe?: (subscriber: () => void) => void;
  unsubscribe?: (subscriber: () => void) => void;
  ensureAccessibleLoaded?: () => Promise<NocoBaseDesktopRoute[]>;
  createRoute?: (route: NocoBaseDesktopRoute) => Promise<unknown>;
};

describe('plugin-ui-layout mobile models', () => {
  beforeEach(() => {
    window.localStorage.removeItem(FLOW_SETTINGS_PREFERENCE_STORAGE_KEY);
  });

  function renderMobileLayoutWithRouteRepository(
    routeRepository: MobileRouteRepositoryForTest,
    options: {
      beforeRender?: (model: MobileLayoutModel) => void;
      initialEntries?: string[];
      outletElement?: React.ReactNode;
    } = {},
  ) {
    const engine = new FlowEngine();

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
      value: routeRepository,
    });
    engine.context.defineProperty('app', {
      value: {
        router: {
          getBasename: () => '',
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
            { initialEntries: options.initialEntries || ['/v/mobile'] },
            React.createElement(
              Routes,
              null,
              options.outletElement
                ? React.createElement(
                    Route,
                    {
                      path: '/v/mobile',
                      element: model.render(),
                    },
                    React.createElement(Route, {
                      path: ':name',
                      element: options.outletElement,
                    }),
                  )
                : React.createElement(Route, {
                    path: '/v/mobile/*',
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
  ): FlowSettingsContext<MobileLayoutMenuItemModel> {
    return {
      t: (key: string) => key,
      model: {
        getRoute: () => route,
      },
    } as unknown as FlowSettingsContext<MobileLayoutMenuItemModel>;
  }

  function getDocumentStyleText() {
    return Array.from(document.querySelectorAll('style'))
      .map((style) => style.textContent || '')
      .join('\n');
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

    expect(deleteRoute).toHaveBeenCalledWith(10);
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

  it('should set the mobile root page model before the active route opens', () => {
    const dispatchSnapshots: Array<string | undefined> = [];
    const dispatchEvent = vi.spyOn(RouteModel.prototype, 'dispatchEvent').mockImplementation(function (
      this: RouteModel,
      eventName: string,
    ) {
      if (eventName === 'click') {
        dispatchSnapshots.push(this.getStepParams('popupSettings', 'openView')?.pageModelClass as string | undefined);
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

  it('should render the menu edit icon picker above the settings dialog', async () => {
    render(React.createElement(MobileMenuSettingsIconPicker));

    fireEvent.click(screen.getByRole('button', { name: 'Select icon' }));

    await waitFor(() => {
      const popover = document.querySelector('.ant-popover') as HTMLElement | null;

      expect(popover).toBeInTheDocument();
      expect(Number(popover?.style.zIndex)).toBeGreaterThan(5000);
    });
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

  it('should keep the default mobile tab toolbar inside the hovered item', () => {
    expect(MOBILE_TAB_FLOW_SETTINGS_OPTIONS).toEqual({
      showBackground: false,
      showBorder: false,
      showDynamicFlowsEditor: false,
      toolbarPosition: 'inside',
    });
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
    let routes: NocoBaseDesktopRoute[] = [
      {
        id: 1,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Home',
        schemaUid: 'home-page',
      },
    ];
    const createRoute = vi.fn(async (route: NocoBaseDesktopRoute) => {
      routes = [
        ...routes,
        {
          id: 2,
          ...route,
        },
      ];
      listeners.forEach((listener) => listener());
    });

    window.localStorage.setItem(FLOW_SETTINGS_PREFERENCE_STORAGE_KEY, '1');

    renderMobileLayoutWithRouteRepository({
      createRoute,
      listAccessible: () => routes,
      subscribe: (listener) => {
        listeners.add(listener);
      },
      unsubscribe: (listener) => {
        listeners.delete(listener);
      },
    });

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
            href: 'https://docs.example.com',
            openInNewWindow: true,
          }),
        }),
      );
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Docs/ })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Home/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: /Docs/ })).not.toHaveAttribute('aria-current');
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
          href: '/docs',
          openInNewWindow: true,
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

  it('should keep default page tab add buttons in mobile tabs', () => {
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

    expect(rootPageModel.tabBarExtraContent.right).toBeUndefined();
    expect(childPageModel.tabBarExtraContent.left).toBeTruthy();
    expect(childPageModel.tabBarExtraContent.right).toBeUndefined();
    expect(rootTabsElement.props.tabBarExtraContent.right).toBeTruthy();
    expect(childTabsElement.props.tabBarExtraContent.right).toBeTruthy();
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

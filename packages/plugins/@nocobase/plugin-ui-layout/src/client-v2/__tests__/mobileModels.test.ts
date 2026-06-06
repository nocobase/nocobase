/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseLayoutModel, ChildPageModel, RootPageModel } from '@nocobase/client-v2';
import { NocoBaseDesktopRouteType, type NocoBaseDesktopRoute } from '@nocobase/client-v2/flow-compat';
import { App as AntdApp } from 'antd';
import { render, screen, waitFor } from '@testing-library/react';
import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
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
import { collectMobileTabRoutes, getMobilePagePath, MobileLayoutMenuItemModel } from '../models/MobileMenuModels';
import { MobileChildPageModel, MobileRootPageModel } from '../models/MobilePageModels';

type MobileRouteRepositoryForTest = {
  listAccessible: () => NocoBaseDesktopRoute[];
  subscribe?: (subscriber: () => void) => void;
  unsubscribe?: (subscriber: () => void) => void;
  ensureAccessibleLoaded?: () => Promise<NocoBaseDesktopRoute[]>;
};

describe('plugin-ui-layout mobile models', () => {
  beforeEach(() => {
    window.localStorage.removeItem(FLOW_SETTINGS_PREFERENCE_STORAGE_KEY);
  });

  function renderMobileLayoutWithRouteRepository(routeRepository: MobileRouteRepositoryForTest) {
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

    return {
      engine,
      model,
    };
  }

  it('should extend the standard layout and page models', () => {
    expect(MobileLayoutModel.prototype).toBeInstanceOf(BaseLayoutModel);
    expect(MobileRootPageModel.prototype).toBeInstanceOf(RootPageModel);
    expect(MobileChildPageModel.prototype).toBeInstanceOf(ChildPageModel);
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
                path: '/v/mobile',
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
                path: '/v/mobile',
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

  it('should keep the default mobile tab toolbar inside the hovered item', () => {
    expect(MOBILE_TAB_FLOW_SETTINGS_OPTIONS).toEqual({
      showBackground: false,
      showBorder: false,
      showDynamicFlowsEditor: false,
      toolbarPosition: 'inside',
    });
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

  it('should suppress default page tab add buttons in mobile headers', () => {
    const flowEngine = { getModel: () => null };

    expect(new MobileRootPageModel({ flowEngine } as never).tabBarExtraContent.right).toBeNull();
    expect(new MobileChildPageModel({ flowEngine } as never).tabBarExtraContent.right).toBeNull();
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

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import { observer } from '@nocobase/flow-engine';
import { MemoryRouter } from 'react-router-dom';
import { NocoBaseDesktopRouteType } from '../../../../flow-compat';
import {
  AdminLayoutMenuItemRenderer,
  AdminLayoutMenuItemModel,
  AdminLayoutModel,
  getAdminLayoutMenuMovePositionOptions,
  normalizeAdminLayoutMenuLegacyVariables,
  openAdminLayoutMenuLink,
  resolveAdminLayoutMenuLink,
  resolveAdminLayoutMenuDragMoveOptionsFromEvent,
  resolveAdminLayoutMenuDragMoveOptions,
} from '..';

const { navigateMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
}));

vi.mock('../../../../application/CustomRouterContextProvider', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client/src/application/CustomRouterContextProvider')>();
  return {
    ...actual,
    useNavigateNoUpdate: () => navigateMock,
    useRouterBasename: () => '/apps/demo',
  };
});

describe('AdminLayoutModel menu items', () => {
  let engine: FlowEngine;
  let modalConfirmMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    engine = new FlowEngine();
    modalConfirmMock = vi.fn().mockResolvedValue(true);
    engine.registerModels({
      AdminLayoutModel,
      AdminLayoutMenuItemModel,
    });
    engine.context.defineProperty('routeRepository', {
      value: {
        listAccessible: () => [],
        createRoute: vi.fn(),
        updateRoute: vi.fn(),
        deleteRoute: vi.fn(),
        moveRoute: vi.fn(),
        refreshAccessible: vi.fn(),
      },
    });
    engine.context.defineProperty('api', {
      value: {
        auth: {
          role: 'admin',
          token: 'token-1',
        },
        request: vi.fn(),
        resource: vi.fn(() => ({})),
      },
    });
    engine.context.defineProperty('router', {
      value: {
        navigate: vi.fn(),
      },
    });
    engine.context.defineProperty('location', {
      value: {
        pathname: '/admin/current-page',
        search: '?from=header',
      },
    });
    engine.context.defineProperty('app', {
      value: {
        getPublicPath: () => '/apps/demo/v2/',
        router: {
          getBasename: () => '/apps/demo/v2',
        },
        components: {},
        scopes: {},
      },
    });
    engine.context.defineProperty('modal', {
      value: {
        confirm: modalConfirmMock,
      },
    });
    engine.context.defineProperty('t', {
      value: (text) => text,
    });
    navigateMock.mockReset();
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  const createRoute = (options?: Partial<import('../../../../flow-compat').NocoBaseDesktopRoute>) => ({
    id: 1,
    title: 'Page 1',
    schemaUid: 'page-1',
    type: NocoBaseDesktopRouteType.page,
    ...options,
  });

  it('should normalize legacy variables only inside template expressions', () => {
    expect(normalizeAdminLayoutMenuLegacyVariables('https://a.com?id={{ $user.id }}')).toBe(
      'https://a.com?id={{ ctx.user.id }}',
    );
    expect(normalizeAdminLayoutMenuLegacyVariables('prefix-{{ currentUser.name }}-{{ $nRole }}')).toBe(
      'prefix-{{ ctx.user.name }}-{{ ctx.role }}',
    );
    expect(normalizeAdminLayoutMenuLegacyVariables('https://a.com/currentUser/profile')).toBe(
      'https://a.com/currentUser/profile',
    );
  });

  it('should resolve admin-layout link with FlowContext variables', async () => {
    engine.context.defineProperty('user', {
      value: {
        id: 7,
        name: 'Jane',
      },
    });

    const result = await resolveAdminLayoutMenuLink({
      context: engine.context as any,
      href: 'https://www.nocobase.com/docs?role={{ ctx.role }}',
      params: [
        { name: 'userId', value: '{{ ctx.user.id }}' },
        { name: 'userName', value: 'user-{{ ctx.user.name }}' },
      ],
    });

    expect(result).toBe('https://www.nocobase.com/docs?role=admin&userId=7&userName=user-Jane');
  });

  it('should keep legacy variable syntax working in admin-layout link parser', async () => {
    engine.context.defineProperty('user', {
      value: {
        id: 9,
      },
    });

    const result = await resolveAdminLayoutMenuLink({
      context: engine.context as any,
      href: 'https://www.nocobase.com/docs',
      params: [
        { name: 'userId', value: '{{ $user.id }}' },
        { name: 'legacyUserId', value: '{{ currentUser.id }}' },
        { name: 'role', value: '{{ $nRole }}' },
        { name: 'token', value: '{{ $nToken }}' },
        { name: 'from', value: '{{ $nURLSearchParams.from }}' },
      ],
    });

    expect(result).toBe('https://www.nocobase.com/docs?userId=9&legacyUserId=9&role=admin&token=token-1&from=header');
  });

  it('should keep falsy values except null and undefined in query params', async () => {
    const result = await resolveAdminLayoutMenuLink({
      context: engine.context as any,
      href: 'https://www.nocobase.com/docs',
      params: [
        { name: 'zero', value: 0 },
        { name: 'bool', value: false },
        { name: 'empty', value: '' },
        { name: 'nil', value: null },
        { name: 'undef', value: undefined },
      ],
    });

    expect(result).toBe('https://www.nocobase.com/docs?zero=0&bool=false&empty=');
  });

  it('should append query params into hash route url', async () => {
    engine.context.defineProperty('role', {
      value: 'admin',
    });

    const result = await resolveAdminLayoutMenuLink({
      context: engine.context as any,
      href: '/admin#/?tab=1',
      params: [{ name: 'role', value: '{{ ctx.role }}' }],
    });

    expect(result).toBe('/admin#/?tab=1&role=admin');
  });

  it('should sync route tree into menuItems subModels and cleanup stale branches', () => {
    const adminLayoutModel = engine.createModel<AdminLayoutModel>({
      uid: 'admin-layout-model',
      use: AdminLayoutModel,
    });

    adminLayoutModel.syncMenuRoutes([
      {
        id: 1,
        title: 'Group',
        type: NocoBaseDesktopRouteType.group,
        children: [
          {
            id: 11,
            title: 'Page 1',
            schemaUid: 'page-1',
            type: NocoBaseDesktopRouteType.page,
          },
        ],
      },
      {
        id: 2,
        title: 'Link',
        type: NocoBaseDesktopRouteType.link,
      },
    ]);

    expect(adminLayoutModel.subModels.menuItems).toHaveLength(2);
    expect(adminLayoutModel.subModels.menuItems?.[0]).toBeInstanceOf(AdminLayoutMenuItemModel);
    expect(adminLayoutModel.subModels.menuItems?.[0].subModels.menuItems).toHaveLength(1);
    expect(adminLayoutModel.subModels.menuItems?.[0].subModels.menuItems?.[0].props.route).toMatchObject({
      title: 'Page 1',
      schemaUid: 'page-1',
    });

    const staleGroupUid = adminLayoutModel.subModels.menuItems?.[0].uid;

    adminLayoutModel.syncMenuRoutes([
      {
        id: 2,
        title: 'Link',
        type: NocoBaseDesktopRouteType.link,
      },
    ]);

    expect(adminLayoutModel.subModels.menuItems).toHaveLength(1);
    expect(adminLayoutModel.subModels.menuItems?.[0].props.route).toMatchObject({
      title: 'Link',
      type: NocoBaseDesktopRouteType.link,
    });
    expect(engine.getModel(staleGroupUid)).toBeUndefined();
  });

  it('should generate ProLayout route tree from menu models', () => {
    const adminLayoutModel = engine.createModel<AdminLayoutModel>({
      uid: 'admin-layout-model',
      use: AdminLayoutModel,
    });

    adminLayoutModel.syncMenuRoutes([
      {
        id: 1,
        title: 'Group',
        type: NocoBaseDesktopRouteType.group,
        children: [
          {
            id: 11,
            title: 'Page 1',
            schemaUid: 'page-1',
            type: NocoBaseDesktopRouteType.page,
          },
        ],
      },
      {
        id: 2,
        title: 'Link',
        type: NocoBaseDesktopRouteType.link,
      },
    ]);

    const route = adminLayoutModel.toProLayoutRoute({
      designable: false,
      isMobile: false,
      t: (title) => title,
    });

    expect(route.path).toBe('/');
    expect(route.children).toHaveLength(2);
    expect(route.children[0].path).toBe('/admin/1');
    expect(route.children[0].redirect).toBe('/admin/page-1');
    expect(route.children[0]._runtimePath).toBe('/apps/demo/admin/page-1');
    expect(route.children[0]._navigationMode).toBe('document');
    expect(route.children[0]._isLegacy).toBe(true);
    expect(route.children[0]._depth).toBe(0);
    expect(route.children[0]._route).toMatchObject({ id: 1, type: NocoBaseDesktopRouteType.group });
    expect(route.children[0]._model).toBe(adminLayoutModel.subModels.menuItems?.[0]);
    expect(route.children[0].routes).toHaveLength(1);
    expect(route.children[0].routes?.[0].path).toBe('/admin/page-1');
    expect(route.children[0].routes?.[0].redirect).toBe('/admin/page-1');
    expect(route.children[0].routes?.[0]._runtimePath).toBe('/apps/demo/admin/page-1');
    expect(route.children[0].routes?.[0]._navigationMode).toBe('document');
    expect(route.children[0].routes?.[0]._depth).toBe(1);
    expect(route.children[0].routes?.[0]._route).toMatchObject({
      schemaUid: 'page-1',
      type: NocoBaseDesktopRouteType.page,
    });
    expect(route.children[0].routes?.[0]._model).toBe(
      adminLayoutModel.subModels.menuItems?.[0].subModels.menuItems?.[0],
    );
    expect(route.children[1].path).toBe('/admin/__admin_layout__/link/2');
    expect(route.children[1]._depth).toBe(0);
    expect(route.children[1]._route).toMatchObject({ id: 2, type: NocoBaseDesktopRouteType.link });
    expect(route.children[1]._model).toBe(adminLayoutModel.subModels.menuItems?.[1]);
  });

  it('should resolve modern flowPage menu runtime target to v2 path', () => {
    const model = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-flow-page',
      use: AdminLayoutMenuItemModel,
      props: {
        route: {
          id: 1,
          title: 'Flow page',
          schemaUid: 'flow-page-1',
          type: NocoBaseDesktopRouteType.flowPage,
        },
      },
    });

    expect(
      model.toProLayoutRoute({
        designable: false,
        isMobile: false,
        t: (title) => title,
      }),
    ).toMatchObject({
      _runtimePath: '/apps/demo/v2/admin/flow-page-1',
      _navigationMode: 'spa',
      _isLegacy: false,
    });
  });

  it('should keep sub app page menu runtime target inside spa when basename does not include /v2/', () => {
    engine.context.defineProperty('app', {
      value: {
        getPublicPath: () => '/apps/demo/',
        router: {
          getBasename: () => '/apps/demo',
        },
        components: {},
        scopes: {},
      },
    });

    const model = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-sub-app-page',
      use: AdminLayoutMenuItemModel,
      props: {
        route: {
          id: 1,
          title: 'Sub app page',
          schemaUid: 'sub-app-page-1',
          type: NocoBaseDesktopRouteType.page,
        },
      },
    });

    expect(
      model.toProLayoutRoute({
        designable: false,
        isMobile: false,
        t: (title) => title,
      }),
    ).toMatchObject({
      _runtimePath: '/apps/demo/admin/sub-app-page-1',
      _navigationMode: 'spa',
      _isLegacy: false,
    });
  });

  it('should not guess runtime path when page schemaUid is missing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const model = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-missing-schema',
      use: AdminLayoutMenuItemModel,
      props: {
        route: {
          id: 1,
          title: 'Broken page',
          type: NocoBaseDesktopRouteType.page,
        },
      },
    });

    expect(
      model.toProLayoutRoute({
        designable: false,
        isMobile: false,
        t: (title) => title,
      }),
    ).toMatchObject({
      _runtimePath: null,
      disabled: true,
    });
    expect(warn).toHaveBeenCalledWith(
      '[NocoBase] Admin route runtime target:',
      'Missing schemaUid.',
      expect.objectContaining({ type: NocoBaseDesktopRouteType.page }),
    );
  });

  it('should render legacy menu item as native anchor and use assign on left click', () => {
    const assign = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        assign,
      },
    });

    render(
      React.createElement(
        FlowEngineProvider,
        { engine },
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/admin/current-page'] },
          React.createElement(AdminLayoutMenuItemRenderer, {
            renderType: 'item',
            item: {
              name: 'Legacy page',
              path: '/admin/legacy-page',
              _runtimePath: '/apps/demo/admin/legacy-page',
              _navigationMode: 'document',
              _isLegacy: true,
              _route: {
                type: NocoBaseDesktopRouteType.page,
                title: 'Legacy page',
                schemaUid: 'legacy-page',
                options: {},
              },
              _model: { context: engine.context } as any,
            },
            dom: React.createElement('span', null, 'Legacy page'),
            options: { isMobile: false, collapsed: false },
          }),
        ),
      ),
    );

    const link = screen.getByRole('link', { name: 'Legacy page' });
    expect(link).toHaveAttribute('href', '/apps/demo/admin/legacy-page');

    fireEvent.click(link, { button: 0 });

    return waitFor(() => {
      expect(modalConfirmMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Open classic page access',
          content: 'This page requires the classic version to open properly. Do you want to go there now?',
          okText: 'Yes',
          cancelText: 'Cancel',
        }),
      );
      expect(assign).toHaveBeenCalledWith('/apps/demo/admin/legacy-page');
      expect(navigateMock).not.toHaveBeenCalled();
    });
  });

  it('should keep native anchor behavior for modifier click on legacy menu item', () => {
    vi.useFakeTimers();
    const assign = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        assign,
      },
    });

    render(
      React.createElement(
        FlowEngineProvider,
        { engine },
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/admin/current-page'] },
          React.createElement(AdminLayoutMenuItemRenderer, {
            renderType: 'item',
            item: {
              name: 'Legacy page',
              path: '/admin/legacy-page',
              _runtimePath: '/apps/demo/admin/legacy-page',
              _navigationMode: 'document',
              _isLegacy: true,
              _route: {
                type: NocoBaseDesktopRouteType.page,
                title: 'Legacy page',
                schemaUid: 'legacy-page',
                options: {},
              },
              _model: { context: engine.context } as any,
            },
            dom: React.createElement('span', null, 'Legacy page'),
            options: { isMobile: false, collapsed: false },
          }),
        ),
      ),
    );

    try {
      fireEvent.click(screen.getByRole('link', { name: 'Legacy page' }), { metaKey: true, button: 0 });

      expect(assign).not.toHaveBeenCalled();
      expect(navigateMock).not.toHaveBeenCalled();
      expect(modalConfirmMock).not.toHaveBeenCalled();
      vi.clearAllTimers();
    } finally {
      vi.useRealTimers();
    }
  });

  it('should not navigate to legacy page when user cancels confirm dialog', async () => {
    modalConfirmMock.mockResolvedValue(false);
    const assign = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        assign,
      },
    });

    render(
      React.createElement(
        FlowEngineProvider,
        { engine },
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/admin/current-page'] },
          React.createElement(AdminLayoutMenuItemRenderer, {
            renderType: 'item',
            item: {
              name: 'Legacy page',
              path: '/admin/legacy-page',
              _runtimePath: '/apps/demo/admin/legacy-page',
              _navigationMode: 'document',
              _isLegacy: true,
              _route: {
                type: NocoBaseDesktopRouteType.page,
                title: 'Legacy page',
                schemaUid: 'legacy-page',
                options: {},
              },
              _model: { context: engine.context } as any,
            },
            dom: React.createElement('span', null, 'Legacy page'),
            options: { isMobile: false, collapsed: false },
          }),
        ),
      ),
    );

    fireEvent.click(screen.getByRole('link', { name: 'Legacy page' }), { button: 0 });

    await waitFor(() => {
      expect(modalConfirmMock).toHaveBeenCalledTimes(1);
    });
    expect(assign).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('should render modern menu item with router internal href under basename', () => {
    render(
      React.createElement(
        FlowEngineProvider,
        { engine },
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/admin/current-page'] },
          React.createElement(AdminLayoutMenuItemRenderer, {
            renderType: 'item',
            item: {
              name: 'Flow page',
              path: '/admin/flow-page-1',
              _runtimePath: '/apps/demo/v2/admin/flow-page-1',
              _navigationMode: 'spa',
              _isLegacy: false,
              _route: {
                type: NocoBaseDesktopRouteType.flowPage,
                title: 'Flow page',
                schemaUid: 'flow-page-1',
                options: {},
              },
            },
            dom: React.createElement('span', null, 'Flow page'),
            options: { isMobile: false, collapsed: false },
          }),
        ),
      ),
    );

    expect(screen.getByRole('link', { name: 'Flow page' })).toHaveAttribute('href', '/apps/demo/v2/admin/flow-page-1');
  });

  it('should render legacy group target as native anchor', () => {
    render(
      React.createElement(
        FlowEngineProvider,
        { engine },
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/admin/current-page'] },
          React.createElement(AdminLayoutMenuItemRenderer, {
            renderType: 'group',
            item: {
              name: 'Legacy group',
              path: '/admin/group-1',
              _runtimePath: '/apps/demo/admin/legacy-page',
              _navigationMode: 'document',
              _isLegacy: true,
              _route: {
                type: NocoBaseDesktopRouteType.group,
                title: 'Legacy group',
                schemaUid: 'group-1',
                options: {},
              },
              _model: { context: engine.context } as any,
            },
            dom: React.createElement('span', null, 'Legacy group'),
            options: { isMobile: false, collapsed: false },
          }),
        ),
      ),
    );

    expect(screen.queryByRole('link', { name: 'Legacy group' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Legacy group-landing-entry' })).toHaveAttribute(
      'href',
      '/apps/demo/admin/legacy-page',
    );
  });

  it('should navigate legacy group only through explicit landing entry', () => {
    const assign = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        assign,
      },
    });

    render(
      React.createElement(
        FlowEngineProvider,
        { engine },
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/admin/current-page'] },
          React.createElement(AdminLayoutMenuItemRenderer, {
            renderType: 'group',
            item: {
              name: 'Legacy group',
              path: '/admin/group-1',
              _runtimePath: '/apps/demo/admin/legacy-page',
              _navigationMode: 'document',
              _isLegacy: true,
              _route: {
                type: NocoBaseDesktopRouteType.group,
                title: 'Legacy group',
                schemaUid: 'group-1',
                options: {},
              },
              _model: { context: engine.context } as any,
            },
            dom: React.createElement('span', null, 'Legacy group'),
            options: { isMobile: false, collapsed: false },
          }),
        ),
      ),
    );

    fireEvent.click(screen.getByText('Legacy group'));
    expect(assign).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('link', { name: 'Legacy group-landing-entry' }), { button: 0 });
    return waitFor(() => {
      expect(modalConfirmMock).toHaveBeenCalledTimes(1);
      expect(assign).toHaveBeenCalledWith('/apps/demo/admin/legacy-page');
    });
  });

  it('should render modern group landing entry with v2 href', () => {
    render(
      React.createElement(
        FlowEngineProvider,
        { engine },
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/admin/current-page'] },
          React.createElement(AdminLayoutMenuItemRenderer, {
            renderType: 'group',
            item: {
              name: 'Flow group',
              path: '/admin/group-2',
              _runtimePath: '/apps/demo/v2/admin/flow-page-1',
              _navigationMode: 'spa',
              _isLegacy: false,
              _route: {
                type: NocoBaseDesktopRouteType.group,
                title: 'Flow group',
                schemaUid: 'group-2',
                options: {},
              },
            },
            dom: React.createElement('span', null, 'Flow group'),
            options: { isMobile: false, collapsed: false },
          }),
        ),
      ),
    );

    expect(screen.getByRole('link', { name: 'Flow group-landing-entry' })).toHaveAttribute(
      'href',
      '/apps/demo/v2/admin/flow-page-1',
    );
  });

  it('should insert designer buttons in expected positions', () => {
    const adminLayoutModel = engine.createModel<AdminLayoutModel>({
      uid: 'admin-layout-model',
      use: AdminLayoutModel,
    });

    adminLayoutModel.syncMenuRoutes([
      {
        id: 1,
        title: 'Group',
        type: NocoBaseDesktopRouteType.group,
        children: [
          {
            id: 11,
            title: 'Page 1',
            schemaUid: 'page-1',
            type: NocoBaseDesktopRouteType.page,
          },
        ],
      },
    ]);

    const desktopRoute = adminLayoutModel.toProLayoutRoute({
      designable: true,
      isMobile: false,
      t: (title) => title,
    });

    expect(desktopRoute.children[0].key).toBe('x-designer-button');
    expect(desktopRoute.children[0].path).toBe('/admin/__admin_layout__/designer/admin-layout-model');
    expect(React.isValidElement(desktopRoute.children[0].name)).toBe(true);
    expect(desktopRoute.children[1].routes?.[1].key).toBe('x-designer-button');
    expect(desktopRoute.children[1].routes?.[1].path).toBe('/admin/__admin_layout__/designer/1');

    const mobileRoute = adminLayoutModel.toProLayoutRoute({
      designable: true,
      isMobile: true,
      t: (title) => title,
    });

    expect(mobileRoute.children[mobileRoute.children.length - 1].key).toBe('x-designer-button');
    expect(mobileRoute.children[mobileRoute.children.length - 1].path).toBe(
      '/admin/__admin_layout__/designer/admin-layout-model',
    );
    expect(mobileRoute.children[0].routes?.[1].key).toBe('x-designer-button');
    expect(mobileRoute.children[0].routes?.[1].path).toBe('/admin/__admin_layout__/designer/1');
    expect(desktopRoute.children[0]._launcherModel).toBe(adminLayoutModel);
    expect(desktopRoute.children[1].routes?.[1]._launcherModel).toBe(adminLayoutModel.subModels.menuItems?.[0]);
  });

  it('should update ProLayout route result after menuItems sync in observer render', async () => {
    const adminLayoutModel = engine.createModel<AdminLayoutModel>({
      uid: 'admin-layout-model',
      use: AdminLayoutModel,
    });

    const RouteReader = observer(() => {
      const route = adminLayoutModel.toProLayoutRoute({
        designable: true,
        isMobile: false,
        t: (title) => title,
      });

      return React.createElement('div', { 'data-testid': 'route-length' }, String(route.children.length));
    });

    render(React.createElement(RouteReader));

    expect(screen.getByTestId('route-length').textContent).toBe('1');

    act(() => {
      adminLayoutModel.syncMenuRoutes([
        {
          id: 1,
          title: 'Page 1',
          schemaUid: 'page-1',
          type: NocoBaseDesktopRouteType.page,
        },
      ]);
    });

    await waitFor(() => {
      expect(screen.getByTestId('route-length').textContent).toBe('2');
    });
  });

  it('should persist hidden setting through route repository', async () => {
    const updateRoute = vi.fn().mockResolvedValue(undefined);
    engine.context.routeRepository.updateRoute = updateRoute;

    const model = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-hidden',
      use: AdminLayoutMenuItemModel,
      props: {
        route: {
          id: 1,
          title: 'Page 1',
          schemaUid: 'current-page',
          type: NocoBaseDesktopRouteType.page,
          hideInMenu: false,
        },
      },
    });

    const menuSettingsFlow = AdminLayoutMenuItemModel.globalFlowRegistry.getFlow('menuSettings');
    await menuSettingsFlow?.steps?.hidden?.beforeParamsSave?.({ model } as any, { hideInMenu: true }, {});

    expect(updateRoute).toHaveBeenCalledWith(1, {
      hideInMenu: true,
    });
  });

  it('should keep variable-aware editors for link menu settings', async () => {
    const model = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-link-edit',
      use: AdminLayoutMenuItemModel,
      props: {
        route: {
          id: 1,
          title: 'Link 1',
          schemaUid: 'link-1',
          type: NocoBaseDesktopRouteType.link,
          options: {
            href: '{{ ctx.url }}',
            params: [{ name: 'foo', value: { type: 'number', value: 1 } }],
          },
        },
      },
    });

    const menuSettingsFlow = AdminLayoutMenuItemModel.globalFlowRegistry.getFlow('menuSettings');
    const editUiSchema = menuSettingsFlow?.steps?.edit?.uiSchema as ((ctx: any) => Promise<any>) | undefined;
    const schema = await editUiSchema?.({ model, t: (text) => text });

    expect(schema?.href?.['x-component']).toBe('FlowSettingsVariableTextArea');
    expect(schema?.params?.items?.properties?.space?.properties?.value?.['x-component']).toBe(
      'FlowSettingsVariableTextArea',
    );
    expect(schema?.params?.items?.properties?.space?.properties?.value?.['x-component-props']).toMatchObject({
      rows: 1,
      maxRows: 1,
      useTypedConstant: true,
      changeOnSelect: true,
    });
    expect(schema?.href?.['x-component-props']).toMatchObject({
      rows: 1,
      maxRows: 1,
    });
  });

  it('should keep creation flow defaults compatible with launcher source', async () => {
    const headerModel = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-create-link-header',
      use: AdminLayoutMenuItemModel,
      props: {
        creationMeta: {
          menuType: 'link',
          source: 'header',
        },
      },
    });
    const insertModel = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-create-link-insert',
      use: AdminLayoutMenuItemModel,
      props: {
        creationMeta: {
          menuType: 'link',
          source: 'insert',
          insertPosition: 'afterEnd',
          targetRoute: {
            id: 2,
            title: 'Page 2',
            schemaUid: 'page-2',
            type: NocoBaseDesktopRouteType.page,
          },
        },
      },
    });

    const menuCreationFlow = AdminLayoutMenuItemModel.globalFlowRegistry.getFlow('menuCreation');
    const defaultParams = menuCreationFlow?.steps?.basic?.defaultParams as ((ctx: any) => Promise<any>) | undefined;
    const uiSchema = menuCreationFlow?.steps?.basic?.uiSchema as ((ctx: any) => Promise<any>) | undefined;

    expect(await defaultParams?.({ model: headerModel })).toEqual({
      openInNewWindow: true,
    });
    expect(await defaultParams?.({ model: insertModel })).toEqual({});

    const schema = await uiSchema?.({ model: headerModel, t: (text) => text });
    expect(schema?.href?.['x-component']).toBe('FlowSettingsVariableTextArea');
    expect(schema?.params?.items?.properties?.space?.properties?.value?.['x-component']).toBe(
      'FlowSettingsVariableTextArea',
    );
  });

  it('should persist root link creation through menuCreation flow', async () => {
    const createRoute = vi.fn().mockResolvedValue({
      data: {
        data: {
          id: 88,
        },
      },
    });
    engine.context.routeRepository.createRoute = createRoute;

    const model = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-create-link-root',
      use: AdminLayoutMenuItemModel,
      props: {
        creationMeta: {
          menuType: 'link',
          source: 'header',
        },
      },
    });

    model.setStepParams('menuCreation', 'basic', {
      title: 'Docs',
      icon: 'LinkOutlined',
      href: 'https://www.nocobase.com',
      params: [{ name: 'from', value: 'admin' }],
      openInNewWindow: true,
    });

    await model.save();

    expect(createRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NocoBaseDesktopRouteType.link,
        title: 'Docs',
        icon: 'LinkOutlined',
        options: {
          href: 'https://www.nocobase.com',
          params: [{ name: 'from', value: 'admin' }],
          openInNewWindow: true,
        },
      }),
      undefined,
    );
  });

  it('should persist creation session during saveStepParams and avoid duplicate route creation on save', async () => {
    const createRoute = vi.fn().mockResolvedValue({
      data: {
        data: {
          id: 88,
        },
      },
    });
    engine.context.routeRepository.createRoute = createRoute;

    const model = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-create-link-save-step-params',
      use: AdminLayoutMenuItemModel,
      props: {
        creationMeta: {
          menuType: 'link',
          source: 'header',
        },
      },
    });

    model.setStepParams('menuCreation', 'basic', {
      title: 'Docs',
      href: 'https://www.nocobase.com',
      openInNewWindow: true,
    });

    await model.saveStepParams();
    await model.save();

    expect(createRoute).toHaveBeenCalledTimes(1);
  });

  it('should persist insert flow page creation through menuCreation flow', async () => {
    const createRoute = vi.fn().mockResolvedValue({
      data: {
        data: {
          id: 99,
        },
      },
    });
    const moveRoute = vi.fn().mockResolvedValue(undefined);
    const request = vi.fn().mockResolvedValue(undefined);

    engine.context.routeRepository.createRoute = createRoute;
    engine.context.routeRepository.moveRoute = moveRoute;
    engine.context.api.request = request;

    const model = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-create-flow-page-insert',
      use: AdminLayoutMenuItemModel,
      props: {
        creationMeta: {
          menuType: 'flowPage',
          source: 'insert',
          insertPosition: 'beforeBegin',
          targetRoute: {
            id: 1,
            parentId: 10,
            title: 'Current page',
            schemaUid: 'current-page',
            type: NocoBaseDesktopRouteType.page,
          },
        },
      },
    });

    model.setStepParams('menuCreation', 'basic', {
      title: 'New page',
      icon: 'AppstoreOutlined',
    });

    await model.save();

    expect(createRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        parentId: 10,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'New page',
        icon: 'AppstoreOutlined',
      }),
      {
        refreshAfterMutation: false,
      },
    );
    expect(moveRoute).toHaveBeenCalledWith({
      sourceId: 99,
      targetId: 1,
      sortField: 'sort',
      method: 'insertBefore',
    });
    expect(request).not.toHaveBeenCalled();
  });

  it('should persist insert step using selected menu type', async () => {
    const createRoute = vi.fn().mockResolvedValue({
      data: {
        data: {
          id: 66,
        },
      },
    });
    const moveRoute = vi.fn().mockResolvedValue(undefined);

    engine.context.routeRepository.createRoute = createRoute;
    engine.context.routeRepository.moveRoute = moveRoute;

    const model = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-insert-step',
      use: AdminLayoutMenuItemModel,
      props: {
        route: {
          id: 1,
          parentId: 10,
          title: 'Current page',
          schemaUid: 'current-page',
          type: NocoBaseDesktopRouteType.page,
        },
      },
    });

    const menuSettingsFlow = AdminLayoutMenuItemModel.globalFlowRegistry.getFlow('menuSettings');
    await menuSettingsFlow?.steps?.insertBefore?.beforeParamsSave?.(
      { model } as any,
      {
        menuType: 'group',
        title: 'New group',
        icon: 'FolderOutlined',
      },
      {},
    );

    expect(createRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NocoBaseDesktopRouteType.group,
        title: 'New group',
        icon: 'FolderOutlined',
        parentId: 10,
      }),
      {
        refreshAfterMutation: false,
      },
    );
    expect(moveRoute).toHaveBeenCalledWith({
      sourceId: 66,
      targetId: 1,
      sortField: 'sort',
      method: 'insertBefore',
    });
  });

  it('should not persist admin layout menu models through flowEngine.saveModel when saving step params', async () => {
    const saveModel = vi.spyOn(engine, 'saveModel');
    const model = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-save-step-params-existing',
      use: AdminLayoutMenuItemModel,
      props: {
        route: createRoute(),
      },
    });

    await model.saveStepParams();

    expect(saveModel).not.toHaveBeenCalled();
  });

  it('should persist admin layout menu instance flows through flowEngine.saveModel', async () => {
    const saveModel = vi.spyOn(engine, 'saveModel').mockResolvedValue(undefined as any);
    const model = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-save-step-params-with-instance-flow',
      use: AdminLayoutMenuItemModel,
      props: {
        route: createRoute(),
      },
      flowRegistry: {
        beforeRender: {
          title: 'Before render',
          steps: {},
        },
      },
    });

    model.flowRegistry.removeFlow('beforeRender');

    await model.saveStepParams();

    expect(saveModel).toHaveBeenCalledTimes(1);
    expect(saveModel).toHaveBeenCalledWith(model, { onlyStepParams: true });
  });

  it('should hydrate persisted instance flows for admin layout menu models', async () => {
    engine.context.defineProperty('flowSettingsEnabled', {
      value: true,
    });
    engine.setModelRepository({
      findOne: vi.fn().mockResolvedValue({
        uid: 'menu-item-page-1',
        use: 'AdminLayoutMenuItemModel',
        stepParams: {
          beforeRender: {
            edit: {
              title: 'Persisted flow',
            },
          },
        },
        flowRegistry: {
          beforeRender: {
            title: 'Before render',
            steps: {},
          },
        },
      }),
    } as any);

    const rerenderSpy = vi.spyOn(AdminLayoutMenuItemModel.prototype, 'rerender').mockResolvedValue(undefined as any);

    const model = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-page-1',
      use: AdminLayoutMenuItemModel,
      props: {
        route: createRoute(),
      },
    });

    await waitFor(() => {
      expect(model.getFlow('beforeRender')).toBeDefined();
      expect(model.getStepParams('beforeRender', 'edit')).toMatchObject({
        title: 'Persisted flow',
      });
    });

    expect(rerenderSpy).toHaveBeenCalledTimes(1);
  });

  it('should not hydrate persisted instance flows for admin layout menu models in runtime mode when route is not marked', async () => {
    const findOne = vi.fn().mockResolvedValue({
      uid: 'menu-item-page-1',
      flowRegistry: {
        beforeRender: {
          title: 'Before render',
          steps: {},
        },
      },
    });

    engine.setModelRepository({ findOne } as any);

    engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-page-1',
      use: AdminLayoutMenuItemModel,
      props: {
        route: createRoute(),
      },
    });

    await waitFor(() => {
      expect(findOne).not.toHaveBeenCalled();
    });
  });

  it('should hydrate persisted instance flows in runtime mode when route is marked and rerender beforeRender flow', async () => {
    const findOne = vi.fn().mockResolvedValue({
      uid: 'menu-item-page-1',
      stepParams: {
        beforeRender: {
          edit: {
            title: 'Persisted flow',
          },
        },
      },
      flowRegistry: {
        beforeRender: {
          title: 'Before render',
          steps: {},
        },
      },
    });
    const rerenderSpy = vi.spyOn(AdminLayoutMenuItemModel.prototype, 'rerender').mockResolvedValue(undefined as any);

    engine.setModelRepository({ findOne } as any);

    const model = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-page-1',
      use: AdminLayoutMenuItemModel,
      props: {
        route: createRoute({
          options: {
            hasPersistedMenuInstanceFlow: true,
          },
        }),
      },
    });

    await waitFor(() => {
      expect(findOne).toHaveBeenCalledWith({ uid: 'menu-item-page-1' });
      expect(model.getFlow('beforeRender')).toBeDefined();
      expect(model.getStepParams('beforeRender', 'edit')).toMatchObject({
        title: 'Persisted flow',
      });
    });

    expect(rerenderSpy).toHaveBeenCalledTimes(1);
  });

  it('should write route persisted flag when first instance flow is added', async () => {
    const saveModel = vi.spyOn(engine, 'saveModel').mockResolvedValue(undefined as any);
    const updateRoute = vi.fn().mockResolvedValue(undefined);
    engine.context.routeRepository.updateRoute = updateRoute;

    const model = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-first-instance-flow',
      use: AdminLayoutMenuItemModel,
      props: {
        route: createRoute(),
      },
    });

    model.flowRegistry.addFlow('beforeRender', {
      title: 'Before render',
      steps: {},
    });

    await model.saveStepParams();

    expect(saveModel).toHaveBeenCalledWith(model, { onlyStepParams: true });
    expect(updateRoute).toHaveBeenCalledTimes(1);
    expect(updateRoute).toHaveBeenCalledWith(1, {
      options: {
        hasPersistedMenuInstanceFlow: true,
      },
    });
  });

  it('should keep route persisted flag unchanged when only step params change', async () => {
    const saveModel = vi.spyOn(engine, 'saveModel').mockResolvedValue(undefined as any);
    const updateRoute = vi.fn().mockResolvedValue(undefined);
    engine.context.routeRepository.updateRoute = updateRoute;

    const model = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-step-params-only',
      use: AdminLayoutMenuItemModel,
      props: {
        route: createRoute({
          options: {
            hasPersistedMenuInstanceFlow: true,
          },
        }),
      },
      flowRegistry: {
        beforeRender: {
          title: 'Before render',
          steps: {},
        },
      },
    });

    model.setStepParams('beforeRender', 'edit', {
      title: 'Updated params',
    });

    await model.saveStepParams();

    expect(saveModel).toHaveBeenCalledWith(model, { onlyStepParams: true });
    expect(updateRoute).not.toHaveBeenCalled();
  });

  it('should preserve persisted flow flag when updating normal menu options', async () => {
    const updateRoute = vi.fn().mockResolvedValue(undefined);
    engine.context.routeRepository.updateRoute = updateRoute;

    const model = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-link-edit',
      use: AdminLayoutMenuItemModel,
      props: {
        route: createRoute({
          type: NocoBaseDesktopRouteType.link,
          options: {
            hasPersistedMenuInstanceFlow: true,
            href: 'https://old.example.com',
          },
        }),
      },
    });

    const menuSettingsFlow = AdminLayoutMenuItemModel.globalFlowRegistry.getFlow('menuSettings');
    await menuSettingsFlow?.steps?.edit?.beforeParamsSave?.(
      { model } as any,
      {
        title: 'Docs',
        href: 'https://www.nocobase.com',
        params: [{ name: 'from', value: 'admin' }],
        openInNewWindow: true,
      },
      {},
    );

    expect(updateRoute).toHaveBeenCalledWith(1, {
      title: 'Docs',
      icon: undefined,
      options: {
        hasPersistedMenuInstanceFlow: true,
        href: 'https://www.nocobase.com',
        params: [{ name: 'from', value: 'admin' }],
        openInNewWindow: true,
      },
    });
  });

  it('should clear route persisted flag after deleting the last instance flow and stop runtime hydrate afterwards', async () => {
    const saveModel = vi.spyOn(engine, 'saveModel').mockResolvedValue(undefined as any);
    const updateRoute = vi.fn().mockResolvedValue(undefined);
    const destroy = vi.fn().mockResolvedValue(true);
    const findOne = vi.fn().mockResolvedValue({
      uid: 'menu-item-runtime-after-clear',
      flowRegistry: {
        beforeRender: {
          title: 'Before render',
          steps: {},
        },
      },
    });

    engine.context.routeRepository.updateRoute = updateRoute;
    engine.setModelRepository({ destroy } as any);

    const model = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-last-instance-flow',
      use: AdminLayoutMenuItemModel,
      props: {
        route: createRoute({
          options: {
            hasPersistedMenuInstanceFlow: true,
          },
        }),
      },
      flowRegistry: {
        beforeRender: {
          title: 'Before render',
          steps: {},
        },
      },
    });

    model.flowRegistry.removeFlow('beforeRender');
    await model.saveStepParams();

    expect(saveModel).not.toHaveBeenCalled();
    expect(destroy).toHaveBeenCalledWith('menu-item-last-instance-flow');
    expect(updateRoute).toHaveBeenCalledWith(1, {
      options: undefined,
    });

    engine.setModelRepository({ findOne } as any);

    const runtimeModel = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-runtime-after-clear',
      use: AdminLayoutMenuItemModel,
      props: {
        route: createRoute(),
      },
    });

    await waitFor(() => {
      expect(runtimeModel.getFlow('beforeRender')).toBeUndefined();
      expect(findOne).not.toHaveBeenCalledWith({ uid: 'menu-item-runtime-after-clear' });
    });
  });

  it('should not hydrate deleted persisted menu flows when reopening in config mode', async () => {
    const updateRoute = vi.fn().mockResolvedValue(undefined);
    const save = vi.fn().mockResolvedValue(undefined);
    const destroy = vi.fn().mockImplementation(async (uid: string) => {
      persistedModels.delete(uid);
      return true;
    });
    const findOne = vi.fn().mockImplementation(async ({ uid }) => persistedModels.get(uid) || null);
    const persistedModels = new Map<string, any>([
      [
        'menu-item-config-reopen',
        {
          uid: 'menu-item-config-reopen',
          flowRegistry: {
            beforeRender: {
              title: 'Before render',
              steps: {},
            },
          },
        },
      ],
    ]);

    engine.context.defineProperty('flowSettingsEnabled', {
      value: true,
    });
    engine.context.routeRepository.updateRoute = updateRoute;
    engine.setModelRepository({ findOne, save, destroy } as any);

    const model = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-config-reopen',
      use: AdminLayoutMenuItemModel,
      props: {
        route: createRoute({
          options: {
            hasPersistedMenuInstanceFlow: true,
          },
        }),
      },
      flowRegistry: {
        beforeRender: {
          title: 'Before render',
          steps: {},
        },
      },
    });

    await waitFor(() => {
      expect(model.getFlow('beforeRender')).toBeDefined();
    });

    model.flowRegistry.removeFlow('beforeRender');
    await model.saveStepParams();

    expect(save).not.toHaveBeenCalled();
    expect(destroy).toHaveBeenCalledWith('menu-item-config-reopen');
    expect(updateRoute).toHaveBeenCalledWith(1, {
      options: undefined,
    });

    findOne.mockClear();
    engine.removeModelWithSubModels('menu-item-config-reopen');

    const reopenedModel = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-config-reopen',
      use: AdminLayoutMenuItemModel,
      props: {
        route: createRoute(),
      },
    });

    await waitFor(() => {
      expect(findOne).toHaveBeenCalledWith({ uid: 'menu-item-config-reopen' });
      expect(reopenedModel.getFlow('beforeRender')).toBeUndefined();
    });
  });

  it('should hydrate only marked menus in mixed runtime menu scenarios', async () => {
    const findOne = vi.fn().mockImplementation(async ({ uid }) => ({
      uid,
      flowRegistry: {
        beforeRender: {
          title: `Flow for ${uid}`,
          steps: {},
        },
      },
    }));

    engine.setModelRepository({ findOne } as any);

    engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-unmarked',
      use: AdminLayoutMenuItemModel,
      props: {
        route: createRoute({ id: 11, schemaUid: 'page-11' }),
      },
    });
    const markedModel = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-marked',
      use: AdminLayoutMenuItemModel,
      props: {
        route: createRoute({
          id: 12,
          schemaUid: 'page-12',
          options: {
            hasPersistedMenuInstanceFlow: true,
          },
        }),
      },
    });

    await waitFor(() => {
      expect(findOne).toHaveBeenCalledTimes(1);
      expect(findOne).toHaveBeenCalledWith({ uid: 'menu-item-marked' });
      expect(markedModel.getFlow('beforeRender')).toBeDefined();
    });
  });

  it('should expose insert steps and only show insert inner for groups', async () => {
    const groupModel = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-group',
      use: AdminLayoutMenuItemModel,
      props: {
        route: {
          id: 1,
          title: 'Group 1',
          schemaUid: 'group-1',
          type: NocoBaseDesktopRouteType.group,
        },
      },
    });
    const pageModel = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-page',
      use: AdminLayoutMenuItemModel,
      props: {
        route: {
          id: 2,
          title: 'Page 2',
          schemaUid: 'page-2',
          type: NocoBaseDesktopRouteType.page,
        },
      },
    });

    const menuSettingsFlow = AdminLayoutMenuItemModel.globalFlowRegistry.getFlow('menuSettings');
    const insertBeforeUiSchema = menuSettingsFlow?.steps?.insertBefore?.uiSchema as
      | ((ctx: any) => Promise<any>)
      | undefined;
    const insertBeforeDefaultParams = menuSettingsFlow?.steps?.insertBefore?.defaultParams as
      | ((ctx: any) => Promise<any>)
      | undefined;
    const insertInnerHide = menuSettingsFlow?.steps?.insertInner?.hideInSettings as
      | ((ctx: any) => Promise<boolean>)
      | undefined;
    const schema = await insertBeforeUiSchema?.({ model: groupModel, t: (text) => text });
    const defaultParams = await insertBeforeDefaultParams?.({ model: groupModel, t: (text) => text });

    expect(defaultParams?.menuType).toBe('flowPage');
    expect(schema?.menuType?.['x-component']).toBe('Radio.Group');
    expect(schema?.menuType?.enum).toEqual([
      { label: 'Group', value: 'group' },
      { label: 'Page', value: 'flowPage' },
      { label: 'Link', value: 'link' },
    ]);
    expect(schema?.href?.['x-reactions']).toMatchObject({
      dependencies: ['menuType'],
    });
    await expect(insertInnerHide?.({ model: groupModel })).resolves.toBe(false);
    await expect(insertInnerHide?.({ model: pageModel })).resolves.toBe(true);
  });

  it('should delete current route and navigate to sibling route', async () => {
    const deleteRoute = vi.fn().mockResolvedValue(undefined);
    const removeSchema = vi.fn().mockResolvedValue(undefined);
    const navigate = vi.fn();
    const assign = vi.fn();

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        assign,
      },
    });
    engine.context.routeRepository.deleteRoute = deleteRoute;
    engine.context.routeRepository.listAccessible = () => [
      {
        id: 1,
        title: 'Current page',
        schemaUid: 'current-page',
        type: NocoBaseDesktopRouteType.page,
      },
      {
        id: 2,
        title: 'Next page',
        schemaUid: 'next-page',
        type: NocoBaseDesktopRouteType.page,
      },
    ];
    engine.context.api.resource = vi.fn(() => ({
      'remove/current-page': removeSchema,
    }));
    engine.context.router.navigate = navigate;

    const model = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-delete',
      use: AdminLayoutMenuItemModel,
      props: {
        route: {
          id: 1,
          title: 'Current page',
          schemaUid: 'current-page',
          type: NocoBaseDesktopRouteType.page,
        },
      },
    });

    await model.destroy();

    expect(deleteRoute).toHaveBeenCalledWith(1);
    expect(removeSchema).not.toHaveBeenCalled();
    expect(assign).toHaveBeenCalledWith('/apps/demo/admin/next-page');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('should match current route with router basename before navigating away after delete', async () => {
    const deleteRoute = vi.fn().mockResolvedValue(undefined);
    const removeSchema = vi.fn().mockResolvedValue(undefined);
    const navigate = vi.fn();
    const assign = vi.fn();

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        assign,
      },
    });
    engine.context.routeRepository.deleteRoute = deleteRoute;
    engine.context.routeRepository.listAccessible = () => [
      {
        id: 1,
        title: 'Current page',
        schemaUid: 'current-page',
        type: NocoBaseDesktopRouteType.page,
      },
      {
        id: 2,
        title: 'Next page',
        schemaUid: 'next-page',
        type: NocoBaseDesktopRouteType.page,
      },
    ];
    engine.context.api.resource = vi.fn(() => ({
      'remove/current-page': removeSchema,
    }));
    engine.context.location.pathname = '/apps/demo/admin/current-page';
    engine.context.defineProperty('router', {
      value: {
        basename: '/apps/demo',
        navigate,
      },
    });

    const model = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-delete-with-basename',
      use: AdminLayoutMenuItemModel,
      props: {
        route: {
          id: 1,
          title: 'Current page',
          schemaUid: 'current-page',
          type: NocoBaseDesktopRouteType.page,
        },
      },
    });

    await model.destroy();

    expect(deleteRoute).toHaveBeenCalledWith(1);
    expect(removeSchema).not.toHaveBeenCalled();
    expect(assign).toHaveBeenCalledWith('/apps/demo/admin/next-page');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('should reject inner move when target is not a group', async () => {
    const moveRoute = vi.fn().mockResolvedValue(undefined);
    engine.context.routeRepository.moveRoute = moveRoute;

    const model = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-invalid-inner-target',
      use: AdminLayoutMenuItemModel,
      props: {
        route: {
          id: 1,
          title: 'Page 1',
          schemaUid: 'page-1',
          type: NocoBaseDesktopRouteType.page,
        },
      },
    });

    await expect(model.moveMenuRoute('2||page', 'beforeEnd')).rejects.toThrow('Only groups support inner moves');
    expect(moveRoute).not.toHaveBeenCalled();
  });

  it('should only expose inner position for group targets and disable self-inner', () => {
    expect(getAdminLayoutMenuMovePositionOptions(undefined, 1, (text) => text)).toEqual([
      { label: 'Before', value: 'beforeBegin' },
      { label: 'After', value: 'afterEnd' },
    ]);

    expect(getAdminLayoutMenuMovePositionOptions('2||group', 1, (text) => text)).toEqual([
      { label: 'Before', value: 'beforeBegin' },
      { label: 'After', value: 'afterEnd' },
      { label: 'Inner', value: 'beforeEnd', disabled: false },
    ]);

    expect(getAdminLayoutMenuMovePositionOptions('1||group', 1, (text) => text)).toEqual([
      { label: 'Before', value: 'beforeBegin' },
      { label: 'After', value: 'afterEnd' },
      { label: 'Inner', value: 'beforeEnd', disabled: true },
    ]);
  });

  it('should compile variable-backed route titles in move-to tree', async () => {
    const model = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-move-tree',
      use: AdminLayoutMenuItemModel,
      props: {
        route: {
          id: 1,
          title: 'Page 1',
          schemaUid: 'page-1',
          type: NocoBaseDesktopRouteType.page,
        },
      },
    });

    const menuSettingsFlow = AdminLayoutMenuItemModel.globalFlowRegistry.getFlow('menuSettings');
    const moveToUiSchema = menuSettingsFlow?.steps?.moveTo?.uiSchema as ((ctx: any) => Promise<any>) | undefined;
    const resolveJsonTemplate = vi.fn(async () => 'Translated title');
    const schema = await moveToUiSchema?.({
      model,
      t: (text) => text,
      routeRepository: {
        listAccessible: () => [
          {
            id: 2,
            title: '{{route.title}}',
            schemaUid: 'page-2',
            type: NocoBaseDesktopRouteType.page,
          },
        ],
      },
      resolveJsonTemplate,
    });

    expect(resolveJsonTemplate).toHaveBeenCalledWith('{{route.title}}');
    expect(schema?.target?.enum).toEqual([
      {
        label: 'Translated title',
        value: '2||page',
        children: undefined,
      },
    ]);
  });

  it('should reject moving a group inside itself', async () => {
    const moveRoute = vi.fn().mockResolvedValue(undefined);
    engine.context.routeRepository.moveRoute = moveRoute;

    const model = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-invalid-inner-self',
      use: AdminLayoutMenuItemModel,
      props: {
        route: {
          id: 1,
          title: 'Group 1',
          schemaUid: 'group-1',
          type: NocoBaseDesktopRouteType.group,
        },
      },
    });

    await expect(model.moveMenuRoute('1||group', 'beforeEnd')).rejects.toThrow(
      'A menu group cannot be moved inside itself',
    );
    expect(moveRoute).not.toHaveBeenCalled();
  });

  it('should refresh routes when insert move fails after route creation', async () => {
    const createRoute = vi.fn().mockResolvedValue({
      data: {
        data: {
          id: 99,
        },
      },
    });
    const moveRoute = vi.fn().mockRejectedValue(new Error('move failed'));
    const refreshAccessible = vi.fn().mockResolvedValue(undefined);

    engine.context.routeRepository.createRoute = createRoute;
    engine.context.routeRepository.moveRoute = moveRoute;
    engine.context.routeRepository.refreshAccessible = refreshAccessible;

    const model = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'menu-item-insert-refresh',
      use: AdminLayoutMenuItemModel,
      props: {
        route: {
          id: 1,
          title: 'Page 1',
          schemaUid: 'page-1',
          parentId: 10,
          type: NocoBaseDesktopRouteType.page,
        },
      },
    });

    await expect(
      model.createRouteForInsert(
        {
          type: NocoBaseDesktopRouteType.link,
          title: 'Link',
          schemaUid: 'link-99',
        },
        'beforeBegin',
      ),
    ).rejects.toThrow('move failed');

    expect(createRoute).toHaveBeenCalled();
    expect(moveRoute).toHaveBeenCalled();
    expect(refreshAccessible).toHaveBeenCalledTimes(1);
  });

  it('should use parsed url for same-window link navigation', async () => {
    await openAdminLayoutMenuLink({
      context: engine.context as any,
      href: 'https://www.nocobase.com/docs',
      params: [{ name: 'from', value: 'admin' }],
      openInNewWindow: false,
      isMobile: false,
      closeMobileMenu: vi.fn(),
      navigate: navigateMock,
      basenameOfCurrentRouter: '/apps/demo',
    });

    expect(window.open).toHaveBeenCalledWith('https://www.nocobase.com/docs?from=admin', '_self');
  });

  it('should open parsed link url with noopener and noreferrer', async () => {
    await openAdminLayoutMenuLink({
      context: engine.context as any,
      href: 'https://www.nocobase.com/docs',
      params: [{ name: 'from', value: 'admin' }],
      openInNewWindow: true,
      isMobile: false,
      closeMobileMenu: vi.fn(),
      navigate: navigateMock,
      basenameOfCurrentRouter: '/apps/demo',
    });

    expect(window.open).toHaveBeenCalledWith(
      'https://www.nocobase.com/docs?from=admin',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('should resolve sibling move options for non-group drag target', () => {
    const activeModel = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'drag-source-page',
      use: AdminLayoutMenuItemModel,
      props: {
        route: {
          id: 1,
          title: 'Page 1',
          schemaUid: 'page-1',
          type: NocoBaseDesktopRouteType.page,
        },
      },
    });
    const overModel = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'drag-target-page',
      use: AdminLayoutMenuItemModel,
      props: {
        route: {
          id: 2,
          title: 'Page 2',
          schemaUid: 'page-2',
          type: NocoBaseDesktopRouteType.page,
        },
      },
    });

    expect(resolveAdminLayoutMenuDragMoveOptions(activeModel, overModel)).toEqual({
      sourceId: 1,
      targetId: 2,
      sortField: 'sort',
    });
  });

  it('should ignore drag end events without active or over ids', () => {
    const getModel = vi.fn();

    expect(
      resolveAdminLayoutMenuDragMoveOptionsFromEvent({ getModel } as any, {
        active: { id: 'drag-source-page' },
        over: null,
      }),
    ).toBeUndefined();
    expect(
      resolveAdminLayoutMenuDragMoveOptionsFromEvent({ getModel } as any, {
        active: undefined,
        over: { id: 'drag-target-page' },
      }),
    ).toBeUndefined();
    expect(getModel).not.toHaveBeenCalled();
  });

  it('should keep page drag on group target as sibling reorder', () => {
    const activeModel = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'drag-source-page-into-group',
      use: AdminLayoutMenuItemModel,
      props: {
        route: {
          id: 1,
          title: 'Page 1',
          schemaUid: 'page-1',
          type: NocoBaseDesktopRouteType.page,
        },
      },
    });
    const overModel = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'drag-target-group',
      use: AdminLayoutMenuItemModel,
      props: {
        route: {
          id: 10,
          title: 'Group 1',
          schemaUid: 'group-1',
          type: NocoBaseDesktopRouteType.group,
        },
      },
    });

    expect(resolveAdminLayoutMenuDragMoveOptions(activeModel, overModel)).toEqual({
      sourceId: 1,
      targetId: 10,
      sortField: 'sort',
    });
  });

  it('should keep group drag on group target as sibling reorder', () => {
    const activeModel = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'drag-source-group',
      use: AdminLayoutMenuItemModel,
      props: {
        route: {
          id: 1,
          title: 'Group 1',
          schemaUid: 'group-1',
          type: NocoBaseDesktopRouteType.group,
        },
      },
    });
    const overModel = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'drag-target-group-2',
      use: AdminLayoutMenuItemModel,
      props: {
        route: {
          id: 2,
          title: 'Group 2',
          schemaUid: 'group-2',
          type: NocoBaseDesktopRouteType.group,
        },
      },
    });

    expect(resolveAdminLayoutMenuDragMoveOptions(activeModel, overModel)).toEqual({
      sourceId: 1,
      targetId: 2,
      sortField: 'sort',
    });
  });
});

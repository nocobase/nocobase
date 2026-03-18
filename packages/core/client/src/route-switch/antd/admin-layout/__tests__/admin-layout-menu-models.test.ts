/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowEngine } from '@nocobase/flow-engine';
import { observer } from '@nocobase/flow-engine';
import { NocoBaseDesktopRouteType } from '../../../../admin-shell/route-types';
import {
  AdminLayoutMenuItemModel,
  AdminLayoutMenuTreeModel,
  resolveAdminLayoutMenuDragMoveOptions,
} from '../AdminLayoutMenuModels';

describe('AdminLayoutMenuTreeModel', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine();
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
      },
    });
    engine.context.defineProperty('app', {
      value: {
        components: {},
        scopes: {},
      },
    });
  });

  it('should sync route tree into menu subModels and cleanup stale branches', () => {
    const menuTree = engine.createModel<AdminLayoutMenuTreeModel>({
      uid: 'admin-layout-menu',
      use: AdminLayoutMenuTreeModel,
    });

    menuTree.syncRoutes([
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

    expect(menuTree.subModels.items).toHaveLength(2);
    expect(menuTree.subModels.items?.[0]).toBeInstanceOf(AdminLayoutMenuItemModel);
    expect(menuTree.subModels.items?.[0].subModels.items).toHaveLength(1);
    expect(menuTree.subModels.items?.[0].subModels.items?.[0].props.route).toMatchObject({
      title: 'Page 1',
      schemaUid: 'page-1',
    });

    const staleGroupUid = menuTree.subModels.items?.[0].uid;

    menuTree.syncRoutes([
      {
        id: 2,
        title: 'Link',
        type: NocoBaseDesktopRouteType.link,
      },
    ]);

    expect(menuTree.subModels.items).toHaveLength(1);
    expect(menuTree.subModels.items?.[0].props.route).toMatchObject({
      title: 'Link',
      type: NocoBaseDesktopRouteType.link,
    });
    expect(engine.getModel(staleGroupUid)).toBeUndefined();
  });

  it('should generate ProLayout route tree from menu models', () => {
    const menuTree = engine.createModel<AdminLayoutMenuTreeModel>({
      uid: 'admin-layout-menu',
      use: AdminLayoutMenuTreeModel,
    });

    menuTree.syncRoutes([
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

    const route = menuTree.toProLayoutRoute({
      designable: false,
      isMobile: false,
      t: (title) => title,
    });

    expect(route.path).toBe('/');
    expect(route.children).toHaveLength(2);
    expect(route.children[0].path).toBe('/admin/1');
    expect(route.children[0].redirect).toBe('/admin/page-1');
    expect(route.children[0]._depth).toBe(0);
    expect(route.children[0]._route).toMatchObject({ id: 1, type: NocoBaseDesktopRouteType.group });
    expect(route.children[0]._model).toBe(menuTree.subModels.items?.[0]);
    expect(route.children[0].routes).toHaveLength(1);
    expect(route.children[0].routes?.[0].path).toBe('/admin/page-1');
    expect(route.children[0].routes?.[0].redirect).toBe('/admin/page-1');
    expect(route.children[0].routes?.[0]._depth).toBe(1);
    expect(route.children[0].routes?.[0]._route).toMatchObject({
      schemaUid: 'page-1',
      type: NocoBaseDesktopRouteType.page,
    });
    expect(route.children[0].routes?.[0]._model).toBe(menuTree.subModels.items?.[0].subModels.items?.[0]);
    expect(route.children[1].path).toBe('/');
    expect(route.children[1]._depth).toBe(0);
    expect(route.children[1]._route).toMatchObject({ id: 2, type: NocoBaseDesktopRouteType.link });
    expect(route.children[1]._model).toBe(menuTree.subModels.items?.[1]);
  });

  it('should insert designer buttons in expected positions', () => {
    const menuTree = engine.createModel<AdminLayoutMenuTreeModel>({
      uid: 'admin-layout-menu',
      use: AdminLayoutMenuTreeModel,
    });

    menuTree.syncRoutes([
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

    const desktopRoute = menuTree.toProLayoutRoute({
      designable: true,
      isMobile: false,
      t: (title) => title,
    });

    expect(desktopRoute.children[0].key).toBe('x-designer-button');
    expect(React.isValidElement(desktopRoute.children[0].name)).toBe(true);
    expect(desktopRoute.children[1].routes?.[1].key).toBe('x-designer-button');

    const mobileRoute = menuTree.toProLayoutRoute({
      designable: true,
      isMobile: true,
      t: (title) => title,
    });

    expect(mobileRoute.children[mobileRoute.children.length - 1].key).toBe('x-designer-button');
    expect(mobileRoute.children[0].routes?.[1].key).toBe('x-designer-button');
  });

  it('should update ProLayout route result after menu tree sync in observer render', async () => {
    const menuTree = engine.createModel<AdminLayoutMenuTreeModel>({
      uid: 'admin-layout-menu',
      use: AdminLayoutMenuTreeModel,
    });

    const RouteReader = observer(() => {
      const route = menuTree.toProLayoutRoute({
        designable: true,
        isMobile: false,
        t: (title) => title,
      });

      return React.createElement('div', { 'data-testid': 'route-length' }, String(route.children.length));
    });

    render(React.createElement(RouteReader));

    expect(screen.getByTestId('route-length').textContent).toBe('1');

    act(() => {
      menuTree.syncRoutes([
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

  it('should expose nested insert actions and only show insert inner for groups', async () => {
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

    const groupExtras = await AdminLayoutMenuItemModel.getExtraMenuItems(groupModel, (text) => text);
    const pageExtras = await AdminLayoutMenuItemModel.getExtraMenuItems(pageModel, (text) => text);

    const insertBefore = groupExtras.find((item) => item.key === 'menu-insert-before');
    const insertInner = groupExtras.find((item) => item.key === 'menu-insert-inner');

    expect(insertBefore?.children).toHaveLength(4);
    expect(insertInner?.children).toHaveLength(4);
    expect(pageExtras.some((item) => item.key === 'menu-insert-inner')).toBe(false);
  });

  it('should delete current route and navigate to sibling route', async () => {
    const deleteRoute = vi.fn().mockResolvedValue(undefined);
    const removeSchema = vi.fn().mockResolvedValue(undefined);
    const navigate = vi.fn();

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
    expect(removeSchema).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/admin/next-page');
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

  it('should move page into group when drag target is a group', () => {
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
      targetScope: {
        parentId: 10,
      },
      sortField: 'sort',
      method: 'prepend',
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

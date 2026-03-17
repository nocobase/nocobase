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
import { beforeEach, describe, expect, it } from 'vitest';
import { FlowEngine } from '@nocobase/flow-engine';
import { observer } from '@nocobase/flow-engine';
import { NocoBaseDesktopRouteType } from '../../../../admin-shell/route-types';
import { AdminLayoutMenuItemModel, AdminLayoutMenuTreeModel } from '../AdminLayoutMenuModels';

describe('AdminLayoutMenuTreeModel', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine();
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
});

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
import { AdminLayoutModel } from '../AdminLayoutModel';
import {
  AdminLayoutMenuItemModel,
  getAdminLayoutMenuMovePositionOptions,
  resolveAdminLayoutMenuDragMoveOptionsFromEvent,
  resolveAdminLayoutMenuDragMoveOptions,
} from '../AdminLayoutMenuModels';

describe('AdminLayoutModel menu items', () => {
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
    engine.context.defineProperty('t', {
      value: (text) => text,
    });
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
    expect(route.children[0]._depth).toBe(0);
    expect(route.children[0]._route).toMatchObject({ id: 1, type: NocoBaseDesktopRouteType.group });
    expect(route.children[0]._model).toBe(adminLayoutModel.subModels.menuItems?.[0]);
    expect(route.children[0].routes).toHaveLength(1);
    expect(route.children[0].routes?.[0].path).toBe('/admin/page-1');
    expect(route.children[0].routes?.[0].redirect).toBe('/admin/page-1');
    expect(route.children[0].routes?.[0]._depth).toBe(1);
    expect(route.children[0].routes?.[0]._route).toMatchObject({
      schemaUid: 'page-1',
      type: NocoBaseDesktopRouteType.page,
    });
    expect(route.children[0].routes?.[0]._model).toBe(
      adminLayoutModel.subModels.menuItems?.[0].subModels.menuItems?.[0],
    );
    expect(route.children[1].path).toBe('/');
    expect(route.children[1]._depth).toBe(0);
    expect(route.children[1]._route).toMatchObject({ id: 2, type: NocoBaseDesktopRouteType.link });
    expect(route.children[1]._model).toBe(adminLayoutModel.subModels.menuItems?.[1]);
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
    expect(React.isValidElement(desktopRoute.children[0].name)).toBe(true);
    expect(desktopRoute.children[1].routes?.[1].key).toBe('x-designer-button');

    const mobileRoute = adminLayoutModel.toProLayoutRoute({
      designable: true,
      isMobile: true,
      t: (title) => title,
    });

    expect(mobileRoute.children[mobileRoute.children.length - 1].key).toBe('x-designer-button');
    expect(mobileRoute.children[0].routes?.[1].key).toBe('x-designer-button');
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
      useTypedConstant: true,
      changeOnSelect: true,
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
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: '/uiSchemas:insert',
      }),
    );
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
      { label: 'Classic page (v1)', value: 'page' },
      { label: 'Modern page (v2)', value: 'flowPage' },
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

  it('should match current route with router basename before navigating away after delete', async () => {
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
    expect(removeSchema).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/admin/next-page');
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

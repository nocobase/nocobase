/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowEngine } from '@nocobase/flow-engine';
import { AdminLayoutMenuItemModel } from '../AdminLayoutMenuModels';
import { AdminLayoutModelV1 } from '../AdminLayoutModel';
import { NocoBaseDesktopRouteType } from '../route-types';

describe('AdminLayoutMenuItemModel legacy behavior', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine();
    engine.registerModels({
      AdminLayoutModel: AdminLayoutModelV1,
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

  it('should keep legacy insert menu options in client v1', async () => {
    const groupModel = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'legacy-menu-item-group',
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

    const menuSettingsFlow = AdminLayoutMenuItemModel.globalFlowRegistry.getFlow('menuSettings');
    const insertBeforeUiSchema = menuSettingsFlow?.steps?.insertBefore?.uiSchema as
      | ((ctx: any) => Promise<any>)
      | undefined;
    const schema = await insertBeforeUiSchema?.({ model: groupModel, t: (text) => text });

    expect(schema?.menuType?.enum).toEqual([
      { label: 'Group', value: 'group' },
      { label: 'Classic page (v1)', value: 'page' },
      { label: 'Modern page (v2)', value: 'flowPage' },
      { label: 'Link', value: 'link' },
    ]);
  });

  it('should still create flow page menus through uiSchemas insert in client v1', async () => {
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
      uid: 'legacy-flow-page-create',
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

  it('should still remove ui schema when deleting current route in client v1', async () => {
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
      uid: 'legacy-menu-delete',
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
});

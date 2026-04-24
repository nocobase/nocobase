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
import { waitFor } from '@testing-library/react';
import { AdminLayoutMenuItemModel } from '../AdminLayoutMenuModels';
import { AdminLayoutModelV1 } from '../AdminLayoutModel';
import { hydrateLegacyActiveMenuPersistedStateForTest } from '../AdminLayoutComponentV1';
import { resolveAdminLayoutMenuDragMoveOptions } from '../AdminLayoutMenuUtils';
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

  const createRoute = (options?: Partial<import('../route-types').NocoBaseDesktopRoute>) => ({
    id: 1,
    title: 'Page 1',
    schemaUid: 'page-1',
    type: NocoBaseDesktopRouteType.page,
    ...options,
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

  it('should keep page drag on group target as sibling reorder in client v1', () => {
    const activeModel = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'legacy-drag-source-page',
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
      uid: 'legacy-drag-target-group',
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

  it('should hydrate persisted instance flows in runtime mode when route is marked in client v1', async () => {
    const findOne = vi.fn().mockResolvedValue({
      uid: 'legacy-menu-item-runtime-marked',
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
      uid: 'legacy-menu-item-runtime-marked',
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
      expect(findOne).toHaveBeenCalledWith({ uid: 'legacy-menu-item-runtime-marked' });
      expect(model.getFlow('beforeRender')).toBeDefined();
      expect(model.getStepParams('beforeRender', 'edit')).toMatchObject({
        title: 'Persisted flow',
      });
    });

    expect(rerenderSpy).toHaveBeenCalledTimes(1);
  });

  it('should not hydrate unmarked menu flows in runtime mode in client v1', async () => {
    const findOne = vi.fn().mockResolvedValue({
      uid: 'legacy-menu-item-runtime-unmarked',
      flowRegistry: {
        beforeRender: {
          title: 'Before render',
          steps: {},
        },
      },
    });

    engine.setModelRepository({ findOne } as any);

    const model = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'legacy-menu-item-runtime-unmarked',
      use: AdminLayoutMenuItemModel,
      props: {
        route: createRoute(),
      },
    });

    await waitFor(() => {
      expect(findOne).not.toHaveBeenCalled();
      expect(model.getFlow('beforeRender')).toBeUndefined();
    });
  });

  it('should backfill route persisted flag after hydrating legacy persisted menu flow in client v1', async () => {
    const findOne = vi.fn().mockResolvedValue({
      uid: 'legacy-menu-item-backfill',
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
    const updateRoute = vi.fn().mockResolvedValue(undefined);

    engine.context.routeRepository.updateRoute = updateRoute;
    engine.setModelRepository({ findOne } as any);

    const model = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'legacy-menu-item-backfill',
      use: AdminLayoutMenuItemModel,
      props: {
        route: createRoute(),
      },
    });

    await model.hydrateLegacyPersistedStateIfCurrentPath('/admin/page-1');

    expect(findOne).toHaveBeenCalledWith({ uid: 'legacy-menu-item-backfill' });
    expect(model.getFlow('beforeRender')).toBeDefined();
    expect(updateRoute).toHaveBeenCalledWith(1, {
      options: {
        hasPersistedMenuInstanceFlow: true,
      },
    });
    expect(model.getRoute()?.options).toEqual({
      hasPersistedMenuInstanceFlow: true,
    });
  });

  it('should only hydrate legacy persisted state for current matched route in client v1', async () => {
    const findOne = vi.fn().mockImplementation(async ({ uid }) => {
      if (uid !== 'legacy-menu-item-current') {
        return null;
      }

      return {
        uid,
        flowRegistry: {
          beforeRender: {
            title: 'Before render',
            steps: {},
          },
        },
      };
    });
    const updateRoute = vi.fn().mockResolvedValue(undefined);

    engine.context.routeRepository.updateRoute = updateRoute;
    engine.setModelRepository({ findOne } as any);

    const currentModel = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'legacy-menu-item-current',
      use: AdminLayoutMenuItemModel,
      props: {
        route: createRoute({
          id: 1,
          schemaUid: 'page-1',
        }),
      },
    });
    const otherModel = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'legacy-menu-item-other',
      use: AdminLayoutMenuItemModel,
      props: {
        route: createRoute({
          id: 2,
          schemaUid: 'page-2',
        }),
      },
    });

    expect(findOne).not.toHaveBeenCalled();

    expect(await currentModel.hydrateLegacyPersistedStateIfCurrentPath('/admin/page-1')).toBe(true);
    expect(await otherModel.hydrateLegacyPersistedStateIfCurrentPath('/admin/page-1')).toBe(false);

    expect(findOne).toHaveBeenCalledTimes(1);
    expect(findOne).toHaveBeenCalledWith({ uid: 'legacy-menu-item-current' });
    expect(currentModel.getFlow('beforeRender')).toBeDefined();
    expect(otherModel.getFlow('beforeRender')).toBeUndefined();
    expect(updateRoute).toHaveBeenCalledTimes(1);
    expect(updateRoute).toHaveBeenCalledWith(1, {
      options: {
        hasPersistedMenuInstanceFlow: true,
      },
    });
  });

  it('should preserve persisted flow flag when updating menu options in client v1', async () => {
    const updateRoute = vi.fn().mockResolvedValue(undefined);
    engine.context.routeRepository.updateRoute = updateRoute;

    const model = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'legacy-link-edit',
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

  it('should clear route persisted flag and destroy persisted model after deleting last flow in client v1', async () => {
    const saveModel = vi.spyOn(engine, 'saveModel').mockResolvedValue(undefined as any);
    const updateRoute = vi.fn().mockResolvedValue(undefined);
    const destroy = vi.fn().mockResolvedValue(true);

    engine.context.routeRepository.updateRoute = updateRoute;
    engine.setModelRepository({ destroy } as any);

    const model = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'legacy-menu-item-last-flow',
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
    expect(destroy).toHaveBeenCalledWith('legacy-menu-item-last-flow');
    expect(updateRoute).toHaveBeenCalledWith(1, {
      options: undefined,
    });
  });

  it('should lazy hydrate persisted flows when opening settings for unmarked menu in client v1', async () => {
    const findOne = vi.fn().mockResolvedValue({
      uid: 'legacy-menu-item-open-settings',
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
    const open = vi.spyOn(engine.flowSettings, 'open').mockResolvedValue(true as any);
    const rerenderSpy = vi.spyOn(AdminLayoutMenuItemModel.prototype, 'rerender').mockResolvedValue(undefined as any);

    engine.setModelRepository({ findOne } as any);

    const model = engine.createModel<AdminLayoutMenuItemModel>({
      uid: 'legacy-menu-item-open-settings',
      use: AdminLayoutMenuItemModel,
      props: {
        route: createRoute(),
      },
    });

    expect(findOne).not.toHaveBeenCalled();

    await model.openFlowSettings({
      flowKey: 'menuSettings',
      stepKey: 'edit',
    });

    expect(findOne).toHaveBeenCalledWith({ uid: 'legacy-menu-item-open-settings' });
    expect(open).toHaveBeenCalledWith(
      expect.objectContaining({
        model,
        flowKey: 'menuSettings',
        stepKey: 'edit',
      }),
    );
    expect(model.getFlow('beforeRender')).toBeDefined();
    expect(model.getStepParams('beforeRender', 'edit')).toMatchObject({
      title: 'Persisted flow',
    });
    expect(rerenderSpy).toHaveBeenCalledTimes(1);
  });

  it('should hydrate both matched group and child on current legacy branch in client v1', async () => {
    const child = {
      subModels: {},
      hydrateLegacyPersistedStateIfCurrentPath: vi.fn().mockResolvedValue(true),
    };
    const group = {
      subModels: {
        menuItems: [child],
      },
      hydrateLegacyPersistedStateIfCurrentPath: vi.fn().mockResolvedValue(true),
    };
    const sibling = {
      subModels: {},
      hydrateLegacyPersistedStateIfCurrentPath: vi.fn().mockResolvedValue(false),
    };

    await expect(
      hydrateLegacyActiveMenuPersistedStateForTest(
        [group, sibling] as unknown as AdminLayoutMenuItemModel[],
        '/admin/page-1',
      ),
    ).resolves.toBe(true);

    expect(child.hydrateLegacyPersistedStateIfCurrentPath).toHaveBeenCalledWith('/admin/page-1', undefined);
    expect(group.hydrateLegacyPersistedStateIfCurrentPath).toHaveBeenCalledWith('/admin/page-1', undefined);
    expect(sibling.hydrateLegacyPersistedStateIfCurrentPath).not.toHaveBeenCalled();
  });
});

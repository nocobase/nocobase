/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { vi } from 'vitest';

import { FlowSurfacesService } from '../flow-surfaces/service';
import { FlowSurfaceRouteSync } from '../flow-surfaces/route-sync';
import {
  markLightExtensionReferencesOwnerMissingForNodeTree,
  syncLightExtensionReferencesForNodeTree,
} from '../flow-surfaces/light-extension-reference-integration';

describe('flowSurfaces light-extension reference integration', () => {
  it('marks a JS Page reference owner missing before the page model is removed', async () => {
    const transaction = { id: 'trx_destroy_js_page' };
    const remove = vi.fn(async () => undefined);
    const markOwnerMissing = vi.fn(async () => undefined);
    const service = new FlowSurfacesService({} as never);
    Object.defineProperty(service, 'repository', {
      value: {
        findModelById: vi.fn(async () => ({
          uid: 'flow_js_page',
          use: 'JSPageModel',
          subModels: {},
        })),
        remove,
      },
    });
    Object.assign(service as unknown as Record<string, unknown>, {
      removeFlowSqlBindingsForNodeTree: vi.fn(async () => undefined),
      cleanupNodeBindings: vi.fn(async () => undefined),
      clearFlowTemplateUsagesForNodeTree: vi.fn(async () => undefined),
      markLightExtensionReferencesOwnerMissingForNodeTree: markOwnerMissing,
    });

    await (
      service as unknown as {
        removeNodeTreeWithBindings: (uid: string, transaction?: unknown) => Promise<void>;
      }
    ).removeNodeTreeWithBindings('flow_js_page', transaction);

    expect(markOwnerMissing).toHaveBeenCalledWith('flow_js_page', 'flowSurfaces.removeNode', { transaction });
    expect(remove).toHaveBeenCalledWith('flow_js_page', { transaction });
    expect(markOwnerMissing.mock.invocationCallOrder[0]).toBeLessThan(remove.mock.invocationCallOrder[0]);
  });

  it('resolves the light-extension reference provider through plugin manager aliases', async () => {
    const provider = {
      syncFlowModelReferencesForNodeTree: vi.fn(async () => undefined),
      markFlowModelReferencesOwnerMissingForNodeTree: vi.fn(async () => undefined),
    };
    const plugin = {
      app: {
        pm: {
          get: vi.fn((name: string) => (name === 'light-extension' ? provider : null)),
        },
      },
    };

    await syncLightExtensionReferencesForNodeTree(
      plugin,
      {
        rootUid: 'flow_js_block',
        action: 'flowModels.save',
      },
      {
        requestId: 'req_sync_provider',
      },
    );
    await markLightExtensionReferencesOwnerMissingForNodeTree(
      plugin,
      {
        rootUid: 'flow_deleted',
        action: 'flowModels.repository.remove',
      },
      {
        requestId: 'req_mark_provider',
      },
    );

    expect(provider.syncFlowModelReferencesForNodeTree).toHaveBeenCalledWith(
      {
        rootUid: 'flow_js_block',
        action: 'flowModels.save',
      },
      {
        requestId: 'req_sync_provider',
      },
    );
    expect(provider.markFlowModelReferencesOwnerMissingForNodeTree).toHaveBeenCalledWith(
      {
        rootUid: 'flow_deleted',
        action: 'flowModels.repository.remove',
      },
      {
        requestId: 'req_mark_provider',
      },
    );
  });

  it('marks route-backed tab anchor trees before route-sync removes them', async () => {
    const transaction = { id: 'trx_route_sync' };
    const repository = {
      findModelById: vi.fn(async () => ({
        uid: 'tab_anchor',
        subModels: {
          grid: [
            {
              uid: 'grid_child',
            },
          ],
        },
      })),
      findModelByParentId: vi.fn(async () => ({
        uid: 'async_grid_child',
      })),
      remove: vi.fn(async () => undefined),
    };
    const markBeforeRemove = vi.fn(async () => undefined);
    const routeSync = new FlowSurfaceRouteSync(
      {},
      repository as never,
      vi.fn(async () => undefined),
      markBeforeRemove,
    );

    await routeSync.removeRouteAnchorChildren('tab_anchor', transaction);

    expect(markBeforeRemove).toHaveBeenCalledWith('grid_child', transaction);
    expect(markBeforeRemove).toHaveBeenCalledWith('async_grid_child', transaction);
    expect(repository.remove).toHaveBeenCalledWith('grid_child', { transaction });
    expect(repository.remove).toHaveBeenCalledWith('async_grid_child', { transaction });
  });

  it('wires the FlowSurfacesService route-sync remover to the light-extension owner-missing hook', async () => {
    const transaction = { id: 'trx_service_route_sync' };
    const repository = {
      findModelById: vi.fn(async () => ({
        uid: 'tab_anchor',
        subModels: {
          grid: [
            {
              uid: 'grid_child',
            },
          ],
        },
      })),
      findModelByParentId: vi.fn(async () => null),
      remove: vi.fn(async () => undefined),
    };
    const service = new FlowSurfacesService({
      db: {
        getCollection: vi.fn(() => ({
          repository,
        })),
      },
    } as never);
    const markOwnerMissing = vi.fn(async () => undefined);
    Object.assign(service as unknown as Record<string, unknown>, {
      markLightExtensionReferencesOwnerMissingForNodeTree: markOwnerMissing,
    });

    await (
      service as unknown as {
        routeSync: FlowSurfaceRouteSync;
      }
    ).routeSync.removeRouteAnchorChildren('tab_anchor', transaction);

    expect(markOwnerMissing).toHaveBeenCalledWith('grid_child', 'flowSurfaces.routeSync.removeTabAnchorTree', {
      transaction,
    });
    expect(repository.remove).toHaveBeenCalledWith('grid_child', { transaction });
  });

  it('cleans old references and resyncs when saveTemplate replaces a block with the same uid', async () => {
    const transaction = { id: 'trx_template_replace' };
    const service = new FlowSurfacesService({} as never);
    const repository = {
      findModelById: vi.fn(async () => ({
        uid: 'parent_grid',
        subModels: {
          blocks: [
            {
              uid: 'source_block',
            },
          ],
        },
      })),
      remove: vi.fn(async () => undefined),
      upsertModel: vi.fn(async () => 'source_block'),
      attach: vi.fn(async () => undefined),
    };
    const clearUsages = vi.fn(async () => undefined);
    const syncUsages = vi.fn(async () => undefined);
    const markMissing = vi.fn(async () => undefined);
    const syncReferences = vi.fn(async () => undefined);
    Object.defineProperty(service, 'repository', {
      value: repository,
    });
    Object.assign(service as unknown as Record<string, unknown>, {
      clearFlowTemplateUsagesForNodeTree: clearUsages,
      syncFlowTemplateUsagesForNodeTree: syncUsages,
      markLightExtensionReferencesOwnerMissingForNodeTree: markMissing,
      syncLightExtensionReferencesForNodeTree: syncReferences,
    });

    const result = await (
      service as unknown as {
        convertBlockSourceToTemplateReference: (
          sourceNode: Record<string, unknown>,
          template: Record<string, unknown>,
          templateTargetUid: string,
          transaction?: unknown,
        ) => Promise<Record<string, unknown>>;
      }
    ).convertBlockSourceToTemplateReference(
      {
        uid: 'source_block',
        parentId: 'parent_grid',
        subKey: 'blocks',
        subType: 'array',
      },
      {
        uid: 'template_1',
        name: 'Template 1',
        description: 'template',
      },
      'template_target',
      transaction,
    );

    expect(result).toMatchObject({
      uid: 'source_block',
      type: 'block',
    });
    expect(clearUsages).toHaveBeenCalledWith(expect.objectContaining({ uid: 'source_block' }), transaction);
    expect(markMissing).toHaveBeenCalledWith('source_block', 'flowSurfaces.saveTemplate', { transaction });
    expect(repository.remove).toHaveBeenCalledWith('source_block', { transaction });
    expect(repository.upsertModel).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: 'source_block',
        use: 'ReferenceBlockModel',
      }),
      { transaction },
    );
    expect(syncUsages).toHaveBeenCalledWith('source_block', transaction);
    expect(syncReferences).toHaveBeenCalledWith('source_block', 'flowSurfaces.saveTemplate', { transaction });
  });

  it('syncs references for detached popup copies created by convertTemplateToCopy', async () => {
    const transaction = { id: 'trx_convert_popup' };
    const service = new FlowSurfacesService({} as never);
    const syncReferences = vi.fn(async () => undefined);
    Object.defineProperty(service, 'repository', {
      value: {
        findModelById: vi.fn(async () => ({
          uid: 'host_action',
          use: 'ActionModel',
          stepParams: {},
        })),
      },
    });
    Object.assign(service as unknown as Record<string, unknown>, {
      prepareWriteTarget: vi.fn(async () => ({ uid: 'host_action' })),
      resolveTemplateCopySource: vi.fn(async () => ({
        type: 'popup',
        template: {
          uid: 'template_1',
          targetUid: 'template_popup',
        },
        openViewStep: {
          flowKey: 'actionSettings',
          stepKey: 'openView',
          openView: {
            popupTemplateUid: 'template_1',
            popupTemplateMode: 'reference',
          },
        },
      })),
      duplicateDetachedFlowModelTree: vi.fn(async () => ({ uid: 'popup_copy' })),
      ensurePopupSurface: vi.fn(async () => undefined),
      buildPopupTemplateOpenView: vi.fn(() => ({
        uid: 'popup_copy',
        popupTemplateContext: true,
      })),
      cleanupLocalPopupSurfaceForHost: vi.fn(async () => undefined),
      patchFlowSurfaceModelOptions: vi.fn(async () => undefined),
      syncFlowTemplateUsagesForNodeTree: vi.fn(async () => undefined),
      syncLightExtensionReferencesForNodeTree: syncReferences,
    });

    const result = await service.convertTemplateToCopy(
      {
        target: {
          uid: 'host_action',
        },
      },
      {
        transaction,
      },
    );

    expect(result).toMatchObject({
      uid: 'host_action',
      type: 'popup',
      popupUid: 'popup_copy',
    });
    expect(syncReferences).toHaveBeenCalledWith('popup_copy', 'flowSurfaces.convertTemplateToCopy', { transaction });
  });

  it('syncs references for detached popup copies created while normalizing popup template openView', async () => {
    const transaction = { id: 'trx_normalize_popup_copy' };
    const service = new FlowSurfacesService({} as never);
    const syncReferences = vi.fn(async () => undefined);
    Object.assign(service as unknown as Record<string, unknown>, {
      getFlowTemplateOrThrow: vi.fn(async () => ({
        uid: 'template_1',
        targetUid: 'template_popup',
      })),
      assertPopupTemplateCompatibility: vi.fn(async () => undefined),
      duplicateDetachedFlowModelTree: vi.fn(async () => ({ uid: 'popup_copy' })),
      ensurePopupSurface: vi.fn(async () => undefined),
      buildPopupTemplateOpenView: vi.fn(() => ({
        uid: 'popup_copy',
        popupTemplateContext: true,
      })),
      assertOpenViewUidTarget: vi.fn(async () => undefined),
      syncLightExtensionReferencesForNodeTree: syncReferences,
    });

    const normalized = await (
      service as unknown as {
        normalizeOpenView: (
          actionName: string,
          openView: Record<string, unknown>,
          options?: Record<string, unknown>,
        ) => Promise<Record<string, unknown>>;
      }
    ).normalizeOpenView(
      'flowSurfaces.configure',
      {
        template: {
          uid: 'template_1',
          mode: 'copy',
        },
      },
      {
        transaction,
        popupTemplateHostUid: 'host_action',
      },
    );

    expect(normalized).toMatchObject({
      uid: 'popup_copy',
      popupTemplateContext: true,
    });
    expect(syncReferences).toHaveBeenCalledWith('popup_copy', 'flowSurfaces.configure', {
      transaction,
      popupTemplateHostUid: 'host_action',
    });
  });
});

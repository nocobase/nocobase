/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowSurfacesService } from '../flow-surfaces/service';

type FlowModelOptions = Record<string, unknown>;
type RunJsStepParams = {
  jsSettings: {
    runJs: Record<string, unknown>;
  };
};

type FlowModelRecord = {
  get(key: 'options'): FlowModelOptions;
  set(key: 'options', value: FlowModelOptions): void;
  save(options: { transaction?: unknown; hooks: boolean }): Promise<void>;
};

type FlowModelRepositoryHarness = {
  model: {
    findByPk(uid: string, options: { transaction?: unknown }): Promise<FlowModelRecord | null>;
  };
  clearXUidPathCache(uid: string, transaction?: unknown): Promise<void>;
  emitAfterSaveEvent(model: FlowModelRecord, options: { transaction?: unknown }): Promise<void>;
  findModelById(uid: string, options: { transaction?: unknown; includeAsyncNode?: boolean }): Promise<unknown>;
  remove(uid: string, options: { transaction?: unknown }): Promise<void>;
};

type FlowSurfacesReferenceInternals = {
  patchFlowSurfaceModelOptions(values: Record<string, unknown>, options?: { transaction?: unknown }): Promise<void>;
  removeNodeTreeWithBindings(uid: string, transaction?: unknown): Promise<void>;
  removeFlowSqlBindingsForNodeTree(node: unknown, transaction?: unknown): Promise<void>;
  clearFlowTemplateUsagesForNodeTree(uid: string, transaction?: unknown): Promise<void>;
};

function runJsOptions(source: FlowModelOptions) {
  return {
    use: 'JSBlockModel',
    stepParams: {
      jsSettings: {
        runJs: source,
      },
    },
  };
}

function createHarness(initialOptions: FlowModelOptions) {
  let persistedOptions = structuredClone(initialOptions);
  const syncReferences = vi.fn().mockResolvedValue(undefined);
  const markMissing = vi.fn().mockResolvedValue(undefined);
  const model: FlowModelRecord = {
    get: vi.fn(() => structuredClone(persistedOptions)),
    set: vi.fn((_key, value) => {
      persistedOptions = structuredClone(value);
    }),
    save: vi.fn().mockResolvedValue(undefined),
  };
  const repository: FlowModelRepositoryHarness = {
    model: {
      findByPk: vi.fn().mockResolvedValue(model),
    },
    clearXUidPathCache: vi.fn().mockResolvedValue(undefined),
    emitAfterSaveEvent: vi.fn().mockResolvedValue(undefined),
    findModelById: vi.fn().mockResolvedValue({ uid: 'owner-1', use: 'JSBlockModel', subModels: {} }),
    remove: vi.fn().mockResolvedValue(undefined),
  };
  const db = {
    getCollection: vi.fn((name: string) => {
      if (name !== 'flowModels') {
        throw new Error(`Unexpected collection ${name}`);
      }
      return { repository };
    }),
    emitAsync: vi.fn().mockResolvedValue(undefined),
  };
  const plugin = {
    db,
    app: {
      pm: {
        get: vi.fn(() => ({
          syncFlowModelReferencesForNodeTree: syncReferences,
          markFlowModelReferencesOwnerMissingForNodeTree: markMissing,
        })),
      },
    },
  };
  const service = new FlowSurfacesService(plugin as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);

  return {
    service: service as unknown as FlowSurfacesReferenceInternals,
    repository,
    model,
    syncReferences,
    markMissing,
    readOptions: () => structuredClone(persistedOptions),
  };
}

describe('flowSurfaces JS source reference synchronization', () => {
  it('synchronizes reference creation and binding changes from the persisted canonical runJs state', async () => {
    const harness = createHarness(
      runJsOptions({
        code: "ctx.render('fallback');",
        version: 'v2',
      }),
    );
    const transaction = { id: 'transaction-activation' };
    const binding = {
      type: 'light-extension-entry',
      repoId: 'repo_sales',
      entryId: 'entry_sales_v2',
      kind: 'js-block',
    };

    await harness.service.patchFlowSurfaceModelOptions(
      {
        uid: 'owner-1',
        ...runJsOptions({
          code: "ctx.render('fallback');",
          version: 'v2',
          sourceMode: 'light-extension',
          sourceBinding: binding,
          settings: { region: 'APAC' },
        }),
      },
      { transaction },
    );

    expect(harness.readOptions()).toMatchObject(
      runJsOptions({
        sourceMode: 'light-extension',
        sourceBinding: binding,
        settings: { region: 'APAC' },
      }),
    );
    expect(harness.syncReferences).toHaveBeenCalledTimes(1);
    expect(harness.syncReferences).toHaveBeenCalledWith(
      { rootUid: 'owner-1', action: 'flowSurfaces.updateSettings' },
      { transaction, requestSource: 'flowSurfaces' },
    );
    expect(harness.markMissing).not.toHaveBeenCalled();
  });

  it('synchronizes inline transition cleanup but skips unrelated inline code changes', async () => {
    const binding = {
      type: 'light-extension-entry',
      repoId: 'repo_sales',
      entryId: 'entry_sales',
      kind: 'js-block',
    };
    const cleanupHarness = createHarness(
      runJsOptions({
        code: "ctx.render('fallback');",
        version: 'v2',
        sourceMode: 'light-extension',
        sourceBinding: binding,
      }),
    );

    await cleanupHarness.service.patchFlowSurfaceModelOptions({
      uid: 'owner-1',
      ...runJsOptions({
        code: "ctx.render('fallback');",
        version: 'v2',
        sourceMode: 'inline',
      }),
    });

    expect(cleanupHarness.readOptions()).toMatchObject(
      runJsOptions({
        sourceMode: 'inline',
      }),
    );
    expect((cleanupHarness.readOptions().stepParams as RunJsStepParams).jsSettings.runJs).not.toHaveProperty(
      'sourceBinding',
    );
    expect(cleanupHarness.syncReferences).toHaveBeenCalledTimes(1);

    const inlineHarness = createHarness(
      runJsOptions({
        code: "ctx.render('before');",
        version: 'v2',
      }),
    );
    await inlineHarness.service.patchFlowSurfaceModelOptions({
      uid: 'owner-1',
      ...runJsOptions({
        code: "ctx.render('after');",
        version: 'v2',
      }),
    });
    expect(inlineHarness.syncReferences).not.toHaveBeenCalled();
  });

  it('marks the complete owner tree missing before deleting the FlowModel tree', async () => {
    const harness = createHarness(
      runJsOptions({
        sourceMode: 'light-extension',
        sourceBinding: {
          type: 'light-extension-entry',
          repoId: 'repo_sales',
          entryId: 'entry_sales',
          kind: 'js-block',
        },
      }),
    );
    const transaction = { id: 'transaction-delete' };
    vi.spyOn(harness.service, 'removeFlowSqlBindingsForNodeTree').mockResolvedValue(undefined);
    vi.spyOn(harness.service, 'clearFlowTemplateUsagesForNodeTree').mockResolvedValue(undefined);

    await harness.service.removeNodeTreeWithBindings('owner-1', transaction);

    expect(harness.markMissing).toHaveBeenCalledWith(
      { rootUid: 'owner-1', action: 'flowSurfaces.removeNode' },
      { transaction, requestSource: 'flowSurfaces' },
    );
    expect(harness.repository.remove).toHaveBeenCalledWith('owner-1', { transaction });
    expect(harness.markMissing.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(harness.repository.remove).mock.invocationCallOrder[0],
    );
  });
});

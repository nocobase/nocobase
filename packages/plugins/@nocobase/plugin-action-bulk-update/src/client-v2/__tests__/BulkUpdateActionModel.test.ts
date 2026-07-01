/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { BulkUpdateActionModel } from '../BulkUpdateActionModel';

class TestAssignFormModel extends FlowModel {
  private values: Record<string, unknown> = {};

  setAssignedValues(values: Record<string, unknown>) {
    this.values = values || {};
  }

  getAssignedValues() {
    return this.values;
  }
}

type AssignFieldValuesBeforeParamsSave = (
  ctx: { engine: FlowEngine; model: BulkUpdateActionModel },
  params?: { assignedValues?: Record<string, unknown> },
  previousParams?: { assignedValues?: Record<string, unknown> },
) => Promise<void> | void;

function getAssignFieldValuesBeforeParamsSave(action: BulkUpdateActionModel): AssignFieldValuesBeforeParamsSave {
  const step = action.getFlow('assignSettings')?.getStep('assignFieldValues')?.serialize() as unknown as
    | { beforeParamsSave?: AssignFieldValuesBeforeParamsSave }
    | undefined;
  expect(step?.beforeParamsSave).toBeTypeOf('function');
  return step.beforeParamsSave;
}

describe('BulkUpdateActionModel apply action', () => {
  it('exposes collection action metadata and assign form sub model options', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ BulkUpdateActionModel });
    const action = engine.createModel<BulkUpdateActionModel>({
      use: 'BulkUpdateActionModel',
      uid: 'bulk-update-action-meta',
    });
    const createModelOptions = BulkUpdateActionModel.meta?.createModelOptions;

    expect(action.getAclActionName()).toBe('update');
    expect(BulkUpdateActionModel.scene).toBe('collection');
    expect(BulkUpdateActionModel.capabilityActionName).toBe('updateMany');
    expect(action.defaultProps).toMatchObject({
      icon: 'EditOutlined',
    });
    expect(typeof createModelOptions).toBe('function');
    expect(
      createModelOptions?.({
        collection: {
          name: 'posts',
          dataSourceKey: 'main',
        },
      } as never),
    ).toMatchObject({
      subModels: {
        assignForm: {
          async: true,
          use: 'AssignFormModel',
          stepParams: {
            resourceSettings: {
              init: {
                collectionName: 'posts',
                dataSourceKey: 'main',
              },
            },
          },
        },
      },
    });
  });

  it('reuses assignFieldValues step and saves assignedValues from AssignForm', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ BulkUpdateActionModel, AssignFormModel: TestAssignFormModel });
    const action = engine.createModel<BulkUpdateActionModel>({
      use: 'BulkUpdateActionModel',
      uid: 'bulk-update-action',
    });
    const form = engine.createModel<TestAssignFormModel>({
      use: 'AssignFormModel',
      uid: 'bulk-update-assign-form',
      parentId: action.uid,
      subKey: 'assignForm',
    });
    form.setAssignedValues({ status: 'published' });
    action.assignFormUid = form.uid;

    const beforeParamsSave = getAssignFieldValuesBeforeParamsSave(action);

    await beforeParamsSave({ engine, model: action }, {}, {});

    expect(action.getStepParams('assignSettings', 'assignFieldValues')?.assignedValues).toEqual({
      status: 'published',
    });
  });

  it('saves assignedValues from assignForm subModel when assignFormUid is not ready', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ BulkUpdateActionModel, AssignFormModel: TestAssignFormModel });
    const action = engine.createModel<BulkUpdateActionModel>({
      use: 'BulkUpdateActionModel',
      uid: 'bulk-update-action-sub-model',
    });
    const form = engine.createModel<TestAssignFormModel>({
      use: 'AssignFormModel',
      uid: 'bulk-update-assign-form-sub-model',
      parentId: action.uid,
      subKey: 'assignForm',
    });
    form.setAssignedValues({ status: 'draft' });
    action.setSubModel('assignForm', form);

    const beforeParamsSave = getAssignFieldValuesBeforeParamsSave(action);

    await beforeParamsSave({ engine, model: action }, {}, {});

    expect(action.getStepParams('assignSettings', 'assignFieldValues')?.assignedValues).toEqual({
      status: 'draft',
    });
  });

  it('keeps previous assignedValues when AssignForm is unavailable during save', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ BulkUpdateActionModel, AssignFormModel: TestAssignFormModel });
    const action = engine.createModel<BulkUpdateActionModel>({
      use: 'BulkUpdateActionModel',
      uid: 'bulk-update-action-missing-form',
    });
    action.setStepParams('assignSettings', 'assignFieldValues', {});

    const beforeParamsSave = getAssignFieldValuesBeforeParamsSave(action);

    await beforeParamsSave(
      { engine, model: action },
      {},
      {
        assignedValues: { status: 'published' },
      },
    );

    expect(action.getStepParams('assignSettings', 'assignFieldValues')?.assignedValues).toEqual({
      status: 'published',
    });
  });

  it('resets loading when selected records update fails', async () => {
    const engine = new FlowEngine();
    const model = new BulkUpdateActionModel({ uid: 'bulk-update-action', flowEngine: engine } as any);
    const updateError = new Error('update failed');
    const update = vi.fn().mockRejectedValue(updateError);
    const setProps = vi.fn();
    const refresh = vi.fn();

    const ctx: any = {
      model: {
        getStepParams: vi.fn((_flowKey: string, stepKey: string) => {
          if (stepKey === 'confirm') {
            return { enable: false };
          }
          if (stepKey === 'updateMode') {
            return { value: 'selected' };
          }
          return undefined;
        }),
        setProps,
      },
      runAction: vi.fn(async () => {}),
      collection: {
        name: 'users',
        dataSourceKey: 'main',
        filterTargetKey: 'id',
        getPrimaryKey: () => 'id',
        getFilterByTK: (record: any) => record.id,
      },
      blockModel: {
        resource: {
          getSelectedRows: () => [{ id: 1 }],
          refresh,
        },
      },
      api: {
        resource: vi.fn(() => ({ update })),
      },
      message: {
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
      },
      t: (value: string) => value,
    };

    const handler = model.getFlow('apply')?.getStep('apply')?.serialize().handler;

    await expect(handler(ctx, { assignedValues: { nickname: 'Nick' } })).rejects.toThrow(updateError);

    expect(update).toHaveBeenCalled();
    expect(setProps).toHaveBeenNthCalledWith(1, { loading: true });
    expect(setProps).toHaveBeenNthCalledWith(2, { loading: false });
    expect(refresh).not.toHaveBeenCalled();
    expect(ctx.message.success).not.toHaveBeenCalled();
  });

  it('returns saved assigned values as apply default params', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ BulkUpdateActionModel });
    const action = engine.createModel<BulkUpdateActionModel>({
      use: 'BulkUpdateActionModel',
      uid: 'bulk-update-action-default-params',
    });
    action.setStepParams('assignSettings', 'assignFieldValues', {
      assignedValues: {
        status: 'published',
      },
    });
    const defaultParams = action.getFlow('apply')?.getStep('apply')?.serialize().defaultParams;

    await expect(defaultParams?.({ model: action } as never)).resolves.toEqual({
      assignedValues: {
        status: 'published',
      },
    });
  });

  it('updates selected records and refreshes the source block', async () => {
    const engine = new FlowEngine();
    const model = new BulkUpdateActionModel({ uid: 'bulk-update-selected-action', flowEngine: engine } as never);
    const update = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const refresh = vi.fn();
    const setProps = vi.fn();
    const handler = model.getFlow('apply')?.getStep('apply')?.serialize().handler;
    const ctx = {
      model: {
        getStepParams: vi.fn((_flowKey: string, stepKey: string) => {
          if (stepKey === 'confirm') {
            return { enable: true, title: 'Confirm' };
          }
          if (stepKey === 'updateMode') {
            return { value: 'selected' };
          }
          return undefined;
        }),
        setProps,
      },
      runAction: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
      collection: {
        name: 'posts',
        dataSourceKey: 'main',
        filterTargetKey: 'uid',
        getPrimaryKey: vi.fn(() => 'id'),
        getFilterByTK: vi.fn((record: { uid?: string | null }) => record.uid),
      },
      blockModel: {
        resource: {
          getSelectedRows: vi.fn(() => [{ uid: 'p1' }, { uid: null }, { uid: 'p2' }]),
          refresh,
        },
      },
      api: {
        resource: vi.fn(() => ({ update })),
      },
      message: {
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
      },
      t: (value: string) => value,
    };

    await handler?.(ctx as never, { assignedValues: { status: 'published' } } as never);

    expect(ctx.runAction).toHaveBeenCalledWith('confirm', { enable: true, title: 'Confirm' });
    expect(ctx.api.resource).toHaveBeenCalledWith('posts', null, {
      'x-data-source': 'main',
    });
    expect(update).toHaveBeenCalledWith({
      filter: {
        $and: [
          {
            uid: {
              $in: ['p1', 'p2'],
            },
          },
        ],
      },
      values: {
        status: 'published',
      },
    });
    expect(setProps).toHaveBeenNthCalledWith(1, { loading: true });
    expect(setProps).toHaveBeenNthCalledWith(2, { loading: false });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(ctx.message.success).toHaveBeenCalledWith('Saved successfully');
  });

  it('updates all records with forceUpdate when the mode is all', async () => {
    const engine = new FlowEngine();
    const model = new BulkUpdateActionModel({ uid: 'bulk-update-all-action', flowEngine: engine } as never);
    const update = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const setProps = vi.fn();
    const handler = model.getFlow('apply')?.getStep('apply')?.serialize().handler;
    const ctx = {
      model: {
        getStepParams: vi.fn((_flowKey: string, stepKey: string) => {
          if (stepKey === 'updateMode') {
            return { value: 'all' };
          }
          return undefined;
        }),
        setProps,
      },
      runAction: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
      collection: {
        name: 'posts',
        dataSourceKey: 'main',
      },
      blockModel: {
        resource: {
          refresh: vi.fn(),
        },
      },
      api: {
        resource: vi.fn(() => ({ update })),
      },
      message: {
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
      },
      t: (value: string) => value,
    };

    await handler?.(ctx as never, { assignedValues: { status: 'archived' } } as never);

    expect(ctx.runAction).toHaveBeenCalledWith('confirm', { enable: false });
    expect(update).toHaveBeenCalledWith({
      values: {
        status: 'archived',
      },
      forceUpdate: true,
    });
    expect(setProps).toHaveBeenNthCalledWith(1, { loading: true });
    expect(setProps).toHaveBeenNthCalledWith(2, { loading: false });
    expect(ctx.blockModel.resource.refresh).toHaveBeenCalledTimes(1);
    expect(ctx.message.success).toHaveBeenCalledWith('Saved successfully');
  });

  it('exits early when assigned values are empty or collection metadata is missing', async () => {
    const engine = new FlowEngine();
    const model = new BulkUpdateActionModel({ uid: 'bulk-update-early-return-action', flowEngine: engine } as never);
    const update = vi.fn();
    const handler = model.getFlow('apply')?.getStep('apply')?.serialize().handler;
    const ctx = {
      model: {
        getStepParams: vi.fn(() => undefined),
        setProps: vi.fn(),
      },
      runAction: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
      collection: {
        name: 'posts',
      },
      blockModel: {
        resource: {
          getSelectedRows: vi.fn(() => [{ id: 1 }]),
          refresh: vi.fn(),
        },
      },
      api: {
        resource: vi.fn(() => ({ update })),
      },
      message: {
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
      },
      t: (value: string) => value,
    };

    await handler?.(ctx as never, { assignedValues: {} } as never);

    expect(ctx.message.warning).toHaveBeenCalledWith('No assigned fields configured');
    expect(update).not.toHaveBeenCalled();
    expect(ctx.blockModel.resource.refresh).not.toHaveBeenCalled();

    ctx.message.warning.mockClear();
    ctx.collection.name = '';

    await handler?.(ctx as never, { assignedValues: { status: 'published' } } as never);

    expect(ctx.message.error).toHaveBeenCalledWith('Collection is required to perform this action');
    expect(update).not.toHaveBeenCalled();
  });

  it('exits early when runjs assigned values fail to resolve', async () => {
    const engine = new FlowEngine();
    const model = new BulkUpdateActionModel({ uid: 'bulk-update-runjs-error-action', flowEngine: engine } as never);
    const update = vi.fn();
    const handler = model.getFlow('apply')?.getStep('apply')?.serialize().handler;
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const ctx = {
      model: {
        getStepParams: vi.fn(() => undefined),
        setProps: vi.fn(),
      },
      runAction: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
      collection: {
        name: 'posts',
      },
      api: {
        resource: vi.fn(() => ({ update })),
      },
      message: {
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
      },
      t: (value: string) => value,
    };

    await handler?.(ctx as never, { assignedValues: { status: { code: 'return "published"' } } } as never);

    expect(ctx.message.error).toHaveBeenCalledWith('RunJS execution failed');
    expect(update).not.toHaveBeenCalled();
    expect(ctx.model.setProps).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('exits early when default selected mode has no selected rows', async () => {
    const engine = new FlowEngine();
    const model = new BulkUpdateActionModel({ uid: 'bulk-update-no-selected-action', flowEngine: engine } as never);
    const update = vi.fn();
    const handler = model.getFlow('apply')?.getStep('apply')?.serialize().handler;
    const ctx = {
      model: {
        getStepParams: vi.fn(() => undefined),
        setProps: vi.fn(),
      },
      runAction: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
      collection: {
        name: 'posts',
      },
      api: {
        resource: vi.fn(() => ({ update })),
      },
      message: {
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
      },
      t: (value: string) => value,
    };

    await handler?.(ctx as never, { assignedValues: { status: 'published' } } as never);

    expect(ctx.message.error).toHaveBeenCalledWith('Please select the records to be updated');
    expect(update).not.toHaveBeenCalled();
    expect(ctx.model.setProps).not.toHaveBeenCalled();
  });

  it('uses filterTargetKey as primary key fallback when getPrimaryKey is unavailable', async () => {
    const engine = new FlowEngine();
    const model = new BulkUpdateActionModel({
      uid: 'bulk-update-filter-target-key-action',
      flowEngine: engine,
    } as never);
    const update = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const handler = model.getFlow('apply')?.getStep('apply')?.serialize().handler;
    const ctx = {
      model: {
        getStepParams: vi.fn((_flowKey: string, stepKey: string) => {
          if (stepKey === 'updateMode') {
            return { value: 'selected' };
          }
          return undefined;
        }),
        setProps: vi.fn(),
      },
      runAction: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
      collection: {
        name: 'posts',
        filterTargetKey: 'slug',
        getFilterByTK: vi.fn((record: { slug: string }) => record.slug),
      },
      blockModel: {
        resource: {
          getSelectedRows: vi.fn(() => [{ slug: 'post-1' }]),
          refresh: vi.fn(),
        },
      },
      api: {
        resource: vi.fn(() => ({ update })),
      },
      message: {
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
      },
      t: (value: string) => value,
    };

    await handler?.(ctx as never, { assignedValues: { status: 'published' } } as never);

    expect(update).toHaveBeenCalledWith({
      filter: {
        $and: [
          {
            slug: {
              $in: ['post-1'],
            },
          },
        ],
      },
      values: {
        status: 'published',
      },
    });
  });

  it('uses id as the final primary key fallback', async () => {
    const engine = new FlowEngine();
    const model = new BulkUpdateActionModel({ uid: 'bulk-update-id-fallback-action', flowEngine: engine } as never);
    const update = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const handler = model.getFlow('apply')?.getStep('apply')?.serialize().handler;
    const ctx = {
      model: {
        getStepParams: vi.fn((_flowKey: string, stepKey: string) => {
          if (stepKey === 'updateMode') {
            return { value: 'selected' };
          }
          return undefined;
        }),
        setProps: vi.fn(),
      },
      runAction: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
      collection: {
        name: 'posts',
        getPrimaryKey: vi.fn(() => undefined),
        getFilterByTK: vi.fn((record: { id: number }) => record.id),
      },
      blockModel: {
        resource: {
          getSelectedRows: vi.fn(() => [{ id: 1 }]),
          refresh: vi.fn(),
        },
      },
      api: {
        resource: vi.fn(() => ({ update })),
      },
      message: {
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
      },
      t: (value: string) => value,
    };

    await handler?.(ctx as never, { assignedValues: { status: 'published' } } as never);

    expect(update).toHaveBeenCalledWith({
      filter: {
        $and: [
          {
            id: {
              $in: [1],
            },
          },
        ],
      },
      values: {
        status: 'published',
      },
    });
  });
});

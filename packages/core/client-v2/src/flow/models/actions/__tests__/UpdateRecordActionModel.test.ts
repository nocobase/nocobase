/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowEngine, MultiRecordResource } from '@nocobase/flow-engine';
import { applyUpdateRecordAction } from '../UpdateRecordActionUtils';
import { UpdateRecordActionModel } from '../UpdateRecordActionModel';
import { dispatchEventDeep } from '../../../utils';

vi.mock('../../../utils', () => ({
  dispatchEventDeep: vi.fn(),
}));

describe('UpdateRecordActionModel apply action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dispatches paginationChange and returns success after updating the record', async () => {
    const resource: any = Object.create(MultiRecordResource.prototype);
    resource.update = vi.fn(async () => ({}));
    resource.refresh = vi.fn(async () => {});

    const blockModel: any = { uid: 'details-block' };
    const ctx: any = {
      model: {
        getStepParams: vi.fn(() => undefined),
        context: {
          blockModel,
        },
      },
      blockModel,
      runAction: vi.fn(async () => {}),
      collection: {
        name: 'users',
        getFilterByTK: vi.fn(() => 1),
      },
      record: {
        id: 1,
      },
      resource,
      message: {
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
      },
      t: (value: string) => value,
    };

    const updated = await applyUpdateRecordAction(ctx, {
      assignedValues: {
        marital_status: '已婚',
      },
    });

    expect(updated).toBe(true);
    expect(resource.update).toHaveBeenCalledWith(1, { marital_status: '已婚' }, undefined);
    expect(resource.refresh).not.toHaveBeenCalled();

    const paginationCalls = (dispatchEventDeep as any).mock.calls.filter(
      ([, eventName]: [any, string]) => eventName === 'paginationChange',
    );
    expect(paginationCalls.length).toBeGreaterThan(0);
    expect(paginationCalls.some(([model]: [any]) => model === ctx.model)).toBe(true);
    expect(paginationCalls.some(([model]: [any]) => model === blockModel)).toBe(true);
    expect(ctx.message.success).not.toHaveBeenCalled();
  });

  it('runs the configured after-success action only after a successful update', async () => {
    const engine = new FlowEngine();
    const action = new UpdateRecordActionModel({ uid: 'update-record-action', flowEngine: engine } as any);
    action.setStepParams('assignSettings', 'confirm', { enable: false });
    action.setStepParams('assignSettings', 'afterSuccess', {
      successMessage: 'Record updated',
    });

    const resource: any = Object.create(MultiRecordResource.prototype);
    resource.update = vi.fn(async () => ({}));
    const blockModel: any = { uid: 'details-block' };
    const runAction = vi.fn(async () => {});
    const ctx: any = {
      model: action,
      blockModel,
      runAction,
      collection: {
        name: 'users',
        getFilterByTK: vi.fn(() => 1),
      },
      record: { id: 1 },
      resource,
      message: {
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
      },
      t: (value: string) => value,
    };
    const handler = action.getFlow('apply')?.getStep('apply')?.serialize().handler;

    await handler(ctx, { assignedValues: { status: 'active' } });

    expect(runAction).toHaveBeenNthCalledWith(1, 'confirm', { enable: false });
    expect(runAction).toHaveBeenNthCalledWith(2, 'afterSuccess', {
      successMessage: 'Record updated',
      manualClose: false,
      actionAfterSuccess: 'stay',
    });
  });

  it('does not run the after-success action when no fields are assigned', async () => {
    const engine = new FlowEngine();
    const action = new UpdateRecordActionModel({ uid: 'update-record-action-empty', flowEngine: engine } as any);
    const runAction = vi.fn(async () => {});
    const ctx: any = {
      model: action,
      runAction,
      collection: {
        name: 'users',
        getFilterByTK: vi.fn(() => 1),
      },
      record: { id: 1 },
      resource: Object.create(MultiRecordResource.prototype),
      message: {
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
      },
      t: (value: string) => value,
    };
    const handler = action.getFlow('apply')?.getStep('apply')?.serialize().handler;

    await handler(ctx, { assignedValues: {} });

    expect(runAction).toHaveBeenCalledTimes(1);
    expect(runAction).toHaveBeenCalledWith('confirm', { enable: false });
    expect(ctx.message.warning).toHaveBeenCalledWith('No assigned fields configured');
  });
});

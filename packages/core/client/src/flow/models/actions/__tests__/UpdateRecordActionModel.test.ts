/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { applyUpdateRecordAction } from '../UpdateRecordActionUtils';
import { dispatchEventDeep } from '../../../utils';

vi.mock('../../../utils', () => ({
  dispatchEventDeep: vi.fn(),
}));

describe('UpdateRecordActionModel apply action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('refreshes resource and re-dispatches paginationChange after successful update', async () => {
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

    await applyUpdateRecordAction(ctx, {
      assignedValues: {
        marital_status: '已婚',
      },
    });

    expect(resource.update).toHaveBeenCalledWith(1, { marital_status: '已婚' }, undefined);
    expect(resource.refresh).toHaveBeenCalledTimes(1);
    expect(dispatchEventDeep).toHaveBeenCalledTimes(6);
    expect(dispatchEventDeep).toHaveBeenNthCalledWith(1, ctx.model, 'paginationChange');
    expect(dispatchEventDeep).toHaveBeenNthCalledWith(2, blockModel, 'paginationChange');
    expect(dispatchEventDeep).toHaveBeenNthCalledWith(3, ctx.model, 'paginationChange');
    expect(dispatchEventDeep).toHaveBeenNthCalledWith(4, blockModel, 'paginationChange');
    expect(dispatchEventDeep).toHaveBeenNthCalledWith(5, ctx.model, 'paginationChange');
    expect(dispatchEventDeep).toHaveBeenNthCalledWith(6, blockModel, 'paginationChange');
    expect(ctx.message.success).toHaveBeenCalledWith('Saved successfully');
    expect(resource.refresh.mock.invocationCallOrder[0]).toBeLessThan(
      (dispatchEventDeep as any).mock.invocationCallOrder[0],
    );
  });
});

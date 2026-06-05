/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { BulkUpdateActionModel } from '../BulkUpdateActionModel';

describe('BulkUpdateActionModel apply action', () => {
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
});

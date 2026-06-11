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

  it('dispatches paginationChange for action and block after successful update', async () => {
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
    expect(resource.refresh).not.toHaveBeenCalled();

    const paginationCalls = (dispatchEventDeep as any).mock.calls.filter(
      ([, eventName]: [any, string]) => eventName === 'paginationChange',
    );
    expect(paginationCalls.length).toBeGreaterThan(0);
    expect(paginationCalls.some(([model]: [any]) => model === ctx.model)).toBe(true);
    expect(paginationCalls.some(([model]: [any]) => model === blockModel)).toBe(true);
    expect(ctx.message.success).toHaveBeenCalledWith('Saved successfully');
  });
});

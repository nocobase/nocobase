/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { linkageRulesRefresh } from '../linkageRulesRefresh';

describe('linkageRulesRefresh action', () => {
  it('skips master model when forks exist', async () => {
    const handler = vi.fn(async () => {});
    const model: any = {
      isFork: false,
      forks: new Set([{}]),
      getFlow: vi.fn(() => ({})),
      getStepParams: vi.fn(() => ({ value: [] })),
    };
    const ctx: any = {
      model,
      resolveJsonTemplate: vi.fn(async (p: any) => p),
      getAction: vi.fn(() => ({ handler })),
    };

    await linkageRulesRefresh.handler(ctx, {
      actionName: 'actionLinkageRules',
      flowKey: 'buttonSettings',
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('runs linkage action on fork model and resolves params', async () => {
    const handler = vi.fn(async () => {});
    const model: any = {
      isFork: true,
      forks: new Set([{}]),
      getFlow: vi.fn(() => ({})),
      getStepParams: vi.fn(() => ({ value: ['x'] })),
    };
    const ctx: any = {
      model,
      resolveJsonTemplate: vi.fn(async (p: any) => p),
      getAction: vi.fn(() => ({ handler })),
    };

    await linkageRulesRefresh.handler(ctx, {
      actionName: 'actionLinkageRules',
      flowKey: 'buttonSettings',
    });

    expect(model.getStepParams).toHaveBeenCalledWith('buttonSettings', 'linkageRules');
    expect(ctx.resolveJsonTemplate).toHaveBeenCalled();
    expect(handler).toHaveBeenCalledWith(ctx, { value: ['x'] });
  });
});

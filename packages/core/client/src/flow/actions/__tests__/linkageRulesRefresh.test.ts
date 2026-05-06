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
  it('skips master model when mounted forks can handle flow in runtime mode', async () => {
    const handler = vi.fn(async () => {});
    const forkModel: any = {
      context: {
        ref: {
          current: {},
        },
      },
      getFlow: vi.fn(() => ({})),
    };
    const model: any = {
      isFork: false,
      forks: new Set([forkModel]),
      context: {
        ref: {
          current: null,
        },
      },
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

  it('runs linkage action on master model when forks are not mounted in runtime mode', async () => {
    const handler = vi.fn(async () => {});
    const model: any = {
      isFork: false,
      forks: new Set([
        {
          context: {
            ref: {
              current: null,
            },
          },
          getFlow: vi.fn(() => ({})),
        },
      ]),
      getFlow: vi.fn(() => ({})),
      getStepParams: vi.fn(() => ({ value: ['master-runtime'] })),
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

    expect(handler).toHaveBeenCalledWith(ctx, { value: ['master-runtime'] });
  });

  it('runs linkage action on mounted master even when mounted forks exist in runtime mode', async () => {
    const handler = vi.fn(async () => {});
    const model: any = {
      isFork: false,
      forks: new Set([
        {
          context: {
            ref: {
              current: {},
            },
          },
          getFlow: vi.fn(() => ({})),
        },
      ]),
      context: {
        ref: {
          current: {},
        },
      },
      getFlow: vi.fn(() => ({})),
      getStepParams: vi.fn(() => ({ value: ['master-mounted'] })),
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

    expect(handler).toHaveBeenCalledWith(ctx, { value: ['master-mounted'] });
  });

  it('runs linkage action on master model when forks exist in design mode', async () => {
    const handler = vi.fn(async () => {});
    const model: any = {
      isFork: false,
      forks: new Set([{}]),
      getFlow: vi.fn(() => ({})),
      getStepParams: vi.fn(() => ({ value: ['master'] })),
      context: {
        flowSettingsEnabled: true,
      },
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

    expect(handler).toHaveBeenCalledWith(ctx, { value: ['master'] });
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

  it('reruns after an inflight refresh receives another request', async () => {
    let resolveFirst: () => void;
    const firstRun = new Promise<void>((resolve) => {
      resolveFirst = resolve;
    });
    const handler = vi.fn(async () => {
      if (handler.mock.calls.length === 1) {
        await firstRun;
      }
    });
    const model: any = {
      isFork: true,
      forks: new Set(),
      getFlow: vi.fn(() => ({})),
      getStepParams: vi
        .fn()
        .mockReturnValueOnce({ value: ['first'] })
        .mockReturnValueOnce({ value: ['second'] }),
    };
    const ctx: any = {
      model,
      resolveJsonTemplate: vi.fn(async (p: any) => p),
      getAction: vi.fn(() => ({ handler })),
    };

    const first = linkageRulesRefresh.handler(ctx, {
      actionName: 'actionLinkageRules',
      flowKey: 'buttonSettings',
    });
    const second = linkageRulesRefresh.handler(ctx, {
      actionName: 'actionLinkageRules',
      flowKey: 'buttonSettings',
    });

    await Promise.resolve();
    expect(handler).toHaveBeenCalledTimes(1);

    resolveFirst!();
    await Promise.all([first, second]);

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler.mock.calls[0]?.[1]).toEqual({ value: ['first'] });
    expect(handler.mock.calls[1]?.[1]).toEqual({ value: ['second'] });
  });

  it('uses the latest context for an inflight pending rerun', async () => {
    let resolveFirst: () => void;
    const firstRun = new Promise<void>((resolve) => {
      resolveFirst = resolve;
    });
    const handler = vi.fn(async () => {
      if (handler.mock.calls.length === 1) {
        await firstRun;
      }
    });
    const model: any = {
      isFork: true,
      forks: new Set(),
      getFlow: vi.fn(() => ({})),
      getStepParams: vi.fn(() => ({ value: [] })),
    };
    const ctx1: any = {
      model,
      marker: 'first',
      resolveJsonTemplate: vi.fn(async (p: any) => ({ ...p, marker: 'first' })),
      getAction: vi.fn(() => ({ handler })),
    };
    const ctx2: any = {
      model,
      marker: 'second',
      resolveJsonTemplate: vi.fn(async (p: any) => ({ ...p, marker: 'second' })),
      getAction: vi.fn(() => ({ handler })),
    };

    const first = linkageRulesRefresh.handler(ctx1, {
      actionName: 'actionLinkageRules',
      flowKey: 'buttonSettings',
    });
    const second = linkageRulesRefresh.handler(ctx2, {
      actionName: 'actionLinkageRules',
      flowKey: 'buttonSettings',
    });

    await Promise.resolve();
    expect(handler).toHaveBeenCalledTimes(1);

    resolveFirst!();
    await Promise.all([first, second]);

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler.mock.calls[0]?.[0]).toBe(ctx1);
    expect(handler.mock.calls[0]?.[1]).toEqual({ value: [], marker: 'first' });
    expect(handler.mock.calls[1]?.[0]).toBe(ctx2);
    expect(handler.mock.calls[1]?.[1]).toEqual({ value: [], marker: 'second' });
  });
});

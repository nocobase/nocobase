/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowContext, FlowRuntimeContext } from '@nocobase/flow-engine';
import { waitFor } from '@testing-library/react';
import { EventEmitter } from 'events';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { actionLinkageRules, blockLinkageRules } from '../linkageRules';

function createRule(overrides: any = {}) {
  return {
    key: 'r1',
    title: 'r1',
    enable: true,
    condition: { logic: '$and', items: [] },
    actions: [],
    ...overrides,
  };
}

function createRuntime(
  params: any,
  options: {
    fieldIndex?: string[];
    fieldIndexRef?: { current: string[] };
    actionHandler?: any;
    engineEmitter?: any;
  } = {},
) {
  const formEmitter = new EventEmitter();
  const formBlock: any = {
    uid: 'form-block',
    emitter: formEmitter,
    formValueRuntime: {},
  };
  const actionHandler = options.actionHandler || vi.fn(async () => {});
  const linkageRunjsHandler = vi.fn(async () => {});
  const modelContext: any = new FlowContext();
  modelContext.defineProperty('blockModel', { value: formBlock });
  modelContext.defineProperty('app', {
    value: {
      jsonLogic: {
        apply: () => true,
      },
    },
  });
  modelContext.defineProperty('fieldIndex', {
    get: () => options.fieldIndexRef?.current || options.fieldIndex || [],
    cache: false,
  });
  modelContext.defineMethod('resolveJsonTemplate', async (_template: any) => _template);
  modelContext.defineMethod('getAction', (name: string) => {
    if (name === 'actionLinkageRules') {
      return { useRawParams: true, handler: actionHandler };
    }
    if (name === 'blockLinkageRules') {
      return { useRawParams: true, handler: actionHandler };
    }
    if (name === 'linkageRunjs') {
      return { handler: linkageRunjsHandler };
    }
    return undefined;
  });
  modelContext.defineMethod('getActions', () => new Map());
  modelContext.defineMethod('t', (s: string) => s);

  const model: any = {
    uid: 'action-model',
    context: modelContext,
    flowEngine: options.engineEmitter ? { emitter: options.engineEmitter } : undefined,
    isFork: false,
    forks: new Set(),
    getFlow: vi.fn(() => ({})),
    getStepParams: vi.fn(() => params),
    getAction: (name: string) => modelContext.getAction(name),
    getActions: () => new Map(),
    translate: (s: string) => s,
  };
  const ctx: any = new FlowRuntimeContext(model, 'buttonSettings');
  ctx.defineMethod('resolveJsonTemplate', async (_template: any) => _template);

  return {
    ctx,
    model,
    formEmitter,
    actionHandler,
    linkageRunjsHandler,
  };
}

describe('linkageRules: form value driven refresh', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('refreshes action linkage rules when a ctx.formValues dependency changes', async () => {
    const params = {
      value: [
        createRule({
          condition: {
            logic: '$and',
            items: [{ path: '{{ ctx.formValues.status }}', operator: '$eq', value: 'active' }],
          },
        }),
      ],
    };
    const { ctx, formEmitter, actionHandler } = createRuntime(params);

    await actionLinkageRules.handler(ctx, params);
    formEmitter.emit('formValuesChange', {
      source: 'user',
      txId: 'tx-1',
      changedPaths: [['other']],
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(actionHandler).not.toHaveBeenCalled();

    formEmitter.emit('formValuesChange', {
      source: 'user',
      txId: 'tx-2',
      changedPaths: [['status']],
    });

    await waitFor(() => expect(actionHandler).toHaveBeenCalledTimes(1));
    expect(actionHandler.mock.calls[0][0].inputArgs).toMatchObject({
      source: 'user',
      txId: 'tx-2',
      linkageTxId: 'tx-2',
      changedPaths: [['status']],
    });
  });

  it('refreshes block linkage rules when a ctx.formValues dependency changes', async () => {
    const params = {
      value: [
        createRule({
          condition: {
            logic: '$and',
            items: [{ path: '{{ ctx.formValues.status }}', operator: '$eq', value: 'active' }],
          },
        }),
      ],
    };
    const { ctx, formEmitter, actionHandler } = createRuntime(params);

    await blockLinkageRules.handler(ctx, params);
    formEmitter.emit('formValuesChange', {
      source: 'user',
      txId: 'tx-1',
      changedPaths: [['status']],
    });

    await waitFor(() => expect(actionHandler).toHaveBeenCalledTimes(1));
  });

  it('dedupes subscriptions for repeated handler runs', async () => {
    const params = {
      value: [
        createRule({
          condition: {
            logic: '$and',
            items: [{ path: '{{ ctx.formValues.status }}', operator: '$eq', value: 'active' }],
          },
        }),
      ],
    };
    const { ctx, formEmitter, actionHandler } = createRuntime(params);

    await actionLinkageRules.handler(ctx, params);
    await actionLinkageRules.handler(ctx, params);

    expect(formEmitter.listenerCount('formValuesChange')).toBe(1);

    formEmitter.emit('formValuesChange', {
      source: 'user',
      txId: 'tx-1',
      changedPaths: [['status']],
    });

    await waitFor(() => expect(actionHandler).toHaveBeenCalledTimes(1));
  });

  it('keeps action refresh subscription after the action is hidden and unmounted', async () => {
    const engineEmitter = new EventEmitter();
    const params = {
      value: [
        createRule({
          condition: {
            logic: '$and',
            items: [{ path: '{{ ctx.formValues.status }}', operator: '$eq', value: 'active' }],
          },
        }),
      ],
    };
    const { ctx, model, formEmitter, actionHandler } = createRuntime(params, { engineEmitter });

    await actionLinkageRules.handler(ctx, params);
    expect(formEmitter.listenerCount('formValuesChange')).toBe(1);

    engineEmitter.emit('model:unmounted', { model });
    expect(formEmitter.listenerCount('formValuesChange')).toBe(1);

    formEmitter.emit('formValuesChange', {
      source: 'user',
      txId: 'tx-1',
      changedPaths: [['status']],
    });

    await waitFor(() => expect(actionHandler).toHaveBeenCalledTimes(1));
  });

  it('maps ctx.item.value dependencies to the current row path', async () => {
    const params = {
      value: [
        createRule({
          condition: {
            logic: '$and',
            items: [{ path: '{{ ctx.item.value.nickname }}', operator: '$eq', value: 'A' }],
          },
        }),
      ],
    };
    const { ctx, formEmitter, actionHandler } = createRuntime(params, { fieldIndex: ['users:1'] });

    await actionLinkageRules.handler(ctx, params);
    formEmitter.emit('formValuesChange', {
      source: 'user',
      txId: 'tx-1',
      changedPaths: [['users', 0, 'nickname']],
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(actionHandler).not.toHaveBeenCalled();

    formEmitter.emit('formValuesChange', {
      source: 'user',
      txId: 'tx-2',
      changedPaths: [['users', 1, 'nickname']],
    });

    await waitFor(() => expect(actionHandler).toHaveBeenCalledTimes(1));
  });

  it('parses object-patch changedPaths before matching ctx.item.value dependencies', async () => {
    const params = {
      value: [
        createRule({
          condition: {
            logic: '$and',
            items: [{ path: '{{ ctx.item.value.nickname }}', operator: '$eq', value: 'A' }],
          },
        }),
      ],
    };
    const { ctx, formEmitter, actionHandler } = createRuntime(params, { fieldIndex: ['users:1'] });

    await actionLinkageRules.handler(ctx, params);
    formEmitter.emit('formValuesChange', {
      source: 'user',
      txId: 'tx-1',
      changedPaths: [['users[1].nickname']],
    });

    await waitFor(() => expect(actionHandler).toHaveBeenCalledTimes(1));
  });

  it('recomputes ctx.item.value dependencies from the latest fieldIndex', async () => {
    const fieldIndexRef = { current: ['users:1'] };
    const params = {
      value: [
        createRule({
          condition: {
            logic: '$and',
            items: [{ path: '{{ ctx.item.value.nickname }}', operator: '$eq', value: 'A' }],
          },
        }),
      ],
    };
    const { ctx, formEmitter, actionHandler } = createRuntime(params, { fieldIndexRef });

    await actionLinkageRules.handler(ctx, params);
    fieldIndexRef.current = ['users:0'];
    formEmitter.emit('formValuesChange', {
      source: 'user',
      txId: 'tx-1',
      changedPaths: [['users', 0, 'nickname']],
    });

    await waitFor(() => expect(actionHandler).toHaveBeenCalledTimes(1));
  });

  it('maps ctx.item.index dependencies to the current list path', async () => {
    const params = {
      value: [
        createRule({
          condition: {
            logic: '$and',
            items: [{ path: '{{ ctx.item.index }}', operator: '$eq', value: 1 }],
          },
        }),
      ],
    };
    const { ctx, formEmitter, actionHandler } = createRuntime(params, { fieldIndex: ['users:1'] });

    await actionLinkageRules.handler(ctx, params);
    formEmitter.emit('formValuesChange', {
      source: 'user',
      txId: 'tx-1',
      changedPaths: [['users', 1, 'nickname']],
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(actionHandler).not.toHaveBeenCalled();

    formEmitter.emit('formValuesChange', {
      source: 'user',
      txId: 'tx-2',
      changedPaths: [['users']],
    });

    await waitFor(() => expect(actionHandler).toHaveBeenCalledTimes(1));
  });

  it('collects ctx.formValues dependencies from linkageRunjs scripts without resolving the script early', async () => {
    const params = {
      value: [
        createRule({
          actions: [
            {
              key: 'a1',
              name: 'linkageRunjs',
              params: {
                value: {
                  script: 'return ctx.formValues.amount',
                },
              },
            },
          ],
        }),
      ],
    };
    const { ctx, formEmitter, actionHandler, linkageRunjsHandler } = createRuntime(params);

    await actionLinkageRules.handler(ctx, params);
    expect(linkageRunjsHandler).toHaveBeenCalledTimes(1);

    formEmitter.emit('formValuesChange', {
      source: 'user',
      txId: 'tx-1',
      changedPaths: [['amount']],
    });

    await waitFor(() => expect(actionHandler).toHaveBeenCalledTimes(1));
  });

  it('reruns once with the latest relevant change after a refresh is already running', async () => {
    let resolveFirstRefresh: () => void = () => undefined;
    const firstRefresh = new Promise<void>((resolve) => {
      resolveFirstRefresh = resolve;
    });
    const actionHandler = vi
      .fn()
      .mockImplementationOnce(() => firstRefresh)
      .mockImplementation(async () => undefined);
    const params = {
      value: [
        createRule({
          condition: {
            logic: '$and',
            items: [{ path: '{{ ctx.formValues.status }}', operator: '$eq', value: 'active' }],
          },
        }),
      ],
    };
    const { ctx, formEmitter } = createRuntime(params, { actionHandler });

    await actionLinkageRules.handler(ctx, params);
    formEmitter.emit('formValuesChange', {
      source: 'user',
      txId: 'tx-1',
      changedPaths: [['status']],
    });
    await waitFor(() => expect(actionHandler).toHaveBeenCalledTimes(1));

    formEmitter.emit('formValuesChange', {
      source: 'user',
      txId: 'tx-2',
      changedPaths: [['status']],
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(actionHandler).toHaveBeenCalledTimes(1);

    resolveFirstRefresh();
    await waitFor(() => expect(actionHandler).toHaveBeenCalledTimes(2));
  });

  it('does not recursively refresh while handling its own linkage write event', async () => {
    const params = {
      value: [
        createRule({
          condition: {
            logic: '$and',
            items: [{ path: '{{ ctx.formValues.status }}', operator: '$eq', value: 'active' }],
          },
        }),
      ],
    };
    const formEmitter = new EventEmitter();
    const actionHandler = vi.fn(async () => {
      formEmitter.emit('formValuesChange', {
        source: 'linkage',
        txId: 'tx-linkage',
        linkageTxId: 'tx-1',
        changedPaths: [['status']],
      });
    });
    const runtime = createRuntime(params, { actionHandler });
    runtime.formEmitter.removeAllListeners();
    formEmitter.on('formValuesChange', (...args) => runtime.formEmitter.emit('formValuesChange', ...args));

    await actionLinkageRules.handler(runtime.ctx, params);
    formEmitter.emit('formValuesChange', {
      source: 'user',
      txId: 'tx-1',
      changedPaths: [['status']],
    });

    await waitFor(() => expect(actionHandler).toHaveBeenCalledTimes(1));

    runtime.formEmitter.emit('formValuesChange', {
      source: 'linkage',
      txId: 'tx-linkage-late',
      linkageTxId: 'tx-1',
      changedPaths: [['status']],
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(actionHandler).toHaveBeenCalledTimes(1);
  });
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application } from '@nocobase/client-v2';
import { describe, expect, it, vi } from 'vitest';

import { getDispatchBindingOptions } from '../components/AgentGatewayDispatchBindingSelect';
import { dispatchAgentGatewayRun } from '../models/AgentGatewayDispatchActionModel';
import PluginAgentGatewayClientV2 from '../plugin';

interface RequestConfig {
  url: string;
  method: 'post';
  data?: Record<string, unknown>;
}

type DispatchContext = Parameters<typeof dispatchAgentGatewayRun>[0];

function createContext(request: DispatchContext['api']['request']): DispatchContext {
  return {
    api: {
      request,
    },
    model: {
      context: {
        record: {
          id: 42,
        },
      },
    },
    blockModel: {
      collection: {
        name: 'agDispatchTickets',
      },
      resource: {
        refresh: vi.fn(async () => null),
      },
    },
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    },
    t: (key: string) => key,
  };
}

describe('AgentGatewayDispatchActionModel', () => {
  it('registers the dispatch action model and binding select component', async () => {
    const app = new Application({
      plugins: [PluginAgentGatewayClientV2],
    });
    const registerModelLoaders = vi.spyOn(app.flowEngine, 'registerModelLoaders');
    const registerComponents = vi.spyOn(app.flowEngine.flowSettings, 'registerComponents');

    await app.load();

    expect(registerModelLoaders).toHaveBeenCalledWith(
      expect.objectContaining({
        AgentGatewayDispatchActionModel: expect.objectContaining({
          loader: expect.any(Function),
        }),
      }),
    );
    expect(registerComponents).toHaveBeenCalledWith(
      expect.objectContaining({
        AgentGatewayDispatchBindingSelect: expect.any(Function),
      }),
    );
  });

  it('dispatches the current record through the selected binding and refreshes the block resource', async () => {
    const request: DispatchContext['api']['request'] = vi.fn(async <T,>(_config: RequestConfig) => ({
      data: {
        data: {
          bindingId: 'binding-id-1',
          bindingKey: 'ticket-dispatch',
          idempotent: false,
          deduped: false,
          runId: 'run-id-1',
          runCode: 'run-code-1',
          agentSessionId: null,
          sourceCollection: 'agDispatchTickets',
          sourceRecordId: '42',
          outputAgentRunField: 'agentRun',
          relationUpdated: true,
          run: {
            id: 'run-id-1',
            status: 'queued',
          },
        } as T,
      },
    }));
    const ctx = createContext(request);

    const result = await dispatchAgentGatewayRun(ctx, {
      bindingIdentifier: 'binding-id-1',
    });

    expect(result).toMatchObject({
      runId: 'run-id-1',
      run: {
        id: 'run-id-1',
      },
    });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'agent-gateway/dispatch-bindings/binding-id-1/dispatch',
        method: 'post',
        data: expect.objectContaining({
          sourceRecordId: '42',
          sourceCollection: 'agDispatchTickets',
          idempotencyKey: expect.stringMatching(/^dispatch:binding-id-1:42:/),
        }),
      }),
    );
    const requestData = (request as unknown as { mock: { calls: Array<[RequestConfig]> } }).mock.calls[0][0].data || {};
    expect(requestData).not.toHaveProperty('recordId');
    expect(requestData).not.toHaveProperty('expectedCollectionName');
    expect(ctx.blockModel.resource.refresh).toHaveBeenCalled();
    expect(ctx.message.success).toHaveBeenCalledWith('Agent Gateway run dispatched');
  });

  it('uses filterByTk or collection.getFilterByTK before falling back to record.id', async () => {
    const request: DispatchContext['api']['request'] = vi.fn(async <T,>(_config: RequestConfig) => ({
      data: {
        data: {
          bindingId: 'binding-id-1',
          bindingKey: 'ticket-dispatch',
          idempotent: false,
          deduped: false,
          runId: 'run-id-1',
          runCode: 'run-code-1',
          agentSessionId: null,
          sourceCollection: 'agDispatchTickets',
          sourceRecordId: 'ticket-filter-key',
          outputAgentRunField: 'agentRun',
          relationUpdated: true,
          run: {
            id: 'run-id-1',
            status: 'queued',
          },
        } as T,
      },
    }));
    const ctx = {
      ...createContext(request),
      filterByTk: 'ticket-filter-key',
    };

    await dispatchAgentGatewayRun(ctx, {
      bindingIdentifier: 'binding-id-1',
    });

    expect(request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sourceRecordId: 'ticket-filter-key',
        }),
      }),
    );

    request.mockClear();
    const collection = {
      name: 'agDispatchTickets',
      filterTargetKey: 'ticketCode',
      getFilterByTK: vi.fn((record: Record<string, unknown>) => record.ticketCode),
    };
    const collectionContext = {
      ...createContext(request),
      model: undefined,
      record: {
        id: 42,
        ticketCode: 'ticket-code-42',
      },
      collection,
      blockModel: {
        collection,
        resource: {
          refresh: vi.fn(async () => null),
        },
      },
    };

    await dispatchAgentGatewayRun(collectionContext, {
      bindingIdentifier: 'binding-id-1',
    });

    expect(collection.getFilterByTK).toHaveBeenCalledWith({
      id: 42,
      ticketCode: 'ticket-code-42',
    });
    expect(request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sourceRecordId: 'ticket-code-42',
        }),
      }),
    );
  });

  it('does not create duplicate requests while the same record dispatch is pending', async () => {
    let resolveRequest: (value: unknown) => void = () => null;
    const request: DispatchContext['api']['request'] = vi.fn(
      () =>
        new Promise((resolve: (value: { data: { data: unknown } }) => void) => {
          resolveRequest = resolve;
        }),
    );
    const ctx = createContext(request);

    const first = dispatchAgentGatewayRun(ctx, {
      bindingIdentifier: 'binding-id-1',
    });
    const second = await dispatchAgentGatewayRun(ctx, {
      bindingIdentifier: 'binding-id-1',
    });

    expect(second).toBeNull();
    expect(request).toHaveBeenCalledTimes(1);
    expect(ctx.message.warning).toHaveBeenCalledWith('Agent Gateway dispatch is already running');

    resolveRequest({
      data: {
        data: {
          bindingId: 'binding-id-1',
          bindingKey: 'ticket-dispatch',
          idempotent: false,
          deduped: false,
          runId: 'run-id-1',
          runCode: 'run-code-1',
          agentSessionId: null,
          sourceCollection: 'agDispatchTickets',
          sourceRecordId: '42',
          outputAgentRunField: 'agentRun',
          relationUpdated: true,
          run: {
            id: 'run-id-1',
            status: 'queued',
          },
        },
      },
    });
    await first;
  });

  it('reuses the idempotency key for repeated clicks on the same record', async () => {
    let callCount = 0;
    const request: DispatchContext['api']['request'] = vi.fn(async <T,>(_config: RequestConfig) => {
      callCount += 1;
      const deduped = callCount > 1;
      return {
        data: {
          data: {
            bindingId: 'binding-id-repeat',
            bindingKey: 'ticket-dispatch',
            idempotent: deduped,
            deduped,
            runId: 'run-id-repeat',
            runCode: 'run-code-repeat',
            agentSessionId: null,
            sourceCollection: 'agDispatchTickets',
            sourceRecordId: '42',
            outputAgentRunField: 'agentRun',
            relationUpdated: true,
            run: {
              id: 'run-id-repeat',
              status: 'queued',
            },
          } as T,
        },
      };
    });
    const ctx = createContext(request);

    await dispatchAgentGatewayRun(ctx, {
      bindingIdentifier: 'binding-id-repeat',
    });
    await dispatchAgentGatewayRun(ctx, {
      bindingIdentifier: 'binding-id-repeat',
    });

    const requestCalls = (request as unknown as { mock: { calls: Array<[RequestConfig]> } }).mock.calls;
    const firstKey = requestCalls[0][0].data?.idempotencyKey;
    const secondKey = requestCalls[1][0].data?.idempotencyKey;
    expect(firstKey).toEqual(expect.stringMatching(/^dispatch:binding-id-repeat:42:/));
    expect(secondKey).toBe(firstKey);
    expect(ctx.message.success).toHaveBeenLastCalledWith('Agent Gateway run already exists');
  });

  it('requires both a binding and current record id before dispatching', async () => {
    const request: DispatchContext['api']['request'] = vi.fn(async <T,>(_config: RequestConfig) => ({
      data: {
        data: undefined as T | undefined,
      },
    }));
    const ctx = createContext(request);

    expect(await dispatchAgentGatewayRun(ctx, {})).toBeNull();
    expect(ctx.message.error).toHaveBeenCalledWith('Dispatch binding is required');

    const missingRecordContext = {
      ...ctx,
      model: {
        context: {
          record: {},
        },
      },
    };
    expect(
      await dispatchAgentGatewayRun(missingRecordContext, {
        bindingIdentifier: 'binding-id-1',
      }),
    ).toBeNull();
    expect(ctx.message.error).toHaveBeenCalledWith('Record ID is required');

    const missingCollectionContext = {
      ...createContext(request),
      blockModel: {
        resource: {
          refresh: vi.fn(async () => null),
        },
      },
    };
    expect(
      await dispatchAgentGatewayRun(missingCollectionContext, {
        bindingIdentifier: 'binding-id-1',
      }),
    ).toBeNull();
    expect(missingCollectionContext.message.error).toHaveBeenCalledWith('Record collection is required');
    expect(request).not.toHaveBeenCalled();
  });

  it('filters dispatch bindings to the current collection for action configuration', () => {
    expect(
      getDispatchBindingOptions(
        [
          {
            id: 'binding-id-1',
            bindingKey: 'ticket-dispatch',
            collectionName: 'agDispatchTickets',
            enabled: true,
            status: 'active',
          },
          {
            id: 'binding-id-2',
            bindingKey: 'other-dispatch',
            collectionName: 'agDispatchOtherTickets',
            enabled: true,
            status: 'active',
          },
          {
            id: 'binding-id-3',
            bindingKey: 'disabled-dispatch',
            collectionName: 'agDispatchTickets',
            enabled: false,
            status: 'active',
          },
        ],
        'agDispatchTickets',
      ),
    ).toEqual([
      {
        label: 'ticket-dispatch (agDispatchTickets)',
        value: 'ticket-dispatch',
      },
    ]);
    expect(
      getDispatchBindingOptions([
        {
          id: 'binding-id-1',
          bindingKey: 'ticket-dispatch',
          collectionName: 'agDispatchTickets',
          enabled: true,
          status: 'active',
        },
      ]),
    ).toEqual([]);
  });
});

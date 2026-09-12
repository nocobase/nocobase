/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({
  pmGet: vi.fn(),
  PluginWorkflowClientV2: class PluginWorkflowClientV2 {},
  usePluginValue: undefined as unknown,
}));

vi.mock('@nocobase/client-v2', () => ({
  usePlugin: () => holder.usePluginValue,
}));

vi.mock('@nocobase/flow-engine', () => ({
  useFlowEngine: () => ({
    context: {
      app: {
        pm: {
          get: holder.pmGet,
        },
      },
    },
  }),
}));

vi.mock('@nocobase/plugin-workflow/client-v2', () => ({
  PluginWorkflowClientV2: holder.PluginWorkflowClientV2,
}));

import { useTempAssociationSources } from '../useTempAssociationSources';

function setupWorkflowPlugin(plugin?: unknown) {
  holder.pmGet.mockImplementation((key: unknown) => {
    if (key === 'workflow' || key === '@nocobase/plugin-workflow' || key === holder.PluginWorkflowClientV2) {
      return plugin;
    }
    return undefined;
  });
}

afterEach(() => {
  vi.clearAllMocks();
  holder.usePluginValue = undefined;
});

describe('useTempAssociationSources', () => {
  it('returns an empty list when the workflow plugin is not registered and workflow collection is missing', () => {
    setupWorkflowPlugin(undefined);

    const { result } = renderHook(() => useTempAssociationSources({ config: {}, id: 1, type: 'approval' }, []));

    expect(result.current).toEqual([]);
  });

  it('falls back to a workflow-level source when the trigger does not provide one', () => {
    setupWorkflowPlugin({
      triggers: {
        get: (type: string) =>
          type === 'approval'
            ? {
                useTempAssociationSource: vi.fn(() => null),
              }
            : undefined,
      },
    });

    const { result } = renderHook(() =>
      useTempAssociationSources({ config: { collection: 'main.orders' }, id: 10, type: 'approval' }, []),
    );

    expect(result.current).toEqual([
      {
        collection: 'main.orders',
        nodeId: 10,
        nodeKey: 'workflow',
        nodeType: 'workflow',
      },
    ]);
  });

  it('does not duplicate an existing trigger source with the workflow-level fallback', () => {
    const triggerSource = {
      collection: 'main.orders',
      nodeId: 10,
      nodeKey: 'workflow',
      nodeType: 'workflow' as const,
    };
    setupWorkflowPlugin({
      triggers: {
        get: (type: string) =>
          type === 'approval'
            ? {
                useTempAssociationSource: vi.fn(() => triggerSource),
              }
            : undefined,
      },
    });

    const { result } = renderHook(() =>
      useTempAssociationSources({ config: { collection: 'main.orders' }, id: 10, type: 'approval' }, []),
    );

    expect(result.current).toEqual([triggerSource]);
  });

  it('resolves trigger and upstream sources from a v1-style workflow plugin', () => {
    const triggerSource = {
      collection: 'main.orders',
      nodeId: 10,
      nodeKey: 'workflow',
      nodeType: 'workflow' as const,
    };
    const nodeSource = {
      collection: 'main.users',
      nodeId: 20,
      nodeKey: 'query-users',
      nodeType: 'node' as const,
    };
    setupWorkflowPlugin({
      instructions: {
        get: (type: string) =>
          type === 'query'
            ? {
                useTempAssociationSource: vi.fn(() => nodeSource),
              }
            : undefined,
      },
      triggers: {
        get: (type: string) =>
          type === 'approval'
            ? {
                useTempAssociationSource: vi.fn(() => triggerSource),
              }
            : undefined,
      },
    });

    const { result } = renderHook(() =>
      useTempAssociationSources({ config: { collection: 'main.orders' }, id: 10, type: 'approval' }, [
        { key: 'query-users', type: 'query' },
      ]),
    );

    expect(result.current).toEqual([triggerSource, nodeSource]);
  });
});

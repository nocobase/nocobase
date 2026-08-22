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
  workflowPlugin: {
    triggers: {
      get: vi.fn(),
    },
    instructions: {
      get: vi.fn(),
    },
  },
}));

vi.mock('@nocobase/client', () => ({
  usePlugin: () => holder.workflowPlugin,
}));

vi.mock('@nocobase/plugin-workflow/client', () => ({
  default: class PluginWorkflowClient {},
}));

import { useTempAssociationSources } from '../useTempAssociationSources';

afterEach(() => {
  vi.clearAllMocks();
});

describe('v1 useTempAssociationSources', () => {
  it('falls back to the workflow collection when the trigger does not provide a temporary source', () => {
    holder.workflowPlugin.triggers.get.mockReturnValue({});
    holder.workflowPlugin.instructions.get.mockReturnValue(undefined);

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

  it('does not duplicate the workflow fallback when the trigger already provides a temporary source', () => {
    holder.workflowPlugin.triggers.get.mockReturnValue({
      useTempAssociationSource: () => ({
        collection: 'main.approvals',
        nodeId: 10,
        nodeKey: 'trigger',
        nodeType: 'trigger',
      }),
    });
    holder.workflowPlugin.instructions.get.mockReturnValue(undefined);

    const { result } = renderHook(() =>
      useTempAssociationSources({ config: { collection: 'main.orders' }, id: 10, type: 'approval' }, []),
    );

    expect(result.current).toEqual([
      {
        collection: 'main.approvals',
        nodeId: 10,
        nodeKey: 'trigger',
        nodeType: 'trigger',
      },
    ]);
  });
});

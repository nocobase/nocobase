/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, renderHook } from '@testing-library/react';
import { Cascader } from 'antd';
import React from 'react';
import type { MetaTreeNode } from '@nocobase/flow-engine';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { scopeOptions } from '../variable';

const holder = vi.hoisted(() => ({ variables: [] as MetaTreeNode[] }));

vi.mock('@nocobase/client', () => ({
  usePlugin: () => ({ instructions: { get: () => ({ useScopeVariables: () => holder.variables }) } }),
}));
vi.mock('..', () => ({ default: class WorkflowPlugin {} }));
vi.mock('../FlowContext', () => ({ useFlowContext: vi.fn() }));
vi.mock('../nodes', () => ({
  useNodeContext: () => ({ key: 'response' }),
  useUpstreamScopes: () => [{ key: 'loop', title: 'Loop', type: 'loop' }],
}));

describe('v1 scopeOptions', () => {
  beforeEach(() => {
    // A variable-target loop exposes a lazy item even when its target has no child metadata (e.g. Webhook body.a).
    holder.variables = [
      { name: 'item', title: 'Loop target', type: '', paths: ['item'], children: async () => [] },
      { name: 'index', title: 'Loop index', type: 'number', paths: ['index'] },
    ];
  });

  it('renders a Cascader with migrated loop variables and preserves serialized expression paths', async () => {
    const { result } = renderHook(() => scopeOptions.useOptions({}));
    const scopes = result.current;
    const options = [{ value: '$scopes', label: 'Scope variables', children: scopes }];
    expect(() => render(<Cascader options={options} />)).not.toThrow();
    const [item, index] = scopes[0].children ?? [];
    expect(item).toMatchObject({ label: 'Loop target', value: 'item' });
    expect(index).toMatchObject({ label: 'Loop index', value: 'index' });
    expect(`{{${[options[0].value, scopes[0].value, item.value].join('.')}}}`).toBe('{{$scopes.loop.item}}');
    await item.loadChildren(item);
    expect(item.children).toEqual([]);
    expect(item.isLeaf).toBe(true);
    // V1 loading must not mutate the MetaTreeNode shared with V2 consumers.
    expect(typeof holder.variables[0].children).toBe('function');
  });

  it('honors custom field names at the scope and item levels', () => {
    const { result } = renderHook(() =>
      scopeOptions.useOptions({ fieldNames: { label: 'text', value: 'name', children: 'items' } }),
    );
    expect(result.current[0]).toMatchObject({
      name: 'loop',
      text: 'Loop',
      items: [
        { name: 'item', text: 'Loop target' },
        { name: 'index', text: 'Loop index' },
      ],
    });
  });
});

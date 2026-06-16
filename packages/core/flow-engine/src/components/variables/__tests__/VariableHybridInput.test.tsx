/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Pins how a `{{ … }}` reference renders as its label when the label lives below a lazily-loaded meta-tree level (e.g. a workflow node's output fields under `$jobsMapByNodeKey.<nodeKey>`). `buildLabelMap` only pre-walks already-loaded (array) children into a memoized map, so the two real user flows each need their own resolution path, both pinned here:
 *   - after reload  — the value is already a deep reference at mount, its level still an unresolved thunk → the preload effect resolves it.
 *   - after picking — the user drills into a lazy level (cascader resolves it IN PLACE, no tree-ref change) then picks a leaf → the live walk of the tree's current contents resolves it on the same render.
 * Plus the top-level (already-loaded) and not-in-tree (raw-token fallback) cases.
 */

import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { VariableHybridInput, type VariableHybridInputConverters } from '../VariableHybridInput';
import type { MetaTreeNode } from '../../../flowContext';
import { createTestFlowContext, TestFlowContextWrapper } from './test-utils';

// Workflow-style converters: `{{$root.a.b}}` (dotted path, no inner spaces).
const VARIABLE_REGEXP = /\{\{\s*([^{}]+?)\s*\}\}/g;
const workflowConverters: VariableHybridInputConverters = {
  formatPathToValue: (item?: MetaTreeNode) => {
    const path = item?.paths ?? [];
    return path.length ? `{{${path.join('.')}}}` : '';
  },
  parseValueToPath: (value?: string) => {
    if (typeof value !== 'string') return undefined;
    const match = value.trim().match(/^\{\{\s*(.+?)\s*\}\}$/);
    return match ? match[1].split('.') : undefined;
  },
  variableRegExp: VARIABLE_REGEXP,
};

const TAG_SELECTOR = '.nb-variable-tag';

describe('VariableHybridInput — saved reference labels', () => {
  it('renders a top-level (already-loaded) reference as its label, not the raw token', async () => {
    const flowContext = createTestFlowContext();
    const metaTree: MetaTreeNode[] = [
      {
        name: '$user',
        title: 'User',
        type: '',
        paths: ['$user'],
        children: [{ name: 'name', title: 'Name', type: 'string', paths: ['$user', 'name'] }],
      },
    ];

    render(
      <TestFlowContextWrapper context={flowContext}>
        <VariableHybridInput value="{{$user.name}}" metaTree={metaTree} converters={workflowConverters} />
      </TestFlowContextWrapper>,
    );

    await waitFor(() => {
      const tag = document.querySelector(TAG_SELECTOR);
      expect(tag).toBeTruthy();
      expect(tag?.textContent).toBe('User/Name');
    });
  });

  it('shows the label after reload: a deep reference present at mount preloads its lazy level', async () => {
    const flowContext = createTestFlowContext();
    // The node's output fields are behind a lazy `children` thunk — exactly the `$jobsMapByNodeKey.<nodeKey>` shape produced by the workflow adapter.
    const loadChildren = vi.fn(
      async (): Promise<MetaTreeNode[]> => [
        { name: 'name', title: 'Name', type: 'string', paths: ['$jobsMapByNodeKey', 'node1', 'name'] },
      ],
    );
    const metaTree: MetaTreeNode[] = [
      {
        name: '$jobsMapByNodeKey',
        title: 'Node result',
        type: '',
        paths: ['$jobsMapByNodeKey'],
        children: [
          {
            name: 'node1',
            title: 'Query',
            type: '',
            paths: ['$jobsMapByNodeKey', 'node1'],
            children: loadChildren,
          },
        ],
      },
    ];

    render(
      <TestFlowContextWrapper context={flowContext}>
        <VariableHybridInput
          value="{{$jobsMapByNodeKey.node1.name}}"
          metaTree={metaTree}
          converters={workflowConverters}
        />
      </TestFlowContextWrapper>,
    );

    // The lazy thunk is invoked by the preload, and the deep label appears.
    await waitFor(() => {
      expect(loadChildren).toHaveBeenCalled();
      const tag = document.querySelector(TAG_SELECTOR);
      expect(tag?.textContent).toBe('Node result/Query/Name');
    });
    // It must NOT leave the raw token visible.
    expect(document.body.textContent).not.toContain('{{$jobsMapByNodeKey.node1.name}}');
  });

  it('shows the label after picking: a level expanded in place then selected resolves live', async () => {
    // Reproduces drilling into a lazy level in the cascader: that resolves the node's `children` onto the SAME meta-tree object in place — WITHOUT changing the tree reference — then the user picks a leaf, so `value` updates. The memoized `labelMap` (keyed on the tree reference) still misses the freshly loaded leaf; only a live walk of the tree's current contents resolves it.
    const flowContext = createTestFlowContext();
    const node1: MetaTreeNode = {
      name: 'node1',
      title: 'Query',
      type: '',
      paths: ['$jobsMapByNodeKey', 'node1'],
      // Starts WITHOUT children (an unexpanded branch). No thunk — so the preload effect/`loadedFlag` path does not fire; the fix must come from the live walk.
    };
    const metaTree: MetaTreeNode[] = [
      {
        name: '$jobsMapByNodeKey',
        title: 'Node result',
        type: '',
        paths: ['$jobsMapByNodeKey'],
        children: [node1],
      },
    ];

    // Mount with no reference yet — the deep level is not loaded.
    const { rerender } = render(
      <TestFlowContextWrapper context={flowContext}>
        <VariableHybridInput value="" metaTree={metaTree} converters={workflowConverters} />
      </TestFlowContextWrapper>,
    );

    // Simulate the cascader's loadData: resolve node1's children in place on the SAME tree object (no new reference, no thunk).
    node1.children = [
      { name: 'name', title: 'Role name', type: 'string', paths: ['$jobsMapByNodeKey', 'node1', 'name'] },
    ];

    // The user picks the leaf → value updates to the deep reference.
    rerender(
      <TestFlowContextWrapper context={flowContext}>
        <VariableHybridInput
          value="{{$jobsMapByNodeKey.node1.name}}"
          metaTree={metaTree}
          converters={workflowConverters}
        />
      </TestFlowContextWrapper>,
    );

    await waitFor(() => {
      const tag = document.querySelector(TAG_SELECTOR);
      expect(tag?.textContent).toBe('Node result/Query/Role name');
    });
    expect(document.body.textContent).not.toContain('{{$jobsMapByNodeKey.node1.name}}');
  });

  it('falls back to the raw token when the reference is not in the tree', async () => {
    const flowContext = createTestFlowContext();
    const metaTree: MetaTreeNode[] = [{ name: '$user', title: 'User', type: '', paths: ['$user'], children: [] }];

    render(
      <TestFlowContextWrapper context={flowContext}>
        <VariableHybridInput value="{{$missing.field}}" metaTree={metaTree} converters={workflowConverters} />
      </TestFlowContextWrapper>,
    );

    await waitFor(() => {
      const tag = document.querySelector(TAG_SELECTOR);
      expect(tag?.textContent).toBe('{{$missing.field}}');
    });
  });
});

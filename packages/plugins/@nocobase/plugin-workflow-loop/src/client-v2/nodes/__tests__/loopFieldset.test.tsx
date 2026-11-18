/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Form } from 'antd';
import { fireEvent, render, screen } from '@testing-library/react';
import type { MetaTreeNode } from '@nocobase/flow-engine';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoopFieldset } from '../components/loop';

const holder = vi.hoisted(() => ({
  node: { id: 1, key: 'loopNode', title: 'Loop node', config: { target: 1 as unknown } },
  upstreamVariables: [] as MetaTreeNode[],
  conditionVariables: [] as MetaTreeNode[],
}));

vi.mock('@nocobase/plugin-workflow/client-v2', async (importOriginal) => {
  const actual = await importOriginal<object>();
  return {
    ...actual,
    WorkflowTypedVariableInput: ({
      nullable: _nullable,
      types: _types,
      ...props
    }: Record<string, unknown> & { nullable?: boolean; types?: unknown }) => (
      <input aria-label="loop-target" {...props} />
    ),
    CalculationConfig: ({
      value,
      onChange,
      useVariableHook,
    }: {
      value?: unknown;
      onChange?: (value: unknown) => void;
      useVariableHook: () => MetaTreeNode[];
    }) => {
      holder.conditionVariables = useVariableHook();
      return (
        <button type="button" onClick={() => onChange?.({ next: true })}>
          {JSON.stringify(value)}
        </button>
      );
    },
    RadioWithTooltip: ({
      options = [],
      value,
      onChange,
    }: {
      options?: Array<{ label: string; value: unknown }>;
      value?: unknown;
      onChange?: (value: unknown) => void;
    }) => (
      <div>
        <span>{String(value)}</span>
        {options.map((option) => (
          <button key={String(option.value)} type="button" onClick={() => onChange?.(option.value)}>
            {option.label}
          </button>
        ))}
      </div>
    ),
    useWorkflowVariableOptions: () => holder.upstreamVariables,
    useFlowContext: () => ({ nodes: [] }),
    useStyles: () => ({ styles: { nodeSubtreeClass: '', branchBlockClass: '', branchClass: '', loopLineClass: '' } }),
    Branch: () => null,
    NodeDefaultView: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    useNodeContext: () => holder.node,
  };
});

vi.mock('@nocobase/flow-engine', async () => {
  const actual = await vi.importActual<object>('@nocobase/flow-engine');
  return {
    ...actual,
    useFlowEngine: () => ({
      context: {
        t: (key: string) => key,
      },
    }),
    loadMetaTreeChildren: async () => [],
  };
});

vi.mock('../../locale', () => ({
  useT: () => (key: string) => key,
}));

describe('LoopFieldset', () => {
  beforeEach(() => {
    holder.node = { id: 1, key: 'loopNode', title: 'Loop node', config: { target: 1 } };
    holder.upstreamVariables = [];
    holder.conditionVariables = [];
  });

  it('renders the loop condition editor after target exists and toggles it on', async () => {
    render(
      <Form>
        <LoopFieldset />
      </Form>,
    );

    expect(screen.getByText('Enable loop condition')).toBeInTheDocument();
    expect(screen.queryByText('Before each starts')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Enable loop condition'));

    expect(await screen.findByText('Before each starts')).toBeInTheDocument();
    expect(screen.getByText('Exit loop')).toBeInTheDocument();
    expect(screen.getByText('Continue on next item')).toBeInTheDocument();
  });

  function renderCondition() {
    render(
      <Form>
        <LoopFieldset />
      </Form>,
    );
    fireEvent.change(screen.getByLabelText('loop-target'), { target: { value: String(holder.node.config.target) } });
    fireEvent.click(screen.getByText('Enable loop condition'));
    return holder.conditionVariables.find((node) => node.name === '$scopes');
  }

  it.each([3, 'abc', '{{$context.items}}'])('enables the current loop scope for target %s', (target) => {
    holder.node.config.target = target;
    const placeholder: MetaTreeNode = {
      name: '$scopes',
      title: 'Scope variables',
      type: '',
      paths: ['$scopes'],
      disabled: true,
    };
    holder.upstreamVariables = [
      placeholder,
      {
        name: '$context',
        title: 'Trigger variables',
        type: '',
        paths: ['$context'],
        children: [{ name: 'items', title: 'Items', type: 'array', paths: ['$context', 'items'] }],
      },
    ];

    const root = renderCondition();
    expect(root?.disabled).not.toBe(true);
    const scopes = Array.isArray(root?.children) ? root.children : [];
    expect(scopes.map((node) => node.name)).toEqual(['loopNode']);
    const variables = Array.isArray(scopes[0]?.children) ? scopes[0].children : [];
    expect(variables.map((node) => node.name)).toEqual(['item', 'index', 'sequence', 'length']);
    expect(variables.map((node) => node.paths)).toEqual([
      ['$scopes', 'loopNode', 'item'],
      ['$scopes', 'loopNode', 'index'],
      ['$scopes', 'loopNode', 'sequence'],
      ['$scopes', 'loopNode', 'length'],
    ]);
    // Keep the shared empty-scope placeholder disabled for other consumers.
    expect(placeholder.disabled).toBe(true);
    expect(placeholder.children).toBeUndefined();
    expect(holder.conditionVariables[1]).toBe(holder.upstreamVariables[1]);
  });

  it('preserves outer-loop variables and replaces a duplicate current-loop entry', () => {
    const outer: MetaTreeNode = {
      name: 'outer',
      title: 'Outer loop',
      type: '',
      paths: ['$scopes', 'outer'],
      children: [{ name: 'index', title: 'Index', type: 'number', paths: ['$scopes', 'outer', 'index'] }],
    };
    holder.upstreamVariables = [
      {
        name: '$scopes',
        title: 'Scope variables',
        type: '',
        paths: ['$scopes'],
        children: [outer, { name: 'loopNode', title: 'Old entry', type: '', paths: ['$scopes', 'loopNode'] }],
      },
    ];
    const root = renderCondition();
    expect(root?.disabled).not.toBe(true);
    const scopes = Array.isArray(root?.children) ? root.children : [];
    expect(scopes.map((node) => node.name)).toEqual(['loopNode', 'outer']);
    expect(scopes[1]).toBe(outer);
    expect(scopes[0].title).toBe('Loop node');
  });

  it('creates an enabled scope when the upstream tree has no scope root', () => {
    const root = renderCondition();
    expect(root?.name).toBe('$scopes');
    expect(root?.disabled).not.toBe(true);
    expect(root?.children).toEqual([expect.objectContaining({ name: 'loopNode' })]);
  });
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HideVariableContext } from '../HideVariableContext';
import { WorkflowVariableWrapper } from '../WorkflowVariableWrapper';

const holder = vi.hoisted(() => ({
  selectorProps: null as null | Record<string, unknown>,
  workflowVariableTagProps: null as null | Record<string, unknown>,
}));

vi.mock('@nocobase/flow-engine', () => ({
  FlowContextSelector: (props: any) => {
    holder.selectorProps = props;
    return (
      <button onClick={() => props.onChange?.('{{$context.user.id}}', { paths: ['$context', 'user', 'id'] })}>
        pick-variable
      </button>
    );
  },
}));

vi.mock('../../canvas/useWorkflowVariableOptions', () => ({
  useWorkflowVariableOptions: vi.fn(),
}));

vi.mock('../../canvas/WorkflowVariableTag', () => ({
  isWorkflowVariableValue: (value: unknown) => typeof value === 'string' && /^\{\{\s*[^{}]+?\s*\}\}$/.test(value),
  WorkflowVariableTag: (props: any) => {
    holder.workflowVariableTagProps = props;
    return (
      <button type="button" aria-label="workflow-variable-tag" onClick={() => props.onClear?.()}>
        {props.value}
      </button>
    );
  },
}));

describe('WorkflowVariableWrapper', () => {
  it('renders the wrapped field when there are no matching workflow variables', async () => {
    const { useWorkflowVariableOptions } = await import('../../canvas/useWorkflowVariableOptions');
    vi.mocked(useWorkflowVariableOptions).mockReturnValueOnce([]);

    render(<WorkflowVariableWrapper render={() => <div data-testid="wrapped-field" />} />);

    expect(screen.getByTestId('wrapped-field')).toBeInTheDocument();
    expect(screen.queryByText('pick-variable')).toBeNull();
  });

  it('switches from the wrapped field to a variable tag after selecting a workflow variable', async () => {
    const { useWorkflowVariableOptions } = await import('../../canvas/useWorkflowVariableOptions');
    vi.mocked(useWorkflowVariableOptions).mockReturnValue([
      { name: '$context', title: 'Trigger variables', type: 'object', paths: ['$context'], children: [] },
    ] as any);
    const handleChange = vi.fn();

    const { rerender } = render(
      <WorkflowVariableWrapper
        value={123}
        onChange={handleChange}
        render={({ value }) => <div data-testid="wrapped-field">{String(value)}</div>}
      />,
    );

    expect(screen.getByTestId('wrapped-field')).toHaveTextContent('123');

    fireEvent.click(screen.getByText('pick-variable'));

    expect(handleChange).toHaveBeenCalledWith('{{$context.user.id}}');

    rerender(
      <WorkflowVariableWrapper
        value="{{$context.user.id}}"
        onChange={handleChange}
        render={({ value }) => <div data-testid="wrapped-field">{String(value)}</div>}
      />,
    );

    expect(screen.queryByTestId('wrapped-field')).toBeNull();
    expect(screen.getByRole('button', { name: 'workflow-variable-tag' })).toHaveTextContent('{{$context.user.id}}');
    expect(holder.workflowVariableTagProps?.metaTree).toBeTruthy();
  });

  it('clears the selected variable back to null by default', async () => {
    const { useWorkflowVariableOptions } = await import('../../canvas/useWorkflowVariableOptions');
    vi.mocked(useWorkflowVariableOptions).mockReturnValue([
      { name: '$context', title: 'Trigger variables', type: 'object', paths: ['$context'], children: [] },
    ] as any);
    const handleChange = vi.fn();

    render(
      <WorkflowVariableWrapper
        value="{{$context.user.id}}"
        onChange={handleChange}
        render={() => <div data-testid="wrapped-field" />}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'workflow-variable-tag' }));

    expect(handleChange).toHaveBeenCalledWith(null);
  });

  it('re-renders a saved workflow variable through the workflow-aware tag path on reopen', async () => {
    const { useWorkflowVariableOptions } = await import('../../canvas/useWorkflowVariableOptions');
    vi.mocked(useWorkflowVariableOptions).mockReturnValue([
      {
        name: '$jobsMapByNodeKey',
        title: 'Node result',
        type: 'object',
        paths: ['$jobsMapByNodeKey'],
        children: [
          {
            name: 'jsonCalc',
            title: 'JSON calc',
            type: 'object',
            paths: ['$jobsMapByNodeKey', 'jsonCalc'],
            children: [{ name: 'id', title: 'ID', type: 'string', paths: ['$jobsMapByNodeKey', 'jsonCalc', 'id'] }],
          },
        ],
      },
    ] as any);

    render(
      <WorkflowVariableWrapper
        value="{{$jobsMapByNodeKey.jsonCalc.id}}"
        render={() => <div data-testid="wrapped-field" />}
      />,
    );

    expect(screen.getByRole('button', { name: 'workflow-variable-tag' })).toHaveTextContent(
      '{{$jobsMapByNodeKey.jsonCalc.id}}',
    );
    expect(holder.workflowVariableTagProps?.metaTree).toBeTruthy();
  });

  it('falls back to the wrapped field when the hide-variable context is enabled', async () => {
    const { useWorkflowVariableOptions } = await import('../../canvas/useWorkflowVariableOptions');
    vi.mocked(useWorkflowVariableOptions).mockReturnValue([
      { name: '$context', title: 'Trigger variables', type: 'object', paths: ['$context'], children: [] },
    ] as any);

    render(
      <HideVariableContext.Provider value>
        <WorkflowVariableWrapper render={() => <div data-testid="wrapped-field" />} />
      </HideVariableContext.Provider>,
    );

    expect(screen.getByTestId('wrapped-field')).toBeInTheDocument();
    expect(screen.queryByText('pick-variable')).toBeNull();
  });
});

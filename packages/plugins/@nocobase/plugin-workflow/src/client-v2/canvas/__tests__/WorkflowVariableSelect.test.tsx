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

const holder = vi.hoisted(() => ({
  selectorProps: null as any,
}));

vi.mock('@nocobase/flow-engine', () => ({
  FlowContextSelector: (props: any) => {
    holder.selectorProps = props;
    return (
      <button
        type="button"
        aria-label="workflow-variable-select-trigger"
        onClick={() => props.onChange?.('{{$context.id}}')}
      >
        x
      </button>
    );
  },
  loadMetaTreeChildren: vi.fn(async (meta: any) => meta?.children?.() ?? []),
  useFlowContext: () => ({
    t: (text: string) => text,
  }),
}));

vi.mock('../useWorkflowVariableOptions', () => ({
  useWorkflowVariableOptions: vi.fn(() => [
    {
      name: '$context',
      title: 'Trigger variables',
      type: 'object',
      paths: ['$context'],
      children: [{ name: 'id', title: 'id', type: 'string', paths: ['$context', 'id'] }],
    },
  ]),
}));

import { WorkflowVariableSelect } from '../WorkflowVariableSelect';

describe('WorkflowVariableSelect', () => {
  it('renders a readonly placeholder input before a variable is selected', () => {
    render(<WorkflowVariableSelect placeholder="Select variable" />);

    const input = screen.getByPlaceholderText('Select variable');
    expect(input).toHaveAttribute('readonly');
    expect(screen.queryByRole('button', { name: 'workflow-variable-select-value' })).toBeNull();
    expect(holder.selectorProps?.active).toBe(false);
  });

  it('renders the variable tag and keeps the selector active only for variable values', () => {
    render(<WorkflowVariableSelect value="{{$context.id}}" />);

    expect(screen.getByRole('button', { name: 'workflow-variable-select-value' })).toHaveTextContent(
      'Trigger variables / id',
    );
    expect(holder.selectorProps?.active).toBe(true);
    expect(holder.selectorProps?.value).toBe('{{$context.id}}');
  });

  it('clears the selected variable to null through the tag clear handler', () => {
    const onChange = vi.fn();
    render(<WorkflowVariableSelect value="{{$context.id}}" onChange={onChange} />);

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'workflow-variable-select-value' }));
    fireEvent.click(screen.getByLabelText('workflow-variable-select-clear'));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('propagates selected workflow variables from the selector', () => {
    const onChange = vi.fn();
    render(<WorkflowVariableSelect onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'workflow-variable-select-trigger' }));

    expect(onChange).toHaveBeenCalledWith('{{$context.id}}');
  });
});

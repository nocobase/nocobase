/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TestRunButton } from '../TestRunButton';

const holder = vi.hoisted(() => ({
  dialogOptions: null as any,
  currentWorkflow: { id: 1, type: 'collection', config: { collection: 'roles' } } as any,
  typedVariableInputProps: [] as Array<{ value: unknown; defaultToFirstConstantTypeWhenUndefined?: boolean }>,
}));
const mockContexts = vi.hoisted(() => {
  const React = require('react');
  return {
    CurrentWorkflowContext: React.createContext({}),
    NodeContext: React.createContext({}),
  };
});

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({
    api: {
      resource: () => ({
        test: vi.fn(),
      }),
    },
    viewer: {
      dialog: (options: any) => {
        holder.dialogOptions = options;
      },
    },
  }),
}));

vi.mock('../../locale', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('../../canvas/contexts', () => {
  return {
    CurrentWorkflowContext: mockContexts.CurrentWorkflowContext,
    NodeContext: mockContexts.NodeContext,
    useCurrentWorkflowContext: () => React.useContext(mockContexts.CurrentWorkflowContext),
  };
});

vi.mock('../../canvas/WorkflowVariableInput', () => ({
  WorkflowVariableInput: () => {
    const workflow = React.useContext(mockContexts.CurrentWorkflowContext);
    return <div data-testid="workflow-variable-pill">{workflow?.type ? 'resolved-pill' : 'raw-template'}</div>;
  },
}));

vi.mock('@nocobase/client-v2', () => ({
  TypedVariableInput: (props: any) => {
    holder.typedVariableInputProps.push({
      value: props.value,
      defaultToFirstConstantTypeWhenUndefined: props.defaultToFirstConstantTypeWhenUndefined,
    });
    return <div data-testid="typed-variable-input" />;
  },
}));

vi.mock('@nocobase/utils/client', () => ({
  parse: () => {
    const fn = (values: any) => values;
    fn.parameters = [{ key: '$context.data.name' }];
    return fn;
  },
}));

describe('TestRunButton', () => {
  it('re-provides the explicit workflow prop into the detached dialog content', () => {
    holder.typedVariableInputProps = [];

    render(
      <TestRunButton
        data={{ type: 'condition', config: {} }}
        form={{ getFieldsValue: () => ({ config: {} }) }}
        workflow={holder.currentWorkflow}
      />,
    );

    fireEvent.click(screen.getByText('Test run').closest('button') as HTMLButtonElement);

    expect(holder.dialogOptions).toBeTruthy();

    render(holder.dialogOptions.content());

    expect(screen.getByTestId('workflow-variable-pill')).toHaveTextContent('resolved-pill');
    expect(screen.getByTestId('typed-variable-input')).toBeInTheDocument();
    expect(holder.typedVariableInputProps).toEqual([
      {
        value: undefined,
        defaultToFirstConstantTypeWhenUndefined: true,
      },
    ]);
  });
});

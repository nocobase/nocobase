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
import { describe, expect, it, vi } from 'vitest';
import { LoopFieldset } from '../components/loop';

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
    CalculationConfig: ({ value, onChange }: { value?: unknown; onChange?: (value: unknown) => void }) => (
      <button type="button" onClick={() => onChange?.({ next: true })}>
        {JSON.stringify(value)}
      </button>
    ),
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
    useWorkflowVariableOptions: () => [],
    useFlowContext: () => ({ nodes: [] }),
    useStyles: () => ({ styles: { nodeSubtreeClass: '', branchBlockClass: '', branchClass: '', loopLineClass: '' } }),
    Branch: () => null,
    NodeDefaultView: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    useNodeContext: () => ({ id: 1, key: 'loopNode', title: 'Loop node', config: { target: 1 } }),
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
});

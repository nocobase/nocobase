/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({
  engine: null as any,
  currentNode: null as any,
  workflow: null as any,
}));

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    FlowContextSelector: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    useFlowEngine: () => holder.engine,
    useFlowContext: () => holder.engine?.context,
  };
});

vi.mock('../contexts', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useNodeContext: () => holder.currentNode,
    useCurrentWorkflowContext: () => holder.workflow,
  };
});

import { WorkflowVariableTextArea } from '../WorkflowVariableTextArea';

describe('WorkflowVariableTextArea', () => {
  it('renders a textarea with the workflow variable selector button', () => {
    holder.engine = {
      context: {
        t: (key: string) => key,
        getPropertyMetaTree: () => [],
        app: {
          pm: {
            get: () => undefined,
          },
        },
      },
    };
    holder.currentNode = { key: 'n1', type: 'notification', upstream: null };
    holder.workflow = { id: 1, type: 'collection', config: {} };

    render(<WorkflowVariableTextArea value="Hello" onChange={() => undefined} rows={4} />);

    expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'x' })).toBeInTheDocument();
  });
});

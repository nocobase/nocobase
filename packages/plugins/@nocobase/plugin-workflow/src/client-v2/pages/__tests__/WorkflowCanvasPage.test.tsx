/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import WorkflowCanvasPage from '../WorkflowCanvasPage';

const holder = vi.hoisted(() => ({
  getWorkflow: vi.fn(),
  listRevisions: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useParams: () => ({ id: '363644683878400' }),
  };
});

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    useFlowContext: () => ({
      api: {
        resource: (name: string) => {
          if (name !== 'workflows') {
            throw new Error(`Unexpected resource: ${name}`);
          }
          return {
            get: holder.getWorkflow,
            list: holder.listRevisions,
          };
        },
      },
    }),
  };
});

vi.mock('../../components/WorkflowCanvasHeader', () => ({
  WorkflowCanvasHeader: ({ record }: { record: { title?: string } }) => (
    <div data-testid="workflow-header">{record.title}</div>
  ),
}));

vi.mock('../../locale', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('../../canvas/CanvasContent', () => ({
  CanvasContent: () => <div data-testid="workflow-canvas" />,
}));

vi.mock('../../canvas/AddNodeContext', () => ({
  AddNodeContextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../canvas/RemoveNodeContext', () => ({
  RemoveNodeContextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../canvas/NodeClipboardContext', () => ({
  NodeClipboardContextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../canvas/NodeDragContext', () => ({
  NodeDragContextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('WorkflowCanvasPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
    document.title = '';
  });

  it('updates the browser title after the workflow record is loaded', async () => {
    document.title = 'Loading...';
    holder.getWorkflow.mockResolvedValue({
      data: {
        data: {
          id: '363644683878400',
          key: 'approval-workflow',
          title: '审批',
          nodes: [],
        },
      },
    });
    holder.listRevisions.mockResolvedValue({ data: { data: [] } });

    render(<WorkflowCanvasPage />);

    await screen.findByTestId('workflow-header');
    await waitFor(() => {
      expect(document.title).toBe('Workflow: 审批 - NocoBase');
    });
  });
});

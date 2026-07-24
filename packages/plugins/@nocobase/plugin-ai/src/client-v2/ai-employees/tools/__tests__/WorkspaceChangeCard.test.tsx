/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { WorkspaceChangeCard } from '../WorkspaceChangeCard';

vi.mock('../../../locale', () => ({
  useT: () => (key: string) => key,
}));

const tools = {
  scope: 'GENERAL' as const,
  from: 'loader' as const,
  definition: { name: 'executeFrontendTool', description: 'Execute frontend tool' },
};

function renderCard(
  toolCall: Record<string, unknown>,
  decisions = { approve: vi.fn(), edit: vi.fn(), reject: vi.fn() },
) {
  render(
    <WorkspaceChangeCard decisions={decisions} messageId="message-1" tools={tools} toolCall={toolCall as never} />,
  );
  return decisions;
}

describe('WorkspaceChangeCard', () => {
  it('renders stable multi-file prepare semantics, expandable diffs, and unsaved status', () => {
    renderCard({
      id: 'call-1',
      name: 'executeFrontendTool',
      invokeStatus: 'done',
      auto: true,
      status: 'success',
      args: {
        toolId: 'workspace-1:workspacePrepareChanges',
        args: { baseSnapshotId: 'snapshot-1', changes: [] },
      },
      content: {
        planId: 'plan-1',
        diffs: [
          { path: 'src/index.ts', status: 'modified', before: 'return 1;', after: 'return helper;' },
          { path: 'src/helper.ts', status: 'created', after: 'export const helper = 1;' },
        ],
        warnings: [],
        saved: false,
      },
    });

    const card = screen.getByTestId('workspace-change-card');
    expect(card).toHaveAttribute('data-workspace-action', 'prepare');
    expect(screen.getByTestId('workspace-change-card-status')).toHaveTextContent('Workspace change completed');
    expect(screen.getAllByTestId('workspace-change-path')).toHaveLength(2);
    expect(screen.getByText('src/index.ts')).toBeTruthy();
    expect(screen.getByText('src/helper.ts')).toBeTruthy();
    expect(screen.getByTestId('workspace-change-card-saved')).toHaveTextContent('Not saved');

    fireEvent.click(screen.getByRole('button', { name: 'Expand changes for src/index.ts' }));
    expect(screen.getByLabelText('Changes for src/index.ts')).toHaveTextContent('+++ after');
  });

  it('uses the runtime Allow use action for ASK apply without adding a second apply button', () => {
    const decisions = renderCard({
      id: 'call-2',
      name: 'executeFrontendTool',
      invokeStatus: 'interrupted',
      auto: false,
      args: { toolId: 'workspace-1:workspaceApplyPreparedChanges', args: { planId: 'plan-1' } },
    });

    expect(screen.getByTestId('workspace-change-card')).toHaveAttribute('data-workspace-action', 'apply');
    expect(screen.getByTestId('workspace-change-card-status')).toHaveTextContent('Waiting for approval');
    const allowUse = screen.getByRole('button', { name: 'Allow use' });
    fireEvent.click(allowUse);
    expect(decisions.approve).toHaveBeenCalledTimes(1);
    expect(within(screen.getByTestId('workspace-change-card')).queryByRole('button', { name: /apply/i })).toBeNull();
  });

  it('exposes a stable error state and preserves non-workspace frontend tool execution UI', () => {
    const { rerender } = render(
      <WorkspaceChangeCard
        decisions={{ approve: vi.fn(), edit: vi.fn(), reject: vi.fn() }}
        messageId="message-1"
        tools={tools}
        toolCall={
          {
            id: 'call-3',
            name: 'executeFrontendTool',
            invokeStatus: 'done',
            auto: true,
            status: 'error',
            args: { toolId: 'workspace-1:workspaceApplyPreparedChanges', args: { planId: 'plan-1' } },
            content: {
              status: 'error',
              content: { code: 'STALE_SNAPSHOT', message: 'Raw workspace error must not be displayed' },
            },
          } as never
        }
      />,
    );
    expect(screen.getByTestId('workspace-change-card-error')).toHaveTextContent('Workspace snapshot is stale');
    expect(screen.getByTestId('workspace-change-card-error')).not.toHaveTextContent(
      'Raw workspace error must not be displayed',
    );

    rerender(
      <WorkspaceChangeCard
        decisions={{ approve: vi.fn(), edit: vi.fn(), reject: vi.fn() }}
        messageId="message-1"
        tools={tools}
        toolCall={
          {
            id: 'call-4',
            name: 'executeFrontendTool',
            invokeStatus: 'interrupted',
            auto: false,
            args: { toolId: 'block-1:refresh_dashboard', args: {} },
          } as never
        }
      />,
    );
    expect(screen.getByTestId('frontend-tool-execution-card')).toHaveTextContent('block-1:refresh_dashboard');
    expect(screen.getByRole('button', { name: 'Allow use' })).toBeTruthy();
  });

  it('uses the translated generic error for unknown workspace error codes', () => {
    renderCard({
      id: 'call-unknown-error',
      name: 'executeFrontendTool',
      invokeStatus: 'done',
      auto: true,
      status: 'error',
      args: { toolId: 'workspace-1:workspacePrepareChanges', args: { changes: [] } },
      content: {
        status: 'error',
        content: { code: 'UNKNOWN_WORKSPACE_ERROR', message: 'Unknown raw workspace error' },
      },
    });

    expect(screen.getByTestId('workspace-change-card-error')).toHaveTextContent('Workspace tool execution failed.');
    expect(screen.getByTestId('workspace-change-card-error')).not.toHaveTextContent('Unknown raw workspace error');
  });

  it('can transition from streaming fallback arguments to a workspace card without changing hook order', () => {
    const props = {
      decisions: { approve: vi.fn(), edit: vi.fn(), reject: vi.fn() },
      messageId: 'message-1',
      tools,
    };
    const { rerender } = render(
      <WorkspaceChangeCard
        {...props}
        toolCall={
          {
            id: 'call-streaming',
            name: 'executeFrontendTool',
            invokeStatus: 'pending',
            args: '{"toolId":"workspace-1:workspacePre',
          } as never
        }
      />,
    );

    expect(screen.getByTestId('frontend-tool-execution-card')).toBeTruthy();

    rerender(
      <WorkspaceChangeCard
        {...props}
        toolCall={
          {
            id: 'call-streaming',
            name: 'executeFrontendTool',
            invokeStatus: 'done',
            status: 'success',
            args: {
              toolId: 'workspace-1:workspacePrepareChanges',
              args: { baseSnapshotId: 'snapshot-1', changes: [] },
            },
            content: { diffs: [], saved: false },
          } as never
        }
      />,
    );

    expect(screen.getByTestId('workspace-change-card')).toHaveAttribute('data-workspace-action', 'prepare');
  });
});

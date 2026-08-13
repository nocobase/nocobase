/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatBoxRuntimeProvider, createChatBoxRuntime } from '../../chatbox/stores/runtime';
import type { Message, ToolCall } from '../../types';
import { WorkspaceChangeCard } from '../WorkspaceChangeCard';

vi.mock('../../../locale', () => ({
  useT: () => (key: string) => key,
}));

const tools = {
  scope: 'GENERAL' as const,
  from: 'loader' as const,
  definition: { name: 'executeFrontendTool', description: 'Execute frontend tool' },
};

const decisions = () => ({ approve: vi.fn(async () => undefined), edit: vi.fn(), reject: vi.fn() });

function createToolCall(input: Partial<ToolCall<unknown>> & Pick<ToolCall<unknown>, 'id' | 'args'>): ToolCall<unknown> {
  return {
    type: 'function',
    name: 'executeFrontendTool',
    invokeStatus: 'done',
    auto: true,
    status: 'success',
    ...input,
  };
}

function createMessage(messageId: string, toolCalls: ToolCall<unknown>[]): Message {
  return {
    key: messageId,
    role: 'assistant',
    content: { type: 'text', content: '', messageId, tool_calls: toolCalls },
  };
}

function prepareToolCall(id: string, surfaceId: string, planId: string) {
  const args = {
    toolId: `${surfaceId}:workspacePrepareChanges`,
    args: {
      baseSnapshotId: 'snapshot-1',
      changes: [
        { type: 'update', path: 'src/index.ts', baseHash: 'hash-1', content: 'return helper;' },
        { type: 'create', path: 'src/helper.ts', content: 'export const helper = 1;' },
        { type: 'delete', path: 'src/legacy.ts', baseHash: 'hash-legacy' },
      ],
    },
  };
  const content = {
    status: 'success',
    content: {
      planId,
      surfaceId,
      diffs: [
        { path: 'src/index.ts', status: 'modified', before: 'return 1;', after: 'return helper;' },
        { path: 'src/helper.ts', status: 'created', after: 'export const helper = 1;' },
        { path: 'src/legacy.ts', status: 'deleted', before: 'export const legacy = true;' },
      ],
      saved: false,
    },
  };
  return createToolCall({
    id,
    args,
    content,
  });
}

function applyToolCall(id: string, surfaceId: string, planId: string) {
  const args = { toolId: `${surfaceId}:workspaceApplyPreparedChanges`, args: { planId } };
  return createToolCall({
    id,
    invokeStatus: 'interrupted',
    auto: false,
    status: undefined,
    args,
    content: undefined,
  });
}

function renderCard(toolCall: ToolCall<unknown>, messages: Message[] = [], actions = decisions()) {
  const runtime = createChatBoxRuntime();
  runtime.chatConversationModel.setCurrentConversation('session-1');
  runtime.chatMessageModel.setSessionMessages('session-1', messages);
  render(
    <ChatBoxRuntimeProvider runtime={runtime}>
      <WorkspaceChangeCard decisions={actions} messageId="message-current" tools={tools} toolCall={toolCall} />
    </ChatBoxRuntimeProvider>,
  );
  return { actions, runtime };
}

function renderReadonlyCard(toolCall: ToolCall<unknown>, actions = decisions()) {
  const runtime = createChatBoxRuntime();
  runtime.chatBoxModel.setReadonly(true);
  render(
    <ChatBoxRuntimeProvider runtime={runtime}>
      <WorkspaceChangeCard decisions={actions} messageId="message-current" tools={tools} toolCall={toolCall} />
    </ChatBoxRuntimeProvider>,
  );
  return actions;
}

describe('WorkspaceChangeCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders A/M/D prepare files, complete expandable diffs, and unsaved status', () => {
    const prepare = prepareToolCall('prepare-1', 'workspace-1', 'plan-1');
    renderCard(prepare);

    expect(screen.getByTestId('workspace-change-card')).toHaveAttribute('data-workspace-action', 'prepare');
    expect(screen.getAllByTestId('workspace-change-path')).toHaveLength(3);
    expect(screen.getByText('M')).toBeTruthy();
    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByText('D')).toBeTruthy();
    expect(screen.getByTestId('workspace-change-card-saved')).toHaveTextContent('Not saved');

    fireEvent.click(screen.getByRole('button', { name: 'Expand changes for src/index.ts' }));
    expect(screen.getByLabelText('Changes for src/index.ts')).toHaveTextContent('return 1;');
    expect(screen.getByLabelText('Changes for src/index.ts')).toHaveTextContent('return helper;');
    fireEvent.click(screen.getByRole('button', { name: 'Expand changes for src/helper.ts' }));
    expect(screen.getByLabelText('Changes for src/helper.ts')).toHaveTextContent('export const helper = 1;');
    fireEvent.click(screen.getByRole('button', { name: 'Expand changes for src/legacy.ts' }));
    expect(screen.getByLabelText('Changes for src/legacy.ts')).toHaveTextContent('export const legacy = true;');
  });

  it('recovers the exact prepared diff for ASK apply while keeping apply args planId-only', () => {
    const prepare = prepareToolCall('prepare-1', 'workspace-1', 'plan-1');
    const apply = applyToolCall('apply-1', 'workspace-1', 'plan-1');
    const { actions } = renderCard(apply, [
      createMessage('message-prepare', [prepare]),
      createMessage('message-current', [apply]),
    ]);

    expect(screen.getByTestId('workspace-change-card')).toHaveAttribute('data-workspace-action', 'apply');
    expect(screen.getAllByTestId('workspace-change-path')).toHaveLength(3);
    expect(screen.getByText('src/index.ts')).toBeTruthy();
    expect(screen.getByText('src/helper.ts')).toBeTruthy();
    expect(screen.getByText('src/legacy.ts')).toBeTruthy();
    expect(screen.getByTestId('workspace-change-card-saved')).toHaveTextContent('Not saved');

    const allowUse = screen.getByRole('button', { name: 'Allow use' });
    fireEvent.click(allowUse);
    expect(actions.approve).toHaveBeenCalledTimes(1);
    expect(within(screen.getByTestId('workspace-change-card')).queryByRole('button', { name: /apply/i })).toBeNull();
  });

  it('does not borrow diffs from a different plan or surface', () => {
    const apply = applyToolCall('apply-1', 'workspace-1', 'plan-expected');
    renderCard(apply, [
      createMessage('message-prepare', [
        prepareToolCall('wrong-plan', 'workspace-1', 'plan-other'),
        prepareToolCall('wrong-surface', 'workspace-2', 'plan-expected'),
      ]),
      createMessage('message-current', [apply]),
    ]);

    expect(screen.queryByTestId('workspace-change-card-paths')).toBeNull();
    expect(screen.queryByText('src/index.ts')).toBeNull();
  });

  it('shows localized safe errors and preserves non-workspace frontend tool fallback', () => {
    const workspaceError = createToolCall({
      id: 'workspace-error',
      args: { toolId: 'workspace-1:workspaceApplyPreparedChanges', args: { planId: 'plan-1' } },
      status: 'error',
      content: {
        status: 'error',
        content: { code: 'STALE_SNAPSHOT', message: 'Raw workspace error must not be displayed' },
      },
    });
    const { rerender } = render(
      <ChatBoxRuntimeProvider runtime={createChatBoxRuntime()}>
        <WorkspaceChangeCard decisions={decisions()} messageId="message-1" tools={tools} toolCall={workspaceError} />
      </ChatBoxRuntimeProvider>,
    );
    expect(screen.getByTestId('workspace-change-card-error')).toHaveTextContent('Workspace snapshot is stale');
    expect(screen.getByTestId('workspace-change-card-error')).not.toHaveTextContent(
      'Raw workspace error must not be displayed',
    );

    const fallbackActions = decisions();
    rerender(
      <ChatBoxRuntimeProvider runtime={createChatBoxRuntime()}>
        <WorkspaceChangeCard
          decisions={fallbackActions}
          messageId="message-1"
          tools={tools}
          toolCall={createToolCall({
            id: 'fallback',
            invokeStatus: 'interrupted',
            auto: false,
            status: undefined,
            args: { toolId: 'block-1:refresh_dashboard', args: {} },
          })}
        />
      </ChatBoxRuntimeProvider>,
    );
    expect(screen.getByTestId('frontend-tool-execution-card')).toHaveTextContent('block-1:refresh_dashboard');
    fireEvent.click(screen.getByRole('button', { name: 'Allow use' }));
    expect(fallbackActions.approve).toHaveBeenCalledTimes(1);
  });

  it('disables workspace and fallback approval in readonly conversations', () => {
    const workspaceActions = renderReadonlyCard(applyToolCall('apply-readonly', 'workspace-1', 'plan-1'));
    const workspaceButton = screen.getByRole('button', { name: 'Allow use' });
    expect(workspaceButton).toBeDisabled();
    fireEvent.click(workspaceButton);
    expect(workspaceActions.approve).not.toHaveBeenCalled();

    cleanup();
    const fallbackActions = renderReadonlyCard(
      createToolCall({
        id: 'fallback-readonly',
        invokeStatus: 'interrupted',
        auto: false,
        status: undefined,
        args: { toolId: 'block-1:refresh_dashboard', args: { refresh: true } },
      }),
    );
    const fallbackButton = screen.getByRole('button', { name: 'Allow use' });
    expect(fallbackButton).toBeDisabled();
    fireEvent.click(fallbackButton);
    expect(fallbackActions.approve).not.toHaveBeenCalled();
  });
});

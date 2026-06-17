/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it } from 'vitest';
import type { Message } from '../../../types';
import { useChatToolCallStore } from '../chat-tool-call';
import { useChatToolsStore } from '../chat-tools';
import { useWorkflowTasksStore, type WorkflowTask } from '../workflow-tasks';

const resetStores = () => {
  useChatToolCallStore.setState({ sessions: {} });
  useChatToolsStore.setState({
    toolsByName: {},
    toolsByMessageId: {},
    openToolModal: false,
    activeTool: null,
    activeMessageId: '',
    adjustArgs: {},
  });
  useWorkflowTasksStore.setState({
    workflowTasks: [],
    currentWorkflowTask: undefined,
    unreadCount: 0,
    loading: false,
    keyword: '',
    selectedJobStatus: undefined,
  });
};

const messageWithToolCalls = (messageId: string, toolCalls: Message['content']['tool_calls']): Message => ({
  key: messageId,
  role: 'assistant',
  content: {
    type: 'text',
    content: '',
    messageId,
    tool_calls: toolCalls,
  },
});

const workflowTask = (sessionId: string): WorkflowTask => ({
  id: sessionId,
  sessionId,
  workflowTitle: 'Approval',
  nodeTitle: 'Review',
  status: 'pending',
});

afterEach(() => {
  resetStores();
});

describe('client-v2 chatbox stores', () => {
  it('tracks interrupted tool calls per session and migrates session state', () => {
    const draftSnapshot = useChatToolCallStore.getState().getSessionState('draft-session');

    useChatToolCallStore.getState().updateToolCallInvokeStatus('draft-session', 'message-a', 'tool-a', 'interrupted');
    useChatToolCallStore.getState().updateToolCallInvokeStatus('other-session', 'message-a', 'tool-a', 'waiting');

    expect(draftSnapshot.toolCalls).toEqual({});
    expect(useChatToolCallStore.getState().isInterrupted('draft-session', 'message-a', 'tool-a')).toBe(true);
    expect(useChatToolCallStore.getState().isAllWaiting('draft-session', 'message-a')).toBe(false);

    useChatToolCallStore.getState().updateToolCallInvokeStatus('draft-session', 'message-a', 'tool-a', 'waiting');
    expect(useChatToolCallStore.getState().isAllWaiting('draft-session', 'message-a')).toBe(true);

    useChatToolCallStore.getState().migrateSessionState('draft-session', 'created-session');

    expect(useChatToolCallStore.getState().getInvokeStatus('created-session', 'message-a', 'tool-a')).toBe('waiting');
    expect(useChatToolCallStore.getState().getSessionState('draft-session').toolCalls).toEqual({});
    expect(useChatToolCallStore.getState().getInvokeStatus('other-session', 'message-a', 'tool-a')).toBe('waiting');
  });

  it('indexes tool calls by name and message id with stable versions', () => {
    useChatToolsStore.getState().updateTools([
      messageWithToolCalls('message-a', [
        {
          id: 'tool-a',
          type: 'function',
          name: 'getSkill',
          invokeStatus: 'done',
          auto: false,
          args: { skill: 'alpha' },
        },
      ]),
      messageWithToolCalls('message-b', [
        {
          id: 'tool-b',
          type: 'function',
          name: 'getSkill',
          invokeStatus: 'done',
          auto: true,
          args: { skill: 'beta' },
        },
      ]),
    ]);

    expect(useChatToolsStore.getState().toolsByName.getSkill).toHaveLength(2);
    expect(useChatToolsStore.getState().toolsByName.getSkill[0]).toMatchObject({
      id: 'tool-a',
      messageId: 'message-a',
    });
    expect(useChatToolsStore.getState().toolsByMessageId['message-b']['tool-b']).toMatchObject({
      name: 'getSkill',
      version: 2,
    });
  });

  it('updates workflow task state through direct and functional setters', () => {
    useWorkflowTasksStore.getState().setWorkflowTasks([workflowTask('session-a')]);
    useWorkflowTasksStore.getState().setWorkflowTasks((previous) => [...previous, workflowTask('session-b')]);
    useWorkflowTasksStore.getState().setUnreadCount((previous) => previous + 2);
    useWorkflowTasksStore.getState().setCurrentWorkflowTask((previous) => ({
      ...(previous ?? workflowTask('session-b')),
      readonly: true,
    }));
    useWorkflowTasksStore.getState().setLoading(true);
    useWorkflowTasksStore.getState().setKeyword('review');
    useWorkflowTasksStore.getState().setSelectedJobStatus(1);

    expect(useWorkflowTasksStore.getState().workflowTasks.map((item) => item.sessionId)).toEqual([
      'session-a',
      'session-b',
    ]);
    expect(useWorkflowTasksStore.getState()).toMatchObject({
      unreadCount: 2,
      loading: true,
      keyword: 'review',
      selectedJobStatus: 1,
      currentWorkflowTask: {
        sessionId: 'session-b',
        readonly: true,
      },
    });
  });
});

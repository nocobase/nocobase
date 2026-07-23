/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it } from 'vitest';
import type { ChatEditorRef, Conversation, Message } from '../../../types';
import { useChatConversationsStore } from '../chat-conversations';
import { CHAT_DEFAULT_SESSION_KEY, getChatApplicationKey, useChatMessagesStore } from '../chat-messages';
import { useChatToolCallStore } from '../chat-tool-call';
import { useChatToolsStore } from '../chat-tools';
import { useWorkflowTasksStore, type WorkflowTask } from '../workflow-tasks';

const resetStores = () => {
  useChatConversationsStore.setState({
    currentConversation: undefined,
    conversations: [],
    keyword: '',
    webSearch: false,
    conversationSegmented: 'conversations',
    unreadCount: 0,
  });
  useChatToolCallStore.setState({ sessions: {} });
  useChatMessagesStore.setState({
    sessions: {
      [CHAT_DEFAULT_SESSION_KEY]: useChatMessagesStore.getState().getSessionState('__missing__'),
    },
    editorRef: {},
  });
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

const workflowTask = (sessionId: string, status = 'pending'): WorkflowTask => ({
  id: sessionId,
  sessionId,
  workflowTitle: 'Approval',
  nodeTitle: 'Review',
  status,
});

const conversation = (sessionId: string): Conversation => ({
  sessionId,
  title: sessionId,
  aiEmployee: {
    username: 'atlas',
    nickname: 'Atlas',
  },
  read: false,
  updatedAt: new Date().toISOString(),
});

afterEach(() => {
  resetStores();
});

describe('client-v2 chatbox stores', () => {
  it('marks conversations as read and decrements unread count once', () => {
    useChatConversationsStore.getState().setConversations([
      conversation('session-a'),
      {
        ...conversation('session-b'),
        read: true,
      },
    ]);
    useChatConversationsStore.getState().setUnreadCount(1);

    useChatConversationsStore.getState().markConversationRead('session-a');
    expect(useChatConversationsStore.getState().conversations).toMatchObject([
      {
        sessionId: 'session-a',
        read: true,
      },
      {
        sessionId: 'session-b',
        read: true,
      },
    ]);
    expect(useChatConversationsStore.getState().unreadCount).toBe(0);

    useChatConversationsStore.getState().markConversationRead('session-a');
    useChatConversationsStore.getState().markConversationRead('missing-session');
    expect(useChatConversationsStore.getState().unreadCount).toBe(0);
  });

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

  it('normalizes workflow task job status when the list response omits it', () => {
    useWorkflowTasksStore.getState().setWorkflowTasks([
      workflowTask('session-pending', 'pending_approval'),
      workflowTask('session-resolved', 'approved'),
      workflowTask('session-failed', 'failed'),
      workflowTask('session-error', 'error'),
      workflowTask('session-rejected', 'rejected'),
      workflowTask('session-aborted', 'aborted'),
      workflowTask('session-canceled', 'canceled'),
      workflowTask('session-retry-needed', 'retry_needed'),
      workflowTask('session-unknown', 'unknown'),
      {
        ...workflowTask('session-explicit', 'approved'),
        jobStatus: 0,
      },
    ]);

    expect(
      useWorkflowTasksStore.getState().workflowTasks.map((item) => ({
        sessionId: item.sessionId,
        jobStatus: item.jobStatus,
      })),
    ).toEqual([
      { sessionId: 'session-pending', jobStatus: 0 },
      { sessionId: 'session-resolved', jobStatus: 1 },
      { sessionId: 'session-failed', jobStatus: -1 },
      { sessionId: 'session-error', jobStatus: -2 },
      { sessionId: 'session-rejected', jobStatus: -5 },
      { sessionId: 'session-aborted', jobStatus: -3 },
      { sessionId: 'session-canceled', jobStatus: -4 },
      { sessionId: 'session-retry-needed', jobStatus: -6 },
      { sessionId: 'session-unknown', jobStatus: 0 },
      { sessionId: 'session-explicit', jobStatus: 0 },
    ]);
  });

  it('marks workflow tasks as read and decrements unread count once', () => {
    useWorkflowTasksStore.getState().setWorkflowTasks([
      {
        ...workflowTask('session-a'),
        read: false,
      },
      {
        ...workflowTask('session-b'),
        read: true,
      },
    ]);
    useWorkflowTasksStore.getState().setUnreadCount(1);

    useWorkflowTasksStore.getState().markWorkflowTaskRead('session-a');
    expect(useWorkflowTasksStore.getState().workflowTasks).toMatchObject([
      {
        sessionId: 'session-a',
        read: true,
      },
      {
        sessionId: 'session-b',
        read: true,
      },
    ]);
    expect(useWorkflowTasksStore.getState().unreadCount).toBe(0);

    useWorkflowTasksStore.getState().markWorkflowTaskRead('session-a');
    useWorkflowTasksStore.getState().markWorkflowTaskRead('missing-session');
    expect(useWorkflowTasksStore.getState().unreadCount).toBe(0);
  });

  it('keeps coding targets, editor selections, and flow contexts isolated by session', () => {
    const firstFlowContext = { name: 'first' };
    const secondFlowContext = { name: 'second' };
    const store = useChatMessagesStore.getState();

    expect(
      store.bindSessionCodingTarget(
        'session-a',
        { type: 'single-file', applicationKey: 'app-a', editorUid: 'editor-a' },
        firstFlowContext,
      ).status,
    ).toBe('bound');
    expect(
      store.bindSessionCodingTarget(
        'session-b',
        {
          type: 'workspace',
          applicationKey: 'app-b',
          surfaceId: 'workspace-b',
          kind: 'light-extension',
          title: 'Workspace B',
        },
        secondFlowContext,
      ).status,
    ).toBe('bound');

    expect(store.getSessionState('session-a')).toMatchObject({
      codingTarget: { type: 'single-file', applicationKey: 'app-a', editorUid: 'editor-a' },
      currentEditorRefUid: 'editor-a',
      flowContext: firstFlowContext,
    });
    expect(store.getSessionState('session-b')).toMatchObject({
      codingTarget: { type: 'workspace', applicationKey: 'app-b', surfaceId: 'workspace-b' },
      flowContext: secondFlowContext,
    });
    expect(store.getSessionState('session-b').currentEditorRefUid).toBeUndefined();
  });

  it('migrates a draft coding target and resets the draft without leaking it to a new conversation', () => {
    const store = useChatMessagesStore.getState();
    store.setSessionMessages(undefined, [messageWithToolCalls('draft-message', [])]);
    store.setSessionContextItems(undefined, [{ type: 'code-workspace', uid: 'workspace-a' }]);
    store.bindSessionCodingTarget(undefined, {
      type: 'workspace',
      applicationKey: 'app-a',
      surfaceId: 'workspace-a',
      kind: 'light-extension',
      title: 'Workspace A',
    });

    store.migrateSessionState(undefined, 'created-session');

    expect(store.getSessionState('created-session')).toMatchObject({
      messages: [{ key: 'draft-message' }],
      contextItems: [{ type: 'code-workspace', uid: 'workspace-a' }],
      codingTarget: { type: 'workspace', surfaceId: 'workspace-a' },
    });
    expect(store.getSessionState(undefined).codingTarget).toBeUndefined();
    expect(store.getSessionState(undefined).contextItems).toEqual([]);

    store.resetSessionState('created-session');
    expect(store.getSessionState('created-session').codingTarget).toBeUndefined();
  });

  it('reports a target mismatch without rebinding the conversation', () => {
    const store = useChatMessagesStore.getState();
    store.bindSessionCodingTarget('session-a', {
      type: 'workspace',
      applicationKey: 'app-a',
      surfaceId: 'workspace-a',
      kind: 'light-extension',
      title: 'Workspace A',
    });

    const result = store.bindSessionCodingTarget('session-a', {
      type: 'workspace',
      applicationKey: 'app-a',
      surfaceId: 'workspace-b',
      kind: 'light-extension',
      title: 'Workspace B',
    });

    expect(result).toMatchObject({ status: 'mismatch', requestedTarget: { surfaceId: 'workspace-b' } });
    expect(store.getSessionState('session-a')).toMatchObject({
      codingTarget: { surfaceId: 'workspace-a' },
      codingTargetMismatch: { surfaceId: 'workspace-b' },
    });
  });

  it('partitions editor refs by application and only unregisters the matching mount instance', () => {
    const createEditorRef = (code: string): ChatEditorRef => ({
      read: () => code,
      write: () => undefined,
      snippetEntries: [],
      logs: [],
    });
    const first = createEditorRef('first');
    const replacement = createEditorRef('replacement');
    const otherApp = createEditorRef('other-app');
    const store = useChatMessagesStore.getState();

    const unregisterFirst = store.registerEditorRef('app-a', 'shared-editor', first);
    const unregisterReplacement = store.registerEditorRef('app-a', 'shared-editor', replacement);
    store.registerEditorRef('app-b', 'shared-editor', otherApp);

    unregisterFirst();
    expect(useChatMessagesStore.getState().editorRef['app-a']['shared-editor']).toBe(replacement);
    expect(useChatMessagesStore.getState().editorRef['app-b']['shared-editor']).toBe(otherApp);

    unregisterReplacement();
    expect(useChatMessagesStore.getState().editorRef['app-a']).toBeUndefined();
    expect(useChatMessagesStore.getState().editorRef['app-b']['shared-editor']).toBe(otherApp);
  });

  it('assigns distinct stable keys to application instances with the same display name', () => {
    const firstApp = { name: 'main' };
    const secondApp = { name: 'main' };

    expect(getChatApplicationKey(firstApp)).toBe(getChatApplicationKey(firstApp));
    expect(getChatApplicationKey(firstApp)).not.toBe(getChatApplicationKey(secondApp));
  });
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it } from 'vitest';
import c01 from './fixtures/chatbox-state/stable/C01-open-close-chatbox.fixture.json';
import c02 from './fixtures/chatbox-state/stable/C02-expand-collapse-chatbox.fixture.json';
import c03 from './fixtures/chatbox-state/stable/C03-toggle-conversations-list.fixture.json';
import c04 from './fixtures/chatbox-state/stable/C04-conversations-load-more.fixture.json';
import c05 from './fixtures/chatbox-state/stable/C05-open-existing-conversation.fixture.json';
import c06 from './fixtures/chatbox-state/stable/C06-click-current-conversation.fixture.json';
import c07 from './fixtures/chatbox-state/stable/C07-switch-ai-employee.fixture.json';
import c08 from './fixtures/chatbox-state/stable/C08-switch-model.fixture.json';
import c09 from './fixtures/chatbox-state/stable/C09-web-search-model-support.fixture.json';
import c10 from './fixtures/chatbox-state/stable/C10-new-conversation-multi-turn.fixture.json';
import c11 from './fixtures/chatbox-state/stable/C11-streaming-response.fixture.json';
import c12 from './fixtures/chatbox-state/stable/C12-abort-streaming-response.fixture.json';
import c13 from './fixtures/chatbox-state/stable/C13-resend-ai-message.fixture.json';
import c14 from './fixtures/chatbox-state/stable/C14-resume-tool-call-suggestions.fixture.json';
import c15 from './fixtures/chatbox-state/stable/C15-edit-user-message-resend.fixture.json';
import c16 from './fixtures/chatbox-state/stable/C16-server-web-search-tool.fixture.json';
import c17 from './fixtures/chatbox-state/stable/C17-suggestions-display.fixture.json';
import c18 from './fixtures/chatbox-state/stable/C18-click-suggestion-resume.fixture.json';
import c19 from './fixtures/chatbox-state/stable/C19-direct-message-interrupts-suggestion.fixture.json';
import c20 from './fixtures/chatbox-state/stable/C20-atlas-sub-agent-dispatch.fixture.json';
import c21 from './fixtures/chatbox-state/stable/C21-parallel-session-isolation.fixture.json';
import c22 from './fixtures/chatbox-state/stable/C22-flow-model-context-selection.fixture.json';
import c23 from './fixtures/chatbox-state/stable/C23-file-upload-send.fixture.json';
import c24 from './fixtures/chatbox-state/stable/C24-workflow-tasks-list-load.fixture.json';
import c25 from './fixtures/chatbox-state/stable/C25-workflow-tasks-filter.fixture.json';
import c26 from './fixtures/chatbox-state/stable/C26-workflow-task-open-conversation.fixture.json';
import c27 from './fixtures/chatbox-state/stable/C27-workflow-task-readonly-controls.fixture.json';
import c28 from './fixtures/chatbox-state/stable/C28-workflow-background-refresh.fixture.json';
import c29 from './fixtures/chatbox-state/stable/C29-resume-stream-source-constructed.fixture.json';
import c30 from './fixtures/chatbox-state/stable/C30-chat-tools-index-modal.fixture.json';
import c31 from './fixtures/chatbox-state/stable/C31-error-response-recovery-source-constructed.fixture.json';
import c32 from './fixtures/chatbox-state/stable/C32-context-items-dedupe-remove.fixture.json';
import c33 from './fixtures/chatbox-state/stable/C33-draft-session-migration.fixture.json';
import c34 from './fixtures/chatbox-state/stable/C34-dialog-hide-resume.fixture.json';
import type { Message } from '../../ai-employees/types';
import { useChatBoxStore } from '../../ai-employees/chatbox/stores/chat-box';
import { useChatConversationsStore } from '../../ai-employees/chatbox/stores/chat-conversations';
import {
  CHAT_DEFAULT_SESSION_KEY,
  CHAT_EMPTY_SESSION_STATE,
  useChatMessagesStore,
} from '../../ai-employees/chatbox/stores/chat-messages';
import { useChatToolCallStore } from '../../ai-employees/chatbox/stores/chat-tool-call';
import { useChatToolsStore } from '../../ai-employees/chatbox/stores/chat-tools';
import { useWorkflowTasksStore } from '../../ai-employees/chatbox/stores/workflow-tasks';
import { aiSelection } from '../../ai-employees/stores/ai-selection';
import { dialogController } from '../../ai-employees/stores/dialog-controller';

type MessageSummary = {
  role: string | null;
  loading: boolean;
  type: 'text' | 'greeting' | null;
  messageId: string | null;
  from?: 'main-agent' | 'sub-agent' | null;
  contentLength: number;
  content?: string;
  reasoningStatus?: string | null;
  toolCalls?: {
    id: string;
    name: string;
    invokeStatus: string;
    status?: 'success' | 'error';
    auto: boolean;
  }[];
  attachmentsCount?: number;
  workContextCount?: number;
  subAgentConversations?: {
    sessionId: string;
    status?: 'pending' | 'completed' | null;
    messages: MessageSummary[];
  }[];
};

type SessionSummary = {
  messageCount?: number;
  messages?: MessageSummary[];
  messagesLoading?: boolean;
  messagesError?: string | null;
  attachmentCount?: number;
  attachments?: { filename?: string; name?: string; status?: string; percent?: number; size?: number }[];
  contextItemCount?: number;
  contextItems?: { type: string; uid: string; title?: string }[];
  systemMessageLength?: number;
  responseLoading?: boolean;
  hasAbortController?: boolean;
  skillSettings?: { skills?: string[]; tools?: string[] } | null;
  webSearching?: unknown;
  backgroundWorking?: boolean;
  resumeStreamFailed?: boolean;
};

type FixtureSnapshot = {
  label: string;
  chatBox?: Record<string, unknown>;
  conversations?: Record<string, unknown>;
  messages?: {
    currentSessionId?: string;
    currentSession?: SessionSummary;
    draftSession?: SessionSummary;
  };
  currentSession?: SessionSummary;
  draft?: SessionSummary;
  newSession?: SessionSummary;
  dom?: {
    senderDisabled?: boolean;
    buttons?: { text?: string; icon?: string; disabled?: boolean }[];
  };
};

type Fixture = {
  caseId: string;
  snapshots: FixtureSnapshot[];
};

const fixtures = [
  c01,
  c02,
  c03,
  c04,
  c05,
  c06,
  c07,
  c08,
  c09,
  c10,
  c11,
  c12,
  c13,
  c14,
  c15,
  c16,
  c17,
  c18,
  c19,
  c20,
  c21,
  c22,
  c23,
  c24,
  c25,
  c26,
  c27,
  c28,
  c29,
  c30,
  c31,
  c32,
  c33,
  c34,
] as Fixture[];

const getSnapshot = (fixture: Fixture, label: string) => {
  const found = fixture.snapshots.find((item) => item.label === label);
  expect(found, `${fixture.caseId} ${label}`).toBeTruthy();
  return found as FixtureSnapshot;
};

const getMessages = (fixture: Fixture, label: string) => {
  const snapshot = getSnapshot(fixture, label);
  const messages = snapshot.messages?.currentSession?.messages ?? snapshot.currentSession?.messages;
  expect(messages, `${fixture.caseId} ${label} messages`).toBeTruthy();
  return messages as MessageSummary[];
};

const toMessage = (summary: MessageSummary): Message => ({
  role: summary.role ?? undefined,
  loading: summary.loading,
  content: {
    type: summary.type ?? 'text',
    messageId: summary.messageId ?? undefined,
    from: summary.from ?? undefined,
    content: summary.content ?? 'x'.repeat(summary.contentLength),
    reasoning: summary.reasoningStatus
      ? {
          status: summary.reasoningStatus,
          content: '',
        }
      : undefined,
    tool_calls: summary.toolCalls?.map((tool) => ({
      id: tool.id,
      type: 'function',
      name: tool.name,
      invokeStatus: tool.invokeStatus as Message['content']['tool_calls'][number]['invokeStatus'],
      status: tool.status,
      auto: tool.auto,
      args: {},
    })),
    attachments: Array.from({ length: summary.attachmentsCount ?? 0 }, (_, index) => ({
      filename: `attachment-${index}`,
    })),
    workContext: Array.from({ length: summary.workContextCount ?? 0 }, (_, index) => ({
      type: 'flow-model',
      uid: `context-${index}`,
    })),
    subAgentConversations: summary.subAgentConversations?.map((conversation) => ({
      sessionId: conversation.sessionId,
      status: conversation.status ?? undefined,
      messages: conversation.messages.map(toMessage),
    })),
  },
});

const messageSummary = (message: Message) => ({
  role: message.role,
  loading: message.loading === true,
  type: message.content.type,
  contentLength: typeof message.content.content === 'string' ? message.content.content.length : 0,
  reasoningStatus: message.content.reasoning?.status ?? null,
  toolCallsCount: message.content.tool_calls?.length ?? 0,
  attachmentsCount: message.content.attachments?.length ?? 0,
  workContextCount: message.content.workContext?.length ?? 0,
  subAgentCount: message.content.subAgentConversations?.length ?? 0,
});

const resetStores = () => {
  useChatBoxStore.setState({
    open: false,
    expanded: false,
    collapsed: false,
    showConversations: false,
    minimize: false,
    currentEmployee: null,
    senderValue: '',
    senderPlaceholder: '',
    taskVariables: {},
    roles: {},
    isEditingMessage: false,
    editingMessageId: null,
    chatBoxRef: { current: null },
    senderRef: { current: null },
    showCodeHistory: false,
    model: null,
    showDebugPanel: false,
    readonly: false,
    isShowSenderHint: false,
  });
  useChatConversationsStore.setState({
    currentConversation: undefined,
    conversations: [],
    keyword: '',
    webSearch: false,
    conversationSegmented: 'conversations',
    unreadCount: 0,
  });
  useChatMessagesStore.setState({
    sessions: {
      [CHAT_DEFAULT_SESSION_KEY]: { ...CHAT_EMPTY_SESSION_STATE, messages: [], attachments: [], contextItems: [] },
    },
    editorRef: {},
    currentEditorRefUid: null,
    flowContext: null,
  });
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
  aiSelection.stopSelect();
  dialogController.resume();
};

afterEach(() => {
  resetStores();
});

describe('AI employee chatbox state fixtures', () => {
  it('keep stable assertion fields and omit raw capture noise', () => {
    for (const fixture of fixtures) {
      const serialized = JSON.stringify(fixture);
      expect(serialized).not.toContain('capturedAt');
      expect(serialized).not.toContain('requestId');
      expect(serialized).not.toContain('className');

      for (const snapshot of fixture.snapshots) {
        const messages = snapshot.messages?.currentSession?.messages ?? snapshot.draft?.messages ?? [];
        for (const message of messages) {
          expect(message).toHaveProperty('role');
          expect(message).toHaveProperty('loading');
          expect(message).toHaveProperty('contentLength');
          if (message.content) {
            expect(message.content.length).toBeLessThanOrEqual(30);
          }
        }
      }
    }
  });
});

describe('AI employee chatbox P0 state regression', () => {
  it('preserves window flags for open, close, expand, and conversation drawer cases C01-C06', () => {
    const chatBox = useChatBoxStore.getState();
    const conversations = useChatConversationsStore.getState();
    const messages = useChatMessagesStore.getState();

    messages.setSessionMessages('active-session', [
      toMessage({ role: 'user', loading: false, type: 'text', messageId: null, contentLength: 5 }),
      toMessage({ role: 'atlas', loading: false, type: 'text', messageId: null, contentLength: 5 }),
    ]);
    conversations.setCurrentConversation('active-session');
    chatBox.setOpen(true);
    chatBox.setCollapsed(true);
    chatBox.setExpanded(true);
    chatBox.setShowDebugPanel(true);
    chatBox.setShowConversations(true);
    chatBox.setSenderValue('draft survives drawer toggles');

    expect(useChatBoxStore.getState().open).toBe(getSnapshot(c01 as Fixture, 'C01-after-open').chatBox?.open);
    expect(useChatBoxStore.getState().expanded).toBe(getSnapshot(c02 as Fixture, 'C02-after-expand').chatBox?.expanded);

    chatBox.setShowDebugPanel(false);
    chatBox.setExpanded(false);
    chatBox.setShowConversations(false);
    expect(useChatBoxStore.getState().senderValue).toBe('draft survives drawer toggles');
    expect(useChatBoxStore.getState().showConversations).toBe(
      getSnapshot(c03 as Fixture, 'C03-after-click-close-list').chatBox?.showConversations,
    );

    chatBox.setOpen(false);
    expect(useChatBoxStore.getState().open).toBe(getSnapshot(c01 as Fixture, 'C01-after-close').chatBox?.open);
    expect(useChatBoxStore.getState().collapsed).toBe(
      getSnapshot(c01 as Fixture, 'C01-after-close').chatBox?.collapsed,
    );
    expect(useChatConversationsStore.getState().currentConversation).toBe('active-session');
    expect(useChatMessagesStore.getState().getSessionState('active-session').messages).toHaveLength(2);

    chatBox.setShowConversations(true);
    conversations.setCurrentConversation('active-session');
    chatBox.setShowConversations(false);
    expect(useChatConversationsStore.getState().currentConversation).toBe('active-session');
  });

  it('replaces and appends conversation lists according to C03-C04 pagination fixtures', () => {
    const conversations = useChatConversationsStore.getState();
    const firstPage = Array.from({ length: 50 }, (_, index) => ({
      sessionId: `page-1-${index}`,
      title: `conversation ${index}`,
      updatedAt: '',
      read: true,
      aiEmployee: { username: 'atlas' },
    }));
    const secondPage = Array.from({ length: 50 }, (_, index) => ({
      sessionId: `page-2-${index}`,
      title: `conversation ${index + 50}`,
      updatedAt: '',
      read: true,
      aiEmployee: { username: 'atlas' },
    }));

    conversations.setConversationSegmented('conversations');
    conversations.setConversations(firstPage);
    expect(getSnapshot(c03 as Fixture, 'C03-after-list-settled').conversations?.conversationSegmented).toBe(
      'conversations',
    );
    expect(useChatConversationsStore.getState().conversations).toHaveLength(50);

    conversations.setKeyword('');
    conversations.setConversations((prev) => [...prev, ...secondPage]);
    expect(getSnapshot(c04 as Fixture, 'C04-after-scroll-summary').conversations?.conversationSegmented).toBe(
      'conversations',
    );
    expect(useChatConversationsStore.getState().conversations).toHaveLength(100);
    expect(useChatConversationsStore.getState().conversations[0].sessionId).toBe('page-1-0');
  });

  it('locks send, streaming, abort, resend, and edit state transitions from C10-C15', () => {
    const messages = useChatMessagesStore.getState();
    const chatBox = useChatBoxStore.getState();
    const sessionId = getSnapshot(c10 as Fixture, 'round1-after-send-50ms').messages?.currentSessionId;
    expect(sessionId).toBeTruthy();

    messages.setSessionMessages(
      CHAT_DEFAULT_SESSION_KEY,
      getMessages(c10 as Fixture, 'after-click-new-conversation-settled').map(toMessage),
    );
    messages.migrateSessionState(CHAT_DEFAULT_SESSION_KEY, sessionId as string);
    messages.setSessionMessages(sessionId, getMessages(c10 as Fixture, 'round1-after-send-50ms').map(toMessage));
    messages.setSessionResponseLoading(sessionId, true);
    messages.setSessionAbortController(sessionId, new AbortController());

    expect(useChatMessagesStore.getState().getSessionState(sessionId).messages.map(messageSummary)).toMatchObject(
      getMessages(c10 as Fixture, 'round1-after-send-50ms').map((message) => ({
        role: message.role,
        loading: message.loading,
        type: message.type,
        contentLength: message.contentLength,
      })),
    );
    expect(useChatMessagesStore.getState().getSessionState(CHAT_DEFAULT_SESSION_KEY).messages).toHaveLength(0);

    for (const label of ['stream-002', 'stream-003', 'stream-004']) {
      const expected = getMessages(c11 as Fixture, label).at(-1);
      messages.updateSessionLastMessage(sessionId, (last) => ({
        ...last,
        loading: expected?.loading,
        content: {
          ...last.content,
          content: 'x'.repeat(expected?.contentLength ?? 0),
          reasoning: expected?.reasoningStatus ? { status: expected.reasoningStatus, content: '' } : undefined,
        },
      }));
      const last = useChatMessagesStore.getState().getSessionState(sessionId).messages.at(-1);
      expect(messageSummary(last as Message)).toMatchObject({
        loading: expected?.loading,
        contentLength: expected?.contentLength,
        reasoningStatus: expected?.reasoningStatus,
      });
    }

    messages.setSessionAbortController(sessionId, null);
    messages.setSessionResponseLoading(sessionId, false);
    expect(useChatMessagesStore.getState().getSessionState(sessionId)).toMatchObject({
      responseLoading: getSnapshot(c12 as Fixture, 'after-abort-click-500ms').messages?.currentSession?.responseLoading,
      abortController: null,
    });

    const beforeResend = getMessages(c13 as Fixture, 'attempt2-before-click-visible-message-reload').map(toMessage);
    const resendLoading = getMessages(c13 as Fixture, 'attempt2-after-click-reload-30ms').at(-1) as MessageSummary;
    messages.setSessionMessages(sessionId, beforeResend);
    messages.setSessionMessages(sessionId, (prev) => [...prev.slice(0, 1), toMessage(resendLoading)]);
    messages.setSessionResponseLoading(sessionId, true);
    expect(
      useChatMessagesStore
        .getState()
        .getSessionState(sessionId)
        .messages.map((message) => message.role),
    ).toEqual(['user', resendLoading.role]);

    const editTarget = getMessages(c15 as Fixture, 'before-click-edit').at(0) as MessageSummary;
    chatBox.setIsEditingMessage(true);
    chatBox.setEditingMessageId(editTarget.messageId ?? 'editing-message');
    messages.setSessionMessages(sessionId, [toMessage(editTarget)]);
    messages.setSessionAttachments(sessionId, [{ filename: 'restored.txt', status: 'done' }]);
    messages.setSessionContextItems(sessionId, [{ type: 'flow-model', uid: 'restored-context' }]);
    expect(useChatBoxStore.getState()).toMatchObject({ isEditingMessage: true });
    expect(useChatMessagesStore.getState().getSessionState(sessionId)).toMatchObject({
      attachments: [{ filename: 'restored.txt', status: 'done' }],
      contextItems: [{ type: 'flow-model', uid: 'restored-context' }],
    });

    chatBox.setIsEditingMessage(false);
    chatBox.setEditingMessageId(undefined);
    messages.setSessionAttachments(sessionId, []);
    messages.setSessionContextItems(sessionId, []);
    expect(useChatBoxStore.getState()).toMatchObject({ isEditingMessage: false, editingMessageId: undefined });
    expect(useChatMessagesStore.getState().getSessionState(sessionId)).toMatchObject({
      attachments: [],
      contextItems: [],
    });
  });

  it('tracks interrupted tool call decisions for C14', () => {
    const toolCall = useChatToolCallStore.getState();
    const sessionId = 'tool-session';
    const messageId = 'tool-message';
    const toolIds = ['suggestion-1', 'suggestion-2'];

    for (const id of toolIds) {
      toolCall.updateToolCallInvokeStatus(sessionId, messageId, id, 'interrupted');
      expect(toolCall.isInterrupted(sessionId, messageId, id)).toBe(true);
    }
    expect(toolCall.isAllWaiting(sessionId, messageId)).toBe(false);

    for (const id of toolIds) {
      toolCall.updateToolCallInvokeStatus(sessionId, messageId, id, 'waiting');
    }
    expect(toolCall.isAllWaiting(sessionId, messageId)).toBe(true);
    expect(toolCall.getSessionState(sessionId).toolCalls[messageId]).toMatchObject([
      { id: toolIds[0], invokeStatus: 'waiting' },
      { id: toolIds[1], invokeStatus: 'waiting' },
    ]);
    expect((c14 as Fixture).caseId).toBe('C14');
  });

  it('keeps sub-agent messages nested in the main session for C20', () => {
    const messages = useChatMessagesStore.getState();
    const finalMessages = getMessages(c20 as Fixture, 'sub-agent-poll-14');
    const sessionId = getSnapshot(c20 as Fixture, 'sub-agent-poll-14').messages?.currentSessionId as string;
    const mainAssistant = finalMessages.find(
      (message) => (message.subAgentConversations?.length ?? 0) > 0,
    ) as MessageSummary;
    const subConversation = mainAssistant.subAgentConversations?.[0];
    expect(subConversation).toBeTruthy();

    const { subAgentConversations, ...mainAssistantWithoutSubAgent } = mainAssistant;
    expect(subAgentConversations).toBeTruthy();
    messages.addSessionMessage(sessionId, toMessage(mainAssistantWithoutSubAgent));
    messages.addSessionSubAgentMessages(
      sessionId,
      subConversation?.sessionId ?? 'sub-session',
      subConversation?.messages.map(toMessage) ?? [],
    );
    messages.updateSessionSubAgentConversationStatus(
      sessionId,
      subConversation?.sessionId ?? 'sub-session',
      'completed',
    );

    const last = useChatMessagesStore.getState().getSessionState(sessionId).messages.at(-1);
    expect(last?.content.subAgentConversations?.[0]).toMatchObject({
      sessionId: subConversation?.sessionId,
      status: 'completed',
    });
    expect(last?.content.subAgentConversations?.[0].messages.map((message) => message.role)).toEqual(['user', 'dex']);
  });

  it('isolates parallel session state for C21', () => {
    const messages = useChatMessagesStore.getState();
    const conversations = useChatConversationsStore.getState();
    const sessionA = (c21 as Fixture & { sessionA: string }).sessionA;
    const sessionB = (c21 as Fixture & { sessionB: string }).sessionB;

    messages.setSessionMessages(sessionA, [
      toMessage({ role: 'user', loading: false, type: 'text', messageId: null, contentLength: 1 }),
      toMessage({ role: 'atlas', loading: true, type: 'text', messageId: null, contentLength: 0 }),
    ]);
    messages.setSessionResponseLoading(sessionA, true);
    messages.setSessionAbortController(sessionA, new AbortController());
    conversations.setCurrentConversation(sessionB);
    messages.setSessionMessages(sessionB, [
      toMessage({ role: 'user', loading: false, type: 'text', messageId: null, contentLength: 4 }),
      toMessage({ role: 'atlas', loading: false, type: 'text', messageId: null, contentLength: 4 }),
    ]);
    messages.setSessionResponseLoading(sessionB, false);

    expect(useChatConversationsStore.getState().currentConversation).toBe(sessionB);
    expect(useChatMessagesStore.getState().getSessionState(sessionA)).toMatchObject({
      responseLoading: true,
    });
    expect(useChatMessagesStore.getState().getSessionState(sessionB)).toMatchObject({
      responseLoading: false,
      abortController: null,
    });

    messages.updateSessionLastMessage(sessionA, (last) => ({
      ...last,
      loading: false,
      content: { ...last.content, content: 'background A update' },
    }));
    expect(useChatMessagesStore.getState().getSessionState(sessionB).messages.at(-1)?.content.content).toHaveLength(4);
  });

  it('tracks workflow task list, filters, open task, readonly controls, and background refresh for C24-C28', () => {
    const workflowTasks = useWorkflowTasksStore.getState();
    const chatBox = useChatBoxStore.getState();
    const conversations = useChatConversationsStore.getState();
    const messages = useChatMessagesStore.getState();

    const firstRequest = (
      c24 as {
        network: {
          requests: { summary: { first: { sessionId: string; status: string; jobStatus: number; read: boolean } } }[];
        };
      }
    ).network.requests[0];
    const secondRequest = (
      c24 as {
        network: {
          requests: { summary: { first: { sessionId: string; status: string; jobStatus: number; read: boolean } } }[];
        };
      }
    ).network.requests.at(-1);
    workflowTasks.setLoading(true);
    expect(useWorkflowTasksStore.getState().loading).toBe(true);
    workflowTasks.setWorkflowTasks([
      { id: 'first', workflowTitle: 'Permission Test', nodeTitle: 'AI Employee', ...firstRequest.summary.first },
    ]);
    workflowTasks.setLoading(false);
    workflowTasks.setWorkflowTasks((prev) => {
      const sessionIds = new Set(prev.map((item) => item.sessionId));
      const next = {
        id: 'second',
        workflowTitle: 'Travel Guide',
        nodeTitle: 'AI Employee',
        ...secondRequest?.summary.first,
      };
      return next.sessionId && !sessionIds.has(next.sessionId) ? [...prev, next] : prev;
    });
    expect(useWorkflowTasksStore.getState()).toMatchObject({ loading: false });
    expect(useWorkflowTasksStore.getState().workflowTasks).toHaveLength(2);

    workflowTasks.setKeyword('Travel Guide');
    workflowTasks.setSelectedJobStatus(1);
    expect(useWorkflowTasksStore.getState()).toMatchObject({
      keyword: getSnapshot(c25 as Fixture, 'after-search-settled').conversations?.keyword,
      selectedJobStatus: 1,
    });

    const openedTask = getSnapshot(c26 as Fixture, 'after-click-task-settled');
    workflowTasks.setCurrentWorkflowTask({
      id: 'task',
      workflowTitle: 'Permission Test',
      nodeTitle: 'AI Employee',
      sessionId: openedTask.conversations?.currentConversation as string,
      status: 'pending_approval',
      readonly: false,
      config: { username: 'atlas', model: openedTask.chatBox?.model as { llmService: string; model: string } },
    });
    conversations.setCurrentConversation(openedTask.conversations?.currentConversation as string);
    chatBox.setCurrentEmployee({ username: openedTask.chatBox?.currentEmployee as string });
    chatBox.setModel(openedTask.chatBox?.model as { llmService: string; model: string });
    chatBox.setReadonly(false);
    messages.setSessionResponseLoading(openedTask.conversations?.currentConversation as string, false);
    expect(useChatBoxStore.getState()).toMatchObject({
      currentEmployee: { username: 'atlas' },
      model: openedTask.chatBox?.model,
      readonly: false,
    });

    const readonlySnapshot = getSnapshot(c27 as Fixture, 'after-open-resolved-task');
    chatBox.setReadonly(readonlySnapshot.chatBox?.readonly as boolean);
    conversations.setCurrentConversation(readonlySnapshot.conversations?.currentConversation as string);
    expect(useChatBoxStore.getState().readonly).toBe(true);
    expect(readonlySnapshot.dom?.senderDisabled).toBe(true);
    expect(readonlySnapshot.dom?.buttons?.find((button) => button.icon === 'arrow-up')?.disabled).toBe(false);
    expect(
      readonlySnapshot.dom?.buttons
        ?.filter((button) => ['appstore-add', 'paper-clip', 'global'].includes(button.icon ?? ''))
        .map((button) => button.disabled),
    ).toEqual([true, true, true]);

    const backgroundSnapshot = getSnapshot(c28 as Fixture, 'after-source-construct-background');
    const refreshSnapshot = getSnapshot(c28 as Fixture, 'after-click-refresh-settled');
    const backgroundSessionId = backgroundSnapshot.conversations?.currentConversation as string;
    messages.setSessionBackgroundWorking(backgroundSessionId, true);
    messages.setSessionResponseLoading(backgroundSessionId, true);
    messages.setSessionMessagesLoading(backgroundSessionId, true);
    messages.setSessionMessagesLoading(backgroundSessionId, false);
    messages.setSessionBackgroundWorking(backgroundSessionId, false);
    expect(useChatMessagesStore.getState().getSessionState(backgroundSessionId)).toMatchObject({
      backgroundWorking: refreshSnapshot.currentSession?.backgroundWorking,
      responseLoading: refreshSnapshot.currentSession?.responseLoading,
      messagesLoading: false,
    });
  });

  it('migrates draft chat and tool-call state to a created session for C33', () => {
    const messages = useChatMessagesStore.getState();
    const toolCalls = useChatToolCallStore.getState();
    const fixture = c33 as Fixture & {
      draftSessionId: string;
      newSessionId: string;
      toolCallMigrationContract: {
        before: { sessions: Record<string, { toolCalls: Record<string, { id: string; invokeStatus: string }[]> }> };
      };
    };
    const before = getSnapshot(fixture, 'before-migrate-draft');
    const after = getSnapshot(fixture, 'after-migrate-draft-to-new-session');
    const draftMessages = before.draft?.messages ?? [];

    messages.setSessionMessages(fixture.draftSessionId, draftMessages.map(toMessage));
    messages.setSessionMessagesMeta(fixture.draftSessionId, { cursor: 'cursor-draft', hasMore: true });
    messages.setSessionAttachments(fixture.draftSessionId, [{ filename: 'draft.txt', status: 'done', size: 12 }]);
    messages.setSessionContextItems(fixture.draftSessionId, [{ type: 'flow-model', uid: 'block-1', title: 'Block 1' }]);
    messages.setSessionSystemMessage(fixture.draftSessionId, 'system draft message');
    messages.setSessionSkillSettings(fixture.draftSessionId, { skills: ['skill-a'], tools: ['tool-a'] });
    messages.setSessionResponseLoading(fixture.draftSessionId, true);
    messages.setSessionBackgroundWorking(fixture.draftSessionId, true);
    messages.setSessionResumeStreamFailed(fixture.draftSessionId, true);
    toolCalls.updateToolCallInvokeStatus(fixture.draftSessionId, 'draftMessageId', 'tool-1', 'waiting');

    messages.migrateSessionState(fixture.draftSessionId, fixture.newSessionId);
    toolCalls.migrateSessionState(fixture.draftSessionId, fixture.newSessionId);

    expect(useChatMessagesStore.getState().getSessionState(fixture.draftSessionId)).toMatchObject({
      messages: [],
      responseLoading: after.draft?.responseLoading,
      backgroundWorking: after.draft?.backgroundWorking,
      resumeStreamFailed: after.draft?.resumeStreamFailed,
    });
    expect(useChatMessagesStore.getState().getSessionState(fixture.newSessionId)).toMatchObject({
      messagesMeta: { cursor: 'cursor-draft', hasMore: true },
      attachments: [{ filename: 'draft.txt', status: 'done', size: 12 }],
      contextItems: [{ type: 'flow-model', uid: 'block-1', title: 'Block 1' }],
      systemMessage: 'system draft message',
      responseLoading: after.newSession?.responseLoading,
      backgroundWorking: after.newSession?.backgroundWorking,
      resumeStreamFailed: after.newSession?.resumeStreamFailed,
    });
    expect(useChatMessagesStore.getState().getSessionState(fixture.newSessionId).messages).toHaveLength(
      after.newSession?.messageCount ?? 0,
    );
    expect(useChatToolCallStore.getState().getSessionState(fixture.newSessionId).toolCalls).toEqual(
      fixture.toolCallMigrationContract.before.sessions[fixture.draftSessionId].toolCalls,
    );
    expect(useChatToolCallStore.getState().getSessionState(fixture.draftSessionId).toolCalls).toEqual({});
  });
});

describe('AI employee chatbox P1/P2 state regression', () => {
  it('keeps employee, model, and web search switching contracts for C07-C09', () => {
    const chatBox = useChatBoxStore.getState();
    const conversations = useChatConversationsStore.getState();
    const messages = useChatMessagesStore.getState();
    const switchImmediate = getSnapshot(c07 as Fixture, 'C07-after-click-dex');
    const switchSettled = getSnapshot(c07 as Fixture, 'C07-after-switch-settled');
    const modelSwitch = getSnapshot(c08 as Fixture, 'after-select-qwen35-flash-settled');

    chatBox.setOpen(true);
    chatBox.setCurrentEmployee({ username: 'atlas' });
    chatBox.setModel(
      getSnapshot(c07 as Fixture, 'C07-before-prepare').chatBox?.model as { llmService: string; model: string },
    );
    chatBox.setSenderValue(
      'x'.repeat(Number(getSnapshot(c07 as Fixture, 'C07-after-draft-input').chatBox?.senderValueLength)),
    );
    conversations.setCurrentConversation('atlas-session');

    chatBox.setCurrentEmployee({ username: switchImmediate.chatBox?.currentEmployee as string });
    chatBox.setModel(switchImmediate.chatBox?.model as null);
    expect(switchImmediate.conversations?.currentConversation).toBeNull();
    conversations.setCurrentConversation(undefined);
    expect(useChatBoxStore.getState()).toMatchObject({
      currentEmployee: { username: 'dex' },
      model: null,
      senderValue: 'x'.repeat(Number(switchImmediate.chatBox?.senderValueLength)),
    });
    expect(useChatConversationsStore.getState().currentConversation).toBeUndefined();

    chatBox.setModel(switchSettled.chatBox?.model as { llmService: string; model: string });
    expect(useChatBoxStore.getState().model).toEqual(switchSettled.chatBox?.model);

    messages.setSessionMessages(
      CHAT_DEFAULT_SESSION_KEY,
      getMessages(c08 as Fixture, 'before-switch-qwen-max').map(toMessage),
    );
    chatBox.setModel(modelSwitch.chatBox?.model as { llmService: string; model: string });
    expect(useChatBoxStore.getState().model).toEqual(modelSwitch.chatBox?.model);
    expect(useChatMessagesStore.getState().getSessionState(CHAT_DEFAULT_SESSION_KEY).messages).toHaveLength(
      modelSwitch.messages?.draftSession?.messageCount ?? 0,
    );

    conversations.setWebSearch(
      getSnapshot(c09 as Fixture, 'after-toggle-web-search-settled').conversations?.webSearch as boolean,
    );
    expect(useChatConversationsStore.getState().webSearch).toBe(true);
    chatBox.setModel(
      getSnapshot(c09 as Fixture, 'after-select-deepseek-v4-flash-immediate').chatBox?.model as {
        llmService: string;
        model: string;
      },
    );
    expect(useChatConversationsStore.getState().webSearch).toBe(
      getSnapshot(c09 as Fixture, 'after-select-deepseek-v4-flash-immediate').conversations?.webSearch,
    );
    conversations.setWebSearch(
      getSnapshot(c09 as Fixture, 'after-select-deepseek-v4-flash-settled').conversations?.webSearch as boolean,
    );
    expect(useChatConversationsStore.getState().webSearch).toBe(false);
    chatBox.setModel(
      getSnapshot(c09 as Fixture, 'after-switch-back-qwen35-flash-settled').chatBox?.model as {
        llmService: string;
        model: string;
      },
    );
    expect(useChatConversationsStore.getState().webSearch).toBe(
      getSnapshot(c09 as Fixture, 'after-switch-back-qwen35-flash-settled').conversations?.webSearch,
    );
  });

  it('indexes web-search and suggestion tool calls without losing direct follow-up messages for C16-C19', () => {
    const messages = useChatMessagesStore.getState();
    const tools = useChatToolsStore.getState();
    const toolCalls = useChatToolCallStore.getState();

    const webSearchMessages = getMessages(c16 as Fixture, 'web-search-poll-2').map(toMessage);
    const webSearchSessionId = getSnapshot(c16 as Fixture, 'web-search-poll-2').messages?.currentSessionId as string;
    messages.setSessionMessages(webSearchSessionId, webSearchMessages);
    messages.setSessionWebSearching(webSearchSessionId, { query: 'latest NocoBase release' });
    tools.updateTools(webSearchMessages);
    expect(useChatToolsStore.getState().toolsByName.subAgentWebSearch).toHaveLength(1);
    messages.setSessionWebSearching(webSearchSessionId, null);
    expect(useChatMessagesStore.getState().getSessionState(webSearchSessionId).webSearching).toBeNull();

    const suggestionMessages = getMessages(c17 as Fixture, 'suggestions-display-poll-2').map(toMessage);
    const suggestionSessionId = getSnapshot(c17 as Fixture, 'suggestions-display-poll-2').messages
      ?.currentSessionId as string;
    messages.setSessionMessages(suggestionSessionId, suggestionMessages);
    tools.updateTools(suggestionMessages);
    const suggestionTool = useChatToolsStore.getState().toolsByName.suggestions?.[0];
    expect(suggestionTool).toMatchObject({ name: 'suggestions' });
    const messageId = String(suggestionMessages.at(-1)?.content.messageId);
    const toolCallId = String(suggestionTool?.id);
    toolCalls.updateToolCallInvokeStatus(suggestionSessionId, messageId, toolCallId, 'interrupted');
    expect(toolCalls.isInterrupted(suggestionSessionId, messageId, toolCallId)).toBe(true);
    const suggestionDecisionStatus =
      getMessages(c18 as Fixture, 'after-click-suggestion-50ms').at(-1)?.toolCalls?.[0]?.invokeStatus ?? 'waiting';
    toolCalls.updateToolCallInvokeStatus(suggestionSessionId, messageId, toolCallId, suggestionDecisionStatus);
    expect(toolCalls.getInvokeStatus(suggestionSessionId, messageId, toolCallId)).toBe(suggestionDecisionStatus);

    const directBefore = getMessages(c19 as Fixture, 'before-direct-user-message-while-tool-interrupted').map(
      toMessage,
    );
    const directAfter = getMessages(c19 as Fixture, 'direct-message-poll-1').map(toMessage);
    const directSessionId = getSnapshot(c19 as Fixture, 'direct-message-poll-1').messages?.currentSessionId as string;
    messages.setSessionMessages(directSessionId, directBefore);
    const originalSuggestion = useChatMessagesStore
      .getState()
      .getSessionState(directSessionId)
      .messages.find((message) => message.content.tool_calls?.some((tool) => tool.name === 'suggestions'));
    messages.setSessionMessages(directSessionId, directAfter);
    expect(useChatMessagesStore.getState().getSessionState(directSessionId).messages).toHaveLength(
      getSnapshot(c19 as Fixture, 'direct-message-poll-1').messages?.currentSession?.messageCount ?? 0,
    );
    expect(
      useChatMessagesStore.getState().getSessionState(directSessionId).messages[1].content.tool_calls?.[0],
    ).toMatchObject({
      id: originalSuggestion?.content.tool_calls?.[0].id,
      name: 'suggestions',
    });
    expect(useChatMessagesStore.getState().getSessionState(directSessionId).messages.at(-1)?.content.content).toBe(
      'INTERRUPT',
    );
  });

  it('tracks selected context and sent attachments for C22-C23', () => {
    const messages = useChatMessagesStore.getState();
    const chatBox = useChatBoxStore.getState();
    const contextSessionId = getSnapshot(c22 as Fixture, 'after-select-flow-model-block').conversations
      ?.currentConversation as string;
    const selectedContext = getSnapshot(c22 as Fixture, 'after-select-flow-model-block').currentSession
      ?.contextItems?.[0];

    aiSelection.startSelect('flow-model', { onSelect: () => undefined });
    expect(aiSelection.selectable).toBe('flow-model');
    expect(aiSelection.selector).toBeTruthy();
    messages.addSessionContextItems(contextSessionId, selectedContext ?? { type: 'flow-model', uid: 'block-1' });
    aiSelection.stopSelect();
    expect(useChatMessagesStore.getState().getSessionState(contextSessionId).contextItems).toHaveLength(
      getSnapshot(c22 as Fixture, 'after-select-flow-model-block').currentSession?.contextItemCount ?? 0,
    );
    expect(aiSelection.selectable).toBe('');

    const contextSend = getMessages(c22 as Fixture, 'after-send-context-prompt-200ms');
    messages.setSessionMessages(contextSessionId, contextSend.map(toMessage));
    messages.setSessionContextItems(contextSessionId, []);
    expect(
      useChatMessagesStore.getState().getSessionState(contextSessionId).messages.at(-2)?.content.workContext,
    ).toHaveLength(contextSend.at(-2)?.workContextCount ?? 0);
    expect(useChatMessagesStore.getState().getSessionState(contextSessionId).contextItems).toHaveLength(0);

    const attachmentSessionId = getSnapshot(c23 as Fixture, 'after-dom-file-change-1550ms').conversations
      ?.currentConversation as string;
    const doneAttachment = getSnapshot(c23 as Fixture, 'after-dom-file-change-1550ms').currentSession?.attachments?.[0];
    messages.addSessionAttachments(attachmentSessionId, {
      filename: doneAttachment?.filename,
      status: 'uploading',
      percent: 0,
    });
    messages.setSessionAttachments(attachmentSessionId, [{ ...doneAttachment, status: 'done' }]);
    expect(useChatMessagesStore.getState().getSessionState(attachmentSessionId).attachments).toMatchObject([
      { filename: doneAttachment?.filename, status: 'done' },
    ]);

    chatBox.setSenderValue(
      'x'.repeat(
        Number(getSnapshot(c23 as Fixture, 'after-store-set-sender-with-attachment').chatBox?.senderValueLength),
      ),
    );
    messages.setSessionMessages(
      attachmentSessionId,
      getMessages(c23 as Fixture, 'after-send-attachment-with-store-value-200ms').map(toMessage),
    );
    messages.setSessionAttachments(attachmentSessionId, []);
    chatBox.setSenderValue('');
    expect(useChatMessagesStore.getState().getSessionState(attachmentSessionId).attachments).toHaveLength(0);
    expect(
      useChatMessagesStore.getState().getSessionState(attachmentSessionId).messages.at(-2)?.content.attachments,
    ).toHaveLength(1);
  });

  it('covers resume failure, tool modal indexing, error recovery, context dedupe, and dialog hide for C29-C34', () => {
    const messages = useChatMessagesStore.getState();
    const tools = useChatToolsStore.getState();
    const sessionId = 'source-constructed-session';

    messages.setSessionMessages(sessionId, [
      toMessage({ role: 'user', loading: false, type: 'text', messageId: 'user-1', contentLength: 5 }),
    ]);
    messages.addSessionMessage(
      sessionId,
      toMessage({ role: 'dex', loading: true, type: 'text', messageId: null, contentLength: 0 }),
    );
    messages.setSessionResponseLoading(sessionId, true);
    messages.setSessionAbortController(sessionId, new AbortController());
    messages.setSessionResumeStreamFailed(sessionId, true);
    expect(useChatMessagesStore.getState().getSessionState(sessionId)).toMatchObject({
      responseLoading: true,
      resumeStreamFailed: true,
    });
    expect(useChatMessagesStore.getState().getSessionState('other-session').resumeStreamFailed).toBe(false);
    expect((c29 as Fixture).sourceKind).toContain('source-constructed');

    const toolMessages: Message[] = [
      toMessage({
        role: 'atlas',
        loading: false,
        type: 'text',
        messageId: 'message-a',
        contentLength: 0,
        toolCalls: [
          { id: 'tool-a', name: 'getSkill', invokeStatus: 'confirmed', status: 'success', auto: true },
          { id: 'tool-b', name: 'dataSourceQuery', invokeStatus: 'confirmed', status: 'success', auto: true },
        ],
      }),
      toMessage({
        role: 'atlas',
        loading: false,
        type: 'text',
        messageId: 'message-b',
        contentLength: 0,
        toolCalls: [{ id: 'tool-c', name: 'getSkill', invokeStatus: 'confirmed', status: 'success', auto: true }],
      }),
    ];
    tools.updateTools(toolMessages);
    expect(useChatToolsStore.getState().toolsByName.getSkill).toHaveLength(2);
    expect(useChatToolsStore.getState().toolsByMessageId['message-b']['tool-c'].version).toBe(2);
    tools.setOpenToolModal(true);
    tools.setActiveMessageId('message-b');
    tools.setActiveTool(toolMessages[1].content.tool_calls?.[0]);
    tools.setAdjustArgs({ code: 'edited' });
    expect(useChatToolsStore.getState()).toMatchObject({
      openToolModal: true,
      activeMessageId: 'message-b',
      adjustArgs: { code: 'edited' },
    });
    expect((c30 as Fixture).sourceKind).toContain('source-equivalent');

    messages.setSessionMessages(sessionId, [
      toMessage({ role: 'user', loading: false, type: 'text', messageId: 'user-error', contentLength: 5 }),
      toMessage({ role: 'dex', loading: true, type: 'text', messageId: null, contentLength: 0 }),
    ]);
    messages.updateSessionLastMessage(sessionId, (last) => ({
      ...last,
      role: 'error',
      loading: false,
      content: { ...last.content, content: 'stream error' },
    }));
    expect(useChatMessagesStore.getState().getSessionState(sessionId).messages.at(-1)).toMatchObject({
      role: 'error',
      loading: false,
    });
    messages.setSessionMessages(sessionId, (prev) => prev.filter((message) => message.role !== 'error'));
    expect(useChatMessagesStore.getState().getSessionState(sessionId).messages.at(-1)?.role).toBe('user');
    const preservedError = toMessage({
      role: 'error',
      loading: false,
      type: 'text',
      messageId: null,
      contentLength: 12,
    });
    messages.setSessionMessages(sessionId, [
      toMessage({ role: 'user', loading: false, type: 'text', messageId: 'history-user', contentLength: 7 }),
      preservedError,
    ]);
    messages.setSessionMessages(sessionId, (prev) => [
      toMessage({ role: 'dex', loading: false, type: 'text', messageId: 'history-ai', contentLength: 2 }),
      ...(prev.at(-1)?.role === 'error' ? [prev.at(-1) as Message] : []),
    ]);
    expect(
      useChatMessagesStore
        .getState()
        .getSessionState(sessionId)
        .messages.map((message) => message.role),
    ).toEqual(['dex', 'error']);
    expect((c31 as Fixture).sourceKind).toContain('source-constructed');

    const contextSessionId = '__case_c32_context__';
    messages.addSessionContextItems(contextSessionId, { type: 'flow-model', uid: 'same', title: 'first' });
    messages.addSessionContextItems(contextSessionId, { type: 'flow-model', uid: 'same', title: 'overwrite' });
    messages.addSessionContextItems(contextSessionId, { type: 'variable', uid: 'same', title: 'variable' });
    messages.addSessionContextItems(contextSessionId, [
      { type: 'flow-model', uid: 'same', title: 'batch overwrite' },
      { type: 'flow-model', uid: 'second', title: 'second' },
    ]);
    expect(useChatMessagesStore.getState().getSessionState(contextSessionId).contextItems).toEqual([
      { type: 'flow-model', uid: 'same', title: 'batch overwrite' },
      { type: 'variable', uid: 'same', title: 'variable' },
      { type: 'flow-model', uid: 'second', title: 'second' },
    ]);
    messages.removeSessionContextItem(contextSessionId, 'flow-model', 'same');
    expect(useChatMessagesStore.getState().getSessionState(contextSessionId).contextItems).toEqual([
      { type: 'variable', uid: 'same', title: 'variable' },
      { type: 'flow-model', uid: 'second', title: 'second' },
    ]);
    expect((c32 as Fixture).snapshots.map((snapshot) => snapshot.label)).toContain(
      'after-remove-only-flow-model-same-uid',
    );

    const dialogSnapshot = getSnapshot(c34 as Fixture, 'after-pick-block-hide');
    const dialogSessionId = dialogSnapshot.conversations?.currentConversation as string;
    messages.setSessionMessages(
      dialogSessionId,
      Array.from({ length: dialogSnapshot.currentSession?.messageCount ?? 0 }, (_, index) =>
        toMessage({
          role: index % 2 ? 'atlas' : 'user',
          loading: false,
          type: 'text',
          messageId: `dialog-${index}`,
          contentLength: 1,
        }),
      ),
    );
    dialogController.hide();
    expect(dialogController.shouldHide).toBe(true);
    expect(useChatMessagesStore.getState().getSessionState(dialogSessionId).messages).toHaveLength(
      dialogSnapshot.currentSession?.messageCount ?? 0,
    );
    dialogController.resume();
    expect(dialogController.shouldHide).toBe(false);
    expect(useChatMessagesStore.getState().getSessionState(dialogSessionId).messages).toHaveLength(
      getSnapshot(c34 as Fixture, 'after-select-block-resume').currentSession?.messageCount ?? 0,
    );
  });
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { autorun } from '@nocobase/flow-engine';
import { describe, expect, it } from 'vitest';
import type { AIEmployee, ContextItem, Conversation, Message, ToolCall } from '../../../types';
import { ChatBoxModel } from '../chat-box';
import { ChatConversationModel } from '../chat-conversations';
import { ChatMessageModel, CHAT_DEFAULT_SESSION_KEY } from '../chat-messages';
import { ChatSenderModel } from '../chat-sender';
import { ChatToolCallModel } from '../chat-tool-call';
import { ChatToolModel } from '../chat-tools';
import { WorkflowTaskModel, type WorkflowTask } from '../workflow-tasks';

const employee = (username: string): AIEmployee => ({
  username,
  nickname: username,
});

const textMessage = (key: string, content = key): Message => ({
  key,
  role: 'user',
  content: {
    type: 'text',
    content,
    messageId: key,
  },
});

const contextItem = (type: string, uid: string): ContextItem => ({
  type,
  uid,
});

const conversation = (sessionId: string, read = false): Conversation => ({
  sessionId,
  title: sessionId,
  updatedAt: '2026-07-16T00:00:00.000Z',
  aiEmployee: employee('atlas'),
  read,
});

const toolCall = (id: string, name: string): ToolCall<unknown> => ({
  id,
  type: 'function',
  name,
  invokeStatus: 'done',
  auto: false,
  args: {},
});

const messageWithToolCalls = (messageId: string, toolCalls: ToolCall<unknown>[]): Message => ({
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
  workflowTitle: 'Workflow',
  nodeTitle: 'Node',
  status,
});

describe('chatbox runtime models', () => {
  it('updates ChatBoxModel UI instance state with existing action semantics', () => {
    const model = new ChatBoxModel();
    const setOpen = model.setOpen;

    model.setCollapsed(true);
    model.setOpen(false);
    expect(model.open).toBe(false);
    expect(model.collapsed).toBe(false);

    model.setCollapsed(true);
    model.setExpanded(true);
    expect(model.expanded).toBe(true);
    expect(model.collapsed).toBe(false);

    model.setCurrentEmployee(employee('atlas'));
    model.setCurrentEmployee((previous) => ({
      ...(previous ?? employee('atlas')),
      nickname: 'Atlas updated',
    }));
    model.setSenderValue('hello');
    model.setTaskVariables({ variables: { recordId: 1 } });
    model.addRole('atlas', { placement: 'start' });
    model.setModel({ llmService: 'openai', model: 'gpt' });
    model.setReadonly(true);

    expect(model.setOpen).toBe(setOpen);
    expect(model.currentEmployee).toMatchObject({ username: 'atlas', nickname: 'Atlas updated' });
    expect(model.senderValue).toBe('hello');
    expect(model.taskVariables).toEqual({ variables: { recordId: 1 } });
    expect(model.roles).toHaveProperty('atlas');
    expect(model.model).toEqual({ llmService: 'openai', model: 'gpt' });
    expect(model.readonly).toBe(true);
  });

  it('proxies legacy ChatBoxModel sender access to an attached ChatSenderModel', () => {
    const chatBoxModel = new ChatBoxModel();
    const chatSenderModel = new ChatSenderModel();

    chatBoxModel.attachSenderModel(chatSenderModel);
    chatBoxModel.setSenderValue('proxied draft');
    chatBoxModel.setShowSenderHint(true);
    chatBoxModel.setIsEditingMessage(true);
    chatBoxModel.setEditingMessageId('message-a');

    expect(chatSenderModel.senderValue).toBe('proxied draft');
    expect(chatSenderModel.isShowSenderHint).toBe(true);
    expect(chatSenderModel.isEditingMessage).toBe(true);
    expect(chatSenderModel.editingMessageId).toBe('message-a');

    chatSenderModel.setSenderValue('sender draft');
    expect(chatBoxModel.senderValue).toBe('sender draft');
  });

  it('updates ChatSenderModel composer state and resets transient values', () => {
    const model = new ChatSenderModel();

    model.setSenderValue('draft');
    model.setSenderPlaceholder('Ask');
    model.setShowSenderHint(true);
    model.setIsEditingMessage(true);
    model.setEditingMessageId('message-a');
    model.setSystemMessage('system');
    model.setSkillSettings({ skills: ['skill-a'] });
    model.addAttachments([{ filename: 'a.txt' }, { filename: 'b.txt' }]);
    model.removeAttachment('a.txt');
    model.addContextItems([contextItem('record', '1'), contextItem('record', '1')]);
    model.addContextItems(contextItem('record', '2'));

    expect(model.senderValue).toBe('draft');
    expect(model.senderPlaceholder).toBe('Ask');
    expect(model.isShowSenderHint).toBe(true);
    expect(model.isEditingMessage).toBe(true);
    expect(model.editingMessageId).toBe('message-a');
    expect(model.systemMessage).toBe('system');
    expect(model.skillSettings).toEqual({ skills: ['skill-a'] });
    expect(model.attachments).toEqual([{ filename: 'b.txt' }]);
    expect(model.contextItems).toEqual([contextItem('record', '1'), contextItem('record', '2')]);

    model.reset();

    expect(model.senderValue).toBe('');
    expect(model.senderPlaceholder).toBe('');
    expect(model.senderRef).toEqual({ current: null });
    expect(model.isShowSenderHint).toBe(false);
    expect(model.isEditingMessage).toBe(false);
    expect(model.editingMessageId).toBeUndefined();
    expect(model.attachments).toEqual([]);
    expect(model.contextItems).toEqual([]);
    expect(model.systemMessage).toBe('');
    expect(model.skillSettings).toBeUndefined();
  });

  it('keeps ChatSenderModel state isolated per instance', () => {
    const first = new ChatSenderModel();
    const second = new ChatSenderModel();

    first.setSenderValue('first');
    first.addAttachments({ filename: 'first.txt' });
    first.addContextItems(contextItem('record', '1'));

    expect(second.senderValue).toBe('');
    expect(second.attachments).toEqual([]);
    expect(second.contextItems).toEqual([]);
  });

  it('keeps ChatMessageModel session state isolated and returns cloned snapshots', () => {
    const model = new ChatMessageModel();

    model.addSessionMessage('session-a', textMessage('message-a'));
    model.addSessionMessage('session-b', textMessage('message-b'));
    model.setSessionAttachments('session-a', [{ filename: 'a.txt' }]);
    model.addSessionContextItems('session-a', [contextItem('record', '1'), contextItem('record', '1')]);

    const snapshot = model.getSessionState('session-a');
    snapshot.messages.push(textMessage('mutated'));
    snapshot.attachments.push({ filename: 'mutated.txt' });

    expect(model.getSessionState('session-a').messages.map((message) => message.key)).toEqual(['message-a']);
    expect(model.getSessionState('session-a').attachments).toEqual([{ filename: 'a.txt' }]);
    expect(model.getSessionState('session-a').contextItems).toEqual([contextItem('record', '1')]);
    expect(model.getSessionState('session-b').messages.map((message) => message.key)).toEqual(['message-b']);
  });

  it('keeps ChatMessageModel session objects reactive and isolated while migrating draft state', () => {
    const model = new ChatMessageModel();
    const initialSessions = model.sessions;
    const initialDefaultSession = model.sessions[CHAT_DEFAULT_SESSION_KEY];
    let messageCount = -1;
    const dispose = autorun(() => {
      messageCount = model.sessions[CHAT_DEFAULT_SESSION_KEY].messages.length;
    });

    model.addSessionMessage(undefined, textMessage('draft-message'));

    expect(model.sessions).toBe(initialSessions);
    expect(model.sessions[CHAT_DEFAULT_SESSION_KEY]).toBe(initialDefaultSession);
    expect(messageCount).toBe(1);
    expect(model.getSessionState().messages.map((message) => message.key)).toEqual(['draft-message']);

    model.migrateSessionState(undefined, 'created-session');
    dispose();

    expect(model.getSessionState('created-session').messages.map((message) => message.key)).toEqual(['draft-message']);
    expect(model.getSessionState().messages).toEqual([]);
  });

  it('does not replace other ChatMessageModel sessions when one session field changes', () => {
    const model = new ChatMessageModel();
    model.addSessionMessage('session-a', textMessage('message-a'));
    model.addSessionMessage('session-b', textMessage('message-b'));

    const sessions = model.sessions;
    const sessionA = model.sessions['session-a'];
    const sessionB = model.sessions['session-b'];

    model.setSessionMessagesLoading('session-a', true);

    expect(model.sessions).toBe(sessions);
    expect(model.sessions['session-a']).toBe(sessionA);
    expect(model.sessions['session-b']).toBe(sessionB);
    expect(model.sessions['session-a'].messagesLoading).toBe(true);
    expect(model.sessions['session-b'].messagesLoading).toBe(false);
  });

  it('updates ChatMessageModel sub-agent conversation state on the last message', () => {
    const model = new ChatMessageModel();

    model.addSessionMessage('session-a', textMessage('assistant-message'));
    model.addSessionSubAgentMessages('session-a', 'sub-session-a', [textMessage('sub-message-a')]);
    model.updateSessionLastSubAgentMessage('session-a', 'sub-session-a', 'atlas', (message) => ({
      ...message,
      content: {
        ...message.content,
        content: 'updated',
      },
    }));
    model.updateSessionSubAgentConversationStatus('session-a', 'sub-session-a', 'completed');

    const lastMessage = model.getSessionState('session-a').messages[0];
    expect(lastMessage.content.subAgentConversations).toEqual([
      {
        sessionId: 'sub-session-a',
        status: 'completed',
        messages: [
          {
            ...textMessage('sub-message-a'),
            content: {
              ...textMessage('sub-message-a').content,
              content: 'updated',
            },
          },
        ],
      },
    ]);
  });

  it('tracks ChatToolCallModel invoke state per session and migrates it', () => {
    const model = new ChatToolCallModel();
    const draftSnapshot = model.getSessionState('draft-session');

    model.updateToolCallInvokeStatus('draft-session', 'message-a', 'tool-a', 'interrupted');
    model.updateToolCallInvokeStatus('other-session', 'message-a', 'tool-a', 'waiting');
    const sessions = model.sessions;
    const draftSession = model.sessions['draft-session'];
    const otherSession = model.sessions['other-session'];

    expect(draftSnapshot.toolCalls).toEqual({});
    expect(model.isInterrupted('draft-session', 'message-a', 'tool-a')).toBe(true);
    expect(model.isAllWaiting('draft-session', 'message-a')).toBe(false);

    model.updateToolCallInvokeStatus('draft-session', 'message-a', 'tool-a', 'waiting');
    expect(model.sessions).toBe(sessions);
    expect(model.sessions['draft-session']).toBe(draftSession);
    expect(model.sessions['other-session']).toBe(otherSession);
    expect(model.isAllWaiting('draft-session', 'message-a')).toBe(true);

    model.migrateSessionState('draft-session', 'created-session');

    expect(model.getInvokeStatus('created-session', 'message-a', 'tool-a')).toBe('waiting');
    expect(model.getSessionState('draft-session').toolCalls).toEqual({});
    expect(model.getInvokeStatus('other-session', 'message-a', 'tool-a')).toBe('waiting');
  });

  it('indexes ChatToolModel tool calls by name and message id', () => {
    const model = new ChatToolModel();

    model.updateTools([
      messageWithToolCalls('message-a', [toolCall('tool-a', 'getSkill')]),
      messageWithToolCalls('message-b', [toolCall('tool-b', 'getSkill')]),
    ]);
    model.setOpenToolModal(true);
    model.setActiveTool(toolCall('tool-b', 'getSkill'));
    model.setActiveMessageId('message-b');
    model.setAdjustArgs({ title: 'updated' });

    expect(model.toolsByName.getSkill).toHaveLength(2);
    expect(model.toolsByName.getSkill[0]).toMatchObject({
      id: 'tool-a',
      messageId: 'message-a',
    });
    expect(model.toolsByMessageId['message-b']['tool-b']).toMatchObject({
      name: 'getSkill',
      version: 2,
    });
    expect(model.openToolModal).toBe(true);
    expect(model.activeTool).toMatchObject({ id: 'tool-b' });
    expect(model.activeMessageId).toBe('message-b');
    expect(model.adjustArgs).toEqual({ title: 'updated' });
  });

  it('updates ChatConversationModel list UI state and unread counts', () => {
    const model = new ChatConversationModel();

    model.setCurrentConversation('session-a');
    model.setKeyword('review');
    model.setWebSearch(true);
    model.setConversationSegmented('workflowTasks');
    model.setConversations([conversation('session-a'), conversation('session-b', true)]);
    model.setConversations((previous) => [...previous, conversation('session-c')]);
    model.setUnreadCount((previous) => previous + 2);
    model.markConversationRead('session-a');

    expect(model.currentConversation).toBe('session-a');
    expect(model.keyword).toBe('review');
    expect(model.webSearch).toBe(true);
    expect(model.conversationSegmented).toBe('workflowTasks');
    expect(model.conversations.map((item) => item.sessionId)).toEqual(['session-a', 'session-b', 'session-c']);
    expect(model.conversations[0].read).toBe(true);
    expect(model.unreadCount).toBe(1);

    model.setConversationRead('session-b', false);
    expect(model.conversations[1].read).toBe(false);
    expect(model.unreadCount).toBe(2);

    model.markConversationRead('session-a');
    model.markConversationRead('missing-session');

    expect(model.unreadCount).toBe(2);
  });

  it('updates WorkflowTaskModel list UI state, normalization, and unread counts', () => {
    const model = new WorkflowTaskModel();

    model.setWorkflowTasks([workflowTask('session-pending', 'pending_approval')]);
    model.setWorkflowTasks((previous) => [...previous, workflowTask('session-approved', 'approved')]);
    model.setCurrentWorkflowTask((previous) => ({
      ...(previous ?? workflowTask('session-approved')),
      readonly: true,
    }));
    model.setUnreadCount((previous) => previous + 2);
    model.setLoading(true);
    model.setKeyword('approval');
    model.setSelectedJobStatus(1);
    model.markWorkflowTaskRead('session-pending');

    expect(model.workflowTasks.map((item) => ({ sessionId: item.sessionId, jobStatus: item.jobStatus }))).toEqual([
      { sessionId: 'session-pending', jobStatus: 0 },
      { sessionId: 'session-approved', jobStatus: 1 },
    ]);
    expect(model.currentWorkflowTask).toMatchObject({ sessionId: 'session-approved', readonly: true });
    expect(model.loading).toBe(true);
    expect(model.keyword).toBe('approval');
    expect(model.selectedJobStatus).toBe(1);
    expect(model.workflowTasks[0].read).toBe(true);
    expect(model.unreadCount).toBe(1);

    model.markWorkflowTaskRead('session-pending');
    model.markWorkflowTaskRead('missing-session');

    expect(model.unreadCount).toBe(1);
  });
});

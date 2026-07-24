/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useChatBoxActions } from '../useChatBoxActions';
import { useChatBoxStore } from '../../stores/chat-box';
import { useChatConversationsStore } from '../../stores/chat-conversations';
import { CHAT_DEFAULT_SESSION_KEY, useChatMessagesStore } from '../../stores/chat-messages';
import { useWorkflowTasksStore } from '../../stores/workflow-tasks';

vi.mock('@nocobase/client-v2', () => ({
  useApp: () => ({ apiClient: {} }),
}));

vi.mock('../../../../locale', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('../../../../repositories/hooks/useAIConfigRepository', () => ({
  useAIConfigRepository: () => ({
    getLLMServices: vi.fn(async () => []),
  }),
}));

vi.mock('../useChatConversationActions', () => ({
  useChatConversationActions: () => ({ refresh: vi.fn() }),
}));

vi.mock('../useChatMessageActions', () => ({
  useChatMessageActions: () => ({
    sendMessages: vi.fn(),
    syncContextAttachments: vi.fn(() => []),
  }),
}));

describe('useChatBoxActions workspace conversation lifecycle', () => {
  beforeEach(() => {
    useChatBoxStore.setState({
      currentEmployee: {
        username: 'nathan',
        nickname: 'Nathan',
        greeting: 'Hello',
      } as never,
      senderValue: 'stale sender',
      taskVariables: {},
    });
    useChatConversationsStore.setState({ currentConversation: 'session-current' });
    useWorkflowTasksStore.setState({ currentWorkflowTask: 'workflow-current' });
    useChatMessagesStore.setState({
      sessions: {
        [CHAT_DEFAULT_SESSION_KEY]: useChatMessagesStore.getState().getSessionState('__missing__'),
        'session-current': useChatMessagesStore.getState().getSessionState('__missing__'),
      },
      editorRef: {},
    });
  });

  it('starts a fresh draft without carrying target, mismatch, or context from an abandoned draft', () => {
    const store = useChatMessagesStore.getState();
    store.bindSessionCodingTarget(undefined, {
      type: 'workspace',
      applicationKey: 'app-a',
      surfaceId: 'workspace-a',
      kind: 'runjs-studio',
      title: 'Workspace A',
    });
    store.bindSessionCodingTarget(undefined, {
      type: 'workspace',
      applicationKey: 'app-a',
      surfaceId: 'workspace-b',
      kind: 'runjs-studio',
      title: 'Workspace B',
    });
    store.setSessionContextItems(undefined, [
      { type: 'code-workspace', uid: 'workspace-a', content: { surfaceId: 'workspace-a' } },
    ]);

    const { result } = renderHook(() => useChatBoxActions());
    act(() => result.current.startNewConversation());

    expect(useChatConversationsStore.getState().currentConversation).toBeUndefined();
    expect(useWorkflowTasksStore.getState().currentWorkflowTask).toBeUndefined();
    expect(useChatMessagesStore.getState().getSessionState()).toMatchObject({
      codingTarget: undefined,
      codingTargetMismatch: undefined,
      contextItems: [],
      messages: [expect.objectContaining({ role: 'nathan', content: expect.objectContaining({ content: 'Hello' }) })],
    });
  });

  it('starts a fresh draft when manually switching AI employees', () => {
    const store = useChatMessagesStore.getState();
    store.bindSessionCodingTarget(undefined, {
      type: 'workspace',
      applicationKey: 'app-a',
      surfaceId: 'workspace-a',
      kind: 'runjs-studio',
      title: 'Workspace A',
    });
    store.bindSessionCodingTarget(undefined, {
      type: 'workspace',
      applicationKey: 'app-a',
      surfaceId: 'workspace-b',
      kind: 'runjs-studio',
      title: 'Workspace B',
    });
    store.setSessionContextItems(undefined, [
      { type: 'code-workspace', uid: 'workspace-a', content: { surfaceId: 'workspace-a' } },
    ]);

    const { result } = renderHook(() => useChatBoxActions());
    act(() =>
      result.current.switchAIEmployee({
        username: 'ava',
        nickname: 'Ava',
        greeting: 'Hi from Ava',
      } as never),
    );

    expect(useChatMessagesStore.getState().getSessionState()).toMatchObject({
      codingTarget: undefined,
      codingTargetMismatch: undefined,
      contextItems: [],
      messages: [
        expect.objectContaining({ role: 'ava', content: expect.objectContaining({ content: 'Hi from Ava' }) }),
      ],
    });
  });
});

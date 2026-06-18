/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import PluginAIClientV2, {
  AIConfigRepository,
  AIEmployeeSwitcher,
  AIEmployeeProfileCard,
  AIEmployeeShortcut,
  ChatBox,
  ChatBoxLayout,
  ChatButton,
  AIPluginFeatureManagerImpl,
  ModelSwitcher,
  avatars,
  avatarsMap,
  defaultVectorStorePropForm,
  formatModelLabel,
  useAIConfigRepository,
  useChatBoxActions,
  useChatBoxStore,
  useChatConversationsStore,
  useChatMessagesStore,
} from '@nocobase/plugin-ai/client-v2';
import type {
  AIEmployee,
  Attachment,
  ChatEditorRef,
  ContextItem,
  Conversation,
  LLMServiceItem,
  Message,
  SkillSettings,
  Task,
  TriggerTaskOptions,
  WebSearching,
} from '@nocobase/plugin-ai/client-v2';

describe('plugin-ai client-v2 public API contract', () => {
  it('keeps the values consumed by current client-v2 dependents exported', () => {
    expect(PluginAIClientV2).toBeDefined();
    expect(AIEmployeeShortcut).toBeDefined();
    expect(AIEmployeeProfileCard).toBeDefined();
    expect(ChatBox).toBeDefined();
    expect(ChatBoxLayout).toBeDefined();
    expect(ChatButton).toBeDefined();
    expect(AIEmployeeSwitcher).toBeDefined();
    expect(ModelSwitcher).toBeDefined();
    expect(avatars).toBeDefined();
    expect(avatarsMap).toBeDefined();
    expect(formatModelLabel).toBeDefined();
    expect(AIConfigRepository).toBeDefined();
    expect(AIPluginFeatureManagerImpl).toBeDefined();
    expect(defaultVectorStorePropForm).toBeDefined();
    expect(useAIConfigRepository).toBeDefined();
    expect(useChatMessagesStore).toBeDefined();
    expect(useChatBoxStore).toBeDefined();
    expect(useChatConversationsStore).toBeDefined();
    expect(useChatBoxActions).toBeDefined();
  });

  it('keeps the exported type surface available', () => {
    const aiEmployee: AIEmployee = { username: 'dara' };
    const attachment: Attachment = {};
    const editorRef: Pick<ChatEditorRef, 'read' | 'write' | 'snippetEntries' | 'logs'> = {
      read: () => '',
      write: () => {},
      snippetEntries: [],
      logs: [],
    };
    const contextItem: ContextItem = { type: 'chart-config', uid: 'chart-1' };
    const conversation: Conversation = {
      sessionId: 'session-1',
      title: 'Session',
      updatedAt: '2026-06-17T00:00:00.000Z',
      aiEmployee,
      read: true,
    };
    const llmService: LLMServiceItem = {
      llmService: 'openai',
      llmServiceTitle: 'OpenAI',
      enabledModels: [{ label: 'GPT-4o', value: 'gpt-4o' }],
    };
    const message: Message = { content: { content: 'Hello' } };
    const skillSettings: SkillSettings = { tools: [], skills: [] };
    const task: Task = { title: 'Translate' };
    const triggerTaskOptions: TriggerTaskOptions = { aiEmployee, tasks: [task] };
    const webSearching: WebSearching = { type: 'search', query: 'NocoBase' };

    expect({
      aiEmployee,
      attachment,
      editorRef,
      contextItem,
      conversation,
      llmService,
      message,
      skillSettings,
      triggerTaskOptions,
      webSearching,
    }).toBeDefined();
  });
});

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
  ChatBoxRuntimeProvider,
  ChatButton,
  AIPluginFeatureManagerImpl,
  ModelSwitcher,
  avatars,
  avatarsMap,
  createModelSettingsForm,
  defaultVectorStorePropForm,
  formatModelLabel,
  getGlobalChatBoxRuntime,
  ModelSelect,
  OptionsFields,
  useAIConfigRepository,
  useChatBoxActions,
} from '@nocobase/plugin-ai/client-v2';
import type {
  AIEmployee,
  Attachment,
  ChatEditorRef,
  ContextItem,
  Conversation,
  LLMServiceItem,
  Message,
  OptionField,
  SkillSettings,
  Task,
  TriggerModelTaskOptions,
  TriggerTaskOptions,
  UploadAIFileOptions,
  WebSearching,
} from '@nocobase/plugin-ai/client-v2';

describe('plugin-ai client-v2 public API contract', () => {
  it('keeps the values consumed by current client-v2 dependents exported', () => {
    expect(PluginAIClientV2).toBeDefined();
    expect(AIEmployeeShortcut).toBeDefined();
    expect(AIEmployeeProfileCard).toBeDefined();
    expect(ChatBox).toBeDefined();
    expect(ChatBoxLayout).toBeDefined();
    expect(ChatBoxRuntimeProvider).toBeDefined();
    expect(ChatButton).toBeDefined();
    expect(AIEmployeeSwitcher).toBeDefined();
    expect(ModelSwitcher).toBeDefined();
    expect(avatars).toBeDefined();
    expect(avatarsMap).toBeDefined();
    expect(createModelSettingsForm).toBeDefined();
    expect(ModelSelect).toBeDefined();
    expect(OptionsFields).toBeDefined();
    expect(formatModelLabel).toBeDefined();
    expect(AIConfigRepository).toBeDefined();
    expect(AIPluginFeatureManagerImpl).toBeDefined();
    expect(defaultVectorStorePropForm).toBeDefined();
    expect(useAIConfigRepository).toBeDefined();
    expect(useChatBoxActions).toBeDefined();
    expect(getGlobalChatBoxRuntime).toBeDefined();
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
    const optionField: OptionField = { name: 'temperature', title: 'Temperature' };
    const skillSettings: SkillSettings = { tools: [], skills: [] };
    const task: Task = { title: 'Translate' };
    const triggerModelTaskOptions: TriggerModelTaskOptions = { attachments: [attachment] };
    const triggerTaskOptions: TriggerTaskOptions = { aiEmployee, tasks: [task], chatBoxUid: 'chat-box-1' };
    const uploadOptions: UploadAIFileOptions = { onProgress: () => {} };
    const webSearching: WebSearching = { type: 'search', query: 'NocoBase' };

    expect({
      aiEmployee,
      attachment,
      editorRef,
      contextItem,
      conversation,
      llmService,
      message,
      optionField,
      skillSettings,
      triggerModelTaskOptions,
      triggerTaskOptions,
      uploadOptions,
      webSearching,
    }).toBeDefined();
  });
});

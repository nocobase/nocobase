/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export { default, PluginAIClientV2 } from './plugin';

export { AIEmployeeProfileCard } from './ai-employees/ProfileCard';
export { AIEmployeeShortcut } from './ai-employees/AIEmployeeShortcut';
export { AddContextButton } from './ai-employees/AddContextButton';
export { AISelection } from './ai-employees/AISelection';
export { AISelectionControl } from './ai-employees/AISelectionControl';
export { avatars, avatarsMap } from './ai-employees/avatars';
export type {
  AIEmployee,
  Attachment,
  ChatEditorRef,
  ContextItem,
  Conversation,
  Message,
  SkillSettings,
  Task,
  TriggerTaskOptions,
  WebSearching,
} from './ai-employees/types';
export { formatModelLabel } from './llm-services/model-label';
export { createModelSettingsForm, ModelSelect, OptionsFields, type OptionField } from './llm-providers/forms';
export { AIConfigRepository, type LLMServiceItem } from './repositories/AIConfigRepository';
export { AIPluginFeatureManagerImpl } from './manager/ai-feature-manager';
export { AIManager } from './manager/ai-manager';
export type { LLMProviderOptions, ToolModalProps, ToolOptions } from './manager/ai-manager';
export * from './features';
export { defaultVectorStorePropForm } from './features/components';
export { useAIConfigRepository } from './repositories/hooks/useAIConfigRepository';
export { useChatConversationsStore } from './ai-employees/chatbox/stores/chat-conversations';
export { useChatBoxActions } from './ai-employees/chatbox/hooks/useChatBoxActions';
export {
  ChatBox,
  ChatBoxLayout,
  ChatButton,
  AIEmployeeSwitcher,
  ModelSwitcher,
} from './ai-employees/chatbox/components';

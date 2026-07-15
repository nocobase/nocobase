/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useContext } from 'react';
import { getOrCreateGlobalStore } from '../../stores/global-store';
import { ChatBoxModel } from './chat-box';
import { ChatConversationModel } from './chat-conversations';
import { ChatMessageModel } from './chat-messages';
import { ChatToolCallModel } from './chat-tool-call';
import { ChatToolModel } from './chat-tools';
import { WorkflowTaskModel } from './workflow-tasks';

export type ChatBoxRuntime = {
  chatBoxModel: ChatBoxModel;
  chatConversationModel: ChatConversationModel;
  chatMessageModel: ChatMessageModel;
  chatToolCallModel: ChatToolCallModel;
  chatToolModel: ChatToolModel;
  workflowTaskModel: WorkflowTaskModel;
};

export const createChatBoxRuntime = (runtime?: Partial<ChatBoxRuntime>): ChatBoxRuntime => ({
  chatBoxModel: runtime?.chatBoxModel ?? new ChatBoxModel(),
  chatConversationModel: runtime?.chatConversationModel ?? new ChatConversationModel(),
  chatMessageModel: runtime?.chatMessageModel ?? new ChatMessageModel(),
  chatToolCallModel: runtime?.chatToolCallModel ?? new ChatToolCallModel(),
  chatToolModel: runtime?.chatToolModel ?? new ChatToolModel(),
  workflowTaskModel: runtime?.workflowTaskModel ?? new WorkflowTaskModel(),
});

export const getGlobalChatBoxRuntime = () =>
  getOrCreateGlobalStore('@nocobase/plugin-ai/chat-box-runtime', () => createChatBoxRuntime());

export const ChatBoxContext = createContext<ChatBoxRuntime | null>(null);

export const ChatBoxRuntimeProvider: React.FC<{
  runtime: ChatBoxRuntime;
  children?: React.ReactNode;
}> = ({ runtime, children }) => {
  return <ChatBoxContext.Provider value={runtime}>{children}</ChatBoxContext.Provider>;
};

export const useChatBoxRuntime = () => {
  const runtime = useContext(ChatBoxContext);
  if (!runtime) {
    throw new Error('ChatBox runtime is missing. Wrap chatbox UI with ChatBoxRuntimeProvider.');
  }
  return runtime;
};

export const useResolvedChatBoxRuntime = (runtime?: ChatBoxRuntime) => {
  const contextRuntime = useContext(ChatBoxContext);
  const resolvedRuntime = runtime ?? contextRuntime;
  if (!resolvedRuntime) {
    throw new Error('ChatBox runtime is missing. Pass runtime or wrap chatbox UI with ChatBoxRuntimeProvider.');
  }
  return resolvedRuntime;
};

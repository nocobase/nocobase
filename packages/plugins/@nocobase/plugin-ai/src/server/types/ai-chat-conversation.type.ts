/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Transaction } from '@nocobase/database';
import { LLMProvider } from '../llm-providers/provider';
import { WorkContextHandler } from './work-context-handler.type';
import { AIMessage, AIToolCall } from './ai-message.type';

export interface AIChatConversation extends TransactionSupported<AIChatConversation> {
  getSessionId(): string;
  addMessages(messages: AIMessageInput): Promise<AIMessage>;
  addMessages(messages: AIMessageInput[]): Promise<AIMessage[]>;
  removeMessages(options: AIMessageRemoveOptions): Promise<void>;
  getMessage(messageId: string): Promise<AIMessage | null>;
  listMessages(query?: AIMessageQuery): Promise<AIMessage[]>;
  lastUserMessage(): Promise<AIMessage>;
  getChatContext(options?: AIChatContextOptions): Promise<AIChatContext>;
}

export interface TransactionSupported<T> {
  withTransaction<R>(
    runnable: (instance: T, transaction: Transaction) => Promise<R>,
    transaction?: Transaction,
  ): Promise<R>;
}

export type AIChatContext = {
  messages: {
    role: 'user' | 'assistant' | 'tool';
    content: any;
    tool_call_id?: string;
    tool_calls?: AIToolCall[];
  }[];
  tools?: any[];
  structuredOutput?: {
    name: string;
    description?: string;
    schema: any;
    strict?: boolean;
  };
};

export type AIMessageInput = Omit<AIMessage, 'messageId' | 'sessionId'>;

export type AIMessageQuery = {
  messageId?: string;
};

export type AIMessageRemoveOptions = {
  messageId?: string;
};

export type AIChatContextOptions = {
  workContextHandler: WorkContextHandler;
  provider: LLMProvider;
  getSystemPrompt?: (aiMessages: AIMessage[]) => Promise<string>;
  tools?: any[];
} & AIMessageQuery;

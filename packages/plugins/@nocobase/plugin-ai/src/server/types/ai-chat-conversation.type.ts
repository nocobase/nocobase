/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Transaction } from '@nocobase/database';
import { AIMessage, AIToolCall, UserDecision } from './ai-message.type';

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
  systemPrompt?: string;
  messages?: {
    role: 'user' | 'assistant' | 'tool' | 'system';
    content: any;
    tool_call_id?: string;
    tool_calls?: AIToolCall[];
  }[];
  decisions?: UserDecision[];
  tools?: any[];
  middleware?: any[];
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
  userMessages?: AIMessageInput[];
  userDecisions?: UserDecision[];
  tools?: any[];
  middleware?: any[];
  getSystemPrompt?: () => Promise<string>;
  formatMessages?: (messages: AIMessageInput[]) => Promise<any[]>;
} & AIMessageQuery;

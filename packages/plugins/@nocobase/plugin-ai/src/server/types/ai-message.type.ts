/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type AIMessage = {
  messageId: string;
  sessionId: string;
  role: string;
  content: AIMessageContent;
  toolCalls?: AIToolCall[];
  attachments?: unknown[];
  workContext?: WorkContext[];
  metadata?: AIMessageMetadata;
};

export type WorkContext = {
  type: string;
  uid: string;
  title?: string;
  content?: unknown;
  [key: string]: unknown;
};

export type AIMessageContent = {
  type: string;
  content: unknown;
};

export type AIToolCall = {
  id: string;
  name: string;
  type: string;
  args: unknown;
};

export type AIMessageMetadata = {
  model: string;
  provider: string;
  usage_metadata?: any;
  response_metadata?: any;
  additional_kwargs?: Record<string, unknown>;
  toolCall?: AIToolCall;
  autoCallTools?: string[];
  autoCall?: boolean;
  interrupted?: boolean;

  [key: string]: unknown;
};

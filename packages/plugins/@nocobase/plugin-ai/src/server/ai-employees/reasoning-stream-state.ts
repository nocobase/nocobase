/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type StreamConversation = {
  sessionId: string;
  from: string;
  username: string;
};

const getConversationKey = (conversation: StreamConversation) =>
  `${conversation.from}:${conversation.sessionId}:${conversation.username}`;

export class ReasoningStreamState {
  private readonly active = new Map<string, StreamConversation>();

  start(conversation: StreamConversation) {
    this.active.set(getConversationKey(conversation), conversation);
  }

  stop(conversation: StreamConversation): boolean {
    return this.active.delete(getConversationKey(conversation));
  }

  drain(): StreamConversation[] {
    const conversations = Array.from(this.active.values());
    this.active.clear();
    return conversations;
  }
}

export const isReasoningFinishChunk = (chunk: {
  response_metadata?: Record<string, unknown>;
  usage_metadata?: Record<string, unknown>;
}) => {
  const metadata = chunk.response_metadata;
  if (!metadata) {
    return false;
  }
  const finishReason = metadata.finish_reason ?? metadata.finishReason;
  if (typeof finishReason === 'string' && finishReason.length > 0) {
    return true;
  }
  return metadata.status === 'completed' || metadata.status === 'incomplete' || metadata.status === 'failed';
};

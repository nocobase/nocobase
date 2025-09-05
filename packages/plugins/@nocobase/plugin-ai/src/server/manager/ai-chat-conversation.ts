/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import {
  AIChatContext,
  AIChatContextOptions,
  AIChatConversation,
  AIMessage,
  AIMessageInput,
  AIMessageQuery,
  AIMessageRemoveOptions,
} from '../types/ai-chat-conversation.type';
import { Context } from '@nocobase/actions';
import PluginAIServer from '../plugin';
import { Filter, Transaction } from '@nocobase/database';
import { LLMProvider } from '../llm-providers/provider';
export const createAIChatConversation = (ctx: Context, sessionId: string): AIChatConversation => {
  return new AIChatConversationImpl(ctx, sessionId);
};

class AIChatConversationImpl implements AIChatConversation {
  private transaction?: Transaction;
  constructor(
    private ctx: Context,
    private sessionId: string,
  ) {}

  async withTransaction<T>(runnable: (instance, transaction) => Promise<T>, transaction: Transaction): Promise<T> {
    const instance = this.clone();
    if (transaction) {
      instance.transaction = transaction;
      return await runnable(instance, transaction);
    }
    return await instance.ctx.db.sequelize.transaction(async (transaction) => {
      instance.transaction = transaction;
      return await runnable(instance, transaction);
    });
  }

  getSessionId(): string {
    return this.sessionId;
  }

  async addMessages(messages: AIMessageInput): Promise<AIMessage>;
  async addMessages(messages: AIMessageInput[]): Promise<AIMessage[]>;
  async addMessages(messages: AIMessageInput | AIMessageInput[]): Promise<AIMessage | AIMessage[]> {
    const isArray = _.isArray(messages);
    const messageList = isArray ? messages : [messages];
    const instances: AIMessage[] = await this.aiConversationMessagesRepo.create({
      values: messageList.map(
        (message) =>
          ({
            messageId: String(this.snowflake()),
            sessionId: this.sessionId,
            role: message.role,
            content: message.content,
            attachments: message.attachments,
            workContext: message.workContext,
            metadata: message.metadata,
            toolCalls: message.toolCalls,
          }) as AIMessage,
      ),
      transaction: this.transaction,
    });
    return isArray ? instances : instances[0];
  }
  async removeMessages({ messageId }: AIMessageRemoveOptions): Promise<void> {
    const filter: Filter = {
      sessionId: this.sessionId,
    };
    if (messageId) {
      filter.messageId = {
        $gte: messageId,
      };
    }
    await this.aiMessagesRepo.destroy({
      filter,
      transaction: this.transaction,
    });
  }
  async getMessage(messageId: string): Promise<AIMessage | null> {
    return await this.aiMessagesRepo.findByTargetKey(messageId);
  }
  async listMessages(query: AIMessageQuery): Promise<AIMessage[]> {
    const filter: Filter = {
      sessionId: this.sessionId,
    };
    if (query?.messageId) {
      filter.messageId = {
        $lt: query.messageId,
      };
    }
    return await this.aiConversationMessagesRepo.find({
      sort: ['messageId'],
      filter,
    });
  }

  async lastUserMessage(): Promise<AIMessage> {
    const filter: Filter = {
      sessionId: this.sessionId,
      role: 'user',
    };
    return await this.aiConversationMessagesRepo.findOne({
      sort: ['-messageId'],
      filter,
    });
  }

  async getChatContext(options: AIChatContextOptions): Promise<AIChatContext> {
    const aiMessages = await this.listMessages(options);
    const messages = await this.formatMessages(aiMessages, options.provider);
    if (options?.systemPrompt) {
      messages.unshift({
        role: 'system',
        content: options.systemPrompt,
      });
    }
    return {
      messages,
      tools: options?.tools,
    };
  }

  private async formatMessages(messages: AIMessage[], provider: LLMProvider) {
    const formattedMessages = [];

    for (const msg of messages) {
      const attachments = msg.attachments;
      const workContext = msg.workContext;
      let content = msg.content.content;
      if (!content && !attachments && !msg.toolCalls?.length) {
        continue;
      }
      if (msg.role === 'user') {
        if (typeof content === 'string') {
          content = `<user_query>${content}</user_query>`;
          if (workContext?.length) {
            content = `<work_context>${JSON.stringify(workContext)}</work_context>
${content}`;
          }
        }
        const contents = [];
        if (attachments?.length) {
          for (const attachment of attachments) {
            const parsed = await provider.parseAttachment(attachment);
            contents.push(parsed);
          }
          if (content) {
            contents.push({
              type: 'text',
              text: content,
            });
          }
        }
        formattedMessages.push({
          role: 'user',
          content: contents.length ? contents : content,
        });
        continue;
      }
      if (msg.role === 'tool') {
        formattedMessages.push({
          role: 'tool',
          content,
          tool_call_id: msg.metadata?.toolCall?.id,
        });
        continue;
      }
      formattedMessages.push({
        role: 'assistant',
        content,
        tool_calls: msg.toolCalls,
      });
    }

    return formattedMessages;
  }

  private clone(): AIChatConversationImpl {
    return new AIChatConversationImpl(this.ctx, this.sessionId);
  }

  private snowflake() {
    return this.aiPlugin.snowflake.generate();
  }

  private get aiConversationMessagesRepo() {
    return this.ctx.db.getRepository('aiConversations.messages', this.sessionId);
  }

  private get aiMessagesRepo() {
    return this.ctx.db.getRepository('aiMessages');
  }

  private get aiPlugin(): PluginAIServer {
    return this.ctx.app.pm.get('ai');
  }
}

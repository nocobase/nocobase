import _ from 'lodash';
import {
  AiChatContext,
  AiChatContextOptions,
  AiChatConversation,
  AiMessage,
  AiMessageInput,
  AiMessageQuery,
  AiMessageRemoveOptions,
} from '../types/ai-chat-conversation.type';
import { Context } from '@nocobase/actions';
import PluginAIServer from '../plugin';
import { Filter, Transaction } from '@nocobase/database';
export const createAiChatConversation = (ctx: Context, sessionId: string): AiChatConversation => {
  return new AiChatConversationImpl(ctx, sessionId);
};

class AiChatConversationImpl implements AiChatConversation {
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

  async addMessages(messages: AiMessageInput): Promise<AiMessage>;
  async addMessages(messages: AiMessageInput[]): Promise<AiMessage[]>;
  async addMessages(messages: AiMessageInput | AiMessageInput[]): Promise<AiMessage | AiMessage[]> {
    const isArray = _.isArray(messages);
    const messageList = isArray ? messages : [messages];
    const instances: AiMessage[] = await this.aiConversationMessagesRepo.create({
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
          }) as AiMessage,
      ),
      transaction: this.transaction,
    });
    return isArray ? instances : instances[0];
  }
  async removeMessages({ messageId }: AiMessageRemoveOptions): Promise<void> {
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
  async getMessage(messageId: string): Promise<AiMessage | null> {
    return await this.aiMessagesRepo.findByTargetKey(messageId);
  }
  async listMessages(query: AiMessageQuery): Promise<AiMessage[]> {
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
  async getChatContext(options: AiChatContextOptions): Promise<AiChatContext> {
    const aiMessages = await this.listMessages(options);
    const messages = await this.formatMessages(aiMessages);
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

  private formatMessages(messages: AiMessage[]) {
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
            contents.push({
              type: 'file',
              content: attachment,
            });
          }
          if (content) {
            contents.push({
              type: 'text',
              content,
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

  private clone(): AiChatConversationImpl {
    return new AiChatConversationImpl(this.ctx, this.sessionId);
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

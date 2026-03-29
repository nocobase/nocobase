/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { Model } from '@nocobase/database';
import { AIEmployee, ModelRef } from '../ai-employee';
import type PluginAIServer from '../../plugin';
import type { SubAgentConversationMetadata, UserDecision } from '../../types';

export type SubAgentTask = {
  ctx: Context;
  sessionId: string;
  employee: Model;
  model: ModelRef;
  question: string;
  skillSettings?: Record<string, any>;
  writer?: (chunk: any) => void;
};

export class SubAgentsDispatcher {
  constructor(protected plugin: PluginAIServer) {}

  private extractTextContent(content: unknown): string {
    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .map((block) => {
          if (typeof block === 'string') {
            return block;
          }
          if (block && typeof block === 'object' && 'type' in block && (block as any).type === 'text') {
            return typeof (block as any).text === 'string' ? (block as any).text : '';
          }
          return '';
        })
        .join('');
    }

    if (content && typeof content === 'object' && 'content' in content) {
      return this.extractTextContent((content as any).content);
    }

    return '';
  }

  private extractLastMessageText(result: any): string {
    const messages = result?.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return '';
    }

    return this.extractTextContent(messages.at(-1)?.content);
  }

  private async resolveSubAgentSessionId(ctx: Context): Promise<string | null> {
    const sessionId = ctx.action?.params?.values?.sessionId;
    if (!sessionId) {
      return null;
    }

    const aiToolMessage = await ctx.db.getRepository('aiToolMessages').findOne({
      filter: {
        sessionId,
        toolName: 'dispatch-sub-agent-task',
        invokeStatus: {
          $ne: 'confirmed',
        },
      },
      sort: ['-id'],
    });
    if (!aiToolMessage?.messageId) {
      return null;
    }

    const aiMessage = await ctx.db.getRepository('aiMessages').findOne({
      filter: {
        sessionId,
        messageId: aiToolMessage.messageId,
      },
    });
    const subAgentConversations = aiMessage?.metadata?.subAgentConversations as
      | SubAgentConversationMetadata[]
      | undefined;
    if (!Array.isArray(subAgentConversations) || !subAgentConversations.length) {
      return null;
    }

    return subAgentConversations.at(-1)?.sessionId ?? null;
  }

  private async resolveLastMessage(ctx: Context): Promise<Model | null> {
    const subSessionId = await this.resolveSubAgentSessionId(ctx);
    if (!subSessionId) {
      return null;
    }

    return ctx.db.getRepository('aiMessages').findOne({
      filter: {
        sessionId: subSessionId,
      },
      sort: ['-messageId'],
    });
  }

  async run(task: SubAgentTask): Promise<string> {
    const { ctx, sessionId, employee, model, question, skillSettings, writer } = task;
    const { webSearch } = ctx.action?.params?.values ?? {};
    const plugin = ctx.app.pm.get('ai') as PluginAIServer;
    const userId = ctx.auth?.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    if (!model?.llmService || !model?.model) {
      throw new Error('LLM service not configured');
    }

    const aiEmployee = new AIEmployee({
      ctx,
      employee,
      sessionId,
      skillSettings,
      webSearch,
      model,
      from: 'sub-agent',
    });

    const lastMessage = await ctx.db.getRepository('aiMessages').findOne({
      filter: {
        sessionId,
      },
      sort: ['-messageId'],
    });
    const decisions = lastMessage ? await plugin.aiConversationsManager.getUserDecisions(lastMessage.messageId) : null;

    let context;
    const { messages } = ctx.action?.params?.values ?? {};
    if (messages && decisions?.decisions?.some((it) => it.type === 'reject')) {
      context = {
        appendMessage: await aiEmployee.getFormatMessages(messages),
      };
    }

    const result = await aiEmployee.invoke({
      userDecisions: decisions,
      userMessages: decisions
        ? undefined
        : [
            {
              role: 'user',
              content: {
                type: 'text',
                content: question,
              },
            },
          ],
      writer,
      context,
    });

    writer?.({
      action: 'afterSubAgentInvoke',
      body: {},
      currentConversation: {
        sessionId,
        username: employee.username,
        from: 'sub-agent',
      },
    });

    return this.extractLastMessageText(result);
  }

  async isInterrupted(ctx: Context) {
    const sessionId = ctx.action?.params?.values?.sessionId;
    if (!sessionId) {
      return false;
    }

    const aiToolMessage = await ctx.db.getRepository('aiToolMessages').findOne({
      filter: {
        sessionId,
        toolName: 'dispatch-sub-agent-task',
        invokeStatus: 'pending',
      },
      sort: ['-id'],
    });

    return aiToolMessage ? true : false;
  }

  async reject(ctx: Context) {
    const plugin = ctx.app.pm.get('ai') as PluginAIServer;
    const { sessionId } = ctx.action?.params?.values ?? {};
    const conversation = await ctx.db.getRepository('aiConversations').findOne({
      filter: {
        sessionId,
        userId: ctx.auth?.user.id,
      },
    });
    if (!conversation) {
      return;
    }
    const lastMessage = await this.resolveLastMessage(ctx);
    if (!sessionId || !lastMessage) {
      return;
    }
    const userDecision = {
      type: 'reject' as const,
      message: `The user ignored the tools usage and send new messages`,
    };
    const [updated] = await ctx.db.getRepository('aiToolMessages').model.update(
      { userDecision, invokeStatus: 'waiting' },
      {
        where: {
          sessionId: lastMessage.get('sessionId'),
          messageId: lastMessage.get('messageId'),
          invokeStatus: 'interrupted',
        },
      },
    );
    if (updated > 0) {
      return await plugin.aiConversationsManager.getUserDecisions(lastMessage.get('messageId'));
    } else {
      return null;
    }
  }
}

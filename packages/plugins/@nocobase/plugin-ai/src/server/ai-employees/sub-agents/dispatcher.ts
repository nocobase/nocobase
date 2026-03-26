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
import type { SubAgentConversationMetadata } from '../../types';

export type SubAgentTask = {
  ctx: Context;
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

  async run(task: SubAgentTask): Promise<{
    sessionId: string;
    running: Promise<string>;
  }> {
    const { ctx, employee, model, question, skillSettings, writer } = task;
    const userId = ctx.auth?.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    if (!model?.llmService || !model?.model) {
      throw new Error('LLM service not configured');
    }

    let subSessionId = await this.resolveSubAgentSessionId(ctx);
    if (!subSessionId) {
      const conversation = await this.plugin.aiConversationsManager.create({
        userId,
        aiEmployee: {
          username: employee.get('username'),
        },
        title: question.slice(0, 30),
        from: 'sub-agent',
        options: {
          skillSettings,
        },
      });
      subSessionId = conversation.sessionId;
    }

    const aiEmployee = new AIEmployee({
      ctx,
      employee,
      sessionId: subSessionId,
      skillSettings,
      model,
      from: 'sub-agent',
    });

    const running = async () => {
      const result = await aiEmployee.invoke({
        userMessages: [
          {
            role: 'user',
            content: {
              type: 'text',
              content: question,
            },
          },
        ],
        writer,
      });
      writer?.({
        action: 'afterSubAgentInvoke',
        body: {},
        currentConversation: {
          sessionId: subSessionId,
          username: employee.username,
          from: 'sub-agent',
        },
      });

      return this.extractLastMessageText(result);
    };

    return {
      sessionId: subSessionId,
      running: running(),
    };
  }
}

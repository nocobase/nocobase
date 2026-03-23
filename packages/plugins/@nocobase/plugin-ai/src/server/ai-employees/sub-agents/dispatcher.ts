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
    const subAgentConversations = aiMessage?.metadata?.subAgentConversations;
    if (!Array.isArray(subAgentConversations) || !subAgentConversations.length) {
      return null;
    }

    return subAgentConversations.at(-1) ?? null;
  }

  async run(task: SubAgentTask): Promise<{
    sessionId: string;
    stream: Promise<string>;
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

    return {
      sessionId: subSessionId,
      stream: aiEmployee.invoke({
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
      }),
    };
  }
}

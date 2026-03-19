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
import { AIEmployee, ChatStreamProtocol } from '../ai-employee';
import type PluginAIServer from '../../plugin';

export type SubAgentTask = {
  ctx: Context;
  protocol: ChatStreamProtocol;
  employee: Model;
  prompt: string;
  skillSettings?: Record<string, any>;
};

export class SubAgentsDispatcher {
  constructor(protected plugin: PluginAIServer) {}

  async run(task: SubAgentTask): Promise<string> {
    const { ctx, protocol, employee, prompt, skillSettings } = task;
    const userId = ctx.auth?.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    const model = ctx.action.params.values?.model;
    if (!model?.llmService || !model?.model) {
      throw new Error('LLM service not configured');
    }

    const conversation = await this.plugin.aiConversationsManager.create({
      userId,
      aiEmployee: {
        username: employee.get('username'),
      },
      title: task.prompt.slice(0, 30),
      from: 'sub-agent',
      options: {
        skillSettings,
      },
    });

    const aiEmployee = new AIEmployee({
      ctx,
      employee,
      sessionId: conversation.sessionId,
      skillSettings,
      model,
      protocol,
    });

    const streamed = await aiEmployee.stream({
      userMessages: [
        {
          role: 'user',
          content: {
            type: 'text',
            content: prompt,
          },
        },
      ],
    });

    if (!streamed) {
      throw new Error('Sub-agent task execution failed');
    }

    const lastMessage = await this.plugin.db.getRepository('aiConversations.messages', conversation.sessionId).findOne({
      sort: ['-messageId'],
      filter: {
        role: task.employee.get('username'),
      },
    });

    if (!lastMessage?.content) {
      throw new Error('Sub-agent returned no message');
    }

    return typeof lastMessage.content === 'string' ? lastMessage.content : lastMessage.content?.content ?? '';
  }
}

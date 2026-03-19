/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineTools } from '@nocobase/ai';
import { z } from 'zod';
import { ChatStreamProtocol } from '../../../../server/ai-employees/ai-employee';
import { getAccessibleAIEmployee, getAIPlugin } from '../shared';

export default defineTools({
  scope: 'GENERAL',
  definition: {
    name: 'dispatch-sub-agent-task',
    description: 'Dispatch a question to a target AI employee and return the sub-session result.',
    schema: z.object({
      username: z.string().describe('The username of the target AI employee.'),
      question: z.string().describe('The question or task that should be executed by the target AI employee.'),
    }),
  },
  async invoke(ctx, args, runtime) {
    const plugin = getAIPlugin(ctx);
    const employee = await getAccessibleAIEmployee(ctx, args.username);
    if (!employee) {
      throw new Error(`AI employee "${args.username}" not found`);
    }

    const sessionId = ctx.action?.params?.values?.sessionId;
    const aiConversation = sessionId
      ? await ctx.db.getRepository('aiConversations').findOne({
          filter: {
            sessionId,
            userId: ctx.auth?.user?.id,
          },
        })
      : null;

    const protocol = ChatStreamProtocol.create({
      write: runtime.writer,
    });

    const { sessionId: subSessionId, stream } = await plugin.subAgentsDispatcher.run({
      ctx,
      protocol,
      employee,
      model: employee.get('modelSettings') ?? ctx.action?.params?.values?.model,
      question: args.question,
      skillSettings: aiConversation?.options?.skillSettings,
    });

    return {
      sessionId: subSessionId,
      answer: await stream,
    };
  },
});

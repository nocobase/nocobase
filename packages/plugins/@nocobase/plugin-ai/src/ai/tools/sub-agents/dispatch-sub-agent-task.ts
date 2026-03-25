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
import { getAccessibleAIEmployee, getAIPlugin, getSkillSettingsFromMain, updateMessageMetadata } from './shared';

export default defineTools({
  scope: 'SPECIFIED',
  defaultPermission: 'ALLOW',
  definition: {
    name: 'dispatch-sub-agent-task',
    description: 'Dispatch a question to a target AI employee and return the sub-session result.',
    schema: z.object({
      username: z.string().describe('The username of the target AI employee.'),
      question: z.string().describe('The question or task that should be executed by the target AI employee.'),
    }),
  },
  async invoke(ctx, { username, question }, { toolCallId, writer }) {
    const plugin = getAIPlugin(ctx);
    const employee = await getAccessibleAIEmployee(ctx, username);
    if (!employee) {
      throw new Error(`AI employee "${username}" not found`);
    }

    const skillSettings = await getSkillSettingsFromMain(ctx);

    const { sessionId, running } = await plugin.subAgentsDispatcher.run({
      ctx,
      employee,
      model: employee.get('modelSettings') ?? ctx.action?.params?.values?.model,
      question,
      skillSettings,
      writer,
    });

    await updateMessageMetadata(ctx, toolCallId, sessionId, 'pending');
    const answer = await running;
    await updateMessageMetadata(ctx, toolCallId, sessionId, 'completed');

    return {
      sessionId,
      answer,
    };
  },
});

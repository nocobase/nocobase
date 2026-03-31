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
// @ts-ignore
import pkg from '../../../../package.json';

export default defineTools({
  scope: 'SPECIFIED',
  defaultPermission: 'ALLOW',
  introduction: {
    title: `{{t("AI employee task dispatching", { ns: "${pkg.name}" })}}`,
    about: `{{t("Awaken and assign specific tasks to ai employees", { ns: "${pkg.name}" })}}`,
  },
  definition: {
    name: 'dispatch-sub-agent-task',
    description: 'Dispatch a question to a target AI employee and return the sub-session result.',
    schema: z.object({
      username: z.string().describe('The username of the target AI employee.'),
      question: z.string().describe('The question or task that should be executed by the target AI employee.'),
    }),
  },
  async invoke(ctx, { username, question }, { toolCallId, writer }) {
    const sessionId = ctx.action?.params?.values?.sessionId;
    const userId = ctx.auth?.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    const plugin = getAIPlugin(ctx);
    const employee = await getAccessibleAIEmployee(ctx, username);
    if (!employee) {
      throw new Error(`AI employee "${username}" not found`);
    }

    let subSessionId: string;
    const skillSettings = await getSkillSettingsFromMain(ctx);
    const existedConversation = await plugin.aiConversationsManager.resolveSubAgentConversation(sessionId, toolCallId);
    if (existedConversation) {
      subSessionId = existedConversation.sessionId;
    } else {
      const newConversation = await plugin.aiConversationsManager.create({
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
      subSessionId = newConversation.sessionId;
    }

    await updateMessageMetadata(ctx, toolCallId, subSessionId, 'pending');
    const answer = await plugin.subAgentsDispatcher.run({
      ctx,
      sessionId: subSessionId,
      employee,
      model: employee.get('modelSettings') ?? ctx.action?.params?.values?.model,
      question,
      skillSettings,
      writer,
    });
    await updateMessageMetadata(ctx, toolCallId, subSessionId, 'completed');

    return {
      sessionId: subSessionId,
      answer,
    };
  },
});

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
import { Context } from '@nocobase/actions';
import { SkillsEntry } from '@nocobase/ai';
import _ from 'lodash';

export default defineTools({
  scope: 'GENERAL',
  defaultPermission: 'ALLOW',
  silence: true,
  definition: {
    name: 'listSkills',
    description: 'Get available skills for the current AI employee.',
    schema: z.object({}),
  },
  invoke: async (ctx, _args, id) => {
    const skills = await getAvailableSkillsByToolCall(ctx, id);
    return {
      status: 'success',
      content: {
        skills: skills.map((skill) => ({
          name: skill.name,
          description: skill.description,
        })),
      },
    };
  },
});

async function getAvailableSkillsByToolCall(ctx: Context, toolCallId?: string): Promise<SkillsEntry[]> {
  const sessionId = await resolveSessionId(ctx, toolCallId);
  const conversation = await ctx.app.db.getRepository('aiConversations').findOne({
    filter: {
      sessionId,
    },
  });
  if (!conversation) {
    throw new Error('Conversation not found');
  }

  const employee = await ctx.app.db.getRepository('aiEmployees').findOne({
    filter: {
      username: conversation.aiEmployeeUsername,
    },
  });
  if (!employee) {
    throw new Error('AI employee not found');
  }

  const plugin = ctx.app.pm.get('ai') as any;
  const { skillsManager } = plugin.ai;
  const generalSkills = await skillsManager.listSkills({ scope: 'GENERAL' });
  const specifiedSkillNames = employee.skillSettings?._skills ?? [];
  const specifiedSkills = specifiedSkillNames.length ? await skillsManager.getSkills(specifiedSkillNames) : [];
  return _.uniqBy([...(generalSkills || []), ...(specifiedSkills || [])], 'name');
}

async function resolveSessionId(ctx: Context, toolCallId?: string): Promise<string> {
  if (toolCallId) {
    const toolCall = await ctx.app.db.getRepository('aiToolMessages').findOne({
      filter: {
        toolCallId,
      },
    });
    if (toolCall?.sessionId) {
      return toolCall.sessionId;
    }
  }

  const sessionId = ctx.action?.params?.values?.sessionId;
  if (typeof sessionId === 'string' && sessionId.length) {
    return sessionId;
  }

  throw new Error('sessionId is required');
}

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { Model } from '@nocobase/database';
import type PluginAIServer from '../../../server/plugin';
import type { AIEmployee as AIEmployeeType } from '../../../collections/ai-employees';
import type { SubAgentConversationMetadata } from '../../../server/types';

export const getAIPlugin = (ctx: Context) => ctx.app.pm.get('ai') as PluginAIServer;

export async function listAccessibleAIEmployees(ctx: Context): Promise<Model[]> {
  const filter = await buildAccessibleEmployeeFilter(ctx);
  return ctx.db.getRepository('aiEmployees').find({
    filter,
    sort: ['sort', 'username'],
  });
}

export async function getAccessibleAIEmployee(ctx: Context, username: string): Promise<Model | null> {
  const filter = await buildAccessibleEmployeeFilter(ctx);
  return ctx.db.getRepository('aiEmployees').findOne({
    filter: {
      ...filter,
      username,
    },
  });
}

function localizeBuiltInInfo(ctx: Context, employee: Model) {
  const plugin = getAIPlugin(ctx);
  plugin.builtInManager.setupBuiltInInfo(ctx, employee as unknown as AIEmployeeType);
}

export function serializeEmployeeSummary(ctx: Context, employee: Model) {
  localizeBuiltInInfo(ctx, employee);
  return {
    username: employee.get('username') as string,
    nickname: employee.get('nickname') as string,
    position: employee.get('position') as string,
    bio: employee.get('bio') as string,
    greeting: employee.get('greeting') as string,
    skillSettings: employee.get('skillSettings'),
  };
}

export function serializeEmployeeDetail(ctx: Context, employee: Model) {
  localizeBuiltInInfo(ctx, employee);
  const about = employee.get('about') || employee.get('defaultPrompt') || '';
  return {
    ...serializeEmployeeSummary(ctx, employee),
    about,
  };
}

async function buildAccessibleEmployeeFilter(ctx: Context) {
  const filter: Record<string, any> = {
    enabled: true,
  };

  if (ctx.state.currentRoles?.includes('root')) {
    return filter;
  }

  const roleMappings = await ctx.db.getRepository('rolesAiEmployees').find({
    filter: {
      roleName: ctx.state.currentRoles,
    },
  });

  const usernames = roleMappings.map((item: { aiEmployee: string }) => item.aiEmployee);
  filter.username = usernames.length ? usernames : '__NO_ACCESSIBLE_AI_EMPLOYEE__';

  return filter;
}

export const getSkillSettingsFromMain = async (ctx: Context) => {
  const sessionId = ctx.action?.params?.values?.sessionId;
  if (!sessionId) {
    return null;
  }
  const aiConversation = await ctx.db.getRepository('aiConversations').findOne({
    filter: {
      sessionId,
      userId: ctx.auth?.user?.id,
    },
  });
  return aiConversation?.options?.skillSettings;
};

export const updateMessageMetadata = async (
  ctx: Context,
  toolCallId: string,
  subSessionId: string,
  status: 'pending' | 'completed',
) => {
  const sessionId = ctx.action?.params?.values?.sessionId;
  if (!sessionId) {
    return;
  }
  const aiToolMessage = await ctx.db.getRepository('aiToolMessages').findOne({
    filter: {
      sessionId,
      toolCallId,
    },
  });
  if (!aiToolMessage) {
    return;
  }
  const aiMessage = await ctx.db.getRepository('aiMessages').findOne({
    filter: {
      sessionId,
      messageId: aiToolMessage.messageId,
    },
  });
  if (!aiMessage) {
    return;
  }
  const metadata = aiMessage.metadata ?? {};
  if (!metadata.subAgentConversations) {
    metadata.subAgentConversations = [];
  }

  const subAgentConversations = metadata.subAgentConversations as SubAgentConversationMetadata[];
  const existingConversation = subAgentConversations.find((item) => item.sessionId === subSessionId);

  if (existingConversation) {
    existingConversation.toolCallId = toolCallId;
    existingConversation.status = status;
  } else {
    subAgentConversations.push({
      sessionId: subSessionId,
      toolCallId,
      status,
    });
  }

  metadata.subAgentConversations = subAgentConversations;

  await ctx.db.getRepository('aiMessages').update({
    values: {
      metadata,
    },
    filter: {
      sessionId,
      messageId: aiMessage.messageId,
    },
  });
};

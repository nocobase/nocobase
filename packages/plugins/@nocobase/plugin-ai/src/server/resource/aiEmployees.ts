/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import * as templates from '../ai-employees/templates';

export const listByUser = async (ctx: Context, next: Next) => {
  const user = ctx.auth.user;
  const model = ctx.db.getModel('aiEmployees');
  const sequelize = ctx.db.sequelize;
  const roles = ctx.state.currentRoles;
  let where: any = {
    enabled: true,
  };
  if (!roles?.includes('root')) {
    const aiEmployees = await ctx.db.getRepository('rolesAiEmployees').find({
      filter: {
        roleName: ctx.state.currentRoles,
      },
    });
    if (!aiEmployees) {
      ctx.body = [];
      return next();
    }
    where = {
      ...where,
      username: aiEmployees.map((item: { aiEmployee: string }) => item.aiEmployee),
    };
  }
  const rows = await model.findAll({
    where,
    include: [
      {
        model: ctx.db.getModel('usersAiEmployees'),
        as: 'userConfigs',
        required: false,
        where: { userId: user.id },
      },
    ],
    order: [
      [
        sequelize.literal(
          `CASE WHEN ${sequelize
            .getQueryInterface()
            .quoteIdentifiers('userConfigs.sort')} IS NOT NULL THEN 0 ELSE 1 END`,
        ),
        'ASC',
      ],
      [sequelize.fn('COALESCE', sequelize.col('userConfigs.sort'), sequelize.col('aiEmployees.sort')), 'ASC'],
    ],
  });
  ctx.body = rows.map((row) => ({
    username: row.username,
    nickname: row.nickname,
    position: row.position,
    avatar: row.avatar,
    bio: row.bio,
    greeting: row.greeting,
    userConfig: {
      prompt: row.userConfigs?.[0]?.prompt,
    },
    skillSettings: row.skillSettings,
  }));
  await next();
};

export const updateUserPrompt = async (ctx: Context, next: Next) => {
  const { aiEmployee, prompt } = ctx.action.params.values || {};
  if (!aiEmployee) {
    ctx.throw(400);
  }
  const user = ctx.auth.user;
  const repo = ctx.db.getRepository('usersAiEmployees');
  const record = await repo.findOne({
    filter: {
      userId: user.id,
      aiEmployee,
    },
  });
  if (record) {
    await record.update({
      prompt,
    });
    return next();
  }
  await repo.create({
    values: {
      aiEmployee,
      userId: user.id,
      prompt,
      sort: null,
    },
  });
  await next();
};

export const getTemplates = async (ctx: Context, next: Next) => {
  const locale = ctx.getCurrentLocale() || 'en-US';
  ctx.body = Object.values(templates).map((template) => template[locale]);
  await next();
};

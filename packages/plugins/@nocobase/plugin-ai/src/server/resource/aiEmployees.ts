/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';

export const listByUser = async (ctx: Context, next: Next) => {
  const user = ctx.auth.user;
  const model = ctx.db.getModel('aiEmployees');
  const sequelize = ctx.db.sequelize;
  const rows = await model.findAll({
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
  }));
  await next();
};

export const updateUserPrompt = async (ctx: Context, next: Next) => {
  const { aiEmployee, prompt } = ctx.action.params.values || {};
  if (!aiEmployee || !prompt) {
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

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SystemRoleMode } from '@nocobase/plugin-system-settings';

export const getSystemRoleMode = async (ctx, next) => {
  const systemSettings = await ctx.db.getRepository('systemSettings').findOne();
  const roleMode = systemSettings?.get('roleMode') || SystemRoleMode.default;
  ctx.body = { roleMode };
  await next();
};

export const setSystemRoleMode = async (ctx, next) => {
  const roleMode = ctx.action.params.values?.roleMode;
  if (!SystemRoleMode.validate(roleMode)) {
    throw new Error('Invalid role mode');
  }
  await ctx.db.getRepository('systemSettings').update({
    filterByTk: 1,
    values: { roleMode },
  });
  await next();
};

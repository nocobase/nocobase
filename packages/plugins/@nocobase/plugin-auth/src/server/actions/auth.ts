/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* istanbul ignore file -- @preserve */
import { Context, Next } from '@nocobase/actions';

export default {
  lostPassword: async (ctx: Context, next: Next) => {
    ctx.body = await ctx.auth.lostPassword();
    await next();
  },
  resetPassword: async (ctx: Context, next: Next) => {
    ctx.body = await ctx.auth.resetPassword();
    await next();
  },
  getUserByResetToken: async (ctx: Context, next: Next) => {
    ctx.body = await ctx.auth.getUserByResetToken();
    await next();
  },
  changePassword: async (ctx: Context, next: Next) => {
    ctx.body = await ctx.auth.changePassword();
    await next();
  },
};

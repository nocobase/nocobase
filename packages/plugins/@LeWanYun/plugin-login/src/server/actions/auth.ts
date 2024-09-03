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
  LwlostPassword: async (ctx: Context, next: Next) => {
    ctx.body = await ctx.auth.LwlostPassword();
    await next();
  },
  LwresetPassword: async (ctx: Context, next: Next) => {
    ctx.body = await ctx.auth.LwresetPassword();
    await next();
  },
  LwgetUserByResetToken: async (ctx: Context, next: Next) => {
    ctx.body = await ctx.auth.LwgetUserByResetToken();
    await next();
  },
  LwchangePassword: async (ctx: Context, next: Next) => {
    ctx.body = await ctx.auth.LwchangePassword();
    await next();
  },
};

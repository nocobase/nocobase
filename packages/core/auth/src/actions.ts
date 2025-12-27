/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* istanbul ignore file -- @preserve */
import { Handlers } from '@nocobase/resourcer';

export const actions = {
  signIn: async (ctx, next) => {
    ctx.body = await ctx.auth.signIn();
    const tokenInfo = await ctx.auth.jwt.decode(ctx.body.token);
    const expiresMs = tokenInfo.exp * 1000;
    ctx.cookies.set('token', ctx.body.token, {
      maxAge: expiresMs - Date.now(),
      expires: new Date(expiresMs),
    });
    await next();
  },
  signOut: async (ctx, next) => {
    await ctx.auth.signOut();
    await next();
  },
  signUp: async (ctx, next) => {
    await ctx.auth.signUp();
    await next();
  },
  check: async (ctx, next) => {
    ctx.body = ctx.auth.user || {};
    await next();
  },
} as Handlers;

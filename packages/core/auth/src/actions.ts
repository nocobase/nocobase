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

function filterHiddenFields(ctx, user) {
  if (!user) {
    return {};
  }

  const data = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
  const collection = ctx.db?.getCollection?.('users');
  if (!collection) {
    return data;
  }

  for (const field of collection.fields.values()) {
    if (field.options.hidden) {
      delete data[field.options.name];
    }
  }

  return data;
}

export const actions = {
  signIn: async (ctx, next) => {
    ctx.body = await ctx.auth.signIn();
    await next();
  },
  signOut: async (ctx, next) => {
    await ctx.auth.signOut();
    await ctx.app.emitAsync('auth:signOut', { ctx, auth: ctx.auth });
    await next();
  },
  signUp: async (ctx, next) => {
    await ctx.auth.signUp();
    await next();
  },
  check: async (ctx, next) => {
    ctx.body = filterHiddenFields(ctx, ctx.auth.user);
    await next();
  },
} as Handlers;

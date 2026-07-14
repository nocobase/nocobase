/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* istanbul ignore file -- @preserve */
import type { Context } from '@nocobase/actions';
import { Handlers } from '@nocobase/resourcer';
import { getOrigin, isTrustedOrigin } from '@nocobase/utils';

const localeNamespace = 'auth';

function assertTrustedSignInOrigin(ctx: Context) {
  const origin = ctx.get('origin');
  if (origin) {
    if (!isTrustedOrigin(ctx, origin)) {
      ctx.throw(403, ctx.t('Invalid sign-in origin', { ns: localeNamespace }));
    }
    return;
  }

  const refererOrigin = getOrigin(ctx.get('referer'));
  if (refererOrigin && !isTrustedOrigin(ctx, refererOrigin)) {
    ctx.throw(403, ctx.t('Invalid sign-in origin', { ns: localeNamespace }));
  }
}

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
    assertTrustedSignInOrigin(ctx);
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
  syncCookies: async (ctx, next) => {
    ctx.body = await ctx.auth.syncCookies();
    await next();
  },
} as Handlers;

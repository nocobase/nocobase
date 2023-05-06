import { Handlers } from '@nocobase/resourcer';

export const actions = {
  signIn: async (ctx, next) => {
    ctx.body = await ctx.auth.signIn();
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

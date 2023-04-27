import { Handlers } from '@nocobase/resourcer';

export default {
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
    ctx.body = ctx.auth.getUser();
    await next();
  },
} as Handlers;

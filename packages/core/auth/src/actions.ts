import { Handlers } from '@nocobase/resourcer';

export default {
  signIn: async (ctx, next) => {
    await ctx.auth.signIn(ctx);
  },
  signOut: async (ctx, next) => {
    return ctx.auth.signOut(ctx, next);
  },
  signUp: async (ctx, next) => {
    return ctx.auth.signUp(ctx, next);
  },
  check: async (ctx) => {
    ctx.body = await ctx.auth.getUser();
  },
} as Handlers;

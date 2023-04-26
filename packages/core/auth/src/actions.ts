import { Handlers } from '@nocobase/resourcer';

export default {
  signIn: async (ctx, next) => {
    await ctx.auth.signIn();
    return next();
  },
  signOut: async (ctx, next) => {
    await ctx.auth.signOut();
    return next();
  },
  signUp: async (ctx, next) => {
    await ctx.auth.signUp();
    return next();
  },
  check: async (ctx) => {
    ctx.body = ctx.state.currentUser;
  },
} as Handlers;

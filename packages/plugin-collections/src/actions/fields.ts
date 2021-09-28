import { actions, Context, Next } from '@nocobase/actions';

export const create = async (ctx: Context, next: Next) => {
  await actions.create(ctx, async () => {});
  const { associated } = ctx.action.params;
  await ctx.body.generateReverseField();
  await ctx.body.migrate();
  await next();
}

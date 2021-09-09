import { actions, Context, Next } from '@nocobase/actions';

export const create = async (ctx: Context, next: Next) => {
  await actions.create(ctx, async () => {});
  const { associated } = ctx.action.params;
  await ctx.body.generateReverseField();
  await associated.migrate();
  // console.log('associated.migrate');
  await next();
}

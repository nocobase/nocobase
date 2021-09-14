import { Model, ModelCtor } from '@nocobase/database';
import { actions, middlewares } from '@nocobase/actions';
import { cloneDeep, omit } from 'lodash';

export const create = async (ctx: actions.Context, next: actions.Next) => {
  await actions.common.create(ctx, async () => {});
  await ctx.body.generateReverseField();
  await ctx.body.migrate();
  await next();
}

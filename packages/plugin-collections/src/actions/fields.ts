import { Model, ModelCtor } from '@nocobase/database';
import { actions, middlewares } from '@nocobase/actions';
import { sort } from '@nocobase/actions/src/actions/common';
import { cloneDeep, omit } from 'lodash';

export const create = async (ctx: actions.Context, next: actions.Next) => {
  await actions.common.create(ctx, async () => {});
  const { associated } = ctx.action.params;
  await associated.migrate();
  console.log('associated.migrate');
  await next();
}

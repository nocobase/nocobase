import { Op } from 'sequelize';
import { actions } from '@nocobase/actions';
import _ from 'lodash';

export async function list(ctx: actions.Context, next: actions.Next) {
  const { associated } = ctx.action.params;
  // TODO: 暂时 action 中间件就这么写了
  ctx.action.mergeParams({
    associated: null
  });
  await actions.common.list(ctx, async () => {
  });
  await next();
}

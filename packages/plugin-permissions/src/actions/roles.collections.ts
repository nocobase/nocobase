import { actions } from '@nocobase/actions';

export async function list(ctx: actions.Context, next: actions.Next) {
  // TODO: 暂时 action 中间件就这么写了
  ctx.action.mergeParams({associated: null});
  return actions.common.list(ctx, next);
}

export async function get(ctx: actions.Context, next: actions.Next) {
  // TODO: 暂时 action 中间件就这么写了
  ctx.action.mergeParams({associated: null});
  ctx.body = {
    actions: [],
    fields: [],
    tabs: [],
  };
  await next();
  // return actions.common.get(ctx, next);
}

export async function update(ctx: actions.Context, next: actions.Next) {
  ctx.body = {};
  await next();
}

import { actions } from '@nocobase/actions';

export async function list(ctx: actions.Context, next: actions.Next) {
  // TODO: 暂时 action 中间件就这么写了
  ctx.action.mergeParams({associated: null});
  const { associatedKey } = ctx.action.params;
  ctx.action.mergeParams({
    filter: {
      'parent_id.$notNull': true,
    }
  })
  const done = async () => {
    ctx.body.rows = ctx.body.rows.map(row => {
      row.setDataValue('tableName', 'pages');
      row.setDataValue('associatedKey', parseInt(associatedKey));
      return row.get();
    });
    console.log(ctx.body.rows);
    await next();
  }
  return actions.common.list(ctx, done);
}

export async function update(ctx: actions.Context, next: actions.Next) {
  ctx.body = {};
  await next();
}

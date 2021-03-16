import { Model, ModelCtor } from '@nocobase/database';
import { actions } from '@nocobase/actions';
import { flatToTree } from  '../utils';

export default async (ctx, next) => {
  await actions.common.list(ctx, async () => {
    const items = ctx.body.rows as any;
    ctx.body.rows = flatToTree(items.map(item => item.toJSON()), {
      id: 'id',
      parentId: 'parent_id',
      children: 'children',
    });
  });
  await next();
}
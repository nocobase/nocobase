import { ResourceOptions } from '@nocobase/resourcer';
import { Model, ModelCtor } from '@nocobase/database';

export default async (ctx, next) => {
  const { resourceName, resourceKey } = ctx.action.params;
  const M = ctx.db.getModel(resourceName) as ModelCtor<Model>;
  const model = await M.findByPk(resourceKey);
  const Field = ctx.db.getModel('fields') as ModelCtor<Model>;
  const field = await Field.findOne({
    where: {
      collection_name: resourceName,
      type: 'string',
    },
    order: [['sort', 'asc']],
  });
  ctx.body = {
    pageTitle: field ? (model.get(field.get('name')) || `#${model.get(M.primaryKeyAttribute)} 无标题`) : model.get(M.primaryKeyAttribute),
    ...model.toJSON(),
  };
  await next();
};

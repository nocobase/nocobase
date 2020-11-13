import { ResourceOptions } from '@nocobase/resourcer';
import { Model, ModelCtor } from '@nocobase/database';
import { get } from 'lodash';

export default async (ctx, next) => {
  const { resourceName, resourceKey } = ctx.action.params;
  const M = ctx.db.getModel(resourceName) as ModelCtor<Model>;
  const model = await M.findByPk(resourceKey);
  ctx.body = {
    pageTitle: model.title,
    ...model.toJSON(),
  };
  await next();
};

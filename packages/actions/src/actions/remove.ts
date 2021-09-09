import { Context, Next } from '..';
import {
  Model,
  Relation,
  HASONE,
  BELONGSTO,
  BELONGSTOMANY,
  HASMANY,
} from '@nocobase/database';

/**
 * 删除关联
 * 
 * BlongsTo
 * BlongsToMany
 * 
 * @param ctx 
 * @param next 
 */
export async function remove(ctx: Context, next: Next) {
  const {
    associated,
    resourceField,
    associatedName,
  } = ctx.action.params as {
    associated: Model,
    associatedName: string,
    resourceField: Relation,
    values: any,
  };
  const AssociatedModel = ctx.db.getModel(associatedName);
  if (!(associated instanceof AssociatedModel)) {
    throw new Error(`${associatedName} associated model invalid`);
  }
  const { get: getAccessor, remove: removeAccessor, set: setAccessor } = resourceField.getAccessors();
  const { resourceKey, resourceKeyAttribute, fields = [] } = ctx.action.params;
  const TargetModel = ctx.db.getModel(resourceField.getTarget());
  const options = TargetModel.parseApiJson({
    fields,
  });
  if (resourceField instanceof HASONE || resourceField instanceof BELONGSTO) {
    ctx.body = await associated[setAccessor](null);
  } else if (resourceField instanceof HASMANY || resourceField instanceof BELONGSTOMANY) {
    const [model]: Model[] = await associated[getAccessor]({
      ...options,
      where: {
        [resourceKeyAttribute || resourceField.options.targetKey || TargetModel.primaryKeyAttribute]: resourceKey,
      },
      context: ctx,
    });
    await associated[removeAccessor](model);
    ctx.body = { id: model.id };
  }
  await next();
}

export default remove;

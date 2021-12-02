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
 * 建立关联
 * 
 * BlongsTo
 * BlongsToMany
 * 
 * @param ctx 
 * @param next 
 */
export async function set(ctx: Context, next: Next) {
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
  const { set: setAccessor } = resourceField.getAccessors();
  const { resourceIndex, resourceIndexAttribute, fields = [] } = ctx.action.params;
  const TargetModel = ctx.db.getModel(resourceField.getTarget());
  // const options = TargetModel.parseApiJson({
  //   fields,
  // });
  const model = await TargetModel.findOne({
    where: {
      [resourceIndexAttribute || resourceField.options.targetKey || TargetModel.primaryKeyAttribute]: resourceIndex,
    },
    // @ts-ignore
    context: ctx,
  });
  ctx.body = await associated[setAccessor](model);
  await next();
}

export default set;

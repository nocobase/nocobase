import { Context, Next } from '..';
import {
  Model,
  Relation,
} from '@nocobase/database';

/**
 * 附加关联
 * 
 * BlongsToMany
 * 
 * @param ctx 
 * @param next 
 */
export async function add(ctx: Context, next: Next) {
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
  const { add: addAccessor } = resourceField.getAccessors();
  const { resourceIndex, resourceIndexAttribute, fields = [] } = ctx.action.params;
  const TargetModel = ctx.db.getModel(resourceField.getTarget());
  // const options = TargetModel.parseApiJson({
  //   fields,
  // });
  const model = await TargetModel.findOne({
    // ...options,
    where: {
      [resourceIndexAttribute || resourceField.options.targetKey || TargetModel.primaryKeyAttribute]: resourceIndex,
    },
    // @ts-ignore
    context: ctx,
  });
  ctx.body = await associated[addAccessor](model);
  await next();
}

export default add;

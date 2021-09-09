import { Context, Next } from '..';
import {
  Model,
  Relation,
  HASONE,
  BELONGSTO,
  BELONGSTOMANY,
  HASMANY,
} from '@nocobase/database';

export async function toggle(ctx: Context, next: Next) {
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
  const { get: getAccessor, remove: removeAccessor, set: setAccessor, add: addAccessor } = resourceField.getAccessors();
  const { resourceKey, resourceKeyAttribute, fields = [] } = ctx.action.params;
  const TargetModel = ctx.db.getModel(resourceField.getTarget());
  const options = TargetModel.parseApiJson({
    fields,
  });
  if (resourceField instanceof HASONE || resourceField instanceof BELONGSTO) {
    const m1 = await associated[getAccessor]();
    if (m1 && m1[resourceKeyAttribute || resourceField.options.targetKey || TargetModel.primaryKeyAttribute] == resourceKey) {
      ctx.body = await associated[setAccessor](null);
    } else {
      const m2 = await TargetModel.findOne({
        // ...options,
        where: {
          [resourceKeyAttribute || resourceField.options.targetKey || TargetModel.primaryKeyAttribute]: resourceKey,
        },
        // @ts-ignore
        context: ctx,
      });
      ctx.body = await associated[setAccessor](m2);
    }
  } else if (resourceField instanceof HASMANY || resourceField instanceof BELONGSTOMANY) {
    const [model]: Model[] = await associated[getAccessor]({
      ...options,
      where: {
        [resourceKeyAttribute || resourceField.options.targetKey || TargetModel.primaryKeyAttribute]: resourceKey,
      },
      context: ctx,
    });
    if (model) {
      ctx.body = await associated[removeAccessor](model);
    } else {
      const m2 = await TargetModel.findOne({
        // ...options,
        where: {
          [resourceKeyAttribute || resourceField.options.targetKey || TargetModel.primaryKeyAttribute]: resourceKey,
        },
        // @ts-ignore
        context: ctx,
      });
      ctx.body = await associated[addAccessor](m2);
    }
  }
  await next();
}

export default toggle;

import { Context, Next } from '.';

import { list, get, create, update, destroy } from './common';
import { HasOne, BelongsTo, BelongsToMany, HasMany, Model, Relation } from '@nocobase/database';
import { Op } from 'sequelize';

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
  const { resourceKey, resourceKeyAttribute, fields = [] } = ctx.action.params;
  const TargetModel = ctx.db.getModel(resourceField.getTarget());
  // const options = TargetModel.parseApiJson({
  //   fields,
  // });
  const model = await TargetModel.findOne({
    where: {
      [resourceKeyAttribute || resourceField.options.targetKey || TargetModel.primaryKeyAttribute]: resourceKey,
    },
    // @ts-ignore
    context: ctx,
  });
  ctx.body = await associated[setAccessor](model);
  await next();
}

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
  const { resourceKey, resourceKeyAttribute, fields = [] } = ctx.action.params;
  const TargetModel = ctx.db.getModel(resourceField.getTarget());
  // const options = TargetModel.parseApiJson({
  //   fields,
  // });
  const model = await TargetModel.findOne({
    // ...options,
    where: {
      [resourceKeyAttribute || resourceField.options.targetKey || TargetModel.primaryKeyAttribute]: resourceKey,
    },
    // @ts-ignore
    context: ctx,
  });
  ctx.body = await associated[addAccessor](model);
  await next();
}

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
  const {get: getAccessor, remove: removeAccessor, set: setAccessor} = resourceField.getAccessors();
  const { resourceKey, resourceKeyAttribute, fields = [] } = ctx.action.params;
  const TargetModel = ctx.db.getModel(resourceField.getTarget());
  const options = TargetModel.parseApiJson({
    fields,
  });
  if (resourceField instanceof HasOne || resourceField instanceof BelongsTo) {
    ctx.body = await associated[setAccessor](null);
  } else if (resourceField instanceof HasMany || resourceField instanceof BelongsToMany) {
    const [model]: Model[] = await associated[getAccessor]({
      ...options,
      where: {
        [resourceKeyAttribute || resourceField.options.targetKey || TargetModel.primaryKeyAttribute]: resourceKey,
      },
      context: ctx,
    });
    await associated[removeAccessor](model);
    ctx.body = {id: model.id};
  }
  await next();
}

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
  const {get: getAccessor, remove: removeAccessor, set: setAccessor, add: addAccessor} = resourceField.getAccessors();
  const { resourceKey, resourceKeyAttribute, fields = [] } = ctx.action.params;
  const TargetModel = ctx.db.getModel(resourceField.getTarget());
  const options = TargetModel.parseApiJson({
    fields,
  });
  if (resourceField instanceof HasOne || resourceField instanceof BelongsTo) {
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
  } else if (resourceField instanceof HasMany || resourceField instanceof BelongsToMany) {
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

export default {
  list,     // hasMany、belongsToMany
  get,      // 所有关系都有
  create,   // hasMany
  update,   // hasOne, hasMany, blongsToMany 中间表的数据更新
  destroy,  // 所有情况
  set,      // belongsTo、blongsToMany
  add,      // blongsToMany
  remove,   // belongsTo、blongsToMany
  toggle,   // blongsToMany
}

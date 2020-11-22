import { Context, Next } from '.';
import { Relation, Model, Field, HasOne, HasMany, BelongsTo, BelongsToMany } from '@nocobase/database';
import { Utils, Op, Sequelize } from 'sequelize';
import { isEmpty } from 'lodash';
import _ from 'lodash';

/**
 * 查询数据列表
 *
 * - Signle
 * - HasMany
 * - BelongsToMany
 * 
 * HasOne 和 belongsTo 不涉及到 list
 *
 * @param ctx 
 * @param next 
 */
export async function list(ctx: Context, next: Next) {
  const {
    page = 1,
    perPage,
    sort = [],
    fields = [],
    filter = {},
    associated,
    associatedName,
    resourceName,
    resourceField,
  } = ctx.action.params;
  const Model = ctx.db.getModel(resourceName);
  const options = Model.parseApiJson({
    sort,
    page,
    perPage,
    filter,
    fields,
    context: ctx,
  });
  let data = {};
  if (associated && resourceField) {
    const AssociatedModel = ctx.db.getModel(associatedName);
    if (!(associated instanceof AssociatedModel)) {
      throw new Error(`${associatedName} associated model invalid`);
    }
    const getAccessor = resourceField.getAccessors().get;
    const countAccessor = resourceField.getAccessors().count;
    options.scope = options.scopes||[];
    const rows = await associated[getAccessor]({
      joinTableAttributes: [], 
      ...options,
      context: ctx,
    });
    const associatedOptions = _.omit(options, [
      'attributes',
      'limit',
      'offset',
      'order'
    ]);
    if (associatedOptions.include) {
      associatedOptions.include = associatedOptions.include.map(includeOptions => {
        includeOptions.attributes = [];
        return includeOptions;
      });
    }
    const count = await associated[countAccessor]({ ...associatedOptions, context: ctx });
    data = {
      rows,
      count,
    };
  } else {
    data = await Model.scope(options.scopes||[]).findAndCountAll({
      ...options,
      // @ts-ignore hooks 里添加 context
      context: ctx,
    });
  }
  if (options.limit || typeof options.offset !== 'undefined') {
    // Math.round 避免精度问题
    data['page'] = Math.round((options.offset || 0) / options.limit + 1);
    data[Utils.underscoredIf('perPage', Model.options.underscored)] = options.limit;
  }
  ctx.body = data;
  await next();
}

/**
 * 新增数据
 * 
 * Signle
 * HasMany
 * 
 * resource action 层面一般不开放 HasOne、BelongsTo、BelongsToMany 的新增数据操作
 * 如果需要这类操作建议使用 model.updateAssociations 方法
 *
 * TODO 字段验证
 * 
 * @param ctx 
 * @param next 
 */
export async function create(ctx: Context, next: Next) {
  const {
    associated,
    resourceField,
    associatedName,
    values,
  } = ctx.action.params as { associated: Model, associatedName: string, resourceField: Relation, values: any };
  if (associated && resourceField) {
    const AssociatedModel = ctx.db.getModel(associatedName);
    if (!(associated instanceof AssociatedModel)) {
      throw new Error(`${associatedName} associated model invalid`);
    }
    const create = resourceField.getAccessors().create;
    const model: Model = await associated[create](values, { context: ctx });
    await model.updateAssociations(values, { context: ctx });
    ctx.body = model;
  } else {
    const { resourceName } = ctx.action.params;
    const Model = ctx.db.getModel(resourceName);
    // @ts-ignore
    const model = await Model.create(values, { context: ctx });
    // @ts-ignore
    await model.updateAssociations(values, { context: ctx });
    ctx.body = model;
  }
  await next();
}

/**
 * 查询数据详情
 *
 * @param ctx 
 * @param next 
 */
export async function get(ctx: Context, next: Next) {
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
  if (associated && resourceField) {
    const AssociatedModel = ctx.db.getModel(associatedName);
    if (!(associated instanceof AssociatedModel)) {
      throw new Error(`${associatedName} associated model invalid`);
    }
    const getAccessor = resourceField.getAccessors().get;
    const { resourceKey, resourceKeyAttribute, fields = [] } = ctx.action.params;
    const TargetModel = ctx.db.getModel(resourceField.getTarget());
    const options = TargetModel.parseApiJson({
      fields,
    });
    if (resourceField instanceof HasOne || resourceField instanceof BelongsTo) {
      const model: Model = await associated[getAccessor]({ ...options, context: ctx });
      ctx.body = model;
    } else if (resourceField instanceof HasMany || resourceField instanceof BelongsToMany) {
      const [model]: Model[] = await associated[getAccessor]({
        ...options,
        where: {
          [resourceKeyAttribute || resourceField.options.targetKey || TargetModel.primaryKeyAttribute]: resourceKey,
        },
        context: ctx,
      });
      ctx.body = model;
    }
  } else {
    const { resourceName, resourceKey, resourceKeyAttribute, fields = [] } = ctx.action.params;
    const Model = ctx.db.getModel(resourceName);
    const options = Model.parseApiJson({
      fields,
    });
    const data = await Model.findOne({
      ...options,
      where: {
        [resourceKeyAttribute || Model.primaryKeyAttribute]: resourceKey,
      },
      // @ts-ignore hooks 里添加 context
      context: ctx,
    });
    ctx.body = data;
  }
  await next();
}

/**
 * 更新数据
 *
 * TODO 字段验证
 * 
 * @param ctx 
 * @param next 
 */
export async function update(ctx: Context, next: Next) {
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
  if (associated && resourceField) {
    const AssociatedModel = ctx.db.getModel(associatedName);
    if (!(associated instanceof AssociatedModel)) {
      throw new Error(`${associatedName} associated model invalid`);
    }
    const {get: getAccessor, create: createAccessor, add: addAccessor} = resourceField.getAccessors();
    const { resourceKey, resourceKeyAttribute, fields = [], values } = ctx.action.params;
    const TargetModel = ctx.db.getModel(resourceField.getTarget());
    const options = TargetModel.parseApiJson({
      fields,
    });
    if (resourceField instanceof HasOne || resourceField instanceof BelongsTo) {
      let model: Model = await associated[getAccessor]({ ...options, context: ctx });
      if (model) {
        // @ts-ignore
        await model.update(values, { context: ctx });
      } else if (!model && resourceField instanceof HasOne) {
        model = await associated[createAccessor](values, { context: ctx });
      }
      await model.updateAssociations(values, { context: ctx });
      ctx.body = model;
    } else if (resourceField instanceof HasMany || resourceField instanceof BelongsToMany) {
      const [model]: Model[] = await associated[getAccessor]({
        ...options,
        where: {
          [resourceKeyAttribute || resourceField.options.targetKey || TargetModel.primaryKeyAttribute]: resourceKey,
        },
        context: ctx,
      });
      
      if (resourceField instanceof BelongsToMany) {
        const throughName = resourceField.getThroughName();
        if (typeof values[throughName] === 'object') {
          const ThroughModel = resourceField.getThroughModel();
          const throughValues = values[throughName];
          const { foreignKey, sourceKey, otherKey } = resourceField.options;
          const through = await ThroughModel.findOne({
            where: {
              [foreignKey]: associated[sourceKey],
              [otherKey]: resourceKey,
            },
          });
          await through.update(throughValues);
          await through.updateAssociations(throughValues);
          delete values[throughName];
        }
      }
      if (!isEmpty(values)) {
        // @ts-ignore
        await model.update(values, { context: ctx });
        await model.updateAssociations(values, { context: ctx });
      }
      ctx.body = model;
    }
  } else {
    const { resourceName, resourceKey, resourceKeyAttribute, fields = [], values } = ctx.action.params;
    const Model = ctx.db.getModel(resourceName);
    const options = Model.parseApiJson({
      fields,
    });
    const model = await Model.findOne({
      ...options,
      where: {
        [resourceKeyAttribute || Model.primaryKeyAttribute]: resourceKey,
      },
      // @ts-ignore hooks 里添加 context
      context: ctx,
    });
    // @ts-ignore
    await model.update(values, { context: ctx });
    // @ts-ignore
    await model.updateAssociations(values, { context: ctx });
    ctx.body = model;
  }
  await next();
}

/**
 * 删除数据，支持批量
 * 
 * Single
 * HasOne
 * HasMany
 *
 * TODO 关联数据的删除，建议在 onUpdate/onDelete 层面处理
 * 
 * @param ctx 
 * @param next 
 */
export async function destroy(ctx: Context, next: Next) {
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
  if (associated && resourceField) {
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
      const model: Model = await associated[getAccessor]({ ...options, context: ctx });
      await associated[setAccessor](null);
      ctx.body = await model.destroy();
    } else if (resourceField instanceof HasMany || resourceField instanceof BelongsToMany) {
      const [model]: Model[] = await associated[getAccessor]({
        ...options,
        where: {
          [resourceKeyAttribute || resourceField.options.targetKey || TargetModel.primaryKeyAttribute]: resourceKey,
        },
        context: ctx,
      });
      await associated[removeAccessor](model);
      ctx.body = await model.destroy();
    }
  } else {
    const { resourceName, resourceKey, resourceKeyAttribute, values } = ctx.action.params;
    const Model = ctx.db.getModel(resourceName);
    const resourceKeys = resourceKey ? resourceKey.split(',') : values[`${resourceKeyAttribute || Model.primaryKeyAttribute}s`];
    const data = await Model.destroy({
      where: {
        [resourceKeyAttribute || Model.primaryKeyAttribute]: {
          [Op.in]: resourceKeys,
        },
      },
      // @ts-ignore hooks 里添加 context
      context: ctx,
    });
    ctx.body = data;
  }
  await next();
}

export default {
  list, // single、hasMany、belongsToMany
  create, // signle、hasMany
  get, // all
  update, // single、
  destroy,
};

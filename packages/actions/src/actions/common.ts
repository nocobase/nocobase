import { Utils, Op } from 'sequelize';
import _ from 'lodash';
import { Context, Next } from '.';
import {
  Model, 
  HASONE,
  HASMANY,
  BELONGSTO,
  BELONGSTOMANY,
  whereCompare
} from '@nocobase/database';
import { DEFAULT_PAGE, DEFAULT_PER_PAGE } from '@nocobase/resourcer';
import { filterByFields } from '../utils';

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
    page = DEFAULT_PAGE,
    perPage = DEFAULT_PER_PAGE,
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
    resourceName,
    values: data,
    fields
  } = ctx.action.params;
  const values = filterByFields(data, fields);
  const transaction = await ctx.db.sequelize.transaction();
  let model: Model;
  if (associated && resourceField) {
    const AssociatedModel = ctx.db.getModel(associatedName);
    if (!(associated instanceof AssociatedModel)) {
      throw new Error(`${associatedName} associated model invalid`);
    }
    const { create } = resourceField.getAccessors();
    // @ts-ignore
    model = await associated[create](values, { transaction, context: ctx });
    await model.updateAssociations(values, { transaction, context: ctx });
    ctx.body = model;
  } else {
    const ResourceModel = ctx.db.getModel(resourceName);
    // @ts-ignore
    model = await ResourceModel.create(values, { transaction, context: ctx });
    // @ts-ignore
    await model.updateAssociations(values, { transaction, context: ctx });
    ctx.body = model;
  }
  await transaction.commit();
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
    resourceName,
    resourceKey,
    resourceKeyAttribute,
    fields = []
  } = ctx.action.params;
  if (associated && resourceField) {
    const AssociatedModel = ctx.db.getModel(associatedName);
    if (!(associated instanceof AssociatedModel)) {
      throw new Error(`${associatedName} associated model invalid`);
    }
    const getAccessor = resourceField.getAccessors().get;
    const TargetModel = ctx.db.getModel(resourceField.getTarget());
    const options = TargetModel.parseApiJson({
      fields,
    });
    if (resourceField instanceof HASONE || resourceField instanceof BELONGSTO) {
      const model: Model = await associated[getAccessor]({ ...options, context: ctx });
      ctx.body = model;
    } else if (resourceField instanceof HASMANY || resourceField instanceof BELONGSTOMANY) {
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
    associatedName,
    resourceField,
    resourceName,
    resourceKey,
    // TODO(question): 这个属性从哪设置的？
    resourceKeyAttribute,
    fields,
    values: data
  } = ctx.action.params;
  const values = filterByFields(data, fields);
  const transaction = await ctx.db.sequelize.transaction();
  if (associated && resourceField) {
    const AssociatedModel = ctx.db.getModel(associatedName);
    if (!(associated instanceof AssociatedModel)) {
      await transaction.rollback();
      throw new Error(`${associatedName} associated model invalid`);
    }
    const { get: getAccessor } = resourceField.getAccessors();
    if (resourceField instanceof HASONE || resourceField instanceof BELONGSTO) {
      let model: Model = await associated[getAccessor]({ transaction, context: ctx });
      if (model) {
        // @ts-ignore
        await model.update(values, { transaction, context: ctx });
        await model.updateAssociations(values, { transaction, context: ctx });
        ctx.body = model;
      }
    } else if (resourceField instanceof HASMANY || resourceField instanceof BELONGSTOMANY) {
      const TargetModel = ctx.db.getModel(resourceField.getTarget());
      const [model]: Model[] = await associated[getAccessor]({
        where: {
          [resourceKeyAttribute || resourceField.options.targetKey || TargetModel.primaryKeyAttribute]: resourceKey,
        },
        transaction,
        context: ctx,
      });

      if (resourceField instanceof BELONGSTOMANY) {
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
            transaction
          });
          await through.updateAssociations(throughValues, { transaction, context: ctx });
          await through.update(throughValues, { transaction, context: ctx });
          delete values[throughName];
        }
      }
      if (!_.isEmpty(values)) {
        // @ts-ignore
        await model.update(values, { transaction, context: ctx });
        await model.updateAssociations(values, { transaction, context: ctx });
      }
      ctx.body = model;
    }
  } else {
    const Model = ctx.db.getModel(resourceName);
    const model = await Model.findOne({
      where: {
        [resourceKeyAttribute || Model.primaryKeyAttribute]: resourceKey,
      },
      // @ts-ignore hooks 里添加 context
      context: ctx,
      transaction
    });
    // @ts-ignore
    await model.update(values, { transaction, context: ctx });
    // @ts-ignore
    await model.updateAssociations(values, { transaction, context: ctx });
    ctx.body = model;
  }
  await transaction.commit();
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
    resourceName,
    resourceKey,
    resourceKeyAttribute,
    filter
  } = ctx.action.params;
  const transaction = await ctx.db.sequelize.transaction();
  const commonOptions = { transaction, context: ctx };
  if (associated && resourceField) {
    const AssociatedModel = ctx.db.getModel(associatedName);
    if (!(associated instanceof AssociatedModel)) {
      await transaction.rollback();
      throw new Error(`${associatedName} associated model invalid`);
    }
    const {get: getAccessor, remove: removeAccessor, set: setAccessor} = resourceField.getAccessors();
    const TargetModel = ctx.db.getModel(resourceField.getTarget());
    const { where } = TargetModel.parseApiJson({ filter, context: ctx });
    if (resourceField instanceof HASONE || resourceField instanceof BELONGSTO) {
      const model: Model = await associated[getAccessor](commonOptions);
      await associated[setAccessor](null, commonOptions);
      // @ts-ignore
      ctx.body = await model.destroy(commonOptions);
    } else if (resourceField instanceof HASMANY || resourceField instanceof BELONGSTOMANY) {
      const primaryKey = resourceKeyAttribute || resourceField.options.targetKey || TargetModel.primaryKeyAttribute;
      const models: Model[] = await associated[getAccessor]({
        where: resourceKey ? { [primaryKey]: resourceKey } : where,
        ...commonOptions
      });
      await associated[removeAccessor](models, commonOptions);
      // @ts-ignore
      ctx.body = await TargetModel.destroy({
        where: { [primaryKey]: { [Op.in]: models.map(item => item[primaryKey]) } },
        ...commonOptions
      });
    }
  } else {
    const Model = ctx.db.getModel(resourceName);
    const { where } = Model.parseApiJson({ filter, context: ctx });
    const primaryKey = resourceKeyAttribute || Model.primaryKeyAttribute;
    const data = await Model.destroy({
      where: resourceKey ? { [primaryKey]: resourceKey } : where,
      // @ts-ignore hooks 里添加 context
      ...commonOptions,
      individualHooks: true,
    });
    ctx.body = data;
  }
  await transaction.commit();
  await next();
}

/**
 * 人工排序
 * 
 * 基于偏移量策略实现的排序方法
 *
 * TODO 字段验证
 * 
 * @param ctx 
 * @param next 
 */
export async function sort(ctx: Context, next: Next) {
  const {
    resourceName,
    resourceKey,
    resourceField,
    associatedName,
    associatedKey,
    associated,
    values
  } = ctx.action.params;

  if (associated && resourceField) {
    if (resourceField instanceof HASONE || resourceField instanceof BELONGSTO) {
      throw new Error(`the association (${resourceName} belongs to ${associatedName}) cannot be sorted`);
    }
    // TODO(feature)
    if (resourceField instanceof BELONGSTOMANY) {
      throw new Error('sorting for belongs to many association has not been implemented');
    }
  }

  const Model = ctx.db.getModel(resourceName);
  const table = ctx.db.getTable(resourceName);

  const { field, target } = values;
  if (!values.field || typeof target === 'undefined') {
    return next();
  }
  const sortField = table.getField(field);
  if (!sortField) {
    return next();
  }
  const { primaryKeyAttribute } = Model;
  const { name: sortAttr, scope = [] } = sortField.options;

  const transaction = await ctx.db.sequelize.transaction();

  const where = {};
  if (associated && resourceField instanceof HASMANY) {
    where[resourceField.options.foreignKey] = associatedKey;
  }

  // 找到操作对象
  const source = await Model.findOne({
    where: {
      ...where,
      [primaryKeyAttribute]: resourceKey
    },
    transaction
  });
  if (!source) {
    await transaction.rollback();
    throw new Error(`resource(${resourceKey}) does not exist`);
  }
  const sourceScopeWhere = Model.getScopedValues(source, scope);

  let targetScopeWhere: any;
  let targetObject;
  const { [primaryKeyAttribute]: targetId } = target;
  if (targetId) {
    targetObject = await Model.findByPk(targetId, { transaction });

    if (!targetObject) {
      await transaction.rollback();
      throw new Error(`resource(${targetId}) does not exist`);
    }

    targetScopeWhere = Model.getScopedValues(targetObject, scope);
  } else {
    targetScopeWhere = { ...sourceScopeWhere, ...target };
  }

  const sameScope = whereCompare(sourceScopeWhere, targetScopeWhere);

  const updates = { ...targetScopeWhere };
  if (targetObject) {
    let increment: number;
    const updateWhere = { ...targetScopeWhere };
    if (sameScope) {
      const direction = source[sortAttr] < targetObject[sortAttr] ? {
        sourceOp: Op.gt,
        targetOp: Op.lte,
        increment: -1
      } : {
        sourceOp: Op.lt,
        targetOp: Op.gte,
        increment: 1
      };

      increment = direction.increment;

      Object.assign(updateWhere, {
        [sortAttr]: {
          [direction.sourceOp]: source[sortAttr],
          [direction.targetOp]: targetObject[sortAttr]
        }
      });
    } else {
      increment = 1;
      Object.assign(updateWhere, {
        [sortAttr]: {
          [Op.gte]: targetObject[sortAttr]
        }
      });
    }

    await Model.increment(sortAttr, {
      by: increment,
      where: updateWhere,
      transaction
    });

    Object.assign(updates, {
      [sortAttr]: targetObject[sortAttr]
    });
  } else {
    Object.assign(updates, {
      [sortAttr]: await Model.getNextSortValue(sortAttr, {
        where: targetScopeWhere,
        transaction
      })
    });
  }

  await source.update(updates, { transaction });

  await transaction.commit();

  ctx.body = source;

  await next();
}

export default {
  list, // single、hasMany、belongsToMany
  create, // signle、hasMany
  get, // all
  update, // single、
  destroy,
  sort
};

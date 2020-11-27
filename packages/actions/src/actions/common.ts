import { Context, Next } from '.';
import { Relation, Model, Field, HasOne, HasMany, BelongsTo, BelongsToMany } from '@nocobase/database';
import { DEFAULT_PAGE, DEFAULT_PER_PAGE } from '@nocobase/resourcer';
import { Utils, Op } from 'sequelize';
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
      if (!_.isEmpty(values)) {
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
    filter = {},
    values
  } = ctx.action.params;

  if (associated && resourceField) {
    if (resourceField instanceof HasOne || resourceField instanceof BelongsTo) {
      throw new Error(`the association (${resourceName} belongs to ${associatedName}) cannot be sorted`);
    }
    // TODO(feature)
    if (resourceField instanceof BelongsToMany) {
      throw new Error('sorting for belongs to many association has not been implemented');
    }
  }

  const Model = ctx.db.getModel(resourceName);
  const table = ctx.db.getTable(resourceName);

  if (!values.offset) {
    return next();
  }
  const [primaryField] = Model.primaryKeyAttributes;
  const sortField = values.field || table.getOptions().sortField || 'sort';

  // offset 的有效值为：整型 | 'Infinity' | '-Infinity'
  const offset = Number(values.offset);
  const sign = offset < 0 ? {
    op: Op.lte,
    order: 'DESC',
    direction: 1,
    extremum: 'min'
  } : {
    op: Op.gte,
    order: 'ASC',
    direction: -1,
    extremum: 'max'
  };

  const transaction = await ctx.db.sequelize.transaction();

  const { where = {} } = Model.parseApiJson({ filter });
  if (associated && resourceField instanceof HasMany) {
    where[resourceField.options.foreignKey] = associatedKey;
  }

  // 找到操作对象
  const operand = await Model.findOne({
    // 这里增加 where 条件是要求如果有 filter 条件，就应该在同条件的组中排序，不是同条件组的报错处理。
    where: {
      ...where,
      [primaryField]: resourceKey
    },
    transaction
  });

  if (!operand) {
    await transaction.rollback();
    // TODO: 错误需要后面统一处理
    throw new Error(`resource(${resourceKey}) with filter does not exist`);
  }

  let target;

  // 如果是有限的变动值
  if (Number.isFinite(offset)) {
    const absChange = Math.abs(offset);
    const group = await Model.findAll({
      where: {
        ...where,
        [primaryField]: {
          [Op.ne]: resourceKey
        },
        [sortField]: {
          [sign.op]: operand[sortField]
        }
      },
      limit: absChange,
      // offset: 0,
      attributes: [primaryField, sortField],
      order: [
        [sortField, sign.order]
      ],
      transaction
    });

    if (!group.length) {
      // 如果变动范围内的元素数比范围小
      // 说明全部数据不足一页
      // target = group[0][priorityKey] - sign.direction;
      // 没有元素无需变动
      await transaction.commit();
      ctx.body = operand;
      return next();
    }
    
    // 如果变动范围内都有元素（可能出现 limit 范围内元素不足的情况）
    if (group.length === absChange) {
      target = group[group.length - 1][sortField];

      await Model.increment(sortField, {
        by: sign.direction,
        where: {
          [primaryField]: {
            [Op.in]: group.map(item => item[primaryField])
          }
        },
        transaction
      });
    }
  }
  // 如果要求置顶或沉底(未在上一过程中计算出目标值)
  if (typeof target === 'undefined') {
    target = await Model[sign.extremum](sortField, {
      where,
      transaction
    }) - sign.direction;
  }
  await operand.update({
    [sortField]: target
  }, {
    transaction
  });

  await transaction.commit();

  ctx.body = operand;

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

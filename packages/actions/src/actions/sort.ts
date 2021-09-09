import { Utils, Op, Sequelize } from 'sequelize';
import _ from 'lodash';
import { Context, Next } from '..';
import {
  HASONE,
  HASMANY,
  BELONGSTO,
  BELONGSTOMANY,
  whereCompare
} from '@nocobase/database';

/**
 * 人工排序
 * 
 * 同 scope 时，往前挪动，插入到目标位置前面；往后挪动，插入到目标位置后面
 * 不同 scope 时，挪动到往目标位置时，默认插入后面位置，可指定 insertBefore
 */
export async function sort(ctx: Context, next: Next) {
  const {
    resourceName,
    resourceKey,
    resourceField,
    associatedName,
    associatedKey,
    associated,
    values = {},
    ...others
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
  const { primaryKeyAttribute } = Model;

  const sourceId = others.sourceId || resourceKey;
  const field = others.sortField || values?.sortField || values?.field || 'sort';
  const targetId = others.targetId || values?.targetId || values?.target?.[primaryKeyAttribute];
  const method = others.method || values?.method;
  const insertAfter = method === 'insertAfter';
  const sticky = others.sticky || values?.sticky || method === 'prepend';
  const targetScope = others.targetScope || values?.targetScope;

  if (!sourceId) {
    throw new Error('source id invalid');
  }

  if (!(sticky || targetId || targetScope)) {
    throw new Error('target id/scope invalid');
  }

  const sortField = table.getField(field);

  if (!sortField) {
    return next();
  }

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
      [primaryKeyAttribute]: sourceId
    },
    transaction
  });

  if (!source) {
    await transaction.rollback();
    throw new Error(`resource ${sourceId} does not exist`);
  }

  const sourceScopeWhere = source.getValuesByFieldNames(scope);

  let targetScopeWhere: any;
  let targetObject;

  if (targetId) {
    targetObject = await Model.findByPk(targetId, { transaction });
    if (!targetObject) {
      await transaction.rollback();
      throw new Error(`resource ${targetId} does not exist`);
    }
    targetScopeWhere = targetObject.getValuesByFieldNames(scope);
  } else {
    targetScopeWhere = { ...sourceScopeWhere, ...targetScope };
  }

  const sameScope = whereCompare(sourceScopeWhere, targetScopeWhere);
  const updates = { ...targetScopeWhere };

  if (targetObject) {
    let increment: number;
    const updateWhere = { ...targetScopeWhere };
    if (sameScope) {
      const direction = source[sortAttr] < targetObject[sortAttr] ? {
        sourceOp: Op.gt,
        targetOp: insertAfter ? Op.lt : Op.lte,
        increment: -1
      } : {
        sourceOp: Op.lt,
        targetOp: insertAfter ? Op.gt : Op.gte,
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
          [insertAfter ? Op.gt : Op.gte]: targetObject[sortAttr]
        }
      });
    }

    console.log({ insertAfter, updateWhere })

    await Model.increment(sortAttr, {
      by: increment,
      where: updateWhere,
      transaction
    });

    Object.assign(updates, {
      [sortAttr]: insertAfter ? targetObject[sortAttr] + 1 : targetObject[sortAttr]
    });
  } else {
    Object.assign(updates, {
      [sortAttr]: await sortField.getNextValue({
        next: sticky ? 'min' : 'max',
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

export default sort;

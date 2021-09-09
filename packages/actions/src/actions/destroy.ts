import _ from 'lodash';
import { Op } from 'sequelize';
import {
  Model,
  HASONE,
  HASMANY,
  BELONGSTO,
  BELONGSTOMANY,
} from '@nocobase/database';
import { Context, Next } from '..';

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
    filter,
  } = ctx.action.params;
  const transaction = await ctx.db.sequelize.transaction();
  const commonOptions = { transaction, context: ctx };
  let count;
  if (associated && resourceField) {
    const AssociatedModel = ctx.db.getModel(associatedName);
    if (!(associated instanceof AssociatedModel)) {
      await transaction.rollback();
      throw new Error(`${associatedName} associated model invalid`);
    }
    const {
      get: getAccessor,
      remove: removeAccessor,
      set: setAccessor,
    } = resourceField.getAccessors();
    const TargetModel = ctx.db.getModel(resourceField.getTarget());
    const { where } = TargetModel.parseApiJson({ filter, context: ctx });
    if (resourceField instanceof HASONE || resourceField instanceof BELONGSTO) {
      const model: Model = await associated[getAccessor](commonOptions);
      // TODO：不能程序上解除关系，直接通过 onDelete 触发，或者通过 afterDestroy 处理
      // await associated[setAccessor](null, commonOptions);
      // @ts-ignore
      count = await model.destroy(commonOptions);
    } else if (
      resourceField instanceof HASMANY ||
      resourceField instanceof BELONGSTOMANY
    ) {
      const primaryKey =
        resourceKeyAttribute ||
        resourceField.options.targetKey ||
        TargetModel.primaryKeyAttribute;
      const models: Model[] = await associated[getAccessor]({
        where: resourceKey ? { [primaryKey]: resourceKey } : where,
        ...commonOptions,
      });
      // TODO：不能程序上解除关系，直接通过 onDelete 触发，或者通过 afterDestroy 处理
      // await associated[removeAccessor](models, commonOptions);
      // @ts-ignore
      count = await TargetModel.destroy({
        where: {
          [primaryKey]: { [Op.in]: models.map((item) => item[primaryKey]) },
        },
        ...commonOptions,
        individualHooks: true,
      });
    }
  } else {
    const Model = ctx.db.getModel(resourceName);
    const { where } = Model.parseApiJson({ filter, context: ctx });
    const primaryKey = resourceKeyAttribute || Model.primaryKeyAttribute;
    count = await Model.destroy({
      where: resourceKey ? { [primaryKey]: resourceKey } : where,
      // @ts-ignore hooks 里添加 context
      ...commonOptions,
      individualHooks: true,
    });
  }
  ctx.body = { count };
  await transaction.commit();
  await next();
}

export default destroy;

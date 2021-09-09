import _ from 'lodash';
import { Context, Next } from '..';
import {
  Model,
  HASONE,
  HASMANY,
  BELONGSTO,
  BELONGSTOMANY,
  whereCompare
} from '@nocobase/database';
import { filterByFields } from '../utils';

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
  const options = { transaction, context: ctx };
  if (associated && resourceField) {
    const AssociatedModel = ctx.db.getModel(associatedName);
    if (!(associated instanceof AssociatedModel)) {
      await transaction.rollback();
      throw new Error(`${associatedName} associated model invalid`);
    }
    const { get: getAccessor } = resourceField.getAccessors();
    if (resourceField instanceof HASONE || resourceField instanceof BELONGSTO) {
      let model: Model = await associated[getAccessor](options);
      if (model) {
        // @ts-ignore
        await model.update(values, options);
        await model.updateAssociations(values, options);
        ctx.body = model;
      }
    } else if (resourceField instanceof HASMANY || resourceField instanceof BELONGSTOMANY) {
      const TargetModel = ctx.db.getModel(resourceField.getTarget());
      const [model]: Model[] = await associated[getAccessor]({
        ...options,
        where: {
          [resourceKeyAttribute || resourceField.options.targetKey || TargetModel.primaryKeyAttribute]: resourceKey,
        }
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
          // TODO: 中间表的 Model 有问题，关联数据更新有 BUG
          // await through.updateAssociations(throughValues, options);
          await through.update(throughValues, options);
          delete values[throughName];
        }
      }
      if (!_.isEmpty(values)) {
        // @ts-ignore
        await model.update(values, options);
        await model.updateAssociations(values, options);
      }
      ctx.body = model;
    }
  } else {
    const Model = ctx.db.getModel(resourceName);
    const model = await Model.findOne({
      ...options,
      where: {
        [resourceKeyAttribute || Model.primaryKeyAttribute]: resourceKey,
      }
    });
    // @ts-ignore
    await model.update(values, options);
    // @ts-ignore
    await model.updateAssociations(values, options);
    ctx.body = model;
  }
  await transaction.commit();
  await next();
}

export default update;

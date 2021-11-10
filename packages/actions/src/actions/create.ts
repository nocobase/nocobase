import _ from 'lodash';
import { Context, Next } from '..';
import { Model } from '@nocobase/database';
import { filterByFields } from '../utils';

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
    values: data = {},
    fields,
  } = ctx.action.params;
  const values = filterByFields(data, fields);
  const transaction = await ctx.db.sequelize.transaction();
  const options = { transaction, context: ctx };
  let model: Model;
  try {
    if (associated && resourceField) {
      const AssociatedModel = ctx.db.getModel(associatedName);
      if (!(associated instanceof AssociatedModel)) {
        throw new Error(`${associatedName} associated model invalid`);
      }
      const { create } = resourceField.getAccessors();
      model = await associated[create](values, options);
    } else {
      const ResourceModel = ctx.db.getModel(resourceName);
      model = await ResourceModel.create(values, options);
    }
    await model.updateAssociations(values, options);
    await transaction.commit();
    ctx.body = model;
    await next();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export default create;

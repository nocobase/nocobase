import _ from 'lodash';
import { Context, Next } from '..';
import {
  Model,
  HASONE,
  HASMANY,
  BELONGSTO,
  BELONGSTOMANY,
} from '@nocobase/database';

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
    resourceIndex,
    resourceIndexAttribute,
    fields = [],
    appends = [],
    except = [],
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
      appends,
      except,
    });
    if (resourceField instanceof HASONE || resourceField instanceof BELONGSTO) {
      let model: Model = await associated[getAccessor]({ context: ctx });
      if (model) {
        model = await TargetModel.findOne({
          ...options,
          context: ctx,
          where: {
            [TargetModel.primaryKeyAttribute]: model[TargetModel.primaryKeyAttribute],
          },
        });
      }
      ctx.body = model;
    } else if (resourceField instanceof HASMANY || resourceField instanceof BELONGSTOMANY) {
      const [model]: Model[] = await associated[getAccessor]({
        ...options,
        where: {
          [resourceIndexAttribute || resourceField.options.targetKey || TargetModel.primaryKeyAttribute]: resourceIndex,
        },
        context: ctx,
      });
      ctx.body = model;
    }
  } else {
    const Model = ctx.db.getModel(resourceName);
    const options = Model.parseApiJson({
      fields,
      appends,
      except,
    });
    const data = await Model.findOne({
      ...options,
      where: {
        [resourceIndexAttribute || Model.primaryKeyAttribute]: resourceIndex,
      },
      // @ts-ignore hooks 里添加 context
      context: ctx,
    });
    ctx.body = data;
  }
  await next();
}

export default get;

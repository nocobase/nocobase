import { Context, Next, associate } from '../actions';
import { Action } from '@nocobase/resourcer';
import { HasOne, HasMany, BelongsTo, BelongsToMany, Model } from '@nocobase/database';

export async function associated(ctx: Context, next: Next) {
  if (!(ctx.action instanceof Action)) {
    return next();
  }

  const { associated, associatedName, associatedKey, resourceName } = ctx.action.params;

  if (!associatedName || !associatedKey) {
    return next();
  }

  if (associated) {
    return next();
  }

  const Model = ctx.db.getModel(associatedName);
  const field = ctx.db.getTable(associatedName).getField(resourceName);

  let model: Model;

  if (field instanceof HasOne) {
    model = await Model.findOne({
      where: {
        [field.options.sourceKey]: associatedKey,
      }
    });
  } else if (field instanceof HasMany) {
    model = await Model.findOne({
      where: {
        [field.options.sourceKey]: associatedKey,
      }
    });
  } else if (field instanceof BelongsTo) {
    model = await Model.findOne({
      where: {
        [Model.primaryKeyAttribute]: associatedKey,
      }
    });
  } else if (field instanceof BelongsToMany) {
    model = await Model.findOne({
      where: {
        [field.options.sourceKey]: associatedKey,
      }
    });
  }

  if (model) {
    ctx.action.setParam('associated', model);
    ctx.action.setParam('resourceField', field);
  }

  await next();
}

export default associated;

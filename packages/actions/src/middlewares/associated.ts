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

  let key: string;

  switch (true) {
    case field instanceof BelongsTo:
      key = field.options.targetKey || Model.primaryKeyAttribute;
      break;
    case field instanceof HasOne:
    case field instanceof HasMany:
    case field instanceof BelongsToMany:
      key = field.options.sourceKey;
      break;
  }

  if (key) {
    const model = await Model.findOne({
      where: {
        [key]: associatedKey,
      }
    });
    if (model) {
      ctx.action.setParam('associated', model);
      ctx.action.setParam('resourceField', field);
    }
  }

  await next();
}

export default associated;

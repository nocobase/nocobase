import { Context, Next } from '../actions';
import { Action } from '@nocobase/resourcer';
import { HASONE, HASMANY, BELONGSTO, BELONGSTOMANY } from '@nocobase/database';

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
    case field instanceof BELONGSTO:
      // 如：fields.collection，对应的 API 为 /fields/119/collection，此时 key 为 PK
      key = Model.primaryKeyAttribute;
      break;
    case field instanceof HASONE:
    case field instanceof HASMANY:
    case field instanceof BELONGSTOMANY:
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

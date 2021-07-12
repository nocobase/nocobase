import { Model, ModelCtor } from '@nocobase/database';
import { actions } from '@nocobase/actions';

export default async (ctx: actions.Context, next: actions.Next) => {
  const { resourceKey } = ctx.action.params;
  const UISchema = ctx.db.getModel('ui_schemas');
  const schema = await UISchema.findByPk(resourceKey);
  const property = schema.toProperty();
  const properties = await schema.getProperties();
  if (Object.keys(properties).length) {
    property.properties = properties;
  }
  ctx.body = property;
  await next();
}

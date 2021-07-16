import { Model, ModelCtor } from '@nocobase/database';
import { actions } from '@nocobase/actions';

export default async (ctx: actions.Context, next: actions.Next) => {
  const { resourceKey, filter } = ctx.action.params;
  const UISchema = ctx.db.getModel('ui_schemas');
  if (resourceKey) {
    const schema = await UISchema.findByPk(resourceKey);
    const property = schema.toProperty();
    const properties = await schema.getProperties();
    if (Object.keys(properties).length) {
      property.properties = properties;
    }
    ctx.body = property;
  } else {
    const schemas = await UISchema.findAll(UISchema.parseApiJson({
      filter,
    }));
    let properties = {};
    for (const schema of schemas) {
      const property = schema.toProperty();
      const properties = await schema.getProperties();
      if (Object.keys(properties).length) {
        property.properties = properties;
      }
      properties[property.name] = property;
    }
    ctx.body = {
      type: 'object',
      properties,
    }
  }
  
  await next();
}

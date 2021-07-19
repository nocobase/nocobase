import { Model, ModelCtor } from '@nocobase/database';
import { actions, middlewares } from '@nocobase/actions';
import { sort } from '@nocobase/actions/src/actions/common';
import { cloneDeep, omit } from 'lodash';

export const create = async (ctx: actions.Context, next: actions.Next) => {
  const values = cloneDeep(ctx.action.params.values);
  ctx.action.mergeParams(
    {
      values: cloneDeep(omit(values, [
        '__insertAfter__',
        '__insertBefore__',
        '__prepend__',
        '_isJSONSchemaObject',
      ])),
    },
    {
      payload: 'replace',
    },
  );
  await actions.common.create(ctx, async () => { });
  const sticky = values['__prepend__'];
  const targetKey = values['__insertAfter__'] || values['__insertBefore__'];
  if (sticky || targetKey) {
    const body = ctx.body;
    ctx.action.mergeParams(
      {
        associatedKey: values.parentKey,
        resourceKey: body.key,
        values: sticky ? {
          field: 'sort',
          sticky: true,
          target: {},
        } : {
          field: 'sort',
          insertAfter: !!values['__insertAfter__'],
          target: {
            key: targetKey,
          },
        },
      },
      {
        payload: 'replace',
      },
    );
    console.log(ctx.action.params.values);
    await middlewares.associated(ctx, async () => { });
    await sort(ctx, async () => { });
    console.log(ctx.body.toJSON());
  }
  await next();
};

export const update = async (ctx: actions.Context, next: actions.Next) => {
  const values = cloneDeep(ctx.action.params.values);
  ctx.action.mergeParams(
    {
      values: cloneDeep(omit(values, [
        '__insertAfter__',
        '__insertBefore__',
        '__prepend__',
        '_isJSONSchemaObject',
      ])),
    },
    {
      payload: 'replace',
    },
  );
  await actions.common.update(ctx, async () => { });
  const sticky = values['__prepend__'];
  const targetKey = values['__insertAfter__'] || values['__insertBefore__'];
  if (sticky || targetKey) {
    const body = ctx.body;
    ctx.action.mergeParams(
      {
        associatedKey: values.parentKey,
        resourceKey: body.key,
        values: sticky ? {
          field: 'sort',
          sticky: true,
          target: {},
        } : {
          field: 'sort',
          insertAfter: !!values['__insertAfter__'],
          target: {
            key: targetKey,
          },
        },
      },
      {
        payload: 'replace',
      },
    );
    console.log(ctx.action.params.values);
    await middlewares.associated(ctx, async () => { });
    await sort(ctx, async () => { });
    console.log(ctx.body.toJSON());
  }
  await next();
};

export const getTree = async (ctx: actions.Context, next: actions.Next) => {
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
    const schemas = await UISchema.findAll(
      UISchema.parseApiJson({
        filter,
        sort: ['sort'],
      }),
    );
    console.log({ schemas });
    let properties = {};
    for (const schema of schemas) {
      const property = schema.toProperty();
      const childProperties = await schema.getProperties();
      if (Object.keys(childProperties).length) {
        property.properties = childProperties;
      }
      properties[property.name] = property;
    }
    ctx.body = {
      type: 'object',
      properties,
    };
  }

  await next();
};

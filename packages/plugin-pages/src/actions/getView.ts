import { ResourceOptions } from '@nocobase/resourcer';
import { Model, ModelCtor } from '@nocobase/database';
import { get } from 'lodash';

const transforms = {
  table: async (fields: Model[]) => {
    const arr = [];
    for (const field of fields) {
      if (!get(field.component, 'showInTable')) {
        continue;
      }
      arr.push({
        ...field.toJSON(),
        ...field.options,
        dataIndex: field.name,
      });
    }
    return arr;
  },
  form: async (fields: Model[]) => {
    const schema = {};
    for (const field of fields) {
      if (!get(field.component, 'showInForm')) {
        continue;
      }
      const type = get(field.component, 'type', 'string');
      const prop: any = {
        type,
        title: field.title||field.name,
      }
      if (type === 'select') {
        prop.type = 'string'
      }
      const defaultValue = get(field.options, 'defaultValue');
      if (defaultValue) {
        prop.default = defaultValue;
      }
      if (['radio'].includes(type)) {
        prop.enum = get(field.options, 'options', []);
      }
      schema[field.name] = {
        ...prop,
      };
    }
    return schema;
  },
  details: async (fields: Model[]) => {
    const arr = [];
    for (const field of fields) {
      if (!get(field.component, 'showInDetail')) {
        continue;
      }
      arr.push({
        ...field.toJSON(),
        ...field.options,
      });
    }
    return arr;
  },
};

export default async (ctx, next) => {
  const { resourceName, resourceKey } = ctx.action.params;
  const [View, Field, Action] = ctx.db.getModels(['views', 'fields', 'actions']) as ModelCtor<Model>[];
  const view = await View.findOne(View.parseApiJson({
    filter: {
      collection_name: resourceName,
      name: resourceKey,
    },
    // fields: {
    //   appends: ['actions', 'fields'],
    // },
  }));
  const collection = await view.getCollection();
  const fields = await collection.getFields({
    order: [
      ['sort', 'asc'],
    ]
  });
  const actions = await collection.getActions({
    order: [
      ['sort', 'asc'],
    ]
  });
  const actionNames = view.options.actionNames||[];
  console.log(view.options);
  if (view.type === 'table') {
    const defaultTabs = await collection.getTabs({
      where: {
        default: true,
      },
    });
    view.setDataValue('defaultTabName', get(defaultTabs, [0, 'name']));
  }
  if (view.options.updateViewName) {
    view.setDataValue('rowViewName', view.options.updateViewName);
  }
  view.setDataValue('viewCollectionName', view.collection_name);
  ctx.body = {
    ...view.toJSON(),
    ...(view.options||{}),
    fields: await (transforms[view.type]||transforms.table)(fields),
    actions: actions.filter(action => actionNames.includes(action.name)).map(action => ({
      ...action.toJSON(),
      ...action.options,
      viewCollectionName: action.collection_name,
    })),
  };
  await next();
};

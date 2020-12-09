import { ResourceOptions } from '@nocobase/resourcer';
import { Model, ModelCtor } from '@nocobase/database';
import { get, set } from 'lodash';

const transforms = {
  table: async (fields: Model[], context?: any) => {
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
  form: async (fields: Model[], ctx?: any) => {
    const mode = get(ctx.action.params, ['values', 'mode'], ctx.action.params.mode);
    const schema = {};
    for (const field of fields) {
      if (!field.get('component.showInForm')) {
        continue;
      }
      const interfaceType = field.get('interface');
      const type = field.get('component.type') || 'string';
      const prop: any = {
        type,
        title: field.title||field.name,
        ...(field.component||{}),
      }
      if (type === 'select') {
        prop.type = 'string'
      }
      if (mode === 'update' && field.get('createOnly')) {
        set(prop, 'x-component-props.disabled', true);
      }
      if (typeof field.get('showTime') === 'boolean') {
        set(prop, 'x-component-props.showTime', field.get('showTime'));
      }
      const defaultValue = get(field.options, 'defaultValue');
      if (defaultValue) {
        prop.default = defaultValue;
      }
      if (['radio', 'select', 'checkboxes'].includes(interfaceType)) {
        prop.enum = get(field.options, 'dataSource', []);
      }
      schema[field.name] = {
        ...prop,
      };
    }
    return schema;
  },
  details: async (fields: Model[], context?: any) => {
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
  filter: async (fields: Model[], ctx?: any) => {
    const properties = {
      filter: {
        type: 'filter',
        'x-component-props': {
          fields,
        },
      }
    }
    return properties;
  },
};

export default async (ctx, next) => {
  const { resourceName, resourceKey } = ctx.action.params;
  const [View, Collection, Field, Action] = ctx.db.getModels(['views', 'collections', 'fields', 'actions']) as ModelCtor<Model>[];
  let view = await View.findOne(View.parseApiJson({
    filter: {
      collection_name: resourceName,
      name: resourceKey,
    },
    // fields: {
    //   appends: ['actions', 'fields'],
    // },
  }));
  if (!view) {
    // 如果不存在 view，新建一个
    view = new View({type: resourceKey, template: 'FilterForm'});
  }
  const collection = await Collection.findOne({
    where: {
      name: resourceName,
    },
  });
  const fields = await collection.getFields({
    where: {
      developerMode: ctx.state.developerMode,
    },
    order: [
      ['sort', 'asc'],
    ]
  });
  const actions = await collection.getActions({
    where: {
      developerMode: ctx.state.developerMode,
    },
    order: [
      ['sort', 'asc'],
    ]
  });
  const actionNames = view.get('actionNames') || [];
  if (view.get('type') === 'table') {
    const defaultTabs = await collection.getTabs({
      where: {
        default: true,
      },
    });
    view.setDataValue('defaultTabName', get(defaultTabs, [0, 'name']));
  }
  if (view.get('updateViewName')) {
    view.setDataValue('rowViewName', view.get('updateViewName'));
  }
  view.setDataValue('viewCollectionName', view.collection_name);
  let title = collection.get('title');
  const mode = get(ctx.action.params, ['values', 'mode'], ctx.action.params.mode);
  if (mode === 'update') {
    title = `编辑${title}`;
  } else {
    title = `创建${title}`;
  }
  ctx.body = {
    ...view.get(),
    title,
    original: fields,
    fields: await (transforms[view.type]||transforms.table)(fields, ctx),
    actions: actions.filter(action => actionNames.includes(action.name)).map(action => ({
      ...action.toJSON(),
      ...action.options,
      viewCollectionName: action.collection_name,
    })),
  };
  await next();
};

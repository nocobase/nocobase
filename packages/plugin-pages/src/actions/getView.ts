import { Model, ModelCtor } from '@nocobase/database';
import { get, set } from 'lodash';
import { Op } from 'sequelize';

const transforms = {
  table: async (fields: Model[], context?: any) => {
    const arr = [];
    for (const field of fields) {
      if (!field.get('component.showInTable')) {
        continue;
      }
      arr.push({
        ...field.get(),
        sorter: field.get('sortable'),
        dataIndex: field.name.split('.'),
      });
    }
    return arr;
  },
  form: async (fields: Model[], ctx?: any) => {
    const [Field] = ctx.db.getModels(['fields']) as ModelCtor<Model>[];
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
      if (field.get('name') === 'interface' && ctx.state.developerMode === false) {
        const dataSource = field.get('dataSource').filter(item => item.key !== 'developerMode');
        field.set('dataSource', dataSource);
      }
      if (field.get('name') === 'filter' && field.get('collection_name') === 'views') {
        const { values } = ctx.action.params;
        const all = await Field.findAll({
          where: {
            collection_name: get(values, 'associatedKey'),
            developerMode: ctx.state.developerMode,
          },
          order: [['sort', 'asc']],
        });
        set(prop, 'x-component-props.fields', all.filter(f => f.get('filterable')));
      }
      if (type === 'select') {
        prop.type = 'string'
      }
      if (field.get('component.tooltip')) {
        prop.description = field.get('component.tooltip');
      }
      // if (field.get('name') === 'dataSource') {
      //   set(prop, 'items.properties.value.visible', false);
      // }
      if (['number', 'percent'].includes(interfaceType) && field.get('precision')) {
        set(prop, 'x-component-props.step', field.get('precision'));
      }
      if (field.get('required')) {
        prop.required = true;
      }
      if (mode === 'update' && field.get('createOnly')) {
        set(prop, 'x-component-props.disabled', true);
      }
      if (typeof field.get('showTime') === 'boolean') {
        set(prop, 'x-component-props.showTime', field.get('showTime'));
      }
      const defaultValue = get(field.options, 'defaultValue');
      if (typeof defaultValue !== 'undefined') {
        prop.default = defaultValue;
      }
      if (interfaceType === 'boolean') {
        set(prop, 'x-component-props.children', prop.title);
        delete prop.title;
      }
      if (interfaceType === 'linkTo') {
        set(prop, 'x-component-props.associatedName', field.get('collection_name'));
        set(prop, 'x-component-props.target', field.get('target'));
        set(prop, 'x-component-props.multiple', field.get('multiple'));
        set(prop, 'x-component-props.labelField', field.get('labelField'));
      }
      if (interfaceType === 'multipleSelect') {
        set(prop, 'x-component-props.mode', 'multiple');
      }
      if (interfaceType === 'subTable' && field.get('target')) {
        set(prop, 'x-component-props.target', field.get('target'));
        // resourceName
      }
      if (['radio', 'select', 'multipleSelect', 'checkboxes'].includes(interfaceType)) {
        prop.enum = field.get('dataSource');
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
      const props = {};
      if (field.get('interface') === 'subTable') {
        const children = await field.getChildren();
        props['children'] = children.map(child => ({...child.toJSON(), dataIndex: child.name.split('.')}))
      }
      arr.push({
        ...field.toJSON(),
        ...props,
      });
    }
    return arr;
  },
  filter: async (fields: Model[], ctx?: any) => {
    const properties = {
      filter: {
        type: 'filter',
        'x-component-props': {
          fields: fields.filter(field => field.get('filterable')),
        },
      },
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
  const where: any = {
    developerMode: ctx.state.developerMode,
  }
  if (!view.get('draggable')) {
    where.type = {
      [Op.not]: 'sort',
    };
  }
  const fields = await collection.getFields({
    where,
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
  let actionNames = view.get('actionNames') || [];
  if (actionNames.length === 0) {
    actionNames = ['filter', 'create', 'destroy'];
  }
  if (view.get('type') === 'table') {
    const defaultTabs = await collection.getTabs({
      where: {
        default: true,
      },
    });
    view.setDataValue('defaultTabName', get(defaultTabs, [0, 'name']));
  }
  
  if (view.get('type') === 'table') {
    view.setDataValue('rowViewName', 'form');
  }
  if (view.get('updateViewName')) {
    view.setDataValue('rowViewName', view.get('updateViewName'));
  }
  // view.setDataValue('viewCollectionName', view.collection_name);
  let title = collection.get('title');
  const mode = get(ctx.action.params, ['values', 'mode'], ctx.action.params.mode);
  if (mode === 'update') {
    title = `编辑${title}`;
  } else {
    title = `新增${title}`;
  }
  const viewType = view.get('type');
  const actionDefaultParams:any = {};
  const appends = [];
  for (const field of fields) {
    if (!['subTable', 'linkTo', 'attachment'].includes(field.get('interface'))) {
      continue;
    }
    let showInKey;
    switch (viewType) {
      case 'table':
        showInKey = 'showInTable';
        break;
      case 'form':
        showInKey = 'showInForm';
        break;
      case 'details':
        showInKey = 'showInDetail';
        break;
    }
    if (showInKey && field.get(`component.${showInKey}`)) {
      appends.push(field.name);
      if (field.get('interface') === 'attachment') {
        appends.push(`${field.name}.storage`);
      }
    }
  }
  actionDefaultParams['fields[appends]'] = appends.join(',');
  ctx.body = {
    ...view.get(),
    title,
    actionDefaultParams,
    original: fields,
    fields: await (transforms[view.type]||transforms.table)(fields, ctx),
    actions: actions.filter(action => actionNames.includes(action.name)).map(action => ({
      ...action.toJSON(),
      ...action.options,
      // viewCollectionName: action.collection_name,
    })),
  };
  await next();
};

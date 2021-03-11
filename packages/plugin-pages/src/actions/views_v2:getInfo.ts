import { ResourceOptions } from '@nocobase/resourcer';
import { Model, ModelCtor } from '@nocobase/database';
import actions from '@nocobase/actions';
import { merge } from '../utils';
import _ from 'lodash';

export const getInfo = async (ctx: actions.Context, next) => {
  const { resourceKey } = ctx.action.params;
  const View = ctx.db.getModel('views_v2') as ModelCtor<Model>;
  const Field = ctx.db.getModel('fields') as ModelCtor<Model>;
  let primaryKey: string;
  let viewName: string;
  let collectionName: string;
  let associatedName: string;
  let resourceName: string;
  let associationField: any;
  if (resourceKey.includes('.')) {
    const keys = resourceKey.split('.');
    viewName = keys.pop();
    const key1 = keys.shift();
    const key2 = keys.join('.');
    // const [key1, key2] = keys;
    if (key2) {
      const field = ctx.db.getTable(key1).getField(key2);
      associationField = await Field.findOne({
        where: {
          collection_name: key1,
          name: key2,
        },
      });
      collectionName = field.options.target;
      associatedName = key1;
      resourceName = key2;
    } else {
      collectionName = key1;
    }
  }
  console.log({viewName, collectionName, associatedName})
  let view = await View.findOne({
    where: {
      name: viewName,
      collection_name: collectionName
    },
  });

  if (view && view.type === 'form') {
    const statusable = !!ctx.db.getTable(view.collection_name).getField('status');
    if (statusable) {
      view.setDataValue('statusable', statusable);
    }
  }
  
  const Collection = ctx.db.getModel('collections') as ModelCtor<Model>;
  const M = ctx.db.getModel(collectionName) as ModelCtor<Model>;

  // if (!view && viewName === 'descriptions') {
  //   view = await View.findOne({
  //     where: {
  //       name: 'form',
  //       collection_name: collectionName
  //     },
  //   });
  //   view.type = 'descriptions';
  // }
  let viewData: any = view ? view.toJSON() : {};

  if (view) {
    viewData.fields = view.get(`x-${view.type}-props.fields`) || view.get('fields') || [];
    viewData.actions = view.get(`x-${view.type}-props.actions`) || view.get('actions') || [];
    viewData.details = view.get(`x-${view.type}-props.details`) || view.get('details') || [];
  }

  if (!view) {
    const collection = await Collection.findOne({
      where: {
        name: collectionName,
      }
    });
    const fields = await collection.getFields({
      order: [['sort', 'asc']],
    });
    if (viewName === 'table') {
      viewData = {
        collection_name: collectionName,
        type: 'table',
        name: 'table',
        title: '全部数据',
        actions: [
          {
            name: 'create',
            type: 'create',
            title: '新增',
            viewName: 'form',
          },
          {
            name: 'destroy',
            type: 'destroy',
            title: '删除',
          },
        ],
        // labelField: 'title',
        fields: fields.filter(field => {
          return field.name !== 'action_logs';
        }).map(field => field.name),
        detailsOpenMode: 'drawer', // window
        details: ['form'],
        sort: ['id'],
      };
    } else if (viewName === 'form') {
      viewData = {
        collection_name: collectionName,
        type: 'form',
        name: 'form',
        title: '表单',
        // labelField: 'title',
        fields: fields.filter(field => {
          return field.name !== 'action_logs';
        }).map(field => field.name),
      };
    } else if (viewName === 'descriptions') {
      viewData = {
        collection_name: collectionName,
        type: 'descriptions',
        name: 'descriptions',
        title: '详情',
        // labelField: 'title',
        actions: [],
        fields: fields.filter(field => {
          return field.name !== 'action_logs';
        }).map(field => field.name),
      };
    }
  }

  // ctx.body = {};
  // return next();

  const fields = [];
  for (const field of viewData.fields||[]) {
    let fieldName: any;
    let json: any;
    if (typeof field === 'string') {
      fieldName = field;
    } else if (typeof field === 'object') {
      console.log({field});
      if (field.field) {
        const { field: f, ...others } = field;
        fieldName = f.name;
        json = {...others};
      } else if (field.name) {
        fieldName = field.name;
        json = field;
      }
    }
    const model = await Field.findOne({
      where: {
        collection_name: viewData.collection_name,
        name: fieldName,
      },
    });
    if (model) {
      const target = model.get('target');
      if (target && model.get('interface') === 'subTable') {
        const children = await Field.findAll(Field.parseApiJson({
          filter: {
            collection_name: target,
            'name.ne': 'action_logs',
          },
          sort: 'sort',
        }));
        if (children.length) {
          model.setDataValue('children', children);
        }
      }
      model.setDataValue('dataIndex', model.name.split('.'));
      if (typeof field === 'object') {
        json = merge(model.toJSON(), json);
      } else {
        json = model.toJSON();
      }
    }
    console.log({field, json})
    json && fields.push(json);
  }
  
  const actions = [];
  const toFields = async (values = []) => {
    const fields = [];
    for (const value of values) {
      if (typeof value === 'string') {
        const model = await Field.findOne({
          where: {
            collection_name: viewData.collection_name,
            name: value,
          },
        });
        if (model) {
          fields.push(model);
        }
      }
    }
    return fields;
  }
  if (viewData.actions) {
    const parts = resourceKey.split('.');
    parts.pop();
    for (const action of viewData.actions || []) {
      if (action.viewName) {
        if (!action.viewName.includes('.')) {
          action.viewName = `${parts.join('.')}.${action.viewName}`;
        }
      }
      if (action.view && action.view.name) {
        action.viewName = `${parts.join('.')}.${action.view.name}`;
      }
      if (action.fields) {
        action.fields = await toFields(action.fields);
      }
      actions.push({
        ...action,
      })
    }
  }
  const details = [];
  for (const item of viewData.details || []) {
    let vName: string;
    if (typeof item === 'string') {
      vName = item;
      const sView = await View.findOne({
        where: {
          collection_name: viewData.collection_name,
          name: vName,
        }
      });
      sView && details.push({
        title: sView.title,
        views: [sView],
      });
    } else if (typeof item === 'object') {
      if (item.views) {
        // TODO 标签页多视图支持
      } else if (item.view) {
        const { view: v, ...others } = item;
        vName = v.name;
        const sView = await View.findOne({
          where: {
            collection_name: viewData.collection_name,
            name: vName,
          }
        });
        sView && details.push({
          ...others,
          views: [sView],
        });
      }
    }
  }
  const data: any = {
    ...viewData,
    details,
    actions,
    fields,
  };
  if (data.target_field_id) {
    const targetField = await Field.findByPk(data.target_field_id);
    data.targetFieldName = targetField.name;
  }
  if (data.target_view_id) {
    const targetView = await View.findByPk(data.target_view_id);
    data.targetViewName = targetView.name;
  }
  if (associationField) {
    data.associationField = associationField;
  }
  if (data.dataSourceType === 'association') {
    const field = await Field.findOne({
      where: {
        name: data.targetFieldName,
        collection_name: collectionName,
      }
    });
    console.log(field, data.targetFieldName, collectionName)
    const targetViewName = `${field.get('target')}.${data.targetViewName}`;
    const resourceName = `${collectionName}.${data.targetFieldName}`;
    ctx.action.mergeParams({
      resourceKey: targetViewName,
    });
    await getInfo(ctx, async () => {});
    const body = ctx.body as any;
    const actions = body.actions.map(action => {
      if (action.viewName) {
        const names= action.viewName.split('.');
        action.viewName = `${resourceName}.${names.pop()}`;
      }
      return action;
    });
    const item = {
      ...body,
      associationField: field,
      resourceName,
      actions,
      rowKey: resourceKey === 'roles.collections' ? 'name' : body.rowKey,
    }
    ctx.body = item;
    return next();
  } else {
    data.rowKey = data.rowKey || M.primaryKeyAttribute;
    if (associatedName) {
      data.resourceName = `${associatedName}.${resourceName}`;
    } else {
      data.resourceName = collectionName;
    }
    data.appends = data.fields.filter(field => {
      return ['hasMany', 'hasOne', 'belongsToMany', 'belongsTo'].includes(field.type);
    }).map(field => field.name);

    for (const field of data.fields) {
      if (field.interface === 'attachment') {
        data.appends.push(`${field.name}.storage`);
      }
    }
  }
  delete data['resourceKey'];
  delete data['associatedKey'];
  for (const [key, value] of Object.entries(viewData[`x-${viewData.type}-props`]||{})) {
    if (_.get(data, key) === null || _.get(data, key) === undefined) {
      _.set(data, key, value);
    }
  }

  if (_.isEmpty(data.sort)) {
    data.sort = [];
  }
  
  ctx.body = data;
  await next();
};

export default getInfo;

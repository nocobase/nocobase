import { ResourceOptions } from '@nocobase/resourcer';
import { Model, ModelCtor } from '@nocobase/database';
import actions from '@nocobase/actions';
import { merge } from '../utils';
import _ from 'lodash';

export const getInfo = async (ctx: actions.Context, next) => {
  const { resourceKey } = ctx.action.params;
  const View = ctx.db.getModel('views_v2') as ModelCtor<Model>;
  const Page = ctx.db.getModel('pages_v2') as ModelCtor<Model>;
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
  const view = await View.findOne({
    where: {
      name: viewName,
      collection_name: collectionName
    },
  });
  let viewData = view.toJSON();
  const Collection = ctx.db.getModel(collectionName) as ModelCtor<Model>;
  // const items = await view.getPages(Page.parseApiJson({
  //   sort: ['sort'],
  // }));
  // const pages = [];
  // for (const item of items) {
  //   const page = await Page.findByPk(item.page_id);
  //   pages.push(page);
  // }
  // const columns = await Field.findAll(Field.parseApiJson({
  //   filter: {
  //     collection_name: view.collection_name,
  //     'name.in': view.get('fields')||[],
  //   },
  //   sort: ['sort'],
  // }));
  const fields = [];
  for (const field of view.get(`x-${view.type}-props.fields`) || view.get('fields') || []) {
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
        collection_name: view.collection_name,
        name: fieldName,
      },
    });
    if (model) {
      const target = model.get('target');
      if (target && model.get('interface') === 'subTable') {
        const children = await Field.findAll({
          where: {
            collection_name: target,
          },
          order: [['sort', 'asc']],
        });
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
            collection_name: view.collection_name,
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
  if (view.get(`x-${view.type}-props.actions`) || view.get('actions')) {
    const parts = resourceKey.split('.');
    parts.pop();
    for (const action of view.get(`x-${view.type}-props.actions`) || view.get('actions')) {
      if (action.viewName) {
        action.viewName = `${parts.join('.')}.${action.viewName}`;
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
  for (const item of view.get(`x-${view.type}-props.details`) || view.get('details') || []) {
    let pageName: string;
    let json: any = {};
    if (typeof item === 'string') {
      pageName = item;
    } else if (typeof item === 'object') {
      if (item.page) {
        const { page: p, ...others } = item;
        pageName = p.name;
        json = others;
      } else if (item.name) {
        pageName = item.name;
        json = item;
      }
    }
    const page = await Page.findOne({
      where: {
        collection_name: view.collection_name,
        name: pageName,
      }
    });
    let detail: any = merge(page.toJSON(), json);
    const views = [];
    for (const detailView of detail.views) {
      if (typeof detailView === 'string') {
        views.push({
          name: detailView,
          width: '100%',
        });
      } else if (typeof detailView === 'object') {
        if (detailView.view) {
          const { view: v, ...others } = detailView;
          views.push(merge(v, others));
        } else {
          views.push(detailView);
        }
      }
    }
    detail.views = views;
    details.push(detail);
  }
  const data: any = {
    ...viewData,
    details,
    actions,
    fields,
  };
  if (associationField) {
    data.associationField = associationField;
  }
  if (data.type === 'association') {
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
    data.rowKey = data.rowKey || Collection.primaryKeyAttribute;
    if (associatedName) {
      data.resourceName = `${associatedName}.${resourceName}`;
    } else {
      data.resourceName = collectionName;
    }
    data.appends = data.fields.filter(field => {
      return ['hasMany', 'hasOne', 'belongsToMany', 'belongsTo'].includes(field.type);
    }).map(field => field.name);
  }
  delete data['resourceKey'];
  delete data['associatedKey'];
  for (const [key, value] of Object.entries(viewData[`x-${view.type}-props`]||{})) {
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

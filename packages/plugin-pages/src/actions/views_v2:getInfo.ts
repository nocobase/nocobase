import { ResourceOptions } from '@nocobase/resourcer';
import { Model, ModelCtor } from '@nocobase/database';
import actions from '@nocobase/actions';

export const getInfo = async (ctx: actions.Context, next) => {
  const { resourceKey } = ctx.action.params;
  const View = ctx.db.getModel('views_v2') as ModelCtor<Model>;
  const Page = ctx.db.getModel('pages_v2') as ModelCtor<Model>;
  const Field = ctx.db.getModel('fields') as ModelCtor<Model>;
  let primaryKey: string;
  let viewName: string;
  let collectionName: string;
  let associatedName: string;
  if (resourceKey.includes('.')) {
    const keys = resourceKey.split('.');
    viewName = keys.pop();
    const [key1, key2] = keys;
    if (key2) {
      const field = ctx.db.getTable(key1).getField(key2);
      collectionName = field.options.target;
      associatedName = key1;
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
  
  const Collection = ctx.db.getModel(collectionName) as ModelCtor<Model>;
  // const items = await view.getPages(Page.parseApiJson({
  //   sort: ['sort'],
  // }));
  // const pages = [];
  // for (const item of items) {
  //   const page = await Page.findByPk(item.page_id);
  //   pages.push(page);
  // }
  const columns = await Field.findAll(Field.parseApiJson({
    filter: {
      collection_name: view.collection_name,
      'name.in': view.get('fields')||[],
    },
    sort: ['sort'],
  }));
  const actions = [];
  if (view.get('actions')) {
    for (const action of view.get('actions')) {
      if (action.viewName) {
        action.viewName = `${view.collection_name}.${action.viewName}`;
      }
      actions.push({
        ...action,
      })
    }
  }
  const pages = [];
  for (const pageName of view.get('pages')||[]) {
    const page = await Page.findOne({
      where: {
        collection_name: view.collection_name,
        name: pageName,
      }
    });
    pages.push(page);
  }
  console.log({view,
    'name.in': view.get('fields')||[],
    columns, resourceKey, primaryKey, collectionName, viewName});
  const data: any = {
    ...view.toJSON(),
    pages,
    actions,
    fields: columns.map(column => {
      column.setDataValue('dataIndex', column.name.split('.'));
      return column;
    }),
  };
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
        action.viewName = `${collectionName}.${action.viewName}`;
      }
      return action;
    });
    ctx.body = {
      ...(ctx.body as any),
      targetField: field,
      resourceName,
      actions,
    }
    return next();
  } else {
    data.rowKey = Collection.primaryKeyAttribute;
    if (associatedName) {
      data.resourceName = `${associatedName}.${collectionName}`;
    } else {
      data.resourceName = collectionName;
    }
  }
  ctx.body = data;
  await next();
};

export default getInfo;

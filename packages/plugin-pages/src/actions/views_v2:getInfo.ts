import { ResourceOptions } from '@nocobase/resourcer';
import { Model, ModelCtor } from '@nocobase/database';

export default async (ctx, next) => {
  const { resourceName, resourceKey } = ctx.action.params;
  const View = ctx.db.getModel('views_v2') as ModelCtor<Model>;
  const Page = ctx.db.getModel('pages_v2') as ModelCtor<Model>;
  const Field = ctx.db.getModel('fields') as ModelCtor<Model>;
  let primaryKey: any;
  let viewName: any;
  let collectionName: any;
  if (resourceKey.includes('.')) {
    const [ key1, key2 ] = resourceKey.split('.');
    collectionName = key1;
    viewName = key2;
  } else {
    primaryKey = resourceKey;
  }
  const view = await View.findOne({
    where: primaryKey ? {
      id: primaryKey,
    } : {
      name: viewName,
      collection_name: collectionName,
    }
  });
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
    // const targetFieldName = view.get('targetFieldName');
    // const targetViewName = view.get('targetViewName');
    const field = await Field.findOne({
      where: {
        name: data.targetFieldName,
        collection_name: collectionName,
      }
    });
    data.targetField = field;
    data.targetViewName = `${field.get('target')}.${data.targetViewName}`;
  }
  ctx.body = data;
  await next();
};

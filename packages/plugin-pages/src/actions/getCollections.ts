import { Model, ModelCtor } from '@nocobase/database';
import _ from 'lodash';

async function getPageTitle(ctx, {resourceName, resourceKey}) {
  // const { resourceName, resourceKey } = ctx.action.params;
  const M = ctx.db.getModel(resourceName) as ModelCtor<Model>;
  const model = await M.findByPk(resourceKey);
  const Field = ctx.db.getModel('fields') as ModelCtor<Model>;
  const field = await Field.findOne({
    where: {
      collection_name: resourceName,
      type: 'string',
    },
    order: [['sort', 'asc']],
  });
  return field ? (model.get(field.get('name')) || `#${model.get(M.primaryKeyAttribute)} 无标题`) : model.get(M.primaryKeyAttribute);
};


async function getCollection(ctx, resourceName) {
  const [Collection, Field, Tab, View] = ctx.db.getModels(['collections', 'fields', 'tabs', 'views']) as ModelCtor<Model>[];
  const collection = await Collection.findOne(Collection.parseApiJson({
    filter: {
      name: resourceName,
    },
  }));
  const permissions = (await ctx.ac.isRoot() || collection.developerMode || collection.internal) 
    ? await ctx.ac.can(resourceName).getRootPermissions()
    : await ctx.ac.can(resourceName).permissions();
  const defaultView = await collection.getViews({
    where: {
      default: true,
    },
    limit: 1,
    plain: true,
  });
  collection.setDataValue('defaultViewName', defaultView.get('name'));
  const options = Tab.parseApiJson({
    filter: ctx.state.developerMode ? {
      'id.in': permissions.tabs,
      enabled: true,
    } : {
      'id.in': permissions.tabs,
      enabled: true,
      developerMode: {'$isFalsy': true},
    },
    fields: {
      appends: ['associationField'],
    },
    sort: ['sort'],
  });
  const tabs = await collection.getTabs(options) as Model[];
  const tabItems = [];
  for (const tab of tabs) {
    const itemTab = {
      ...tab.get(),
    };
    if (itemTab.type === 'details' && !itemTab.viewName) {
      itemTab.viewName = 'details';
    }
    // if (itemTab.type == 'association') {
    //   itemTab.field = await collection.getFields({
    //     where: {
    //       name: itemTab.association,
    //     },
    //     limit: 1,
    //     plain: true,
    //   });
    // }
    tabItems.push(itemTab);
  }
  return {
    ...collection.toJSON(),
    tabs: tabItems,
  };
}

export default async (ctx, next) => {
  const { resourceName, values = {} } = ctx.action.params;
  const { tabs: items = [] } = values;
  // console.log({items})
  const collection = await getCollection(ctx, resourceName);

  ctx.body = [
    collection,
  ];

  const lastItem = items.pop();

  for (const item of items) {
    const lastCollection = ctx.body[ctx.body.length-1];
    lastCollection.pageTitle = await getPageTitle(ctx, {resourceName: lastCollection.name, resourceKey: item.itemId});
    const activeTab = _.find(lastCollection.tabs, tab => tab.name == item.tabName)||{};
    if (activeTab && activeTab.type === 'association') {
      // console.log(activeTab.associationField.target);
      const nextCollection = await getCollection(ctx, activeTab.associationField.target);
      ctx.body.push(nextCollection);
    }
  }

  const lastCollection = ctx.body[ctx.body.length-1];
  lastCollection.pageTitle = await getPageTitle(ctx, {resourceName: lastCollection.name, resourceKey: lastItem.itemId});

  await next();
}

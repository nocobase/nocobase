import { Model, ModelCtor } from '@nocobase/database';

export default async (ctx, next) => {
  const { resourceName, resourceKey } = ctx.action.params;
  const [Collection, Field, Tab, View] = ctx.db.getModels(['collections', 'fields', 'tabs', 'views']) as ModelCtor<Model>[];
  const collection = await Collection.findOne(Collection.parseApiJson({
    filter: {
      name: resourceName,
    },
  }));
  const defaultView = await collection.getViews({
    where: {
      default: true,
    },
    limit: 1,
    plain: true,
  });
  collection.setDataValue('defaultViewName', defaultView.get('name'));
  const options = Tab.parseApiJson({
    filter: {
      enabled: true,
      developerMode: ctx.state.developerMode,
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
  ctx.body = {
    ...collection.toJSON(),
    tabs: tabItems,
  };
  await next();
}

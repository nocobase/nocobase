import { Model, ModelCtor } from '@nocobase/database';
import { ResourceOptions } from '@nocobase/resourcer';
import { get } from 'lodash';

export default async (ctx, next) => {
  const { resourceName, resourceKey } = ctx.action.params;
  const [Collection, Field, Tab, View] = ctx.db.getModels(['collections', 'fields', 'tabs', 'views']) as ModelCtor<Model>[];
  const collection = await Collection.findOne(Collection.parseApiJson({
    filter: {
      name: resourceName,
    },
    // fields: {
    //   // appends: ['tabs'],
    // },
  }));
  const views = await collection.getViews({
    where: {
      default: true,
    },
  });
  collection.setDataValue('defaultViewId', get(views, [0, 'id']));
  collection.setDataValue('defaultViewName', get(views, [0, 'name']));
  const tabs = await collection.getTabs({
    where: {
      developerMode: ctx.state.developerMode,
    },
    order: [['sort', 'asc']],
  }) as Model[];
  const tabItems = [];
  for (const tab of tabs) {
    const itemTab = {
      ...tab.toJSON(),
      ...tab.options,
    };
    if (itemTab.type == 'association') {
      const field = await Field.findOne({
        where: {
          collection_name: itemTab.collection_name,
          name: itemTab.association,
        },
      });
      itemTab.field = field ? {
        ...field.toJSON(),
        ...field.options,
      } : {};
      itemTab.viewCollectionName = itemTab.association;
    } else {
      itemTab.viewCollectionName = itemTab.collection_name;
    }
    tabItems.push(itemTab);
  }
  ctx.body = {
    ...collection.toJSON(),
    tabs: tabItems,
  };
  await next();
}

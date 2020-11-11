import { Model, ModelCtor } from '@nocobase/database';
import { ResourceOptions } from '@nocobase/resourcer';
import { get } from 'lodash';

export default async (ctx, next) => {
  const { resourceName, resourceKey } = ctx.action.params;
  const [Collection, Tab, View] = ctx.db.getModels(['collections', 'tabs', 'views']) as ModelCtor<Model>[];
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
  const tabs = await collection.getTabs();
  ctx.body = {
    ...collection.toJSON(),
    tabs: tabs.map(tab => ({
      ...tab.toJSON(),
      ...tab.options,
      viewCollectionName: tab.type == 'association' ? tab.options.association : tab.collection_name,
    })),
  };
  await next();
}

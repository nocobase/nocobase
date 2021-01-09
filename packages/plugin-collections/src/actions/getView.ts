import { ResourceOptions } from '@nocobase/resourcer';
import { Model, ModelCtor } from '@nocobase/database';
import { get } from 'lodash';

export default async (ctx, next) => {
  const { resourceName, resourceKey } = ctx.action.params;
  const [View, Field, Action] = ctx.db.getModels(['views', 'fields', 'actions']) as ModelCtor<Model>[];
  const view = await View.findOne(View.parseApiJson({
    filter: {
      collection_name: resourceName,
      name: resourceKey,
    },
    fields: {
      appends: ['actions', 'fields'],
    },
  }));
  const collection = await view.getCollection();
  const fields = await collection.getFields();
  const actions = await collection.getActions();
  const actionNames = view.options.actionNames||[];
  // console.log(view.options);
  if (view.type === 'table') {
    const defaultTabs = await collection.getTabs({
      where: {
        default: true,
      },
    });
    view.setDataValue('defaultTabName', get(defaultTabs, [0, 'name']));
  }
  if (view.options.updateViewId) {
    view.setDataValue('rowViewName', view.options.updateViewName);
  }
  view.setDataValue('viewCollectionName', view.collection_name);
  ctx.body = {
    ...view.toJSON(),
    ...(view.options||{}),
    fields,
    actions: actions.filter(action => actionNames.includes(action.name)).map(action => ({
      ...action.toJSON(),
      ...action.options,
      viewCollectionName: action.collection_name,
    })),
  };
  await next();
};

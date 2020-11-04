import { ResourceOptions } from '@nocobase/resourcer';
import { Model, ModelCtor } from '@nocobase/database';
import { get } from 'lodash';

export default {
  name: 'views',
  actions: {
    get: {
      handler: async (ctx, next) => {
        const { resourceKey } = ctx.action.params;
        const [View, Field, Action] = ctx.db.getModels(['views', 'fields', 'actions']) as ModelCtor<Model>[];
        const view = await View.findOne(View.parseApiJson({
          filter: {
            id: resourceKey,
          },
          fields: {
            appends: ['actions', 'fields'],
          },
        }));
        const collection = await view.getCollection();
        const fields = await collection.getFields();
        const actions = await collection.getActions();
        const actionNames = view.options.actionNames||[];
        console.log(view.options);
        if (view.type === 'table') {
          const defaultTabs = await collection.getTabs({
            where: {
              default: true,
            },
          });
          view.setDataValue('defaultTabId', get(defaultTabs, [0, 'id']));
        }
        if (view.options.updateViewId) {
          view.setDataValue('rowViewId', view.options.updateViewId);
        }
        ctx.body = {
          ...view.toJSON(),
          ...(view.options||{}),
          fields,
          actions: actions.filter(action => actionNames.includes(action.name)).map(action => ({
            ...action.toJSON(),
            ...action.options,
          })),
        };
        await next();
      }
    },
  },
} as ResourceOptions;

import { Model, ModelCtor } from '@nocobase/database';
import { ResourceOptions } from '@nocobase/resourcer';
import { get } from 'lodash';

export default {
  name: 'collections',
  actions: {
    get: {
      handler: async (ctx, next) => {
        const { resourceName, resourceKey } = ctx.action.params;
        const [Collection, Tab, View] = ctx.db.getModels(['collections', 'tabs', 'views']) as ModelCtor<Model>[];
        const collection = await Collection.findOne(Collection.parseApiJson({
          filter: {
            name: resourceKey,
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
        // ctx.body = {
        //   title: '数据表配置',
        //   defaultViewId: 1,
        //   defaultTabId: 1,
        //   tabs: [
        //     {
        //       id: 1,
        //       title: '详情',
        //       viewId: 11,
        //     },
        //     {
        //       id: 2,
        //       title: '相关数据',
        //       viewId: 22,
        //     },
        //     {
        //       id: 3,
        //       title: '动态',
        //       viewId: 33,
        //     },
        //   ],
        // }
        const tabs = await collection.getTabs();
        ctx.body = {
          ...collection.toJSON(),
          tabs: tabs.map(tab => ({
            ...tab.toJSON(),
            ...tab.options,
          })),
        };
        await next();
      }
    },
  },
} as ResourceOptions;

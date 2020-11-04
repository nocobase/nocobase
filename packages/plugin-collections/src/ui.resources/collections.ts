import { Model, ModelCtor } from '@nocobase/database';
import { ResourceOptions } from '@nocobase/resourcer';

export default {
  name: 'collections',
  actions: {
    get: {
      handler: async (ctx, next) => {
        const { resourceName, resourceKey } = ctx.action.params;
        console.log({resourceName, resourceKey});
        const Collection: ModelCtor<Model> = ctx.db.getModel(resourceName);
        const collection = await Collection.findOne(Collection.parseApiJson({
          filter: {
            name: resourceKey,
          },
          fields: {
            appends: ['tabs'],
          },
        }));
        collection.setDataValue('defaultViewId', 1);
        collection.setDataValue('defaultTabId', 1);
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
        ctx.body = collection;
        await next();
      }
    },
  },
} as ResourceOptions;

import { ResourceOptions } from '@nocobase/resourcer';

export default {
  name: 'collections',
  actions: {
    get: {
      handler: async (ctx, next) => {
        ctx.body = {
          title: '数据表配置',
          defaultViewId: 1,
          defaultTabId: 1,
          tabs: [
            {
              id: 1,
              title: '详情',
              viewId: 11,
            },
            {
              id: 2,
              title: '相关数据',
              viewId: 22,
            },
            {
              id: 3,
              title: '动态',
              viewId: 33,
            },
          ],
        }
        await next();
      }
    },
  },
} as ResourceOptions;

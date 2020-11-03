import { ResourceOptions } from '@nocobase/resourcer';

export default {
  name: 'views',
  actions: {
    get: {
      handler: async (ctx, next) => {
        const { resourceKey } = ctx.action.params;
        if (resourceKey == '11') {
          ctx.body = {
            title: '详情',
            type: 'Details',
            fields: [],
            actions: [],
            defaultTabId: 1,
          }
        } else if (resourceKey == '22') {
          ctx.body = {
            title: '相关数据',
            type: 'Table',
            fields: [],
            actions: [],
            defaultTabId: 1,
          }
        } else if (resourceKey == '33') {
          ctx.body = {
            title: '表单',
            type: 'Form',
            fields: [],
            actions: [],
            defaultTabId: 1,
          }
        } else {
          ctx.body = {
            title: '视图1',
            type: 'Table',
            fields: [],
            actions: [],
            defaultTabId: 1,
          }
        }
        await next();
      }
    },
  },
} as ResourceOptions;

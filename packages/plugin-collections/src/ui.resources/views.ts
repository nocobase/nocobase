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
            actions: [
              {
                id: 1,
                type: 'edit',
                title: '编辑',
                viewId: 44,
              },
            ],
            template: 'Details',
            defaultTabId: 1,
          }
        } else if (resourceKey == '22') {
          ctx.body = {
            title: '相关数据',
            type: 'Table',
            fields: [],
            template: 'Table',
            defaultTabId: 1,
            actions: [
              {
                id: 3,
                type: 'create',
                title: '创建',
                viewId: 44,
              },
            ],
          }
        } else if (resourceKey == '33') {
          ctx.body = {
            title: '表单',
            type: 'Form',
            fields: [],
            actions: [],
            template: 'Form',
            defaultTabId: 1,
          }
        } else if (resourceKey == '44') {
          ctx.body = {
            title: '表单',
            type: 'Form',
            fields: [],
            actions: [],
            template: 'DrawerForm',
            defaultTabId: 1,
          }
        } else {
          ctx.body = {
            title: '视图1',
            type: 'Table',
            fields: [],
            template: 'Table',
            defaultTabId: 1,
            actions: [
              {
                id: 3,
                type: 'create',
                title: '创建',
                viewId: 44,
              },
            ],
          }
        }
        await next();
      }
    },
  },
} as ResourceOptions;

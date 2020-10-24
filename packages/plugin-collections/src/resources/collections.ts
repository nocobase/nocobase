import { ResourceOptions } from '@nocobase/resourcer';

export default {
  name: 'collections',
  actions: {
    list: {
      fields: {
        appends: ['fields'],
      }
    },
    get: {
      fields: {
        appends: ['fields'],
      }
    },
    // get: {
    //   handler: async (ctx, next) => {
    //     ctx.body = {
    //       get: {}
    //     }
    //     await next();
    //   }
    // },
  },
} as ResourceOptions;

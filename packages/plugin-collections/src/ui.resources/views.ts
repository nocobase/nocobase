import { ResourceOptions } from '@nocobase/resourcer';

export default {
  name: 'views',
  actions: {
    get: {
      handler: async (ctx, next) => {
        ctx.body = {
          get: {}
        }
        await next();
      }
    },
  },
} as ResourceOptions;

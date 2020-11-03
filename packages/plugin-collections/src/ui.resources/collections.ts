import { ResourceOptions } from '@nocobase/resourcer';

export default {
  name: 'collections',
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

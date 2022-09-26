import path from 'path';

import { InstallOptions, Plugin } from '@nocobase/server';

export class ShopPlugin extends Plugin {
  getName(): string {
    return this.getPackageName(__dirname);
  }

  beforeLoad() {
    // TODO
  }

  async load() {
    await this.db.import({
      directory: path.resolve(__dirname, 'collections'),
    });

    this.app.resource({
      name: 'orders',
      actions: {
        create: {
          blacklist: ['id', 'totalPrice', 'status', 'createdAt', 'updatedAt'],
          values: {
            status: 0
          },
          middlewares: [
            async (ctx, next) => {
              const { productId } = ctx.action.params.values;

              const product = await ctx.db.getRepository('products').findOne({
                filterByTk: productId,
                filter: {
                  enabled: 1,
                  inventory: {
                    $gt: 0
                  }
                }
              });

              if (!product) {
                return ctx.throw(404);
              }

              await next();
            }
          ]
        },
        list: {
          filter: {
            // 由 users 插件扩展的过滤器运算符
            $isCurrentUser: true,
            status: {
              $ne: -1
            }
          },
          fields: ['id', 'status', 'createdAt', 'updatedAt']
        },
        async deliver(ctx, next) {
          const { resourceIndex } = ctx.action.params;
          const orderRepo = ctx.db.getRepository('orders');

          const [order] = await orderRepo.update({
            filterByTk: resourceIndex,
            values: {
              status: 2,
              delivery: {
                ...ctx.action.params.values,
                status: 0
              }
            }
          });

          ctx.body = order;

          next();
        }
      }
    });

    this.app.acl.allow('products', '*');
    this.app.acl.allow('categories', '*');
    this.app.acl.allow('orders', '*');
  }

  async install(options: InstallOptions) {
    // TODO
  }
}

export default ShopPlugin;

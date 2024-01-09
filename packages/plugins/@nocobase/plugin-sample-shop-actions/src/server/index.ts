import path from 'path';

import { InstallOptions, Plugin } from '@nocobase/server';

export class ShopPlugin extends Plugin {
  beforeLoad() {
    // TODO
  }

  async load() {
    await this.importCollections(path.resolve(__dirname, 'collections'));

    this.app.resource({
      name: 'orders',
      actions: {
        create: {
          blacklist: ['id', 'totalPrice', 'status', 'createdAt', 'updatedAt'],
          values: {
            status: 0,
          },
          middlewares: [
            async (ctx, next) => {
              const { productId } = ctx.action.params.values;

              const product = await ctx.db.getRepository('products').findOne({
                filterByTk: productId,
                filter: {
                  enabled: true,
                  inventory: {
                    $gt: 0,
                  },
                },
              });

              if (!product) {
                return ctx.throw(404);
              }

              ctx.state.product = product;

              await next();
            },
          ],
          async handler(ctx, next) {
            const { product } = ctx.state;
            const order = await ctx.db.getRepository('orders').create({
              values: {
                ...ctx.action.params.values,
                productId: product.id,
                quantity: 1,
                totalPrice: product.price,
              },
            });

            ctx.body = order;
          },
        },
        list: {
          filter: {
            // TODO: 该操作符已废弃，该处代码需要重构
            // 由 users 插件扩展的过滤器运算符
            $isCurrentUser: true,
            status: {
              $ne: -1,
            },
          },
          fields: ['id', 'status', 'createdAt', 'updatedAt'],
        },
        async deliver(ctx, next) {
          const { filterByTk } = ctx.action.params;
          const orderRepo = ctx.db.getRepository('orders');

          const [order] = await orderRepo.update({
            filterByTk,
            values: {
              status: 2,
              delivery: {
                ...ctx.action.params.values,
                status: 0,
              },
            },
          });
          order.delivery = await order.getDelivery();

          ctx.body = order;

          next();
        },
      },
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

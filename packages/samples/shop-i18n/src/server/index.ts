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
      name: 'order',
      actions: {
        async create(ctx, next) {
          const productRepo = ctx.db.getRepository('products');
          const product = await productRepo.findOne({
            filterByTk: ctx.action.params.filterByTk
          });

          if (!product) {
            return ctx.throw(404, ctx.t('No such product'));
          }

          if (!product.enabled) {
            return ctx.throw(400, ctx.t('Product not on sale'));
          }

          if (!product.inventory) {
            return ctx.throw(400, ctx.t('Out of stock'));
          }

          const orderRepo = ctx.db.getRepository('orders');
          ctx.body = await orderRepo.create({
            values: {
              productId: product.id,
              quantity: 1,
              totalPrice: product.price,
              userId: ctx.state.currentUser.id
            }
          });

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

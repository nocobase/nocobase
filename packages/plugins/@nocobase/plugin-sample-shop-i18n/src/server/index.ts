import path from 'path';

import { InstallOptions, Plugin } from '@nocobase/server';

import zhCN from './locales/zh-CN';

const ns = '@nocobase/plugin-sample-shop-i18n';

export class ShopPlugin extends Plugin {
  beforeLoad() {
    // TODO
  }

  async load() {
    await this.importCollections(path.resolve(__dirname, 'collections'));

    this.app.i18n.addResources('zh-CN', ns, zhCN);

    this.app.resource({
      name: 'orders',
      actions: {
        async create(ctx, next) {
          const productRepo = ctx.db.getRepository('products');
          const product = await productRepo.findById(ctx.action.params.values.productId);

          if (!product) {
            return ctx.throw(404, ctx.t('No such product', { ns }));
          }

          if (!product.enabled) {
            return ctx.throw(400, ctx.t('Product not on sale', { ns }));
          }

          if (!product.inventory) {
            return ctx.throw(400, ctx.t('Out of stock', { ns }));
          }

          const orderRepo = ctx.db.getRepository('orders');
          ctx.body = await orderRepo.create({
            values: {
              productId: product.id,
              quantity: 1,
              totalPrice: product.price,
              userId: ctx.state.currentUser.id,
            },
          });

          next();
        },
      },
    });

    this.app.acl.allow('products', '*');
    this.app.acl.allow('categories', '*');
    this.app.acl.allow('orders', '*');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async install(options: InstallOptions) {
    // TODO
  }
}

export default ShopPlugin;

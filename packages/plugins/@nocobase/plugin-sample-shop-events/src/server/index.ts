import path from 'path';

import { InstallOptions, Plugin } from '@nocobase/server';

export class ShopPlugin extends Plugin {
  timer = null;
  orderReceiveExpires = 86400 * 7;

  checkOrder = async () => {
    const expiredDate = new Date(Date.now() - this.orderReceiveExpires);
    const deliveryRepo = this.db.getRepository('deliveries');
    const expiredDeliveries = await deliveryRepo.find({
      fields: ['id', 'orderId'],
      filter: {
        status: 0,
        createdAt: {
          $lt: expiredDate,
        },
      },
    });
    await deliveryRepo.update({
      filter: {
        id: expiredDeliveries.map((item) => item.get('id')),
      },
      values: {
        status: 1,
      },
    });
    const orderRepo = this.db.getRepository('orders');
    const [updated] = await orderRepo.update({
      filter: {
        status: 2,
        id: expiredDeliveries.map((item) => item.get('orderId')),
      },
      values: {
        status: 3,
      },
    });

    console.log('%d orders expired', updated);
  };

  beforeLoad() {
    // TODO
  }

  async load() {
    await this.importCollections(path.resolve(__dirname, 'collections'));

    this.db.on('orders.afterCreate', async (order, options) => {
      const product = await order.getProduct({
        transaction: options.transaction,
      });

      await product.update(
        {
          inventory: product.inventory - order.quantity,
        },
        {
          transaction: options.transaction,
        },
      );
    });

    this.app.on('beforeStart', () => {
      // 每分钟执行一次
      this.timer = setInterval(this.checkOrder, 1000 * 60);
    });

    this.app.on('beforeStop', () => {
      clearInterval(this.timer);
      this.timer = null;
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

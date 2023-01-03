# Events

NocoBase provides a very large number of event listeners in the lifecycle of applications, plugins, and database, and these methods will only be executed when an event is triggered.

## How to add event listeners?

The registration of events is usually placed in afterAdd or beforeLoad

```ts
export class MyPlugin extends Plugin {
  // After the plugin is added, afterAdd() is executed with or without activation
  afterAdd() {
    this.app.on();
    this.db.on();
  }

  // beforeLoad() will only be executed after the plugin is activated
  beforeLoad() {
    this.app.on();
    this.db.on();
  }
}
```

### `db.on`

Database related events are related to Collection configuration, CRUD of Repository, including:

- 'beforeSync' / 'afterSync'
- 'beforeValidate' / 'afterValidate'
- 'beforeCreate' / 'afterCreate'
- 'beforeUpdate' / 'afterUpdate'
- 'beforeSave' / 'afterSave'
- 'beforeDestroy' / 'afterDestroy'
- 'afterCreateWithAssociations'
- 'afterUpdateWithAssociations'
- 'afterSaveWithAssociations'
- 'beforeDefineCollection'
- 'afterDefineCollection'
- 'beforeRemoveCollection' / 'afterRemoveCollection'

See [Database API](/api/database) for more details.

### `app.on()`

The app's events are related to the application's lifecycle, and the relevant events are:

- 'beforeLoad' / 'afterLoad'
- 'beforeInstall' / 'afterInstall'
- 'beforeUpgrade' / 'afterUpgrade'
- 'beforeStart' / 'afterStart'
- 'beforeStop' / 'afterStop'
- 'beforeDestroy' / 'afterDestroy'

Refer to [Application API](/api/server/application#Events) for more details.

## Example

Let's continue with a simple online store as an example, the related collections modeling can be reviewed in the [Collections and Fields](/development/) section for examples.

### Deducting product inventory after creating an order

Usually we have different collections for products and orders. The problem of overselling can be solved by subtracting the inventory of the item after the customer has placed the order. At this point we can define the corresponding event for the action of Creating Order and solve the inventory modification problem at this time together with:

```ts
class ShopPlugin extends Plugin {
  beforeLoad() {
    this.db.on('orders.afterCreate', async (order, options) => {
      const product = await order.getProduct({
        transaction: options.transaction
      });

      await product.update({
        inventory: product.inventory - order.quantity
      }, {
        transaction: options.transaction
      });
    });
  }
}
```

Since the default Sequelize event carries information about the transaction, we can use transaction directly to ensure that both data actions are performed in the same transaction.

Similarly, you can change the order status to shipped after creating the shipping record: ```ts

```ts
class ShopPlugin extends Plugin {
  load() {
    this.db.on('deliveries.afterCreate', async (delivery, options) => {
      const orderRepo = this.db.getRepository('orders');
      await orderRepo.update({
        filterByTk: delivery.orderId,
        value: {
          status: 2
        }
        transaction: options.transaction
      });
    });
  }
}
```

### Timed tasks that exist alongside the application

Without considering complex cases such as using workflow plugins, we can also implement a simple timed task mechanism via application-level events, and it can be bound to the application's process and stop when it exits. For example, if we want to scan all orders at regular intervals and automatically sign them after the sign-off time.

```ts
class ShopPlugin extends Plugin {
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
          $lt: expiredDate
        }
      }
    });
    await deliveryRepo.update({
      filter: {
        id: expiredDeliveries.map(item => item.get('id')),
      },
      values: {
        status: 1
      }
    });
    const orderRepo = this.db.getRepository('orders');
    const [updated] = await orderRepo.update({
      filter: {
        status: 2,
        id: expiredDeliveries.map(item => item.get('orderId'))
      },
      values: {
        status: 3
      }
    });

    console.log('%d orders expired', updated);
  };

  load() {
    this.app.on('beforeStart', () => {
      // execute every minute
      this.timer = setInterval(this.checkOrder, 1000 * 60);
    });

    this.app.on('beforeStop', () => {
      clearInterval(this.timer);
      this.timer = null;
    });
  }
}
```

## Summary

The above example gives us a basic understanding of what events do and the ways they can be used to extend.

* Database related events
* Application related events

The sample code covered in this chapter is integrated in the corresponding package [packages/samples/shop-events](https://github.com/nocobase/nocobase/tree/main/packages/samples/shop-events), which can be run directly in run locally to see the results.

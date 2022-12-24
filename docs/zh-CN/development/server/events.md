# 事件

NocoBase 在应用、插件、数据库的生命周期中提供了非常多的事件监听，这些方法只有在触发了事件之后才会执行。

## 如何添加事件监听？

事件的注册一般放于 afterAdd 或 beforeLoad 中

```ts
export class MyPlugin extends Plugin {
  // 插件添加进来之后，有没有激活都执行 afterAdd()
  afterAdd() {
    this.app.on();
    this.db.on();
  }

  // 只有插件激活之后才会执行 beforeLoad()
  beforeLoad() {
    this.app.on();
    this.db.on();
  }
}
```

### `db.on`

数据库相关事件与 Collection 配置、Repository 的 CRUD 相关，包括：

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
- 'beforeRemoveCollection' / 'afterRemoveCollection

更多详情参考 [Database API](/api/database#内置事件)。

### `app.on()`

app 的事件与应用的生命周期相关，相关事件有：

- 'beforeLoad' / 'afterLoad'
- 'beforeInstall' / 'afterInstall'
- 'beforeUpgrade' / 'afterUpgrade'
- 'beforeStart' / 'afterStart'
- 'beforeStop' / 'afterStop'
- 'beforeDestroy' / 'afterDestroy'

更多详情参考 [Application API](/api/server/application#事件)。

## 示例

我们继续以简单的在线商店来举例，相关的数据表建模可以回顾 [数据表和字段](/development/) 部分的示例。

### 创建订单后减商品库存

通常我们的商品和订单是不同的数据表。客户在下单以后把商品的库存减掉可以解决超卖的问题。这时候我们可以针对创建订单这个数据操作定义相应的事件，在这个时机一并解决库存修改的问题：

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

因为默认 Sequelize 的事件中就携带事务等信息，所以我们可以直接使用 transaction 以保证两个数据操作都在同一事务中进行。

同样的，也可以在创建发货记录后修改订单状态为已发货：

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

### 随应用同时存在的定时任务

在不考虑使用工作流插件等复杂情况下，我们也可以通过应用级的事件实现一个简单的定时任务机制，且可以与应用的进程绑定，退出后就停止。比如我们希望定时扫描所有订单，超过签收时间后自动签收：

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
      // 每分钟执行一次
      this.timer = setInterval(this.checkOrder, 1000 * 60);
    });

    this.app.on('beforeStop', () => {
      clearInterval(this.timer);
      this.timer = null;
    });
  }
}
```

## 小结

通过上面的示例，我们基本了解了事件的作用和可以用于扩展的方式：

* 数据库相关的事件
* 应用相关的事件

本章涉及的示例代码整合在对应的包 [packages/samples/shop-events](https://github.com/nocobase/nocobase/tree/main/packages/samples/shop-events) 中，可以直接在本地运行，查看效果。

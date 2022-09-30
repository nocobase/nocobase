# Hooks

Hooks 和事件在很多插件化可扩展的框架和系统中都有应用，比如著名的 Wordpress，是比较广泛的对生命周期支持扩展的机制。

## 基础概念

NocoBase 在应用生命周期中提供了一些钩子，以便在运行中的一些特殊时期根据需要进行扩展开发。

### 数据库 hooks

主要通过 `db.on()` 的方法定义，大部分事件兼容 Sequelize 原生的事件类型。例如需要在某张数据表创建一条数据后做一些事情时，可以使用 `<collectionName>.afterCreate` 事件：

```ts
// posts 表创建数据完成时触发
db.on('posts.afterCreate', async (post, options) => {
  console.log(post);
});
```

由于 Sequelize 默认的单条数据创建成功触发的时间点上并未完成与该条数据所有关联数据的处理，所以 NocoBase 针对默认封装的 Repository 数据仓库类完成数据创建和更新操作时，扩展了几个额外的事件，代表关联数据被一并操作完成：

```ts
// 已创建且已根据创建数据完成关联数据创建或更新完成时触发
db.on('posts.afterCreateWithAssociations', async (post, options) => {
  console.log(post);
});
```

与 Sequelize 同样的也可以针对全局的数据处理都定义特定的事件：

```ts
// 每张表创建数据完成都触发
db.on('beforeCreate', async (model, options) => {
  console.log(model);
});
```

针对特殊的生命周期比如定义数据表等，NocoBase 也扩展了相应事件：

```ts
// 定义任意数据表之前触发
db.on('beforeDefineCollection', (collection) => {
  collection.options.tableName = 'somePrefix' + collection.options.tableName;
});
```

其他所有可用的数据库事件类型可以参考 [Database API](/api/database#on)。

### 应用级 hooks

在某些特殊需求时，会需要在应用的外层生命周期中定义事件进行扩展，比如当应用启动前做一些准备操作，当应用停止前做一些清理操作等：

```ts
app.on('beforeStart', async () => {
  console.log('app is starting...');
});

app.on('beforeStop', async () => {
  console.log('app is stopping...');
});
```

其他所有可用的应用级事件类型可以参考 [Application API](/api/server/application#事件)。

## 示例

我们继续以简单的在线商店来举例，相关的数据表建模可以回顾 [数据表和字段](/development/) 部分的示例。

### 创建订单后减商品库存

通常我们的商品和订单是不同的数据表，而客户在下单以后把商品的库存减掉可以解决超卖的问题，这时候我们可以针对创建订单这个数据操作定义相应的事件，在这个时机一并解决库存修改的问题：

```ts
class ShopPlugin extends Plugin {
  load() {
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

在不考虑使用工作流插件等复杂情况下，我们也可以通过应用级的 hooks 实现一个简单的定时任务机制，且可以与应用的进程绑定，退出后就停止。比如我们希望定时扫描所有订单，超过签收时间后自动签收：

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

通过上面的示例，我们基本了解了 hooks 的作用和可以用于扩展的方式：

* 数据库相关的 hooks
* 应用相关的 hooks

本章涉及的示例代码整合在对应的包 [packages/samples/shop-hooks](https://github.com/nocobase/nocobase/tree/main/packages/samples/shop-hooks) 中，可以直接在本地运行，查看效果。

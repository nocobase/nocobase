# 测试

测试基于 [Jest](https://jestjs.io/) 测试框架。为了方便的编写测试，提供了 `mockDatabase()` 和 `mockServer()` 用于数据库和服务端应用的测试。

## `mockDatabase()`

默认提供一种完全隔离的 db 测试环境

```ts
import { mockDatabase } from '@nocobase/test';

describe('my db suite', () => {
  let db;

  beforeEach(async () => {
    db = mockDatabase();
    db.collection({
      name: 'posts',
      fields: [
        {
          type: 'string',
          name: 'title',
        }
      ]
    });
    await db.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  test('my case', async () => {
    const repository = db.getRepository('posts');
    const post = await repository.create({
      values: {
        title: 'hello'
      }
    });

    expect(post.get('title')).toEqual('hello');
  });
});
```

## `mockServer()`

提供模拟的服务端应用实例，对应的 app.db 为 `mockDatabase()` 实例，同时还提供了便捷的 `app.agent()` 用于测试 HTTP API，针对 NocoBase 的 Resource Action 还封装了 `app.agent().resource()` 用于测试资源的 Action。

```ts
import { mockServer } from '@nocobase/test';

class MyPlugin extends Plugin {

}

describe('my suite', () => {
  let app;
  let agent;

  beforeEach(async () => {
    app = mockServer();
    agent = app.agent();
    // 添加待注册的插件
    app.plugin(MyPlugin, { name: 'my-plugin' });
    // 加载配置
    app.load();
    // 清空数据库并安装
    app.install({ clean: true });
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('my case', async () => {
    await agent.resource('posts').create({
      values: {
        title: 'hello'
      }
    });
    await agent.get('/users:check').set({ Authorization: 'Bearer abc' });
  });
});
```

## 示例

我们以之前在 [资源与操作](development/server/resources-actions) 章节的功能为例，来写一个插件的测试：

```ts
import { mockServer } from '@nocobase/test';
import Plugin from '../../src/server';

describe('shop actions', () => {
  let app;
  let agent;
  let db;

  beforeEach(async () => {
    app = mockServer();
    app.plugin(Plugin);
    agent = app.agent();
    db = app.db;

    await app.load();
    await db.sync();
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('product order case', async () => {
    const { body: product } = await agent.resource('products').create({
      values: {
        title: 'iPhone 14 Pro',
        price: 7999,
        enabled: true,
        inventory: 1
      }
    });
    expect(product.data.price).toEqual(7999);

    const { body: order } = await agent.resource('orders').create({
      values: {
        productId: product.data.id
      }
    });
    expect(order.data.totalPrice).toEqual(7999);
    expect(order.data.status).toEqual(0);

    const { body: deliveredOrder } = await agent.resource('orders').deliver({
      filterByTk: order.data.id,
      values: {
        provider: 'SF',
        trackingNumber: '123456789'
      }
    });
    expect(deliveredOrder.data.status).toBe(2);
    expect(deliveredOrder.data.delivery.trackingNumber).toBe('123456789');
  });
});
```

编写完成后，在命令行中允许测试命令：

```bash
yarn test packages/samples/shop-actions
```

该测试将验证：

1. 商品可以创建成功；
2. 订单可以创建成功；
3. 订单可以发货成功；

当然这只是个最基本的例子，从业务上来说并不完善，但作为示例已经可以说明整个测试的流程。

## 小结

本章涉及的示例代码整合在对应的包 [packages/samples/shop-actions](https://github.com/nocobase/nocobase/tree/main/packages/samples/shop-actions) 中，可以直接在本地运行，查看效果。

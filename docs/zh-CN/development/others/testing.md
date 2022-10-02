# 单元测试

## 介绍

NocoBase 的测试基于 [Jest](https://jestjs.io/) 测试框架。同时，为了方便的编写测试，我们提供了两个工具类，在测试环境模拟正常的数据库和应用的服务端。

### MockDatabase

模拟数据库类继承自 [`Database`](/api/database) 类，大部分内容没有区别，主要在构造函数默认内置了随机表前缀，在每个测试用例初始化数据库时相关数据表都通过前缀名称与其他用例进行隔离，在运行测试用例时互不影响。

```ts
import { MockDatabase } from '@nocobase/test';

describe('my suite', () => {
  let db;

  beforeEach(async () => {
    db = new MockDatabase();

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

  test('my case', async () => {
    const postRepository = db.getRepository('posts');
    const p1 = await postRepository.create({
      values: {
        title: 'hello'
      }
    });

    expect(p1.get('title')).toEqual('hello');
  });
});
```

### MockServer

模拟服务器也继承自 [Application](/api/server/application) 类，除了内置的数据库实例是通过模拟数据库类生成的以外，还提供了比较方便的生成基于 [superagent](https://www.npmjs.com/package/superagent) 请求代理功能，针对从发送请求到获取响应的写法也集成了 `.resource('posts').create()`，比较简化。

```ts
import { mockServer } from '@nocobase/test';

describe('my suite', () => {
  let app;
  let agent;
  let db;

  beforeEach(async () => {
    app = mockServer();
    agent = app.agent();

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
    await app.load();
  });

  test('my case', async () => {
    const { body } = await agent.resource('posts').create({
      values: {
        title: 'hello'
      }
    });

    expect(body.data.title).toEqual('hello');
  });
});
```

## 示例

我们以之前在 [资源与操作](development/guide/resources-actions) 章节的功能为例，来写一个插件的测试：

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
      values: {
        orderId: order.data.id,
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

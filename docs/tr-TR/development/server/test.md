# Testing

The tests are based on the [Jest](https://jestjs.io/) framework. To facilitate writing tests, `mockDatabase()` and `mockServer()` are provided for database and server-side application testing.

## `mockDatabase()`

provides a fully isolated db testing environment by default

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

provides a mock server-side application instance, corresponding to app.db as a `mockDatabase()` instance, and also provides a convenient `app.agent()` for testing the HTTP API, and wraps `app.agent().resource()` for the Resource Action of NocoBase for testing the Action.

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
    // Add the plugins to be registered
    app.plugin(MyPlugin, { name: 'my-plugin' });
    // Load the configuration
    app.load();
    // Clear the database and install
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

## Example

Let's write a test of the plugin using in previous chapter [Resources and Actions](development/server/resources-actions) as an example.

```ts
import { mockServer } from '@nocobase/test';
import Plugin from '... /... /src/server';

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

Once finished, allow the test command on the command line:

```bash
yarn test packages/samples/shop-actions
```

This test will verify that:

1. products can be created successfully.
2. orders can be created successfully.
3. orders can be shipped successfully.

Of course this is just a minimal example, not perfect business-wise, but as an example it can already illustrate the whole testing process.

## Summary

The sample code covered in this chapter is integrated in the corresponding package [packages/samples/shop-actions](https://github.com/nocobase/nocobase/tree/main/packages/samples/shop-actions), which can be run directly locally to see the results.

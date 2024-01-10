import { createMockServer } from '@nocobase/test';

describe('shop actions', () => {
  let app;
  let agent;
  let db;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['sample-shop-actions'],
    });
    await app.runCommand('install', '-f');
    agent = app.agent();
    db = app.db;
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
        inventory: 1,
      },
    });

    expect(product.data.price).toEqual(7999);

    const { body: order } = await agent.resource('orders').create({
      values: {
        productId: product.data.id,
      },
    });
    expect(order.data.totalPrice).toEqual(7999);
    expect(order.data.status).toEqual(0);

    const { body: deliveredOrder } = await agent.resource('orders').deliver({
      filterByTk: order.data.id,
      values: {
        provider: 'SF',
        trackingNumber: '123456789',
      },
    });
    expect(deliveredOrder.data.status).toBe(2);
    expect(deliveredOrder.data.delivery.trackingNumber).toBe('123456789');
  });
});

// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  detailSelect,
  entities,
  repository,
  searchFilter,
} from '../client/model.js';
import { relationRepositories } from '../client/relation-mutations.js';
import { createFixture } from './helpers.js';

describe('Repository CRM and order API', () => {
  let f: Awaited<ReturnType<typeof createFixture>>;
  beforeEach(async () => {
    f = await createFixture();
  });
  afterEach(async () => {
    await f?.destroy();
  });
  it('runs all seven actions and relation selections through the HTTP client', async () => {
    const customers = repository(f.api, 'customers');
    const contacts = repository(f.api, 'contacts');
    const products = repository(f.api, 'products');
    const orders = repository(f.api, 'orders');
    const items = repository(f.api, 'items');
    await customers.createOne({
      values: {
        id: 'customer',
        name: 'Ada',
        company: 'Acme',
        email: 'ada@example.test',
        status: 'active',
      },
    });
    await contacts.createOne({
      values: {
        id: 'contact',
        name: 'Sales',
        email: 'sales@example.test',
        phone: '123',
        customer: { connect: { id: 'customer' } },
      },
    });
    await products.createOne({
      values: {
        id: 'product',
        sku: 'SKU-1',
        name: 'Keyboard',
        unitPriceCents: 12500,
      },
    });
    const created = await orders.createOne({
      values: {
        id: 'order',
        number: 'SO-001',
        status: 'draft',
        customer: { connect: { id: 'customer' } },
      },
    });
    await items.createOne({
      values: {
        id: 'item',
        order: { connect: { id: 'order' } },
        product: { connect: { id: 'product' } },
        quantity: 2,
        unitPriceCents: 12500,
      },
    });
    expect(
      await customers.findMany({
        filter: searchFilter(entities.customers, 'Ad'),
        limit: 10,
        offset: 0,
      }),
    ).toHaveLength(1);
    expect(await orders.count()).toBe(1);
    expect(await orders.exists({ filter: { id: 'order' } })).toBe(true);
    expect(
      await orders.findOne({
        filter: { id: 'order' },
        select: detailSelect(entities.orders),
      }),
    ).toMatchObject({
      customer: { name: 'Ada' },
      items: [{ productId: 'product', quantity: 2 }],
    });
    expect(
      await customers.findOne({
        filter: { id: 'customer' },
        select: detailSelect(entities.customers),
      }),
    ).toMatchObject({
      contacts: [{ name: 'Sales' }],
      orders: [{ number: 'SO-001' }],
    });
    const updated = await orders.updateOne({
      filter: { id: 'order' },
      ifVersion: created.version,
      values: { status: 'paid' },
    });
    expect(updated.record.status).toBe('paid');
    await expect(
      orders.updateOne({
        filter: { id: 'order' },
        ifVersion: created.version,
        values: { status: 'draft' },
      }),
    ).rejects.toMatchObject({ status: 409, reason: 'VERSION_CONFLICT' });
    await expect(
      products.deleteOne({ filter: { id: 'product' } }),
    ).rejects.toThrow();
    await expect(
      customers.deleteOne({ filter: { id: 'customer' } }),
    ).rejects.toThrow();
    expect(
      await orders.deleteOne({
        filter: { id: 'order' },
        ifVersion: updated.version,
      }),
    ).toEqual({ deleted: true });
    expect(await items.count()).toBe(0);
    await products.deleteOne({ filter: { id: 'product' } });
    await customers.deleteOne({ filter: { id: 'customer' } });
    expect(await contacts.count()).toBe(0);
  });
  it('protects every declared action while preserving unrelated routes', async () => {
    for (const entity of Object.values(entities))
      for (const action of [
        'findMany',
        'findOne',
        'count',
        'exists',
        'createOne',
        'updateOne',
        'deleteOne',
      ]) {
        const result = await f.router.request(
          `/main/api/${entity.repository}/${action}`,
          {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: '{}',
          },
        );
        expect(result.status).toBe(401);
      }
    for (const repositoryName of Object.values(relationRepositories))
      for (const action of ['findMany', 'findOne', 'createOne', 'updateOne']) {
        const result = await f.router.request(
          `/main/api/${repositoryName}/${action}`,
          {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: '{}',
          },
        );
        expect(result.status).toBe(401);
      }
    expect(
      (
        await f.router.request(
          `/main/api/${relationRepositories.projects}/deleteOne`,
          {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-test-user': 'tester',
            },
            body: JSON.stringify({ filter: { id: 'project-1' } }),
          },
        )
      ).status,
    ).toBe(404);
    expect((await f.router.request('/main/api/unrelated')).status).toBe(200);
    expect(
      (await f.router.request('/main/api/users/findMany', { method: 'POST' }))
        .status,
    ).toBe(404);
    expect(
      (
        await f.router.request(
          '/main/api/repositoryExampleFindManyRecords/findMany',
          { method: 'POST' },
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await f.router.request(
          '/main/api/repositoryExampleFindManyRecords/findOne',
          {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-test-user': 'tester',
            },
            body: JSON.stringify({ filter: { id: 'find-many-01' } }),
          },
        )
      ).status,
    ).toBe(404);
    await expect(
      repository(f.api, 'customers').findMany({ limit: 101 }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      repository(f.api, 'customers').updateOne({
        filter: { id: 'missing' },
        values: { name: 'Missing' },
      }),
    ).rejects.toMatchObject({ status: 404 });
  });
  it('creates orders with product-linked items atomically and selects product details', async () => {
    await repository(f.api, 'customers').createOne({
      values: {
        id: 'c',
        name: 'Ada',
        company: 'Acme',
        email: 'ada@example.test',
      },
    });
    await repository(f.api, 'products').createOne({
      values: { id: 'p', name: 'Keyboard', sku: 'KEY', unitPriceCents: 12500 },
    });
    const orders = repository(f.api, 'orders');
    const result = await orders.createOne({
      values: {
        id: 'o',
        number: 'NESTED',
        customer: { connect: { id: 'c' } },
        items: {
          create: [
            {
              id: 'i1',
              quantity: 2,
              unitPriceCents: 12000,
              product: { connect: { id: 'p' } },
            },
            {
              id: 'i2',
              quantity: 1,
              unitPriceCents: 12500,
              product: { connect: { id: 'p' } },
            },
          ],
        },
      },
      select: detailSelect(entities.orders),
    });
    expect(result.record.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'i1',
          orderId: 'o',
          product: expect.objectContaining({ name: 'Keyboard', sku: 'KEY' }),
        }),
        expect.objectContaining({ id: 'i2', orderId: 'o' }),
      ]),
    );
    await expect(
      orders.createOne({
        values: {
          id: 'failed',
          number: 'FAILED',
          customerId: 'c',
          items: {
            create: [
              {
                id: 'first-valid',
                quantity: 1,
                unitPriceCents: 100,
                product: { connect: { id: 'p' } },
              },
              {
                id: 'second-invalid',
                quantity: 1,
                unitPriceCents: 100,
                product: { connect: { id: 'missing' } },
              },
            ],
          },
        },
      }),
    ).rejects.toThrow();
    expect(await orders.count()).toBe(1);
    expect(await repository(f.api, 'items').count()).toBe(2);
  });
});

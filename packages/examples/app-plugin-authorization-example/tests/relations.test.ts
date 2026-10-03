import { afterEach, beforeEach, expect, it } from 'vitest';
import { createFixture } from './helpers.js';
import { ORDERS } from '../catalog.js';

let fixture: Awaited<ReturnType<typeof createFixture>>;
let orderId: string;
beforeEach(async () => {
  fixture = await createFixture();
  const order = await fixture.database
    .repository(ORDERS)
    .findOne({ sort: (sort) => sort.field('id').asc() });
  orderId = String(order!.id);
});
afterEach(async () => {
  await fixture.destroy();
});
const path = (): string => `sales/orders/${orderId}/relations`;

it('reads nested fields but only the delivery role may change relations', async () => {
  const read = await fixture.request('delivery', path());
  expect(read.status).toBe(200);
  const body = await read.json();
  expect(body.data).not.toHaveProperty('project');
  expect(body.data.checks).toEqual([]);
  expect(
    (
      await fixture.request('assistant', path(), {
        carrier: { connect: { id: 'express' } },
      })
    ).status,
  ).toBe(403);
  expect(
    (
      await fixture.request('delivery', path(), {
        carrier: { connect: { id: 'express' } },
      })
    ).status,
  ).toBe(200);
  expect(
    await fixture.database
      .repository(ORDERS)
      .findOne({ filter: { id: orderId } }),
  ).toMatchObject({ carrierId: 'express' });
  expect(
    (
      await fixture.request('delivery', path(), {
        carrier: { disconnect: true },
      })
    ).status,
  ).toBe(200);
  expect(
    await fixture.database
      .repository(ORDERS)
      .findOne({ filter: { id: orderId } }),
  ).toMatchObject({ carrierId: null });
});

it('enforces target scopes and refuses direct foreign-key writes', async () => {
  await fixture.database
    .repository('authorizationExampleCarriers')
    .updateOne({ filter: { id: 'freight' }, values: { active: false } });
  expect(
    (
      await fixture.request('delivery', path(), {
        carrier: { connect: { id: 'freight' } },
      })
    ).status,
  ).toBe(403);
  expect(
    (await fixture.request('delivery', path(), { carrierId: 'freight' }))
      .status,
  ).toBe(403);
  expect(
    (
      await fixture.request('delivery', path(), {
        carrier: { update: { values: { title: 'Changed' } } },
      })
    ).status,
  ).toBe(403);
});

it('creates, updates, upserts and deletes checks without granting their foreign key', async () => {
  const create = await fixture.request('delivery', path(), {
    checks: {
      create: [{ id: 'check-1', title: 'Inspect package', done: false }],
    },
  });
  expect(create.status).toBe(200);
  const update = await fixture.request('delivery', path(), {
    checks: { update: [{ filter: { id: 'check-1' }, values: { done: true } }] },
  });
  expect(update.status).toBe(200);
  expect(
    (
      await fixture.request('delivery', path(), {
        checks: {
          update: [
            { filter: { id: 'check-1' }, values: { orderId: 'another-order' } },
          ],
        },
      })
    ).status,
  ).toBe(403);
  const upsert = await fixture.request('delivery', path(), {
    checks: {
      upsert: [
        {
          filter: { id: 'check-2' },
          create: { id: 'check-2', title: 'Seal package', done: false },
          update: { title: 'Seal package' },
        },
      ],
    },
  });
  expect(upsert.status).toBe(200);
  const remove = await fixture.request('delivery', path(), {
    checks: { delete: [{ filter: { id: 'check-1' } }] },
  });
  expect(remove.status).toBe(200);
  expect(
    await fixture.database
      .repository('authorizationExampleOrderChecks')
      .findOne({ filter: { id: 'check-1' } }),
  ).toBeUndefined();
});

it('limits many-to-many payloads and supports set and disconnect', async () => {
  const connect = await fixture.request('delivery', path(), {
    collaborators: {
      connect: [{ where: { id: 'express' }, through: { note: 'Dispatch' } }],
    },
  });
  expect(connect.status).toBe(200);
  expect(
    await fixture.database
      .repository('authorizationExampleOrderCarriers')
      .findOne({ filter: { orderId } }),
  ).toMatchObject({ carrierId: 'express', note: 'Dispatch' });
  expect(
    (
      await fixture.request('delivery', path(), {
        collaborators: {
          connect: [
            {
              where: { id: 'freight' },
              through: { internalNote: 'not allowed' },
            },
          ],
        },
      })
    ).status,
  ).toBe(403);
  const set = await fixture.request('delivery', path(), {
    collaborators: {
      set: [{ where: { id: 'freight' }, through: { note: 'Review' } }],
    },
  });
  expect(set.status).toBe(200);
  const disconnect = await fixture.request('delivery', path(), {
    collaborators: { disconnect: [{ id: 'freight' }] },
  });
  expect(disconnect.status).toBe(200);
  expect(
    await fixture.database
      .repository('authorizationExampleOrderCarriers')
      .findMany({ filter: { orderId } }),
  ).toEqual([]);
});

it('rolls back nested creates when a later relation target is outside its scope', async () => {
  await fixture.database
    .repository('authorizationExampleCarriers')
    .updateOne({ filter: { id: 'freight' }, values: { active: false } });
  const response = await fixture.request('delivery', path(), {
    checks: {
      create: [
        { id: 'rolled-back-check', title: 'Must roll back', done: false },
      ],
    },
    collaborators: {
      connect: [{ where: { id: 'freight' }, through: { note: 'Denied' } }],
    },
  });
  expect(response.status).toBe(403);
  expect(
    await fixture.database
      .repository('authorizationExampleOrderChecks')
      .findOne({ filter: { id: 'rolled-back-check' } }),
  ).toBeUndefined();
});

it('applies delivery scopes and blocks completed orders', async () => {
  for (const user of ['delivery']) {
    const response = await fixture.request(
      user,
      'sales/orders/order-1/relations',
    );
    expect(response.status).toBe(200);
    const { data } = await response.json();
    expect(data.access).toBe('allowed');
    expect(data.operations.carrier).toContain('connect');
    expect(
      data.options.carrier.map((carrier: { id: string }) => carrier.id).sort(),
    ).toEqual(['express', 'freight']);
    for (const id of ['order-3', 'order-4']) {
      expect(
        (
          await fixture.request(user, `sales/orders/${id}/relations`, {
            carrier: { connect: { id: 'express' } },
          })
        ).status,
      ).toBe(403);
    }
  }
  for (const user of [
    'assistant',
    'engineer',
    'manager',
    'proposal',
    'coordinator',
  ]) {
    expect(
      (
        await fixture.request(user, path(), {
          checks: {
            create: [{ id: `check-${user}`, title: 'Denied', done: false }],
          },
        })
      ).status,
    ).toBe(403);
  }
  const readOnly = await fixture.request('assistant', path());
  expect((await readOnly.json()).data).toMatchObject({
    access: 'notGranted',
    operations: { carrier: [], checks: [], collaborators: [] },
    options: {},
  });
  await fixture.database
    .repository(ORDERS)
    .updateOne({ filter: { id: orderId }, values: { status: 'delivered' } });
  expect(
    (await (await fixture.request('delivery', path())).json()).data,
  ).toMatchObject({ access: 'notReady', operations: { checks: [] } });
  expect(
    (
      await fixture.request('delivery', path(), {
        checks: { create: [{ id: 'late', title: 'Late', done: false }] },
      })
    ).status,
  ).toBe(409);
});
it('does not update or delete a check belonging to another order', async () => {
  await fixture.database
    .repository('authorizationExampleOrderChecks')
    .createOne({
      values: {
        id: 'foreign-check',
        orderId: 'order-3',
        title: 'Protected',
        done: false,
      },
    });
  for (const values of [
    {
      checks: {
        update: [{ filter: { id: 'foreign-check' }, values: { done: true } }],
      },
    },
    { checks: { delete: [{ filter: { id: 'foreign-check' } }] } },
  ])
    expect((await fixture.request('delivery', path(), values)).status).toBe(
      403,
    );
  expect(
    await fixture.database
      .repository('authorizationExampleOrderChecks')
      .findOne({ filter: { id: 'foreign-check' } }),
  ).toMatchObject({ orderId: 'order-3', done: false });
});

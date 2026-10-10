// The real Provider against the test database and the memory jobs service:
// effects run as jobs, and a restart picks up what the previous start left
// queued.
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { createAppPaths } from '@nocobase/app-server/config';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { loggingToken } from '@nocobase/app-server/logging';
import { realtimeServiceToken } from '@nocobase/app-server/realtime';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  createSampleDataService,
  sampleDataToken,
} from '@nocobase/app-server/sample-data';
import { databaseManagerToken, type DatabaseManager } from '@nocobase/db';
import {
  authenticationToken,
  type Auth,
} from '@nocobase/app-plugin-authentication';
import { createJobExecutorService } from '@nocobase/jobs';
import { CREATE_TRANSITION } from '@nocobase/lifecycle';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect } from 'vitest';

import { LifecycleExampleProvider } from '../server/providers/lifecycle-example.js';
import { apiRoutes } from '../server/routes/index.js';
import {
  durableFlowServiceToken,
  lifecycleExampleServiceToken,
} from '../server/tokens.js';
import { SIGNATURE_HEADER } from '../server/webhooks/receiver.js';
import { LIFECYCLE_CHANGES_TOPIC } from '../shared/routes.js';
import { test } from './fixtures.js';

let directory: string;

const logger = { info: () => {}, warn: () => {}, error: () => {} };

beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), 'lifecycle-example-'));
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

async function start(
  database: DatabaseManager,
  /** Adds services before the provider starts, such as a realtime stand-in. */
  prepare: (container: ServiceContainer) => void = () => {},
): Promise<{
  provider: LifecycleExampleProvider;
  stop: () => Promise<void>;
  container: ServiceContainer;
  app: AppPluginApplication;
}> {
  const jobs = createJobExecutorService(undefined, {
    appName: 'main',
    storagePath: path.join(directory, 'jobs'),
  });
  const container = new ServiceContainer();
  container.instance(databaseManagerToken, database);
  container.instance(jobExecutorServiceToken, jobs);
  container.instance(sampleDataToken, createSampleDataService());
  container.instance(loggingToken, { getLogger: () => logger } as never);
  const app: AppPluginApplication = {
    appName: 'main',
    publicBasePath: '',
    config: {} as never,
    paths: createAppPaths({ rootDir: directory }),
    router: new Hono(),
    container,
  };
  prepare(container);
  const provider = new LifecycleExampleProvider(app);
  provider.register();
  await provider.boot();
  await provider.start();
  return {
    provider,
    container,
    app,
    stop: async () => {
      await provider.shutdown();
      await jobs.shutdown();
    },
  };
}

async function eventually<T>(
  read: () => Promise<T>,
  done: (value: T) => boolean,
): Promise<T> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const value = await read();
    if (done(value)) return value;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('The condition never held.');
}

describe('lifecycle example provider', () => {
  test('runs an approval end to end, paying the expense on the jobs service', async ({
    database,
  }) => {
    const { container, stop } = await start(database);
    try {
      const service = container.resolve(lifecycleExampleServiceToken);
      const expense = await service.createExpense(
        {
          title: '上海客户拜访',
          purpose: '季度回访',
          items: [
            {
              date: '2026-09-28',
              category: 'transport',
              description: '机票',
              amountCents: 800_000,
            },
          ],
          failPayments: 0,
        },
        'lin',
      );
      const id = String(expense.id);
      await service.runtime.fire('expenses', id, 'submit', {
        actor: { id: 'lin' },
        input: {},
      });
      const waiting = await service.listExpenses('chen', 'approvals', {
        page: 1,
        pageSize: 20,
      });
      expect(waiting.records.map((record) => record.id)).toEqual([expense.id]);
      expect(waiting.total).toBe(1);
      await service.runtime.fire('expenses', id, 'requestInfo', {
        actor: { id: 'chen' },
        input: { reason: '请补充行程单' },
      });
      // Sent back, it is with the applicant and leaves the approver's queue.
      expect(
        await service.listExpenses('chen', 'approvals', {
          page: 1,
          pageSize: 20,
        }),
      ).toEqual({ records: [], total: 0 });
      await service.runtime.fire('expenses', id, 'resubmit', {
        actor: { id: 'lin' },
        input: {},
      });
      await service.runtime.fire('expenses', id, 'approve', {
        actor: { id: 'chen' },
        input: { comment: '同意' },
      });
      const detail = await eventually(
        () => service.runtime.view('expenses', id, { id: 'lin' }),
        // Reaching paid does not wait for independently dispatched notices.
        // Observe the whole workflow before asserting every effect settled.
        (value) =>
          value.record.status === 'paid' &&
          value.history.effectRuns.every((run) => run.status === 'succeeded'),
      );
      expect(
        detail.history.transitions.map((entry) => entry.transition),
      ).toEqual([
        CREATE_TRANSITION,
        'submit',
        'requestInfo',
        'resubmit',
        'approve',
        'paid',
      ]);
      expect(
        detail.history.effectRuns.every((run) => run.status === 'succeeded'),
      ).toBe(true);
      // The payment effect's reference reached the record through the 'paid' transition.
      expect(detail.record.paymentRef).toMatch(/^PAY\d{12}$/);
    } finally {
      await stop();
    }
  });

  test('edits only the fields an edit names, and keeps the rest of the draft', async ({
    database,
  }) => {
    const { container, stop } = await start(database);
    try {
      const service = container.resolve(lifecycleExampleServiceToken);
      const line = {
        date: '2026-09-28',
        category: 'transport',
        description: '机票',
        amountCents: 800_000,
      };
      const expense = await service.createExpense(
        {
          title: '上海客户拜访',
          purpose: '季度回访',
          items: [line],
          failPayments: 1,
        },
        'lin',
      );
      const id = String(expense.id);
      const retitled = await service.updateExpense(
        id,
        { title: '上海客户回访' },
        'lin',
      );
      expect(retitled).toMatchObject({
        title: '上海客户回访',
        purpose: '季度回访',
        items: [line],
        failPayments: 1,
      });
      // A bigint column may read back as text, depending on the dialect.
      expect(Number(retitled.amountCents)).toBe(800_000);
      // New lines move the total with them; the title just set stays.
      const relined = await service.updateExpense(
        id,
        { items: [{ ...line, amountCents: 120_000 }] },
        'lin',
      );
      expect(relined).toMatchObject({
        title: '上海客户回访',
        purpose: '季度回访',
        failPayments: 1,
      });
      expect(Number(relined.amountCents)).toBe(120_000);
      // An edit that names nothing still checks who asks.
      await expect(service.updateExpense(id, {}, 'wang')).rejects.toMatchObject(
        { reason: 'OWN_EXPENSE_ONLY' },
      );
    } finally {
      await stop();
    }
  });

  test('closes an idle ticket when the triggers are swept', async ({
    database,
  }) => {
    const { container, stop } = await start(database);
    try {
      const service = container.resolve(lifecycleExampleServiceToken);
      const ticket = await service.createTicket(
        {
          subject: '无法登录后台',
          category: 'account',
          priority: 'high',
          description: '提示会话过期',
          failNotifications: 0,
        },
        'customer-li',
      );
      const id = String(ticket.id);
      await service.runtime.fire('tickets', id, 'reply', {
        actor: { id: 'agent-zhou' },
        input: { message: '请清除缓存后重试' },
      });
      // Pretend the wait has passed instead of waiting two minutes.
      await database.repository('lifecycleExampleTickets').updateMany({
        filter: { id: Number(id) },
        values: { statusChangedAt: '2000-01-01T00:00:00.000Z' },
      });
      expect(await service.runTriggers()).toBe(1);
      const detail = await service.runtime.view('tickets', id, {
        id: 'agent-zhou',
      });
      expect(detail.record).toMatchObject({
        status: 'closed',
        closedReason: 'timeout',
      });
    } finally {
      await stop();
    }
  });
});

describe('durable flows on the provider', () => {
  const signedIn = {
    required: () => async (context, next) => {
      context.set('auth', { user: { id: 'user-1' } });
      await next();
    },
  } as unknown as Auth;

  const order = {
    customerId: 'customer-li',
    title: '降噪耳机',
    amountCents: 39_900,
    failCheckouts: 0,
    failRefunds: 0,
  };

  test('moves an order on the signed webhook route, once however often it is delivered', async ({
    database,
  }) => {
    const { container, app, stop } = await start(database);
    try {
      container.instance(authenticationToken, signedIn);
      const router = await apiRoutes.createRouter(app);
      const flows = container.resolve(durableFlowServiceToken);
      const { id } = await flows.createOrder(order, 'customer-li');
      const orderId = String(id);
      await flows.runtime.fire('orders', orderId, 'checkout', {
        actor: { id: 'customer-li' },
      });
      await eventually(
        () => flows.runtime.view('orders', orderId, { id: 'customer-li' }),
        (view) => view.record.status === 'awaitingPayment',
      );
      // Paid at the provider; its webhook held, to be sent over HTTP here.
      const held = await flows.payCheckout(orderId, 'paid', true);
      expect(held).toMatchObject({ status: 'held', deliveries: 0 });
      const body = JSON.stringify({
        id: held.eventId,
        type: held.type,
        occurredAt: held.occurredAt,
        recordId: held.recordId,
        data: held.data,
      });
      const deliver = (signature: string) =>
        router.request('/lifecycleExample/webhooks/payments', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            [SIGNATURE_HEADER]: signature,
          },
          body,
        });
      const receiver = flows.outbox.receiver;
      // No session is asked for, but a wrong signature is refused.
      const forged = await deliver(receiver.sign(`${body}x`));
      expect(forged.status).toBe(401);
      await expect(forged.json()).resolves.toMatchObject({
        error: { reason: 'INVALID_SIGNATURE' },
      });
      const first = await deliver(receiver.sign(body));
      expect(first.status).toBe(200);
      await expect(first.json()).resolves.toMatchObject({
        data: { outcome: 'applied', transition: 'paymentSucceeded' },
      });
      const again = await deliver(receiver.sign(body));
      await expect(again.json()).resolves.toMatchObject({
        data: { outcome: 'replayed' },
      });
      const view = await flows.runtime.view('orders', orderId, {
        id: 'customer-li',
      });
      expect(view.record).toMatchObject({ status: 'paid' });
      expect(String(view.record.paymentRef)).toMatch(/^pi_/);
    } finally {
      await stop();
    }
  });

  test('refunds a payment whose webhook arrives after the order was cancelled', async ({
    database,
  }) => {
    const { container, stop } = await start(database);
    try {
      const flows = container.resolve(durableFlowServiceToken);
      const orderId = String(
        (await flows.createOrder(order, 'customer-li')).id,
      );
      const customer = { id: 'customer-li' };
      await flows.runtime.fire('orders', orderId, 'checkout', {
        actor: customer,
      });
      await eventually(
        () => flows.runtime.view('orders', orderId, customer),
        (view) => view.record.status === 'awaitingPayment',
      );
      const held = await flows.payCheckout(orderId, 'paid', true);
      await flows.runtime.fire('orders', orderId, 'cancel', {
        actor: customer,
      });
      const delivered = await flows.deliver(held.eventId);
      expect(delivered).toMatchObject({
        status: 'delivered',
        deliveries: 1,
        outcome: 'applied',
      });
      const view = await eventually(
        () => flows.runtime.view('orders', orderId, customer),
        (value) => value.record.status === 'refunded',
      );
      expect(view.history.transitions.map((entry) => entry.transition)).toEqual(
        [
          CREATE_TRANSITION,
          'checkout',
          'checkoutCreated',
          'cancel',
          'paidAfterCancel',
          'refunded',
        ],
      );
      expect(String(view.record.refundRef)).toMatch(/^re_/);
    } finally {
      await stop();
    }
  });

  test('gives the units back in the warehouse when the card is declined', async ({
    database,
  }) => {
    const { container, stop } = await start(database);
    try {
      const flows = container.resolve(durableFlowServiceToken);
      const purchaseId = String(
        (
          await flows.createPurchase(
            {
              customerId: 'customer-li',
              sku: 'keyboard',
              quantity: 2,
              declineCharge: true,
              failReleases: 0,
            },
            'customer-li',
          )
        ).id,
      );
      await flows.runtime.fire('purchases', purchaseId, 'submit', {
        actor: { id: 'customer-li' },
      });
      const view = await eventually(
        () =>
          flows.runtime.view('purchases', purchaseId, { id: 'customer-li' }),
        (value) => value.record.status === 'cancelled',
      );
      expect(view.record).toMatchObject({ cancelReason: 'paymentDeclined' });
      expect(await flows.stock()).toContainEqual({
        sku: 'keyboard',
        available: 3,
        reserved: 0,
      });
    } finally {
      await stop();
    }
  });

  test('renews a subscription whose period ended when the sweep runs', async ({
    database,
  }) => {
    const { container, stop } = await start(database);
    try {
      const flows = container.resolve(durableFlowServiceToken);
      const subscriptionId = String(
        (
          await flows.createSubscription(
            { customerId: 'customer-li', plan: 'basic', cardDeclines: 0 },
            'customer-li',
          )
        ).id,
      );
      const customer = { id: 'customer-li' };
      await eventually(
        () => flows.runtime.view('subscriptions', subscriptionId, customer),
        (view) => view.record.status === 'active',
      );
      // Not due yet: nothing to renew.
      expect((await flows.sweep()).fired).toBe(0);
      // Pretend the period has passed instead of waiting three minutes.
      await database.repository('lifecycleExampleSubscriptions').updateMany({
        filter: { id: Number(subscriptionId) },
        values: { currentPeriodEnd: '2000-01-01T00:00:00.000Z' },
      });
      expect(await flows.renewDue()).toBe(1);
      const view = await eventually(
        () => flows.runtime.view('subscriptions', subscriptionId, customer),
        (value) =>
          value.record.status === 'active' &&
          Number(value.record.periodCount) === 2,
      );
      expect(
        view.history.effectRuns.filter(
          (run) => run.effect === 'subscriptions.charge',
        ),
      ).toHaveLength(2);
    } finally {
      await stop();
    }
  });
});

describe('sample data', () => {
  test('builds sample records through the lifecycles when an install asks for it', async ({
    database,
  }) => {
    const { container, stop } = await start(database);
    try {
      const samples = container.resolve(sampleDataToken);
      const recorded: string[] = [];
      samples.prepare({
        ledger: {
          history: async () => [],
          record: async (entry) => {
            recorded.push(`${entry.name}:${entry.status}`);
          },
        },
        enabled: true,
      });
      expect(await samples.run()).toMatchObject({
        executed: ['lifecycle-example/records'],
        failed: [],
      });
      expect(recorded).toEqual([
        'sample-data:lifecycle-example/records:executed',
      ]);

      const examples = container.resolve(lifecycleExampleServiceToken);
      const page = { page: 1, pageSize: 20 };
      // Newest first: one ticket in each state a ticket rests in.
      const tickets = await examples.listTickets('agent-zhou', page);
      expect(tickets.records.map((record) => record.status)).toEqual([
        'new',
        'open',
        'closed',
        'closed',
      ]);
      const reports = async (actor: string) =>
        (await examples.listExpenses(actor, 'mine', page)).records;
      const [hangzhou, tradeFair, materials] = await reports('lin');
      expect([hangzhou?.status, tradeFair?.status]).toEqual([
        'draft',
        'awaitingFinance',
      ]);
      expect((await reports('he')).map((record) => record.status)).toEqual([
        'needsInfo',
        'rejected',
      ]);
      // The finance director finds the trade fair waiting for them.
      expect(
        (await examples.listExpenses('zhao', 'approvals', page)).records.map(
          (record) => record.id,
        ),
      ).toEqual([tradeFair?.id]);
      // The approved report is paid by its effect, as any other would be.
      const paid = await eventually(
        () =>
          examples.runtime.view('expenses', String(materials?.id), {
            id: 'lin',
          }),
        (view) => view.record.status === 'paid',
      );
      expect(paid.history.transitions.map((entry) => entry.transition)).toEqual(
        [CREATE_TRANSITION, 'submit', 'approve', 'paid'],
      );

      const flows = container.resolve(durableFlowServiceToken);
      const statuses = async (flow: Parameters<typeof flows.list>[0]) =>
        (await flows.list(flow, page)).records.map((record) => record.status);
      expect(await statuses('orders')).toEqual(['draft', 'draft']);
      expect(await statuses('exports')).toEqual(['draft', 'draft']);
      expect(await statuses('purchases')).toEqual(['draft', 'draft']);
      expect(await statuses('fulfilments')).toEqual(['preparing']);
      expect(await statuses('subscriptions')).toEqual([]);

      // A sample record moves on like any other.
      const [howTo] = (
        await examples.listTickets('customer-li', page)
      ).records.filter((record) => record.status === 'closed');
      await examples.runtime.fire('tickets', String(howTo?.id), 'reopen', {
        actor: { id: 'customer-li' },
        input: { message: '又遇到同样的问题了。' },
      });
    } finally {
      await stop();
    }
  });
});

describe('pushes instead of polling', () => {
  test('tells the pages which record changed, on a transition and on a webhook', async ({
    database,
  }) => {
    const published: unknown[] = [];
    const topics: string[] = [];
    const realtime = {
      defineTopic: (topic: string) => {
        topics.push(topic);
        return {
          publish: (payload: unknown) => {
            published.push(payload);
            return { topic, subscriberCount: 1 };
          },
          close: () => {},
        };
      },
    };
    const { container, stop } = await start(database, (services) =>
      services.instance(realtimeServiceToken, realtime as never),
    );
    try {
      expect(topics).toEqual([LIFECYCLE_CHANGES_TOPIC]);
      const flows = container.resolve(durableFlowServiceToken);
      const orderId = String(
        (
          await flows.createOrder(
            {
              customerId: 'customer-li',
              title: '降噪耳机',
              amountCents: 39_900,
              failCheckouts: 0,
              failRefunds: 0,
            },
            'user-1',
          )
        ).id,
      );
      // Its creation is a transition too.
      expect(published).toContainEqual({
        lifecycle: 'orders',
        recordId: orderId,
      });
      published.length = 0;
      // Held, the event changes nothing but the record's webhook log.
      await flows.emit({
        source: 'payments',
        type: 'checkout.declined',
        recordId: orderId,
        data: { reason: 'late' },
        hold: true,
      });
      expect(published).toEqual([{ lifecycle: 'orders', recordId: orderId }]);
    } finally {
      await stop();
    }
  });
});

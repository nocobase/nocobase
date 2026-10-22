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
  parameterConfigurationServiceToken,
  lifecycleExampleServiceToken,
} from '../server/tokens.js';
import { SIGNATURE_HEADER } from '../server/webhooks/receiver.js';
import { LIFECYCLE_CHANGES_TOPIC } from '../shared/routes.js';
import { test } from './fixtures.js';

let directory: string;

const logger = { info: () => {}, warn: () => {}, error: () => {} };

describe('parameter configuration against the real repository', () => {
  test('updates one workflow row atomically with one shared revision and preserves unedited fields', async ({
    database,
  }) => {
    const running = await start(database);
    try {
      const config = running.container.resolve(
        parameterConfigurationServiceToken,
      );
      const before = await config.readWorkflow('zhao', 'expenses');
      expect(before.revision).toBe(0);
      await config.saveWorkflow(
        { autoApproveLimit: 6000, escalateAfterMinutes: 9 },
        0,
        'whole-flow',
        'zhao',
        'expenses',
      );
      const saved = await config.readWorkflow('zhao', 'expenses');
      expect(saved.revision).toBe(1);
      expect(saved.groups.map((group) => group.revision)).toEqual([1, 1]);
      expect(saved.values).toEqual({
        autoApproveLimit: 6000,
        financeLimit: 50000,
        escalateAfterMinutes: 9,
      });
      await expect(
        config.saveWorkflow(
          { autoApproveLimit: 7000, escalateAfterMinutes: -1 },
          1,
          'invalid-flow',
          'zhao',
          'expenses',
        ),
      ).rejects.toMatchObject({ code: 'CONFIGURATION_INVALID' });
      expect((await config.readWorkflow('zhao', 'expenses')).values).toEqual(
        saved.values,
      );
      await expect(
        config.saveWorkflow(
          { financeLimit: 60000 },
          0,
          'stale-node',
          'zhao',
          'expenses',
        ),
      ).rejects.toMatchObject({ code: 'CONFIGURATION_CONFLICT' });
      await config.saveWorkflow(
        { financeLimit: 60000 },
        1,
        'node',
        'zhao',
        'expenses',
      );
      const row = await database
        .repository('lifecycleExampleWorkflowParameters')
        .findOne({ filter: { id: 'lifecycle.expenses' } });
      expect(row).toMatchObject({
        revision: 2,
        values: { ...saved.values, financeLimit: 60000 },
      });
      expect(
        await database
          .repository('lifecycleExampleWorkflowParameters')
          .count({ filter: { id: 'lifecycle.expenses' } }),
      ).toBe(1);
      expect(
        await config.store.read('demo', 'lifecycle.expenses.expenseTiming'),
      ).toMatchObject({ revision: 2, values: { escalateAfterMinutes: 9 } });
      expect((await config.readWorkflow('zhao', 'tickets')).revision).toBe(0);
    } finally {
      await running.stop();
    }
  });
  test('searches one scoped reference type and pages newly added active users', async ({
    database,
  }) => {
    const running = await start(database);
    try {
      const config = running.container.resolve(
        parameterConfigurationServiceToken,
      );
      const people = database.repository('lifecycleExamplePeople');
      for (let index = 0; index < 23; index++)
        await people.createOne({
          values: {
            id: `search-${index}`,
            scope: 'demo',
            name: `Search Person ${String(index).padStart(2, '0')}`,
            active: true,
          },
        });
      await people.createOne({
        values: {
          id: 'search-private',
          scope: 'other',
          name: 'Search Person private',
          active: true,
        },
      });
      await people.createOne({
        values: {
          id: 'search-disabled',
          scope: 'demo',
          name: 'Search Person disabled',
          active: false,
        },
      });
      expect((await config.references('zhao', 'user', '   ')).data).toEqual([]);
      const first = await config.references('zhao', 'user', 'Search Person');
      const second = await config.references(
        'zhao',
        'user',
        'Search Person',
        2,
      );
      const last = await config.references('zhao', 'user', 'Search Person', 3);
      expect(first.meta).toEqual({ page: 1, pageSize: 10, total: 23 });
      expect(first.data).toHaveLength(10);
      expect(second.data).toHaveLength(10);
      expect(last.data).toHaveLength(3);
      expect(
        new Set([...first.data, ...second.data, ...last.data].map((p) => p.id))
          .size,
      ).toBe(23);
      expect(
        (await config.references('zhao', 'department', 'Search Person')).data,
      ).toEqual([]);
      expect(
        (await config.references('zhao', 'user', 'Search Person', 1, 100)).data,
      ).toHaveLength(10);
      expect(await config.reference('zhao', 'user', 'search-22')).toMatchObject(
        { name: 'Search Person 22' },
      );
      expect(
        await config.reference('zhao', 'user', 'search-private'),
      ).toBeNull();
      expect(
        await config.reference('zhao', 'user', 'search-disabled'),
      ).toMatchObject({ active: false });
      expect(() => config.authorize('lin', 'candidates')).toThrow();
    } finally {
      await running.stop();
    }
  });
  test('retains every usage fact when string identities share a pagination timestamp', async ({
    database,
  }) => {
    const running = await start(database);
    try {
      const config = running.container.resolve(
        parameterConfigurationServiceToken,
      );
      const record = { id: 'pagination-record' };
      for (let index = 0; index < 105; index++)
        await config.store.saveUsage({
          scope: 'demo',
          lifecycle: 'expenses',
          recordId: record.id,
          kind: 'action',
          associationId: 'pagination-' + index,
          values: { observed: index },
          sources: {},
          at: '2026-10-01T00:00:00.000Z',
        });
      const facts = await config.store.listUsage('demo', 'expenses', record.id);
      expect(
        facts.filter((fact) => fact.associationId.startsWith('pagination-')),
      ).toHaveLength(105);
    } finally {
      await running.stop();
    }
  });
  test('validates complete versions, CAS, request replay, permissions and scope', async ({
    database,
  }) => {
    const running = await start(database);
    try {
      const config = running.container.resolve(
        parameterConfigurationServiceToken,
      );
      const values = { autoApproveLimit: 100, financeLimit: 1000 };
      expect(await config.read('expenseThresholds', 'lin')).toMatchObject({
        revision: 0,
        canUpdate: false,
      });
      expect(
        await config.save('expenseThresholds', values, 0, 'save-1', 'zhao'),
      ).toMatchObject({ revision: 1, values });
      expect(
        await config.save('expenseThresholds', values, 0, 'save-1', 'zhao'),
      ).toMatchObject({ revision: 1 });
      await expect(
        config.save('expenseThresholds', values, 0, 'save-2', 'zhao'),
      ).rejects.toMatchObject({ code: 'CONFIGURATION_CONFLICT' });
      await expect(
        config.save(
          'expenseThresholds',
          { ...values, financeLimit: 2000 },
          1,
          'save-1',
          'zhao',
        ),
      ).rejects.toMatchObject({ code: 'CONFIGURATION_REQUEST_REUSED' });
      await expect(
        config.save(
          'expenseThresholds',
          { ...values, waitMinutes: 2 },
          1,
          'unknown',
          'zhao',
        ),
      ).rejects.toMatchObject({ code: 'CONFIGURATION_INVALID' });
      await expect(
        config.save(
          'expenseThresholds',
          { autoApproveLimit: 2000, financeLimit: 1000 },
          1,
          'invalid',
          'zhao',
        ),
      ).rejects.toMatchObject({ code: 'CONFIGURATION_INVALID' });
      await expect(
        config.save('expenseThresholds', values, 1, 'forbidden', 'lin'),
      ).rejects.toMatchObject({ reason: 'PARAMETER_ACCESS_DENIED' });
      expect(
        await config.store.read('other-scope', 'expenseThresholds'),
      ).toBeUndefined();
      expect(
        await database
          .repository('lifecycleExampleWorkflowParameters')
          .findOne({ filter: { id: 'lifecycle.expenses' } }),
      ).toMatchObject({
        revision: 1,
        values: { ...values, escalateAfterMinutes: 3 },
      });
    } finally {
      await running.stop();
    }
  });

  test('previews drafts and preserves a submitted snapshot after configuration changes and replay', async ({
    database,
  }) => {
    const running = await start(database);
    try {
      const config = running.container.resolve(
        parameterConfigurationServiceToken,
      );
      const service = running.container.resolve(lifecycleExampleServiceToken);
      const record = await service.createExpense(
        {
          title: 'Snapshot',
          purpose: 'Travel',
          items: [
            {
              date: '2026-10-12',
              category: 'transport',
              description: 'Travel',
              amountCents: 200000,
            },
          ],
          failPayments: 0,
        },
        'lin',
      );
      const id = String(record.id);
      await config.save(
        'expenseThresholds',
        { autoApproveLimit: 100, financeLimit: 3000 },
        0,
        'before-submit',
        'zhao',
      );
      expect(
        (await service.runtime.view('expenses', id, { id: 'lin' }))
          .parameterValues,
      ).toMatchObject({ financeLimit: 3000 });
      expect(
        await config.store.snapshot('demo', 'expenses', id),
      ).toBeUndefined();
      await service.runtime.fire('expenses', id, 'submit', {
        actor: { id: 'lin' },
        input: {},
        requestId: 'submit-once',
      });
      await config.save(
        'expenseThresholds',
        { autoApproveLimit: 100, financeLimit: 1000 },
        1,
        'after-submit',
        'zhao',
      );
      await service.runtime.fire('expenses', id, 'submit', {
        actor: { id: 'lin' },
        input: {},
        requestId: 'submit-once',
      });
      const history = await config.history('expenses', id, 'lin');
      expect(history.snapshot?.values).toEqual({
        autoApproveLimit: 100,
        financeLimit: 3000,
      });
      expect(history.current).toMatchObject({ financeLimit: 3000 });
      expect(
        history.usages.filter(
          (usage) =>
            usage.kind === 'transition' && usage.values.financeLimit === 3000,
        ),
      ).toHaveLength(1);
      expect(
        (await config.read('expenseThresholds', 'lin')).values.financeLimit,
      ).toBe(1000);
      await service.runtime.fire('expenses', id, 'withdraw', {
        actor: { id: 'lin' },
        input: {},
      });
      await service.runtime.fire('expenses', id, 'submit', {
        actor: { id: 'lin' },
        input: {},
      });
      expect(
        (await service.runtime.view('expenses', id, { id: 'lin' }))
          .parameterValues,
      ).toMatchObject({ financeLimit: 3000 });
      await service.runtime.prune({ olderThan: '2099-01-01T00:00:00.000Z' });
      expect(
        (await config.history('expenses', id, 'lin')).snapshot?.values
          .financeLimit,
      ).toBe(3000);
      expect(
        (await config.history('expenses', id, 'lin')).usages.length,
      ).toBeGreaterThan(1);
    } finally {
      await running.stop();
    }
  });
});

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

describe('invoice provider integration', () => {
  test('creates through the authenticated API, rejects duplicates, and delivers a downloadable result', async ({
    database,
  }) => {
    const { container, app, stop } = await start(database, (services) =>
      services.instance(authenticationToken, {
        required: () => async (context, next) => {
          context.set('auth', { user: { id: 'user-1' } });
          await next();
        },
      } as unknown as Auth),
    );
    try {
      const router = await apiRoutes.createRouter(app);
      const flows = container.resolve(durableFlowServiceToken);
      const body = {
        orderRef: '1024',
        title: 'Example company',
        taxNumber: '91310000MA1K000001',
      };
      const create = () =>
        router.request('/lifecycleExample/invoices', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        });
      const response = await create();
      expect(response.status).toBe(201);
      const created = (await response.json()) as {
        data: { id: string; amountCents: number };
      };
      expect(created.data.amountCents).toBe(39900);
      expect((await create()).status).toBe(409);
      const id = String(created.data.id);
      expect(
        (await router.request(`/lifecycleExample/invoices/${id}/pdf`)).status,
      ).toBe(404);
      await flows.runtime.fire('invoices', id, 'submit', {
        actor: { id: 'user-1' },
      });
      const waiting = await eventually(
        () => flows.runtime.view('invoices', id, { id: 'user-1' }),
        (view) => view.record.status === 'awaitingIssue',
      );
      expect(waiting.record.providerRequestId).toMatch(/^inv_/);
      const completed = await router.request(
        `/lifecycleExample/sandbox/invoices/${id}/complete`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ outcome: 'issued', hold: false }),
        },
      );
      expect(completed.status).toBe(201);
      const pdf = await router.request(`/lifecycleExample/invoices/${id}/pdf`);
      expect(pdf.status).toBe(200);
      expect(await pdf.text()).toContain('SANDBOX INVOICE');
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
        executed: ['lifecycle-example/records', 'lifecycle-example/invoices'],
        failed: [],
      });
      expect(recorded).toEqual([
        'sample-data:lifecycle-example/records:executed',
        'sample-data:lifecycle-example/invoices:executed',
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
      expect(await statuses('invoices')).toEqual(['draft', 'draft', 'draft']);
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
          publish: async (payload: unknown) => {
            published.push(payload);
            return { topic, eventId: 'event-1' };
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

test('publishes a committed email effect outcome without a follow-up transition', async ({
  database,
}) => {
  const observed: string[] = [];
  let inspect: (() => Promise<void>) | undefined;
  const realtime = {
    defineTopic: (topic: string) => ({
      publish: async () => {
        await inspect?.();
        return { topic, eventId: 'effect-change' };
      },
      close: () => {},
    }),
  };
  const { container, stop } = await start(database, (services) =>
    services.instance(realtimeServiceToken, realtime as never),
  );
  try {
    const service = container.resolve(lifecycleExampleServiceToken);
    const ticket = await service.createTicket(
      {
        subject: 'Cannot sign in',
        category: 'account',
        priority: 'high',
        description: 'Session expired',
        failNotifications: 0,
      },
      'customer-li',
    );
    const id = String(ticket.id);
    inspect = async () => {
      const view = await service.runtime.view('tickets', id, {
        id: 'agent-zhou',
      });
      for (const run of view.history.effectRuns)
        observed.push(`${view.state}:${run.status}`);
    };
    await service.runtime.fire('tickets', id, 'reply', {
      actor: { id: 'agent-zhou' },
      input: { message: 'Please try again.' },
    });
    await eventually(
      async () => observed,
      (values) => values.includes('awaitingCustomer:succeeded'),
    );
    const view = await service.runtime.view('tickets', id, {
      id: 'agent-zhou',
    });
    expect(view.history.transitions.map((entry) => entry.transition)).toEqual([
      CREATE_TRANSITION,
      'reply',
    ]);
  } finally {
    await stop();
  }
});

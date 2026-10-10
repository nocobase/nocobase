// The five durable flows as plain function calls: the library's test kit
// (a memory store, a fake clock, in-process effects) and the real sandbox
// over memory objects on the same clock, so waiting for the outside — a
// webhook, a poll, a renewal — is a step a test takes.
import {
  SYSTEM_ACTOR,
  type Lifecycle,
  type LifecycleTypes,
} from '@nocobase/lifecycle';
import {
  createLifecycleTestKit,
  type LifecycleTestKit,
} from '@nocobase/lifecycle/testing';
import { describe, expect, it } from 'vitest';

import { exportLifecycle } from '../server/lifecycles/export.js';
import {
  createFailureSwitch,
  type FlowServices,
} from '../server/lifecycles/flow-services.js';
import { fulfilmentLifecycle } from '../server/lifecycles/fulfilment.js';
import { orderLifecycle } from '../server/lifecycles/order.js';
import { purchaseLifecycle } from '../server/lifecycles/purchase.js';
import { subscriptionLifecycle } from '../server/lifecycles/subscription.js';
import { MemorySandboxObjects } from '../server/sandbox/objects.js';
import { Sandbox } from '../server/sandbox/sandbox.js';
import {
  WebhookReceiver,
  type WebhookPayload,
} from '../server/webhooks/receiver.js';

/** A kit for one flow, with the sandbox and the receiver on its clock and runtime. */
function setup<T extends LifecycleTypes>(lifecycle: Lifecycle<T>) {
  // The sandbox and the effects read the kit's clock and runtime, and the
  // kit takes them as services: one of the two has to be wired late.
  const late: { kit?: LifecycleTestKit<T> } = {};
  const clock = (): Date => late.kit?.now() ?? new Date('2026-10-01T09:00:00Z');
  const sandbox = new Sandbox(new MemorySandboxObjects(clock));
  const services: FlowServices = {
    sandbox,
    shouldFail: createFailureSwitch(),
    fire: async (name, id, transition, options) => {
      await late.kit!.runtime.fire(name, id, transition, {
        actor: SYSTEM_ACTOR,
        requestId: options.requestId,
        ...(options.input === undefined ? {} : { input: options.input }),
      });
    },
  };
  const kit = createLifecycleTestKit(lifecycle, {
    services: services as never,
    now: '2026-10-01T09:00:00Z',
    // Retries run at once: these tests are about what the steps do.
    retries: 'immediate',
  });
  late.kit = kit;
  const receiver = new WebhookReceiver(kit.runtime);
  let sequence = 0;
  const event = (
    type: string,
    recordId: unknown,
    data: WebhookPayload['data'] = {},
    occurredAt: string = clock().toISOString(),
  ): WebhookPayload => {
    sequence += 1;
    return {
      id: `evt_${sequence}`,
      type,
      recordId: String(recordId),
      occurredAt,
      data,
    };
  };
  return { kit, sandbox, receiver, event };
}

describe('order paid by webhook', () => {
  const order = {
    title: '降噪耳机',
    customerId: 'customer-li',
    amountCents: 39_900,
    paymentAttempt: 0,
    failCheckouts: 0,
    failRefunds: 0,
  };

  it('waits for the provider, then moves on the webhook, once however often it comes', async () => {
    const { kit, sandbox, receiver, event } = setup(orderLifecycle);
    const created = await kit.start(order);
    await kit.fire(created, 'checkout');
    const waiting = kit.get(created);
    expect(waiting).toMatchObject({ status: 'awaitingPayment' });
    expect(waiting.paymentSessionId).toMatch(/^cs_/);

    const session = await sandbox.payCheckout(
      String(waiting.paymentSessionId),
      'paid',
    );
    const paid = event('checkout.paid', created.id, {
      paymentRef: String(session.paymentRef),
    });
    await expect(receiver.receive('payments', paid)).resolves.toMatchObject({
      outcome: 'applied',
      transition: 'paymentSucceeded',
    });
    expect(kit.get(created)).toMatchObject({
      status: 'paid',
      paymentRef: session.paymentRef,
    });

    // The provider delivers it again: a replay, nothing written.
    await expect(receiver.receive('payments', paid)).resolves.toMatchObject({
      outcome: 'replayed',
    });
    expect(await kit.history(created)).toEqual([
      '$create',
      'checkout',
      'checkoutCreated',
      'paymentSucceeded',
    ]);
  });

  it('accepts the webhook before the checkout was even recorded', async () => {
    const { kit, receiver, event } = setup(orderLifecycle);
    const created = kit.create(order);
    kit.update(created, { status: 'creatingCheckout' });
    await expect(
      receiver.receive(
        'payments',
        event('checkout.paid', created.id, { paymentRef: 'pi_early' }),
      ),
    ).resolves.toMatchObject({ outcome: 'applied' });
    expect(kit.get(created)).toMatchObject({ status: 'paid' });
  });

  it('refunds a payment that arrives after the order was cancelled', async () => {
    const { kit, sandbox, receiver, event } = setup(orderLifecycle);
    const created = await kit.start(order);
    await kit.fire(created, 'checkout');
    const sessionId = String(kit.get(created).paymentSessionId);
    // The customer pays; the provider's webhook is slow to arrive.
    const session = await sandbox.payCheckout(sessionId, 'paid');
    await kit.fire(created, 'cancel');
    // Closing the checkout came too late: it stays paid.
    expect((await sandbox.checkout(sessionId)).status).toBe('paid');
    expect(kit.get(created)).toMatchObject({ status: 'cancelled' });

    await expect(
      receiver.receive(
        'payments',
        event('checkout.paid', created.id, {
          paymentRef: String(session.paymentRef),
        }),
      ),
    ).resolves.toMatchObject({
      outcome: 'applied',
      transition: 'paidAfterCancel',
    });
    expect(kit.get(created)).toMatchObject({ status: 'refunded' });
    expect(kit.get(created).refundRef).toMatch(/^re_/);
  });

  it('closes an unpaid order after the window, and its checkout with it', async () => {
    const { kit, sandbox } = setup(orderLifecycle);
    const created = await kit.start(order);
    await kit.fire(created, 'checkout');
    kit.advance({ minutes: 2 });
    expect(await kit.runTriggers()).toBe(0);
    kit.advance({ minutes: 2 });
    expect(await kit.runTriggers()).toBe(1);
    expect(kit.get(created)).toMatchObject({
      status: 'cancelled',
      cancelReason: 'timeout',
    });
    const sessionId = String(kit.get(created).paymentSessionId);
    expect((await sandbox.checkout(sessionId)).status).toBe('expired');
    await expect(sandbox.payCheckout(sessionId, 'paid')).rejects.toMatchObject({
      code: 'SESSION_CLOSED',
    });
  });

  it('opens a new checkout after a decline, under a new key', async () => {
    const { kit, sandbox, receiver, event } = setup(orderLifecycle);
    const created = await kit.start(order);
    await kit.fire(created, 'checkout');
    const first = String(kit.get(created).paymentSessionId);
    await sandbox.payCheckout(first, 'declined');
    await receiver.receive(
      'payments',
      event('checkout.declined', created.id, { reason: 'Card declined.' }),
    );
    expect(kit.get(created)).toMatchObject({
      status: 'paymentFailed',
      lastError: 'Card declined.',
    });
    await kit.fire(created, 'checkout');
    expect(kit.get(created)).toMatchObject({
      status: 'awaitingPayment',
      paymentAttempt: 2,
    });
    expect(kit.get(created).paymentSessionId).not.toBe(first);
  });

  it('gets past a provider outage by retrying, and stops waiting when it outlasts them', async () => {
    const { kit } = setup(orderLifecycle);
    const flaky = await kit.start({ ...order, failCheckouts: 2 });
    await kit.fire(flaky, 'checkout');
    expect(kit.get(flaky)).toMatchObject({ status: 'awaitingPayment' });

    const down = await kit.start({ ...order, failCheckouts: 3 });
    await kit.fire(down, 'checkout');
    expect(kit.get(down)).toMatchObject({ status: 'paymentFailed' });
    // Checking out again is a new round, and the outage is over.
    await kit.fire(down, 'checkout');
    expect(kit.get(down)).toMatchObject({ status: 'awaitingPayment' });
  });

  it('ignores a webhook for an order that is past it, so the provider stops', async () => {
    const { kit, receiver, event } = setup(orderLifecycle);
    const created = await kit.start(order);
    await expect(
      receiver.receive(
        'payments',
        event('checkout.declined', created.id, { reason: 'late' }),
      ),
    ).resolves.toMatchObject({ outcome: 'ignored', code: 'INVALID_STATE' });
    await expect(
      receiver.receive('payments', event('checkout.paid', 999)),
    ).resolves.toMatchObject({ outcome: 'ignored', code: 'RECORD_NOT_FOUND' });
  });

  it('refuses a body whose signature does not match', async () => {
    const { receiver, event } = setup(orderLifecycle);
    const body = JSON.stringify(event('checkout.paid', 1));
    await expect(
      receiver.receiveSigned('payments', body, receiver.sign(`${body} `)),
    ).rejects.toMatchObject({ reason: 'INVALID_SIGNATURE' });
  });
});

describe('export polled until the vendor is done', () => {
  const request = {
    title: '九月订单明细',
    durationSeconds: 40,
    vendorOutcome: 'success',
    jobAttempt: 0,
    pollCount: 0,
  };

  async function pollFor(
    kit: LifecycleTestKit<never>,
    seconds: number,
  ): Promise<void> {
    for (let passed = 0; passed < seconds; passed += 16) {
      kit.advance({ seconds: 16 });
      await kit.runTriggers();
    }
  }

  it('polls on the trigger until the job is done', async () => {
    const { kit } = setup(exportLifecycle);
    const created = await kit.start(request);
    await kit.fire(created, 'submit');
    expect(kit.get(created)).toMatchObject({ status: 'processing' });
    expect(kit.get(created).jobId).toMatch(/^job_/);

    await pollFor(kit as never, 48);
    const done = kit.get(created);
    expect(done).toMatchObject({ status: 'done' });
    expect(done.outputUrl).toMatch(/\.csv$/);
    const history = await kit.history(created);
    expect(history.filter((name) => name === 'poll').length).toBeGreaterThan(1);
    expect(history.at(-1)).toBe('jobDone');
  });

  it('gives up at the deadline and stops the vendor’s job', async () => {
    const { kit, sandbox } = setup(exportLifecycle);
    const created = await kit.start({ ...request, vendorOutcome: 'stuck' });
    await kit.fire(created, 'submit');
    await pollFor(kit as never, 200);
    expect(kit.get(created)).toMatchObject({ status: 'timedOut' });
    expect((await sandbox.job(String(kit.get(created).jobId))).status).toBe(
      'cancelled',
    );
  });

  it('records a failed job, and a new round starts a new one', async () => {
    const { kit } = setup(exportLifecycle);
    const created = await kit.start({ ...request, vendorOutcome: 'failure' });
    await kit.fire(created, 'submit');
    await pollFor(kit as never, 48);
    const failed = kit.get(created);
    expect(failed).toMatchObject({ status: 'failed' });
    await kit.fire(created, 'retry');
    expect(kit.get(created)).toMatchObject({
      status: 'processing',
      jobAttempt: 2,
    });
    expect(kit.get(created).jobId).not.toBe(failed.jobId);
  });
});

describe('purchase undone step by step', () => {
  const purchase = {
    customerId: 'customer-li',
    sku: 'headphones',
    quantity: 2,
    amountCents: 79_800,
    declineCharge: false,
    failReleases: 0,
  };

  const available = async (sandbox: Sandbox, sku: string) =>
    (await sandbox.stock()).find((level) => level.sku === sku)?.available;

  it('reserves, charges and confirms', async () => {
    const { kit, sandbox } = setup(purchaseLifecycle);
    const created = await kit.start(purchase);
    await kit.fire(created, 'submit');
    expect(kit.get(created)).toMatchObject({ status: 'confirmed' });
    expect(await available(sandbox, 'headphones')).toBe(3);
    expect(await kit.history(created)).toEqual([
      '$create',
      'submit',
      'stockReserved',
      'charged',
    ]);
  });

  it('gives the units back when the card is declined', async () => {
    const { kit, sandbox } = setup(purchaseLifecycle);
    const created = await kit.start({ ...purchase, declineCharge: true });
    await kit.fire(created, 'submit');
    expect(kit.get(created)).toMatchObject({
      status: 'cancelled',
      cancelReason: 'paymentDeclined',
    });
    expect(await available(sandbox, 'headphones')).toBe(5);
    expect(await kit.history(created)).toEqual([
      '$create',
      'submit',
      'stockReserved',
      'chargeFailed',
      'stockReleased',
    ]);
  });

  it('stops for a person when the compensation keeps failing, and finishes it on retry', async () => {
    const { kit, sandbox } = setup(purchaseLifecycle);
    const created = await kit.start({
      ...purchase,
      declineCharge: true,
      failReleases: 3,
    });
    await kit.fire(created, 'submit');
    expect(kit.get(created)).toMatchObject({
      status: 'compensationNeedsAttention',
    });
    // Still held: the compensation is owed, and the state says so.
    expect(await available(sandbox, 'headphones')).toBe(3);
    await kit.fire(created, 'retryRelease');
    expect(kit.get(created)).toMatchObject({ status: 'cancelled' });
    expect(await available(sandbox, 'headphones')).toBe(5);
  });

  it('cancels at once when there is not enough stock, holding nothing', async () => {
    const { kit, sandbox } = setup(purchaseLifecycle);
    const created = await kit.start({
      ...purchase,
      sku: 'keyboard',
      quantity: 4,
    });
    await kit.fire(created, 'submit');
    expect(kit.get(created)).toMatchObject({
      status: 'cancelled',
      cancelReason: 'outOfStock',
    });
    expect(await available(sandbox, 'keyboard')).toBe(3);
    // An answer, not an outage: tried once.
    expect(await kit.effectRuns(created)).toMatchObject([
      { effect: 'purchases.reserveStock', status: 'failed', attempts: 1 },
    ]);
  });
});

describe('fulfilment waiting for two signals, then a carrier', () => {
  const shipment = { title: '订单 #1024', customerId: 'customer-wang' };

  it('is ready once both the payment and the pick arrived, in either order', async () => {
    for (const order of [
      ['payment.captured', 'pick.completed'],
      ['pick.completed', 'payment.captured'],
    ]) {
      const { kit, receiver, event } = setup(fulfilmentLifecycle);
      const created = await kit.start(shipment);
      const send = (type: string) =>
        receiver.receive(
          type === 'pick.completed' ? 'warehouse' : 'payments',
          event(type, created.id, { paymentRef: 'pi_1', picker: '小李' }),
        );
      await send(order[0]!);
      expect(kit.get(created)).toMatchObject({ status: 'preparing' });
      await send(order[1]!);
      expect(kit.get(created)).toMatchObject({ status: 'readyToShip' });
    }
  });

  it('ignores a second capture of the same payment', async () => {
    const { kit, receiver, event } = setup(fulfilmentLifecycle);
    const created = await kit.start(shipment);
    await receiver.receive(
      'payments',
      event('payment.captured', created.id, { paymentRef: 'pi_1' }),
    );
    await expect(
      receiver.receive(
        'payments',
        event('payment.captured', created.id, { paymentRef: 'pi_1' }),
      ),
    ).resolves.toMatchObject({ outcome: 'ignored', code: 'GUARD_REJECTED' });
  });

  it('applies carrier events by when they happened, not when they arrived', async () => {
    const { kit, receiver, event } = setup(fulfilmentLifecycle);
    const created = await kit.start(shipment);
    await receiver.receive('payments', event('payment.captured', created.id));
    await receiver.receive('warehouse', event('pick.completed', created.id));
    await kit.fire(created, 'ship');
    expect(kit.get(created)).toMatchObject({ status: 'shipped' });
    expect(kit.get(created).trackingNumber).toMatch(/^SF\d{12}$/);

    const at = (minutes: number) =>
      new Date(
        Date.parse('2026-10-01T10:00:00Z') + minutes * 60_000,
      ).toISOString();
    const tracking = (status: string, minutes: number) =>
      receiver.receive(
        'carrier',
        event(
          'tracking.updated',
          created.id,
          { status, location: '杭州' },
          at(minutes),
        ),
      );
    await expect(tracking('inTransit', 20)).resolves.toMatchObject({
      outcome: 'applied',
    });
    // Scanned earlier, delivered later: refused as stale.
    await expect(tracking('pickedUp', 10)).resolves.toMatchObject({
      outcome: 'ignored',
      code: 'GUARD_REJECTED',
    });
    expect(kit.get(created)).toMatchObject({ carrierStatus: 'inTransit' });
    await expect(tracking('exception', 30)).resolves.toMatchObject({
      outcome: 'applied',
    });
    expect(kit.get(created)).toMatchObject({ status: 'exception' });
    await expect(tracking('delivered', 50)).resolves.toMatchObject({
      outcome: 'applied',
    });
    expect(kit.get(created)).toMatchObject({ status: 'delivered' });
    // Anything after the end is past it.
    await expect(tracking('outForDelivery', 40)).resolves.toMatchObject({
      outcome: 'ignored',
      code: 'INVALID_STATE',
    });
  });
});

describe('subscription renewed every period', () => {
  const subscription = {
    customerId: 'customer-li',
    plan: 'pro',
    priceCents: 9_900,
    periodCount: 0,
    dunningCount: 0,
    cardDeclines: 0,
  };

  it('charges the first period at once and renews when it ends', async () => {
    const { kit } = setup(subscriptionLifecycle);
    const created = await kit.start(subscription);
    expect(kit.get(created)).toMatchObject({
      status: 'active',
      periodCount: 1,
      currentPeriodEnd: '2026-10-01T09:03:00.000Z',
    });
    // The sweep's renewal is refused before the period ends.
    await expect(
      kit.fire(created, 'renew', {}, { actor: SYSTEM_ACTOR }),
    ).rejects.toMatchObject({ code: 'GUARD_REJECTED' });
    kit.advance({ minutes: 3 });
    await kit.fire(created, 'renew', {}, { actor: SYSTEM_ACTOR });
    expect(kit.get(created)).toMatchObject({
      status: 'active',
      periodCount: 2,
      currentPeriodEnd: '2026-10-01T09:06:00.000Z',
    });
  });

  it('retries a declined card, then cancels after the last try', async () => {
    const { kit } = setup(subscriptionLifecycle);
    const created = await kit.start({ ...subscription, cardDeclines: 10 });
    expect(kit.get(created)).toMatchObject({
      status: 'pastDue',
      dunningCount: 1,
    });
    for (let round = 0; round < 3; round += 1) {
      kit.advance({ minutes: 1, seconds: 1 });
      await kit.runTriggers();
    }
    expect(kit.get(created)).toMatchObject({
      status: 'cancelled',
      cancelReason: 'unpaid',
      dunningCount: 3,
    });
  });

  it('recovers when the customer updates their card', async () => {
    const { kit } = setup(subscriptionLifecycle);
    const created = await kit.start({ ...subscription, cardDeclines: 10 });
    await kit.fire(created, 'updateCard');
    expect(kit.get(created)).toMatchObject({
      status: 'active',
      dunningCount: 0,
      cardDeclines: 0,
    });
  });
});

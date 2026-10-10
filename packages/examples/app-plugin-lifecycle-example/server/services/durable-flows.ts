import type { DatabaseManager } from '@nocobase/db';
import {
  LifecycleError,
  SYSTEM_ACTOR,
  type LifecycleRuntime,
} from '@nocobase/lifecycle';

import {
  planOf,
  saleItem,
  type DurableFlow,
  type VendorOutcome,
} from '../../shared/flows.js';
import { text } from '../../shared/text.js';
import { exportLifecycle } from '../lifecycles/export.js';
import { fulfilmentLifecycle } from '../lifecycles/fulfilment.js';
import { orderLifecycle } from '../lifecycles/order.js';
import { purchaseLifecycle } from '../lifecycles/purchase.js';
import { subscriptionLifecycle } from '../lifecycles/subscription.js';
import type {
  EmitInput,
  WebhookEventView,
  WebhookOutbox,
} from '../sandbox/outbox.js';
import {
  SandboxError,
  type CheckoutSession,
  type Sandbox,
  type StockLevel,
} from '../sandbox/sandbox.js';
import type { Plain } from '../tokens.js';
import type { Paging, PlainPage } from './lifecycle-example.js';

const COLLECTION: Readonly<Record<DurableFlow, string>> = {
  orders: orderLifecycle.collection,
  exports: exportLifecycle.collection,
  purchases: purchaseLifecycle.collection,
  fulfilments: fulfilmentLifecycle.collection,
  subscriptions: subscriptionLifecycle.collection,
};

export interface NewOrder {
  readonly customerId: string;
  readonly title: string;
  readonly amountCents: number;
  readonly failCheckouts: number;
  readonly failRefunds: number;
}

export interface NewExport {
  readonly title: string;
  readonly durationSeconds: number;
  readonly vendorOutcome: VendorOutcome;
}

export interface NewPurchase {
  readonly customerId: string;
  readonly sku: string;
  readonly quantity: number;
  readonly declineCharge: boolean;
  readonly failReleases: number;
}

export interface NewFulfilment {
  readonly title: string;
  readonly customerId: string;
}

export interface NewSubscription {
  readonly customerId: string;
  readonly plan: string;
  readonly cardDeclines: number;
}

export interface SweepResult {
  /** Transitions fired by triggers and renewals. */
  readonly fired: number;
  /** Webhook events delivered again after an error. */
  readonly redelivered: number;
}

function plain(row: Readonly<Record<string, unknown>>): Plain {
  const values: Plain = {};
  for (const [field, value] of Object.entries(row))
    values[field] = value instanceof Date ? value.toISOString() : value;
  return values;
}

/**
 * The durable flows' operations around the runtime, and the console that
 * lets a person act as the outside systems: pay on the provider's checkout,
 * send a warehouse's or a carrier's webhook now or later, deliver one again.
 * Every state change still goes through `runtime.fire()`, from an effect, a
 * trigger, the renewal sweep or the webhook receiver.
 */
export class DurableFlowService {
  public constructor(
    private readonly database: DatabaseManager,
    public readonly runtime: LifecycleRuntime,
    public readonly sandbox: Sandbox,
    public readonly outbox: WebhookOutbox,
    private readonly clock: () => Date = (): Date => new Date(),
  ) {}

  /** Every record of the flow, newest first. */
  public async list(flow: DurableFlow, page: Paging): Promise<PlainPage> {
    const repository = this.database.repository(COLLECTION[flow]);
    const rows = await repository.findMany({
      sort: (sort) => sort.field('id').desc(),
      limit: page.pageSize,
      offset: (page.page - 1) * page.pageSize,
    });
    return { records: rows.map(plain), total: await repository.count() };
  }

  public parameters(flow: DurableFlow): object {
    return this.runtime.parameters(flow);
  }

  public createOrder(values: NewOrder, actor: string): Promise<Plain> {
    return this.create('orders', { ...values, paymentAttempt: 0 }, actor);
  }

  public createExport(values: NewExport, actor: string): Promise<Plain> {
    return this.create(
      'exports',
      { ...values, jobAttempt: 0, pollCount: 0 },
      actor,
    );
  }

  public createPurchase(values: NewPurchase, actor: string): Promise<Plain> {
    // The price is the shop's, not the request's.
    const price = saleItem(values.sku)?.priceCents ?? 0;
    return this.create(
      'purchases',
      {
        ...values,
        amountCents: price * values.quantity,
      },
      actor,
    );
  }

  public createFulfilment(
    values: NewFulfilment,
    actor: string,
  ): Promise<Plain> {
    return this.create('fulfilments', { ...values }, actor);
  }

  public createSubscription(
    values: NewSubscription,
    actor: string,
  ): Promise<Plain> {
    return this.create(
      'subscriptions',
      {
        ...values,
        priceCents: planOf(values.plan)?.priceCents ?? 0,
        periodCount: 0,
        dunningCount: 0,
      },
      actor,
    );
  }

  /**
   * Renews every active subscription whose period has ended. A trigger
   * cannot: it counts from the last transition and knows only the
   * parameters, while a renewal is due at the subscription's own time. The
   * key names the period, so two instances sweeping at once renew once.
   */
  public async renewDue(): Promise<number> {
    const now = this.clock().toISOString();
    const due = await this.database
      .repository(subscriptionLifecycle.collection)
      .findMany({
        filter: (f) =>
          f.and([
            f.string('status').eq('active'),
            f.date('currentPeriodEnd').notAfter(now),
          ]),
        sort: (sort) => sort.field('currentPeriodEnd').asc(),
        limit: 50,
      });
    let renewed = 0;
    for (const subscription of due) {
      try {
        const result = await this.runtime.fire(
          'subscriptions',
          text(subscription.id),
          'renew',
          {
            actor: SYSTEM_ACTOR,
            requestId: `renew:${text(subscription.id)}:p${text(subscription.periodCount)}`,
          },
        );
        if (!result.replayed) renewed += 1;
      } catch (error) {
        // Cancelled or renewed since it was read: no longer this sweep's.
        if (
          error instanceof LifecycleError &&
          [
            'INVALID_STATE',
            'GUARD_REJECTED',
            'CONFLICT',
            'REQUEST_REUSED',
          ].includes(error.code)
        )
          continue;
        throw error;
      }
    }
    return renewed;
  }

  /**
   * What the scheduled sweep does after the triggers, and what the page's
   * button does all at once: fire the triggers, renew what is due, and
   * deliver again the webhooks that were answered with an error.
   */
  public async sweep(): Promise<SweepResult> {
    const triggered = await this.runtime.runTriggers();
    const renewed = await this.renewDue();
    const redelivered = await this.outbox.redeliverDue();
    return { fired: triggered + renewed, redelivered };
  }

  // The sandbox console.

  /**
   * The customer pays, or the card is declined, on the provider's hosted
   * checkout of the order's current round; the provider then sends its
   * webhook, now or — held — whenever someone delivers it.
   */
  public async payCheckout(
    orderId: string,
    outcome: 'paid' | 'declined',
    hold: boolean,
  ): Promise<WebhookEventView> {
    const order = await this.database
      .repository(orderLifecycle.collection)
      .findOne({ filter: { id: Number(orderId) } });
    const sessionId = text(order?.paymentSessionId);
    if (!sessionId)
      throw new SandboxError(
        'SESSION_CLOSED',
        'The order has no checkout to pay.',
      );
    const session = await this.sandbox.payCheckout(sessionId, outcome);
    return this.outbox.emit({
      source: 'payments',
      type: outcome === 'paid' ? 'checkout.paid' : 'checkout.declined',
      recordId: orderId,
      data:
        outcome === 'paid'
          ? { sessionId, paymentRef: session.paymentRef ?? '' }
          : { sessionId, reason: 'Insufficient funds (simulated).' },
      hold,
    });
  }

  public checkout(sessionId: string): Promise<CheckoutSession> {
    return this.sandbox.checkout(sessionId);
  }

  public emit(input: EmitInput): Promise<WebhookEventView> {
    return this.outbox.emit(input);
  }

  public deliver(eventId: string): Promise<WebhookEventView> {
    return this.outbox.deliver(eventId);
  }

  public events(
    flow: DurableFlow,
    recordId: string,
  ): Promise<WebhookEventView[]> {
    return this.outbox.list(flow, recordId);
  }

  public stock(): Promise<StockLevel[]> {
    return this.sandbox.stock();
  }

  /**
   * Created through the lifecycle, so a record's history starts at its
   * creation, by `actor`: the signed-in user, as every person's step in
   * these flows is. The customer a record is for is a field like any other.
   */
  private async create(
    flow: DurableFlow,
    values: Plain,
    actor: string,
  ): Promise<Plain> {
    const { record } = await this.runtime.create(
      flow,
      { ...values, createdAt: this.clock().toISOString() },
      { actor: { id: actor } },
    );
    return { ...record };
  }
}

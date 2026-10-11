import { defineEffect, type EffectDefinition } from '@nocobase/lifecycle';

import type { OrderTypes } from './order.js';

/**
 * Opens the provider's hosted checkout for this round of payment. The key
 * names the round, so a retried attempt finds the session the first one
 * opened instead of opening a second, while paying again after a decline is
 * a new round with a new session.
 */
export const createCheckout: EffectDefinition<OrderTypes> =
  defineEffect<OrderTypes>({
    name: 'orders.createCheckout',
    retry: { attempts: 3, backoffMs: 2_000, factor: 2, maxMs: 10_000 },
    timeoutMs: 10_000,
    onSuccess: 'checkoutCreated',
    onFailure: 'checkoutFailed',
    async run({ record, services }) {
      // Counted per order, so checking out again gets past the outage.
      if (
        services.shouldFail(`order-checkout:${record.id}`, record.failCheckouts)
      )
        throw new Error('The payment provider is unavailable (simulated).');
      const session = await services.sandbox.createCheckout({
        idempotencyKey: `order-checkout:${record.id}:${record.paymentAttempt}`,
        orderId: String(record.id),
        amountCents: record.amountCents,
      });
      return { paymentSessionId: session.sessionId, checkoutUrl: session.url };
    },
  });

/**
 * Closes the open checkout of an order that will not be paid, so the
 * customer can no longer pay it. A session the customer paid a moment
 * earlier stays paid: its webhook is on the way, and `paidAfterCancel`
 * refunds it when it arrives.
 */
export const closeCheckout: EffectDefinition<OrderTypes> =
  defineEffect<OrderTypes>({
    name: 'orders.closeCheckout',
    retry: { attempts: 5, backoffMs: 2_000, factor: 2, maxMs: 30_000 },
    async run({ record, services }) {
      if (!record.paymentSessionId) return { session: null };
      const session = await services.sandbox.expireCheckout(
        record.paymentSessionId,
      );
      return { session: session.sessionId, status: session.status };
    },
  });

/**
 * Gives the money back. Keyed by the order and its payment rather than by
 * this run: an operator's retry after the refund failed is a new run, and
 * must not refund twice if an earlier attempt went through and only its
 * answer was lost.
 */
export const refund: EffectDefinition<OrderTypes> = defineEffect<OrderTypes>({
  name: 'orders.refund',
  retry: { attempts: 3, backoffMs: 2_000, factor: 2, maxMs: 10_000 },
  timeoutMs: 10_000,
  onSuccess: 'refunded',
  onFailure: 'refundFailed',
  async run({ record, services }) {
    const key = `order-refund:${record.id}:${record.paymentRef}`;
    if (services.shouldFail(key, record.failRefunds))
      throw new Error('The refund service is unavailable (simulated).');
    return services.sandbox.refund({
      idempotencyKey: key,
      paymentRef: String(record.paymentRef),
      amountCents: record.amountCents,
    });
  },
});

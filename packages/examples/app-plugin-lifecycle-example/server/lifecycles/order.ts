import {
  defineLifecycle,
  type InputProblem,
  type Lifecycle,
  type LifecycleRecord,
} from '@nocobase/lifecycle';

import { LIFECYCLE_EXAMPLE_COLLECTIONS } from '../scope.js';
import {
  customerProblems,
  errorText,
  required,
  type FlowServices,
} from './flow-services.js';
import { closeCheckout, createCheckout, refund } from './order.effects.js';

export type OrderState =
  | 'draft'
  | 'creatingCheckout'
  | 'awaitingPayment'
  | 'paymentFailed'
  | 'paid'
  | 'cancelled'
  | 'refunding'
  | 'refundNeedsAttention'
  | 'fulfilled'
  | 'refunded';

export interface Order extends LifecycleRecord {
  readonly title: string;
  readonly customerId: string;
  readonly amountCents: number;
  readonly paymentAttempt: number;
  readonly paymentSessionId: string | null;
  readonly paymentRef: string | null;
  readonly status: OrderState;
  readonly statusChangedAt: string;
  /** How many checkout attempts fail on purpose, counted per order. */
  readonly failCheckouts: number;
  /** How many refund attempts fail on purpose. */
  readonly failRefunds: number;
}

export interface OrderTypes {
  record: Order;
  state: OrderState;
  parameters: { paymentWindowMinutes: number };
  services: FlowServices;
}

function orderProblems(
  values: Readonly<Record<string, unknown>>,
): InputProblem[] {
  const amount = Number(values.amountCents);
  return [
    ...customerProblems(values),
    ...required(values, 'title', 'Name what is being bought.'),
    ...(Number.isSafeInteger(amount) && amount > 0
      ? []
      : [{ field: 'amountCents', message: 'The amount must be more than 0.' }]),
  ];
}

/**
 * An order paid on the payment provider's hosted checkout. The page cannot
 * know whether the customer paid; the provider says so later, in a webhook,
 * and that is what moves the order on. While it waits the order is only a
 * state — nothing runs, nothing holds a connection — so a restart, a
 * webhook delivered twice, one that arrives before the checkout is even
 * recorded, or one that arrives after the order was cancelled, each end in
 * exactly one well-defined place.
 */
export const orderLifecycle: Lifecycle<OrderTypes> =
  defineLifecycle<OrderTypes>({
    name: 'orders',
    collection: LIFECYCLE_EXAMPLE_COLLECTIONS.orders,
    initial: 'draft',
    create: { validate: orderProblems },
    states: [
      'draft',
      'creatingCheckout',
      'awaitingPayment',
      'paymentFailed',
      'paid',
      // Not final: a payment the customer made just before the order was
      // cancelled still arrives, and has to be refunded from here.
      'cancelled',
      'refunding',
      'refundNeedsAttention',
      { name: 'fulfilled', final: true },
      { name: 'refunded', final: true },
    ],
    // A real shop waits half an hour or more; the example a few minutes.
    parameters: { paymentWindowMinutes: 3 },
    transitions: {
      checkout: {
        title: '去付款',
        from: ['draft', 'paymentFailed'],
        to: 'creatingCheckout',
        // A new round: its own key, so the provider opens a new session.
        set: ({ record }) => ({
          paymentAttempt: record.paymentAttempt + 1,
          paymentSessionId: null,
          checkoutUrl: null,
          lastError: null,
        }),
      },
      checkoutCreated: {
        title: '收银台已创建',
        // Only the effect's success reaches this, never a click.
        manual: false,
        from: 'creatingCheckout',
        to: 'awaitingPayment',
        accept: ['paymentSessionId', 'checkoutUrl'],
      },
      checkoutFailed: {
        title: '收银台创建失败',
        manual: false,
        from: 'creatingCheckout',
        to: 'paymentFailed',
        set: ({ input }) => ({ lastError: errorText(input) }),
      },
      paymentSucceeded: {
        title: '支付成功',
        // The provider's webhook. It can overtake the effect that opened the
        // checkout, so it is accepted while that effect's success is still
        // being recorded; that success then finds the order paid and is
        // dropped, because the stay it belonged to is over.
        manual: false,
        from: ['creatingCheckout', 'awaitingPayment'],
        to: 'paid',
        accept: ['paymentRef'],
        set: () => ({ lastError: null }),
      },
      paymentDeclined: {
        title: '支付被拒',
        manual: false,
        from: ['creatingCheckout', 'awaitingPayment'],
        to: 'paymentFailed',
        set: ({ input }) => ({ lastError: errorText(input) }),
      },
      paidAfterCancel: {
        title: '取消后到账',
        // The same webhook, for an order that was cancelled or expired in
        // the meantime: the money arrived anyway, so it goes back.
        manual: false,
        from: 'cancelled',
        to: 'refunding',
        accept: ['paymentRef'],
      },
      cancel: {
        title: '取消订单',
        from: ['draft', 'awaitingPayment', 'paymentFailed'],
        to: 'cancelled',
        set: () => ({ cancelReason: 'customer' }),
        effects: [closeCheckout],
      },
      expire: {
        title: '超时关闭',
        manual: false,
        from: ['awaitingPayment', 'paymentFailed'],
        to: 'cancelled',
        set: () => ({ cancelReason: 'timeout' }),
        effects: [closeCheckout],
      },
      ship: {
        title: '发货',
        from: 'paid',
        to: 'fulfilled',
      },
      refundOrder: {
        title: '退款',
        from: 'paid',
        to: 'refunding',
        set: () => ({ cancelReason: 'refundRequested' }),
      },
      refunded: {
        title: '退款完成',
        manual: false,
        from: 'refunding',
        to: 'refunded',
        accept: ['refundRef'],
        set: () => ({ lastError: null }),
      },
      refundFailed: {
        title: '退款失败',
        manual: false,
        from: 'refunding',
        to: 'refundNeedsAttention',
        set: ({ input }) => ({ lastError: errorText(input) }),
      },
      retryRefund: {
        title: '重试退款',
        from: 'refundNeedsAttention',
        to: 'refunding',
      },
    },
    onEnter: {
      creatingCheckout: [createCheckout],
      refunding: [refund],
    },
    triggers: {
      expireUnpaid: {
        transition: 'expire',
        when: ['awaitingPayment', 'paymentFailed'],
        after: ({ paymentWindowMinutes }) => paymentWindowMinutes * 60_000,
      },
    },
  });

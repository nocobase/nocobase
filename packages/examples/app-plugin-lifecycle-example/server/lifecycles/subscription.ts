import {
  defineEffect,
  defineLifecycle,
  EffectFailure,
  type EffectDefinition,
  type Lifecycle,
  type LifecycleRecord,
} from '@nocobase/lifecycle';

import { planOf } from '../../shared/flows.js';
import { SandboxError } from '../sandbox/sandbox.js';
import { LIFECYCLE_EXAMPLE_COLLECTIONS } from '../scope.js';
import {
  customerProblems,
  errorText,
  millis,
  type FlowServices,
} from './flow-services.js';

export type SubscriptionState = 'renewing' | 'active' | 'pastDue' | 'cancelled';

export interface Subscription extends LifecycleRecord {
  readonly customerId: string;
  readonly plan: string;
  readonly priceCents: number;
  readonly currentPeriodEnd: string | null;
  readonly periodCount: number;
  readonly dunningCount: number;
  /** How many of the next charges the card declines. */
  readonly cardDeclines: number;
  readonly status: SubscriptionState;
  readonly statusChangedAt: string;
}

export interface SubscriptionTypes {
  record: Subscription;
  state: SubscriptionState;
  parameters: {
    periodMinutes: number;
    dunningMinutes: number;
    maxDunning: number;
  };
  services: FlowServices;
}

/**
 * Charges the period that is due. The key names the period and the try
 * within it: a retried attempt of one try reuses it, so a lost answer
 * never charges twice, while the next dunning try is a new charge. Once a
 * period is paid the subscription moves to the next period, so no key of
 * a paid period is ever charged again.
 */
const chargeSubscription: EffectDefinition<SubscriptionTypes> =
  defineEffect<SubscriptionTypes>({
    name: 'subscriptions.charge',
    retry: { attempts: 3, backoffMs: 2_000, factor: 2 },
    timeoutMs: 10_000,
    onSuccess: 'charged',
    onFailure: 'chargeFailed',
    async run({ record, services }) {
      try {
        return await services.sandbox.charge({
          idempotencyKey: `subscription-charge:${record.id}:p${record.periodCount}:t${record.dunningCount}`,
          amountCents: record.priceCents,
          decline: services.shouldFail(
            `subscription-card:${record.id}`,
            record.cardDeclines,
          ),
        });
      } catch (error) {
        if (error instanceof SandboxError && error.code === 'CARD_DECLINED')
          throw new EffectFailure('cardDeclined', error.message);
        throw error;
      }
    },
  });

/**
 * A subscription that charges every period, for as long as it lives. It
 * moves round `active → renewing → active` once a period, so its history
 * is the billing history. Renewal is due at the subscription's own
 * `currentPeriodEnd`, which a trigger cannot express — a trigger counts
 * from the last transition and knows only the parameters — so the plugin's
 * sweep selects the due subscriptions and fires `renew` on each. A declined
 * charge leaves it `pastDue`, and the `dunning` trigger tries again until
 * it gives up and cancels.
 */
export const subscriptionLifecycle: Lifecycle<SubscriptionTypes> =
  defineLifecycle<SubscriptionTypes>({
    name: 'subscriptions',
    collection: LIFECYCLE_EXAMPLE_COLLECTIONS.subscriptions,
    // The first period is charged as soon as the subscription exists.
    initial: 'renewing',
    create: {
      validate: (values) => [
        ...customerProblems(values),
        ...(planOf(values.plan)
          ? []
          : [{ field: 'plan', message: 'Choose a plan.' }]),
      ],
    },
    states: [
      'renewing',
      'active',
      'pastDue',
      { name: 'cancelled', final: true },
    ],
    // Periods of minutes rather than months, so a renewal can be watched.
    parameters: { periodMinutes: 3, dunningMinutes: 1, maxDunning: 3 },
    transitions: {
      charged: {
        title: '扣款成功',
        manual: false,
        from: 'renewing',
        to: 'active',
        // The next period starts where this one ended, or now if it ended
        // long ago, after the subscription was past due.
        set: ({ record, input, now, parameters }) => {
          const ended = millis(record.currentPeriodEnd) || 0;
          const start = Math.max(now.getTime(), ended);
          return {
            currentPeriodEnd: new Date(
              start + parameters.periodMinutes * 60_000,
            ).toISOString(),
            periodCount: record.periodCount + 1,
            dunningCount: 0,
            lastChargeRef:
              typeof input.chargeRef === 'string' ? input.chargeRef : null,
            lastError: null,
          };
        },
      },
      chargeFailed: {
        title: '扣款失败',
        manual: false,
        from: 'renewing',
        to: 'pastDue',
        set: ({ record, input }) => ({
          dunningCount: record.dunningCount + 1,
          lastError: errorText(input),
        }),
      },
      renew: {
        title: '到期续费',
        manual: false,
        from: 'active',
        to: 'renewing',
        guard: ({ record, now }) =>
          millis(record.currentPeriodEnd) <= now.getTime() || {
            code: 'periodNotOver',
            message: 'The current period has not ended yet.',
            kind: 'precondition',
          },
      },
      retryCharge: {
        title: '催缴重试',
        manual: false,
        from: 'pastDue',
        to: ['renewing', 'cancelled'],
        route: ({ record, parameters }) =>
          record.dunningCount >= parameters.maxDunning
            ? 'cancelled'
            : 'renewing',
        set: ({ to }) => (to === 'cancelled' ? { cancelReason: 'unpaid' } : {}),
      },
      updateCard: {
        title: '更换银行卡',
        from: 'pastDue',
        to: 'renewing',
        // The example's card: a new one declines nothing.
        set: () => ({ cardDeclines: 0 }),
      },
      cancel: {
        title: '退订',
        from: ['active', 'pastDue'],
        to: 'cancelled',
        set: () => ({ cancelReason: 'customer' }),
      },
    },
    onEnter: { renewing: [chargeSubscription] },
    triggers: {
      dunning: {
        transition: 'retryCharge',
        when: 'pastDue',
        after: ({ dunningMinutes }) => dunningMinutes * 60_000,
      },
    },
  });

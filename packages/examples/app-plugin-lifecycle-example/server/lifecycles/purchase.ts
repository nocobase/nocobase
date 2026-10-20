import {
  defineLifecycle,
  type InputProblem,
  type Lifecycle,
  type LifecycleRecord,
} from '@nocobase/lifecycle';

import { saleItem } from '../../shared/flows.js';
import { LIFECYCLE_EXAMPLE_COLLECTIONS } from '../scope.js';
import {
  customerProblems,
  errorText,
  type FlowServices,
} from './flow-services.js';
import { chargeCard, releaseStock, reserveStock } from './purchase.effects.js';

export type PurchaseState =
  | 'draft'
  | 'reserving'
  | 'charging'
  | 'releasing'
  | 'compensationNeedsAttention'
  | 'confirmed'
  | 'cancelled';

export interface Purchase extends LifecycleRecord {
  readonly customerId: string;
  readonly sku: string;
  readonly quantity: number;
  readonly amountCents: number;
  readonly reservationId: string | null;
  readonly declineCharge: boolean;
  readonly failReleases: number;
  readonly status: PurchaseState;
  readonly statusChangedAt: string;
}

export interface PurchaseTypes {
  record: Purchase;
  state: PurchaseState;
  services: FlowServices;
}

function purchaseProblems(
  values: Readonly<Record<string, unknown>>,
): InputProblem[] {
  const quantity = Number(values.quantity);
  return [
    ...customerProblems(values),
    ...(saleItem(values.sku)
      ? []
      : [{ field: 'sku', message: 'Choose an item.' }]),
    ...(Number.isInteger(quantity) && quantity >= 1 && quantity <= 5
      ? []
      : [{ field: 'quantity', message: 'Buy between 1 and 5.' }]),
  ];
}

/**
 * A flash-sale purchase that spans two systems: the warehouse holds the
 * units, then the payment provider takes the money. Neither can be rolled
 * back with the database, so when the charge is refused the reservation is
 * undone by a step of its own — `releasing` — rather than in a `catch`
 * somewhere. Every step is a state with one effect: which step is under
 * way, and which compensation is still owed, is always the record's state.
 * A compensation that keeps failing stops in a state a person looks at.
 */
export const purchaseLifecycle: Lifecycle<PurchaseTypes> =
  defineLifecycle<PurchaseTypes>({
    name: 'purchases',
    collection: LIFECYCLE_EXAMPLE_COLLECTIONS.purchases,
    initial: 'draft',
    create: { validate: purchaseProblems },
    states: [
      'draft',
      'reserving',
      'charging',
      'releasing',
      'compensationNeedsAttention',
      { name: 'confirmed', final: true },
      { name: 'cancelled', final: true },
    ],
    transitions: {
      submit: {
        title: '下单',
        from: 'draft',
        to: 'reserving',
      },
      abandon: {
        title: '放弃',
        from: 'draft',
        to: 'cancelled',
        set: () => ({ cancelReason: 'customer' }),
      },
      stockReserved: {
        title: '库存已锁定',
        manual: false,
        from: 'reserving',
        to: 'charging',
        accept: ['reservationId'],
      },
      stockUnavailable: {
        title: '库存不足',
        manual: false,
        from: 'reserving',
        to: 'cancelled',
        set: ({ input }) => ({
          cancelReason: 'outOfStock',
          lastError: errorText(input),
        }),
      },
      charged: {
        title: '扣款成功',
        manual: false,
        from: 'charging',
        to: 'confirmed',
        accept: ['paymentRef'],
      },
      chargeFailed: {
        title: '扣款失败，开始补偿',
        manual: false,
        from: 'charging',
        to: 'releasing',
        set: ({ input }) => ({
          cancelReason: 'paymentDeclined',
          lastError: errorText(input),
        }),
      },
      stockReleased: {
        title: '库存已释放',
        manual: false,
        from: 'releasing',
        to: 'cancelled',
      },
      releaseFailed: {
        title: '补偿失败',
        manual: false,
        from: 'releasing',
        to: 'compensationNeedsAttention',
        set: ({ input }) => ({ lastError: errorText(input) }),
      },
      retryRelease: {
        title: '重试补偿',
        from: 'compensationNeedsAttention',
        to: 'releasing',
      },
    },
    onEnter: {
      reserving: [reserveStock],
      charging: [chargeCard],
      releasing: [releaseStock],
    },
  });

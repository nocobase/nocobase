import {
  defineEffect,
  defineLifecycle,
  type EffectDefinition,
  type InputProblem,
  type Lifecycle,
  type LifecycleRecord,
} from '@nocobase/lifecycle';

import { CARRIER_STATUSES } from '../../shared/flows.js';
import { text } from '../../shared/text.js';
import { LIFECYCLE_EXAMPLE_COLLECTIONS } from '../scope.js';
import {
  customerProblems,
  millis,
  required,
  type FlowServices,
} from './flow-services.js';

export type FulfilmentState =
  | 'preparing'
  | 'readyToShip'
  | 'booking'
  | 'shipped'
  | 'exception'
  | 'delivered'
  | 'cancelled';

export interface Fulfilment extends LifecycleRecord {
  readonly title: string;
  readonly customerId: string;
  readonly paidAt: string | null;
  readonly pickedAt: string | null;
  readonly carrierEventAt: string | null;
  readonly status: FulfilmentState;
  readonly statusChangedAt: string;
}

export interface FulfilmentTypes {
  record: Fulfilment;
  state: FulfilmentState;
  services: FlowServices;
}

/** Books the carrier's pickup, once per shipment, and records the tracking number. */
const bookCarrier: EffectDefinition<FulfilmentTypes> =
  defineEffect<FulfilmentTypes>({
    name: 'fulfilments.bookCarrier',
    retry: { attempts: 5, backoffMs: 2_000, factor: 2, maxMs: 30_000 },
    timeoutMs: 10_000,
    onSuccess: 'booked',
    run: ({ record, services }) =>
      services.sandbox.bookShipment({
        idempotencyKey: `fulfilment-shipment:${record.id}`,
        fulfilmentId: String(record.id),
      }),
  });

function trackingProblems(input: Readonly<Record<string, unknown>>) {
  const problems: InputProblem[] = [];
  if (!(CARRIER_STATUSES as readonly string[]).includes(text(input.status)))
    problems.push({ field: 'status', message: 'Unknown carrier status.' });
  if (Number.isNaN(Date.parse(text(input.occurredAt))))
    problems.push({
      field: 'occurredAt',
      message: 'The event needs the time it happened.',
    });
  return problems;
}

/**
 * The carrier's events, applied only when they are newer than the newest
 * one applied. A webhook does not arrive in the order things happened; the
 * time the carrier says it happened does. An older event is refused as a
 * precondition, which the receiver acknowledges and drops.
 */
function newerEvent({
  record,
  input,
}: {
  readonly record: Fulfilment;
  readonly input: Readonly<Record<string, unknown>>;
}) {
  const at = Date.parse(text(input.occurredAt));
  const last = millis(record.carrierEventAt);
  return (
    Number.isNaN(last) ||
    at > last || {
      code: 'staleCarrierEvent',
      message: 'A newer carrier event has already been applied.',
      kind: 'precondition' as const,
    }
  );
}

/**
 * A shipment that waits for two signals from two systems — the payment
 * provider's capture and the warehouse's pick — in whichever order they
 * come, then follows the carrier's tracking. Each signal is a transition
 * that writes its own fact and routes on the other's: the second to arrive
 * finds the first already on the record and moves on, and of two arriving
 * at once one commits and the other meets a conflict, is answered with an
 * error, and is delivered again by its sender.
 */
export const fulfilmentLifecycle: Lifecycle<FulfilmentTypes> =
  defineLifecycle<FulfilmentTypes>({
    name: 'fulfilments',
    collection: LIFECYCLE_EXAMPLE_COLLECTIONS.fulfilments,
    initial: 'preparing',
    create: {
      validate: (values) => [
        ...required(values, 'title', 'Name the shipment.'),
        ...customerProblems(values),
      ],
    },
    states: [
      'preparing',
      'readyToShip',
      'booking',
      'shipped',
      'exception',
      { name: 'delivered', final: true },
      { name: 'cancelled', final: true },
    ],
    transitions: {
      paymentCaptured: {
        title: '支付已确认',
        manual: false,
        from: 'preparing',
        to: ['preparing', 'readyToShip'],
        guard: ({ record }) =>
          !record.paidAt || {
            code: 'alreadyPaid',
            message: 'The payment has already been confirmed.',
            kind: 'precondition',
          },
        route: ({ record }) => (record.pickedAt ? 'readyToShip' : 'preparing'),
        accept: ['paymentRef'],
        set: ({ now }) => ({ paidAt: now.toISOString() }),
      },
      picked: {
        title: '仓库已拣货',
        manual: false,
        from: 'preparing',
        to: ['preparing', 'readyToShip'],
        guard: ({ record }) =>
          !record.pickedAt || {
            code: 'alreadyPicked',
            message: 'The warehouse has already picked it.',
            kind: 'precondition',
          },
        route: ({ record }) => (record.paidAt ? 'readyToShip' : 'preparing'),
        set: ({ input, now }) => ({
          pickedAt: now.toISOString(),
          pickedBy: text(input.picker) || null,
        }),
      },
      ship: {
        title: '交给承运商',
        from: 'readyToShip',
        to: 'booking',
      },
      booked: {
        title: '已揽收',
        manual: false,
        from: 'booking',
        to: 'shipped',
        accept: ['trackingNumber'],
        set: () => ({ carrierStatus: 'booked' }),
      },
      trackingUpdated: {
        title: '物流更新',
        manual: false,
        from: ['shipped', 'exception'],
        to: ['shipped', 'exception', 'delivered'],
        validate: trackingProblems,
        guard: newerEvent,
        route: ({ input }) =>
          input.status === 'delivered'
            ? 'delivered'
            : input.status === 'exception'
              ? 'exception'
              : 'shipped',
        set: ({ input }) => ({
          carrierStatus: text(input.status),
          carrierLocation: text(input.location) || null,
          carrierEventAt: new Date(text(input.occurredAt)).toISOString(),
        }),
      },
      cancel: {
        title: '取消发货',
        from: ['preparing', 'readyToShip'],
        to: 'cancelled',
      },
    },
    onEnter: { booking: [bookCarrier] },
  });

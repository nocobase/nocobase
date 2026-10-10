import {
  defineEffect,
  EffectFailure,
  type EffectDefinition,
} from '@nocobase/lifecycle';

import { SandboxError } from '../sandbox/sandbox.js';
import type { PurchaseTypes } from './purchase.js';

/**
 * An answer from the outside — an empty shelf, a declined card — fails the
 * step at once with a code; anything else is an outage worth retrying.
 */
function answered(error: unknown, code: SandboxError['code'], as: string) {
  if (error instanceof SandboxError && error.code === code)
    return new EffectFailure(as, error.message);
  return error;
}

/** Step one: hold the units in the warehouse. */
export const reserveStock: EffectDefinition<PurchaseTypes> =
  defineEffect<PurchaseTypes>({
    name: 'purchases.reserveStock',
    retry: { attempts: 3, backoffMs: 2_000, factor: 2 },
    timeoutMs: 10_000,
    onSuccess: 'stockReserved',
    onFailure: 'stockUnavailable',
    async run({ record, services }) {
      try {
        return await services.sandbox.reserve({
          idempotencyKey: `purchase-reserve:${record.id}`,
          sku: record.sku,
          quantity: record.quantity,
        });
      } catch (error) {
        throw answered(error, 'OUT_OF_STOCK', 'outOfStock');
      }
    },
  });

/** Step two: take the money. A declined card is final; the purchase is undone. */
export const chargeCard: EffectDefinition<PurchaseTypes> =
  defineEffect<PurchaseTypes>({
    name: 'purchases.chargeCard',
    retry: { attempts: 3, backoffMs: 2_000, factor: 2 },
    timeoutMs: 10_000,
    onSuccess: 'charged',
    onFailure: 'chargeFailed',
    async run({ record, services }) {
      try {
        const { chargeRef } = await services.sandbox.charge({
          idempotencyKey: `purchase-charge:${record.id}`,
          amountCents: record.amountCents,
          decline: record.declineCharge,
        });
        return { paymentRef: chargeRef };
      } catch (error) {
        throw answered(error, 'CARD_DECLINED', 'cardDeclined');
      }
    },
  });

/**
 * The compensation for step one: give the units back. It is a step of its
 * own, in a state of its own, so a crash halfway through undoing leaves the
 * purchase in `releasing` with the release still owed — not cancelled with
 * the stock still held. Releasing twice gives back once.
 */
export const releaseStock: EffectDefinition<PurchaseTypes> =
  defineEffect<PurchaseTypes>({
    name: 'purchases.releaseStock',
    retry: { attempts: 3, backoffMs: 2_000, factor: 2 },
    timeoutMs: 10_000,
    onSuccess: 'stockReleased',
    onFailure: 'releaseFailed',
    async run({ record, services }) {
      // Counted per purchase, so an operator's retry gets past the outage.
      if (
        services.shouldFail(
          `purchase-release:${record.id}`,
          record.failReleases,
        )
      )
        throw new Error('The warehouse is unavailable (simulated).');
      return services.sandbox.release(String(record.reservationId));
    },
  });

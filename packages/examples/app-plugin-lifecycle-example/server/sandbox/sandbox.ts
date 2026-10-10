import { createHash } from 'node:crypto';

import { SALE_ITEMS, type VendorOutcome } from '../../shared/flows.js';
import type { SandboxData, SandboxObject, SandboxObjects } from './objects.js';

/**
 * A refusal from a simulated system, with a stable code. Effects turn the
 * ones that are answers rather than outages — a declined card, an empty
 * shelf — into an `EffectFailure`, which is not retried.
 */
export class SandboxError extends Error {
  public constructor(
    public readonly code:
      'CARD_DECLINED' | 'OUT_OF_STOCK' | 'SESSION_CLOSED' | 'NOT_FOUND',
    message: string,
  ) {
    super(message);
    this.name = 'SandboxError';
  }
}

export type CheckoutStatus = 'open' | 'paid' | 'declined' | 'expired';

export interface CheckoutSession {
  readonly sessionId: string;
  readonly status: CheckoutStatus;
  readonly orderId: string;
  readonly amountCents: number;
  readonly url: string;
  /** Set once the customer paid. */
  readonly paymentRef: string | null;
}

export type VendorJobStatus = 'running' | 'succeeded' | 'failed' | 'cancelled';

export interface VendorJob {
  readonly jobId: string;
  readonly status: VendorJobStatus;
  /** 0–100. */
  readonly progress: number;
  readonly url: string | null;
  readonly error: string | null;
}

export interface StockLevel {
  readonly sku: string;
  readonly available: number;
  /** Units held by reservations not yet released. */
  readonly reserved: number;
}

/** A short id derived from an idempotency key: the same call names the same object. */
function idFrom(prefix: string, idempotencyKey: string): string {
  return `${prefix}_${createHash('sha256').update(idempotencyKey).digest('hex').slice(0, 12)}`;
}

function number(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function string(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** How often a conditional update is tried again after a concurrent one wrote first. */
const UPDATE_ATTEMPTS = 5;

/**
 * The outside world of the durable flows, small enough to read: a payment
 * provider with hosted checkouts, charges and refunds; a warehouse with
 * stock and reservations; a vendor that renders exports slowly and has no
 * webhook; and a carrier that books shipments. Every call that creates
 * something takes an idempotency key and answers what the first call with
 * that key made, which is the contract the lifecycle's effects rely on.
 */
export class Sandbox {
  public constructor(private readonly objects: SandboxObjects) {}

  // The payment provider.

  /** Opens a hosted checkout for an order, once per key. */
  public async createCheckout(input: {
    readonly idempotencyKey: string;
    readonly orderId: string;
    readonly amountCents: number;
  }): Promise<CheckoutSession> {
    const sessionId = idFrom('cs', input.idempotencyKey);
    const object = await this.objects.insert('checkout', sessionId, 'open', {
      orderId: input.orderId,
      amountCents: input.amountCents,
      paymentRef: null,
    });
    return this.session(object);
  }

  public async checkout(sessionId: string): Promise<CheckoutSession> {
    return this.session(await this.required('checkout', sessionId));
  }

  /**
   * The customer pays, or the card is declined, on the hosted page. Only an
   * open session can be paid: an expired one refuses, which is what closing
   * it on cancellation is for.
   */
  public async payCheckout(
    sessionId: string,
    outcome: 'paid' | 'declined',
  ): Promise<CheckoutSession> {
    for (let attempt = 0; attempt < UPDATE_ATTEMPTS; attempt += 1) {
      const object = await this.required('checkout', sessionId);
      if (object.status !== 'open')
        throw new SandboxError(
          'SESSION_CLOSED',
          `The checkout session is ${object.status}.`,
        );
      const data =
        outcome === 'paid'
          ? { ...object.data, paymentRef: idFrom('pi', sessionId) }
          : object.data;
      if (await this.objects.update(object, { status: outcome, data }))
        return this.checkout(sessionId);
    }
    throw new Error('The checkout session kept changing.');
  }

  /**
   * Closes an open session so it can no longer be paid. One the customer
   * already paid stays paid: the answer says so, and the payment's webhook
   * is still on its way.
   */
  public async expireCheckout(sessionId: string): Promise<CheckoutSession> {
    for (let attempt = 0; attempt < UPDATE_ATTEMPTS; attempt += 1) {
      const object = await this.required('checkout', sessionId);
      if (object.status !== 'open') return this.session(object);
      if (await this.objects.update(object, { status: 'expired' }))
        return this.checkout(sessionId);
    }
    throw new Error('The checkout session kept changing.');
  }

  /** Charges a saved card, once per key. A declined charge stays declined under its key. */
  public async charge(input: {
    readonly idempotencyKey: string;
    readonly amountCents: number;
    readonly decline: boolean;
  }): Promise<{ readonly chargeRef: string }> {
    const chargeRef = idFrom('ch', input.idempotencyKey);
    const object = await this.objects.insert(
      'charge',
      chargeRef,
      input.decline ? 'declined' : 'succeeded',
      { amountCents: input.amountCents },
    );
    if (object.status === 'declined')
      throw new SandboxError('CARD_DECLINED', 'The card was declined.');
    return { chargeRef };
  }

  /** Refunds a payment, once per key. */
  public async refund(input: {
    readonly idempotencyKey: string;
    readonly paymentRef: string;
    readonly amountCents: number;
  }): Promise<{ readonly refundRef: string }> {
    const refundRef = idFrom('re', input.idempotencyKey);
    await this.objects.insert('refund', refundRef, 'succeeded', {
      paymentRef: input.paymentRef,
      amountCents: input.amountCents,
    });
    return { refundRef };
  }

  // The warehouse.

  public async stock(): Promise<StockLevel[]> {
    const levels = await Promise.all(
      SALE_ITEMS.map((item) => this.stockObject(item.sku)),
    );
    const reservations = await this.objects.list('reservation');
    return levels.map((level) => ({
      sku: level.key,
      available: number(level.data.available),
      reserved: reservations
        .filter(
          (reservation) =>
            reservation.status === 'held' && reservation.data.sku === level.key,
        )
        .reduce(
          (sum, reservation) => sum + number(reservation.data.quantity),
          0,
        ),
    }));
  }

  /** Holds units of an item, once per key; refuses when there are not enough. */
  public async reserve(input: {
    readonly idempotencyKey: string;
    readonly sku: string;
    readonly quantity: number;
  }): Promise<{ readonly reservationId: string }> {
    const reservationId = idFrom('rs', input.idempotencyKey);
    await this.stockObject(input.sku);
    for (let attempt = 0; attempt < UPDATE_ATTEMPTS; attempt += 1) {
      const done = await this.objects.transaction(async (objects) => {
        if (await objects.find('reservation', reservationId)) return true;
        const stock = await objects.find('stock', input.sku);
        const available = number(stock?.data.available);
        if (!stock || available < input.quantity)
          throw new SandboxError(
            'OUT_OF_STOCK',
            `Only ${available} left of ${input.sku}.`,
          );
        // The stock and the reservation commit together.
        if (
          !(await objects.update(stock, {
            data: { available: available - input.quantity },
          }))
        )
          return false;
        await objects.insert('reservation', reservationId, 'held', {
          sku: input.sku,
          quantity: input.quantity,
        });
        return true;
      });
      if (done) return { reservationId };
    }
    throw new Error('The stock kept changing.');
  }

  /** Gives reserved units back. Releasing twice gives them back once. */
  public async release(
    reservationId: string,
  ): Promise<{ readonly released: boolean }> {
    for (let attempt = 0; attempt < UPDATE_ATTEMPTS; attempt += 1) {
      const done = await this.objects.transaction(async (objects) => {
        const reservation = await objects.find('reservation', reservationId);
        if (!reservation)
          throw new SandboxError(
            'NOT_FOUND',
            `No reservation "${reservationId}".`,
          );
        if (reservation.status === 'released') return 'already';
        const sku = string(reservation.data.sku);
        const stock = await objects.find('stock', sku);
        if (!stock) throw new SandboxError('NOT_FOUND', `No stock "${sku}".`);
        if (
          !(await objects.update(stock, {
            data: {
              available:
                number(stock.data.available) +
                number(reservation.data.quantity),
            },
          })) ||
          !(await objects.update(reservation, { status: 'released' }))
        )
          return undefined;
        return 'released';
      });
      if (done) return { released: done === 'released' };
    }
    throw new Error('The stock kept changing.');
  }

  // The vendor, which has no webhook: its jobs are polled.

  /** Starts rendering an export, once per key. */
  public async startJob(input: {
    readonly idempotencyKey: string;
    readonly durationSeconds: number;
    readonly outcome: VendorOutcome;
  }): Promise<{ readonly jobId: string }> {
    const jobId = idFrom('job', input.idempotencyKey);
    await this.objects.insert('job', jobId, 'running', {
      startedAt: this.objects.now().toISOString(),
      durationSeconds: input.durationSeconds,
      outcome: input.outcome,
    });
    return { jobId };
  }

  /**
   * Where a job stands, worked out from when it started: a vendor that
   * takes its time, then succeeds, fails, or never gets past 60%.
   */
  public async job(jobId: string): Promise<VendorJob> {
    return this.vendorJob(await this.required('job', jobId));
  }

  public async cancelJob(jobId: string): Promise<VendorJob> {
    for (let attempt = 0; attempt < UPDATE_ATTEMPTS; attempt += 1) {
      const object = await this.required('job', jobId);
      const current = this.vendorJob(object);
      if (current.status !== 'running') return current;
      if (await this.objects.update(object, { status: 'cancelled' }))
        return this.job(jobId);
    }
    throw new Error('The job kept changing.');
  }

  // The carrier.

  /** Books a pickup, once per key, and answers the tracking number. */
  public async bookShipment(input: {
    readonly idempotencyKey: string;
    readonly fulfilmentId: string;
  }): Promise<{ readonly trackingNumber: string }> {
    const key = idFrom('sf', input.idempotencyKey);
    const trackingNumber = `SF${String(parseInt(key.slice(3, 13), 16))
      .padStart(12, '0')
      .slice(-12)}`;
    await this.objects.insert('shipment', key, 'booked', {
      fulfilmentId: input.fulfilmentId,
      trackingNumber,
    });
    return { trackingNumber };
  }

  private async required(kind: string, key: string): Promise<SandboxObject> {
    const object = await this.objects.find(kind, key);
    if (!object) throw new SandboxError('NOT_FOUND', `No ${kind} "${key}".`);
    return object;
  }

  private async stockObject(sku: string): Promise<SandboxObject> {
    const item = SALE_ITEMS.find((candidate) => candidate.sku === sku);
    if (!item) throw new SandboxError('NOT_FOUND', `No item "${sku}".`);
    return this.objects.insert('stock', sku, 'active', {
      available: item.initialStock,
    });
  }

  private session(object: SandboxObject): CheckoutSession {
    const data: SandboxData = object.data;
    return {
      sessionId: object.key,
      status: object.status as CheckoutStatus,
      orderId: string(data.orderId),
      amountCents: number(data.amountCents),
      url: `https://checkout.sandbox.example/${object.key}`,
      paymentRef: string(data.paymentRef) || null,
    };
  }

  private vendorJob(object: SandboxObject): VendorJob {
    const base = { jobId: object.key, url: null, error: null };
    const elapsed =
      this.objects.now().getTime() - Date.parse(string(object.data.startedAt));
    const duration = Math.max(1, number(object.data.durationSeconds)) * 1000;
    const progress = Math.max(
      0,
      Math.min(100, Math.floor((elapsed / duration) * 100)),
    );
    if (object.status === 'cancelled')
      return { ...base, status: 'cancelled', progress };
    const outcome = string(object.data.outcome) as VendorOutcome;
    if (outcome === 'stuck')
      return { ...base, status: 'running', progress: Math.min(progress, 60) };
    if (progress < 100) return { ...base, status: 'running', progress };
    return outcome === 'success'
      ? {
          ...base,
          status: 'succeeded',
          progress: 100,
          url: `https://files.sandbox.example/${object.key}.csv`,
        }
      : {
          ...base,
          status: 'failed',
          progress: 100,
          error: 'The vendor could not render the export.',
        };
  }
}

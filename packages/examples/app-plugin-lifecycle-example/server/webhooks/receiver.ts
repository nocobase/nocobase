import { createHmac, timingSafeEqual } from 'node:crypto';

import {
  LifecycleError,
  SYSTEM_ACTOR,
  type JsonObject,
  type LifecycleRuntime,
} from '@nocobase/lifecycle';

import {
  WEBHOOK_EVENTS,
  webhookEventKey,
  type DeliveryOutcome,
  type WebhookEventKey,
} from '../../shared/flows.js';
import { text } from '../../shared/text.js';

/**
 * The sandbox's signing secret. A real provider issues one per endpoint and
 * the application keeps it in its configuration; the example's sender and
 * receiver share this constant.
 */
export const SANDBOX_WEBHOOK_SECRET = 'lifecycle-example-sandbox-secret';

/** The header that carries the body's signature. */
export const SIGNATURE_HEADER = 'x-sandbox-signature';

/** What a sender posts: one event about one record. */
export interface WebhookPayload {
  /** The sender's id for the event, the same on every delivery of it. */
  readonly id: string;
  readonly type: string;
  /** When it happened, as the sender says. */
  readonly occurredAt: string;
  /** The record it is about, which the sender was given when it was asked. */
  readonly recordId: string;
  readonly data: JsonObject;
}

export interface DeliveryResult {
  readonly outcome: DeliveryOutcome;
  /** The transition that applied it, or the last one tried. */
  readonly transition: string | null;
  /** Why it was ignored: the refusal's code. */
  readonly code: string | null;
  readonly message: string;
}

/** A delivery the receiver refused before reading it: no signature, or a body it cannot read. */
export class WebhookRejected extends Error {
  public constructor(
    public readonly reason: 'INVALID_SIGNATURE' | 'INVALID_EVENT',
    message: string,
  ) {
    super(message);
    this.name = 'WebhookRejected';
  }
}

interface EventRoute {
  /**
   * The transitions the event may fire, tried in order. The next is tried
   * only when the record's state does not allow the one before: a payment
   * webhook is `paymentSucceeded` for an order still waiting, and
   * `paidAfterCancel` for one cancelled meanwhile.
   */
  readonly transitions: readonly string[];
  input(payload: WebhookPayload): JsonObject;
}

const ROUTES: Record<WebhookEventKey, EventRoute> = {
  'payments:checkout.paid': {
    transitions: ['paymentSucceeded', 'paidAfterCancel'],
    input: ({ data }) => ({ paymentRef: text(data.paymentRef) }),
  },
  'payments:checkout.declined': {
    transitions: ['paymentDeclined'],
    input: ({ data }) => ({ error: text(data.reason) || 'Card declined.' }),
  },
  'payments:payment.captured': {
    transitions: ['paymentCaptured'],
    input: ({ data }) => ({ paymentRef: text(data.paymentRef) }),
  },
  'warehouse:pick.completed': {
    transitions: ['picked'],
    input: ({ data }) => ({ picker: text(data.picker) }),
  },
  'carrier:tracking.updated': {
    transitions: ['trackingUpdated'],
    input: ({ data, occurredAt }) => ({
      status: text(data.status),
      location: text(data.location),
      occurredAt,
    }),
  },
};

/**
 * Refusals that say this event can never apply, whatever is tried again:
 * acknowledged, so the sender stops. A `CONFLICT` is not among them — the
 * next delivery may well succeed — and neither is a failing database.
 */
const SETTLED: ReadonlySet<string> = new Set([
  'RECORD_NOT_FOUND',
  'GUARD_REJECTED',
  'INVALID_INPUT',
]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Where the outside systems' webhooks land. It checks the signature, finds
 * the transitions the event maps to and fires them as the system under the
 * sender's event id, namespaced by source — so a redelivered event replays
 * the first result instead of firing twice — and classifies the answer: the
 * route acknowledges what applied, replayed or can never apply, and answers
 * an error for anything worth delivering again.
 */
export class WebhookReceiver {
  public constructor(
    private readonly runtime: LifecycleRuntime,
    private readonly secret: string = SANDBOX_WEBHOOK_SECRET,
  ) {}

  public sign(body: string): string {
    return createHmac('sha256', this.secret).update(body).digest('hex');
  }

  /** Reads a delivery as it came over HTTP: the raw body and its signature. */
  public async receiveSigned(
    source: string,
    body: string,
    signature: string | undefined,
  ): Promise<DeliveryResult> {
    const expected = Buffer.from(this.sign(body), 'hex');
    const given = Buffer.from(signature ?? '', 'hex');
    if (given.length !== expected.length || !timingSafeEqual(given, expected))
      throw new WebhookRejected(
        'INVALID_SIGNATURE',
        'The signature does not match the body.',
      );
    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      throw new WebhookRejected('INVALID_EVENT', 'The body is not JSON.');
    }
    if (
      !isObject(parsed) ||
      typeof parsed.id !== 'string' ||
      typeof parsed.type !== 'string' ||
      typeof parsed.occurredAt !== 'string' ||
      typeof parsed.recordId !== 'string' ||
      !isObject(parsed.data)
    )
      throw new WebhookRejected(
        'INVALID_EVENT',
        'An event has an id, a type, occurredAt, recordId and data.',
      );
    return this.receive(source, parsed as unknown as WebhookPayload);
  }

  /**
   * Applies one event. Throws what should make the sender deliver it
   * again — a `CONFLICT`, a failing database — and answers everything else.
   */
  public async receive(
    source: string,
    payload: WebhookPayload,
  ): Promise<DeliveryResult> {
    const key = webhookEventKey(source, payload.type);
    if (!key)
      return {
        outcome: 'ignored',
        transition: null,
        code: 'UNKNOWN_EVENT',
        message: `This application does not handle ${source} ${payload.type}.`,
      };
    const route = ROUTES[key];
    const lifecycle = WEBHOOK_EVENTS[key];
    let last: LifecycleError | undefined;
    for (const transition of route.transitions) {
      try {
        const result = await this.runtime.fire(
          lifecycle,
          payload.recordId,
          transition,
          {
            actor: SYSTEM_ACTOR,
            requestId: `${source}:${payload.id}`,
            input: route.input(payload),
          },
        );
        return result.replayed
          ? {
              outcome: 'replayed',
              transition,
              code: null,
              message: 'Already applied; nothing changed.',
            }
          : {
              outcome: 'applied',
              transition,
              code: null,
              message: `Moved the record to ${String(result.entry.to)}.`,
            };
      } catch (error) {
        if (!(error instanceof LifecycleError)) throw error;
        // The state does not allow this one; the next may fit.
        if (error.code === 'INVALID_STATE') {
          last = error;
          continue;
        }
        // The event id already fired another of its transitions.
        if (error.code === 'REQUEST_REUSED')
          return {
            outcome: 'replayed',
            transition,
            code: error.code,
            message: 'Already applied by another transition; nothing changed.',
          };
        if (SETTLED.has(error.code))
          return {
            outcome: 'ignored',
            transition,
            code: error.code,
            message: error.message,
          };
        throw error;
      }
    }
    return {
      outcome: 'ignored',
      transition: route.transitions.at(-1) ?? null,
      code: last?.code ?? 'INVALID_STATE',
      message:
        last?.message ?? 'The record is past the point this event is about.',
    };
  }
}

import { randomUUID } from 'node:crypto';

import type { DatabaseManager, RepositoryRecord } from '@nocobase/db';
import { LifecycleError, type JsonObject } from '@nocobase/lifecycle';

import {
  WEBHOOK_EVENTS,
  webhookEventKey,
  type DeliveryOutcome,
} from '../../shared/flows.js';
import { text } from '../../shared/text.js';
import { LIFECYCLE_EXAMPLE_COLLECTIONS } from '../scope.js';
import type { WebhookPayload, WebhookReceiver } from '../webhooks/receiver.js';

/** One event a simulated system sent, and how its deliveries were answered. */
export interface WebhookEventView {
  readonly eventId: string;
  readonly source: string;
  readonly type: string;
  readonly lifecycle: string;
  readonly recordId: string;
  readonly data: JsonObject;
  readonly occurredAt: string;
  readonly createdAt: string;
  readonly status: 'held' | 'delivered';
  readonly deliveries: number;
  readonly lastDeliveredAt: string | null;
  readonly outcome: DeliveryOutcome | null;
  readonly outcomeDetail: string | null;
}

export interface EmitInput {
  readonly source: string;
  readonly type: string;
  readonly recordId: string;
  readonly data: JsonObject;
  /** When it happened; now if left out. A carrier's scan can be reported late. */
  readonly occurredAt?: string;
  /** Kept back until someone delivers it, to deliver it late or out of order. */
  readonly hold: boolean;
}

/** How many times a sender tries an event the receiver answered with an error. */
export const MAX_DELIVERIES = 5;

/** How long a sender waits before delivering such an event again. */
export const REDELIVERY_DELAY_MS = 10_000;

function iso(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString();
  return typeof value === 'string' ? value : null;
}

function toView(row: Readonly<Record<string, unknown>>): WebhookEventView {
  return {
    eventId: String(row.eventId),
    source: String(row.source),
    type: String(row.type),
    lifecycle: String(row.lifecycle),
    recordId: String(row.recordId),
    data: (typeof row.data === 'object' && row.data !== null
      ? row.data
      : {}) as JsonObject,
    occurredAt: iso(row.occurredAt) ?? '',
    createdAt: iso(row.createdAt) ?? '',
    status: row.status === 'delivered' ? 'delivered' : 'held',
    deliveries: Number(row.deliveries ?? 0),
    lastDeliveredAt: iso(row.lastDeliveredAt),
    outcome: (row.outcome ?? null) as DeliveryOutcome | null,
    outcomeDetail:
      typeof row.outcomeDetail === 'string' ? row.outcomeDetail : null,
  };
}

/** The webhook event is not one the sandbox knows how to send. */
export class UnknownWebhookEvent extends Error {
  public constructor(source: string, type: string) {
    super(`The sandbox does not send ${source} ${type}.`);
    this.name = 'UnknownWebhookEvent';
  }
}

/** No such webhook event. */
export class WebhookEventNotFound extends Error {
  public constructor(eventId: string) {
    super(`No webhook event "${eventId}".`);
    this.name = 'WebhookEventNotFound';
  }
}

/**
 * The sending side of the simulated systems' webhooks, as a provider runs
 * it: every event is stored before it is sent, signed, and delivered to the
 * receiver; an event answered with an error is delivered again on a later
 * sweep, up to {@link MAX_DELIVERIES}. A person may also hold an event back
 * and deliver it later, out of order, or a second time — which is what a
 * real network does to webhooks anyway.
 */
export class WebhookOutbox {
  public constructor(
    private readonly database: DatabaseManager,
    /** Where the events are delivered, which the HTTP route reads through too. */
    public readonly receiver: WebhookReceiver,
    private readonly clock: () => Date = (): Date => new Date(),
    /** Told after an event is stored or delivered, so pages showing it reload. */
    private readonly changed: (event: WebhookEventView) => void = () => {},
  ) {}

  private repository() {
    return this.database.repository(
      LIFECYCLE_EXAMPLE_COLLECTIONS.webhookEvents,
    );
  }

  public async emit(input: EmitInput): Promise<WebhookEventView> {
    const key = webhookEventKey(input.source, input.type);
    if (!key) throw new UnknownWebhookEvent(input.source, input.type);
    const now = this.clock().toISOString();
    const eventId = `evt_${randomUUID().replaceAll('-', '').slice(0, 16)}`;
    await this.repository().createOne({
      values: {
        eventId,
        source: input.source,
        type: input.type,
        lifecycle: WEBHOOK_EVENTS[key],
        recordId: input.recordId,
        data: input.data,
        occurredAt: input.occurredAt ?? now,
        createdAt: now,
        status: 'held',
        deliveries: 0,
      } as RepositoryRecord,
    });
    if (!input.hold) return this.deliver(eventId);
    const held = await this.get(eventId);
    this.changed(held);
    return held;
  }

  public async get(eventId: string): Promise<WebhookEventView> {
    const row = await this.repository().findOne({ filter: { eventId } });
    if (!row) throw new WebhookEventNotFound(eventId);
    return toView(row);
  }

  /** The events about one record, oldest first. */
  public async list(
    lifecycle: string,
    recordId: string,
  ): Promise<WebhookEventView[]> {
    const rows = await this.repository().findMany({
      filter: { lifecycle, recordId },
      sort: (sort) => sort.field('id').asc(),
    });
    return rows.map(toView);
  }

  /**
   * Sends the event — the first time, or again — the way the HTTP route
   * would receive it: a signed body. The answer is recorded on the event:
   * an error, as a provider sees a 409 or a 500, becomes `retry`.
   */
  public async deliver(eventId: string): Promise<WebhookEventView> {
    const event = await this.get(eventId);
    const payload: WebhookPayload = {
      id: event.eventId,
      type: event.type,
      occurredAt: event.occurredAt,
      recordId: event.recordId,
      data: event.data,
    };
    const body = JSON.stringify(payload);
    let outcome: DeliveryOutcome;
    let detail: string;
    try {
      const result = await this.receiver.receiveSigned(
        event.source,
        body,
        this.receiver.sign(body),
      );
      outcome = result.outcome;
      detail = [result.transition, result.code, result.message]
        .filter(Boolean)
        .join(' · ');
    } catch (error) {
      outcome = 'retry';
      detail =
        error instanceof LifecycleError
          ? `${error.code} · ${error.message}`
          : error instanceof Error
            ? error.message
            : String(error);
    }
    await this.repository().updateMany({
      filter: { eventId },
      values: {
        status: 'delivered',
        deliveries: event.deliveries + 1,
        lastDeliveredAt: this.clock().toISOString(),
        outcome,
        outcomeDetail: detail,
      } as RepositoryRecord,
    });
    const delivered = await this.get(eventId);
    this.changed(delivered);
    return delivered;
  }

  /** Delivers again what was answered with an error and has waited; answers how many. */
  public async redeliverDue(): Promise<number> {
    const before = new Date(
      this.clock().getTime() - REDELIVERY_DELAY_MS,
    ).toISOString();
    const due = await this.repository().findMany({
      filter: (f) =>
        f.and([
          f.string('outcome').eq('retry'),
          f.number('deliveries').lt(MAX_DELIVERIES),
          f.date('lastDeliveredAt').before(before),
        ]),
      sort: (sort) => sort.field('id').asc(),
      limit: 50,
    });
    for (const row of due) await this.deliver(text(row.eventId));
    return due.length;
  }
}

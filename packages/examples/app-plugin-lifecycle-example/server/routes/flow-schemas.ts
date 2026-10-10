import type { JsonObject } from '@nocobase/lifecycle';
import { z } from 'zod';

import {
  DURABLE_FLOWS,
  PLANS,
  SALE_ITEMS,
  VENDOR_OUTCOMES,
  WEBHOOK_SOURCES,
  type DeliveryOutcome,
  type DurableFlow,
  type VendorOutcome,
  type WebhookSource,
} from '../../shared/flows.js';
import { PEOPLE } from '../../shared/people.js';
import type {
  NewExport,
  NewFulfilment,
  NewOrder,
  NewPurchase,
  NewSubscription,
} from '../services/durable-flows.js';
import type { WebhookEventView } from '../sandbox/outbox.js';
import type { CheckoutSession, StockLevel } from '../sandbox/sandbox.js';
import type { DeliveryResult } from '../webhooks/receiver.js';

// Each exported schema is annotated with the value it produces, as
// isolated declarations require; response schemas with the view the
// handler returns, so the document cannot drift from the response.

const customerIds = PEOPLE.filter((person) => person.role === 'customer').map(
  (person) => person.id,
) as [string, ...string[]];

/** The customer a record is for: data, not who asks. */
const customerId = z
  .enum(customerIds)
  .meta({ description: 'One of the example’s customers.' });

const failures = z
  .number()
  .int()
  .min(0)
  .max(20)
  .default(0)
  .meta({ description: 'How many attempts of a step fail on purpose.' });

export const CreateOrderInput: z.ZodType<NewOrder> = z.strictObject({
  customerId,
  title: z.string().trim().min(1),
  amountCents: z.number().int().positive(),
  failCheckouts: failures,
  failRefunds: failures,
});

export const CreateExportInput: z.ZodType<NewExport> = z.strictObject({
  title: z.string().trim().min(1),
  durationSeconds: z.number().int().min(5).max(600).default(45).meta({
    description: 'How long the sandbox vendor takes to render it.',
  }),
  vendorOutcome: z
    .enum(VENDOR_OUTCOMES as unknown as [VendorOutcome, ...VendorOutcome[]])
    .default('success')
    .meta({
      description:
        'How the vendor’s job ends: it succeeds, fails, or never gets past 60%.',
    }),
});

export const CreatePurchaseInput: z.ZodType<NewPurchase> = z.strictObject({
  customerId,
  sku: z.enum(SALE_ITEMS.map((item) => item.sku) as [string, ...string[]]),
  quantity: z.number().int().min(1).max(5),
  declineCharge: z
    .boolean()
    .default(false)
    .meta({ description: 'Whether the card is declined.' }),
  failReleases: failures,
});

export const CreateFulfilmentInput: z.ZodType<NewFulfilment> = z.strictObject({
  title: z.string().trim().min(1),
  customerId,
});

export const CreateSubscriptionInput: z.ZodType<NewSubscription> =
  z.strictObject({
    customerId,
    plan: z.enum(PLANS.map((plan) => plan.plan) as [string, ...string[]]),
    cardDeclines: failures.meta({
      description: 'How many of the next charges the card declines.',
    }),
  });

export const WebhookParams: z.ZodType<{ readonly source: WebhookSource }> =
  z.object({
    source: z
      .enum(WEBHOOK_SOURCES as unknown as [WebhookSource, ...WebhookSource[]])
      .meta({ description: 'Which system sent it.' }),
  });

export const DeliveryResultSchema: z.ZodType<DeliveryResult> = z
  .object({
    outcome: z.enum(['applied', 'replayed', 'ignored', 'retry']).meta({
      description:
        '`applied` moved the record, `replayed` had already, `ignored` can never apply. An event worth delivering again is answered with an error instead.',
    }),
    transition: z.string().nullable(),
    code: z.string().nullable(),
    message: z.string(),
  })
  .meta({ ref: 'LifecycleExampleDeliveryResult' });

const outcomes: [DeliveryOutcome, ...DeliveryOutcome[]] = [
  'applied',
  'replayed',
  'ignored',
  'retry',
];

const json = z.json();

export const WebhookEventSchema: z.ZodType<WebhookEventView> = z
  .object({
    eventId: z.string(),
    source: z.string(),
    type: z.string(),
    lifecycle: z.string(),
    recordId: z.string(),
    data: z.record(z.string(), json),
    occurredAt: z.string(),
    createdAt: z.string(),
    status: z.enum(['held', 'delivered']),
    deliveries: z.number(),
    lastDeliveredAt: z.string().nullable(),
    outcome: z.enum(outcomes).nullable(),
    outcomeDetail: z.string().nullable(),
  })
  .meta({ ref: 'LifecycleExampleWebhookEvent' });

const flows = DURABLE_FLOWS as unknown as [DurableFlow, ...DurableFlow[]];

export const EventsQuery: z.ZodType<{
  readonly lifecycle: DurableFlow;
  readonly recordId: string;
}> = z.object({
  lifecycle: z.enum(flows),
  recordId: z.string().regex(/^\d+$/),
});

export interface EmitEventBody {
  readonly source: WebhookSource;
  readonly type: string;
  readonly recordId: string;
  readonly data: JsonObject;
  readonly occurredAt?: string | undefined;
  readonly hold: boolean;
}

export const EmitEventInput: z.ZodType<EmitEventBody> = z.strictObject({
  source: z.enum(
    WEBHOOK_SOURCES as unknown as [WebhookSource, ...WebhookSource[]],
  ),
  type: z.string().min(1),
  recordId: z.string().regex(/^\d+$/),
  data: (z.record(z.string(), json) as z.ZodType<JsonObject>).default({}),
  occurredAt: z.iso.datetime().optional().meta({
    description: 'When it happened, as the sender says; now if left out.',
  }),
  hold: z.boolean().default(false).meta({
    description: 'Keep it back until it is delivered by hand.',
  }),
});

export const EventParams: z.ZodType<{ readonly eventId: string }> = z.object({
  eventId: z.string().min(1),
});

export const PayCheckoutInput: z.ZodType<{
  readonly outcome: 'paid' | 'declined';
  readonly hold: boolean;
}> = z.strictObject({
  outcome: z.enum(['paid', 'declined']),
  hold: z.boolean().default(false),
});

export const CheckoutParams: z.ZodType<{ readonly sessionId: string }> =
  z.object({ sessionId: z.string().min(1) });

export const CheckoutSessionSchema: z.ZodType<CheckoutSession> = z
  .object({
    sessionId: z.string(),
    status: z.enum(['open', 'paid', 'declined', 'expired']),
    orderId: z.string(),
    amountCents: z.number(),
    url: z.string(),
    paymentRef: z.string().nullable(),
  })
  .meta({ ref: 'LifecycleExampleCheckoutSession' });

export const StockLevelSchema: z.ZodType<StockLevel> = z
  .object({
    sku: z.string(),
    available: z.number(),
    reserved: z.number(),
  })
  .meta({ ref: 'LifecycleExampleStockLevel' });

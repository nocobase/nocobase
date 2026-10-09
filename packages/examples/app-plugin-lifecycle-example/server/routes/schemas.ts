import type {
  AvailableTransition,
  Blocker,
  EffectRun,
  FireView,
  LifecycleDescriptionView,
  RecordView,
  TransitionEntry,
} from '@nocobase/lifecycle';
import { z } from 'zod';

import { PEOPLE } from '../../shared/people.js';
import { PRIORITIES, TICKET_CATEGORIES } from '../../shared/ticket.js';

// Each exported schema is annotated with the value it produces, which
// isolated declarations require of an export, and response schemas with the
// view the handler returns, so the document cannot drift from the response.

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

const personIds = PEOPLE.map((person) => person.id) as [string, ...string[]];

/**
 * Who the request acts as. The pages switch between the example's people so
 * one person can try every role; a real application takes the actor from the
 * signed-in user instead.
 */
const actAs = z
  .enum(personIds)
  .meta({ description: 'The example persona the request acts as.' });

export const ActAsQuery: z.ZodObject<
  { actAs: z.ZodEnum<Record<string, string>> },
  z.core.$strip
> = z.object({ actAs });

const paging = {
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
};

export const ListTicketsQuery: z.ZodObject<
  {
    actAs: z.ZodEnum<Record<string, string>>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
  },
  z.core.$strip
> = z.object({ actAs, ...paging });

export const ListExpensesQuery: z.ZodObject<
  {
    actAs: z.ZodEnum<Record<string, string>>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    view: z.ZodDefault<z.ZodEnum<{ mine: 'mine'; approvals: 'approvals' }>>;
  },
  z.core.$strip
> = z.object({
  actAs,
  ...paging,
  view: z.enum(['mine', 'approvals']).default('mine').meta({
    description:
      'The applicant’s own reports, or those waiting for the persona’s decision.',
  }),
});

const failures = z
  .number()
  .int()
  .min(0)
  .meta({ description: 'How many attempts of the effect fail on purpose.' });

export const CreateTicketInput: z.ZodObject<
  {
    subject: z.ZodString;
    category: z.ZodEnum<Record<string, string>>;
    priority: z.ZodEnum<Record<string, string>>;
    description: z.ZodString;
    failNotifications: z.ZodDefault<z.ZodNumber>;
  },
  z.core.$strict
> = z.strictObject({
  subject: z.string().trim(),
  category: z.enum(TICKET_CATEGORIES as [string, ...string[]]),
  priority: z.enum(PRIORITIES as [string, ...string[]]),
  description: z.string(),
  failNotifications: failures.default(0),
});

const ExpenseItem: z.ZodObject<
  {
    date: z.ZodString;
    category: z.ZodString;
    description: z.ZodString;
    amountCents: z.ZodNumber;
  },
  z.core.$strict
> = z
  .strictObject({
    date: z.string().meta({ description: 'A `YYYY-MM-DD` date.' }),
    category: z.string(),
    description: z.string(),
    amountCents: z.number().int(),
  })
  .meta({ ref: 'LifecycleExampleExpenseItem' });

/** A draft may be incomplete; `submit` checks the lines. */
export const ExpenseDraftInput: z.ZodObject<
  {
    title: z.ZodString;
    purpose: z.ZodDefault<z.ZodString>;
    items: z.ZodArray<typeof ExpenseItem>;
    failPayments: z.ZodDefault<z.ZodNumber>;
  },
  z.core.$strict
> = z.strictObject({
  title: z.string().trim(),
  purpose: z.string().default(''),
  items: z.array(ExpenseItem).max(MAX_PAGE_SIZE),
  failPayments: failures.default(0),
});

/**
 * An edit to a draft: only the fields sent change. Nothing has a default, so
 * a field left out keeps what the report holds rather than being reset.
 */
export const ExpenseChangesInput: z.ZodObject<
  {
    title: z.ZodOptional<z.ZodString>;
    purpose: z.ZodOptional<z.ZodString>;
    items: z.ZodOptional<z.ZodArray<typeof ExpenseItem>>;
    failPayments: z.ZodOptional<z.ZodNumber>;
  },
  z.core.$strict
> = z.strictObject({
  title: z.string().trim().optional(),
  purpose: z.string().optional(),
  items: z
    .array(ExpenseItem)
    .max(MAX_PAGE_SIZE)
    .optional()
    .meta({ description: 'Replaces every line; the total follows them.' }),
  failPayments: failures.optional(),
});

export type CreateTicketInput = z.infer<typeof CreateTicketInput>;
export type ExpenseDraftInput = z.infer<typeof ExpenseDraftInput>;
export type ExpenseChangesInput = z.infer<typeof ExpenseChangesInput>;

/**
 * Record ids are the collection's integer keys, sent as strings. Every route
 * under a record uses this one parameter, so the document names the path once.
 */
export const RecordParams: z.ZodObject<
  { recordId: z.ZodString },
  z.core.$strip
> = z.object({
  recordId: z.string().regex(/^\d+$/).meta({ description: 'The record’s id.' }),
});
export const RunParams: z.ZodObject<{ runId: z.ZodString }, z.core.$strip> =
  z.object({ runId: z.string().min(1) });

export const FireInput: z.ZodObject<
  {
    transition: z.ZodString;
    input: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodJSONSchema>>;
    requestId: z.ZodString;
    expectVersion: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
  },
  z.core.$strict
> = z.strictObject({
  transition: z
    .string()
    .min(1)
    .meta({ description: 'The transition to fire.' }),
  // Each transition validates its own input; its shape is the definition's.
  input: z.record(z.string(), z.json()).default({}),
  requestId: z.string().min(1).meta({
    description:
      'One key per decision, reused by its retries: a repeat of the same transition is a replay.',
  }),
  expectVersion: z.number().int().nullable().optional().meta({
    description:
      'The version the page showed; a record that moved on since is refused with `CONFLICT`.',
  }),
});

export const RetryRunInput: z.ZodObject<
  { force: z.ZodDefault<z.ZodBoolean>; reason: z.ZodOptional<z.ZodString> },
  z.core.$strict
> = z.strictObject({
  force: z.boolean().default(false).meta({
    description:
      'Retry even though the run’s `onFailure` already moved the record on.',
  }),
  reason: z.string().optional().meta({ description: 'Why it is forced.' }),
});

// Responses.

const json = z.json();
const jsonObject = z.record(z.string(), json);

/**
 * A record of one of the example's lifecycles. Its fields are the
 * lifecycle's collection's own, which differ between tickets and expenses.
 */
export interface ExampleRecordBody {
  readonly id: string;
  readonly status: string;
  readonly [field: string]: unknown;
}
export const ExampleRecord: z.ZodType<ExampleRecordBody> = z
  .looseObject({
    id: z.string(),
    status: z.string().meta({ description: 'The lifecycle state.' }),
  })
  .meta({ ref: 'LifecycleExampleRecord' });

export const ListMeta: z.ZodObject<
  {
    page: z.ZodNumber;
    pageSize: z.ZodNumber;
    total: z.ZodNumber;
    parameters: z.ZodRecord<z.ZodString, z.ZodUnknown>;
  },
  z.core.$strip
> = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  // Administrator parameters are each lifecycle's own; the page quotes them.
  parameters: z.record(z.string(), z.unknown()).meta({
    description: 'The lifecycle’s parameters, which the page quotes.',
  }),
});

export const TriggersRun: z.ZodType<{ readonly fired: number }> = z.object({
  fired: z.number().meta({ description: 'How many transitions fired.' }),
});

const BlockerSchema: z.ZodType<Blocker> = z
  .object({
    source: z.enum(['state', 'guard', 'manual']),
    kind: z.enum(['permission', 'precondition']).meta({
      description:
        '`permission` when this persona may not, `precondition` when the record has to change first.',
    }),
    code: z.string(),
    message: z.string(),
  })
  .meta({ ref: 'LifecycleExampleBlocker' });

const Available: z.ZodType<AvailableTransition> = z
  .object({
    name: z.string(),
    title: z.string(),
    to: z.array(z.string()),
    allowed: z.boolean(),
    blockers: z.array(BlockerSchema),
  })
  .meta({ ref: 'LifecycleExampleAvailableTransition' });

const Entry: z.ZodType<TransitionEntry> = z
  .object({
    id: z.string(),
    lifecycle: z.string(),
    recordId: z.string(),
    transition: z.string(),
    from: z.string().nullable(),
    to: z.string(),
    actorId: z.string(),
    input: jsonObject,
    at: z.iso.datetime(),
    version: z.number(),
    requestId: z.string().nullable(),
  })
  .meta({ ref: 'LifecycleExampleTransitionEntry' });

const Run: z.ZodType<EffectRun> = z
  .object({
    id: z.string(),
    transitionId: z.string(),
    lifecycle: z.string(),
    recordId: z.string(),
    effect: z.string(),
    stayBound: z.boolean(),
    status: z.enum([
      'queued',
      'running',
      'succeeded',
      'failed',
      'dead',
      'cancelled',
    ]),
    attempts: z.number(),
    maxAttempts: z.number(),
    result: json,
    error: z.string().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    claimedAt: z.iso.datetime().nullable(),
    runAfter: z.iso.datetime().nullable(),
    continuation: z
      .object({
        transition: z.string(),
        outcome: z.enum(['succeeded', 'failed']),
        input: jsonObject,
        error: z.string(),
        code: z.string(),
        attempts: z.number().meta({
          description:
            'How many times it was refused: what counts toward the sweep giving up on it.',
        }),
        errorTries: z.number().meta({
          description:
            'How many tries ended in an error that was not a refusal, such as a database failure; they back off but never lead to giving up.',
        }),
        failedAt: z.iso.datetime(),
        dueAt: z.iso.datetime(),
        abandonedAt: z.iso.datetime().nullable().meta({
          description:
            'When the sweep gave up on it after its last try; null while it waits. A continuation given up on is still tried by `continue`.',
        }),
      })
      .nullable()
      .meta({
        description:
          'The transition the outcome still has to fire, refused so far, and when the sweep tries it next; null when nothing is pending.',
      }),
  })
  .meta({ ref: 'LifecycleExampleEffectRun' });

const recordView = {
  record: ExampleRecord,
  state: z.string(),
  version: z.number().nullable().meta({
    description: 'Send it back as `expectVersion` so a stale page is refused.',
  }),
  available: z.array(Available),
  history: z.object({
    transitions: z.array(Entry),
    effectRuns: z.array(Run),
  }),
};

export const RecordViewSchema: z.ZodType<RecordView> = z
  .object(recordView)
  .meta({ ref: 'LifecycleExampleRecordView' });

export const FireViewSchema: z.ZodType<FireView> = z
  .object({
    ...recordView,
    replayed: z.boolean().meta({
      description: 'True when this request id had already fired it.',
    }),
  })
  .meta({ ref: 'LifecycleExampleFireView' });

export const DescriptionViewSchema: z.ZodType<LifecycleDescriptionView> = z
  .object({
    description: z.object({
      name: z.string(),
      initial: z.string(),
      initialStates: z.array(z.string()),
      states: z.array(z.string()),
      stateInfo: z.array(
        z.object({
          name: z.string(),
          title: z.string(),
          final: z.boolean(),
          meta: jsonObject,
        }),
      ),
      transitions: z.array(
        z.object({
          name: z.string(),
          title: z.string(),
          from: z.array(z.string()),
          to: z.array(z.string()),
          effects: z.array(z.string()),
          accept: z.array(z.string()),
          manual: z.boolean(),
          meta: jsonObject,
        }),
      ),
      continuations: z.array(
        z.object({
          effect: z.string(),
          onSuccess: z.string().optional(),
          onFailure: z.string().optional(),
        }),
      ),
      onEnter: z.record(z.string(), z.array(z.string())),
      triggers: z.array(
        z.object({
          name: z.string(),
          transition: z.string(),
          when: z.array(z.string()),
        }),
      ),
    }),
    parameters: z.record(z.string(), z.unknown()),
    diagram: z
      .string()
      .meta({ description: 'Mermaid source of the state diagram.' }),
  })
  .meta({ ref: 'LifecycleExampleLifecycle' });

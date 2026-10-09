import { z } from 'zod';

import { PEOPLE } from '../../shared/people.js';
import type { Plain } from '../services/store.js';

// Each exported schema is annotated with the value it produces, which
// isolated declarations require of an export. The service answers plain
// records and views, so the response schemas name their top-level fields
// and leave the record columns to the collections.

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

const personIds = PEOPLE.map((person) => person.id) as [string, ...string[]];
const person = z.enum(personIds);

/**
 * Who the request acts as. The pages pick a persona so one person can play
 * every role; a real application takes the actor from the signed-in user.
 */
const actAs = person.meta({
  description: 'The example persona the request acts as.',
});

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

export const PageQuery: z.ZodObject<
  {
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
  },
  z.core.$strip
> = z.object(paging);

export const ActAsPageQuery: z.ZodObject<
  {
    actAs: z.ZodEnum<Record<string, string>>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
  },
  z.core.$strip
> = z.object({ actAs, ...paging });

const id = z.string().regex(/^\d+$/);

export const RequestParams: z.ZodObject<
  { requestId: z.ZodString },
  z.core.$strip
> = z.object({ requestId: id });
export const ExtractionParams: z.ZodObject<
  { extractionId: z.ZodString },
  z.core.$strip
> = z.object({ extractionId: id });
export const IncomingParams: z.ZodObject<
  { incomingId: z.ZodString },
  z.core.$strip
> = z.object({ incomingId: id });
export const RowParams: z.ZodObject<{ rowId: z.ZodString }, z.core.$strip> =
  z.object({ rowId: id });
export const TaskParams: z.ZodObject<
  {
    taskKind: z.ZodEnum<{ clerk: 'clerk'; team: 'team'; executor: 'executor' }>;
    taskId: z.ZodString;
  },
  z.core.$strip
> = z.object({ taskKind: z.enum(['clerk', 'team', 'executor']), taskId: id });
/** Only a clerk's or a team's task dispatches further. */
export const DispatchingTaskParams: z.ZodObject<
  {
    taskKind: z.ZodEnum<{ clerk: 'clerk'; team: 'team' }>;
    taskId: z.ZodString;
  },
  z.core.$strip
> = z.object({ taskKind: z.enum(['clerk', 'team']), taskId: id });

const text = z.string();
const count = z.number().int().nullable();
const flag = z.boolean().nullable();
const files = z.array(z.string());

/** The applicant's form; a field left out keeps its empty value. */
export const DataRequestFormInput: z.ZodObject<
  {
    form: z.ZodObject<
      {
        subject: z.ZodOptional<z.ZodString>;
        reason: z.ZodOptional<z.ZodString>;
        volume: z.ZodOptional<z.ZodString>;
        frequency: z.ZodOptional<
          z.ZodEnum<{
            '': '';
            once: 'once';
            quarterly: 'quarterly';
            monthly: 'monthly';
            weekly: 'weekly';
            daily: 'daily';
            other: 'other';
          }>
        >;
        deliveryDate: z.ZodOptional<z.ZodString>;
        firstUseDate: z.ZodOptional<z.ZodString>;
        lastDeliveryDate: z.ZodOptional<z.ZodString>;
        quarterDay: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        monthDay: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        weekDay: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        frequencyNote: z.ZodOptional<z.ZodString>;
        scope: z.ZodOptional<
          z.ZodEnum<{ '': ''; external: 'external'; internal: 'internal' }>
        >;
        consumers: z.ZodOptional<z.ZodArray<z.ZodString>>;
        fileShieldAccepted: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
        fileShieldScope: z.ZodOptional<z.ZodString>;
        fileShieldCopy: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
        fileShieldValidUntil: z.ZodOptional<z.ZodString>;
        ndaFiles: z.ZodOptional<z.ZodArray<z.ZodString>>;
        securityFiles: z.ZodOptional<z.ZodArray<z.ZodString>>;
      },
      z.core.$strict
    >;
  },
  z.core.$strict
> = z.strictObject({
  form: z.strictObject({
    subject: text.optional(),
    reason: text.optional(),
    volume: text.optional(),
    frequency: z
      .enum(['', 'once', 'quarterly', 'monthly', 'weekly', 'daily', 'other'])
      .optional(),
    deliveryDate: text.optional(),
    firstUseDate: text.optional(),
    lastDeliveryDate: text.optional(),
    quarterDay: count.optional(),
    monthDay: count.optional(),
    weekDay: count.optional(),
    frequencyNote: text.optional(),
    scope: z.enum(['', 'external', 'internal']).optional(),
    consumers: z.array(z.string()).optional(),
    fileShieldAccepted: flag.optional(),
    fileShieldScope: text.optional(),
    fileShieldCopy: flag.optional(),
    fileShieldValidUntil: text.optional(),
    ndaFiles: files.optional(),
    securityFiles: files.optional(),
  }),
});

export const CreateExtractionInput: z.ZodObject<
  {
    topic: z.ZodString;
    requirement: z.ZodDefault<z.ZodString>;
    scheduledDate: z.ZodString;
    executorIds: z.ZodDefault<z.ZodArray<z.ZodEnum<Record<string, string>>>>;
  },
  z.core.$strict
> = z.strictObject({
  topic: z.string(),
  requirement: z.string().default(''),
  scheduledDate: z
    .string()
    .meta({ description: 'The first extraction date, `YYYY-MM-DD`.' }),
  executorIds: z.array(person).default([]).meta({
    description: 'Who extracts; the configured executors when empty.',
  }),
});

const nullableText = z.string().nullable();

export const ExtractionValuesInput: z.ZodObject<
  {
    values: z.ZodObject<
      {
        category: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        complexity: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        agreedDeliveryAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        sourceSystem: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        needsDownload: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
        feedbackNote: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        feedbackFiles: z.ZodOptional<z.ZodArray<z.ZodString>>;
        reviewerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        managerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        confirmerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
      },
      z.core.$strict
    >;
  },
  z.core.$strict
> = z.strictObject({
  values: z.strictObject({
    category: nullableText.optional(),
    complexity: nullableText.optional(),
    agreedDeliveryAt: nullableText.optional(),
    sourceSystem: nullableText.optional(),
    needsDownload: flag.optional(),
    feedbackNote: nullableText.optional(),
    feedbackFiles: files.optional(),
    reviewerId: nullableText.optional(),
    managerId: nullableText.optional(),
    confirmerId: nullableText.optional(),
  }),
});

export const IncomingValuesInput: z.ZodObject<
  {
    values: z.ZodObject<
      {
        title: z.ZodOptional<z.ZodString>;
        code: z.ZodOptional<z.ZodString>;
        sender: z.ZodOptional<z.ZodString>;
        senderRef: z.ZodOptional<z.ZodString>;
        summary: z.ZodOptional<z.ZodString>;
        officeOpinion: z.ZodOptional<z.ZodString>;
        attachments: z.ZodOptional<z.ZodArray<z.ZodString>>;
        distributionType: z.ZodOptional<z.ZodString>;
        officeHeadId: z.ZodOptional<z.ZodString>;
        officeLeaderId: z.ZodOptional<z.ZodString>;
        ccManagement: z.ZodOptional<z.ZodBoolean>;
      },
      z.core.$strict
    >;
  },
  z.core.$strict
> = z.strictObject({
  values: z.strictObject({
    title: text.optional(),
    code: text.optional(),
    sender: text.optional(),
    senderRef: text.optional(),
    summary: text.optional(),
    officeOpinion: text.optional(),
    attachments: files.optional(),
    distributionType: text.optional(),
    officeHeadId: text.optional(),
    officeLeaderId: text.optional(),
    ccManagement: z.boolean().optional(),
  }),
});

/** Every task kind's fields; each kind keeps the ones its state lets the assignee edit. */
export const TaskValuesInput: z.ZodObject<
  {
    values: z.ZodObject<
      {
        opinion: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        redHeadFeedback: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
        outgoingRef: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        attachments: z.ZodOptional<z.ZodArray<z.ZodString>>;
        feedback: z.ZodOptional<z.ZodNullable<z.ZodString>>;
      },
      z.core.$strict
    >;
  },
  z.core.$strict
> = z.strictObject({
  values: z.strictObject({
    opinion: nullableText.optional(),
    redHeadFeedback: flag.optional(),
    outgoingRef: nullableText.optional(),
    attachments: files.optional(),
    feedback: nullableText.optional(),
  }),
});

export const FireInput: z.ZodObject<
  {
    transition: z.ZodString;
    input: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodJSONSchema>>;
  },
  z.core.$strict
> = z.strictObject({
  transition: z
    .string()
    .min(1)
    .meta({ description: 'The transition to fire.' }),
  // Each transition validates its own input; its shape is the definition's.
  input: z.record(z.string(), z.json()).default({}),
});

export const RowInput: z.ZodObject<
  {
    departmentName: z.ZodString;
    includeClerks: z.ZodDefault<z.ZodBoolean>;
    includeHeads: z.ZodDefault<z.ZodBoolean>;
    includeLeaders: z.ZodDefault<z.ZodBoolean>;
    assistOther: z.ZodDefault<z.ZodBoolean>;
  },
  z.core.$strict
> = z.strictObject({
  departmentName: z.string(),
  includeClerks: z.boolean().default(true),
  includeHeads: z.boolean().default(false),
  includeLeaders: z.boolean().default(false),
  assistOther: z.boolean().default(false).meta({
    description:
      'On a clerk task: ask another department to assist, rather than dispatching to a team.',
  }),
});

export const ManagementRowInput: z.ZodObject<
  {
    groupId: z.ZodOptional<z.ZodString>;
    groupName: z.ZodOptional<z.ZodString>;
    members: z.ZodOptional<z.ZodArray<z.ZodString>>;
  },
  z.core.$strict
> = z.strictObject({
  groupId: id.optional().meta({
    description: 'A configured group; its name and members are used.',
  }),
  groupName: z.string().optional(),
  members: z.array(z.string()).optional(),
});

// Responses.

/** One row of a collection, with its id as a string as every id in a response is. */
export const OfficeRecord: z.ZodType<Plain> = z
  .looseObject({ id: z.string() })
  .meta({ ref: 'OfficeFlowsExampleRecord' });

export const OfficeDetail: z.ZodType<Plain> = z
  .looseObject({
    record: OfficeRecord,
    description: z.record(z.string(), z.unknown()).meta({
      description:
        'The lifecycle’s states, transitions, effects and triggers, as `runtime.describe()` answers.',
    }),
    available: z.array(z.record(z.string(), z.unknown())).meta({
      description:
        'The transitions the state allows, each with whether the persona may fire it and why not.',
    }),
    history: z.object({
      transitions: z.array(z.record(z.string(), z.unknown())),
      effectRuns: z.array(z.record(z.string(), z.unknown())),
    }),
    traces: z.array(z.record(z.string(), z.unknown())),
  })
  .meta({
    ref: 'OfficeFlowsExampleDetail',
    description:
      'A record with what its page shows. A request adds its `form`, `extractions` and `schedule`, an extraction its `request`, a document its distribution `rows`, `management` and processing `levels`, a task its rows and `processing` chain.',
  });

export const OfficeConfig: z.ZodType<Plain> = z
  .looseObject({
    people: z.array(z.record(z.string(), z.unknown())),
    roles: z.record(z.string(), z.unknown()),
    departments: z.array(OfficeRecord),
    managementGroups: z.array(OfficeRecord),
    holidays: z.array(OfficeRecord),
  })
  .meta({ ref: 'OfficeFlowsExampleConfig' });

export const Created: z.ZodType<{ readonly id: string }> = z
  .object({ id: z.string() })
  .meta({ ref: 'OfficeFlowsExampleCreated' });

export const ScheduleRun: z.ZodType<{ readonly created: number }> = z.object({
  created: z
    .number()
    .meta({ description: 'How many extraction tasks the sweep created.' }),
});

export const PageMeta: z.ZodObject<
  { page: z.ZodNumber; pageSize: z.ZodNumber; total: z.ZodNumber },
  z.core.$strip
> = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});

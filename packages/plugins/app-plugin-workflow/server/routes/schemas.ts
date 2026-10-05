import { z } from 'zod';

import type {
  JsonObject,
  WorkflowParameterDeclaration,
  WorkflowParameterSchema,
  WorkflowParameterValues,
} from '../engine/index.js';
import type {
  WorkflowDefinitionView,
  WorkflowListItem,
  WorkflowNodeRunPayload,
  WorkflowNodeRunSummary,
  WorkflowParameterSettings,
  WorkflowRunDetail,
  WorkflowRunListItem,
} from '../repositories/types.js';

/** The tag every workflow route is listed under in the API document. */
export const WORKFLOW_API_TAG = 'Workflow';

/**
 * A workflow is addressed by its materialized id, a positive integer, or by the 64-character hexadecimal hash of a
 * deployed Artifact. Neither form can spell a fixed sibling segment such as `runs` or `sources`, so those segments are
 * never shadowed by an id.
 */
const workflowIdentifier: z.ZodString = z
  .string()
  .regex(
    /^(?:[1-9]\d*|[a-fA-F\d]{64})$/,
    'Must be a positive integer id or a 64-character hexadecimal Artifact hash.',
  )
  .meta({
    description:
      'A materialized workflow id, or the 64-character hexadecimal hash of a deployed Artifact.',
  });

/** Runs and node runs are addressed by their positive integer id. */
const recordId: z.ZodString = z
  .string()
  .regex(/^[1-9]\d*$/, 'Must be a positive integer id.')
  .meta({ description: 'A positive integer id.' });

const page: z.ZodOptional<z.ZodCoercedNumber<unknown>> = z.coerce
  .number()
  .int()
  .min(1)
  .meta({ description: 'The 1-based page to return. Defaults to 1.' })
  .optional();
const pageSize: z.ZodOptional<z.ZodCoercedNumber<unknown>> = z.coerce
  .number()
  .int()
  .min(1)
  .max(100)
  .meta({ description: 'Items per page, at most 100. Defaults to 20.' })
  .optional();

export const WorkflowParams: z.ZodObject<
  { workflowId: z.ZodString },
  z.core.$strip
> = z.object({ workflowId: workflowIdentifier });

export const WorkflowSourceParams: z.ZodObject<
  { key: z.ZodString },
  z.core.$strip
> = z.object({
  key: z.string().min(1).meta({ description: 'Stable workflow key.' }),
});

export const WorkflowRunParams: z.ZodObject<
  { runId: z.ZodString },
  z.core.$strip
> = z.object({ runId: recordId });

export const NodeRunParams: z.ZodObject<
  { runId: z.ZodString; nodeRunId: z.ZodString },
  z.core.$strip
> = z.object({ runId: recordId, nodeRunId: recordId });

export const PageQuery: z.ZodObject<
  {
    page: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
  },
  z.core.$strip
> = z.object({ page, pageSize });
export type PageQuery = z.infer<typeof PageQuery>;

export const WorkflowListQuery: z.ZodObject<
  {
    q: z.ZodOptional<z.ZodString>;
    enabled: z.ZodOptional<z.ZodEnum<{ true: 'true'; false: 'false' }>>;
    page: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
  },
  z.core.$strip
> = z.object({
  q: z
    .string()
    .meta({
      description:
        'Case-insensitive text matched against the workflow key and title.',
    })
    .optional(),
  enabled: z
    .enum(['true', 'false'])
    .meta({ description: 'Only enabled or only disabled workflows.' })
    .optional(),
  page,
  pageSize,
});

export const WorkflowRunListQuery: z.ZodObject<
  {
    workflowId: z.ZodOptional<z.ZodString>;
    workflowKey: z.ZodOptional<z.ZodString>;
    workflowTitle: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
    page: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
  },
  z.core.$strip
> = z.object({
  workflowId: workflowIdentifier.optional(),
  workflowKey: z
    .string()
    .meta({ description: 'Only runs of this workflow key.' })
    .optional(),
  workflowTitle: z
    .string()
    .meta({
      description:
        'Only runs of workflows whose current title contains this text.',
    })
    .optional(),
  /** A run status code, or `null` for runs that have not finished. */
  status: z
    .string()
    .regex(/^(?:null|-?\d+)$/, 'Must be an integer status or null.')
    .meta({
      description:
        'Only runs with this status code: `0` started, `1` resolved, `-1` failed, `-2` error, `-3` aborted, or `null` for queued runs.',
    })
    .optional(),
  page,
  pageSize,
});

export const NodeRunListQuery: z.ZodObject<
  {
    nodeKey: z.ZodOptional<z.ZodString>;
    page: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
  },
  z.core.$strip
> = z.object({
  nodeKey: z
    .string()
    .meta({ description: 'Only node runs of this node key.' })
    .optional(),
  page,
  pageSize,
});

const parameterValue: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]> =
  z.union([z.string(), z.number(), z.boolean()]);

/** `PUT /workflows/{workflowId}/parameters` replaces the parameter values of one revision. */
export const WorkflowParametersInput: z.ZodObject<
  {
    parameterValues: z.ZodRecord<
      z.ZodString,
      z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>
    >;
  },
  z.core.$strict
> = z.strictObject({
  parameterValues: z.record(z.string(), parameterValue).meta({
    description:
      'The complete set of parameter values for the revision, by parameter key. Values must match the declared types.',
  }),
});
export type WorkflowParametersInput = z.infer<typeof WorkflowParametersInput>;

/** `POST /workflows/{workflowId}/run` starts a manual run with the given input. */
export const RunWorkflowInput: z.ZodObject<
  { input: z.ZodRecord<z.ZodString, z.ZodUnknown> },
  z.core.$strict
> = z.strictObject({
  input: z.record(z.string(), z.unknown()).meta({
    description:
      "The run input, a JSON object validated against the workflow's input schema.",
  }),
});
export type RunWorkflowInput = z.infer<typeof RunWorkflowInput>;

/** The optional `Event-Key` header makes a manual run idempotent: a repeated key returns the run it started. */
export const RunWorkflowHeaders: z.ZodObject<
  { 'event-key': z.ZodOptional<z.ZodString> },
  z.core.$strip
> = z.object({
  'event-key': z
    .string()
    .trim()
    .min(1)
    .max(255)
    .meta({
      description:
        'Idempotency key: a request repeating a key returns the run the first one started instead of starting another.',
    })
    .optional(),
});

// Response schemas. Each is typed against the repository view the handler returns, so a field added to a view without
// its schema, or the other way round, fails to compile.

const timestamp: z.ZodString = z
  .string()
  .meta({ description: 'RFC 3339 timestamp.', format: 'date-time' });

const runStatus: z.ZodNullable<z.ZodNumber> = z.number().int().nullable().meta({
  description:
    'Run status: `null` queued, `0` started, `1` resolved, `-1` failed, `-2` error, `-3` aborted.',
});

/**
 * A JSON object, documented as an object of any values. `z.json()` is recursive, which the document can only express as
 * a generated component name that would collide across plugins; the type is kept so the views stay checked.
 */
const jsonObject: z.ZodType<JsonObject> = z.custom<JsonObject>().meta({
  type: 'object',
  additionalProperties: {},
  description: 'A JSON object.',
});

export const WorkflowPageMeta: z.ZodObject<
  { page: z.ZodNumber; pageSize: z.ZodNumber; total: z.ZodNumber },
  z.core.$strip
> = z
  .object({
    page: z.number().int().meta({ description: 'The 1-based page returned.' }),
    pageSize: z
      .number()
      .int()
      .meta({ description: 'The page size applied, at most 100.' }),
    total: z
      .number()
      .int()
      .meta({ description: 'The number of items across all pages.' }),
  })
  .meta({ ref: 'WorkflowPageMeta' });

const latestRun: z.ZodType<WorkflowListItem['latestRun']> = z
  .object({
    id: z.string(),
    status: runStatus,
    createdAt: timestamp,
  })
  .nullable()
  .meta({
    description:
      'The most recent run of the workflow key, or `null` before its first run.',
  });

const pendingArtifact: z.ZodType<WorkflowListItem['pendingArtifact']> = z
  .object({
    hash: z.string().meta({ description: 'Hash of the deployed Artifact.' }),
    title: z.string().nullable(),
  })
  .nullable()
  .meta({
    description:
      'A deployed Artifact for this key that differs from the stored revision and has not been enabled yet.',
  });

const parameterDeclaration: z.ZodType<WorkflowParameterDeclaration> = z.object({
  type: z.enum(['string', 'number', 'boolean']),
  title: z.string().optional(),
  description: z.string().optional(),
  default: parameterValue.optional(),
  enum: z
    .array(
      z.object({ label: z.string(), value: z.union([z.string(), z.number()]) }),
    )
    .optional(),
});

const parametersSchema: z.ZodType<WorkflowParameterSchema> = z
  .record(z.string(), parameterDeclaration)
  .meta({
    ref: 'WorkflowParametersSchema',
    description: 'The administrator parameters a revision declares, by key.',
  });

const parameterValues: z.ZodType<WorkflowParameterValues> = z
  .record(z.string(), parameterValue)
  .meta({ description: 'Parameter values saved for a revision, by key.' });

export const WorkflowListItemSchema: z.ZodType<WorkflowListItem> = z
  .object({
    id: z.string().nullable().meta({
      description:
        'Materialized id, or `null` for a deployed Artifact that has not been enabled or run yet.',
    }),
    key: z.string().meta({ description: 'Stable workflow key.' }),
    title: z.string().nullable(),
    enabled: z.boolean(),
    current: z.boolean().nullable().meta({
      description:
        'Whether this is the current revision of its key; `null` for an unmaterialized Artifact.',
    }),
    hasParameters: z.boolean(),
    executed: z
      .number()
      .int()
      .meta({ description: 'Number of runs started for the workflow key.' }),
    version: z.string().nullable(),
    hash: z
      .string()
      .nullable()
      .meta({ description: 'Artifact hash of the revision.' }),
    activeRunCount: z
      .number()
      .int()
      .meta({ description: 'Runs of the key that are queued or started.' }),
    latestRun,
    pendingArtifact,
  })
  .meta({ ref: 'WorkflowListItem' });

export const WorkflowDefinitionSchema: z.ZodType<WorkflowDefinitionView> = z
  .object({
    id: z.string().nullable().meta({
      description:
        'Materialized id, or `null` for a deployed Artifact read by its hash or key before it was materialized.',
    }),
    key: z.string().meta({ description: 'Stable workflow key.' }),
    title: z.string().nullable(),
    description: z.string().nullable(),
    hash: z
      .string()
      .nullable()
      .meta({ description: 'Artifact hash of the revision.' }),
    version: z.string().nullable(),
    enabled: z.boolean(),
    current: z.boolean().nullable(),
    hasParameters: z.boolean(),
    executed: z.number().int(),
    latestRun,
    pendingArtifact,
    inputSchema: z.unknown().meta({
      description: 'JSON Schema of the input a run accepts.',
    }),
    parametersSchema,
    parameterValues,
    client: z
      .object({
        inputForm: z.string().optional(),
        parameterForm: z.string().optional(),
      })
      .meta({
        description:
          'Client modules the revision declares, such as a custom input or parameter form.',
      }),
    nodes: z.array(
      z.object({
        id: z.string(),
        key: z.string(),
        title: z.string().nullable(),
        description: z.string().nullable(),
        type: z.string().meta({ description: 'Instruction type of the node.' }),
        config: jsonObject,
        upstreamKey: z.string().nullable(),
        downstreamKey: z.string().nullable(),
        branchKey: z.string().nullable(),
      }),
    ),
  })
  .meta({ ref: 'WorkflowDefinition' });

export const WorkflowParameterSettingsSchema: z.ZodType<WorkflowParameterSettings> =
  z
    .object({
      id: z.string().meta({ description: 'Materialized id of the revision.' }),
      schema: parametersSchema,
      values: parameterValues,
    })
    .meta({ ref: 'WorkflowParameterSettings' });

const workflowRunFields = {
  id: z.string(),
  workflowId: z
    .string()
    .meta({ description: 'Materialized id of the revision that ran.' }),
  workflowKey: z.string(),
  workflowTitle: z.string().nullable(),
  workflowVersion: z.string().nullable(),
  eventKey: z.string().meta({
    description: 'Idempotency key of the event that started the run.',
  }),
  status: runStatus,
  createdAt: timestamp,
  startedAt: timestamp.nullable(),
  finishedAt: timestamp.nullable(),
};

export const WorkflowRunSchema: z.ZodType<WorkflowRunListItem> = z
  .object(workflowRunFields)
  .meta({ ref: 'WorkflowRun' });

export const WorkflowNodeRunSchema: z.ZodType<WorkflowNodeRunSummary> = z
  .object({
    id: z.string(),
    workflowRunId: z.string(),
    nodeId: z.string(),
    nodeKey: z.string(),
    status: z.number().int().meta({
      description:
        'Node run status: `0` pending, `1` resolved, `-1` failed, `-2` error, `-3` aborted.',
    }),
    startedAt: timestamp,
    finishedAt: timestamp.nullable(),
    branchKey: z.string().nullable(),
  })
  .meta({ ref: 'WorkflowNodeRun' });

export const WorkflowRunDetailSchema: z.ZodType<WorkflowRunDetail> = z
  .object({
    ...workflowRunFields,
    hash: z
      .string()
      .nullable()
      .meta({ description: 'Artifact hash of the revision that ran.' }),
    input: z
      .unknown()
      .meta({ description: 'The input the run was started with.' }),
    manually: z.boolean().meta({
      description: 'Whether an administrator started the run by hand.',
    }),
    reason: z
      .string()
      .nullable()
      .meta({ description: 'Why the run ended, such as `timeout`.' }),
    nodeRuns: z.array(WorkflowNodeRunSchema).meta({
      description: 'The latest node run of each node the run reached.',
    }),
  })
  .meta({ ref: 'WorkflowRunDetail' });

export const WorkflowNodeRunPayloadSchema: z.ZodType<WorkflowNodeRunPayload> = z
  .object({
    id: z.string(),
    result: z.unknown().meta({
      description:
        'The node result with secret-looking keys redacted; a truncated JSON string when it exceeds 64 KiB.',
    }),
    error: z.string().nullable(),
    log: z.string().nullable(),
    truncated: z.boolean().meta({
      description: 'Whether the result, error or log was cut at 64 KiB.',
    }),
  })
  .meta({ ref: 'WorkflowNodeRunPayload' });

import { z } from 'zod';

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
  );

/** Runs and node runs are addressed by their positive integer id. */
const recordId: z.ZodString = z
  .string()
  .regex(/^[1-9]\d*$/, 'Must be a positive integer id.');

const page: z.ZodOptional<z.ZodCoercedNumber<unknown>> = z.coerce
  .number()
  .int()
  .min(1)
  .optional();
const pageSize: z.ZodOptional<z.ZodCoercedNumber<unknown>> = z.coerce
  .number()
  .int()
  .min(1)
  .max(100)
  .optional();

export const WorkflowParams: z.ZodObject<
  { workflowId: z.ZodString },
  z.core.$strip
> = z.object({ workflowId: workflowIdentifier });

export const WorkflowSourceParams: z.ZodObject<
  { key: z.ZodString },
  z.core.$strip
> = z.object({ key: z.string().min(1) });

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
  q: z.string().optional(),
  enabled: z.enum(['true', 'false']).optional(),
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
  workflowKey: z.string().optional(),
  workflowTitle: z.string().optional(),
  /** A run status code, or `null` for runs that have not finished. */
  status: z
    .string()
    .regex(/^(?:null|-?\d+)$/, 'Must be an integer status or null.')
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
> = z.object({ nodeKey: z.string().optional(), page, pageSize });

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
  parameterValues: z.record(z.string(), parameterValue),
});
export type WorkflowParametersInput = z.infer<typeof WorkflowParametersInput>;

/** `POST /workflows/{workflowId}/run` starts a manual run with the given input. */
export const RunWorkflowInput: z.ZodObject<
  { input: z.ZodRecord<z.ZodString, z.ZodUnknown> },
  z.core.$strict
> = z.strictObject({ input: z.record(z.string(), z.unknown()) });
export type RunWorkflowInput = z.infer<typeof RunWorkflowInput>;

/** The optional `Event-Key` header makes a manual run idempotent: a repeated key returns the run it started. */
export const RunWorkflowHeaders: z.ZodObject<
  { 'event-key': z.ZodOptional<z.ZodString> },
  z.core.$strip
> = z.object({
  'event-key': z.string().trim().min(1).max(255).optional(),
});

/**
 * The inputs of `POST /plans` and `GET /plans` as callers send them (`plan.routes.ts`): a caller whose plans the
 * application sources (`PlanSourceOf`) leaves `source` out, and lists that source's plans unless it asks for `all`.
 */
import { z } from 'zod';

import {
  PLAN_OPS,
  PLAN_STATUSES,
  type CreatePlanRequest,
  type PlanListQuery,
  type PlanRowInput,
  type PlanSource,
} from '../../../shared/plans.js';

const id = z.string().min(1);
/** A query value; `''` is read as absent, as the browser's forms send it. */
const text = z
  .string()
  .optional()
  .transform((value) => (value === '' ? undefined : value));

const isObject = (value: unknown): boolean =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** A row's `params` are checked per operation by the plan engine, which reports each row's problems (`PLAN_INVALID`). */
const planRow = z
  .custom<PlanRowInput>(
    (value) =>
      isObject(value) &&
      (PLAN_OPS as readonly unknown[]).includes((value as { op?: unknown }).op),
    `A row must be an object with op one of ${PLAN_OPS.join(', ')}.`,
  )
  .meta({
    description:
      'A row shaped as `ProjectsPlanRowInput`: `{ op, params, ref? }`, `op` one of `issue.create`, `issue.update`, `comment.create`, `dependency` and `project.create`.',
  });

/** `POST /plans`: `source` is left out by a caller whose plans the application sources. */
export type ProposePlanRequest = Omit<CreatePlanRequest, 'source'> & {
  readonly source?: PlanSource;
};

export const ProposePlanBody: z.ZodType<ProposePlanRequest> = z.strictObject({
  title: z.string(),
  description: z.string().optional(),
  source: z
    .strictObject({
      kind: z.string().min(1),
      key: z.string().nullable().optional(),
      issueId: id.nullable().optional(),
      // Opaque JSON the proposer gets back untouched (`PlanSource.data`).
      data: z.unknown().optional(),
    })
    .optional()
    .meta({
      description:
        'Where the plan comes from; a newer open plan with the same `key` replaces this one. Required, except from an agent in a conversation, whose plans come from that conversation.',
    }),
  proposer: z
    .strictObject({
      agentId: id,
      runId: id.nullable().optional(),
      conversationId: id.nullable().optional(),
    })
    .nullable()
    .optional(),
  deciderUserId: id.optional(),
  rows: z.array(planRow),
});

/** `GET /plans`, with `all` for a caller whose plans the application sources. */
export type PlanListParams = PlanListQuery & { readonly all?: boolean };

export const PlanListParamsSchema: z.ZodType<PlanListParams> = z
  .object({
    status: z.enum(['open', ...PLAN_STATUSES]).optional(),
    sourceKind: text,
    sourceKey: text,
    issueId: text,
    all: z.enum(['true', 'false']).optional().meta({
      description:
        'From an agent in a conversation: every plan of the person rather than the conversation’s.',
    }),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
    pageToken: z.string().min(1).max(2048).optional(),
  })
  .transform(({ pageSize: limit, pageToken: cursor, all, ...filters }) => ({
    ...Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== undefined),
    ),
    limit,
    ...(cursor ? { cursor } : {}),
    ...(all === 'true' ? { all: true } : {}),
  }));

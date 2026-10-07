/**
 * `/api/projects/plans` (`shared/plans.ts`). Every path acts as the request's viewer; the service decides who may see
 * and decide each plan. People decide; an agent's run in a person's conversation also proposes, reads and lists, its
 * plans sourced by the application (`PlanSourceOf`), and a scoped API key is refused.
 */
import {
  ApiError,
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  cliRoute,
  dataResponse,
  describeRoute,
  listResponse,
} from '@nocobase/app-server/router';
import type { Context, Hono } from 'hono';

import type { Plan, PlanSource } from '../../../shared/plans.js';
import { viewerOf, type ViewerEnv } from '../../access/request.js';
import type { Viewer } from '../../access/viewer.js';
import { DomainError } from '../../kernel/errors.js';
import {
  cursorList,
  domainRouter,
  personOrRunSecurity,
  PROJECTS_DOMAIN,
  tags,
} from '../../kernel/http.js';
import {
  CreatePlanBody,
  CursorListMeta,
  EditPlanBody,
  PlanActionBody,
  PlanParams,
  PlanRehearsalSchema,
  PlanSchema,
  PlanUndoBody,
  PlanUndoResultSchema,
} from '../../routes/schemas.js';
import { PlanListParamsSchema, ProposePlanBody } from './plan.schemas.js';
import type { PlanService, PlanSourceOf } from './ports.js';

export interface PlanRoutesOptions {
  /** Where an agent's plans come from (`projectsPlanSourceToken`), asked on each request. */
  readonly sourceOf?: () => PlanSourceOf | undefined;
}

const people =
  'For people only: a scoped API key or an organization’s API key is refused (403 `SCOPED_KEY_FORBIDDEN`).';
const peopleOrAgents =
  'For people, and for an agent’s run in a person’s conversation (its run token), which acts for that person; a scoped API key or an organization’s API key is refused (403 `SCOPED_KEY_FORBIDDEN`).';
const planArg = { planId: { name: 'plan' } } as const;
/**
 * The action of the plan routes a run reaches: working with one's own operation plans. The application grants it to
 * whoever may use plans; the plans a run sees are its person's, decided by the service.
 */
export const PLANS_USE_ACTION = 'pm.plans/use';
const ANY_CALLER = PLANS_USE_ACTION;

/** An agent the application acts as, rather than the person with a key of theirs. */
function actsAsAgent(viewer: Viewer): boolean {
  return viewer.actor.type !== 'user' || viewer.actor.via === 'agent';
}

function planWords(plan: Plan): string {
  const rows = `${plan.rows.length} row${plan.rows.length === 1 ? '' : 's'}`;
  return `Plan ${plan.id} proposed to ${plan.deciderName ?? plan.deciderUserId}: ${rows}, waiting for them to execute it.`;
}
const rows =
  'Each row is a `ProjectsPlanRowInput`: `op` and its `params`, and optionally a `ref` later rows use for what it creates.';
const invalidPlan = (when: string) =>
  apiErrorResponse(
    400,
    `${when} (\`PLAN_INVALID\`, \`metadata.rows\`: every row’s \`ProjectsPlanRowCheck\`).`,
  );
const notOpen =
  'When the plan is not in a state that allows it (`PLAN_NOT_OPEN`) or has expired (`PLAN_EXPIRED`).';
const revisionConflict = apiErrorResponse(
  409,
  'When the plan changed since `revision` (`REVISION_CONFLICT`).',
);

const actions = {
  execute: {
    summary: 'Execute a plan',
    description: `${people} Runs every row as the caller, in one transaction; the plan ends executed, \`stale\` (a target changed since the rehearsal) or \`failed\`, with nothing applied in the last two cases.`,
    extra: notOpen,
  },
  retry: {
    summary: 'Rehearse a failed or stale plan again',
    description: `${people} The plan is pending again when every row passes.`,
    extra: `${notOpen} Also when a row fails the rehearsal (\`PLAN_INVALID\`).`,
  },
  void: {
    summary: 'Void a plan',
    description: `${people} By its decider.`,
    extra: notOpen,
  },
} as const;

export function createPlanRoutes(
  plans: PlanService,
  options: PlanRoutesOptions = {},
): Hono<ViewerEnv> {
  const routes = domainRouter<ViewerEnv>();
  /** The source the application gives this request's plans; undefined leaves it to the request. */
  const sourceOf = async (
    context: Context<ViewerEnv>,
  ): Promise<PlanSource | null | undefined> =>
    actsAsAgent(viewerOf(context))
      ? ((await options.sourceOf?.()?.(context)) ?? null)
      : undefined;
  routes.post(
    '/rehearse',
    describeRoute({
      tags,
      summary: 'Rehearse a plan without storing it',
      operationId: 'projectsRehearsePlan',
      description: `${people} Every row runs for real in a transaction that is rolled back; each gets its check. ${rows}`,
      ...cliRoute({
        command: 'plan rehearse',
        bodyFile: 'file',
        flags: { proposer: { hidden: true }, deciderUserId: { hidden: true } },
        examples: ['plan rehearse --file plan.json'],
      }),
      responses: {
        200: dataResponse(PlanRehearsalSchema),
        ...apiErrorResponses,
      },
    }),
    apiValidator('json', CreatePlanBody),
    async (context) =>
      context.json({
        data: await plans.rehearse(
          viewerOf(context),
          context.req.valid('json'),
        ),
      }),
  );
  routes.post(
    '/',
    describeRoute({
      tags,
      summary: 'Propose a plan',
      operationId: 'projectsCreatePlan',
      description: `${peopleOrAgents} The plan is rehearsed and stored pending, for the caller to decide; an agent proposes to the person it acts for, its plan coming from the conversation (\`source\` left out), and an agent working on an issue is refused (403 \`PLAN_SOURCE_FORBIDDEN\`). ${rows} \`meta.message\` words the outcome.`,
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'plan create',
        bodyFile: 'file',
        flags: { proposer: { hidden: true }, deciderUserId: { hidden: true } },
        action: ANY_CALLER,
        examples: ['plan create --file plan.json'],
      }),
      responses: {
        201: dataResponse(PlanSchema),
        ...apiErrorResponses,
        400: invalidPlan('When a row fails its rehearsal'),
      },
    }),
    apiValidator('json', ProposePlanBody),
    async (context) => {
      const body = context.req.valid('json');
      const source = await sourceOf(context);
      if (source === null)
        throw new DomainError(
          'forbidden',
          'PLAN_SOURCE_FORBIDDEN',
          'Operation plans are proposed in a conversation, for the person to execute there. Working on an issue, write what you may and ask its owner in a comment for the rest.',
        );
      const { proposer, deciderUserId, ...request } = body;
      const fixed = source ?? body.source;
      if (!fixed)
        throw new ApiError({
          status: 'INVALID_ARGUMENT',
          reason: 'INVALID_INPUT',
          domain: PROJECTS_DOMAIN,
          message: 'source is required.',
          fieldViolations: [
            { field: 'source', description: 'Where the plan comes from.' },
          ],
        });
      const plan = await plans.create(viewerOf(context), {
        ...request,
        source: fixed,
        // An agent's plan goes to the person it acts for, its proposer read from the request.
        ...(source
          ? {}
          : {
              ...(proposer === undefined ? {} : { proposer }),
              ...(deciderUserId === undefined ? {} : { deciderUserId }),
            }),
      });
      return context.json(
        { data: plan, meta: { message: planWords(plan) } },
        201,
      );
    },
  );
  routes.get(
    '/',
    describeRoute({
      tags,
      summary: 'List plans',
      operationId: 'projectsListPlans',
      description: `${peopleOrAgents} Newest first. Without \`issueId\`, the plans the caller decides; with it, the plans about that issue the caller may see: those it is the source of and those whose rows change, comment on, link or put a new issue under it, or, once executed, created it. An issue the caller may not see lists none. \`status=open\` lists the pending, failed and stale ones that have not expired. An agent in a conversation lists that conversation’s plans unless it asks for \`all\`.`,
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'plan list',
        flags: {
          sourceKind: { name: 'source-kind' },
          sourceKey: { name: 'source-key' },
          issueId: { name: 'issue' },
          pageSize: { name: 'limit' },
        },
        columns: ['id', 'status', 'title', 'source.kind', 'expiresAt'],
        action: ANY_CALLER,
        examples: ['plan list --status open'],
      }),
      responses: {
        200: listResponse(PlanSchema, CursorListMeta),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', PlanListParamsSchema),
    async (context) => {
      const { all, ...query } = context.req.valid('query');
      const source = await sourceOf(context);
      const scoped =
        source?.key && !all && !query.sourceKey && !query.issueId
          ? { ...query, sourceKey: source.key }
          : query;
      return context.json(
        cursorList(await plans.list(viewerOf(context), scoped)),
      );
    },
  );
  routes.get(
    '/:planId',
    describeRoute({
      tags,
      summary: 'Get a plan',
      operationId: 'projectsGetPlan',
      description: `${peopleOrAgents} Each row with its check and what happened to it.`,
      security: personOrRunSecurity,
      ...cliRoute({ command: 'plan get', flags: planArg, action: ANY_CALLER }),
      responses: {
        200: dataResponse(PlanSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', PlanParams),
    async (context) =>
      context.json({
        data: await plans.get(
          viewerOf(context),
          context.req.valid('param').planId,
        ),
      }),
  );
  routes.patch(
    '/:planId',
    describeRoute({
      tags,
      summary: 'Edit a plan',
      operationId: 'projectsEditPlan',
      description: `${people} Replaces rows’ params or removes rows, never adds; the plan is rehearsed again.`,
      ...cliRoute({
        command: 'plan update',
        bodyFile: 'file',
        flags: planArg,
        examples: ['plan update 12 --file changes.json'],
      }),
      responses: {
        200: dataResponse(PlanSchema),
        ...apiErrorResponses,
        400: invalidPlan(`${notOpen} Also when a row fails its rehearsal`),
        404: apiErrorResponse(404),
        409: revisionConflict,
      },
    }),
    apiValidator('param', PlanParams),
    apiValidator('json', EditPlanBody),
    async (context) =>
      context.json({
        data: await plans.edit(
          viewerOf(context),
          context.req.valid('param').planId,
          context.req.valid('json'),
        ),
      }),
  );
  for (const action of ['execute', 'retry', 'void'] as const)
    routes.post(
      `/:planId/${action}`,
      describeRoute({
        tags,
        summary: actions[action].summary,
        operationId: {
          execute: 'projectsExecutePlan',
          retry: 'projectsRetryPlan',
          void: 'projectsVoidPlan',
        }[action],
        description: actions[action].description,
        ...cliRoute({
          command: `plan ${action}`,
          flags: planArg,
          ...(action === 'void'
            ? { confirm: 'Void this plan? Nothing in it will run.' }
            : {}),
          ...(action === 'execute'
            ? { examples: ['plan execute 12 --revision 3'] }
            : {}),
        }),
        responses: {
          200: dataResponse(PlanSchema),
          ...apiErrorResponses,
          400: apiErrorResponse(400, actions[action].extra),
          404: apiErrorResponse(404),
          409: revisionConflict,
        },
      }),
      apiValidator('param', PlanParams),
      apiValidator('json', PlanActionBody),
      async (context) =>
        context.json({
          data: await plans[action](
            viewerOf(context),
            context.req.valid('param').planId,
            context.req.valid('json'),
          ),
        }),
    );
  // `{ dryRun: true }` answers what undoing would do; otherwise it is undone at once.
  routes.post(
    '/:planId/undo',
    describeRoute({
      tags,
      summary: 'Undo an executed plan',
      operationId: 'projectsUndoPlan',
      ...cliRoute({
        command: 'plan undo',
        flags: planArg,
        confirm: 'Undo this plan’s changes?',
        examples: ['plan undo 12 --dry-run', 'plan undo 12'],
      }),
      description: `${people} By whoever executed it, within 24 hours. With \`dryRun: true\` answers what undoing would revert and leave alone, changing nothing; otherwise undoes it at once and answers the plan.`,
      responses: {
        200: dataResponse(PlanUndoResultSchema),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'When the plan cannot be undone: not executed (`PLAN_NOT_OPEN`), too late (`UNDO_EXPIRED`), or every row changed since (`NOTHING_TO_UNDO`).',
        ),
        404: apiErrorResponse(404),
        409: apiErrorResponse(
          409,
          'When something changed between the preview and applying it (`UNDO_STALE`): preview again.',
        ),
      },
    }),
    apiValidator('param', PlanParams),
    apiValidator('json', PlanUndoBody),
    async (context) => {
      const { planId } = context.req.valid('param');
      const viewer = viewerOf(context);
      return context.json({
        data:
          context.req.valid('json').dryRun === true
            ? await plans.previewUndo(viewer, planId)
            : await plans.undo(viewer, planId),
      });
    },
  );
  return routes;
}

/**
 * `/api/issueRuns`: agents' runs on issues, as the issue page shows them to the caller, for a person and for an agent's
 * run (which reads for the person who woke it):
 *
 * | route                                | command               | what                                                 |
 * | ------------------------------------ | --------------------- | ---------------------------------------------------- |
 * | `GET /issueRuns?issue=`              | `issue runs [issue]`  | an issue's runs, newest first; a run's own by default |
 * | `GET /issueRuns/:runId`              | `run get <run>`       | one run with its inputs, summary, failure and usage  |
 * | `GET /issueRuns/:runId/events`       | `run events <run>`    | its transcript: the newest events, or after `after`  |
 *
 * Each performs `pm.issues/view`: the issue must be one the caller sees, and its runs are those the caller started or
 * owns, or every run for someone who may read agents (`agents.agents` read, which a run holds only within its scope).
 * A run on anything but an issue (a private conversation) is not found here. The agents plugin's own run routes stay
 * the browser's; Studio keeps their `run get` and `run events` off its command line (`../cli/provider.ts`).
 */
import {
  FailureReasonSchema,
  RunStatusSchema,
  type FailureReason,
  type RunEvent,
  type RunStatus,
} from '@nocobase/agent-protocol';
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import {
  projectsAccessToken,
  projectsToken,
  type Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import type { Application } from '@nocobase/app-server/application';
import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  cliRoute,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  listResponse,
  type AppApiRouteContribution,
  type OpenAPIV3_1,
} from '@nocobase/app-server/router';
import { Hono, type Context } from 'hono';
import { z } from 'zod';

import {
  agentsToken,
  type Agents,
  type CallerIdentity,
} from '@nocobase/app-plugin-agents/server/tokens';
import type { Run, RunDetail } from '@nocobase/app-plugin-agents/shared/runs';

import { studioError, studioErrorHandler } from '../http/errors.js';
import { ISSUE_SUBJECT } from './catalog/triggers.js';
import { createPermissionSource } from './commands/permissions.js';
import { createAskerLookup } from './conversation/acting.js';
import { callerOfRequest, runSubjectOf } from './run-principal.js';

const tags = ['Studio'];
const security: OpenAPIV3_1.SecurityRequirementObject[] = [
  { cookieAuth: [] },
  { apiKeyAuth: [] },
  { runToken: [] },
];
const VIEW_ACTION = 'pm.issues/view';
const VISIBILITY =
  'Needs `pm.issues/view` on an issue the caller sees; lists the runs the caller started or owns, or every run with `agents.agents` read. An agent’s run reads for the person who woke it.';

const RUNS_LIMIT = { default: 20, max: 100 } as const;
const EVENTS_LIMIT = { default: 50, max: 200 } as const;
/** Events read per page while looking for the newest ones. */
const EVENT_PAGE = 500;
/** Pages read at most for the newest events: a transcript longer than this answers its first part's tail. */
const EVENT_PAGES_MAX = 40;
/** Characters of a summary, a failure or an input a list shows; `run get` shows them whole. */
const SNIPPET = 200;
/** Characters of one event's content or output. */
const EVENT_TEXT_MAX = 2_000;

function snippet(text: string | null | undefined, max = SNIPPET): string {
  const flat = (text ?? '').replace(/\s+/gu, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

function clipped(text: string | undefined): string | null {
  if (text === undefined) return null;
  return text.length > EVENT_TEXT_MAX
    ? `${text.slice(0, EVENT_TEXT_MAX)}… (${text.length - EVENT_TEXT_MAX} more characters)`
    : text;
}

/** Why a run started, as its first input names it. */
function triggerOf(detail: Pick<RunDetail, 'inputs'>): string | null {
  for (const input of detail.inputs) {
    const trigger = (input.payload as { trigger?: unknown } | null)?.trigger;
    if (typeof trigger === 'string') return trigger;
  }
  return detail.inputs[0]?.type ?? null;
}

const involves = (run: Run, userId: string): boolean =>
  run.actorUserId === userId || run.ownerUserId === userId;

const RunPosition = z.object({ createdAt: z.string(), id: z.string() });

function encodeToken(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function decodeToken<T>(token: string, schema: z.ZodType<T>): T {
  try {
    return schema.parse(
      JSON.parse(Buffer.from(token, 'base64url').toString('utf8')),
    );
  } catch {
    throw studioError(
      'INVALID_ARGUMENT',
      'INVALID_INPUT',
      'Unknown pageToken.',
      {
        fieldViolations: [
          { field: 'pageToken', description: 'Not a token this list gave.' },
        ],
      },
    );
  }
}

// Schemas.

export interface IssueRunRow {
  readonly id: string;
  readonly agentId: string;
  readonly agent: string;
  readonly status: RunStatus;
  readonly trigger: string | null;
  readonly attempt: number;
  readonly createdAt: string;
  readonly startedAt: string | null;
  readonly finishedAt: string | null;
  readonly summary: string;
  readonly failureReason: FailureReason | null;
  readonly failure: string;
}

const IssueRunRowSchema: z.ZodType<IssueRunRow> = z
  .object({
    id: z.string(),
    agentId: z.string(),
    agent: z.string().meta({ description: "The agent's name." }),
    status: RunStatusSchema,
    trigger: z
      .string()
      .nullable()
      .meta({ description: 'Why it started, as its first input names it.' }),
    attempt: z.number().int(),
    createdAt: z.string(),
    startedAt: z.string().nullable(),
    finishedAt: z.string().nullable(),
    summary: z
      .string()
      .meta({ description: 'Its summary, cut to 200 characters.' }),
    failureReason: FailureReasonSchema.nullable(),
    failure: z
      .string()
      .meta({ description: 'Its failure detail, cut to 200 characters.' }),
  })
  .meta({ ref: 'StudioIssueRun' });

export interface IssueRunDetail {
  readonly id: string;
  readonly agentId: string;
  readonly agent: string;
  readonly issue: {
    readonly id: string;
    readonly identifier: string;
    readonly title: string;
  };
  readonly status: RunStatus;
  readonly trigger: string | null;
  readonly attempt: number;
  readonly maxAttempts: number;
  readonly retryOfRunId: string | null;
  readonly createdAt: string;
  readonly startedAt: string | null;
  readonly finishedAt: string | null;
  readonly summary: string | null;
  readonly failureReason: FailureReason | null;
  readonly failureDetail: string | null;
  readonly inputs: readonly {
    readonly type: string;
    readonly actor: string;
    readonly text: string;
    readonly createdAt: string;
  }[];
  readonly usage: RunDetail['usage'];
  readonly repos: RunDetail['repos'];
  /** The agents it consulted (`ask_agent`): each a run of its own, with its own usage. */
  readonly children: readonly {
    readonly id: string;
    readonly agent: string;
    readonly status: RunStatus;
    readonly summary: string;
  }[];
}

const IssueRunDetailSchema: z.ZodType<IssueRunDetail> = z
  .object({
    id: z.string(),
    agentId: z.string(),
    agent: z.string(),
    issue: z.object({
      id: z.string(),
      identifier: z.string(),
      title: z.string(),
    }),
    status: RunStatusSchema,
    trigger: z.string().nullable(),
    attempt: z.number().int(),
    maxAttempts: z.number().int(),
    retryOfRunId: z.string().nullable(),
    createdAt: z.string(),
    startedAt: z.string().nullable(),
    finishedAt: z.string().nullable(),
    summary: z.string().nullable(),
    failureReason: FailureReasonSchema.nullable(),
    failureDetail: z.string().nullable(),
    inputs: z.array(
      z.object({
        type: z.string(),
        actor: z.string(),
        text: z
          .string()
          .meta({ description: 'The input, cut to 1000 characters.' }),
        createdAt: z.string(),
      }),
    ),
    usage: z.array(
      z.object({
        tool: z.string(),
        model: z.string().nullable(),
        inputTokens: z.number(),
        outputTokens: z.number(),
        cacheReadTokens: z.number(),
        cacheWriteTokens: z.number(),
        reasoningTokens: z.number(),
      }),
    ),
    repos: z.array(
      z.object({
        url: z.string(),
        branch: z.string(),
        pushed: z.boolean(),
        headSha: z.string().nullable(),
        updatedAt: z.string(),
      }),
    ),
    children: z
      .array(
        z.object({
          id: z.string(),
          agent: z.string().meta({ description: "The agent's name." }),
          status: RunStatusSchema,
          summary: z
            .string()
            .meta({ description: 'Its answer, cut to 200 characters.' }),
        }),
      )
      .meta({
        description:
          'The agents it consulted (`ask_agent`), oldest first: each a run of its own, with its own usage.',
      }),
  })
  .meta({ ref: 'StudioIssueRunDetail' });

export interface IssueRunEventRow {
  readonly seq: number;
  readonly at: string;
  readonly type: RunEvent['type'];
  readonly tool: string | null;
  readonly text: string;
  readonly content: string | null;
  readonly output: string | null;
  readonly input?: unknown;
}

const IssueRunEventSchema: z.ZodType<IssueRunEventRow> = z
  .object({
    seq: z.number().int(),
    at: z.string(),
    type: z.string() as z.ZodType<RunEvent['type']>,
    tool: z.string().nullable(),
    text: z.string().meta({
      description: 'Its content or output on one line, cut to 160 characters.',
    }),
    content: z
      .string()
      .nullable()
      .meta({ description: 'Cut to 2000 characters.' }),
    output: z
      .string()
      .nullable()
      .meta({ description: 'Cut to 2000 characters.' }),
    input: z.unknown().optional(),
  })
  .meta({ ref: 'StudioIssueRunEvent' });

const IssueRunsQuery = z.object({
  issue: z.string().min(1).optional().meta({
    description:
      "The issue, by identifier (PM-12) or id; an agent's run on an issue defaults to its own.",
  }),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(RUNS_LIMIT.max)
    .default(RUNS_LIMIT.default)
    .meta({ description: `At most this many runs (${RUNS_LIMIT.max}).` }),
  pageToken: z.string().optional(),
});

const RunParams = z.object({ runId: z.string().min(1) });

const RunEventsQuery = z.object({
  after: z.coerce.number().int().min(0).optional().meta({
    description:
      'Only events after this sequence number, oldest first; the newest without it.',
  }),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(EVENTS_LIMIT.max)
    .default(EVENTS_LIMIT.default)
    .meta({ description: `At most this many events (${EVENTS_LIMIT.max}).` }),
});

const EventsMetaSchema = z.object({
  lastSeq: z.number().int().meta({
    description:
      'The highest `seq` returned; ask for what follows with `after`.',
  }),
});

const RunsMetaSchema = z.object({
  nextPageToken: z.string().optional(),
  message: z.string().optional(),
});

type Env = AuthorizationEnv & {
  Variables: { identity: CallerIdentity; viewer: Viewer; allRuns: boolean };
};

export const issueRunsRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes(({ container }) => {
    // Without authentication, authorization, agents or projects (an application's own tests) there is nothing to serve.
    if (
      !container.has(authenticationToken) ||
      !container.has(authorizationToken) ||
      !container.has(agentsToken) ||
      !container.has(projectsToken)
    )
      return new Hono();
    const authentication = container.resolve(authenticationToken);
    const authorization = container.resolve(authorizationToken);
    const agents: Agents = container.resolve(agentsToken);
    const projects = () => container.resolve(projectsToken);
    const permissions = createPermissionSource(
      () =>
        container.has(projectsAccessToken)
          ? container.resolve(projectsAccessToken)
          : undefined,
      createAskerLookup(agents),
    );

    const routes = new Hono<Env>();
    routes.onError(studioErrorHandler);
    routes.use('*', authentication.required({ scopedKeys: true }));
    routes.use('*', authorization.middleware());
    // Who asks, once they may view issues: their viewer, and whether they read every run.
    routes.use('*', async (context: Context<Env>, next) => {
      const identity = callerOfRequest(context as unknown as Context);
      if (!identity)
        throw studioError(
          'UNAUTHENTICATED',
          'AUTHENTICATION_REQUIRED',
          'Sign in first.',
        );
      if (!(await agents.gate.allowed(identity)).has(VIEW_ACTION))
        throw studioError(
          'PERMISSION_DENIED',
          'ACTION_FORBIDDEN',
          `This needs ${VIEW_ACTION}.`,
        );
      context.set('identity', identity);
      context.set('viewer', await permissions.viewerOf(identity));
      context.set(
        'allRuns',
        await context.get('authz').can({
          resource: { type: 'settings', id: 'agents.agents' },
          action: 'read',
        }),
      );
      await next();
    });

    async function agentNames(): Promise<Map<string, string>> {
      return new Map(
        (await agents.agents.list({ includeArchived: true })).map((agent) => [
          agent.id,
          agent.name,
        ]),
      );
    }

    /** The run, when it is on an issue the caller sees and among the runs they may read; 404 otherwise. */
    async function visibleRun(context: Context<Env>, id: string) {
      const notFound = () =>
        studioError('NOT_FOUND', 'RUN_NOT_FOUND', 'Run not found.');
      const run = await agents.runs.get(id).catch(() => null);
      if (!run || run.subject.kind !== ISSUE_SUBJECT) throw notFound();
      const issue = await projects()
        .issueQueries.detail(context.get('viewer'), run.subject.id)
        .catch(() => null);
      if (!issue) throw notFound();
      if (
        !involves(run, context.get('identity').userId) &&
        !context.get('allRuns')
      )
        throw notFound();
      return { run, issue };
    }

    /** The newest `limit` events, reading the transcript page by page. */
    async function newestEvents(
      runId: string,
      limit: number,
    ): Promise<{ events: RunEvent[]; lastSeq: number }> {
      let kept: RunEvent[] = [];
      let after = 0;
      for (let page = 0; page < EVENT_PAGES_MAX; page += 1) {
        const read = await agents.runs.events(runId, after, EVENT_PAGE);
        kept = [...kept, ...read.events].slice(-limit);
        if (read.events.length < EVENT_PAGE) break;
        after = read.lastSeq;
      }
      return { events: kept, lastSeq: kept.at(-1)?.seq ?? after };
    }

    const noRun = apiErrorResponse(
      404,
      'The run does not exist, is not on an issue the caller sees, or is not one they may read (`RUN_NOT_FOUND`).',
    );
    const runFlags = { runId: { name: 'run', description: 'The run id.' } };

    routes.get(
      '/',
      describeRoute({
        tags,
        summary: "List an issue's agent runs",
        operationId: 'issueRunsList',
        description: `Newest first: who ran, why, how it ended and its summary. ${VISIBILITY} \`meta.message\` says when there are none.`,
        security,
        responses: {
          200: listResponse(IssueRunRowSchema, RunsMetaSchema),
          400: apiErrorResponse(
            400,
            'No `issue` given, and the caller is not a run on an issue (`INVALID_INPUT`).',
          ),
          404: apiErrorResponse(
            404,
            'The issue does not exist or the caller does not see it.',
          ),
          ...apiErrorResponses,
        },
        ...cliRoute({
          command: 'issue runs',
          args: ['issue'],
          flags: { pageSize: { name: 'limit' } },
          columns: ['id', 'agent', 'status', 'trigger', 'createdAt', 'summary'],
          action: VIEW_ACTION,
          examples: ['issue runs PM-12', 'issue runs PM-12 --limit 5'],
        }),
      }),
      apiValidator('query', IssueRunsQuery),
      async (context) => {
        const query = context.req.valid('query');
        const ref =
          query.issue ?? runSubjectOf(context.get('identity'), ISSUE_SUBJECT);
        if (!ref)
          throw studioError(
            'INVALID_ARGUMENT',
            'INVALID_INPUT',
            'Name the issue.',
            {
              fieldViolations: [
                { field: 'issue', description: 'Name the issue.' },
              ],
            },
          );
        const issue = await projects().issueQueries.detail(
          context.get('viewer'),
          ref,
        );
        const runs = await agents.runs.list({
          subjectKind: ISSUE_SUBJECT,
          subjectId: issue.id,
          limit: query.pageSize + 1,
          ...(query.pageToken === undefined
            ? {}
            : { cursor: decodeToken(query.pageToken, RunPosition) }),
          ...(context.get('allRuns')
            ? {}
            : { involvingUserId: context.get('identity').userId }),
        });
        const page = runs.slice(0, query.pageSize);
        const names = await agentNames();
        const data: IssueRunRow[] = [];
        for (const run of page) {
          const detail = await agents.runs.detail(run.id);
          data.push({
            id: run.id,
            agentId: run.agentId,
            agent: names.get(run.agentId) ?? run.agentId,
            status: run.status,
            trigger: triggerOf(detail),
            attempt: run.attempt,
            createdAt: run.createdAt,
            startedAt: run.startedAt,
            finishedAt: run.finishedAt,
            summary: snippet(run.summary),
            failureReason: run.failureReason,
            failure: snippet(run.failureDetail),
          });
        }
        const last = page.at(-1);
        return context.json({
          data,
          meta: {
            ...(runs.length > query.pageSize && last
              ? {
                  nextPageToken: encodeToken({
                    createdAt: last.createdAt,
                    id: last.id,
                  }),
                }
              : {}),
            ...(data.length === 0 && query.pageToken === undefined
              ? { message: `${issue.identifier} has no runs you may read.` }
              : {}),
          },
        });
      },
    );

    routes.get(
      '/:runId',
      describeRoute({
        tags,
        summary: 'Get an agent run on an issue',
        operationId: 'issueRunsGet',
        description: `Its inputs, status, summary or failure, usage and branches; \`meta.message\` words it for a reader. ${VISIBILITY}`,
        security,
        responses: {
          200: dataResponse(IssueRunDetailSchema),
          404: noRun,
          ...apiErrorResponses,
        },
        ...cliRoute({
          command: 'run get',
          args: ['runId'],
          flags: runFlags,
          action: VIEW_ACTION,
          examples: ['run get <run>'],
        }),
      }),
      apiValidator('param', RunParams),
      async (context) => {
        const { run, issue } = await visibleRun(
          context,
          context.req.valid('param').runId,
        );
        const detail = await agents.runs.detail(run.id);
        const agent = (await agentNames()).get(run.agentId) ?? run.agentId;
        const lines = [
          `Run ${run.id} of ${agent} on ${issue.identifier} ${issue.title}: ${run.status}${run.failureReason ? ` (${run.failureReason})` : ''}`,
          ...(run.summary ? ['', run.summary.trim()] : []),
          ...(run.failureDetail ? ['', run.failureDetail.trim()] : []),
        ];
        const data: IssueRunDetail = {
          id: run.id,
          agentId: run.agentId,
          agent,
          issue: {
            id: issue.id,
            identifier: issue.identifier,
            title: issue.title,
          },
          status: run.status,
          trigger: triggerOf(detail),
          attempt: run.attempt,
          maxAttempts: run.maxAttempts,
          retryOfRunId: run.retryOfRunId,
          createdAt: run.createdAt,
          startedAt: run.startedAt,
          finishedAt: run.finishedAt,
          summary: run.summary,
          failureReason: run.failureReason,
          failureDetail: run.failureDetail,
          inputs: detail.inputs.map((input) => ({
            type: input.type,
            actor: input.actor.name,
            text: snippet(input.text, 1_000),
            createdAt: input.createdAt,
          })),
          usage: detail.usage,
          repos: detail.repos,
          children: detail.children.map((child) => ({
            id: child.id,
            agent: child.agentName ?? child.agentId,
            status: child.status,
            summary: snippet(child.summary),
          })),
        };
        for (const child of data.children)
          lines.push(
            '',
            `Consulted ${child.agent} (run ${child.id}, ${child.status})${child.summary ? `: ${child.summary}` : ''}`,
          );
        return context.json({ data, meta: { message: lines.join('\n') } });
      },
    );

    routes.get(
      '/:runId/events',
      describeRoute({
        tags,
        summary: "Read an agent run's transcript on an issue",
        operationId: 'issueRunsListEvents',
        description: `The newest events, or those after \`after\` (a sequence number), oldest first; read on with \`after\` set to \`meta.lastSeq\`. ${VISIBILITY}`,
        security,
        responses: {
          200: listResponse(IssueRunEventSchema, EventsMetaSchema),
          404: noRun,
          ...apiErrorResponses,
        },
        ...cliRoute({
          command: 'run events',
          args: ['runId'],
          flags: { ...runFlags, pageSize: { name: 'limit' } },
          columns: ['seq', 'at', 'type', 'tool', 'text'],
          action: VIEW_ACTION,
          examples: ['run events <run>', 'run events <run> --after 120'],
        }),
      }),
      apiValidator('param', RunParams),
      apiValidator('query', RunEventsQuery),
      async (context) => {
        const { run } = await visibleRun(
          context,
          context.req.valid('param').runId,
        );
        const { after, pageSize } = context.req.valid('query');
        const read =
          after === undefined
            ? await newestEvents(run.id, pageSize)
            : await agents.runs.events(run.id, after, pageSize);
        const data: IssueRunEventRow[] = read.events.map((event) => ({
          seq: event.seq,
          at: event.at,
          type: event.type,
          tool: event.tool ?? null,
          text: snippet(event.content ?? event.output ?? '', 160),
          content: clipped(event.content),
          output: clipped(event.output),
          ...(event.input === undefined ? {} : { input: event.input }),
        }));
        return context.json({
          data,
          meta: { lastSeq: read.lastSeq },
        });
      },
    );

    const router = new Hono();
    router.route('/issueRuns', routes);
    return router;
  });

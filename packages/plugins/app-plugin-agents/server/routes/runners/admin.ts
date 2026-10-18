/**
 * The people-facing runners API, mounted at `/api/agents/runners` beside the runner protocol (`runner.ts`): runners
 * and registration tokens. Every route is behind the guard the route contribution passes (a signed-in user and their
 * authorization context); what each caller may do is checked here.
 *
 * - `agents.runners` read/manage: every runner; adding a team runner, and revoking and deleting any runner. Revoking
 *   someone else's runner is an emergency measure: its owner is told, and the server log records who did it.
 * - Changing a runner (its name, slots, coding tools, policy and trust) is its owner's alone, because the runner is
 *   their machine with their tools' sign-ins and credentials: a manager who could share it with the team would send
 *   everyone's work there. A runner whose owner can no longer act (no owner recorded, or an owner the application's
 *   directory reports disabled or deleted, `people.inactive`) is changed by managers of runners, or nobody could.
 *   Anyone signed in may add a personal runner and change their own, including sharing it with the
 *   team. Reading agents (`agents.agents` read) also shows every runner, to pick where an agent runs.
 * - A runner's page: whoever sees a runner sees which agents it takes (`takes`), what it holds now
 *   (`GET /agents/runners/:runnerId/work`: its runs as the caller may see them, then its jobs) and its latest runs
 *   (`GET /agents/runners/:runnerId/runs`). What identifies its machine (its host name, where its tools are installed)
 *   its owner, the managers of runners and anyone who may wake at least one agent see; everyone else sees neither
 *   (`runnerForViewer`).
 */
import {
  runnerListItem,
  workspaceCategory,
  workspaceSummary,
} from '../../../shared/runners.js';
import {
  AgentToolSchema,
  MIN_PROTOCOL_VERSION,
  PROTOCOL_VERSION,
} from '@nocobase/agent-protocol';
import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  cliRoute,
  dataResponse,
  describeRoute,
  emptyResponse,
  listResponse,
} from '@nocobase/app-server/router';
import type { Context, Hono, MiddlewareHandler } from 'hono';

import type { SettingsAction, SettingsItem } from '../../../shared/access.js';
import type {
  Runner,
  RunnerHeldItem,
  RunnerSummary,
  RunnerListItem,
  RunnerWorkTarget,
} from '../../../shared/runners.js';
import type { Agents } from '../../composition.js';
import {
  runnerForViewer,
  runnerPublicData,
} from '../../core/runs/runner-view.js';
import { upgradeFor } from '../../distribution/index.js';
import { forbidden, notFound } from '../../kernel/errors.js';
import { domainRouter } from '../../kernel/http.js';
import { z } from 'zod';
import { ACTIVE, runsRepo } from '../../core/runs/run.store.js';
import { tags } from '../openapi.js';
import {
  RegistrationTokenInputSchema,
  RegistrationTokenSchema,
  RegistrationTokenListQuery,
  RegistrationTokenSummarySchema,
  RunnerHeldItemSchema,
  RunnerParams,
  RunnerPatchInput,
  RunnerRecentRunSchema,
  RunnerSchema,
  RunnerSummarySchema,
  RunnerWorkspaceSchema,
  RunnerWorkspacePageMetaSchema,
  RunnerListItemSchema,
} from '../schemas.js';

/** Who is asking, and whether one of this plugin's settings grants is theirs. */
export interface AdminCaller {
  readonly userId: string;
  can(item: SettingsItem, action: SettingsAction): Promise<boolean>;
}

export interface AdminEnv {
  Variables: { caller: AdminCaller; runnerToManage: Runner };
}

function caller(context: Context<AdminEnv>): AdminCaller {
  return context.get('caller');
}

/** Where a manager revoking someone else's runner is recorded: the application's logger. */
export interface AdminAuditLogger {
  info(details: Readonly<Record<string, unknown>>, message: string): void;
}

export interface AdminRoutesOptions {
  /** Without one, the record goes to the console. */
  readonly logger?: AdminAuditLogger;
}

/**
 * `guard` authenticates the request and sets `caller`; the route contribution installs the real one, tests a fake.
 */
export function createAdminRoutes(
  services: Agents,
  guard: MiddlewareHandler<AdminEnv>,
  options: AdminRoutesOptions = {},
): Hono<AdminEnv> {
  const audit: AdminAuditLogger = options.logger ?? {
    info: (details, message) => console.info(message, details),
  };
  const router = domainRouter<AdminEnv>();
  const runnerParam = apiValidator('param', RunnerParams);
  const notVisible = apiErrorResponse(
    404,
    'The runner does not exist, or the caller may not see it.',
  );
  const editErrors = {
    ...apiErrorResponses,
    403: apiErrorResponse(
      403,
      "Only the runner's owner may change it; a manager of runners (`agents.runners` manage) only once its owner can no longer act.",
    ),
    404: notVisible,
  };
  const revokeErrors = {
    ...apiErrorResponses,
    403: apiErrorResponse(
      403,
      "Only the runner's owner or a manager of runners (`agents.runners` manage) may revoke or delete it.",
    ),
    404: notVisible,
  };

  const grants = new WeakMap<AdminCaller, Map<string, Promise<boolean>>>();
  const can = (
    who: AdminCaller,
    item: SettingsItem,
    action: SettingsAction,
  ): Promise<boolean> => {
    let cached = grants.get(who);
    if (!cached) {
      cached = new Map();
      grants.set(who, cached);
    }
    const key = `${item}/${action}`;
    let value = cached.get(key);
    if (!value) {
      value = who.can(item, action);
      cached.set(key, value);
    }
    return value;
  };

  /** Whether the caller sees every runner: `agents.runners` read, or `agents.agents` read (to pick where one runs). */
  const seesEveryRunner = async (who: AdminCaller): Promise<boolean> =>
    (await can(who, 'agents.runners', 'read')) ||
    (await can(who, 'agents.agents', 'read'));

  /** Whether the caller may wake at least one agent; asked once per request. */
  const usesAgents = new WeakMap<AdminCaller, Promise<boolean>>();
  const mayUseAgents = (who: AdminCaller): Promise<boolean> => {
    let found = usesAgents.get(who);
    if (!found) {
      found = services.agents
        .list()
        .then((agents) =>
          agents.some((agent) => services.agents.mayInvoke(agent, who.userId)),
        );
      usesAgents.set(who, found);
    }
    return found;
  };

  /** Whether nobody can act as the runner's owner: none recorded, or one the directory reports disabled or deleted. */
  const ownerGone = async (runner: Runner): Promise<boolean> =>
    runner.ownerUserId === null ||
    (
      await services.people.inactive(services.tx.read(), [runner.ownerUserId])
    ).has(runner.ownerUserId);

  /** What the caller may do with a runner, or 404 when they may not see it. */
  const runnerRights = async (
    context: Context<AdminEnv>,
    runner: Runner,
    inactive?: ReadonlySet<string>,
  ): Promise<{
    readonly see: boolean;
    readonly edit: boolean;
    readonly revoke: boolean;
    readonly machine: boolean;
  }> => {
    const who = caller(context);
    const own = runner.ownerUserId === who.userId;
    const revoke = own || (await can(who, 'agents.runners', 'manage'));
    const edit =
      own ||
      (revoke &&
        (inactive
          ? !runner.ownerUserId || inactive.has(runner.ownerUserId)
          : await ownerGone(runner)));
    const see = revoke || (await seesEveryRunner(who));
    const machine = revoke || (see && (await mayUseAgents(who)));
    return { see, edit, revoke, machine };
  };

  /** The agents each runner takes. */
  const takesOf = async (
    runners: readonly Runner[],
  ): Promise<ReadonlyMap<string, readonly RunnerWorkTarget[]>> =>
    runners.length > 0
      ? services.runnerView.takes(runners)
      : new Map<string, readonly RunnerWorkTarget[]>();

  const summarizeRunner = async (
    context: Context<AdminEnv>,
    runner: Runner,
    takes: ReadonlyMap<string, readonly RunnerWorkTarget[]>,
    prefetched?: {
      readonly held: ReadonlyMap<
        string,
        { runs: number; jobs: number; byTool: Record<string, number> }
      >;
      readonly inactive: ReadonlySet<string>;
    },
  ): Promise<Omit<RunnerSummary, 'recentRunsCount'>> => {
    const rights = await runnerRights(context, runner, prefetched?.inactive);
    const held =
      prefetched?.held.get(runner.id) ??
      (await services.slots.held(services.tx.read(), runner.id));
    const visible = runnerForViewer(runner, rights.machine);
    return {
      ...visible,
      activeRuns: held.runs,
      activeJobs: held.jobs,
      activeByTool: held.byTool ?? {},
      takes: takes.get(runner.id) ?? [],
      canManage: rights.edit,
      canChangeTrust: rights.edit,
      canRevoke: rights.revoke,
      canClearQuota: rights.revoke,
      updateVersion:
        (await upgradeFor(services.dist, runner))?.latestVersion ?? null,
      requiredProtocol: { min: MIN_PROTOCOL_VERSION, max: PROTOCOL_VERSION },
      offersJobs: services.jobs.kinds().length > 0,
    };
  };

  /** The runner named in the path if the caller may change it: 404 when they may not see it, 403 when not theirs. */
  const editableRunner = async (
    context: Context<AdminEnv>,
  ): Promise<Runner> => {
    const runner = await services.runners.get(
      context.req.param('runnerId') ?? '',
    );
    const rights = await runnerRights(context, runner);
    if (!rights.see) throw notFound('Runner');
    if (!rights.edit)
      throw forbidden(
        "Only the runner's owner may change it; a manager of runners only once its owner can no longer act.",
      );
    return runner;
  };

  /** The runner named in the path if the caller may revoke or delete it: 404 when they may not see it, else 403. */
  const revocableRunner = async (
    context: Context<AdminEnv>,
  ): Promise<Runner> => {
    const runner = await services.runners.get(
      context.req.param('runnerId') ?? '',
    );
    const rights = await runnerRights(context, runner);
    if (!rights.see) throw notFound('Runner');
    if (!rights.revoke)
      throw forbidden(
        "Only the runner's owner or a manager of runners may revoke or delete it.",
      );
    return runner;
  };

  // Runners.
  /** The runner named in the path, or 404 when the caller may not see it. */
  const visibleRunner = async (context: Context<AdminEnv>): Promise<Runner> => {
    const runner = await services.runners.get(
      context.req.param('runnerId') ?? '',
    );
    if (!(await runnerRights(context, runner)).see) throw notFound('Runner');
    return runner;
  };

  router.get(
    '/',
    guard,
    describeRoute({
      tags,
      summary: 'List runners',
      operationId: 'agentsListRunners',
      ...cliRoute({
        command: 'runtime list',
        columns: [
          'id',
          'name',
          'status',
          'ownerName',
          'trust',
          'activeRuns',
          'workspaceUsage.count',
          'workspaceUsage.unpushedCount',
          'workspaceUsage.disk.freeBytes',
        ],
      }),
      description:
        "Every runner for a reader of runners or of agents (`agents.runners` or `agents.agents` read); otherwise the caller's own. Workspace usage contains totals only; use runtime workspaces (GET /agents/runners/:runnerId/workspaces) for directory diagnostics.",
      responses: {
        200: listResponse(RunnerListItemSchema),
        ...apiErrorResponses,
      },
    }),
    async (context) => {
      const all = await services.runners.list({ workspaceDetails: false });
      const conn = services.tx.read();
      const inactive = await services.people.inactive(conn, [
        ...new Set(
          all.flatMap((runner) =>
            runner.ownerUserId ? [runner.ownerUserId] : [],
          ),
        ),
      ]);
      const jobs = await services.slots.jobsByRunner(conn);
      const runs = await runsRepo(conn).findMany({
        filter: (f) =>
          f.or([...ACTIVE.map((status) => f.string('status').eq(status))]),
        select: (s) => s.fields('runnerId', 'tool'),
      });
      const held = new Map<
        string,
        { runs: number; jobs: number; byTool: Record<string, number> }
      >(
        all.map((runner) => [
          runner.id,
          {
            runs: 0,
            jobs: jobs.get(runner.id) ?? 0,
            byTool: {},
          },
        ]),
      );
      for (const run of runs) {
        const item = run.runnerId ? held.get(run.runnerId) : undefined;
        if (item) {
          item.runs++;
          if (run.tool)
            item.byTool[run.tool] = (item.byTool[run.tool] ?? 0) + 1;
        }
      }
      const visible: Runner[] = [];
      for (const runner of all)
        if ((await runnerRights(context, runner, inactive)).see)
          visible.push(runner);
      const takes = await takesOf(visible);
      const data = await Promise.all(
        visible.map(async (runner): Promise<RunnerListItem> => {
          const summary = await summarizeRunner(context, runner, takes, {
            held,
            inactive,
          });
          return runnerListItem(summary);
        }),
      );
      return context.json({ data, meta: { total: data.length } });
    },
  );
  router.get(
    '/registrationTokens',
    guard,
    describeRoute({
      tags,
      summary: 'List usable runner registration tokens',
      operationId: 'agentsListRunnerRegistrationTokens',
      ...cliRoute({
        command: 'runtime token list',
        columns: ['id', 'createdById', 'trust', 'expiresAt'],
      }),
      description:
        'Unused, unexpired token metadata, without secrets or hashes. Managers of runners see all tokens; other signed-in callers see their own.',
      responses: {
        200: listResponse(RegistrationTokenSummarySchema),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', RegistrationTokenListQuery),
    async (context) => {
      const who = caller(context);
      const query = context.req.valid('query');
      const result = await services.runners.listRegistrationTokens({
        ...query,
        ...((await can(who, 'agents.runners', 'manage'))
          ? {}
          : { createdById: who.userId }),
      });
      return context.json({
        data: result.data,
        meta: { total: result.total, ...query },
      });
    },
  );
  router.post(
    '/registrationTokens',
    guard,
    describeRoute({
      tags,
      summary: 'Create a runner registration token',
      operationId: 'agentsCreateRunnerRegistrationToken',
      ...cliRoute({
        command: 'runtime token create',
        examples: ['runtime token create --trust team'],
      }),
      description:
        'A one-time token the install script registers a runner with; the token is shown only in this answer. Anyone signed in may add a personal runner; a runner shared with the team (`trust: team`) needs `agents.runners` manage.',
      responses: {
        201: dataResponse(RegistrationTokenSchema, 'Created.'),
        ...apiErrorResponses,
      },
    }),
    apiValidator('json', RegistrationTokenInputSchema),
    async (context) => {
      const who = caller(context);
      const input = context.req.valid('json');
      if (
        input.trust === 'team' &&
        !(await can(who, 'agents.runners', 'manage'))
      )
        throw forbidden(
          'Adding a runner shared with the team needs agents.runners manage permission.',
        );
      return context.json(
        {
          data: await services.runners.createRegistrationToken(
            who.userId,
            input,
          ),
        },
        201,
      );
    },
  );
  router.get(
    '/:runnerId',
    guard,
    describeRoute({
      tags,
      summary: 'Get a runner',
      operationId: 'agentsGetRunner',
      description:
        'Overview settings and workspace totals only. Directory details and recent run rows load from their own endpoints when the tab opens.',
      ...cliRoute({
        command: 'runtime get',
        args: ['runnerId'],
        flags: { runnerId: { name: 'runtime' } },
      }),
      responses: {
        200: dataResponse(RunnerSummarySchema),
        ...apiErrorResponses,
        404: notVisible,
      },
    }),
    runnerParam,
    async (context) => {
      const runner = await visibleRunner(context);
      return context.json({
        data: {
          ...(await summarizeRunner(
            context,
            {
              ...runner,
              workspaceUsage: runner.workspaceUsage
                ? { ...workspaceSummary(runner.workspaceUsage), workspaces: [] }
                : null,
            },
            await takesOf([runner]),
          )),
          recentRunsCount: await services.runnerView.recentCount(runner.id),
        },
      });
    },
  );
  /** What the runner holds now: its runs, then its jobs. */
  router.get(
    '/:runnerId/work',
    guard,
    describeRoute({
      tags,
      summary: 'List the work a runner holds',
      operationId: 'agentsListRunnerWork',
      ...cliRoute({
        command: 'runtime work',
        args: ['runnerId'],
        flags: { runnerId: { name: 'runtime' } },
        columns: ['id', 'kind', 'title', 'status', 'startedAt'],
      }),
      description:
        'Its runs as the caller may see them, then its jobs, while they are dispatched or running.',
      responses: {
        200: listResponse(RunnerHeldItemSchema),
        ...apiErrorResponses,
        404: notVisible,
      },
    }),
    runnerParam,
    async (context) => {
      const runner = await visibleRunner(context);
      const runs = await services.runnerView.held(
        runner,
        caller(context).userId,
      );
      const jobs = (
        await services.jobs.list({ runnerId: runner.id, limit: 200 })
      ).filter(
        (job) => job.status === 'dispatched' || job.status === 'running',
      );
      const data: RunnerHeldItem[] = [
        ...runs,
        ...jobs.map((job) => ({
          id: job.id,
          kind: 'job' as const,
          title: job.title ?? job.kind,
          status: job.status as RunnerHeldItem['status'],
          startedAt: job.startedAt ?? job.dispatchedAt,
          path: null,
        })),
      ];
      return context.json({ data, meta: { total: data.length } });
    },
  );
  router.get(
    '/:runnerId/runs',
    guard,
    describeRoute({
      tags,
      summary: "List a runner's recent runs",
      operationId: 'agentsListRunnerRuns',
      ...cliRoute({
        command: 'runtime runs',
        args: ['runnerId'],
        flags: { runnerId: { name: 'runtime' } },
        columns: ['id', 'title', 'status', 'createdAt'],
      }),
      description:
        'Its latest runs whatever their status, newest first, without the link of a private run the caller is not part of.',
      responses: {
        200: listResponse(RunnerRecentRunSchema),
        ...apiErrorResponses,
        404: notVisible,
      },
    }),
    runnerParam,
    async (context) => {
      const runner = await visibleRunner(context);
      const data = await services.runnerView.recent(
        runner,
        caller(context).userId,
      );
      return context.json({ data, meta: { total: data.length } });
    },
  );
  router.patch(
    '/:runnerId',
    guard,
    describeRoute({
      tags,
      summary: 'Update a runner',
      operationId: 'agentsUpdateRunner',
      ...cliRoute({
        command: 'runtime update',
        args: ['runnerId'],
        flags: { runnerId: { name: 'runtime' } },
      }),
      description:
        "Its owner's alone, a manager of runners (`agents.runners` manage) included; a runner whose owner can no longer act (none recorded, or disabled or deleted) is changed by managers of runners.",
      responses: { 200: dataResponse(RunnerSchema), ...editErrors },
    }),
    runnerParam,
    async (context, next) => {
      context.set('runnerToManage', await editableRunner(context));
      await next();
    },
    apiValidator('json', RunnerPatchInput),
    async (context) =>
      context.json({
        data: runnerPublicData(
          await services.runners.update(
            context.get('runnerToManage').id,
            context.req.valid('json'),
          ),
        ),
      }),
  );
  router.post(
    '/:runnerId/revoke',
    guard,
    describeRoute({
      tags,
      summary: 'Revoke a runner',
      operationId: 'agentsRevokeRunner',
      ...cliRoute({
        command: 'runtime revoke',
        args: ['runnerId'],
        flags: { runnerId: { name: 'runtime' } },
        confirm:
          'Revoke this runtime? It stops taking work and must register again.',
      }),
      description:
        "Revokes the runner and its keys; the runs and jobs it held go back to the queue. Its owner or a manager of runners (`agents.runners` manage); a manager revoking someone else's runner tells its owner.",
      responses: { 200: dataResponse(RunnerSchema), ...revokeErrors },
    }),
    runnerParam,
    async (context) => {
      const runner = await revocableRunner(context);
      const by = caller(context).userId;
      const revoked = await services.runners.revoke(runner.id, { by });
      if (runner.ownerUserId !== null && runner.ownerUserId !== by)
        audit.info(
          {
            event: 'agents.runner.revoked',
            runnerId: runner.id,
            runnerName: runner.name,
            ownerUserId: runner.ownerUserId,
            actorId: by,
          },
          "A manager of runners revoked someone else's runner.",
        );
      // What it held goes back to the queue now rather than at the next sweep.
      await services.sweeper.sweep();
      return context.json({ data: runnerPublicData(revoked) });
    },
  );
  router.delete(
    '/:runnerId',
    guard,
    describeRoute({
      tags,
      summary: 'Delete a runner',
      operationId: 'agentsDeleteRunner',
      ...cliRoute({
        command: 'runtime delete',
        args: ['runnerId'],
        flags: { runnerId: { name: 'runtime' } },
        confirm: 'Delete this runtime?',
      }),
      description:
        'Deletes a revoked runner; its past runs keep its id. First run runtime revoke <runtime>, then runtime delete <runtime>.',
      responses: {
        204: emptyResponse(),
        ...revokeErrors,
        400: apiErrorResponse(
          400,
          'The runner is not revoked (`RUNNER_NOT_REVOKED`).',
        ),
      },
    }),
    runnerParam,
    async (context) => {
      const runner = await revocableRunner(context);
      await services.runners.remove(runner.id);
      return context.body(null, 204);
    },
  );

  router.post(
    '/:runnerId/quota/clear',
    guard,
    describeRoute({
      tags,
      summary: 'Clear a runtime quota mark',
      operationId: 'agentsClearRunnerQuota',
      ...cliRoute({
        command: 'runtime quota clear',
        args: ['runnerId'],
        flags: { runnerId: { name: 'runtime' } },
      }),
      responses: {
        204: emptyResponse(),
        ...apiErrorResponses,
        403: apiErrorResponse(
          403,
          'Only the runtime owner or a runtime administrator may clear an unknown-reset quota mark.',
        ),
        404: notVisible,
        400: apiErrorResponse(
          400,
          'A known reset clears automatically (QUOTA_RESET_KNOWN, FAILED_PRECONDITION).',
        ),
        409: apiErrorResponse(
          409,
          'A concurrent quota change requires retrying (REVISION_CONFLICT).',
        ),
      },
    }),
    runnerParam,
    apiValidator(
      'json',
      z.strictObject({
        tool: AgentToolSchema.describe(
          'The coding tool whose unknown-reset mark is selected.',
        ),
        scope: z
          .enum(['tool', 'provider', 'model'])
          .describe('The scope of the selected quota mark.'),
        target: z
          .string()
          .max(200)
          .describe('The provider or model id; empty for a whole-tool mark.'),
        window: z
          .string()
          .min(1)
          .max(100)
          .describe('The selected usage window.'),
      }),
    ),
    async (context) => {
      const runner = await revocableRunner(context);
      await services.runners.clearQuota(runner.id, context.req.valid('json'));
      return context.body(null, 204);
    },
  );
  router.get(
    '/:runnerId/workspaces',
    guard,
    describeRoute({
      tags,
      summary: 'Read runtime workspace diagnostics',
      operationId: 'agentsRunnerWorkspaces',
      ...cliRoute({
        command: 'runtime workspaces',
        args: ['runnerId'],
        flags: { runnerId: { name: 'runtime' } },
      }),
      responses: {
        200: listResponse(RunnerWorkspaceSchema, RunnerWorkspacePageMetaSchema),
        ...apiErrorResponses,
      },
    }),
    runnerParam,
    apiValidator(
      'query',
      z.object({
        page: z.coerce
          .number()
          .int()
          .min(1)
          .default(1)
          .describe('One-based workspace page.'),
        pageSize: z.coerce
          .number()
          .int()
          .min(1)
          .max(100)
          .default(50)
          .describe('Workspace rows per page, from 1 to 100.'),
        status: z
          .enum(['all', 'active', 'retained', 'ended'])
          .default('all')
          .describe(
            'All directories, active subjects, retained directories needing verification, or ended directories eligible for cleanup.',
          ),
      }),
    ),
    async (context) => {
      const runner = await services.runners.get(
        context.req.valid('param').runnerId,
      );
      const rights = await runnerRights(context, runner);
      if (!rights.see) throw notFound('Runner');
      const visible = runnerForViewer(
        {
          ...runner,
          workspaceUsage: runner.workspaceUsage
            ? workspaceSummary(runner.workspaceUsage)
            : null,
        },
        rights.machine,
      );
      const query = context.req.valid('query');
      const usage = visible.workspaceUsage;
      const rows = (usage?.workspaces ?? []).filter(
        (workspace) =>
          query.status === 'all' ||
          workspaceCategory(workspace) === query.status,
      );
      const { workspaces: _rows, ...totals } = usage ?? { workspaces: [] };
      return context.json({
        data: rows.slice(
          (query.page - 1) * query.pageSize,
          query.page * query.pageSize,
        ),
        meta: {
          total: rows.length,
          page: query.page,
          pageSize: query.pageSize,
          usage: usage ? totals : null,
        },
      });
    },
  );
  return router;
}

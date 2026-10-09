/**
 * The people-facing runners API, mounted at `/api/agents/runners` beside the runner protocol (`runner.ts`): runners
 * and registration tokens. Every route is behind the guard the route contribution passes (a signed-in user and their
 * authorization context); what each caller may do is checked here.
 *
 * - `agents.runners` read/manage: every runner; adding a team runner, changing, revoking and deleting any runner.
 *   Anyone signed in may add a personal runner and manage their own runners, including sharing one with the team and
 *   choosing which coding tools it runs. Reading agents (`agents.agents` read) also shows every runner, to pick where
 *   an agent runs.
 * - A runner's page: whoever sees a runner sees which agents it takes (`takes`), what it holds now
 *   (`GET /agents/runners/:runnerId/work`: its runs as the caller may see them, then its jobs) and its latest runs
 *   (`GET /agents/runners/:runnerId/runs`). What identifies its machine (its host name, where its tools are installed)
 *   its owner, the managers of runners and anyone who may wake at least one agent see; everyone else sees neither
 *   (`runnerForViewer`).
 */
import {
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
  RunnerWorkTarget,
} from '../../../shared/runners.js';
import type { Agents } from '../../composition.js';
import { runnerForViewer } from '../../core/runs/runner-view.js';
import { upgradeFor } from '../../distribution/index.js';
import { forbidden, notFound } from '../../kernel/errors.js';
import { domainRouter } from '../../kernel/http.js';
import { tags } from '../openapi.js';
import {
  RegistrationTokenInputSchema,
  RegistrationTokenSchema,
  RunnerHeldItemSchema,
  RunnerParams,
  RunnerPatchInput,
  RunnerRecentRunSchema,
  RunnerSchema,
  RunnerSummarySchema,
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

/**
 * `guard` authenticates the request and sets `caller`; the route contribution installs the real one, tests a fake.
 */
export function createAdminRoutes(
  services: Agents,
  guard: MiddlewareHandler<AdminEnv>,
): Hono<AdminEnv> {
  const router = domainRouter<AdminEnv>();
  const runnerParam = apiValidator('param', RunnerParams);
  const notVisible = apiErrorResponse(
    404,
    'The runner does not exist, or the caller may not see it.',
  );
  const manageErrors = {
    ...apiErrorResponses,
    403: apiErrorResponse(
      403,
      "Only the runner's owner or a manager of runners (`agents.runners` manage) may change it.",
    ),
    404: notVisible,
  };

  /** Whether the caller sees every runner: `agents.runners` read, or `agents.agents` read (to pick where one runs). */
  const seesEveryRunner = async (who: AdminCaller): Promise<boolean> =>
    (await who.can('agents.runners', 'read')) ||
    (await who.can('agents.agents', 'read'));

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

  /** What the caller may do with a runner, or 404 when they may not see it. */
  const runnerRights = async (
    context: Context<AdminEnv>,
    runner: Runner,
  ): Promise<{
    readonly see: boolean;
    readonly manage: boolean;
    readonly machine: boolean;
  }> => {
    const who = caller(context);
    const own = runner.ownerUserId === who.userId;
    const manage = own || (await who.can('agents.runners', 'manage'));
    const see = manage || (await seesEveryRunner(who));
    const machine = manage || (see && (await mayUseAgents(who)));
    return { see, manage, machine };
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
  ): Promise<RunnerSummary> => {
    const rights = await runnerRights(context, runner);
    const held = await services.slots.held(services.tx.read(), runner.id);
    return {
      ...runnerForViewer(runner, rights.machine),
      activeRuns: held.runs,
      activeJobs: held.jobs,
      activeByTool: held.byTool ?? {},
      takes: takes.get(runner.id) ?? [],
      canManage: rights.manage,
      canChangeTrust: rights.manage,
      updateVersion:
        (await upgradeFor(services.dist, runner))?.latestVersion ?? null,
      requiredProtocol: { min: MIN_PROTOCOL_VERSION, max: PROTOCOL_VERSION },
      offersJobs: services.jobs.kinds().length > 0,
    };
  };

  const manageableRunner = async (
    context: Context<AdminEnv>,
  ): Promise<Runner> => {
    const runner = await services.runners.get(
      context.req.param('runnerId') ?? '',
    );
    const rights = await runnerRights(context, runner);
    if (!rights.see) throw notFound('Runner');
    if (!rights.manage)
      throw forbidden(
        "Only the runner's owner or a manager of runners may change it.",
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
        columns: ['id', 'name', 'status', 'ownerName', 'trust', 'activeRuns'],
      }),
      description:
        "Every runner for a reader of runners or of agents (`agents.runners` or `agents.agents` read); otherwise the caller's own.",
      responses: {
        200: listResponse(RunnerSummarySchema),
        ...apiErrorResponses,
      },
    }),
    async (context) => {
      const visible: Runner[] = [];
      for (const runner of await services.runners.list())
        if ((await runnerRights(context, runner)).see) visible.push(runner);
      const takes = await takesOf(visible);
      const data: RunnerSummary[] = [];
      for (const runner of visible)
        data.push(await summarizeRunner(context, runner, takes));
      return context.json({ data, meta: { total: data.length } });
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
        !(await who.can('agents.runners', 'manage'))
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
        data: await summarizeRunner(context, runner, await takesOf([runner])),
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
      responses: { 200: dataResponse(RunnerSchema), ...manageErrors },
    }),
    runnerParam,
    async (context, next) => {
      context.set('runnerToManage', await manageableRunner(context));
      await next();
    },
    apiValidator('json', RunnerPatchInput),
    async (context) =>
      context.json({
        data: await services.runners.update(
          context.get('runnerToManage').id,
          context.req.valid('json'),
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
        'Revokes the runner and its keys; the runs and jobs it held go back to the queue.',
      responses: { 200: dataResponse(RunnerSchema), ...manageErrors },
    }),
    runnerParam,
    async (context) => {
      const runner = await manageableRunner(context);
      const revoked = await services.runners.revoke(runner.id);
      // What it held goes back to the queue now rather than at the next sweep.
      await services.sweeper.sweep();
      return context.json({ data: revoked });
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
      description: 'Deletes a revoked runner; its past runs keep its id.',
      responses: {
        204: emptyResponse(),
        ...manageErrors,
        400: apiErrorResponse(
          400,
          'The runner is not revoked (`RUNNER_NOT_REVOKED`).',
        ),
      },
    }),
    runnerParam,
    async (context) => {
      const runner = await manageableRunner(context);
      await services.runners.remove(runner.id);
      return context.body(null, 204);
    },
  );

  return router;
}

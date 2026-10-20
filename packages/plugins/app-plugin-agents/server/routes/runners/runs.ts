/**
 * A run's endpoints on the runner protocol (`RUNNER_ROUTES` `runs/:runId/*`): its lease, start, events, status,
 * ending reports, cancellation acknowledgement, the skills and mounts it gets and its repositories' credentials, mounted under
 * `/api/agents/runners/runs` behind the runner's key (`routes/runners/runner.ts`). Every answer is `{ data }`.
 */
import {
  CancelAckRequestSchema,
  CompleteRequestSchema,
  EventsRequestSchema,
  EventsResponseSchema,
  FailRequestSchema,
  FinishResponseSchema,
  GitCredentialRequestSchema,
  GitCredentialSchema,
  LeaseRequestSchema,
  LeaseResponseSchema,
  MountBundleSchema,
  SkillBundleSchema,
  StartRequestSchema,
  StartResponseSchema,
  StatusResponseSchema,
} from '@nocobase/agent-protocol';
import {
  apiErrorResponse,
  apiValidator,
  dataResponse,
  cliRoute,
  describeRoute,
} from '@nocobase/app-server/router';
import type { Hono } from 'hono';
import type { z } from 'zod';

import type { Agents } from '../../composition.js';
import { notFound } from '../../kernel/errors.js';
import type { RunnerEnv } from '../../runners/index.js';
import {
  heldWorkErrors,
  protocolHeader,
  runnerKeySecurity,
  tags,
} from '../openapi.js';
import { RunMountParams, RunParams, RunSkillParams } from '../schemas.js';

/** A run's report, authenticated by the runner's key (`router.use` in `runner.ts`). */
function report(
  operationId: string,
  summary: string,
  response: z.ZodType,
  description?: string,
) {
  return describeRoute({
    tags,
    summary,
    operationId,
    // Runner protocol: only a runner calls it.
    ...cliRoute(false),
    ...(description ? { description } : {}),
    security: runnerKeySecurity,
    parameters: [protocolHeader],
    responses: { 200: dataResponse(response), ...heldWorkErrors },
  });
}

export function mountRunnerRunRoutes(
  router: Hono<RunnerEnv>,
  services: Pick<
    Agents,
    'reports' | 'claims' | 'skills' | 'mounts' | 'tx' | 'gitCredentials'
  >,
): void {
  const runParam = apiValidator('param', RunParams);
  router.post(
    '/:runId/lease',
    report(
      'agentsRunnerRenewRunLease',
      "Renew a run's lease",
      LeaseResponseSchema,
    ),
    runParam,
    apiValidator('json', LeaseRequestSchema),
    async (context) =>
      context.json({
        data: await services.reports.lease(
          context.get('runner'),
          context.req.valid('param').runId,
        ),
      }),
  );
  router.post(
    '/:runId/start',
    report(
      'agentsRunnerStartRun',
      'Report that a run started',
      StartResponseSchema,
    ),
    runParam,
    apiValidator('json', StartRequestSchema),
    async (context) =>
      context.json({
        data: await services.reports.start(
          context.get('runner'),
          context.req.valid('param').runId,
          context.req.valid('json'),
        ),
      }),
  );
  router.post(
    '/:runId/events',
    report(
      'agentsRunnerReportRunEvents',
      "Report a run's events",
      EventsResponseSchema,
      "Appends a batch of the run's transcript events, in order.",
    ),
    runParam,
    apiValidator('json', EventsRequestSchema),
    async (context) =>
      context.json({
        data: await services.reports.events(
          context.get('runner'),
          context.req.valid('param').runId,
          context.req.valid('json'),
        ),
      }),
  );
  router.get(
    '/:runId/status',
    report(
      'agentsRunnerGetRunStatus',
      "Get a run's status",
      StatusResponseSchema,
      'Whether the run goes on, a cancellation was asked for, and the inputs added since it started.',
    ),
    runParam,
    async (context) =>
      context.json({
        data: await services.reports.status(
          context.get('runner'),
          context.req.valid('param').runId,
        ),
      }),
  );
  router.post(
    '/:runId/complete',
    report('agentsRunnerCompleteRun', 'Complete a run', FinishResponseSchema),
    runParam,
    apiValidator('json', CompleteRequestSchema),
    async (context) =>
      context.json({
        data: await services.reports.complete(
          context.get('runner'),
          context.req.valid('param').runId,
          context.req.valid('json'),
        ),
      }),
  );
  router.post(
    '/:runId/fail',
    report('agentsRunnerFailRun', 'Fail a run', FinishResponseSchema),
    runParam,
    apiValidator('json', FailRequestSchema),
    async (context) =>
      context.json({
        data: await services.reports.fail(
          context.get('runner'),
          context.req.valid('param').runId,
          context.req.valid('json'),
        ),
      }),
  );
  // One of the run's skills, while the runner holds the run; a skill the run does not get is not found.
  router.get(
    '/:runId/skills/:slug',
    report(
      'agentsRunnerGetRunSkill',
      "Download one of a run's skills",
      SkillBundleSchema,
      'The files of a skill the run gets, while the runner holds the run; any other skill is not found.',
    ),
    apiValidator('param', RunSkillParams),
    async (context) => {
      const runner = context.get('runner');
      const { runId, slug } = context.req.valid('param');
      await services.reports.holds(runner, runId);
      const skills = await services.claims.runSkills(runner, runId);
      if (!skills.some((skill) => skill.slug === slug)) throw notFound('Skill');
      return context.json({
        data: await services.skills.bundle(services.tx.read(), slug),
      });
    },
  );
  // One of the run's mounts, while the runner holds the run: what its provider offered at the claim.
  router.get(
    '/:runId/mounts/:name',
    report(
      'agentsRunnerGetRunMount',
      "Download one of a run's mounts",
      MountBundleSchema,
      'The files its provider offered the run at the claim, while the runner holds the run.',
    ),
    apiValidator('param', RunMountParams),
    async (context) => {
      const runner = context.get('runner');
      const { runId, name } = context.req.valid('param');
      await services.reports.holds(runner, runId);
      const provider = services.mounts.get(name);
      const bundle = provider
        ? await provider.bundle(services.tx.read(), { runId })
        : null;
      if (!bundle) throw notFound('Mount');
      return context.json({ data: bundle });
    },
  );
  // A credential for one of the run's on-demand repositories, while the runner holds this attempt of the run.
  router.post(
    '/:runId/gitCredentials',
    describeRoute({
      tags,
      summary: "Get a credential for one of a run's repositories",
      operationId: 'agentsRunnerGetRunGitCredential',
      description:
        'A short-lived credential the application issues for one of the repositories the claim listed in `RunGit.onDemand`, compared exactly, while the runner holds the named attempt of the run under a live lease (the `gitCredentials` feature). `refresh` asks for a new credential after the remote refused the last one. The credential is never stored.',
      // Runner protocol: only a runner calls it.
      ...cliRoute(false),
      security: runnerKeySecurity,
      parameters: [protocolHeader],
      responses: {
        200: dataResponse(GitCredentialSchema),
        ...heldWorkErrors,
        403: apiErrorResponse(
          403,
          'Another runner holds the run (`RUN_NOT_OWNED`), or the application will not issue a credential for the repository (`REPO_ACCESS_DENIED`).',
        ),
        409: apiErrorResponse(
          409,
          'The run is no longer this runner’s: the lease was lost or ran out, or another attempt took it (`LEASE_LOST`).',
        ),
        503: apiErrorResponse(
          503,
          'The application cannot issue a credential just now, such as when its code host is unavailable or slow (`REPO_ACCESS_UNAVAILABLE`); ask again later.',
        ),
      },
    }),
    runParam,
    apiValidator('json', GitCredentialRequestSchema),
    async (context) =>
      context.json({
        data: await services.gitCredentials.issue(
          context.get('runner'),
          context.req.valid('param').runId,
          context.req.valid('json'),
        ),
      }),
  );
  router.post(
    '/:runId/cancelAck',
    report(
      'agentsRunnerAcknowledgeRunCancel',
      "Acknowledge a run's cancellation",
      FinishResponseSchema,
    ),
    runParam,
    apiValidator('json', CancelAckRequestSchema),
    async (context) =>
      context.json({
        data: await services.reports.cancelAck(
          context.get('runner'),
          context.req.valid('param').runId,
          context.req.valid('json'),
        ),
      }),
  );
}

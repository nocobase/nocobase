/**
 * The runner endpoints (`RUNNER_ROUTES` of `@nocobase/agent-protocol`), mounted at `/api/agents/runners` beside the
 * people's runners API (`admin.ts`), so every route names its own authentication: every path but `register` the
 * runner's key header, never the browser session. A `GET` checks the key without marking the runner seen. Every
 * answer is `{ data }`.
 *
 * One long-poll claim hands out jobs and agent runs from the runner's shared slots: jobs first (they are short and
 * people wait on them), then runs. The heartbeat reconciles both, and a run's own `runs/:runId/*` endpoints
 * (`runs.ts`) are mounted here, behind the same key.
 *
 * A runner speaking a protocol this application does not serve (its `HEADERS.protocol`, or the one it registered with)
 * is kept connected rather than refused: `register` registers it, `heartbeat` reads what it can of the report and
 * answers with `compatibility` (and an `upgrade` notice when a newer runner is served), releasing whatever it holds,
 * and `claim` answers no work. Run and job reports from it are refused with `PROTOCOL_UNSUPPORTED`; the sweeper takes
 * its work back. Its fields this application does not know (features, tools) are dropped rather than refused.
 */
import {
  ClaimRequestSchema,
  ClaimResponseSchema,
  EventsResponseSchema,
  HEADERS,
  HeartbeatRequestSchema,
  HeartbeatResponseSchema,
  JobFinishResponseSchema,
  JobLeaseResponseSchema,
  JobStatusResponseSchema,
  JobCancelAckRequestSchema,
  JobCompleteRequestSchema,
  JobEventsRequestSchema,
  JobFailRequestSchema,
  JobStartRequestSchema,
  ActiveJobSchema,
  ActiveRunSchema,
  isProtocolSupported,
  LeaseRequestSchema,
  MIN_PROTOCOL_VERSION,
  PROTOCOL_VERSION,
  ProtocolError,
  RegisterRequestSchema,
  RegisterResponseSchema,
  RunnerFeatureSchema,
  RunnerPolicySchema,
  TIMINGS,
  ToolInfoSchema,
  type ClaimResponse,
  type HeartbeatRequest,
  type HeartbeatResponse,
  type RegisterRequest,
} from '@nocobase/agent-protocol';
import {
  apiErrorResponse,
  apiValidator,
  dataResponse,
  cliRoute,
  describeRoute,
  parseApiInput,
} from '@nocobase/app-server/router';
import type { Context, Hono, MiddlewareHandler } from 'hono';
import { z } from 'zod';

import type { Runner } from '../../../shared/runners.js';
import type { Agents } from '../../composition.js';
import { upgradeFor } from '../../distribution/index.js';
import { domainRouter } from '../../kernel/http.js';
import { upgradeRequiredOf, type RunnerEnv } from '../../runners/index.js';
import { ClaimQuery, JobParams } from '../schemas.js';
import {
  heldWorkErrors,
  jsonRequestBody,
  protocolHeader,
  runnerKeyErrors,
  runnerKeySecurity,
  tags,
} from '../openapi.js';
import { mountRunnerRunRoutes } from './runs.js';

export interface RunnerRoutesOptions {
  /** How long a `claim?wait=true` is held without work; `TIMINGS.pollTimeoutMs` by default. */
  readonly pollTimeoutMs?: number;
}

function runnerKey(context: Context): string {
  return context.req.header(HEADERS.runnerKey) ?? '';
}

/** The protocol the request says it speaks; undefined when it says none (a runner from before the header). */
function protocolOf(context: Context): number | undefined {
  const header = context.req.header(HEADERS.protocol);
  if (header === undefined || header.trim() === '') return undefined;
  const version = Number(header);
  return Number.isInteger(version) ? version : 0;
}

function unsupported(protocolVersion: number): ProtocolError {
  return new ProtocolError(
    'PROTOCOL_UNSUPPORTED',
    upgradeRequiredOf(protocolVersion).message,
    {
      protocolVersion: PROTOCOL_VERSION,
      minProtocolVersion: MIN_PROTOCOL_VERSION,
    },
  );
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** The entries of `value` that `schema` reads. */
function known<T>(value: unknown, schema: z.ZodType<T>): T[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const parsed = schema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

/**
 * A registration from a runner of a protocol this application does not serve: its features and tools are read as far
 * as this application knows them, so it can still register and be shown as needing an upgrade.
 */
const LenientRegisterSchema: z.ZodType<RegisterRequest> = z.preprocess(
  (raw) =>
    isRecord(raw) &&
    typeof raw.protocolVersion === 'number' &&
    !isProtocolSupported(raw.protocolVersion)
      ? {
          ...raw,
          features: known(raw.features, RunnerFeatureSchema),
          tools: known(raw.tools, ToolInfoSchema),
        }
      : raw,
  RegisterRequestSchema,
);

/** A heartbeat from a runner that needs an upgrade: whatever of it this application can read. */
const LenientHeartbeatSchema: z.ZodType<HeartbeatRequest> = z.preprocess(
  (raw) => {
    const body = isRecord(raw) ? raw : {};
    const load = isRecord(body.load) ? body.load : {};
    const count = (value: unknown) =>
      typeof value === 'number' && Number.isInteger(value) && value >= 0
        ? value
        : 0;
    return {
      version:
        typeof body.version === 'string' ? body.version.slice(0, 64) : '',
      features: known(body.features, RunnerFeatureSchema),
      tools: known(body.tools, ToolInfoSchema),
      active: known(body.active, ActiveRunSchema),
      ...(Array.isArray(body.jobs)
        ? { jobs: known(body.jobs, ActiveJobSchema) }
        : {}),
      load: { slots: count(load.slots), free: count(load.free) },
      ...(RunnerPolicySchema.safeParse(body.policy).success
        ? { policy: RunnerPolicySchema.parse(body.policy) }
        : {}),
    };
  },
  HeartbeatRequestSchema,
);

/** Waits `ms`, or until `signal` aborts. */
function pause(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const timer = setTimeout(done, ms);
    function done(): void {
      clearTimeout(timer);
      signal.removeEventListener('abort', done);
      resolve();
    }
    signal.addEventListener('abort', done, { once: true });
  });
}

export function createRunnerRoutes(
  services: Agents,
  options: RunnerRoutesOptions = {},
): Hono<RunnerEnv> {
  const pollTimeoutMs = options.pollTimeoutMs ?? TIMINGS.pollTimeoutMs;
  const router = domainRouter<RunnerEnv>();

  const authenticate = (context: Context<RunnerEnv>, touch: boolean) => {
    const protocolVersion = protocolOf(context);
    return services.runners.authenticate(runnerKey(context), {
      ...(protocolVersion === undefined ? {} : { protocolVersion }),
      touch,
    });
  };
  const authenticated: MiddlewareHandler<RunnerEnv> = async (context, next) => {
    context.set(
      'runner',
      await authenticate(context, context.req.method !== 'GET'),
    );
    await next();
  };
  // Reports on runs and jobs need a runner this application can work with.
  const served: MiddlewareHandler<RunnerEnv> = async (context, next) => {
    const runner = context.get('runner');
    if (runner.status === 'upgrade_required')
      throw unsupported(runner.protocolVersion);
    await next();
  };

  router.post(
    '/register',
    describeRoute({
      tags,
      summary: 'Register a runner',
      operationId: 'agentsRunnerRegister',
      // Runner protocol: only a runner calls it.
      ...cliRoute(false),
      description:
        'Registers the host as a runner with the one-time registration token in the body (no other credential), and answers the runner key every later runner request sends in `x-nocobase-runner-key`. A runner of a protocol this application does not serve still registers, and is shown as needing an upgrade.',
      security: [],
      parameters: [protocolHeader],
      responses: {
        200: dataResponse(RegisterResponseSchema),
        401: apiErrorResponse(
          401,
          'The registration token is unknown, used or expired (`REGISTRATION_TOKEN_INVALID`).',
        ),
        500: apiErrorResponse(500),
      },
    }),
    apiValidator('json', LenientRegisterSchema),
    async (context) =>
      context.json({
        data: await services.runners.register(context.req.valid('json')),
      }),
  );

  router.post(
    '/heartbeat',
    authenticated,
    describeRoute({
      tags,
      summary: 'Send a runner heartbeat',
      operationId: 'agentsRunnerHeartbeat',
      // Runner protocol: only a runner calls it.
      ...cliRoute(false),
      description:
        "Reports what the runner holds and its load, every `heartbeatIntervalMs`, and answers which runs and jobs to cancel or release, and whether an upgrade is available. A runner of a protocol this application does not serve is answered with `compatibility` and told to release everything it holds. The body is validated in the handler, against what the runner's protocol allows.",
      security: runnerKeySecurity,
      parameters: [protocolHeader],
      requestBody: jsonRequestBody(HeartbeatRequestSchema),
      responses: {
        200: dataResponse(HeartbeatResponseSchema),
        400: apiErrorResponse(
          400,
          'The body is not a heartbeat (`INVALID_ARGUMENT`).',
        ),
        ...runnerKeyErrors,
      },
    }),
    async (context) => {
      const current = context.get('runner');
      if (current.status === 'upgrade_required') {
        const request = parseApiInput(
          LenientHeartbeatSchema,
          await jsonOf(context),
        );
        const runner = await services.runners.heartbeat(current, request);
        const upgrade = await upgradeFor(services.dist, runner);
        // It holds nothing this application can let it finish: the sweeper gives its runs and jobs back to the queue.
        const response: HeartbeatResponse = {
          ok: true,
          serverTime: services.clock.now().toISOString(),
          ...(upgrade ? { upgrade } : {}),
          compatibility: upgradeRequiredOf(runner.protocolVersion),
          cancelRequested: [],
          release: request.active.map((run) => run.runId),
          ...(request.jobs
            ? {
                jobs: {
                  cancelRequested: [],
                  release: request.jobs.map((job) => job.jobId),
                },
              }
            : {}),
        };
        return context.json({ data: response });
      }
      const request = parseApiInput(
        HeartbeatRequestSchema,
        await jsonOf(context),
      );
      const runner = await services.runners.heartbeat(current, request);
      const { cancelRequested, release } = await services.reports.reconcile(
        runner,
        request.active,
      );
      const jobs = request.jobs
        ? await services.jobs.runner.reconcile(runner, request.jobs)
        : undefined;
      const upgrade = await upgradeFor(services.dist, runner);
      const response: HeartbeatResponse = {
        ok: true,
        serverTime: services.clock.now().toISOString(),
        ...(upgrade ? { upgrade } : {}),
        cancelRequested,
        release,
        ...(jobs ? { jobs } : {}),
      };
      return context.json({ data: response });
    },
  );

  // Runs and jobs share the runner's slots: jobs first (they are short and people wait on them), then runs.
  const claimWork = async (runner: Runner, free: number) => {
    const jobs = await services.jobs.runner.claim(runner, free);
    const runs =
      free - jobs.length > 0
        ? await services.claims.claim(runner, free - jobs.length)
        : [];
    return { runs, jobs };
  };
  router.post(
    '/claim',
    authenticated,
    describeRoute({
      tags,
      summary: 'Claim work for a runner',
      operationId: 'agentsRunnerClaimWork',
      // Runner protocol: only a runner calls it.
      ...cliRoute(false),
      description: [
        'Hands the runner up to `free` pieces of work for its free slots: jobs first, then agent runs. With `wait=true` and nothing to hand out, the request is held as a long poll for up to `pollTimeoutMs` (25 seconds by default) until work arrives, and then answers what it found, possibly nothing; the runner asks again at once. Without `wait`, it answers immediately.',
        '',
        'A runner of a protocol this application does not serve is given no work (its poll is still held). `jobs` is present only when jobs are handed out.',
      ].join('\n'),
      security: runnerKeySecurity,
      parameters: [protocolHeader],
      requestBody: jsonRequestBody(ClaimRequestSchema),
      responses: {
        200: dataResponse(ClaimResponseSchema),
        400: apiErrorResponse(
          400,
          'The body is not a claim (`INVALID_ARGUMENT`).',
        ),
        ...runnerKeyErrors,
      },
    }),
    apiValidator('query', ClaimQuery),
    async (context) => {
      const runner = context.get('runner');
      const wait = context.req.valid('query').wait === true;
      if (runner.status === 'upgrade_required') {
        // No work until it is upgraded; hold the poll as for an empty queue, so it does not ask again at once.
        if (wait) await pause(pollTimeoutMs, context.req.raw.signal);
        return context.json({ data: { runs: [] } satisfies ClaimResponse });
      }
      const { free } = parseApiInput(ClaimRequestSchema, await jsonOf(context));
      let work = await claimWork(runner, free);
      if (
        work.runs.length === 0 &&
        work.jobs.length === 0 &&
        free > 0 &&
        wait
      ) {
        const outcome = await services.signal.wait(
          pollTimeoutMs,
          context.req.raw.signal,
        );
        if (outcome !== 'aborted')
          // The runner may have been revoked while it waited.
          work = await claimWork(await authenticate(context, true), free);
      }
      // A runner of protocol 3 is never handed a job (it announces no job feature), so `jobs` stays out of its answer.
      const response: ClaimResponse =
        work.jobs.length > 0 ? work : { runs: work.runs };
      return context.json({ data: response });
    },
  );

  // A run's own endpoints: its lease, reports, skills and mounts.
  router.use('/runs/*', authenticated, served);
  const runs = domainRouter<RunnerEnv>();
  mountRunnerRunRoutes(runs, services);
  router.route('/runs', runs);

  // Jobs (protocol 4): the same reports as a run's, on the job.
  router.use('/jobs/*', authenticated, served);
  const job = (
    operationId: string,
    summary: string,
    response: z.ZodType,
    description?: string,
  ) =>
    describeRoute({
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
  router.post(
    '/jobs/:jobId/lease',
    job(
      'agentsRunnerRenewJobLease',
      "Renew a job's lease",
      JobLeaseResponseSchema,
    ),
    apiValidator('param', JobParams),
    apiValidator('json', LeaseRequestSchema),
    async (context) =>
      context.json({
        data: await services.jobs.runner.lease(
          context.get('runner'),
          context.req.valid('param').jobId,
        ),
      }),
  );
  router.post(
    '/jobs/:jobId/start',
    job(
      'agentsRunnerStartJob',
      'Report that a job started',
      JobLeaseResponseSchema,
    ),
    apiValidator('param', JobParams),
    apiValidator('json', JobStartRequestSchema),
    async (context) =>
      context.json({
        data: await services.jobs.runner.start(
          context.get('runner'),
          context.req.valid('param').jobId,
          context.req.valid('json'),
        ),
      }),
  );
  router.post(
    '/jobs/:jobId/events',
    job(
      'agentsRunnerReportJobEvents',
      "Report a job's events",
      EventsResponseSchema,
    ),
    apiValidator('param', JobParams),
    apiValidator('json', JobEventsRequestSchema),
    async (context) =>
      context.json({
        data: await services.jobs.runner.events(
          context.get('runner'),
          context.req.valid('param').jobId,
          context.req.valid('json'),
        ),
      }),
  );
  router.get(
    '/jobs/:jobId/status',
    job(
      'agentsRunnerGetJobStatus',
      "Get a job's status",
      JobStatusResponseSchema,
      'Whether the job should go on or stop (a cancellation was asked for). Reading it does not count as the runner being seen.',
    ),
    apiValidator('param', JobParams),
    async (context) =>
      context.json({
        data: await services.jobs.runner.status(
          context.get('runner'),
          context.req.valid('param').jobId,
        ),
      }),
  );
  router.post(
    '/jobs/:jobId/complete',
    job('agentsRunnerCompleteJob', 'Complete a job', JobFinishResponseSchema),
    apiValidator('param', JobParams),
    apiValidator('json', JobCompleteRequestSchema),
    async (context) =>
      context.json({
        data: await services.jobs.runner.complete(
          context.get('runner'),
          context.req.valid('param').jobId,
          context.req.valid('json'),
        ),
      }),
  );
  router.post(
    '/jobs/:jobId/fail',
    job('agentsRunnerFailJob', 'Fail a job', JobFinishResponseSchema),
    apiValidator('param', JobParams),
    apiValidator('json', JobFailRequestSchema),
    async (context) =>
      context.json({
        data: await services.jobs.runner.fail(
          context.get('runner'),
          context.req.valid('param').jobId,
          context.req.valid('json'),
        ),
      }),
  );
  router.post(
    '/jobs/:jobId/cancelAck',
    job(
      'agentsRunnerAcknowledgeJobCancel',
      "Acknowledge a job's cancellation",
      JobFinishResponseSchema,
    ),
    apiValidator('param', JobParams),
    apiValidator('json', JobCancelAckRequestSchema),
    async (context) =>
      context.json({
        data: await services.jobs.runner.cancelAck(
          context.get('runner'),
          context.req.valid('param').jobId,
        ),
      }),
  );

  return router;
}

/** The JSON body of a request whose schema depends on the runner's state; `{}` when empty. */
async function jsonOf(context: Context): Promise<unknown> {
  const text = await context.req.text();
  if (text === '') return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ProtocolError('INVALID_REQUEST', 'The body must be JSON.');
  }
}

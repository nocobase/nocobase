// An in-memory application server that speaks the runner protocol, for driving the runner in tests. It keeps every
// request body, lets a test queue runs, cancel them, add inputs, take a lease away, and make the events route fail.
import { serve, type ServerType } from '@hono/node-server';
import { Hono, type Context } from 'hono';
import { createHash } from 'node:crypto';
import type { AddressInfo } from 'node:net';

import {
  ERROR_API_STATUS,
  HEADERS,
  CLI_ROUTES,
  DIST_ROUTES,
  RUNNER_ROUTES,
  type CancelAckRequest,
  type CompleteRequest,
  type FailRequest,
  type HeartbeatRequest,
  type JobEvent,
  type JobFailRequest,
  type JobPayload,
  type JobResult,
  type JobStatus,
  type ClaimRequest,
  type RegisterRequest,
  type RunEvent,
  type RunInput,
  type RunPayload,
  type RunStatus,
  type MountBundle,
  type SkillBundle,
  type StartRequest,
  type UpgradeNotice,
} from '../src/protocol/index.ts';

export interface FakeRunner {
  id: string;
  key: string;
  register: RegisterRequest;
  heartbeats: HeartbeatRequest[];
  revoked: boolean;
  /** How many claims and heartbeats it sent, answered or not. */
  claims: number;
  /** What its claims asked for. */
  claimBodies: ClaimRequest[];
  heartbeatsSent: number;
  /** The protocol header of its last request. */
  protocolHeader?: string;
}

export interface FakeRun {
  payload: RunPayload;
  status: RunStatus;
  runnerId?: string;
  cancelRequested: boolean;
  leaseLost: boolean;
  inputs: RunInput[];
  handled: Set<string>;
  events: Map<number, RunEvent>;
  eventRequests: number;
  leases: number;
  start?: StartRequest;
  complete?: CompleteRequest;
  fail?: FailRequest;
  cancelAck?: CancelAckRequest;
  /** Every report in arrival order, for asserting what was and was not sent. */
  reports: {
    kind: 'start' | 'complete' | 'fail' | 'cancelAck';
    body: unknown;
    status: number;
  }[];
}

export interface FakeJob {
  payload: JobPayload;
  status: JobStatus;
  runnerId?: string;
  cancelRequested: boolean;
  leaseLost: boolean;
  events: Map<number, JobEvent>;
  leases: number;
  start?: { workDir?: string };
  result?: JobResult;
  fail?: JobFailRequest;
  cancelAcked: boolean;
}

/** What the upload route (`/uploads/:name`) received. */
export interface FakeUpload {
  name: string;
  method: string;
  headers: Record<string, string>;
  size: number;
  sha256: string;
}

export interface FakeServerOptions {
  pollTimeoutMs?: number;
  heartbeatIntervalMs?: number;
  /** The application the server says it is on registration; none when absent. */
  app?: { id: string; name: string };
}

type RunInit = Partial<Omit<RunPayload, 'run'>> & {
  run?: Partial<RunPayload['run']>;
};

function error(
  c: Context,
  status: number,
  reason: string,
  message = reason,
): Response {
  const apiStatus =
    (ERROR_API_STATUS as Readonly<Record<string, string>>)[reason] ??
    'UNAVAILABLE';
  return c.json(
    {
      error: {
        code: status,
        status: apiStatus,
        reason,
        domain: 'agents',
        message,
      },
    },
    status as 401,
  );
}

/** A success answer: `{ data }`. */
function ok(c: Context, data: unknown, status = 200): Response {
  return c.json({ data }, status as 200);
}

export class FakeServer {
  readonly app = new Hono();
  readonly runners = new Map<string, FakeRunner>();
  readonly runs = new Map<string, FakeRun>();
  readonly registrationTokens = new Set<string>(['reg-token']);
  readonly apiKeys = new Map<string, { userId: string; displayName: string }>([
    ['user-key', { userId: 'u1', displayName: 'Ada' }],
  ]);
  /** While set, `events` answers 503. */
  eventsDown = false;
  eventsFailures = 0;
  /** Skill bundles by slug, served at `RUNNER_ROUTES.skill`. */
  readonly skillBundles = new Map<string, SkillBundle>();
  /** How many times each skill was fetched. */
  readonly skillFetches = new Map<string, number>();
  /** Mount bundles by name, served at `RUNNER_ROUTES.mount`. */
  readonly mountBundles = new Map<string, MountBundle>();
  /** How many times each mount was fetched. */
  readonly mountFetches = new Map<string, number>();
  /** Sent with every heartbeat answer while set. */
  upgrade: UpgradeNotice | undefined;
  /**
   * While set, the server cannot work with the runner's protocol: `verdict` answers heartbeats with `compatibility`
   * and claims with no work, as a current server does; `refuse` answers both `PROTOCOL_UNSUPPORTED`, as an older one.
   */
  unsupported: 'verdict' | 'refuse' | undefined;
  /** Bytes served under `/api/agents/dist/products/` to a registered runner, by path after that prefix. */
  readonly distFiles = new Map<string, Uint8Array>();
  readonly jobs = new Map<string, FakeJob>();
  readonly uploads: FakeUpload[] = [];
  /** While set, the upload route answers this status. */
  uploadStatus: number | undefined;
  /** The slots the registration token carries; registration answers the runner's own, else these, else 1. */
  tokenSlots: number | undefined;
  private readonly jobQueue: string[] = [];
  private readonly queue: string[] = [];
  private readonly waiters = new Set<() => void>();
  private server: ServerType | undefined;
  private counter = 0;
  url = '';
  private readonly options: Required<Omit<FakeServerOptions, 'app'>> &
    Pick<FakeServerOptions, 'app'>;

  constructor(options: FakeServerOptions = {}) {
    this.options = {
      pollTimeoutMs: 1_000,
      heartbeatIntervalMs: 500,
      app: { id: 'test-app', name: 'Test App' },
      ...options,
    };
    this.routes();
  }

  async listen(): Promise<string> {
    await new Promise<void>((resolve) => {
      this.server = serve(
        { fetch: this.app.fetch, port: 0, hostname: '127.0.0.1' },
        () => resolve(),
      );
    });
    const address = this.server?.address() as AddressInfo;
    this.url = `http://127.0.0.1:${address.port}`;
    return this.url;
  }

  async close(): Promise<void> {
    for (const wake of this.waiters) wake();
    await new Promise<void>((resolve) => {
      if (this.server === undefined) return resolve();
      this.server.close(() => resolve());
      (
        this.server as unknown as { closeAllConnections?: () => void }
      ).closeAllConnections?.();
    });
  }

  // -------------------------------------------------------------------------------------------------------------
  // Test controls

  enqueue(init: RunInit = {}): FakeRun {
    this.counter += 1;
    const id = init.run?.id ?? `run-${this.counter}`;
    const { run: header, ...rest } = init;
    const key = init.subject?.key ?? `PM-${this.counter}`;
    const payload: RunPayload = {
      run: {
        id,
        attempt: 1,
        maxAttempts: 3,
        priority: 0,
        createdAt: new Date().toISOString(),
        leaseExpiresAt: new Date(Date.now() + 45_000).toISOString(),
        requires: [],
        firstSeq: 1,
        ...header,
      },
      app: { id: 'test-app', name: 'Test App' },
      subject: {
        key,
        title: 'A test issue',
        url: `http://app.test/issues/${key}`,
      },
      tool: {
        kind: 'claude',
        policy: {
          permissionMode: 'acceptEdits',
          allowedCommands: [
            '^echo\\b',
            '^git\\b',
            '^env$',
            '^sleep\\b',
            '^printf\\b',
            '^cat\\b',
          ],
          deniedPatterns: [],
          idleTimeoutMs: 60_000,
        },
      },
      prompt: {
        system: 'System rules.\n\n{{runner.workspaceNotes}}',
        turn: 'say hello',
        session: 'fresh',
      },
      inputs: [],
      workspace: { dirs: [], env: [] },
      skills: [],
      cli: {
        name: 'appcli',
        package: { kind: 'preinstalled' },
        credential: {
          file: '.app/run.json',
          content: {
            token: `run-token-${id}`,
            runId: id,
            manifestUrl: CLI_ROUTES.manifest,
            expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
          },
        },
      },
      ...rest,
    } as RunPayload;
    const run: FakeRun = {
      payload,
      status: 'queued',
      cancelRequested: false,
      leaseLost: false,
      inputs: [...payload.inputs],
      handled: new Set(),
      events: new Map(),
      eventRequests: 0,
      leases: 0,
      reports: [],
    };
    this.runs.set(id, run);
    this.queue.push(id);
    for (const wake of this.waiters) wake();
    return run;
  }

  enqueueJob(
    job: Pick<JobPayload['job'], 'kind' | 'spec'> &
      Partial<Omit<JobPayload['job'], 'kind' | 'spec'>>,
  ): FakeJob {
    this.counter += 1;
    const id = job.id ?? `job-${this.counter}`;
    const payload = {
      job: {
        attempt: 1,
        maxAttempts: 2,
        createdAt: new Date().toISOString(),
        leaseExpiresAt: new Date(Date.now() + 45_000).toISOString(),
        firstSeq: 1,
        requires: [`jobs.${job.kind}`],
        ...job,
        id,
      },
      app: { id: 'test-app', name: 'Test App' },
      title: `Job ${id}`,
    } as JobPayload;
    const fake: FakeJob = {
      payload,
      status: 'queued',
      cancelRequested: false,
      leaseLost: false,
      events: new Map(),
      leases: 0,
      cancelAcked: false,
    };
    this.jobs.set(id, fake);
    this.jobQueue.push(id);
    for (const wake of this.waiters) wake();
    return fake;
  }

  job(id: string): FakeJob {
    const job = this.jobs.get(id);
    if (job === undefined) throw new Error(`No job ${id}`);
    return job;
  }

  /** The job's log lines in seq order. */
  jobLog(id: string): JobEvent[] {
    return [...this.job(id).events.values()].sort((a, b) => a.seq - b.seq);
  }

  run(id: string): FakeRun {
    const run = this.runs.get(id);
    if (run === undefined) throw new Error(`No run ${id}`);
    return run;
  }

  cancel(id: string): void {
    this.run(id).cancelRequested = true;
  }

  addInput(id: string, text: string): RunInput {
    const run = this.run(id);
    const input: RunInput = {
      id: `input-${run.inputs.length + 1}`,
      type: 'comment',
      at: new Date().toISOString(),
      actor: { kind: 'user', id: 'u1', name: 'Ada' },
      text,
    };
    run.inputs.push(input);
    return input;
  }

  loseLease(id: string): void {
    const run = this.run(id);
    run.leaseLost = true;
  }

  /** Events in seq order. */
  events(id: string): RunEvent[] {
    return [...this.run(id).events.values()].sort((a, b) => a.seq - b.seq);
  }

  lastHeartbeat(): HeartbeatRequest | undefined {
    const runner = [...this.runners.values()][0];
    return runner?.heartbeats[runner.heartbeats.length - 1];
  }

  /** The pid the runner last reported for a run. */
  workerPid(id: string): number | undefined {
    for (const runner of this.runners.values()) {
      for (let index = runner.heartbeats.length - 1; index >= 0; index -= 1) {
        const active = runner.heartbeats[index]?.active.find(
          (entry) => entry.runId === id,
        );
        if (active?.pid !== undefined) return active.pid;
      }
    }
    return undefined;
  }

  // -------------------------------------------------------------------------------------------------------------
  // Routes

  private runnerFor(c: Context): FakeRunner | undefined {
    const key = c.req.header(HEADERS.runnerKey);
    return [...this.runners.values()].find(
      (runner) => runner.key === key && !runner.revoked,
    );
  }

  private claimOne(runner: FakeRunner): RunPayload | undefined {
    const features = new Set(
      runner.heartbeats.at(-1)?.features ?? runner.register.features,
    );
    const index = this.queue.findIndex((id) =>
      this.run(id).payload.run.requires.every((f) => features.has(f)),
    );
    if (index < 0) return undefined;
    const [id] = this.queue.splice(index, 1);
    const run = this.run(id as string);
    run.status = 'dispatched';
    run.runnerId = runner.id;
    return {
      ...run.payload,
      inputs: run.inputs.filter((input) => !run.handled.has(input.id)),
    };
  }

  private routes(): void {
    const { app } = this;

    app.post(RUNNER_ROUTES.register, async (c) => {
      const body = (await c.req.json()) as RegisterRequest;
      if (!this.registrationTokens.delete(body.registrationToken))
        return error(c, 401, 'REGISTRATION_TOKEN_INVALID');
      const id = `runner-${this.runners.size + 1}`;
      const runner: FakeRunner = {
        id,
        key: `runner-key-${id}`,
        register: body,
        heartbeats: [],
        revoked: false,
        claims: 0,
        claimBodies: [],
        heartbeatsSent: 0,
      };
      this.runners.set(id, runner);
      return ok(c, {
        ...(this.options.app === undefined ? {} : { app: this.options.app }),
        runnerId: id,
        runnerKey: runner.key,
        heartbeatIntervalMs: this.options.heartbeatIntervalMs,
        pollTimeoutMs: this.options.pollTimeoutMs,
        leaseRenewMs: 15_000,
        serverTime: new Date().toISOString(),
        slots: body.slots ?? this.tokenSlots ?? 1,
      });
    });

    app.use('/api/agents/runners/*', async (c, next) => {
      if (c.req.path === RUNNER_ROUTES.register) return next();
      const runner = this.runnerFor(c);
      if (runner === undefined) return error(c, 401, 'RUNNER_KEY_INVALID');
      runner.protocolHeader = c.req.header('x-nocobase-protocol');
      if (c.req.path === RUNNER_ROUTES.heartbeat) runner.heartbeatsSent += 1;
      if (c.req.path === RUNNER_ROUTES.claim && this.unsupported === 'refuse')
        runner.claims += 1;
      if (this.unsupported === 'refuse')
        return error(c, 400, 'PROTOCOL_UNSUPPORTED', 'upgrade the runner');
      c.set('runner' as never, runner as never);
      return next();
    });

    app.post(RUNNER_ROUTES.heartbeat, async (c) => {
      const runner = c.get('runner' as never) as FakeRunner;
      runner.heartbeats.push((await c.req.json()) as HeartbeatRequest);
      const heartbeat = runner.heartbeats.at(-1)!;
      const jobs = heartbeat.jobs
        ? {
            cancelRequested: heartbeat.jobs
              .map((entry) => entry.jobId)
              .filter((id) => this.jobs.get(id)?.cancelRequested === true),
            release: heartbeat.jobs
              .map((entry) => entry.jobId)
              .filter((id) => {
                const job = this.jobs.get(id);
                return (
                  job === undefined ||
                  job.runnerId !== runner.id ||
                  job.leaseLost ||
                  (job.status !== 'dispatched' && job.status !== 'running')
                );
              }),
          }
        : undefined;
      const cancelRequested = [...this.runs.entries()]
        .filter(
          ([, run]) =>
            run.runnerId === runner.id &&
            run.cancelRequested &&
            (run.status === 'dispatched' || run.status === 'running'),
        )
        .map(([id]) => id);
      return ok(c, {
        ok: true,
        serverTime: new Date().toISOString(),
        ...(this.upgrade === undefined ? {} : { upgrade: this.upgrade }),
        ...(this.unsupported === 'verdict'
          ? {
              compatibility: {
                status: 'upgradeRequired',
                runnerProtocolVersion: 3,
                minProtocolVersion: 5,
                protocolVersion: 5,
                message: 'This application needs agent protocol 5.',
              },
            }
          : {}),
        cancelRequested,
        release: [],
        ...(jobs ? { jobs } : {}),
      });
    });

    app.get(DIST_ROUTES.file, (c) => {
      if (this.runnerFor(c) === undefined)
        return error(c, 401, 'RUNNER_KEY_INVALID');
      const bytes = this.distFiles.get(
        `${c.req.param('product')}/${c.req.param('version')}/${c.req.param('file')}`,
      );
      if (bytes === undefined) return error(c, 404, 'DIST_FILE_NOT_FOUND');
      return c.body(new Uint8Array(bytes), 200, {
        'content-type': 'application/gzip',
      });
    });

    app.post(RUNNER_ROUTES.claim, async (c) => {
      const runner = c.get('runner' as never) as FakeRunner;
      runner.claims += 1;
      const body = (await c.req.json()) as ClaimRequest;
      runner.claimBodies.push(body);
      if (this.unsupported === 'verdict') return ok(c, { runs: [] });
      const runs: RunPayload[] = [];
      const jobs: JobPayload[] = [];
      const take = (): void => {
        const features = new Set(
          runner.heartbeats.at(-1)?.features ?? runner.register.features,
        );
        while (runs.length + jobs.length < body.free) {
          const index = this.jobQueue.findIndex((id) =>
            this.job(id).payload.job.requires.every((f) => features.has(f)),
          );
          if (index < 0) break;
          const [id] = this.jobQueue.splice(index, 1);
          const job = this.job(id as string);
          job.status = 'dispatched';
          job.runnerId = runner.id;
          jobs.push(job.payload);
        }
        while (runs.length + jobs.length < body.free) {
          const payload = this.claimOne(runner);
          if (payload === undefined) break;
          runs.push(payload);
        }
      };
      take();
      if (runs.length + jobs.length === 0 && c.req.query('wait') === 'true') {
        await new Promise<void>((resolve) => {
          const timer = setTimeout(done, this.options.pollTimeoutMs);
          const waiters = this.waiters;
          function done(): void {
            clearTimeout(timer);
            waiters.delete(done);
            resolve();
          }
          waiters.add(done);
        });
        take();
      }
      return ok(c, jobs.length > 0 ? { runs, jobs } : { runs });
    });

    const ownedJob = (c: Context): FakeJob | Response => {
      const runner = c.get('runner' as never) as FakeRunner;
      const job = this.jobs.get(c.req.param('jobId') ?? '');
      if (job === undefined) return error(c, 400, 'RUN_NOT_ACTIVE');
      if (job.runnerId !== runner.id) return error(c, 403, 'RUN_NOT_OWNED');
      if (job.leaseLost) return error(c, 409, 'LEASE_LOST');
      return job;
    };
    const jobActive = (job: FakeJob): boolean =>
      job.status === 'dispatched' || job.status === 'running';
    const leaseAnswer = (job: FakeJob) => ({
      status: job.status,
      leaseExpiresAt: new Date(Date.now() + 45_000).toISOString(),
      cancelRequested: job.cancelRequested,
    });

    app.post('/api/agents/runners/jobs/:jobId/lease', (c) => {
      const job = ownedJob(c);
      if (job instanceof Response) return job;
      if (!jobActive(job)) return error(c, 400, 'RUN_NOT_ACTIVE');
      job.leases += 1;
      return ok(c, leaseAnswer(job));
    });
    app.post('/api/agents/runners/jobs/:jobId/start', async (c) => {
      const job = ownedJob(c);
      if (job instanceof Response) return job;
      job.start = (await c.req.json()) as { workDir?: string };
      if (job.status === 'dispatched' && !job.cancelRequested)
        job.status = 'running';
      return ok(c, leaseAnswer(job));
    });
    app.post('/api/agents/runners/jobs/:jobId/events', async (c) => {
      const job = ownedJob(c);
      if (job instanceof Response) return job;
      if (!jobActive(job)) return error(c, 400, 'RUN_NOT_ACTIVE');
      const body = (await c.req.json()) as { events: JobEvent[] };
      let accepted = 0;
      for (const event of body.events)
        if (!job.events.has(event.seq)) {
          job.events.set(event.seq, event);
          accepted += 1;
        }
      return ok(c, {
        accepted,
        duplicates: body.events.length - accepted,
        cancelRequested: job.cancelRequested,
      });
    });
    app.get('/api/agents/runners/jobs/:jobId/status', (c) => {
      const job = ownedJob(c);
      if (job instanceof Response) return job;
      return ok(c, {
        status: job.status,
        cancelRequested: job.cancelRequested,
        leaseExpiresAt: null,
      });
    });
    app.post('/api/agents/runners/jobs/:jobId/complete', async (c) => {
      const job = ownedJob(c);
      if (job instanceof Response) return job;
      if (!jobActive(job)) return error(c, 400, 'RUN_NOT_ACTIVE');
      job.result = ((await c.req.json()) as { result: JobResult }).result;
      job.status = 'completed';
      return ok(c, { status: job.status });
    });
    app.post('/api/agents/runners/jobs/:jobId/fail', async (c) => {
      const job = ownedJob(c);
      if (job instanceof Response) return job;
      if (!jobActive(job)) return error(c, 400, 'RUN_NOT_ACTIVE');
      job.fail = (await c.req.json()) as JobFailRequest;
      job.status = 'failed';
      return ok(c, { status: job.status });
    });
    app.post('/api/agents/runners/jobs/:jobId/cancelAck', (c) => {
      const job = ownedJob(c);
      if (job instanceof Response) return job;
      job.cancelAcked = true;
      job.status = 'cancelled';
      return ok(c, { status: job.status });
    });

    // Where builds upload their outputs: records what arrived, answers like a release store.
    app.on(['POST', 'PUT'], '/uploads/:name', async (c) => {
      const bytes = new Uint8Array(await c.req.arrayBuffer());
      const upload: FakeUpload = {
        name: c.req.param('name'),
        method: c.req.method,
        headers: Object.fromEntries(c.req.raw.headers.entries()),
        size: bytes.length,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      };
      this.uploads.push(upload);
      if (this.uploadStatus !== undefined)
        return error(
          c,
          this.uploadStatus,
          'TICKET_USED',
          'The ticket was used.',
        );
      return ok(
        c,
        { id: `release-${this.uploads.length}`, size: upload.size },
        201,
      );
    });

    const owned = (c: Context): FakeRun | Response => {
      const runner = c.get('runner' as never) as FakeRunner;
      const run = this.runs.get(c.req.param('runId') ?? '');
      if (run === undefined) return error(c, 400, 'RUN_NOT_ACTIVE');
      if (run.runnerId !== runner.id) return error(c, 403, 'RUN_NOT_OWNED');
      if (run.leaseLost) return error(c, 409, 'LEASE_LOST');
      return run;
    };
    const active = (run: FakeRun): boolean =>
      run.status === 'dispatched' || run.status === 'running';
    const unhandled = (run: FakeRun): RunInput[] =>
      run.inputs.filter((input) => !run.handled.has(input.id));

    app.post('/api/agents/runners/runs/:runId/lease', (c) => {
      const run = owned(c);
      if (run instanceof Response) return run;
      if (!active(run)) return error(c, 400, 'RUN_NOT_ACTIVE');
      run.leases += 1;
      return ok(c, {
        leaseExpiresAt: new Date(Date.now() + 45_000).toISOString(),
        cancelRequested: run.cancelRequested,
        inputs: unhandled(run),
      });
    });

    app.post('/api/agents/runners/runs/:runId/start', async (c) => {
      const run = owned(c);
      if (run instanceof Response) return run;
      const body = (await c.req.json()) as StartRequest;
      if (run.cancelRequested) {
        run.reports.push({ kind: 'start', body, status: 409 });
        return error(c, 400, 'RUN_CANCEL_REQUESTED');
      }
      run.start = body;
      run.status = 'running';
      run.reports.push({ kind: 'start', body, status: 200 });
      return ok(c, {
        status: run.status,
        leaseExpiresAt: new Date(Date.now() + 45_000).toISOString(),
        cancelRequested: run.cancelRequested,
        inputs: unhandled(run),
      });
    });

    app.post('/api/agents/runners/runs/:runId/events', async (c) => {
      const run = owned(c);
      if (run instanceof Response) return run;
      run.eventRequests += 1;
      if (this.eventsDown) {
        this.eventsFailures += 1;
        return error(c, 503, 'UNAVAILABLE', 'down');
      }
      if (!active(run)) return error(c, 400, 'RUN_NOT_ACTIVE');
      const body = (await c.req.json()) as { events: RunEvent[] };
      if (body.events.length > 200) return error(c, 400, 'TOO_MANY_EVENTS');
      let accepted = 0;
      for (const event of body.events)
        if (!run.events.has(event.seq)) {
          run.events.set(event.seq, event);
          accepted += 1;
        }
      return ok(c, {
        accepted,
        duplicates: body.events.length - accepted,
        cancelRequested: run.cancelRequested,
      });
    });

    app.get('/api/agents/runners/runs/:runId/status', (c) => {
      const run = owned(c);
      if (run instanceof Response) return run;
      return ok(c, {
        status: run.status,
        cancelRequested: run.cancelRequested,
        inputs: unhandled(run),
        leaseExpiresAt: null,
      });
    });

    app.post('/api/agents/runners/runs/:runId/complete', async (c) => {
      const body = (await c.req.json()) as CompleteRequest;
      const run = owned(c);
      if (run instanceof Response) return run;
      if (!active(run)) return error(c, 400, 'RUN_NOT_ACTIVE');
      if (run.cancelRequested) return error(c, 400, 'RUN_CANCEL_REQUESTED');
      const covered = new Set(body.handledInputIds);
      if (unhandled(run).some((input) => !covered.has(input.id))) {
        run.reports.push({ kind: 'complete', body, status: 409 });
        return error(c, 400, 'RUN_INPUT_PENDING');
      }
      for (const id of covered) run.handled.add(id);
      run.complete = body;
      run.status = 'completed';
      run.reports.push({ kind: 'complete', body, status: 200 });
      return ok(c, { status: run.status });
    });

    app.post('/api/agents/runners/runs/:runId/fail', async (c) => {
      const body = (await c.req.json()) as FailRequest;
      const run = owned(c);
      if (run instanceof Response) return run;
      if (!active(run)) return error(c, 400, 'RUN_NOT_ACTIVE');
      run.fail = body;
      run.status = 'failed';
      run.reports.push({ kind: 'fail', body, status: 200 });
      return ok(c, { status: run.status });
    });

    app.post('/api/agents/runners/runs/:runId/cancelAck', async (c) => {
      const body = (await c.req.json()) as CancelAckRequest;
      const run = owned(c);
      if (run instanceof Response) return run;
      run.cancelAck = body;
      run.status = 'cancelled';
      run.reports.push({ kind: 'cancelAck', body, status: 200 });
      return ok(c, { status: run.status });
    });

    app.get('/api/agents/runners/runs/:runId/skills/:slug', (c) => {
      const run = owned(c);
      if (run instanceof Response) return run;
      const slug = c.req.param('slug');
      const bundle = this.skillBundles.get(slug);
      if (bundle === undefined) return error(c, 404, 'NOT_FOUND');
      this.skillFetches.set(slug, (this.skillFetches.get(slug) ?? 0) + 1);
      return ok(c, bundle);
    });

    app.get('/api/agents/runners/runs/:runId/mounts/:name', (c) => {
      const run = owned(c);
      if (run instanceof Response) return run;
      const name = c.req.param('name');
      const bundle = this.mountBundles.get(name);
      if (bundle === undefined) return error(c, 404, 'NOT_FOUND');
      this.mountFetches.set(name, (this.mountFetches.get(name) ?? 0) + 1);
      return ok(c, bundle);
    });

    app.get(CLI_ROUTES.manifest, (c) => {
      const runToken = c.req.header(HEADERS.runToken);
      if (runToken !== undefined) {
        const run = [...this.runs.values()].find(
          (candidate) =>
            candidate.payload.cli.credential.content.token === runToken,
        );
        if (run === undefined || !active(run))
          return error(c, 401, 'RUN_TOKEN_INVALID');
        return ok(c, {
          version: 1,
          etag: 'etag-1',
          identity: {
            kind: 'run',
            runId: run.payload.run.id,
            userId: 'u1',
            displayName: 'Ada',
          },
          commands: [],
        });
      }
      const user = this.apiKeys.get(c.req.header(HEADERS.apiKey) ?? '');
      if (user === undefined) return error(c, 401, 'UNAUTHENTICATED');
      return ok(c, {
        version: 1,
        etag: 'etag-1',
        identity: { kind: 'user', ...user },
        commands: [],
      });
    });
  }
}

/** Polls until `check` returns a value other than undefined or false. */
export async function waitFor<T>(
  check: () => T | undefined | false | Promise<T | undefined | false>,
  timeoutMs = 15_000,
  message = 'condition',
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = await check();
    if (value !== undefined && value !== false) return value;
    if (Date.now() > deadline)
      throw new Error(`Timed out waiting for ${message}`);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

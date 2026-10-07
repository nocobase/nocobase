// One run, start to end, in its own process (see supervisor.ts):
//
//   prepare (prepare/index.ts: workspace, application CLI, working directories, skills) -> start
//     -> adapter turns (events, permissions, inputs) -> complete | fail | cancelAck
//
// The agent starts in the run's primary working directory (or the subject's work directory when the run names none),
// with its own home and tmp inside the work directory (agent-home.ts), the application's CLI first on its PATH, the
// push guard as its git hooks, and the run's policy deciding every tool call (policy.ts). The policy lets tools write in
// every working directory and keeps them away from the CLI's credentials file and from the runner's own directory.
//
// While it runs, the lease is renewed every 15 s and the run's status is polled every few seconds; both answers carry
// the cancel flag and the unhandled inputs. An input that arrives mid-turn is steered into the turn when the adapter
// can; otherwise it waits for the turn to end and starts the next one. `complete` must cover every input, so a
// `RUN_INPUT_PENDING` answer means another turn.
//
// How a run ends:
// - cancel requested: abort the tool, deliver the events, `cancelAck`;
// - lease lost: abort the tool and stop; the run is no longer this runner's, so nothing is reported;
// - SIGTERM (the runner is stopping): abort the tool and `fail(runnerOffline)` so the server can requeue the run;
// - no event for `idleTimeoutMs`: abort the tool and `fail(idleTimeout)`.
//
// Nothing leaves the worker unredacted (`runSecrets`): every event is redacted as it is spooled, and so are the
// summary, the failure detail and the worker's log lines. The redactor removes the values of the secrets the run was
// given (its variables, the passthrough values taken from this host, its CLI credential's tokens, the runner key) and
// the common secret patterns of `@nocobase/agent-protocol`.
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import type {
  AdapterEvent,
  AdapterHandle,
  AdapterResult,
  AgentAdapter,
  PermissionCheck,
} from './adapters/types.ts';
import {
  runnerClient,
  type AppConnection,
  type RunnerSettings,
} from '../lib/config.ts';
import { backoff, delay, ApiError, type ApiClient } from '../lib/http.ts';
import { cliStateDirs, type RunnerPaths } from '../lib/home.ts';
import {
  createRedactor,
  FailureReasonSchema,
  RUNNER_ROUTES,
  routePath,
  StatusResponseSchema,
  WORKSPACE_INIT_PLACEHOLDER,
  WORKSPACE_NOTES_PLACEHOLDER,
  type RepoReport,
  type RunInput,
  type RunPayload,
  type AgentTool,
  type Usage,
  type FailureReason,
  type Redactor,
} from '../protocol/index.ts';
import { prepareAgentHome } from './agent-home.ts';
import {
  markDirsPrepared,
  markWorkspaceEnded,
  reportRepos,
  RUNNER_DIR,
  type PreparedDir,
} from '../core/checkout.ts';
import { credentialsGuard, deleteRunCredentials } from './credentials.ts';
import { SKILLS_PLUGIN_NAME } from './skills.ts';
import { buildAgentEnv } from './env.ts';
import { EventSpool } from '../core/events.ts';
import { LeaseKeeper, LOST_CODES } from '../core/lease.ts';
import { createPolicy } from '../core/command-policy.ts';
import {
  agentCwd,
  PREPARE_STEPS,
  PrepareError,
  type PrepareContext,
} from './prepare/index.ts';
import {
  removeRecord,
  writeRecord,
  type RunRecord,
  type Timings,
} from '../core/supervisor.ts';

export interface WorkerDeps {
  paths: RunnerPaths;
  /** The registration the run was claimed through. */
  connection: AppConnection;
  settings: RunnerSettings;
  adapters: Map<AgentTool, AgentAdapter>;
  log: (message: string) => void;
  /** Overrides the client built from `connection`, for tests. */
  client?: ApiClient;
  /** Whether to push branches with work on them when the run completes. */
  push?: boolean;
}

export type WorkerOutcome =
  'completed' | 'failed' | 'cancelled' | 'leaseLost' | 'stopped';

type Ending =
  | { kind: 'cancel' }
  | { kind: 'lost'; code: string }
  | { kind: 'shutdown' }
  | { kind: 'idle' };

/** The system prompt, with what only the runner knows put where the application asked for it. */
export function systemPrompt(
  system: string,
  notes: string,
  init: string = '',
): string {
  const fill = (text: string, placeholder: string, value: string): string =>
    text.includes(placeholder) ? text.split(placeholder).join(value) : text;
  return fill(
    fill(system, WORKSPACE_NOTES_PLACEHOLDER, notes),
    WORKSPACE_INIT_PLACEHOLDER,
    init,
  ).replace(/\n{3,}/gu, '\n\n');
}

/** What the runner tells the agent about its working directories. */
export function workspaceNotes(options: {
  workDir: string;
  cwd: string;
  dirs: readonly PreparedDir[];
  cli: string;
  skillsDir?: string;
  /** The coding tool, for how it names the skills. */
  tool?: AgentTool;
  /** Directories of files the application placed for this run, with what each holds. */
  mounts?: readonly { readonly dir: string; readonly note?: string }[];
}): string {
  const { workDir, cwd, dirs } = options;
  const lines = [
    dirs.length === 0
      ? `Your working directory is ${workDir}, an empty directory kept for this task; you start in it.`
      : `You start in ${cwd}. The runner keeps this task's own files in ${workDir}; your HOME and TMPDIR are inside it.`,
  ];
  if (dirs.length > 0) {
    lines.push('Working directories (the first is the primary one):');
    for (const dir of dirs) {
      const name = dir.name === undefined ? '' : ` (${dir.name})`;
      lines.push(
        dir.repo === undefined
          ? `- ${dir.dir}${name}: a directory used in place, not a checkout; there is no branch to push, so leave version control to the people who own it.`
          : `- ${dir.dir}${name}: ${dir.repo.url}, branch ${dir.repo.branch} from ${dir.repo.defaultBranch} (the only branch you can push).`,
      );
    }
    lines.push('Keep every file you write inside these directories.');
  }
  if (options.skillsDir !== undefined)
    lines.push(
      `Your skills are in ${options.skillsDir}, one directory each with its SKILL.md; read a skill's SKILL.md when its description fits what you are doing.`,
    );
  // Claude Code knows them by their plugin's name only (`Skill("release-notes")` is refused); see src/agent/skills.ts.
  if (options.skillsDir !== undefined && options.tool === 'claude')
    lines.push(
      `With the Skill tool, name a skill with the \`${SKILLS_PLUGIN_NAME}:\` prefix, such as \`${SKILLS_PLUGIN_NAME}:<skill name>\`.`,
    );
  if (options.mounts !== undefined && options.mounts.length > 0) {
    lines.push('Files the application placed for this run:');
    for (const mount of options.mounts)
      lines.push(`- ${mount.dir}${mount.note ? `: ${mount.note}` : ''}`);
  }
  lines.push(
    `\`${options.cli}\` is on your PATH; run \`${options.cli} --help\` for what it can do.`,
  );
  return lines.join('\n');
}

/** The initialization prompts of the directories prepared fresh for this run; empty when there are none. */
export function workspaceInit(dirs: readonly PreparedDir[]): string {
  return dirs
    .filter((dir) => dir.fresh && dir.initPrompt !== undefined)
    .map(
      (dir) =>
        `This working directory was just prepared for this task. Before you start working, do the following in ${dir.dir}:\n\n${dir.initPrompt!.trim()}`,
    )
    .join('\n\n');
}

export function formatInputs(inputs: readonly RunInput[]): string {
  return inputs
    .map(
      (input) =>
        `[${input.type} from ${input.actor.name} at ${input.at}]\n${input.text}`,
    )
    .join('\n\n');
}

/** Credential fields whose values are secrets, in a run's CLI credential. */
const CREDENTIAL_SECRET = /token|key|secret|password/iu;

/**
 * The secret values a run carries: its variables, the values of the passthrough names as this host has them, the
 * secret fields of its CLI credential (the run token), and the runner key it was claimed with.
 */
export function runSecrets(
  payload: Pick<RunPayload, 'workspace' | 'cli'>,
  connection?: Pick<AppConnection, 'runnerKey' | 'registration'>,
  source: NodeJS.ProcessEnv = process.env,
): string[] {
  const secrets = payload.workspace.env.map((variable) => variable.value);
  for (const name of payload.workspace.passthrough ?? []) {
    const value = connection?.registration.variables?.[name] ?? source[name];
    if (value !== undefined) secrets.push(value);
  }
  const content = payload.cli.credential.content;
  if (content !== null && typeof content === 'object')
    for (const [key, value] of Object.entries(content))
      if (typeof value === 'string' && CREDENTIAL_SECRET.test(key))
        secrets.push(value);
  if (connection !== undefined) secrets.push(connection.runnerKey);
  return secrets;
}

function failureReason(result: AdapterResult): {
  reason: FailureReason;
  detail: string;
} {
  const error = result.error as
    { reason?: unknown; message?: unknown } | undefined;
  const parsed = FailureReasonSchema.safeParse(error?.reason);
  const detail =
    typeof error?.message === 'string' ? error.message : 'The tool failed.';
  return { reason: parsed.success ? parsed.data : 'toolProcess', detail };
}

export class RunWorker {
  private readonly payload: RunPayload;
  private readonly timings: Timings;
  private readonly deps: WorkerDeps;
  private readonly client: ApiClient;
  private readonly redactor: Redactor;
  private readonly runId: string;
  private readonly record: RunRecord;
  private readonly spool: EventSpool;
  private readonly lease: LeaseKeeper;
  private readonly abort = new AbortController();
  private readonly inputs = new Map<string, RunInput>();
  /** Inputs that produced an `input` event: they reached the agent, and `complete` reports them as handled. */
  private readonly delivered = new Set<string>();
  /** Inputs handed to `steer()` in the current turn and not yet picked up by the agent. */
  private readonly steered = new Set<string>();
  private summaryText: string | undefined;
  private readonly usage: Usage[] = [];
  private ending: Ending | undefined;
  private handle: AdapterHandle | undefined;
  private statusTimer: NodeJS.Timeout | undefined;
  private idleTimer: NodeJS.Timeout | undefined;
  private lastActivity = Date.now();
  private sessionId: string | undefined;
  private prepared: PrepareContext | undefined;
  private readonly releases: (() => Promise<void>)[] = [];
  private credentialsFile: string | undefined;

  constructor(
    payload: RunPayload,
    timings: Timings,
    deps: WorkerDeps,
    record: RunRecord,
  ) {
    this.payload = payload;
    this.timings = timings;
    this.redactor = createRedactor(runSecrets(payload, deps.connection));
    const redact = this.redactor;
    this.deps = {
      ...deps,
      log: (message: string) => deps.log(redact.text(message)),
    };
    this.client = deps.client ?? runnerClient(deps.connection);
    this.runId = payload.run.id;
    this.record = record;
    this.sessionId =
      payload.prompt.session === 'resume'
        ? payload.prompt.resumeSessionId
        : undefined;
    this.spool = EventSpool.open({
      runsDir: deps.paths.runsDir,
      runId: this.runId,
      client: this.client,
      firstSeq: payload.run.firstSeq,
      flushIntervalMs: timings.eventFlushMs,
      redactor: this.redactor,
      log: this.deps.log,
      onFatal: (error) => {
        if (LOST_CODES.has(error.reason))
          this.end({ kind: 'lost', code: error.reason });
      },
    });
    this.lease = new LeaseKeeper({
      client: this.client,
      runId: this.runId,
      intervalMs: timings.leaseIntervalMs,
      log: this.deps.log,
      onRenewed: (response) =>
        this.absorb(response.cancelRequested, response.inputs),
      onLost: (error) => this.end({ kind: 'lost', code: error.reason }),
    });
    for (const input of payload.inputs) this.inputs.set(input.id, input);
  }

  /** Asks the run to end; the first reason wins. */
  end(ending: Ending): void {
    if (this.ending !== undefined) return;
    this.ending = ending;
    this.deps.log(`run ${this.runId}: ending (${ending.kind})`);
    this.abort.abort();
  }

  /** Polls status now; the daemon sends SIGUSR2 when its heartbeat learns of a cancel. */
  async pollStatus(): Promise<void> {
    try {
      const status = await this.client.get(
        routePath(RUNNER_ROUTES.status, { runId: this.runId }),
        StatusResponseSchema,
        { timeoutMs: 10_000 },
      );
      if (
        status.status === 'cancelled' ||
        status.status === 'failed' ||
        status.status === 'completed'
      ) {
        this.end({ kind: 'lost', code: 'RUN_NOT_ACTIVE' });
        return;
      }
      this.absorb(status.cancelRequested, status.inputs);
    } catch (error) {
      if (error instanceof ApiError && LOST_CODES.has(error.reason))
        this.end({ kind: 'lost', code: error.reason });
    }
  }

  private absorb(cancelRequested: boolean, inputs: readonly RunInput[]): void {
    if (cancelRequested) {
      this.end({ kind: 'cancel' });
      return;
    }
    for (const input of inputs) {
      if (this.inputs.has(input.id)) continue;
      this.inputs.set(input.id, input);
      void this.steer(input);
    }
  }

  /**
   * Hands an input to the running turn. The adapter emits an `input` event once the agent picks it up (see
   * `recordEvent`); an input still waiting when the turn ends goes into the next turn's prompt.
   */
  private async steer(input: RunInput): Promise<void> {
    const handle = this.handle;
    if (handle === undefined || this.ending !== undefined) return;
    if (this.delivered.has(input.id) || this.steered.has(input.id)) return;
    this.steered.add(input.id);
    const accepted = await handle
      .steer(formatInputs([input]), input.id)
      .catch(() => false);
    if (!accepted) this.steered.delete(input.id);
  }

  /** Puts inputs into a prompt the runner composes, recording each as delivered. */
  private deliverInPrompt(
    inputs: readonly RunInput[],
    mode: 'prompt' | 'turn',
  ): void {
    for (const input of inputs) {
      this.delivered.add(input.id);
      this.spool.push({
        type: 'input',
        content: input.text,
        meta: { inputId: input.id, mode },
      });
    }
  }

  /** Spools an adapter event, noting the inputs it reports as picked up. */
  private recordEvent(event: AdapterEvent): void {
    if (event.type === 'input') {
      const inputId = event.meta?.inputId;
      if (typeof inputId === 'string' && this.inputs.has(inputId)) {
        this.delivered.add(inputId);
        this.steered.delete(inputId);
      }
    }
    this.spool.push(event);
  }

  private undelivered(): RunInput[] {
    return [...this.inputs.values()].filter(
      (input) => !this.delivered.has(input.id) && !this.steered.has(input.id),
    );
  }

  private async updateRecord(patch: Partial<RunRecord>): Promise<void> {
    Object.assign(this.record, patch);
    await writeRecord(this.deps.paths, this.record);
  }

  /** POSTs a final report, retrying transient failures. False when the run is no longer this runner's. */
  private async report(route: string, body: unknown): Promise<boolean> {
    const deadline = Date.now() + (this.timings.reportTimeoutMs ?? 10 * 60_000);
    for (let attempt = 0; ; attempt += 1) {
      try {
        await this.client.request('POST', route, body);
        return true;
      } catch (error) {
        if (
          !(error instanceof ApiError) ||
          !error.transient ||
          Date.now() > deadline
        )
          throw error;
        this.deps.log(
          `run ${this.runId}: report failed (${error.reason}); retrying`,
        );
        await delay(backoff(attempt, 500, 10_000));
      }
    }
  }

  async run(): Promise<WorkerOutcome> {
    const { log } = this.deps;
    this.spool.start();
    this.lease.start();
    this.statusTimer = setInterval(
      () => void this.pollStatus(),
      this.timings.statusIntervalMs ?? 3_000,
    );
    try {
      return await this.execute();
    } catch (error) {
      log(
        `run ${this.runId}: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
      );
      if (this.ending?.kind === 'lost') return 'leaseLost';
      return this.finishFailed(
        'unknown',
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      this.lease.stop();
      if (this.statusTimer !== undefined) clearInterval(this.statusTimer);
      if (this.idleTimer !== undefined) clearInterval(this.idleTimer);
      this.spool.stop();
      if (this.credentialsFile !== undefined)
        await deleteRunCredentials(this.credentialsFile);
      for (const release of this.releases.splice(0).reverse())
        await release().catch((error: unknown) =>
          this.deps.log(
            `run ${this.runId}: release failed: ${error instanceof Error ? error.message : String(error)}`,
          ),
        );
      // A lost run's events can no longer be delivered; everything else was drained before reporting.
      if (this.spool.size === 0 || this.ending?.kind === 'lost')
        await this.spool.remove();
      await removeRecord(this.deps.paths, this.runId);
    }
  }

  private async execute(): Promise<WorkerOutcome> {
    const { payload, deps } = this;
    const adapter = deps.adapters.get(payload.tool.kind);
    if (adapter === undefined) {
      return this.finishFailed(
        'setupFailed',
        `This runner has no adapter for ${payload.tool.kind}.`,
      );
    }
    const registration = deps.connection.registration;

    // Prepare: workspace, the application's CLI, working directories, skills.
    const context: PrepareContext = {
      payload,
      paths: deps.paths,
      registration,
      client: this.client,
      tool: payload.tool.kind,
      log: deps.log,
      event: (event) => this.spool.push(event),
      onRelease: (release) => this.releases.push(release),
      dirs: [],
    };
    this.prepared = context;
    for (const step of PREPARE_STEPS) {
      await this.updateRecord({
        phase: step.name,
        ...(context.workspace === undefined
          ? {}
          : { workDir: context.workspace.workDir }),
        ...(context.credentialsFile === undefined
          ? {}
          : { credentialsFile: context.credentialsFile }),
      });
      try {
        await step.run(context);
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        this.spool.push({
          type: 'error',
          content: detail,
          meta: { phase: step.name },
        });
        return this.finishFailed(
          error instanceof PrepareError ? error.reason : step.failure,
          detail,
        );
      } finally {
        this.credentialsFile = context.credentialsFile;
      }
      if (this.ending !== undefined) return this.finishEnding();
    }
    const workDir = context.workspace!.workDir;
    const runnerDir = path.join(workDir, RUNNER_DIR);
    const binDir = context.binDir ?? path.join(runnerDir, 'bin');
    await this.updateRecord({
      phase: 'running',
      workDir,
      ...(this.credentialsFile === undefined
        ? {}
        : { credentialsFile: this.credentialsFile }),
    });

    // Start
    const detected = await adapter
      .detect()
      .catch(() => ({ version: undefined }));
    try {
      await this.report(routePath(RUNNER_ROUTES.start, { runId: this.runId }), {
        workDir,
        adapter: {
          kind: adapter.kind,
          ...(detected.version === undefined
            ? {}
            : { version: detected.version }),
        },
        acceptsInput: true,
        sessionId: this.sessionId ?? null,
      });
    } catch (error) {
      if (error instanceof ApiError && error.reason === 'RUN_CANCEL_REQUESTED')
        this.end({ kind: 'cancel' });
      else if (error instanceof ApiError && LOST_CODES.has(error.reason))
        this.end({ kind: 'lost', code: error.reason });
      else throw error;
      return this.finishEnding();
    }

    const home =
      deps.settings.agentHome === 'real'
        ? undefined
        : await prepareAgentHome(
            path.join(runnerDir, 'home'),
            payload.tool.kind,
          );
    const tmpDir = path.join(runnerDir, 'tmp');
    await mkdir(tmpDir, { recursive: true, mode: 0o700 });
    const cwd = agentCwd(context);
    const env = buildAgentEnv({
      source: process.env,
      binDir,
      ...(home === undefined ? {} : { home }),
      tmpDir,
      hooksDir: deps.paths.hooksDir,
      localVariables: registration.variables,
      workspace: payload.workspace,
    });
    const policy = createPolicy({
      policy: payload.tool.policy,
      workDir,
      extraRoots: context.dirs
        .filter((dir) => dir.kind === 'directory')
        .map((dir) => dir.dir),
      cwd,
      home: env.HOME ?? workDir,
      tmpDir,
      protectedPaths: [
        credentialsGuard(workDir, payload.cli.credential.file),
        deps.paths.home,
        // The person's own sign-in to the same CLI, such as `~/.acme`.
        ...cliStateDirs(payload.cli),
      ],
      alwaysAllowed: [payload.cli.name],
    });
    // Consulted for every tool call; the adapter records refusals as `permission` events itself.
    const permission: PermissionCheck = (tool, input) => {
      this.lastActivity = Date.now();
      const decision = policy(tool, input);
      return Promise.resolve(
        decision.decision === 'allow' ? 'allow' : { deny: decision.reason },
      );
    };

    const idleMs = payload.tool.policy.idleTimeoutMs;
    this.idleTimer = setInterval(
      () => {
        if (Date.now() - this.lastActivity > idleMs) this.end({ kind: 'idle' });
      },
      Math.min(1_000, idleMs),
    );

    // Turns
    const init = workspaceInit(context.dirs);
    if (init !== '')
      this.spool.push({
        type: 'status',
        content:
          'Initialization prompts included for freshly prepared directories.',
        meta: {
          phase: 'init',
          dirs: context.dirs
            .filter((dir) => dir.fresh && dir.initPrompt !== undefined)
            .map((dir) => dir.dir),
        },
      });
    const system = systemPrompt(
      payload.prompt.system,
      workspaceNotes({
        workDir,
        cwd,
        dirs: context.dirs,
        cli: payload.cli.name,
        tool: payload.tool.kind,
        ...(context.skills === undefined
          ? {}
          : { skillsDir: context.skills.dir }),
        ...(context.mounts === undefined ? {} : { mounts: context.mounts }),
      }),
      init,
    );
    const claimed = this.undelivered();
    const turn = payload.prompt.turn;
    let prompt =
      claimed.length === 0 ? turn : `${turn}\n\n${formatInputs(claimed)}`;
    this.deliverInPrompt(claimed, 'prompt');
    for (;;) {
      this.lastActivity = Date.now();
      const handle = adapter.start({
        workDir: cwd,
        prompt,
        systemPrompt: system,
        ...(payload.tool.model === undefined
          ? {}
          : { model: payload.tool.model }),
        ...(payload.tool.effort === undefined
          ? {}
          : { effort: payload.tool.effort }),
        ...(this.sessionId === undefined
          ? {}
          : { resumeSessionId: this.sessionId }),
        env,
        ...(context.skills === undefined ? {} : { skills: context.skills }),
        permission,
        ...(payload.tool.policy.maxTurns === undefined
          ? {}
          : { maxTurns: payload.tool.policy.maxTurns }),
        abort: this.abort.signal,
      });
      this.handle = handle;
      // Inputs that arrived while no turn was running.
      for (const input of this.undelivered()) void this.steer(input);
      // The run can end while the tool is mid-step; stop reading its events then rather than wait for it to close
      // them, and let finishEnding() stop it.
      const iterator = handle.events[Symbol.asyncIterator]();
      const ended = new Promise<'ended'>((resolve) => {
        if (this.abort.signal.aborted) resolve('ended');
        else
          this.abort.signal.addEventListener('abort', () => resolve('ended'), {
            once: true,
          });
      });
      for (;;) {
        const next = await Promise.race([iterator.next(), ended]);
        if (next === 'ended' || next.done === true) break;
        this.lastActivity = Date.now();
        this.recordEvent(next.value);
      }
      if (this.ending !== undefined) return this.finishEnding();
      const result = await handle.result;
      this.handle = undefined;
      // Steered inputs the agent never picked up go into the next turn.
      this.steered.clear();
      this.usage.push(...result.usage);
      this.sessionId = result.sessionId ?? this.sessionId;
      this.summaryText = result.summary ?? this.summaryText;

      if (this.ending !== undefined) return this.finishEnding();
      if (result.exit === 'error') {
        const { reason, detail } = failureReason(result);
        this.spool.push({ type: 'error', content: detail, meta: { reason } });
        return this.finishFailed(reason, detail);
      }
      if (result.exit === 'aborted')
        return this.finishFailed(
          'toolProcess',
          'The tool stopped before finishing.',
        );

      // Inputs that could not be steered in start the next turn.
      const pending = this.undelivered();
      if (pending.length > 0) {
        prompt = formatInputs(pending);
        this.deliverInPrompt(pending, 'turn');
        continue;
      }
      const outcome = await this.finishCompleted();
      if (outcome !== 'inputPending') return outcome;
      await this.pollStatus();
      if (this.ending !== undefined) return this.finishEnding();
      const next = this.undelivered();
      if (next.length === 0) {
        // The server says inputs are pending but sent none we have not seen; ask once more after a pause.
        await delay(1_000);
        await this.pollStatus();
      }
      const late = this.undelivered();
      prompt = formatInputs(late);
      this.deliverInPrompt(late, 'turn');
    }
  }

  private async stopTool(): Promise<void> {
    const handle = this.handle;
    if (handle === undefined) return;
    this.handle = undefined;
    const settled = await Promise.race([
      handle.stop().then(
        () => true,
        () => true,
      ),
      delay(this.timings.killGraceMs ?? 5_000).then(() => false),
    ]);
    if (settled) {
      const result = await handle.result.catch(() => undefined);
      if (result !== undefined) {
        this.usage.push(...result.usage);
        this.sessionId = result.sessionId ?? this.sessionId;
      }
    }
  }

  private async drainEvents(): Promise<boolean> {
    return this.spool.drain(this.timings.reportTimeoutMs ?? 10 * 60_000);
  }

  private async repoReports(push: boolean): Promise<RepoReport[]> {
    const repos = (this.prepared?.dirs ?? []).flatMap((dir) =>
      dir.repo === undefined ? [] : [dir.repo],
    );
    const workDir = this.prepared?.workspace?.workDir;
    if (workDir === undefined) return [];
    if (repos.length === 0) {
      await markWorkspaceEnded(workDir, true);
      return [];
    }
    const reports = await reportRepos(repos, {
      push,
      log: this.deps.log,
    });
    await markWorkspaceEnded(
      workDir,
      reports.every((report) => report.pushed),
    );
    return reports;
  }

  private async finishCompleted(): Promise<WorkerOutcome | 'inputPending'> {
    await this.updateRecord({ phase: 'reporting' });
    const repos = await this.repoReports(this.deps.push ?? true);
    // The agent got through the initialization prompts; later runs of the subject do not get them again.
    const workDir = this.prepared?.workspace?.workDir;
    if (workDir !== undefined)
      await markDirsPrepared(workDir, this.prepared?.dirs ?? []);
    await this.drainEvents();
    if (this.ending !== undefined) return this.finishEnding();
    try {
      await this.report(
        routePath(RUNNER_ROUTES.complete, { runId: this.runId }),
        {
          summary: this.summary(),
          handledInputIds: [...this.delivered],
          usage: this.usage,
          ...(this.sessionId === undefined
            ? {}
            : { sessionId: this.sessionId }),
          repos,
        },
      );
    } catch (error) {
      if (error instanceof ApiError && error.reason === 'RUN_INPUT_PENDING')
        return 'inputPending';
      if (
        error instanceof ApiError &&
        error.reason === 'RUN_CANCEL_REQUESTED'
      ) {
        this.end({ kind: 'cancel' });
        return this.finishEnding();
      }
      if (error instanceof ApiError && LOST_CODES.has(error.reason)) {
        this.end({ kind: 'lost', code: error.reason });
        return 'leaseLost';
      }
      throw error;
    }
    this.deps.log(`run ${this.runId}: completed`);
    return 'completed';
  }

  private summary(): string {
    // Without a summary from the tool, the last text it wrote (redacted as it was spooled) is the closest thing to one.
    return this.summaryText === undefined
      ? (this.spool.lastText ?? 'Run completed.')
      : this.redactor.text(this.summaryText);
  }

  private async finishFailed(
    reason: FailureReason,
    unredacted: string,
  ): Promise<WorkerOutcome> {
    const detail = this.redactor.text(unredacted);
    await this.updateRecord({ phase: 'reporting' }).catch(() => undefined);
    const repos = await this.repoReports(false).catch(() => []);
    await this.drainEvents();
    try {
      await this.report(routePath(RUNNER_ROUTES.fail, { runId: this.runId }), {
        reason,
        detail,
        handledInputIds: [...this.delivered],
        usage: this.usage,
        ...(this.sessionId === undefined ? {} : { sessionId: this.sessionId }),
        repos,
      });
    } catch (error) {
      if (error instanceof ApiError && LOST_CODES.has(error.reason))
        return 'leaseLost';
      throw error;
    }
    this.deps.log(`run ${this.runId}: failed (${reason}): ${detail}`);
    return 'failed';
  }

  private async finishEnding(): Promise<WorkerOutcome> {
    const ending = this.ending;
    await this.stopTool();
    switch (ending?.kind) {
      case 'lost':
        this.deps.log(
          `run ${this.runId}: lease lost (${ending.code}); tool stopped`,
        );
        return 'leaseLost';
      case 'cancel': {
        this.spool.push({
          type: 'status',
          content: 'Cancelled.',
          meta: { status: 'cancelled' },
        });
        await this.drainEvents();
        try {
          await this.report(
            routePath(RUNNER_ROUTES.cancelAck, { runId: this.runId }),
            {
              handledInputIds: [...this.delivered],
              usage: this.usage,
            },
          );
        } catch (error) {
          if (!(error instanceof ApiError && LOST_CODES.has(error.reason)))
            throw error;
        }
        this.deps.log(`run ${this.runId}: cancelled`);
        return 'cancelled';
      }
      case 'shutdown':
        await this.finishFailed(
          'runnerOffline',
          'The runner stopped while the run was in progress.',
        );
        return 'stopped';
      case 'idle':
        return this.finishFailed(
          'idleTimeout',
          `No activity from the tool for ${this.payload.tool.policy.idleTimeoutMs} ms.`,
        );
      default:
        return this.finishFailed(
          'unknown',
          'The run ended for no recorded reason.',
        );
    }
  }
}

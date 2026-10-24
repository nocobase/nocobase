import { OutputWriter } from './output-writer.ts';
import { PreviewTransport } from './preview-transport.ts';
import { existsSync } from 'node:fs';
import { protectUpgradeWorkspace } from '../core/workspace-use.ts';
import { taskSessionWorkDir } from '../core/run-worktrees.ts';
// One run, start to end, in its own process (see supervisor.ts):
//
//   prepare (prepare/index.ts: workspace, application CLI, working directories, skills) -> start
//     -> adapter turns (events, permissions, inputs) -> complete | fail | cancelAck
//
// The agent starts in the run's primary working directory (or the subject's work directory when the run names none),
// with the real HOME of the user the runner runs as, its own private TMPDIR outside shared code and an external
// Codex CODEX_HOME, the application's CLI first on its PATH and the runner's commit hook as its git hooks. Nothing restricts what its
// tools do: the runner is not a security boundary, so run it as a dedicated user, in a container or in a VM.
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
// summary, the failure detail, the repositories' push failures and the worker's log lines. The redactor removes the
// values of the secrets the run was given (its variables, the passthrough values taken from this host, the proxy and
// `--pass-env` values the runner passes, its CLI credential's tokens, the runner key, and every repository credential
// as the broker gets it) and the common secret patterns of `@nocobase/agent-protocol`.
//
// The run's repository credentials (`workspace.git`) are kept by a broker in this process (git-credentials.ts), which
// the checkout, the agent's git (through the runner's credential helper and a socket only this worker serves) all ask; it is closed, and the socket removed, when the run ends or is no longer this runner's.
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
import type { RunnerPaths } from '../lib/home.ts';
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
import {
  markDirsPrepared,
  markWorkspaceEnded,
  readWorkspaceMeta,
  writeWorkspaceMeta,
  reportRepos,
  RUNNER_DIR,
  type PreparedDir,
} from '../core/checkout.ts';
import { deleteRunCredentials } from './credentials.ts';
import { prepareCodexHome } from './codex-home.ts';
import { SKILLS_PLUGIN_NAME } from './skills.ts';
import { buildAgentEnv, environmentSecrets, providedVariables } from './env.ts';
import {
  allocateRunTemp,
  removeRunTemp,
  type RunTemp,
} from '../core/run-temp.ts';
import {
  GitCredentialBroker,
  installCredentialHelper,
  serveGitCredentials,
  type CredentialServer,
} from './git-credentials.ts';
import { PROCESS_TAG_ENV } from '../core/process-tree.ts';
import { QuotaReportSchema, type QuotaReport } from '@nocobase/agent-protocol';
import { EventSpool } from '../core/events.ts';
import { isDiskFull } from '../lib/disk-full.ts';
import { LeaseKeeper, LOST_CODES } from '../core/lease.ts';
import { ensurePnpmStore } from '../core/pnpm-store.ts';
import { writeRunnerTools } from './runner-tools.ts';
import { removeHostToolWrappers, writeHostTools } from './host-tools.ts';
import {
  agentCwd,
  PREPARE_STEPS,
  PrepareError,
  stepFailure,
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
  /** Version from background detection; starting a task must not launch an inspection. */
  toolVersion?: string;
  log: (message: string) => void;
  /** Overrides the client built from `connection`, for tests. */
  client?: ApiClient;
  /** Stops this isolated worker's descendants before ending this run. */
  stopWriters?: () => Promise<void>;
}

export type WorkerOutcome =
  'completed' | 'failed' | 'cancelled' | 'leaseLost' | 'stopped';

type Ending =
  | { kind: 'upgrade' }
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
  tmpDir: string;
  cwd: string;
  dirs: readonly PreparedDir[];
  cli: string;
  skillsDir?: string;
  /** The coding tool, for how it names the skills. */
  tool?: AgentTool;
  /** Directories of files the application placed for this run, with what each holds. */
  mounts?: readonly { readonly dir: string; readonly note?: string }[];
  /** The pnpm store every run on this machine shares. */
  pnpmStoreDir?: string;
  /** The run only reads (`workspace.readOnly`): nothing it commits is pushed. */
  readOnly?: boolean;
}): string {
  const { workDir, cwd, dirs, tmpDir } = options;
  const lines = [
    dirs.length === 0
      ? `Your working directory is ${workDir}, an empty directory kept for this task; you start in it.`
      : `You start in ${cwd}. The runner keeps this task's own files in ${workDir}.`,
  ];
  lines.push(
    `TMPDIR, TMP and TEMP point to ${tmpDir}, which you and your child processes may write.`,
    'All runs of this task share a fixed workspace on this machine, including other agents and read-only runs. Coordinate concurrent changes yourself. Each agent resumes its own session here; old attempt directories and sessions are not migrated.',
  );
  if (dirs.length > 0) {
    lines.push(
      `Keep drafts and temporary tools outside repositories, in the task's temporary directory (${tmpDir}). The runner preserves code, uncommitted changes, dependencies and build artifacts when a run ends or is interrupted. Commit and push your own work explicitly; the runner never commits or pushes for you. Run-private temporary files are removed.`,
    );
    lines.push('Working directories (the first is the primary one):');
    for (const dir of dirs) {
      const name = dir.name === undefined ? '' : ` (${dir.name})`;
      lines.push(
        dir.repo === undefined
          ? `- ${dir.dir}${name}: a directory used in place, not a checkout; there is no branch to push, so leave version control to the people who own it.`
          : options.readOnly === true
            ? `- ${dir.dir}${name}: ${dir.repo.url}, branch ${dir.repo.branch} from ${dir.repo.defaultBranch} (a shared workspace for a read-only run: change no tracked file, commit and push nothing).`
            : `- ${dir.dir}${name}: ${dir.repo.url}, starting target branch ${dir.repo.branch} from ${dir.repo.defaultBranch}, local branch ${dir.repo.localBranch ?? dir.repo.branch}. You may switch or create branches and push any branch of this repository after checking the current branch, with git push origin HEAD:refs/heads/<branch> (requested initial target: ${dir.repo.branch}). Never rewrite already-pushed history or force push. Open and update change requests (pull or merge requests) with the code host's command line, such as gh, glab or gitee, when one is available; ${options.cli} pr link and pr unlink manage the task's other associations. Check each command's --help for arguments.`,
      );
    }
    for (const dir of dirs)
      for (const warning of dir.repo?.warnings ?? []) lines.push(warning);
    if (options.readOnly === true)
      lines.push(
        'This step only reads: another run may be changing the same branch in this same directory at the same time. Change no tracked file, commit and push nothing; the runner pushes nothing from this checkout. You may still prepare the checkout to run things here: initialize submodules, install dependencies, build, start the application and run checks.',
      );
    for (const dir of dirs) {
      if (dir.repo?.initializing)
        lines.push(
          `The remote ${dir.repo.url} has no refs. This checkout is initializing it on ${dir.repo.branch}, with no base commit. Implement the task in this directory, verify the result, then commit and push this branch. This first delivery needs no pull request, even if the usual workflow asks for one: there is no base branch yet. The push may only create the branch, not overwrite a branch created by someone else. Preserve existing files and commits on a retry. Report the actual checks and any failure; do not claim the task is complete merely because the first push succeeded.`,
        );
    }
    lines.push(
      `Keep every file you write inside these directories or the task's temporary directory (${tmpDir}).`,
    );
  }
  if (options.pnpmStoreDir !== undefined)
    lines.push(
      `pnpm is set up to use this machine's shared store, ${options.pnpmStoreDir}, which you may write: install with a plain \`pnpm install\`, without \`--store-dir\`, so dependencies come from it instead of being downloaded again. Never change the store's files.`,
      'Dependencies under `node_modules` are hard links into that store, shared by every run on this machine: never edit them in place. To change a dependency for debugging, use `pnpm patch <pkg>` (edit the extracted copy, then `pnpm patch-commit` or discard it), or copy the file elsewhere.',
    );
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
 * values the runner passes from its environment (its proxies, which may hold a password, and `--pass-env`), the
 * secret fields of its CLI credential (the run token), and the runner key it was claimed with.
 */
export function runSecrets(
  payload: Pick<RunPayload, 'workspace' | 'cli'>,
  connection?: Pick<AppConnection, 'runnerKey' | 'registration'>,
  source: NodeJS.ProcessEnv = process.env,
  passEnv: readonly string[] = [],
): string[] {
  const secrets = payload.workspace.env.map((variable) => variable.value);
  const provided = providedVariables(
    source,
    passEnv,
    connection?.registration.variables,
  );
  for (const name of payload.workspace.passthrough ?? []) {
    const value = provided[name];
    if (value !== undefined) secrets.push(value);
  }
  secrets.push(...environmentSecrets(source, passEnv));
  const content = payload.cli.credential.content;
  if (content !== null && typeof content === 'object')
    for (const [key, value] of Object.entries(content))
      if (typeof value === 'string' && CREDENTIAL_SECRET.test(key))
        secrets.push(value);
  if (connection !== undefined) secrets.push(connection.runnerKey);
  return secrets;
}

/** A redactor that takes in secrets the run is given later, such as a repository credential issued on demand. */
export class GrowingRedactor implements Redactor {
  private current: Redactor;

  constructor(initial: Redactor) {
    this.current = initial;
  }

  get secrets(): readonly string[] {
    return this.current.secrets;
  }

  add(secrets: Iterable<string | null | undefined>): void {
    this.current = this.current.with(secrets);
  }

  text(text: string): string {
    return this.current.text(text);
  }

  optional(text: string | undefined): string | undefined {
    return this.current.optional(text);
  }

  value<T>(value: T): T {
    return this.current.value(value);
  }

  with(secrets: Iterable<string | null | undefined>): Redactor {
    return this.current.with(secrets);
  }
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
  return {
    reason: isDiskFull(result.error)
      ? 'runnerDiskFull'
      : parsed.success
        ? parsed.data
        : 'toolProcess',
    detail,
  };
}

export class RunWorker {
  private readonly payload: RunPayload;
  private readonly timings: Timings;
  private readonly deps: WorkerDeps;
  private readonly client: ApiClient;
  private readonly redactor: GrowingRedactor;
  private readonly broker: GitCredentialBroker | undefined;
  private credentialServer: CredentialServer | undefined;
  /** Where the run's host tool wrappers are (host-tools.ts), removed when it ends. */
  private hostToolsDir: string | undefined;
  private readonly runId: string;
  private readonly record: RunRecord;
  private readonly spool: EventSpool;
  private readonly output?: OutputWriter;
  private readonly preview?: PreviewTransport;
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
  private confirmedSessionId: string | undefined;
  private prepared: PrepareContext | undefined;
  private readonly releases: (() => Promise<void>)[] = [];
  private credentialsFile: string | undefined;
  private runTemp: RunTemp | undefined;

  constructor(
    payload: RunPayload,
    timings: Timings,
    deps: WorkerDeps,
    record: RunRecord,
  ) {
    this.payload = payload;
    this.timings = timings;
    this.redactor = new GrowingRedactor(
      createRedactor(
        runSecrets(
          payload,
          deps.connection,
          process.env,
          deps.settings.passEnv,
        ),
      ),
    );
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
    if (payload.outputBlocks === true) {
      this.preview = new PreviewTransport(this.client, this.runId);
      this.output = new OutputWriter(
        (event) => {
          this.spool.push(event);
        },
        this.redactor,
        payload.outputBlocks === true,
        (event) => this.preview!.send(event),
      );
    }
    this.lease = new LeaseKeeper({
      client: this.client,
      runId: this.runId,
      intervalMs: timings.leaseIntervalMs,
      log: this.deps.log,
      onRenewed: (response) =>
        this.absorb(response.cancelRequested, response.inputs),
      onLost: (error) => this.end({ kind: 'lost', code: error.reason }),
    });
    const git = payload.workspace.git;
    this.broker =
      (git?.onDemand?.length ?? 0) > 0 || (git?.credentials?.length ?? 0) > 0
        ? new GitCredentialBroker({
            client: this.client,
            runId: this.runId,
            attempt: payload.run.attempt,
            ...(git?.onDemand ? { onDemand: git.onDemand } : {}),
            ...(git?.credentials ? { credentials: git.credentials } : {}),
            onSecret: (secret) => this.redactor.add([secret]),
            onLost: (code) => this.end({ kind: 'lost', code }),
            event: (event) => this.writeEvent(event),
            log: this.deps.log,
          })
        : undefined;
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
      this.writeEvent({
        type: 'input',
        content: input.text,
        meta: { inputId: input.id, mode },
      });
    }
  }

  /** Spools an adapter event, noting the inputs it reports as picked up. */
  private quota: QuotaReport | undefined;
  private recordEvent(event: AdapterEvent): void {
    const quota = QuotaReportSchema.safeParse(event.meta?.quota);
    if (quota.success) {
      const windows = new Map(
        (this.quota?.windows ?? []).map((window) => [
          JSON.stringify([window.scope, window.target, window.window]),
          window,
        ]),
      );
      for (const window of quota.data.windows)
        if (window.exhausted)
          windows.set(
            JSON.stringify([window.scope, window.target, window.window]),
            window,
          );
      if (windows.size) this.quota = { windows: [...windows.values()] };
    }
    if (event.type === 'status' && event.content === 'sessionRecovery') {
      this.sessionId = undefined;
      this.confirmedSessionId = undefined;
    }
    if (
      event.type === 'status' &&
      event.content === 'started' &&
      typeof event.meta?.sessionId === 'string'
    ) {
      this.sessionId = event.meta.sessionId;
      this.confirmedSessionId = event.meta.sessionId;
    }
    if (event.type === 'input') {
      const inputId = event.meta?.inputId;
      if (typeof inputId === 'string' && this.inputs.has(inputId)) {
        this.delivered.add(inputId);
        this.steered.delete(inputId);
      }
    }
    this.writeEvent(event);
  }

  private writeEvent(event: Parameters<EventSpool['push']>[0]): void {
    if (this.output) this.output.write(event);
    else this.spool.push(event);
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
      return await this.finishFailed(
        isDiskFull(error) ? 'runnerDiskFull' : 'unknown',
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      await this.stopTool();
      if (this.ending?.kind === 'upgrade' && this.prepared?.workspace)
        await protectUpgradeWorkspace(
          this.deps.paths,
          this.prepared.workspace.workDir,
          this.runId,
        );
      // A failed stop/save retains the original directory. No separate recovery protocol is maintained.
      await this.saveLocal(!this.retainWorkspace).catch((error: unknown) =>
        log(
          `Directory retained: ${this.prepared?.workspace?.workDir ?? this.record.workDir}: ${String(error)}`,
        ),
      );
      if (this.runTemp !== undefined) {
        try {
          if (this.writerStopFailure === undefined)
            await removeRunTemp(this.runTemp.dir);
        } catch (error) {
          log(
            `Run temporary directory retained: ${this.runTemp.dir}: ${String(error)}`,
          );
        } finally {
          await this.runTemp.lock.release();
        }
      }
      this.lease.stop();
      this.broker?.close();
      await this.credentialServer?.close().catch(() => undefined);
      if (this.hostToolsDir !== undefined)
        await removeHostToolWrappers(this.hostToolsDir).catch(() => undefined);
      if (this.statusTimer !== undefined) clearInterval(this.statusTimer);
      if (this.idleTimer !== undefined) clearInterval(this.idleTimer);
      try {
        this.output?.end();
      } catch (error) {
        log(`Output cleanup failed: ${this.redactor.text(String(error))}`);
      }
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
    if (
      adapter === undefined ||
      !deps.connection.registration.enabledTools?.includes(payload.tool.kind)
    ) {
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
      passEnv: deps.settings.passEnv ?? [],
      client: this.client,
      tool: payload.tool.kind,
      log: deps.log,
      event: (event) => this.writeEvent(event),
      onRelease: (release) => this.releases.push(release),
      ...(this.broker === undefined ? {} : { gitAuth: this.broker }),
      dirs: [],
      gitRetry: {
        signal: this.abort.signal,
        ...(deps.stopWriters === undefined
          ? {}
          : { onAbort: deps.stopWriters }),
      },
    };
    this.prepared = context;
    for (const step of PREPARE_STEPS) {
      await this.updateRecord({
        phase: step.name,
        ...(context.workspace === undefined
          ? {}
          : { workDir: context.workspace.workDir }),
        ...(context.privateDir ? { privateDir: context.privateDir } : {}),
        ...(context.credentialsFile === undefined
          ? {}
          : { credentialsFile: context.credentialsFile }),
      });
      try {
        await step.run(context);
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        this.writeEvent({
          type: 'error',
          content: detail,
          meta: {
            ...(error instanceof PrepareError ? error.meta : {}),
            phase: step.name,
          },
        });
        if (this.ending !== undefined) return this.finishEnding();
        return this.finishFailed(
          stepFailure(step, error, payload.run.acceptedFailures),
          detail,
        );
      } finally {
        this.credentialsFile = context.credentialsFile;
      }
      if (this.ending !== undefined) return this.finishEnding();
    }
    const workDir = context.workspace!.workDir;
    const runnerDir = path.join(context.privateDir!, RUNNER_DIR);
    const binDir = context.binDir ?? path.join(runnerDir, 'bin');
    await this.updateRecord({
      phase: 'running',
      workDir,
      privateDir: context.privateDir,
      ...(this.credentialsFile === undefined
        ? {}
        : { credentialsFile: this.credentialsFile }),
    });

    const sessionDir = taskSessionWorkDir(
      deps.paths,
      registration.key,
      payload.workspace.key ?? payload.subject.key,
      payload.agent?.id ?? payload.tool.kind,
      payload.tool.kind,
      payload.workspace.sessionScope ?? 'root',
    );
    if (!existsSync(sessionDir)) this.sessionId = undefined;
    await mkdir(sessionDir, { recursive: true, mode: 0o700 });

    // Start with the cached version; the actual run owns every tool process from here.
    if (this.ending !== undefined) return this.finishEnding();
    try {
      await this.report(routePath(RUNNER_ROUTES.start, { runId: this.runId }), {
        workDir,
        adapter: {
          kind: adapter.kind,
          ...(deps.toolVersion === undefined
            ? {}
            : { version: deps.toolVersion }),
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

    try {
      this.runTemp = await allocateRunTemp(deps.paths, context.privateDir!);
    } catch (error) {
      return this.finishFailed('setupFailed', String(error));
    }
    const tmpDir = this.runTemp.dir;
    const codexHome =
      payload.tool.kind === 'codex'
        ? await prepareCodexHome(path.join(sessionDir, 'codex-home'))
        : undefined;
    const runnerTools =
      deps.settings.agentTools === 'system'
        ? []
        : await writeRunnerTools(binDir);
    const pnpmStoreDir = await ensurePnpmStore(deps.paths);
    const cwd = agentCwd(context);
    if (this.broker !== undefined && this.broker.urls.length > 0) {
      this.credentialServer = await serveGitCredentials(
        this.broker,
        deps.paths.home,
      );
    }
    const credentialHelper =
      this.broker !== undefined && this.credentialServer !== undefined
        ? {
            helper: await installCredentialHelper(
              path.join(deps.paths.home, 'helpers'),
            ),
            socket: this.credentialServer.socket,
            nonce: this.credentialServer.nonce,
            urls: this.broker.urls,
          }
        : undefined;
    this.hostToolsDir = binDir;
    const hostTools = await writeHostTools({
      binDir,
      helpersDir: path.join(deps.paths.home, 'helpers'),
      ...(credentialHelper === undefined
        ? {}
        : { helper: credentialHelper.helper, urls: credentialHelper.urls }),
      ...(payload.workspace.git?.tools === undefined
        ? {}
        : { tools: payload.workspace.git.tools }),
      log: deps.log,
    });
    if (hostTools.credentialed.length > 0)
      deps.log(
        `host tools: ${hostTools.credentialed.join(', ')} use the run's credential`,
      );
    const env = buildAgentEnv({
      source: process.env,
      binDir,
      tmpDir,
      ...(codexHome === undefined ? {} : { codexHome }),
      pnpmStoreDir,
      pinPnpm: runnerTools.includes('pnpm'),
      hooksDir: deps.paths.hooksDir,
      ...(credentialHelper === undefined ? {} : { credentialHelper }),
      ...(deps.settings.passEnv === undefined
        ? {}
        : { passEnv: deps.settings.passEnv }),
      ...(process.env[PROCESS_TAG_ENV] === undefined
        ? {}
        : { processTag: process.env[PROCESS_TAG_ENV] }),
      localVariables: registration.variables,
      workspace: payload.workspace,
    });
    // The runner is not a security boundary: every call a tool asks about is allowed.
    const permission: PermissionCheck = () => {
      this.lastActivity = Date.now();
      return Promise.resolve('allow');
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
      this.writeEvent({
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
        tmpDir,
        cwd,
        dirs: context.dirs,
        cli: payload.cli.name,
        tool: payload.tool.kind,
        ...(context.skills === undefined
          ? {}
          : { skillsDir: context.skills.dir }),
        ...(context.mounts === undefined ? {} : { mounts: context.mounts }),
        pnpmStoreDir,
        ...(payload.workspace.readOnly === true ? { readOnly: true } : {}),
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
        ...(payload.outputBlocks ? { outputBlocks: true } : {}),
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
      this.confirmedSessionId = result.sessionId ?? this.confirmedSessionId;
      this.summaryText = result.summary ?? this.summaryText;

      if (this.ending !== undefined) return this.finishEnding();
      if (result.exit === 'error') {
        const { reason, detail } = failureReason(result);
        if (
          reason === 'toolQuota' &&
          (payload.tool.kind === 'opencode' || payload.tool.kind === 'pi') &&
          payload.tool.model?.includes('/')
        ) {
          this.quota = {
            windows: [
              {
                window: 'provider',
                scope: 'provider',
                target: payload.tool.model.split('/')[0],
                resetsAt: null,
                exhausted: true,
              },
            ],
          };
        }
        this.writeEvent({ type: 'error', content: detail, meta: { reason } });
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
      const late = await this.completeOrCollect();
      if (!Array.isArray(late)) return late;
      prompt = formatInputs(late);
      this.deliverInPrompt(late, 'turn');
    }
  }

  /**
   * Completes the run, or returns the input the server held it open for. The server may withdraw pending input it no
   * longer lets the run act on (its subject moved on) between answering `RUN_INPUT_PENDING` and delivering, so when
   * nothing new arrives the run completes again rather than starting a turn with an empty prompt.
   */
  private async completeOrCollect(): Promise<WorkerOutcome | RunInput[]> {
    let empty = 0;
    for (;;) {
      const outcome = await this.finishCompleted();
      if (outcome !== 'inputPending') return outcome;
      await this.pollStatus();
      if (this.ending !== undefined) return this.finishEnding();
      if (this.undelivered().length === 0) {
        // The server says inputs are pending but sent none we have not seen; ask once more after a pause.
        await delay(1_000);
        await this.pollStatus();
        if (this.ending !== undefined) return this.finishEnding();
      }
      const late = this.undelivered();
      if (late.length > 0) return late;
      empty += 1;
      // An older server that keeps answering so without sending anything gets the turn it used to.
      if (empty >= 3) return late;
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
        this.confirmedSessionId = result.sessionId ?? this.confirmedSessionId;
      }
    }
  }

  private async drainEvents(): Promise<boolean> {
    this.output?.end();
    await this.preview?.drain();
    return this.spool.drain(this.timings.reportTimeoutMs ?? 10 * 60_000);
  }

  private async repoReports(_push: boolean): Promise<RepoReport[]> {
    const repos = (this.prepared?.dirs ?? []).flatMap((dir) =>
      dir.repo === undefined ? [] : [dir.repo],
    );
    const workDir = this.prepared?.workspace?.workDir;
    if (workDir === undefined) return [];
    if (repos.length === 0) {
      await markWorkspaceEnded(this.deps.paths, workDir, []);
      return [];
    }
    const reports = (
      await reportRepos(repos, {
        push: false,
        active: () => this.ending === undefined,
        signal: this.abort.signal,
        ...(this.deps.stopWriters === undefined
          ? {}
          : { onAbort: this.deps.stopWriters }),
        ...(this.broker === undefined ? {} : { auth: this.broker }),
        log: this.deps.log,
      })
    ).map((report) =>
      report.failure === undefined
        ? report
        : {
            ...report,
            failure: {
              reason: report.failure.reason,
              message: this.redactor.text(report.failure.message),
            },
          },
    );
    await markWorkspaceEnded(this.deps.paths, workDir, reports);
    return reports;
  }

  private writerStopFailure?: string;

  private retainWorkspace = false;

  private async saveLocal(
    remove = false,
    bestEffortEvents = false,
  ): Promise<string> {
    await this.stopTool();
    if (this.writerStopFailure === undefined) {
      try {
        await this.deps.stopWriters?.();
      } catch (error) {
        this.writerStopFailure = `Process stop failed: ${String(error)}`;
      }
    }
    const workDir = this.prepared?.workspace?.workDir;
    if (workDir === undefined) return '';
    // Stopping this run never commits, pushes or removes shared code.
    void remove;
    void bestEffortEvents;
    if (this.writerStopFailure !== undefined) {
      const meta = await readWorkspaceMeta(this.deps.paths, workDir);
      if (meta)
        await writeWorkspaceMeta(this.deps.paths, workDir, {
          ...meta,
          recoveryRequired: true,
          recoveryReason: this.writerStopFailure,
        });
    }
    return this.writerStopFailure === undefined
      ? ''
      : `Directory retained: ${workDir}: ${this.writerStopFailure}`;
  }

  private async finishCompleted(): Promise<WorkerOutcome | 'inputPending'> {
    await this.updateRecord({ phase: 'reporting' });
    await this.stopTool();
    await this.deps.stopWriters?.().catch((error: unknown) => {
      // A read-only run keeps its checkout for GC; a writer pushes nothing past a writer it could not stop.
      if (this.payload.workspace.readOnly !== true) throw error;
      this.writerStopFailure = `Process stop failed: ${String(error)}`;
    });
    const repos = await this.repoReports(false);
    const workDir = this.prepared?.workspace?.workDir;
    const saved = await this.saveLocal();
    await this.drainEvents();
    if (this.ending !== undefined) return this.finishEnding();
    try {
      await this.report(
        routePath(RUNNER_ROUTES.complete, { runId: this.runId }),
        {
          summary:
            saved === '' ? this.summary() : `${this.summary()}\n\n${saved}`,
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
    if (workDir !== undefined)
      await markDirsPrepared(
        this.deps.paths,
        workDir,
        this.prepared?.dirs ?? [],
      );
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
    remove = false,
  ): Promise<WorkerOutcome> {
    const detail = this.redactor.text(unredacted);
    await this.updateRecord({ phase: 'reporting' }).catch(() => undefined);
    const repos = await this.repoReports(false).catch(() => []);
    let saved: string;
    if (reason === 'runnerDiskFull') {
      this.spool.stop();
      try {
        saved = await this.saveLocal(false, true);
      } catch (error) {
        this.retainWorkspace = true;
        saved = `Local preservation did not finish; workspace retained for recovery: ${this.redactor.text(String(error))}`;
        this.deps.log(`run ${this.runId}: ${saved}`);
      }
      // A full disk may also prevent writing the event acknowledgement. The final failure still must reach the server.
      await this.drainEvents().catch((error: unknown) =>
        this.deps.log(
          `run ${this.runId}: event drain failed while reporting disk exhaustion: ${this.redactor.text(error instanceof Error ? error.message : String(error))}`,
        ),
      );
    } else {
      saved = await this.saveLocal(remove);
      await this.drainEvents();
    }

    try {
      await this.report(routePath(RUNNER_ROUTES.fail, { runId: this.runId }), {
        reason,
        ...(reason === 'toolQuota' && this.quota ? { quota: this.quota } : {}),
        detail: saved === '' ? detail : `${detail}\n\n${saved}`,
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
    if (ending?.kind === 'lost') await this.saveLocal(true);
    switch (ending?.kind) {
      case 'lost':
        this.deps.log(
          `run ${this.runId}: lease lost (${ending.code}); tool stopped`,
        );
        return 'leaseLost';
      case 'cancel': {
        const saved = await this.saveLocal(true);
        this.writeEvent({
          type: 'status',
          content: saved.includes('Recovery required:')
            ? `Cancelled. ${saved}`
            : 'Cancelled.',
          meta: { status: 'cancelled' },
        });
        await this.drainEvents();
        try {
          await this.report(
            routePath(RUNNER_ROUTES.cancelAck, { runId: this.runId }),
            {
              ...(this.confirmedSessionId === undefined
                ? {}
                : { sessionId: this.confirmedSessionId }),
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
      case 'upgrade': {
        await this.finishFailed(
          'runnerUpgrade',
          'The runner interrupted this attempt to install an update.',
          true,
        );
        return 'stopped';
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

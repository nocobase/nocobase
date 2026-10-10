// The runner daemon: one per machine (a pid file guards it), serving every application it is registered with.
//
// On start it recovers the runs a previous daemon left behind (supervisor.ts) and collects old work directories. Once a
// collection removed one, it prunes the shared pnpm store (pnpm-store.ts) as soon as no run is active and every
// outstanding claim has finished starting its workers, claiming nothing until the prune is done. Failed pruning stays
// due, with five minutes between idle attempts. Then, until it stops:
//
// - heartbeat, per application, every 15 s: reports the tools, that application's active runs and the free slots; the
//   answer names the runs whose cancel was requested, and the supervisor makes sure their workers stop;
// - claim: while a slot is free, asks for work. The slots are shared by every application, and so are the limits per
//   coding tool (`settings.toolSlots`): each claim says how many runs of each limited tool the runner can still take
//   (`ClaimRequest.tools`), and the heartbeat reports them (`load.tools`). With one application the
//   claim long-polls (`POST /api/agents/runners/claim?wait=true`, held up to 25 s); an empty answer that came back early means the
//   server does not hold the poll, so the loop waits out the rest of the 15 s fallback interval. With several, the
//   claims rotate across them without waiting, starting each round with the application after the one that last had
//   work, and a round that found nothing waits a few seconds.
//
// - collect working directories, every 10 minutes: the retention rules, then a report to every application whose
//   heartbeat answer accepts one, removing what it says is over and what is over the owner's limit (workspaces.ts).
//
// A revoked runner key ends that application's loops; the daemon stops when no application is left.
//
// Upgrade required: an application that cannot work with this runner's protocol says so in the heartbeat answer
// (`compatibility`), or, if it predates that, answers `PROTOCOL_UNSUPPORTED`. The daemon stays up and keeps sending
// that application heartbeats, so its people see the runtime and why it takes no work, but claims nothing from it until
// an answer comes without the verdict (this runner was updated, or the application was).
//
// Self-update: a heartbeat answer may name a newer runner the application serves (`upgrade`). A daemon started by
// its service from an installation (`selfUpdate`) stops claiming, waits for its runs to end, installs the new version
// (update.ts) and stops, and its process exits with `exitCode`; the service starts the new version. Any other daemon
// only logs the notice.
import { createHash } from 'node:crypto';
import { rm } from 'node:fs/promises';

import type { AgentAdapter } from '../agent/adapters/types.ts';
import { detectionEnv, providedNames } from '../agent/env.ts';
import type { loadAdapters } from '../agent/adapters/registry.ts';
import {
  readConnection,
  passEnvNames,
  dropWorkspaceLimit,
  minFreeDisk,
  readSettings,
  runnerClient,
  type AppConnection,
  type RunnerSettings,
} from '../lib/config.ts';
import {
  ensureHome,
  readJson,
  writeJsonAtomic,
  type RunnerPaths,
} from '../lib/home.ts';
import { backoff, delay, ApiError, type ApiClient } from '../lib/http.ts';
import {
  ClaimResponseSchema,
  type ClaimResponse,
  HeartbeatResponseSchema,
  RUNNER_ROUTES,
  WORKSPACE_REPORT_INTERVAL_MS,
  WorkspacesResponseSchema,
  type WorkspaceReporting,
  type WorkspacesRequest,
  type WorkspacesResponse,
  routePath,
  type RunnerFeature,
  type ToolInfo,
  type ToolLoad,
  type ToolSlots,
  type AgentTool,
} from '../protocol/index.ts';
import type { Installation } from '../lib/install.ts';
import { gcWorkspaces } from './checkout.ts';
import { prunePnpmStore } from './pnpm-store.ts';
import { collectWorkspaces } from './workspaces.ts';
import { installGitHooks } from './git-hooks.ts';
import {
  isAlive,
  jobRecordKey,
  recoverOrphans,
  Supervisor,
  type Timings,
} from './supervisor.ts';
import { isolationProblem } from './isolation.ts';
import {
  policyReport,
  refuseJob,
  refuseRun,
  type IsolationConfig,
  type PolicyReport,
} from './local-policy.ts';
import {
  applyUpdate,
  isNewer,
  RESTART_EXIT_CODE,
  type UpdateTarget,
} from './update.ts';
import { runnerCommandLine, runnerHost } from '../host.ts';
import { ToolCapabilitiesCache } from './tool-capabilities.ts';

/** The version this runner reports and compares updates with: the host package's (`host.ts`). */
export function runnerVersion(): string {
  return runnerHost().version;
}

/** What every runner of this version can do, before adapter features. */
export const BASE_FEATURES: readonly RunnerFeature[] = [
  'input',
  'checkout',
  'directories',
  'secrets',
  'skills',
  'archives',
  // Jobs (runner/job-worker.ts): builds.
  'jobs.build',
  // Mounts (runner/mounts.ts): directories of files the application places beside the agent.
  'mounts',
];

const REVOKED = new Set(['RUNNER_REVOKED', 'RUNNER_KEY_INVALID']);
const UNSUPPORTED = 'PROTOCOL_UNSUPPORTED';
/** How often the daemon looks at whether to collect working directories; it collects every `collectIntervalMs`. */
const GC_TICK_MS = 60_000;
const PRUNE_RETRY_MS = 5 * 60_000;

export interface DaemonPid {
  pid: number;
  startedAt: string;
}

export async function readDaemonPid(
  paths: RunnerPaths,
): Promise<DaemonPid | undefined> {
  const pid = await readJson<DaemonPid>(paths.daemonPid).catch(() => undefined);
  return pid !== undefined && isAlive(pid.pid) ? pid : undefined;
}

export async function detectTools(
  adapters: Map<AgentTool, AgentAdapter>,
): Promise<ToolInfo[]> {
  const tools: ToolInfo[] = [];
  for (const [kind, adapter] of adapters) {
    const detected = await adapter
      .detect()
      .catch(() => ({ installed: false, authenticated: false }));
    if (!detected.installed) continue;
    tools.push({
      kind,
      authenticated: detected.authenticated,
      ...('version' in detected && detected.version !== undefined
        ? { version: detected.version }
        : {}),
      ...('path' in detected && detected.path !== undefined
        ? { path: detected.path }
        : {}),
    });
  }
  return tools;
}

export function runnerFeatures(
  adapters: Map<AgentTool, AgentAdapter>,
): RunnerFeature[] {
  const features = new Set<RunnerFeature>(BASE_FEATURES);
  for (const adapter of adapters.values())
    for (const feature of adapter.features()) features.add(feature);
  return [...features];
}

export interface DaemonOptions {
  paths: RunnerPaths;
  settings: RunnerSettings;
  connections: readonly AppConnection[];
  adapters: Map<AgentTool, AgentAdapter>;
  /** Fresh adapters for each application's detection environment; the supplied adapters otherwise (tests). */
  adaptersFor?: typeof loadAdapters;
  slots?: number;
  /** Limits per coding tool for this start; the settings' otherwise. */
  toolSlots?: ToolSlots;
  timings?: Timings;
  log: (message: string) => void;
  /** Overrides the client built for a registration, by its key; for tests. */
  clients?: ReadonlyMap<string, ApiClient>;
  /** Replaces `prunePnpmStore`; for tests. */
  pruneStore?: typeof prunePnpmStore;
  /** Why an isolation configuration cannot be had here (isolation.ts); for tests. */
  isolationProblem?: (config: IsolationConfig) => Promise<string | undefined>;
  /** Update between runs when an application serves a newer runner; without it, upgrade notices are only logged. */
  selfUpdate?: {
    installation: Pick<Installation, 'prefix' | 'current'>;
    /** Replaces `applyUpdate`; for tests. */
    apply?: typeof applyUpdate;
  };
}

/** How long a version that failed to install is left alone before trying it again. */
const UPDATE_RETRY_MS = 30 * 60_000;

/** One application the daemon serves. */
interface AppLink {
  readonly key: string;
  readonly connection: AppConnection;
  readonly client: ApiClient;
  revoked: boolean;
  /** The application cannot work with this runner's protocol: heartbeats only, no claims. */
  upgradeRequired: boolean;
  heartbeatTimer?: NodeJS.Timeout;
  /** The owner's local policy for this application, as last read (every heartbeat and claim reads it again). */
  policy?: PolicyReport;
  /** Detection is cached only for this application and refreshed when its effective variables change. */
  /**
   * What was detected for this application in the environment its runs get, by a digest of that environment: its
   * tools, and their model capabilities, refreshed in the background (`ToolCapabilitiesCache`).
   */
  detection?: {
    key: string;
    tools: Promise<ToolInfo[]>;
    capabilities: Promise<ToolCapabilitiesCache>;
  };
  /** The application accepts reports of the working directories (its last heartbeat answer said so). */
  workspaceReporting?: WorkspaceReporting;
}

export class RunnerDaemon {
  private readonly options: DaemonOptions;
  private readonly links: AppLink[];
  private readonly timings: Timings;
  private readonly slots: number;
  private readonly toolSlots: ToolSlots;
  private readonly supervisor: Supervisor;
  private readonly stopping = new AbortController();
  private slotFreed: (() => void) | undefined;
  private gcTimer: NodeJS.Timeout | undefined;
  private lastCollect = 0;
  private collecting: Promise<void> | undefined;
  private claimLoop: Promise<void> | undefined;
  private stopped: Promise<void> | undefined;
  /** Where the next round of claims starts, with several applications. */
  private nextApp = 0;
  /** A newer runner to install once no run is left; claiming pauses meanwhile. */
  private pendingUpdate: { link: AppLink; target: UpdateTarget } | undefined;
  private updating = false;
  /** The shared pnpm store is being pruned; claiming pauses meanwhile. */
  private pruning = false;
  /** Claims remain active through policy checks and worker startup, so pruning cannot overlap a received lease. */
  private claimsInFlight = 0;
  /** Working directories were removed since the store was last pruned. */
  private pruneDue = false;
  /** Failed pruning is retried at the next idle opportunity after this time. */
  private pruneRetryAt = 0;
  private readonly failedUpdates = new Map<string, number>();
  /** The version the daemon installed before it stopped, if it did. */
  updatedTo: string | undefined;

  constructor(options: DaemonOptions) {
    this.options = options;
    this.links = options.connections.map((connection) => ({
      key: connection.registration.key,
      connection,
      client:
        options.clients?.get(connection.registration.key) ??
        runnerClient(connection),
      revoked: false,
      upgradeRequired: false,
    }));
    this.timings = options.timings ?? {};
    this.slots = Math.max(1, options.slots ?? options.settings.slots);
    this.toolSlots = options.toolSlots ?? options.settings.toolSlots ?? {};
    this.supervisor = new Supervisor({
      paths: options.paths,
      clientFor: (key) => this.links.find((link) => link.key === key)?.client,
      timings: this.timings,
      log: options.log,
      onExit: () => {
        this.slotFreed?.();
        void this.updateWhenIdle();
        void this.pruneStore();
      },
    });
  }

  /** How the process exits once the daemon has stopped: `RESTART_EXIT_CODE` when it updated itself, 0 otherwise. */
  get exitCode(): number {
    return this.updatedTo === undefined ? 0 : RESTART_EXIT_CODE;
  }

  get activeRuns(): string[] {
    return [...this.supervisor.runs.keys()];
  }

  /** The coding tools it keeps a limit of their own for. */
  private get limitedTools(): AgentTool[] {
    return (Object.keys(this.toolSlots) as AgentTool[]).filter(
      (tool) => this.toolSlots[tool] !== undefined,
    );
  }

  /** How many runs of `tool` it holds at most: its limit, never above the total. */
  private toolLimit(tool: AgentTool): number {
    return Math.min(this.toolSlots[tool] ?? this.slots, this.slots);
  }

  /** How many runs of each limited tool it could take now, across every application. */
  toolRoom(): Partial<Record<AgentTool, number>> {
    const room: Partial<Record<AgentTool, number>> = {};
    for (const tool of this.limitedTools)
      room[tool] = Math.max(
        0,
        this.toolLimit(tool) - this.supervisor.heldOf(tool),
      );
    return room;
  }

  private get live(): AppLink[] {
    return this.links.filter((link) => !link.revoked);
  }

  /** The applications that may hand this runner work. */
  private get claimable(): AppLink[] {
    return this.live.filter((link) => !link.upgradeRequired);
  }

  /** Records whether `link`'s application can work with this runner, logging each change. */
  private setUpgradeRequired(
    link: AppLink,
    required: boolean,
    message?: string,
  ): void {
    if (link.upgradeRequired === required) return;
    link.upgradeRequired = required;
    this.options.log(
      required
        ? `${link.key}: upgrade required, claiming nothing until then: ${message ?? 'the application does not serve this runner protocol'}`
        : `${link.key}: the application accepts this runner again`,
    );
  }

  async start(): Promise<void> {
    const { paths, log } = this.options;
    const running = await readDaemonPid(paths);
    if (running !== undefined && running.pid !== process.pid) {
      throw new Error(
        `A runner daemon is already running (pid ${running.pid}).`,
      );
    }
    await ensureHome(paths);
    await writeJsonAtomic(paths.daemonPid, {
      pid: process.pid,
      startedAt: new Date().toISOString(),
    } satisfies DaemonPid);
    await installGitHooks(paths.hooksDir);
    log(
      `runner ${this.options.settings.name} starting for ${this.links
        .map(
          (link) =>
            `${link.connection.registration.app.name || link.key} (${link.connection.registration.runnerId})`,
        )
        .join(
          ', ',
        )}; ${this.slots} slot(s)${this.limitedTools.length > 0 ? ` (${this.limitedTools.map((tool) => `${tool} ${this.toolLimit(tool)}`).join(', ')})` : ''}`,
    );
    if (await dropWorkspaceLimit(paths).catch(() => false))
      log(
        'settings: workspace-limit no longer applies and was removed; the runner now watches the free space on the disk instead (min-free-disk, 5G unless set)',
      );

    const recovered = await recoverOrphans({
      paths,
      clientFor: (key) => this.links.find((link) => link.key === key)?.client,
      timings: this.timings,
      log,
    });
    if (recovered.length > 0)
      log(
        `recovered ${recovered.length} orphaned run(s): ${recovered.join(', ')}`,
      );
    for (const link of this.links) {
      await this.heartbeat(link);
      link.heartbeatTimer = setInterval(
        () => void this.heartbeat(link),
        this.timings.heartbeatIntervalMs ??
          link.connection.registration.heartbeatIntervalMs,
      );
    }
    // After the first heartbeats, which say which applications accept workspace reports.
    void this.collectGarbage();
    this.gcTimer = setInterval(() => {
      if (Date.now() - this.lastCollect >= this.collectIntervalMs)
        void this.collectGarbage();
    }, this.timings.gcTickMs ?? GC_TICK_MS);
    this.gcTimer.unref();
    this.claimLoop = this.claim();
  }

  /** Resolves when the daemon has stopped, by `stop()` or because every key was revoked. */
  async wait(): Promise<void> {
    await this.claimLoop;
    await this.stopped;
  }

  stop(reason = 'stop requested'): Promise<void> {
    this.stopped ??= (async () => {
      this.options.log(`runner stopping: ${reason}`);
      this.stopping.abort();
      await Promise.allSettled(
        this.links.map(async (link) =>
          (await link.detection?.capabilities)?.stop(),
        ),
      );
      this.slotFreed?.();
      for (const link of this.links)
        if (link.heartbeatTimer !== undefined)
          clearInterval(link.heartbeatTimer);
      if (this.gcTimer !== undefined) clearInterval(this.gcTimer);
      await this.claimLoop?.catch(() => undefined);
      await this.supervisor.stopAll();
      const pid = await readJson<DaemonPid>(this.options.paths.daemonPid).catch(
        () => undefined,
      );
      if (pid?.pid === process.pid)
        await rm(this.options.paths.daemonPid, { force: true });
      this.options.log('runner stopped');
    })();
    return this.stopped;
  }

  /**
   * The owner's local policy for `link`'s application, read from its file now; logs a policy that cannot be used, or an
   * isolation that cannot be had, each time that changes.
   */
  private async policyOf(link: AppLink): Promise<PolicyReport> {
    const report = await policyReport(
      this.options.paths,
      link.key,
      runnerFeatures(this.options.adapters),
      this.options.isolationProblem ?? isolationProblem,
    );
    const problem = report.policy.error ?? report.isolationProblem;
    const before = link.policy?.policy.error ?? link.policy?.isolationProblem;
    if (problem !== before)
      this.options.log(
        problem === undefined
          ? `${link.key}: the local policy is in effect`
          : report.policy.error !== undefined
            ? `${link.key}: the local policy cannot be used, so nothing is taken until it is fixed: ${problem}`
            : `${link.key}: no build job is taken: ${problem}`,
      );
    link.policy = report;
    return report;
  }

  /**
   * The names this application can request and tools it can use now. Re-read its local variables and the passed
   * names so changes refresh detection without a restart; cache no detection across applications.
   */
  private async environmentOf(
    link: AppLink,
  ): Promise<{ variables: string[]; tools: ToolInfo[] }> {
    const stored = await readConnection(link.key, this.options.paths).catch(
      () => undefined,
    );
    const settings =
      (await readJson<RunnerSettings>(this.options.paths.settings)) ??
      this.options.settings;
    const passEnv = passEnvNames(settings.passEnv);
    const localVariables = (stored ?? link.connection).registration.variables;
    const key = createHash('sha256')
      .update(
        JSON.stringify(
          Object.entries(
            detectionEnv(process.env, passEnv, localVariables),
          ).sort(([a], [b]) => a.localeCompare(b)),
        ),
      )
      .digest('hex');
    if (link.detection?.key !== key) {
      const previous = link.detection;
      const adapters =
        this.options.adaptersFor?.(process.env, passEnv, localVariables) ??
        this.options.adapters;
      const tools = detectTools(adapters);
      link.detection = {
        key,
        tools,
        capabilities: tools.then(
          (detected) => new ToolCapabilitiesCache(adapters, detected),
        ),
      };
      if (previous !== undefined)
        void previous.capabilities.then((cache) => cache.stop());
    }
    const capabilities = await link.detection.capabilities;
    capabilities.refresh();
    return {
      variables: providedNames(process.env, passEnv, localVariables),
      tools: [...capabilities.tools],
    };
  }

  /** How often working directories are collected: every 10 minutes, or sooner when an application asks. */
  private get collectIntervalMs(): number {
    return Math.min(
      this.timings.collectIntervalMs ?? WORKSPACE_REPORT_INTERVAL_MS,
      ...this.live.flatMap((link) =>
        link.workspaceReporting === undefined
          ? []
          : [link.workspaceReporting.intervalMs],
      ),
    );
  }

  /**
   * Collects working directories: the retention rules (7 days after a run that pushed everything, 30 days unused), then
   * a report to every application that accepts one, removing what it says is over and what is over the owner's limit
   * (core/workspaces.ts).
   */
  collectGarbage(): Promise<void> {
    this.collecting ??= (async () => {
      this.lastCollect = Date.now();
      const { paths, log } = this.options;
      try {
        const expired = await gcWorkspaces({ paths, log });
        if (expired.length > 0) this.pruneDue = true;
        const settings = await readSettings(paths);
        const reporters = new Map<
          string,
          (request: WorkspacesRequest) => Promise<WorkspacesResponse>
        >();
        for (const link of this.live)
          if (link.workspaceReporting !== undefined && !link.upgradeRequired)
            reporters.set(link.key, (request) =>
              link.client.post(
                RUNNER_ROUTES.workspaces,
                request,
                WorkspacesResponseSchema,
                { timeoutMs: 60_000 },
              ),
            );
        const collected = await collectWorkspaces({
          paths,
          reporters,
          log,
          threshold: minFreeDisk(settings),
        });
        if (collected.removed.length > 0) this.pruneDue = true;
      } catch (error) {
        log(`gc: ${error instanceof Error ? error.message : String(error)}`);
      }
      try {
        await this.pruneStore();
      } finally {
        this.collecting = undefined;
      }
    })();
    return this.collecting;
  }

  /**
   * Prunes only when neither workers nor claims are active: a received claim can start an install before its files
   * are linked. Claims finish policy checks and start workers under the same exclusion, without delaying their
   * leases. Pending cleanup is retried after the last claim or worker ends, or at the next collection; failures wait
   * five minutes before another idle attempt.
   */
  async pruneStore(): Promise<void> {
    if (
      !this.pruneDue ||
      this.pruning ||
      this.claimsInFlight > 0 ||
      this.supervisor.size > 0 ||
      Date.now() < this.pruneRetryAt ||
      this.stopping.signal.aborted
    )
      return;
    this.pruning = true;
    try {
      const pruned = await (this.options.pruneStore ?? prunePnpmStore)({
        paths: this.options.paths,
        log: this.options.log,
      });
      if (pruned) {
        this.pruneDue = false;
        this.pruneRetryAt = 0;
      } else {
        this.pruneRetryAt = Date.now() + PRUNE_RETRY_MS;
      }
    } catch (error) {
      this.pruneRetryAt = Date.now() + PRUNE_RETRY_MS;
      this.options.log(
        `gc: pruning the shared pnpm store failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      this.pruning = false;
      this.slotFreed?.();
    }
  }

  /** The application's key was refused: stop serving it, and stop the daemon when none is left. */
  private revoke(link: AppLink, code: string, message: string): void {
    if (link.revoked) return;
    link.revoked = true;
    if (link.heartbeatTimer !== undefined) clearInterval(link.heartbeatTimer);
    this.options.log(`${link.key}: ${code}: ${message}`);
    if (this.live.length === 0) void this.stop(code);
  }

  async heartbeat(link: AppLink): Promise<void> {
    if (this.stopping.signal.aborted || link.revoked) return;
    const { log } = this.options;
    const held = [...this.supervisor.runs.values()].filter(
      (run) => run.appKey === link.key,
    );
    const runs = held.filter((run) => run.jobId === undefined);
    const jobs = held.filter((run) => run.jobId !== undefined);
    try {
      const policy = await this.policyOf(link);
      const { variables, tools } = await this.environmentOf(link);
      const response = await link.client.post(
        RUNNER_ROUTES.heartbeat,
        {
          version: runnerVersion(),
          product: runnerHost().product,
          features: policy.features,
          ...(policy.policy.reported ? { policy: policy.policy.reported } : {}),
          variables,
          tools,
          active: runs.map((run) => ({
            runId: run.runId,
            pid: run.pid,
            startedAt: run.startedAt,
          })),
          jobs: jobs.map((run) => ({
            jobId: run.jobId!,
            pid: run.pid,
            startedAt: run.startedAt,
          })),
          load: {
            slots: this.slots,
            free: Math.max(0, this.slots - this.supervisor.size),
            ...(this.limitedTools.length > 0
              ? {
                  tools: Object.fromEntries(
                    Object.entries(this.toolRoom()).map(([tool, free]) => [
                      tool,
                      {
                        slots: this.toolLimit(tool as AgentTool),
                        free,
                      } satisfies ToolLoad,
                    ]),
                  ),
                }
              : {}),
          },
        },
        HeartbeatResponseSchema,
        { timeoutMs: 10_000 },
      );
      this.setUpgradeRequired(
        link,
        response.compatibility !== undefined,
        response.compatibility?.message,
      );
      link.workspaceReporting = response.workspaces;
      if (response.upgrade !== undefined)
        this.noticeUpgrade(link, response.upgrade);
      for (const runId of response.cancelRequested)
        void this.supervisor.enforceCancel(runId);
      for (const runId of response.release) void this.supervisor.release(runId);
      for (const jobId of response.jobs?.cancelRequested ?? [])
        void this.supervisor.enforceCancel(jobRecordKey(jobId));
      for (const jobId of response.jobs?.release ?? [])
        void this.supervisor.release(jobRecordKey(jobId));
    } catch (error) {
      if (error instanceof ApiError && REVOKED.has(error.reason)) {
        this.revoke(link, error.reason, error.message);
        return;
      }
      if (error instanceof ApiError && error.reason === UNSUPPORTED) {
        this.setUpgradeRequired(link, true, error.message);
        return;
      }
      log(
        `${link.key}: heartbeat failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private noticeUpgrade(
    link: AppLink,
    upgrade: {
      latestVersion: string;
      downloadUrl: string;
      sha256?: string;
      reason: string;
    },
  ): void {
    const { log, selfUpdate } = this.options;
    if (!isNewer(upgrade.latestVersion, runnerVersion())) return;
    if (
      selfUpdate === undefined ||
      upgrade.sha256 === undefined ||
      this.pendingUpdate !== undefined
    ) {
      if (this.pendingUpdate === undefined)
        log(
          `${link.key}: ${runnerHost().bin} ${upgrade.latestVersion} is available (${upgrade.reason}); run \`${runnerCommandLine('update')}\`.`,
        );
      return;
    }
    const failedAt = this.failedUpdates.get(upgrade.latestVersion);
    if (failedAt !== undefined && Date.now() - failedAt < UPDATE_RETRY_MS)
      return;
    log(
      `${link.key}: updating to ${runnerHost().bin} ${upgrade.latestVersion} once no run is left`,
    );
    this.pendingUpdate = {
      link,
      target: {
        version: upgrade.latestVersion,
        url: upgrade.downloadUrl,
        sha256: upgrade.sha256,
      },
    };
    this.slotFreed?.();
    void this.updateWhenIdle();
  }

  /** Installs the pending update when no run is left, then stops so the service starts the new version. */
  private async updateWhenIdle(): Promise<void> {
    const pending = this.pendingUpdate;
    const { selfUpdate, log } = this.options;
    if (
      pending === undefined ||
      selfUpdate === undefined ||
      this.updating ||
      this.supervisor.size > 0 ||
      this.stopping.signal.aborted
    )
      return;
    this.updating = true;
    try {
      await (selfUpdate.apply ?? applyUpdate)({
        installation: selfUpdate.installation,
        client: pending.link.client,
        update: pending.target,
        log,
      });
      this.updatedTo = pending.target.version;
      void this.stop(
        `updated to ${runnerHost().bin} ${pending.target.version}; the service starts it`,
      );
    } catch (error) {
      this.failedUpdates.set(pending.target.version, Date.now());
      this.pendingUpdate = undefined;
      this.slotFreed?.();
      log(
        `update to ${pending.target.version} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      this.updating = false;
    }
  }

  /** Asks one application for up to `free` runs and starts them. Returns how many it got. */
  private async claimFrom(
    link: AppLink,
    free: number,
    wait: boolean,
  ): Promise<number> {
    if (this.pruning || this.stopping.signal.aborted) return 0;
    this.claimsInFlight += 1;
    try {
      return await this.claimAndStart(link, free, wait);
    } finally {
      this.claimsInFlight -= 1;
      await this.pruneStore();
    }
  }

  /** Receives leases and starts their workers while `claimFrom` excludes pruning. */
  private async claimAndStart(
    link: AppLink,
    free: number,
    wait: boolean,
  ): Promise<number> {
    const pollTimeout =
      this.timings.pollTimeoutMs ?? link.connection.registration.pollTimeoutMs;
    const response: ClaimResponse = await link.client.post(
      RUNNER_ROUTES.claim,
      {
        free,
        ...(this.limitedTools.length > 0 ? { tools: this.toolRoom() } : {}),
      },
      ClaimResponseSchema,
      {
        ...(wait ? { query: { wait: 'true' } } : {}),
        timeoutMs: pollTimeout + 10_000,
        signal: this.stopping.signal,
      },
    );
    // What the owner's local policy does not take is given back at once, to be retried on another runner.
    const policy = await this.policyOf(link);
    for (const payload of response.jobs ?? []) {
      if (this.stopping.signal.aborted) break;
      const refused = refuseJob(
        policy.policy,
        payload,
        policy.isolationProblem,
      );
      if (refused !== undefined) {
        this.options.log(`job ${payload.job.id}: refused: ${refused}`);
        await link.client
          .request(
            'POST',
            routePath(RUNNER_ROUTES.jobFail, { jobId: payload.job.id }),
            { reason: 'policyRefused', detail: refused },
          )
          .catch(() => undefined);
        continue;
      }
      try {
        await this.supervisor.spawnJob(link.key, payload);
      } catch (error) {
        this.options.log(
          `job ${payload.job.id}: could not start: ${error instanceof Error ? error.message : String(error)}`,
        );
        await link.client
          .request(
            'POST',
            routePath(RUNNER_ROUTES.jobFail, { jobId: payload.job.id }),
            {
              reason: 'startTimeout',
              detail: `The runner could not start a worker: ${error instanceof Error ? error.message : String(error)}`,
            },
          )
          .catch(() => undefined);
      }
    }
    for (const payload of response.runs) {
      if (this.stopping.signal.aborted) break;
      const refused = refuseRun(policy.policy, payload);
      if (refused !== undefined) {
        this.options.log(`run ${payload.run.id}: refused: ${refused}`);
        await link.client
          .request(
            'POST',
            routePath(RUNNER_ROUTES.fail, { runId: payload.run.id }),
            { reason: 'policyRefused', detail: refused },
          )
          .catch(() => undefined);
        continue;
      }
      // An application that does not know limits per tool may hand over a run of a full tool: it runs all the same.
      const limit = this.toolSlots[payload.tool.kind];
      if (
        limit !== undefined &&
        this.supervisor.heldOf(payload.tool.kind) >=
          this.toolLimit(payload.tool.kind)
      )
        this.options.log(
          `run ${payload.run.id}: ${payload.tool.kind} is over its limit of ${this.toolLimit(payload.tool.kind)}; ${link.key} does not apply limits per tool`,
        );
      try {
        await this.supervisor.spawn(link.key, payload);
      } catch (error) {
        this.options.log(
          `run ${payload.run.id}: could not start: ${error instanceof Error ? error.message : String(error)}`,
        );
        await link.client
          .request(
            'POST',
            routePath(RUNNER_ROUTES.fail, { runId: payload.run.id }),
            {
              reason: 'startTimeout',
              detail: `The runner could not start a worker: ${error instanceof Error ? error.message : String(error)}`,
            },
          )
          .catch(() => undefined);
      }
    }
    return response.runs.length + (response.jobs?.length ?? 0);
  }

  private async claim(): Promise<void> {
    const { log } = this.options;
    const fallback = this.timings.pollFallbackMs ?? 15_000;
    const rotation = this.timings.rotationIntervalMs ?? 3_000;
    let failures = 0;
    while (!this.stopping.signal.aborted) {
      if (this.live.length === 0) break;
      const live = this.claimable;
      if (live.length === 0) {
        // Every application left wants an upgrade first; heartbeats say when one no longer does.
        await delay(fallback, this.stopping.signal);
        continue;
      }
      if (
        this.slots - this.supervisor.size <= 0 ||
        this.pendingUpdate ||
        this.pruning
      ) {
        await new Promise<void>((resolve) => {
          this.slotFreed = resolve;
        });
        this.slotFreed = undefined;
        continue;
      }
      const single = live.length === 1;
      const startedAt = Date.now();
      let claimed = 0;
      for (let step = 0; step < live.length; step += 1) {
        if (this.stopping.signal.aborted) break;
        const free = this.slots - this.supervisor.size;
        if (free <= 0) break;
        const link = live[(this.nextApp + step) % live.length];
        try {
          const count = await this.claimFrom(link, free, single);
          failures = 0;
          if (count > 0) {
            claimed += count;
            this.nextApp = (this.nextApp + step + 1) % live.length;
          }
        } catch (error) {
          if (this.stopping.signal.aborted) break;
          if (error instanceof ApiError && REVOKED.has(error.reason)) {
            this.revoke(link, error.reason, error.message);
            continue;
          }
          if (error instanceof ApiError && error.reason === UNSUPPORTED) {
            this.setUpgradeRequired(link, true, error.message);
            continue;
          }
          failures += 1;
          log(
            `${link.key}: claim failed: ${error instanceof Error ? error.message : String(error)}`,
          );
          if (single)
            await delay(backoff(failures, 1_000, 15_000), this.stopping.signal);
        }
      }
      if (claimed > 0) continue;
      if (single) {
        const elapsed = Date.now() - startedAt;
        const pollTimeout =
          this.timings.pollTimeoutMs ??
          live[0].connection.registration.pollTimeoutMs;
        if (elapsed < Math.min(fallback, pollTimeout) / 2)
          await delay(fallback - elapsed, this.stopping.signal);
      } else {
        await delay(
          failures > 0 ? backoff(failures, rotation, 15_000) : rotation,
          this.stopping.signal,
        );
      }
    }
  }
}

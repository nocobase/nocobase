// The runner daemon: one per machine (a pid file guards it), serving every application it is registered with.
//
// On start it recovers the runs a previous daemon left behind (supervisor.ts) and collects old work directories. Once a
// collection removed one, it prunes the shared pnpm store (pnpm-store.ts) as soon as no run is active and every
// outstanding claim has finished starting its workers, claiming nothing until the prune is done. Failed pruning stays
// due, with five minutes between idle attempts. Then, until it stops:
//
// - heartbeat, per application, every 15 s: reports the tools, that application's active runs and the free slots; the
//   answer names the runs whose cancel was requested, and the supervisor makes sure their workers stop;
// - claim: asks for work within each application's last heartbeat capacity. Runs and jobs share that application's
//   allowance; tool limits count only its own runs. A single application's claim long-polls up to 25 seconds.
//   With several applications, claims rotate without waiting. Capacity changes wake full-slot and fallback waits;
//   outstanding polls keep their leases and the next request recomputes the allowance.
//
// - collect working directories, an hour after the last collection ended (sooner when an application asks, at once when
//   the disk runs low): the retention rules, then a report to every application whose heartbeat answer accepts one,
//   removing what it says is over and what is over the owner's limit (workspaces.ts). Claims go on meanwhile; only a
//   due prune of the shared store holds them.
//
// A revoked runner key ends that application's loops; the daemon stops when no application is left.
//
// Upgrade required: an application that cannot work with this runner's protocol says so in the heartbeat answer
// (`compatibility`), or, if it predates that, answers `PROTOCOL_UNSUPPORTED`. The daemon stays up and keeps sending
// that application heartbeats, so its people see the runtime and why it takes no work, but claims nothing from it until
// an answer comes without the verdict (this runner was updated, or the application was).
//
// Self-update: a heartbeat answer may name a newer runner the application serves (`upgrade`), or, to this runner's
// `npm` feature, the exact version to install from npm when it serves no tarball (`npmUpgrade`). A daemon started by
// its service from an installation (`selfUpdate`) stops claiming, interrupts agent runs with local preservation,
// waits for their cleanup and any background jobs to finish, and installs the new version
// (update.ts) and stops, and its process exits with `exitCode`; the service starts the new version. Any other daemon
// only logs the notice.
import { createHash } from 'node:crypto';
import { rm } from 'node:fs/promises';

import type { AgentAdapter } from '../agent/adapters/types.ts';
import { detectionEnv, providedNames } from '../agent/env.ts';
import type { loadAdapters } from '../agent/adapters/registry.ts';
import {
  readConnection,
  markRevoked,
  type RevocationReason,
  passEnvNames,
  dropWorkspaceLimit,
  artifactPatterns,
  artifactTtlMs,
  minFreeDisk,
  modelListOverrides,
  readSettings,
  writeSettings,
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
  EXIT_CODES,
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
  NPM_UPGRADE_FEATURE,
  type RunnerFeature,
  type ToolInfo,
  type ToolLoad,
  type RunnerCapacity,
  type AgentTool,
} from '../protocol/index.ts';
import type { Installation } from '../lib/install.ts';
import { gcRunTemps } from './run-temp.ts';
import { gcWorkspaces, WorkspaceBusyError } from './checkout.ts';
import { prunePnpmStore } from './pnpm-store.ts';
import {
  collectWorkspaces,
  readDisk,
  workspaceDisk,
  lowOnDisk,
  type ReadDisk,
} from './workspaces.ts';
import { isDiskFull } from '../lib/disk-full.ts';
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
  protocolBehindMessage,
  RESTART_EXIT_CODE,
  updateDecision,
  type UpdateTarget,
} from './update.ts';
import { runnerCommandLine, runnerHost } from '../host.ts';
import { ToolCapabilitiesCache, detectTools } from './tool-capabilities.ts';
export { detectTools } from './tool-capabilities.ts';
import { reportedModels } from './model-list.ts';

/** The version this runner reports and compares updates with: the host package's (`host.ts`). */
export function runnerVersion(): string {
  return runnerHost().version;
}

/** What every runner of this version can do, before adapter features. */
export const BASE_FEATURES: readonly RunnerFeature[] = [
  'workspaceKey',
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
  // Repository credentials asked for whenever git needs one (agent/git-credentials.ts).
  'gitCredentials',
  // Code host CLI wrappers with the run's credential (agent/host-tools.ts).
  'gitTools',
  // Updates from the npm registry (`npmUpgrade` in heartbeat answers; update.ts).
  NPM_UPGRADE_FEATURE,
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
  timings?: Timings;
  log: (message: string) => void;
  /** Overrides the client built for a registration, by its key; for tests. */
  clients?: ReadonlyMap<string, ApiClient>;
  /** Replaces `prunePnpmStore`; for tests. */
  pruneStore?: typeof prunePnpmStore;
  /** Replace filesystem sampling in tests. */
  readDisk?: ReadDisk;
  /** Why an isolation configuration cannot be had here (isolation.ts); for tests. */
  isolationProblem?: (config: IsolationConfig) => Promise<string | undefined>;
  /** Interrupt agent runs and update when an application serves a newer runner; without it, notices are only logged. */
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
  heartbeatInFlight?: Promise<void>;
  capacity?: RunnerCapacity;
  capacitySource?: 'online' | 'legacyLocal';
  heartbeatHealthy?: boolean;
  capacityReportedAt?: string;
  /** The owner's local policy for this application, as last read (every heartbeat and claim reads it again). */
  policy?: PolicyReport;
  /** Detection is cached only for this application and refreshed when its effective variables change. */
  /**
   * What was detected for this application in the environment its runs get, by a digest of that environment: its
   * tools, and their model capabilities, refreshed in the background (`ToolCapabilitiesCache`).
   */
  detection?: {
    key: string;
    controller: AbortController;
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
  private wakeController = new AbortController();
  private readonly startedAt = new Date().toISOString();
  private snapshotWrite: Promise<void> = Promise.resolve();
  private readonly supervisor: Supervisor;
  private readonly stopping = new AbortController();
  private slotFreed: (() => void) | undefined;
  private gcTimer: NodeJS.Timeout | undefined;
  private lastCollect = 0;
  private collecting: Promise<void> | undefined;
  /** A collection waits for outstanding claims to finish before pruning the store; new claims wait meanwhile. */
  private holdingForPrune = false;
  private claimLoop: Promise<void> | undefined;
  private stopped: Promise<void> | undefined;
  /** Where the next round of claims starts, with several applications. */
  private nextApp = 0;
  /** A newer runner to install after interrupting agent runs and waiting for cleanup; claims pause meanwhile. */
  private pendingUpdate: { link: AppLink; target: UpdateTarget } | undefined;
  private updating = false;
  /** The shared pnpm store is being pruned; claiming pauses meanwhile. */
  private pruning = false;
  /** Claims remain active through policy checks and worker startup, so pruning cannot overlap a received lease. */
  private claimsInFlight = 0;
  private claimsDrained: (() => void) | undefined;
  private diskPaused = false;

  /** Working directories were removed since the store was last pruned. */
  private pruneDue = false;
  /** Failed pruning is retried at the next idle opportunity after this time. */
  private pruneRetryAt = 0;
  private readonly failedUpdates = new Map<string, number>();
  /** The newer server protocol each application was last reported to speak (`noticeProtocol`). */
  private readonly protocolNoticed = new Map<string, number>();
  /** The version the daemon installed before it stopped, if it did. */
  updatedTo: string | undefined;
  private revocationFailed = false;
  private readonly revocations = new Set<Promise<void>>();

  constructor(options: DaemonOptions) {
    this.options = options;
    this.links = options.connections.map((connection) => ({
      key: connection.registration.key,
      connection,
      client:
        options.clients?.get(connection.registration.key) ??
        runnerClient(connection),
      revoked: connection.registration.revoked !== undefined,
      upgradeRequired: false,
    }));
    this.timings = options.timings ?? {};
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

  /** Authentication stops permanently; an update asks the service to restart. */
  get exitCode(): number {
    if (this.revocationFailed) return EXIT_CODES.general;
    if (this.live.length === 0) return EXIT_CODES.auth;
    return this.updatedTo === undefined ? 0 : RESTART_EXIT_CODE;
  }

  get activeRuns(): string[] {
    return [...this.supervisor.runs.keys()];
  }

  private held(link: AppLink, tool?: AgentTool): number {
    return [...this.supervisor.runs.values()].filter(
      (run) =>
        run.appKey === link.key && (tool === undefined || run.tool === tool),
    ).length;
  }

  private free(link: AppLink): number {
    return Math.max(0, (link.capacity?.slots ?? 0) - this.held(link));
  }

  private toolLimit(link: AppLink, tool: AgentTool): number {
    const capacity = link.capacity!;
    return Math.min(capacity.toolSlots[tool] ?? capacity.slots, capacity.slots);
  }

  toolRoom(link: AppLink): Partial<Record<AgentTool, number>> {
    return Object.fromEntries(
      Object.keys(link.capacity?.toolSlots ?? {}).map((tool) => [
        tool,
        Math.max(
          0,
          this.toolLimit(link, tool as AgentTool) -
            this.held(link, tool as AgentTool),
        ),
      ]),
    );
  }

  private wake(): void {
    this.slotFreed?.();
    this.wakeController.abort();
    this.wakeController = new AbortController();
  }

  private pause(ms: number): Promise<void> {
    return delay(
      ms,
      AbortSignal.any([this.stopping.signal, this.wakeController.signal]),
    );
  }

  private saveCapacity(): Promise<void> {
    const snapshot = {
      pid: process.pid,
      startedAt: this.startedAt,
      apps: Object.fromEntries(
        this.live.map((link) => [
          link.key,
          {
            ...link.capacity,
            toolSlots: Object.fromEntries(
              Object.keys(link.capacity?.toolSlots ?? {}).map((tool) => [
                tool,
                this.toolLimit(link, tool as AgentTool),
              ]),
            ),
            source: link.capacitySource,
            connected: link.heartbeatHealthy === true,
            reportedAt: link.capacityReportedAt,
          },
        ]),
      ),
    };
    this.snapshotWrite = this.snapshotWrite
      .catch(() => undefined)
      .then(() => writeJsonAtomic(this.options.paths.capacity, snapshot));
    return this.snapshotWrite;
  }

  private get live(): AppLink[] {
    return this.links.filter((link) => !link.revoked);
  }

  /** The applications that may hand this runner work. */
  private get claimable(): AppLink[] {
    return this.live.filter(
      (link) =>
        !link.upgradeRequired &&
        link.heartbeatHealthy === true &&
        link.capacity !== undefined,
    );
  }

  /** Records whether `link`'s application can work with this runner, logging each change. */
  private setUpgradeRequired(
    link: AppLink,
    required: boolean,
    message?: string,
  ): void {
    if (link.upgradeRequired === required) return;
    link.upgradeRequired = required;
    this.wake();
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
      startedAt: this.startedAt,
    } satisfies DaemonPid);
    if (this.live.length === 0) {
      await this.stop('RUNNER_REVOKED');
      return;
    }
    await installGitHooks(paths.hooksDir);
    log(
      'runner ' +
        this.options.settings.name +
        ' starting for ' +
        this.links
          .map(
            (link) =>
              (link.connection.registration.app.name || link.key) +
              ' (' +
              link.connection.registration.runnerId +
              ')',
          )
          .join(', ') +
        '; capacity is configured separately in each application',
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
    for (const link of this.live) {
      await this.heartbeat(link);
      if (this.stopping.signal.aborted) return;
      if (link.revoked) continue;
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
      this.wake();
      await Promise.allSettled(
        this.links.map(async (link) => {
          link.detection?.controller.abort();
          await (await link.detection?.capabilities)?.stop();
        }),
      );
      this.slotFreed?.();
      for (const link of this.links)
        if (link.heartbeatTimer !== undefined)
          clearInterval(link.heartbeatTimer);
      if (this.gcTimer !== undefined) clearInterval(this.gcTimer);
      await this.claimLoop?.catch(() => undefined);
      await Promise.all(this.revocations);
      await this.supervisor.stopAll();
      await Promise.allSettled(
        this.links.flatMap((link) =>
          link.heartbeatInFlight ? [link.heartbeatInFlight] : [],
        ),
      );
      await this.snapshotWrite.catch(() => undefined);
      await this.collecting;
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
      previous?.controller.abort();
      const controller = new AbortController();
      const adaptersFor = () =>
        this.options.adaptersFor?.(process.env, passEnv, localVariables) ??
        this.options.adapters;
      const tools = detectTools(adaptersFor(), controller.signal);
      link.detection = {
        key,
        controller,
        tools,
        capabilities: tools.then(
          (detected) => new ToolCapabilitiesCache(adaptersFor, detected),
        ),
      };
      if (previous !== undefined)
        void previous.capabilities.then((cache) => cache.stop());
    }
    const detection = link.detection;
    const capabilities = await detection.capabilities;
    if (this.stopping.signal.aborted) return { variables: [], tools: [] };
    if (link.detection !== detection) return this.environmentOf(link);
    capabilities.refresh();
    return {
      variables: providedNames(process.env, passEnv, localVariables),
      tools: capabilities.tools.map((tool) =>
        reportedModels(tool, modelListOverrides(settings.models)[tool.kind]),
      ),
    };
  }

  /** How long after a collection the next one starts: `WORKSPACE_REPORT_INTERVAL_MS`, or sooner when an application asks. */
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
      const { paths, log } = this.options;
      const startedAt = Date.now();
      log('gc: collection started');
      try {
        while (this.claimsInFlight > 0) await delay(20, this.stopping.signal);
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
          decisionApps: new Set(
            this.live
              .filter((link) => link.workspaceReporting?.decisions === true)
              .map((link) => link.key),
          ),
          log,
          threshold: minFreeDisk(settings),
          ...(this.options.readDisk ? { readDisk: this.options.readDisk } : {}),
          artifacts: {
            ttlMs: artifactTtlMs(settings),
            patterns: artifactPatterns(settings),
          },
        });
        await gcRunTemps(paths, true);
        this.diskPaused = collected.low;
        if (
          collected.removed.length > 0 ||
          collected.artifactsCleaned.length > 0
        )
          this.pruneDue = true;
        // Retention runs after artifact-first collection, and cannot continue pressure deletion after recovery.
        if (!collected.low && !collected.pressure) {
          const expired = await gcWorkspaces({ paths, log });
          if (expired.length > 0) this.pruneDue = true;
        }
      } catch (error) {
        log(`gc: ${error instanceof Error ? error.message : String(error)}`);
        const settings = await readSettings(paths).catch(
          () => this.options.settings,
        );
        this.diskPaused = lowOnDisk(
          await (this.options.readDisk ?? readDisk)(paths.workRoot).catch(
            () => undefined,
          ),
          minFreeDisk(settings),
        );
      }
      try {
        await this.pruneAfterCollection();
      } finally {
        this.lastCollect = Date.now();
        log(`gc: collection finished in ${this.lastCollect - startedAt} ms`);
        this.collecting = undefined;
        // Space it recovered may let claims resume.
        this.slotFreed?.();
      }
    })();
    return this.collecting;
  }

  /** Prunes a due store once outstanding claims have started their workers, holding new claims only for that. */
  private async pruneAfterCollection(): Promise<void> {
    if (
      !this.pruneDue ||
      this.supervisor.size > 0 ||
      Date.now() < this.pruneRetryAt
    )
      return;
    this.holdingForPrune = true;
    try {
      if (this.claimsInFlight > 0)
        await new Promise<void>((resolve) => {
          this.claimsDrained = resolve;
        });
      await this.pruneStore();
    } finally {
      this.holdingForPrune = false;
      this.slotFreed?.();
    }
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
  private async revoke(
    link: AppLink,
    code: string,
    message: string,
  ): Promise<void> {
    if (link.revoked) return;
    link.revoked = true;
    if (link.heartbeatTimer !== undefined) clearInterval(link.heartbeatTimer);
    this.options.log(`${link.key}: ${code}: ${message}`);
    const saving = markRevoked(
      link.connection.registration,
      code as RevocationReason,
      this.options.paths,
    ).catch((error: unknown) => {
      this.revocationFailed = true;
      this.options.log(
        `${link.key}: failed to save revocation: ${String(error)}`,
      );
    });
    this.revocations.add(saving);
    await saving;
    this.revocations.delete(saving);
    if (this.live.length === 0) void this.stop(code);
  }

  heartbeat(link: AppLink): Promise<void> {
    link.heartbeatInFlight ??= this.sendHeartbeat(link).finally(() => {
      link.heartbeatInFlight = undefined;
    });
    return link.heartbeatInFlight;
  }

  private async sendHeartbeat(link: AppLink): Promise<void> {
    if (this.stopping.signal.aborted || link.revoked) return;
    const { log } = this.options;
    let capacityChanged = false;
    const held = [...this.supervisor.runs.values()].filter(
      (run) => run.appKey === link.key,
    );
    const runs = held.filter((run) => run.jobId === undefined);
    const jobs = held.filter((run) => run.jobId !== undefined);
    try {
      const settings = await readSettings(this.options.paths);
      const sampledDisk = await (this.options.readDisk ?? readDisk)(
        this.options.paths.workRoot,
      );
      const paused = lowOnDisk(sampledDisk, minFreeDisk(settings));
      const newlyPaused = !this.diskPaused && paused;
      if (this.diskPaused && !paused) this.slotFreed?.();
      this.diskPaused = paused;
      // Reclaim once when heartbeats discover pressure; persistent pressure uses the regular GC interval.
      if (newlyPaused) void this.collectGarbage();
      const disk =
        sampledDisk === undefined
          ? null
          : workspaceDisk(sampledDisk, minFreeDisk(settings));
      const policy = await this.policyOf(link);
      const { variables, tools } = await this.environmentOf(link);
      const response = await link.client.post(
        RUNNER_ROUTES.heartbeat,
        {
          disk,
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
            ...(this.pendingUpdate
              ? { draining: 'updatePending' as const }
              : this.pruning
                ? { draining: 'pruning' as const }
                : this.diskPaused
                  ? { draining: 'diskLow' as const }
                  : {}),
            slots: link.capacity?.slots ?? 0,
            ...(link.capacitySource
              ? { capacitySource: link.capacitySource }
              : {}),
            free:
              this.pendingUpdate || this.pruning || this.diskPaused
                ? 0
                : this.free(link),
            ...(Object.keys(link.capacity?.toolSlots ?? {}).length > 0
              ? {
                  tools: Object.fromEntries(
                    Object.entries(this.toolRoom(link)).map(([tool, free]) => [
                      tool,
                      {
                        slots: this.toolLimit(link, tool as AgentTool),
                        free:
                          this.pendingUpdate || this.pruning || this.diskPaused
                            ? 0
                            : free,
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
      const capacity = response.capacity ??
        link.capacity ?? {
          slots: this.options.settings.slots ?? 4,
          toolSlots: this.options.settings.toolSlots ?? {},
        };
      const source =
        response.capacity !== undefined || link.capacitySource === 'online'
          ? 'online'
          : 'legacyLocal';
      capacityChanged =
        JSON.stringify(link.capacity) !== JSON.stringify(capacity) ||
        link.capacitySource !== source;
      if (!link.heartbeatHealthy) this.wake();
      link.heartbeatHealthy = true;
      link.capacityReportedAt = new Date().toISOString();
      link.capacity = capacity;
      link.capacitySource = source;
      if (capacityChanged) {
        this.wake();
      }
      if (
        this.live.every((app) => app.capacitySource === 'online') &&
        (settings.slots !== undefined || settings.toolSlots !== undefined)
      ) {
        const currentSettings = await readSettings(this.options.paths);
        delete currentSettings.slots;
        delete currentSettings.toolSlots;
        await writeSettings(currentSettings, this.options.paths);
      }
      this.setUpgradeRequired(
        link,
        response.compatibility !== undefined,
        response.compatibility?.message,
      );
      link.workspaceReporting = response.workspaces;
      const { upgrade, npmUpgrade } = response;
      if (upgrade !== undefined)
        this.noticeUpgrade(
          link,
          upgrade,
          upgrade.sha256 === undefined
            ? undefined
            : {
                version: upgrade.latestVersion,
                url: upgrade.downloadUrl,
                sha256: upgrade.sha256,
              },
        );
      else if (npmUpgrade !== undefined)
        this.noticeUpgrade(link, npmUpgrade, {
          kind: 'npm',
          version: npmUpgrade.latestVersion,
          package: npmUpgrade.package,
        });
      this.noticeProtocol(
        link,
        response.protocolVersion,
        (upgrade ?? npmUpgrade)?.latestVersion,
      );
      for (const runId of response.cancelRequested)
        void this.supervisor.enforceCancel(runId);
      for (const runId of response.release) void this.supervisor.release(runId);
      for (const jobId of response.jobs?.cancelRequested ?? [])
        void this.supervisor.enforceCancel(jobRecordKey(jobId));
      for (const jobId of response.jobs?.release ?? [])
        void this.supervisor.release(jobRecordKey(jobId));
    } catch (error) {
      link.heartbeatHealthy = false;
      this.wake();
      if (error instanceof ApiError && REVOKED.has(error.reason)) {
        await this.revoke(link, error.reason, error.message);
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
    await this.saveCapacity().catch((error: unknown) =>
      log('Could not save capacity status: ' + String(error)),
    );
    if (capacityChanged && !this.stopping.signal.aborted && !link.revoked)
      await this.sendHeartbeat(link);
  }

  /**
   * A newer runner a heartbeat answer names: a tarball (`upgrade`, installable once it carries its checksum) or an npm
   * package (`npmUpgrade`, for this runner's `npm` feature).
   */
  private noticeUpgrade(
    link: AppLink,
    upgrade: { latestVersion: string; reason: string },
    target: UpdateTarget | undefined,
  ): void {
    const { log, selfUpdate } = this.options;
    if (!isNewer(upgrade.latestVersion, runnerVersion())) return;
    if (
      selfUpdate === undefined ||
      target === undefined ||
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
      `${link.key}: updating to ${runnerHost().bin} ${upgrade.latestVersion}${target.kind === 'npm' ? ` (${target.package} from npm)` : ''}; interrupting agent runs and preserving local work`,
    );
    this.pendingUpdate = { link, target };
    this.slotFreed?.();
    void this.updateWhenIdle();
  }

  /**
   * Tells the owner, once per application and protocol, that the application speaks a newer protocol than this runner
   * while it offers no newer version: the versions may look the same, as with an application run from source, yet
   * runs that need the newer protocol are never handed here.
   */
  private noticeProtocol(
    link: AppLink,
    serverProtocol: number | undefined,
    offered: string | undefined,
  ): void {
    if (
      serverProtocol === undefined ||
      updateDecision({ running: runnerVersion(), offered, serverProtocol }) !==
        'protocol' ||
      this.protocolNoticed.get(link.key) === serverProtocol
    )
      return;
    this.protocolNoticed.set(link.key, serverProtocol);
    this.options.log(`${link.key}: ${protocolBehindMessage(serverProtocol)}`);
  }

  /** Interrupts agent runs, waits for their cleanup and background jobs, then installs and restarts. */
  private async updateWhenIdle(): Promise<void> {
    const pending = this.pendingUpdate;
    const { selfUpdate, log } = this.options;
    if (
      pending === undefined ||
      selfUpdate === undefined ||
      this.updating ||
      this.stopping.signal.aborted
    )
      return;
    this.updating = true;
    try {
      await Promise.all(this.live.map((app) => this.heartbeat(app)));
      const cancellations = new Map<string, Promise<void>>();
      const interruptAgents = (): void => {
        for (const run of this.supervisor.runs.values()) {
          if (run.jobId !== undefined || cancellations.has(run.runId)) continue;
          cancellations.set(
            run.runId,
            this.supervisor.enforceCancel(run.runId, true),
          );
        }
      };
      // Stop existing tools immediately, and include workers registered by outstanding claims.
      interruptAgents();
      while (this.claimsInFlight > 0 && !this.stopping.signal.aborted) {
        await delay(20, this.stopping.signal);
        interruptAgents();
      }
      interruptAgents();
      await Promise.all(cancellations.values());

      // Background jobs retain their existing completion semantics.
      if (this.supervisor.size > 0 || this.stopping.signal.aborted) return;
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
    if (
      !link.heartbeatHealthy ||
      link.revoked ||
      link.upgradeRequired ||
      this.pendingUpdate ||
      this.pruning ||
      this.holdingForPrune ||
      this.diskPaused ||
      this.stopping.signal.aborted
    )
      return 0;
    const settings = await readSettings(this.options.paths);
    const disk = await (this.options.readDisk ?? readDisk)(
      this.options.paths.workRoot,
    );
    if (
      this.holdingForPrune ||
      !link.heartbeatHealthy ||
      link.revoked ||
      link.upgradeRequired ||
      this.pendingUpdate ||
      this.pruning ||
      this.diskPaused ||
      this.stopping.signal.aborted
    )
      return 0;
    if (lowOnDisk(disk, minFreeDisk(settings))) {
      await this.collectGarbage();
      return 0;
    }
    this.claimsInFlight += 1;
    try {
      return await this.claimAndStart(
        link,
        Math.min(free, this.free(link)),
        wait,
      );
    } finally {
      this.claimsInFlight -= 1;
      if (this.claimsInFlight === 0) {
        this.claimsDrained?.();
        this.claimsDrained = undefined;
      }
      void this.pruneStore();
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
        ...(Object.keys(link.capacity?.toolSlots ?? {}).length > 0
          ? { tools: this.toolRoom(link) }
          : {}),
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
              reason: isDiskFull(error) ? 'runnerDiskFull' : 'startTimeout',
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
      const limit = link.capacity?.toolSlots[payload.tool.kind];
      if (
        limit !== undefined &&
        this.held(link, payload.tool.kind) >=
          this.toolLimit(link, payload.tool.kind)
      )
        this.options.log(
          `run ${payload.run.id}: ${payload.tool.kind} is over its limit of ${this.toolLimit(link, payload.tool.kind)}; ${link.key} does not apply limits per tool`,
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
              reason: isDiskFull(error)
                ? 'runnerDiskFull'
                : error instanceof WorkspaceBusyError &&
                    payload.run.acceptedFailures?.includes('workspaceBusy')
                  ? 'workspaceBusy'
                  : 'startTimeout',
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
        // No application has a usable heartbeat configuration; a successful heartbeat wakes this wait.
        await this.pause(fallback);
        continue;
      }
      if (
        live.every((link) => this.free(link) <= 0) ||
        this.pendingUpdate ||
        this.pruning ||
        this.holdingForPrune ||
        this.diskPaused
      ) {
        await new Promise<void>((resolve) => {
          this.slotFreed = resolve;
        });
        this.slotFreed = undefined;
        continue;
      }
      const single = live.length === 1;
      const wakeSignal = this.wakeController.signal;
      const startedAt = Date.now();
      let claimed = 0;
      for (let step = 0; step < live.length; step += 1) {
        if (this.stopping.signal.aborted) break;
        const link = live[(this.nextApp + step) % live.length];
        const free = this.free(link);
        if (free <= 0) continue;
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
            await this.revoke(link, error.reason, error.message);
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
          if (single) await this.pause(backoff(failures, 1_000, 15_000));
        }
      }
      if (
        wakeSignal.aborted ||
        claimed > 0 ||
        live.every((link) => this.free(link) <= 0)
      )
        continue;
      if (single) {
        const elapsed = Date.now() - startedAt;
        const pollTimeout =
          this.timings.pollTimeoutMs ??
          live[0].connection.registration.pollTimeoutMs;
        if (elapsed < Math.min(fallback, pollTimeout) / 2)
          await this.pause(fallback - elapsed);
      } else {
        await this.pause(
          failures > 0 ? backoff(failures, rotation, 15_000) : rotation,
        );
      }
    }
  }
}

// The context, step and error types of the preparation steps (index.ts).
import type {
  AgentTool,
  FailureReason,
  RunPayload,
} from '../../protocol/index.ts';
import type { SkillsPlacement } from '../adapters/types.ts';
import type { AppRegistration } from '../../lib/config.ts';
import type { RunnerPaths } from '../../lib/home.ts';
import type { ApiClient } from '../../lib/http.ts';
import type {
  PreparedDir,
  RepoAuthSource,
  WorkspaceLock,
} from '../../core/checkout.ts';
import type { GitRetryOptions } from '../../core/git-retry.ts';
import type { PlacedMount } from '../mounts.ts';
import type { SpoolEvent } from '../../core/events.ts';

/** What the steps share. Steps fill in the optional fields as they go. */
export interface PrepareContext {
  readonly payload: RunPayload;
  readonly paths: RunnerPaths;
  readonly registration: AppRegistration;
  readonly client: ApiClient;
  readonly tool: AgentTool;
  readonly log: (message: string) => void;
  /** Puts an event into the run's transcript. */
  readonly event: (event: SpoolEvent) => void;
  /** Called, last first, when the run ends, prepared or not. */
  readonly onRelease: (release: () => Promise<void>) => void;
  /** Where the run's repository credentials come from (`workspace.git`); absent without any. */
  readonly gitAuth?: RepoAuthSource;
  /** How git's network operations are retried (`git-retry.ts`); the defaults when absent. */
  readonly gitRetry?: GitRetryOptions;
  workspace?: WorkspaceLock;
  /** The run's working directories, the primary one first; empty when the run names none. */
  dirs: PreparedDir[];
  /** The directory holding the application's CLI, first on the agent's PATH. */
  binDir?: string;
  /** The application's CLI as installed: its executable or JavaScript entry, which the shim runs. */
  cliEntry?: string;
  credentialsFile?: string;
  skills?: SkillsPlacement;
  /** The run's mounts, as placed; absent without any. */
  mounts?: PlacedMount[];
}

export interface PrepareStep {
  /** Recorded as the run's phase while the step runs, and in its error event. */
  readonly name: string;
  /** Why the run failed when the step throws, unless the error says (`PrepareError`). */
  readonly failure: FailureReason;
  run(context: PrepareContext): Promise<void>;
}

/** A step's failure with its own reason, and what its error event records besides the step (`meta`). */
export class PrepareError extends Error {
  override name = 'PrepareError';
  readonly reason: FailureReason;
  readonly meta: Readonly<Record<string, unknown>>;

  constructor(
    reason: FailureReason,
    message: string,
    meta: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
    this.reason = reason;
    this.meta = meta;
  }
}

/**
 * What the agent writes besides `cwd`, for a tool's own sandbox (`AdapterSession.writableRoots`): the other working
 * directories, each checkout's own Git directory (`.git` inside new clones, or `<cache>/worktrees/<name>` for legacy
 * worktrees), which holds its index, HEAD and submodules, and `shared`, the directories every run on the machine
 * writes, such as the pnpm store (core/pnpm-store.ts). Never the shared repository cache itself.
 * The explicit clone .git root also permits local hooks/config; host-side Git treats both as untrusted (task-git.ts).
 */
export function agentWritableRoots(
  dirs: readonly PreparedDir[],
  cwd: string,
  shared: readonly string[] = [],
): string[] {
  const roots = [
    ...dirs.flatMap((dir) => [
      dir.dir,
      ...(dir.repo === undefined ? [] : [dir.repo.gitDir]),
    ]),
    ...shared,
  ];
  return [...new Set(roots)].filter((root) => root !== cwd);
}

/** The working directory the agent starts in: the primary one, or the subject's work directory without any. */
export function agentCwd(context: PrepareContext): string {
  const primary = context.dirs[0];
  if (primary !== undefined) return primary.dir;
  if (context.workspace === undefined)
    throw new Error('The workspace was not prepared.');
  return context.workspace.workDir;
}

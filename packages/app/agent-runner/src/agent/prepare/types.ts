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
import type { PreparedDir, WorkspaceLock } from '../../core/checkout.ts';
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

/** A step's failure with its own reason. */
export class PrepareError extends Error {
  override name = 'PrepareError';
  readonly reason: FailureReason;

  constructor(reason: FailureReason, message: string) {
    super(message);
    this.reason = reason;
  }
}

/** The working directory the agent starts in: the primary one, or the subject's work directory without any. */
export function agentCwd(context: PrepareContext): string {
  const primary = context.dirs[0];
  if (primary !== undefined) return primary.dir;
  if (context.workspace === undefined)
    throw new Error('The workspace was not prepared.');
  return context.workspace.workDir;
}

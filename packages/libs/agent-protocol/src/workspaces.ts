/**
 * The runner's working directories, reported to the application so it can say which of them are no longer needed
 * (`RUNNER_ROUTES.workspaces`).
 *
 * A runner keeps one long-lived working directory per subject. It cannot tell on its own when the work there is over:
 * a branch merged with a squash is not in the default branch's history, and a subject may be reopened. So it reports
 * each directory with the last run that worked in it, and the application, which knows the run's subject, answers
 * which of those runs belong to subjects whose work has ended. The runner removes those directories, unless they hold
 * something that was never pushed, and the application keeps what the runner reported to show how much space they
 * take.
 *
 * Added within protocol 7 as a capability rather than a version: an application that accepts reports says so in every
 * heartbeat answer (`HeartbeatResponse.workspaces`), and a runner reports only to an application that does. A runner
 * that does not know reports ignores the field, and one that sees no such field keeps its local retention rules only.
 */
import { z } from 'zod';

/** How often a runner reports its working directories, unless the application asks for another interval. */
export const WORKSPACE_REPORT_INTERVAL_MS: number = 10 * 60_000;

/** The most working directories one report may carry. */
export const MAX_WORKSPACES_PER_REPORT: number = 1000;

/** One working directory on the runner, as the last run in it left it. */
export interface WorkspaceReport {
  /** The last run that worked in the directory. */
  readonly runId: string;
  /** Where the directory is on the runner, absolute. */
  readonly workDir: string;
  /** What the directory takes on disk, as last measured. */
  readonly sizeBytes: number;
  /**
   * The directory holds work that is not on the remote: changes not committed, or commits the remote task branch does
   * not have. Such a directory is never removed on the application's word.
   */
  readonly unpushed: boolean;
  /** When a run last used it, RFC 3339. */
  readonly lastUsedAt: string;
}

export const WorkspaceReportSchema: z.ZodType<WorkspaceReport> = z.object({
  runId: z.string().min(1).max(64),
  workDir: z.string().min(1).max(4096),
  sizeBytes: z.number().int().nonnegative(),
  unpushed: z.boolean(),
  lastUsedAt: z.string().max(64),
});

/** `POST RUNNER_ROUTES.workspaces`: the runner's working directories for this application. */
export interface WorkspacesRequest {
  /** Every working directory the runner keeps for this application; empty when it keeps none. */
  readonly workspaces: readonly WorkspaceReport[];
  /** The total size the runner's owner allows its working directories (across every application); absent for no limit. */
  readonly limitBytes?: number;
  /** What every working directory takes, across every application the runner serves. */
  readonly totalBytes?: number;
}

export const WorkspacesRequestSchema: z.ZodType<WorkspacesRequest> = z.object({
  workspaces: z.array(WorkspaceReportSchema).max(MAX_WORKSPACES_PER_REPORT),
  limitBytes: z.number().int().positive().optional(),
  totalBytes: z.number().int().nonnegative().optional(),
});

export interface WorkspacesResponse {
  /**
   * Runs among the reported ones whose subject's work has ended: their directories may be removed. A run the
   * application does not know, that another runner holds, or whose subject cannot say, is in neither list.
   */
  readonly remove: readonly string[];
  /** Runs among the reported ones whose subject's work goes on: keep their directories. */
  readonly keep: readonly string[];
}

export const WorkspacesResponseSchema: z.ZodType<WorkspacesResponse> = z.object(
  {
    remove: z.array(z.string()),
    keep: z.array(z.string()),
  },
);

/** In a heartbeat answer: the application accepts workspace reports, at this interval. */
export interface WorkspaceReporting {
  readonly intervalMs: number;
}

export const WorkspaceReportingSchema: z.ZodType<WorkspaceReporting> = z.object(
  {
    intervalMs: z.number().int().positive(),
  },
);

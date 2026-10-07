/**
 * Sub-issues and dependencies. An issue may wait for others: `blockedBy` holds it until the other is finished (in a
 * done or closed status of its own workflow), `relatedTo` only links the two. Sub-issues with a stage form batches: a
 * sub-issue waits until every sibling of a lower stage is finished.
 */
import type { Executor, StatusDefinition } from './issues.js';

export type DependencyType = 'blockedBy' | 'relatedTo';
export const DEPENDENCY_TYPES: readonly DependencyType[] = [
  'blockedBy',
  'relatedTo',
];

export const STAGE_MAX = 1000;
/** How far a chain of issues waiting for each other may reach. */
export const DEPENDENCY_DEPTH_MAX = 100;
/** How many issues one cycle check may visit. */
export const DEPENDENCY_NODES_MAX = 5000;
export const BLOCKED_BY_ON_CREATE_MAX = 50;

export interface IssueDependency {
  readonly dependencyId: string;
  /** The issue on the other side. */
  readonly issueId: string;
  readonly identifier: string;
  readonly title: string;
  /** That issue's current status, from its own workflow (it may be in another project). */
  readonly status: StatusDefinition;
  readonly type: DependencyType;
}

/** An issue that holds another: one it is `blockedBy` (`dependency`), or a sibling of an earlier stage (`stage`). */
export interface Blocker {
  readonly issueId: string;
  readonly identifier: string;
  readonly title: string;
  readonly status: StatusDefinition;
  readonly reason: 'dependency' | 'stage';
}

export interface SubtaskSummary {
  readonly id: string;
  readonly identifier: string;
  readonly title: string;
  readonly status: StatusDefinition;
  readonly stage: number | null;
  readonly executor: Executor | null;
  readonly executorName: string | null;
  /** Unfinished issues it waits for. */
  readonly blockedCount: number;
  /** Finished, by its own workflow. */
  readonly terminal: boolean;
}

/**
 * `POST /api/projects/issues/{issueId}/dependencies`, and `POST /api/projects/issues/{issueId}/removeDependency`,
 * which removes the link to that issue.
 */
export interface AddDependencyRequest {
  /** An id or identifier. */
  readonly dependsOnIssueId: string;
  /** `blockedBy` when left out. */
  readonly type?: DependencyType;
}

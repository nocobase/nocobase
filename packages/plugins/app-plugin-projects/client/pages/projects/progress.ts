import type { StatusDefinition } from '../../../shared/issues.js';
import {
  PROJECT_STATUSES,
  type IssueCounts,
  type ProjectStatus,
} from '../../../shared/projects.js';
import type { PmTone } from '../../components/pm-tones.js';
import { statusCategory } from '../../lib/status.js';

export function isProjectStatus(value: unknown): value is ProjectStatus {
  return PROJECT_STATUSES.includes(value as ProjectStatus);
}

/** Project statuses in the issue tones. */
const PROJECT_STATUS_TONE: Readonly<Record<ProjectStatus, PmTone>> = {
  planned: 'grey',
  in_progress: 'blue',
  paused: 'amber',
  completed: 'green',
  cancelled: 'slate',
};

/** A project status's tone, the same hues as issue statuses. */
export function projectStatusTone(status: ProjectStatus): PmTone {
  return PROJECT_STATUS_TONE[status];
}

/** The locale key suffix of a project status (`in_progress` → `inProgress`). */
export function projectStatusSuffix(status: ProjectStatus): string {
  return status.replace(/_([a-z])/gu, (_, letter: string) =>
    letter.toUpperCase(),
  );
}

export interface ProjectProgress {
  readonly done: number;
  readonly total: number;
  /** 0–100, rounded down so a nearly finished project does not read as complete. */
  readonly percent: number;
}

/** Progress from `issueCounts`: `done` counts issues in a done-category status, out of every issue. */
export function progressFromCounts(
  counts: IssueCounts | undefined,
): ProjectProgress {
  const total = Math.max(0, counts?.total ?? 0);
  const done = Math.min(Math.max(0, counts?.done ?? 0), total);
  return {
    done,
    total,
    percent: total === 0 ? 0 : Math.floor((done / total) * 100),
  };
}

export interface ProjectNumbers {
  readonly total: number;
  readonly started: number;
  readonly review: number;
  readonly done: number;
}

/** The key numbers of a project from its per-status counts. */
export function projectNumbers(
  byStatus: Readonly<Record<string, number>>,
  statuses: readonly StatusDefinition[] | undefined,
): ProjectNumbers {
  let total = 0;
  let started = 0;
  let review = 0;
  let done = 0;
  for (const [key, count] of Object.entries(byStatus)) {
    total += count;
    const category = statusCategory(statuses, key);
    if (key === 'in_review') review += count;
    else if (category === 'started') started += count;
    if (category === 'done') done += count;
  }
  return { total, started, review, done };
}

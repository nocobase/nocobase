/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { JsTemplateCreateJobStatus, JsTemplateCreateJobSummary, JsTemplateProject } from '../../../shared/types';
import type { JsTemplateProjectLifecycleFilter } from './types';

export function isActiveCreateJobStatus(status: JsTemplateCreateJobStatus | undefined): boolean {
  return status === 'pending' || status === 'running';
}

export function isTerminalCreateJobStatus(status: JsTemplateCreateJobStatus): boolean {
  return status === 'succeeded' || status === 'failed';
}

export function selectVisibleCreationJobs(
  jobs: JsTemplateCreateJobSummary[],
  terminalLimit = 3,
): JsTemplateCreateJobSummary[] {
  const visibleTerminalJobIds = new Set(
    jobs
      .filter((job) => isTerminalCreateJobStatus(job.status))
      .slice(0, Math.max(0, terminalLimit))
      .map((job) => job.id),
  );

  return jobs.filter((job) => !isTerminalCreateJobStatus(job.status) || visibleTerminalJobIds.has(job.id));
}

export function collectCreateJobTransitions(
  previousStatuses: ReadonlyMap<string, JsTemplateCreateJobStatus> | null,
  currentJobs: JsTemplateCreateJobSummary[],
): {
  transitionedJobs: JsTemplateCreateJobSummary[];
  nextStatuses: Map<string, JsTemplateCreateJobStatus>;
} {
  const transitionedJobs = previousStatuses
    ? currentJobs.filter(
        (job) => isActiveCreateJobStatus(previousStatuses.get(job.id)) && isTerminalCreateJobStatus(job.status),
      )
    : [];

  return {
    transitionedJobs,
    nextStatuses: new Map(currentJobs.map((job) => [job.id, job.status])),
  };
}

export function retainVisibleProjectSelection<SelectionKey>(
  selectedKeys: SelectionKey[],
  visibleProjectIds: Iterable<string>,
): SelectionKey[] {
  const visibleProjectIdSet = new Set<string>(visibleProjectIds);
  return selectedKeys.filter((key) => typeof key === 'string' && visibleProjectIdSet.has(key));
}

export function matchesJsTemplateProjectSearch(
  project: JsTemplateProject,
  keyword: string,
  lifecycleFilter: JsTemplateProjectLifecycleFilter,
): boolean {
  if (lifecycleFilter !== 'all' && project.lifecycleStatus !== lifecycleFilter) {
    return false;
  }

  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) {
    return true;
  }

  return [project.name, project.title, project.description].some((value) =>
    String(value || '')
      .toLowerCase()
      .includes(normalizedKeyword),
  );
}

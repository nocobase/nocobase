/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  JsTemplateCreateJobStatus,
  JsTemplateCreateJobSummary,
  JsTemplateProject,
} from '../../../../shared/types';
import {
  collectCreateJobTransitions,
  isActiveCreateJobStatus,
  isTerminalCreateJobStatus,
  matchesJsTemplateProjectSearch,
  retainVisibleProjectSelection,
  selectVisibleCreationJobs,
} from '../logic';

describe('Source Project list logic', () => {
  it.each([
    ['pending', true, false],
    ['running', true, false],
    ['succeeded', false, true],
    ['failed', false, true],
  ] satisfies [JsTemplateCreateJobStatus, boolean, boolean][])(
    'classifies %s as active=%s and terminal=%s',
    (status, active, terminal) => {
      expect(isActiveCreateJobStatus(status)).toBe(active);
      expect(isTerminalCreateJobStatus(status)).toBe(terminal);
    },
  );

  it('baselines historical terminal jobs without reporting transitions', () => {
    const historicalJobs = [
      createJobSummary({ id: 'job_succeeded', status: 'succeeded' }),
      createJobSummary({ id: 'job_failed', status: 'failed' }),
    ];

    const result = collectCreateJobTransitions(null, historicalJobs);

    expect(result.transitionedJobs).toEqual([]);
    expect(result.nextStatuses).toEqual(
      new Map([
        ['job_succeeded', 'succeeded'],
        ['job_failed', 'failed'],
      ]),
    );
  });

  it.each([
    ['pending', 'succeeded'],
    ['pending', 'failed'],
    ['running', 'succeeded'],
    ['running', 'failed'],
  ] satisfies [JsTemplateCreateJobStatus, JsTemplateCreateJobStatus][])(
    'reports an observed %s to %s transition',
    (previousStatus, currentStatus) => {
      const currentJob = createJobSummary({ status: currentStatus });

      const result = collectCreateJobTransitions(new Map([[currentJob.id, previousStatus]]), [currentJob]);

      expect(result.transitionedJobs).toEqual([currentJob]);
      expect(result.nextStatuses).toEqual(new Map([[currentJob.id, currentStatus]]));
    },
  );

  it.each([
    ['succeeded', 'succeeded'],
    ['succeeded', 'failed'],
    ['failed', 'succeeded'],
    ['failed', 'failed'],
  ] satisfies [JsTemplateCreateJobStatus, JsTemplateCreateJobStatus][])(
    'does not report a repeated terminal transition from %s to %s',
    (previousStatus, currentStatus) => {
      const currentJob = createJobSummary({ status: currentStatus });

      expect(
        collectCreateJobTransitions(new Map([[currentJob.id, previousStatus]]), [currentJob]).transitionedJobs,
      ).toEqual([]);
    },
  );

  it('drops disappeared job IDs from the next status baseline', () => {
    const visibleJob = createJobSummary({ id: 'job_visible', status: 'running' });

    const result = collectCreateJobTransitions(
      new Map([
        ['job_disappeared', 'pending'],
        [visibleJob.id, 'pending'],
      ]),
      [visibleJob],
    );

    expect(result.transitionedJobs).toEqual([]);
    expect(result.nextStatuses).toEqual(new Map([[visibleJob.id, 'running']]));
    expect(result.nextStatuses.has('job_disappeared')).toBe(false);
  });

  it('keeps every active job and only the newest terminal jobs within the limit', () => {
    const jobs = [
      createJobSummary({ id: 'active_pending', status: 'pending' }),
      createJobSummary({ id: 'terminal_1', status: 'succeeded' }),
      createJobSummary({ id: 'active_running', status: 'running' }),
      createJobSummary({ id: 'terminal_2', status: 'failed' }),
      createJobSummary({ id: 'terminal_3', status: 'succeeded' }),
      createJobSummary({ id: 'terminal_4', status: 'failed' }),
    ];

    expect(selectVisibleCreationJobs(jobs).map((job) => job.id)).toEqual([
      'active_pending',
      'terminal_1',
      'active_running',
      'terminal_2',
      'terminal_3',
    ]);
    expect(selectVisibleCreationJobs(jobs, 1).map((job) => job.id)).toEqual([
      'active_pending',
      'terminal_1',
      'active_running',
    ]);
    expect(selectVisibleCreationJobs(jobs, 0).map((job) => job.id)).toEqual(['active_pending', 'active_running']);
  });

  it('matches normalized search fields together with the lifecycle filter', () => {
    const project = createProjectSummary();

    expect(matchesJsTemplateProjectSearch(project, ' SALES ', 'all')).toBe(true);
    expect(matchesJsTemplateProjectSearch(project, 'dashboard', 'enabled')).toBe(true);
    expect(matchesJsTemplateProjectSearch(project, 'widgets', 'disabled')).toBe(false);
    expect(matchesJsTemplateProjectSearch(project, 'missing', 'all')).toBe(false);
    expect(matchesJsTemplateProjectSearch({ ...project, title: null, description: null }, 'sales', 'all')).toBe(true);
    expect(matchesJsTemplateProjectSearch(project, '  ', 'enabled')).toBe(true);
  });

  it('retains selection only for visible project IDs without reordering it', () => {
    expect(retainVisibleProjectSelection(['project_2', 3, 'hidden', 'project_1'], ['project_1', 'project_2'])).toEqual([
      'project_2',
      'project_1',
    ]);
  });
});

function createJobSummary(overrides: Partial<JsTemplateCreateJobSummary> = {}): JsTemplateCreateJobSummary {
  return {
    id: 'job_demo',
    targetProjectId: 'project_demo',
    name: 'demo',
    title: 'Demo',
    description: null,
    sourceType: 'starter',
    status: 'pending',
    resultProjectId: null,
    errorCode: null,
    errorMessage: null,
    startedAt: null,
    finishedAt: null,
    createdAt: '2026-08-12T00:00:00.000Z',
    updatedAt: '2026-08-12T00:00:00.000Z',
    ...overrides,
  };
}

function createProjectSummary(): JsTemplateProject {
  return {
    id: 'project_sales',
    name: 'sales-widgets',
    normalizedName: 'sales-widgets',
    title: 'Sales widgets',
    description: 'Sales dashboard helpers',
    lifecycleStatus: 'enabled',
    healthStatus: 'ready',
    headCommitId: null,
  };
}

/* eslint-disable @eslint-react/no-unnecessary-use-prefix -- a stand-in for a module of hooks, under the names of the
   real ones whether or not the stand-in calls a hook */
import type * as Kit from '@nocobase/app-plugin-projects/client/kit';
import {
  createdTitle,
  planObjectLabel,
  refOf,
} from '@nocobase/app-plugin-projects/client/plan-model';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import type { Label } from '@nocobase/app-plugin-projects/shared/labels';
import type { Me } from '@nocobase/app-plugin-projects/shared/members';
import type {
  Plan,
  PlanUndoPreview,
} from '@nocobase/app-plugin-projects/shared/plans';
import type { UseQueryResult } from '@tanstack/react-query';
import { useState, useSyncExternalStore } from 'react';

import { VIEWER_ID, samplePlans } from './plan-data.js';

// The preview's stand-in for @nocobase/app-plugin-projects/client/kit, aliased in vite.config.ts: the plan-card block's
// hooks answer from plans kept in memory, and acting on one changes it at once. Every export is typed against the real
// one, so the block and this mock follow the plugin's contract. The plan as pure data is the real `client/plan-model`.

let plans = samplePlans();
const listeners = new Set<() => void>();
const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const put = (plan: Plan): Plan => {
  plans = new Map(plans).set(plan.id, plan);
  for (const listener of listeners) listener();
  return plan;
};

/** Puts the sample plans back as they were. */
export function resetPlanDemo(): void {
  plans = samplePlans();
  for (const listener of listeners) listener();
}

const settled = <T>(data: T | undefined): UseQueryResult<T> =>
  ({
    data,
    isError: false,
    isPending: data === undefined,
    error: null,
    refetch: () => Promise.resolve({ data }),
  }) as unknown as UseQueryResult<T>;

const hoursFromNow = (hours: number): string =>
  new Date(Date.now() + hours * 3_600_000).toISOString();

const viewer = {
  userId: VIEWER_ID,
  name: 'Ada Lovelace',
  permissions: { settings: {} },
  kinds: [],
} as unknown as Me;

const labels: Label[] = [
  { id: 'l-backend', name: 'backend', color: 'blue' },
  { id: 'l-frontend', name: 'frontend', color: 'purple' },
  { id: 'l-bug', name: 'bug', color: 'red' },
];

const lookup: Kit.PlanLookup = {
  members: [
    { userId: VIEWER_ID, name: 'Ada Lovelace', email: null },
    { userId: 'u-grace', name: 'Grace Hopper', email: null },
  ],
  labels,
  projects: [
    { id: 'p-acme', name: 'Acme' },
    { id: 'p-site', name: 'Website' },
  ] as unknown as Kit.PlanLookup['projects'],
  executors: [{ type: 'agent', id: 'coder', name: 'Coding agent' }],
};

const STATUSES = [
  { key: 'todo', name: 'Todo', category: 'unstarted', color: 'gray' },
  {
    key: 'in_progress',
    name: 'In progress',
    category: 'started',
    color: 'blue',
  },
  { key: 'in_review', name: 'In review', category: 'started', color: 'purple' },
  { key: 'done', name: 'Done', category: 'done', color: 'green' },
];

const ISSUES: Readonly<Record<string, IssueDetail>> = {
  'i-34': {
    id: 'i-34',
    identifier: 'PM-34',
    title: 'Mentions',
    statuses: STATUSES,
  } as unknown as IssueDetail,
};

const PRIORITY: Readonly<Record<string, string>> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  none: 'No priority',
};

export const executorOf: typeof Kit.executorOf = (value) => {
  const record = (value ?? {}) as Record<string, unknown>;
  return typeof record.type === 'string' && typeof record.id === 'string'
    ? { type: record.type, id: record.id }
    : null;
};

export const canUseSetting: typeof Kit.canUseSetting = () => true;
export const useViewer: typeof Kit.useViewer = () => viewer;
export const usePlanLookup: typeof Kit.usePlanLookup = () => lookup;

export const usePlanQuery: typeof Kit.usePlanQuery = (planId, initial) => {
  const current = useSyncExternalStore(subscribe, () => plans.get(planId));
  return settled(current ?? initial);
};

export const usePlanIssue: typeof Kit.usePlanIssue = (issueId) =>
  settled(issueId ? ISSUES[issueId] : undefined);

export const usePlanUndoPreview: typeof Kit.usePlanUndoPreview = (
  planId,
  enabled,
) => {
  const plan = useSyncExternalStore(subscribe, () => plans.get(planId));
  const preview: PlanUndoPreview | undefined =
    enabled && plan
      ? {
          planId,
          revert: plan.rows
            .filter((row) => row.result)
            .map((row) => ({
              rowId: row.id,
              position: row.position,
              op: row.op,
              target: row.result?.target ?? null,
              restore: row.check?.baseline?.fields ?? {
                statusKey: 'in_progress',
              },
            })),
          skipped: [],
        }
      : undefined;
  return settled(preview);
};

export const usePlanMutations: typeof Kit.usePlanMutations = () => {
  const [busy, setBusy] = useState(false);
  const after = <T>(work: () => T): Promise<T> => {
    setBusy(true);
    return new Promise((resolve) =>
      setTimeout(() => {
        setBusy(false);
        resolve(work());
      }, 400),
    );
  };
  return {
    busy,
    act: (action, plan) =>
      after(() => {
        const revision = plan.revision + 1;
        if (action === 'void')
          return put({
            ...plan,
            revision,
            status: 'voided',
            voidReason: 'person',
          });
        if (action === 'retry')
          return put({ ...plan, revision, status: 'pending', failure: null });
        return put({
          ...plan,
          revision,
          status: 'executed',
          executedAt: new Date().toISOString(),
          executedById: VIEWER_ID,
          undoableUntil: hoursFromNow(24),
          rows: plan.rows.map((row) => ({
            ...row,
            result: {
              target: row.check?.target ?? null,
              created:
                row.op === 'issue.create'
                  ? {
                      type: 'issue',
                      id: `new-${row.id}`,
                      identifier: `PM-${50 + row.position}`,
                      title: createdTitle(
                        row.params as Record<string, unknown>,
                      ),
                    }
                  : null,
              after: null,
              revision: 1,
              wakes: row.check?.wakes ?? [],
            },
          })),
        });
      }),
    edit: (plan, request) =>
      after(() => {
        const edits = new Map(request.rows.map((row) => [row.id, row]));
        return put({
          ...plan,
          revision: plan.revision + 1,
          rows: plan.rows
            .filter((row) => edits.get(row.id)?.remove !== true)
            .map((row) => {
              const params = edits.get(row.id)?.params;
              return params ? { ...row, params } : row;
            }),
        });
      }),
    undo: (plan) =>
      after(() =>
        put({
          ...plan,
          revision: plan.revision + 1,
          status: 'undone',
          undoableUntil: null,
        }),
      ),
  };
};

export const invalidRows: typeof Kit.invalidRows = () => null;
export const planErrorReason: typeof Kit.planErrorReason = () => null;

export const usePlanErrorText: typeof Kit.usePlanErrorText = () => ({
  request: (_error, fallback) => fallback ?? 'The request failed.',
  row: (error) => (error ? error.message || error.code : null),
});

export const usePlanWording: typeof Kit.usePlanWording = () => (plan) => ({
  title: plan.title,
  description: plan.description || null,
});

export const usePlanRowTitle: typeof Kit.usePlanRowTitle =
  () => (view, views) => {
    const { params, row } = view;
    const target = (value: unknown): string => {
      const ref = refOf(value);
      if (ref) {
        const created = views.find((other) => other.row.ref === ref);
        return (created && createdTitle(created.params)) || ref;
      }
      return (
        planObjectLabel(row.check?.baseline?.target ?? row.check?.target) ??
        (typeof value === 'string' ? value : 'An issue')
      );
    };
    if (row.op === 'issue.create' || row.op === 'project.create')
      return createdTitle(params) || 'Untitled';
    if (row.op === 'dependency')
      return `${target(params.issue)} waits for ${target(params.dependsOn)}`;
    return target(params.issue);
  };

/** A value as text: strings and numbers as they are, anything else as JSON. */
const plain = (value: unknown): string =>
  typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : (JSON.stringify(value) ?? '');

export const usePlanValueText: typeof Kit.usePlanValueText =
  (plansLookup) => (field, value, statuses) => {
    if (value === undefined || value === null || value === '') return '—';
    const person = (id: unknown): string =>
      plansLookup.members.find((member) => member.userId === id)?.name ??
      plain(id);
    switch (field) {
      case 'statusKey':
        return (
          (statuses ?? STATUSES).find((status) => status.key === value)?.name ??
          plain(value)
        );
      case 'priority':
        return PRIORITY[plain(value)] ?? plain(value);
      case 'ownerUserId':
        return person(value);
      case 'executor': {
        const executor = executorOf(value);
        if (!executor) return 'Unassigned';
        if (executor.type === 'user') return person(executor.id);
        return (
          plansLookup.executors.find((option) => option.id === executor.id)
            ?.name ?? executor.id
        );
      }
      case 'labelIds':
        return Array.isArray(value)
          ? value
              .map(
                (id) =>
                  plansLookup.labels.find((label) => label.id === id)?.name ??
                  plain(id),
              )
              .join(', ')
          : '—';
      case 'projectId':
        return refOf(value)
          ? 'The project created above'
          : (plansLookup.projects.find((project) => project.id === value)
              ?.name ?? plain(value));
      default:
        return plain(value);
    }
  };

export const useCreateLabel: typeof Kit.useCreateLabel = () => (name) => {
  const label: Label = { id: `l-${name}`, name, color: 'green' };
  labels.push(label);
  return Promise.resolve(label);
};

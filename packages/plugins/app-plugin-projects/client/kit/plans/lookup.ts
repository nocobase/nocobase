/**
 * What the card and the editor need to show ids as names and to offer choices: members, labels, projects and the
 * executors of other kinds, from the same cached lists the rest of the pages read.
 */
import { useTranslation } from '@nocobase/i18n/client';
import {
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useCallback } from 'react';

import { ACCESS_NAMESPACE } from '../../../shared/access.js';
import { COLORS, type Color } from '../../../shared/common.js';
import type {
  Executor,
  IssueDetail,
  StatusDefinition,
} from '../../../shared/issues.js';
import type { Label } from '../../../shared/labels.js';
import type { Member } from '../../../shared/members.js';
import type { ProjectListItem } from '../../../shared/projects.js';
import { pmKeys } from '../../api/keys.js';
import type { ExecutorOption } from '../../components/pm-executor-select.js';
import { usePmApi } from '../../hooks/use-pm-api.js';
import { statusName } from '../../lib/status.js';
import { useExecutorOptions } from '../../pages/issues/use-executor-options.js';
import { asRecord } from './model.js';

export interface PlanLookup {
  readonly members: readonly Member[];
  readonly labels: readonly Label[];
  readonly projects: readonly ProjectListItem[];
  readonly executors: readonly ExecutorOption[];
}

export function usePlanLookup(): PlanLookup {
  const api = usePmApi();
  const members = useQuery({
    queryKey: pmKeys.members,
    queryFn: () => api.members(),
  });
  const labels = useQuery({
    queryKey: pmKeys.labels,
    queryFn: () => api.labels(),
  });
  const projects = useQuery({
    queryKey: pmKeys.projects,
    queryFn: () => api.projects(),
  });
  return {
    members: members.data ?? [],
    labels: labels.data ?? [],
    projects: projects.data ?? [],
    executors: useExecutorOptions(),
  };
}

export function executorOf(value: unknown): Executor | null {
  const record = asRecord(value);
  return typeof record.type === 'string' && typeof record.id === 'string'
    ? { type: record.type, id: record.id }
    : null;
}

/** A value as text: strings and numbers as they are, anything else as JSON. */
function plain(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : (JSON.stringify(value) ?? '');
}

/**
 * Formats a field's value as the pages show it, in this plugin's words wherever it is rendered: names for ids,
 * translated priorities, and a status by its name in `statuses` (the target's workflow) when given.
 */
export function usePlanValueText(
  lookup: PlanLookup,
): (
  field: string,
  value: unknown,
  statuses?: readonly StatusDefinition[],
) => string {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const person = (id: unknown): string =>
    lookup.members.find((member) => member.userId === id)?.name ??
    (typeof id === 'string' ? id : '—');
  return (field, value, statuses) => {
    if (value === undefined || value === null || value === '') return '—';
    switch (field) {
      case 'statusKey':
        if (statuses && typeof value === 'string')
          return statusName(t, statuses, value);
        // Without the workflow at hand, a built-in status by its translated name, any other by its key.
        return t(`status.${plain(value)}`, { defaultValue: plain(value) });
      case 'priority':
        return t(`priority.${plain(value)}`, { defaultValue: plain(value) });
      case 'ownerUserId':
      case 'leadUserId':
        return person(value);
      case 'executor': {
        const executor = executorOf(value);
        if (!executor) return t('executor.none');
        if (executor.type === 'user') return person(executor.id);
        return (
          lookup.executors.find(
            (option) =>
              option.type === executor.type && option.id === executor.id,
          )?.name ?? executor.id
        );
      }
      case 'labelIds':
        return Array.isArray(value)
          ? value
              .map(
                (id) =>
                  lookup.labels.find((label) => label.id === id)?.name ??
                  plain(id),
              )
              .join(', ') || '—'
          : '—';
      case 'projectId': {
        const ref = asRecord(value).ref;
        if (typeof ref === 'string') return t('plans.newProject');
        return (
          lookup.projects.find((project) => project.id === value)?.name ??
          plain(value)
        );
      }
      case 'visibility':
        return t(`plans.visibility.${plain(value)}`, {
          defaultValue: plain(value),
        });
      default:
        return plain(value);
    }
  };
}

/**
 * An existing issue a plan names, from the cached issue detail the issue pages read: for its identifier and title, and
 * the statuses of its workflow. Disabled while `issueId` is null.
 */
export function usePlanIssue(
  issueId: string | null,
): UseQueryResult<IssueDetail> {
  const api = usePmApi();
  return useQuery({
    queryKey: pmKeys.issue(issueId ?? ''),
    queryFn: () => api.issue(issueId ?? ''),
    enabled: issueId !== null && issueId !== '',
    retry: false,
    staleTime: 30_000,
  });
}

/** A colour for a new label, spread over the palette by name so labels created in a row differ. */
function colorFor(name: string): Color {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length] ?? 'gray';
}

/** Creates a label by name (the caller may create labels: `pm.labels`), coloured by its name, and adds it to the cached list. */
export function useCreateLabel(): (name: string) => Promise<Label> {
  const api = usePmApi();
  const queryClient = useQueryClient();
  return useCallback(
    async (name) => {
      const label = await api.createLabel({ name, color: colorFor(name) });
      queryClient.setQueryData<Label[]>(pmKeys.labels, (current) => [
        ...(current ?? []),
        label,
      ]);
      void queryClient.invalidateQueries({ queryKey: pmKeys.labels });
      return label;
    },
    [api, queryClient],
  );
}

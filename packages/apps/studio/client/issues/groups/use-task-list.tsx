/**
 * The state the split view and the phone list share over one grouped read: the groups as shown (the task just handled
 * kept in place), folded groups, the selected task from the URL (`?issue=`, an id or a key), the order J and K step
 * through, following from a row, and the toast once the selected task stops waiting for the viewer, with "Undo" and
 * "Next waiting".
 */
import { useToaster } from '@nocobase/app-client';
import { pmKeys, usePmApi } from '@nocobase/app-plugin-projects/client/kit';
import type { IssueFilters } from '@nocobase/app-plugin-projects/client/issues';
import { useTranslation } from '@nocobase/i18n/client';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  TaskGroupId,
  TaskGroupItem,
  TaskGroups,
} from '../../../shared/task-groups.js';
import { useNotify } from '../../access/notify.js';
import { useFollowIssue } from '../../follow-ups/api.js';
import { useIssueAgentWork } from '../use-agent-work.js';
import { taskGroupKeys, useTaskGroups } from './api.js';
import {
  findItem,
  keepPlacement,
  listGroups,
  nextWaiting,
  placementOf,
  visibleOrder,
  type ListGroup,
  type Placement,
} from './model.js';
import { useFoldedGroups } from './prefs.js';

export interface TaskListState {
  readonly query: ReturnType<typeof useTaskGroups>;
  readonly data: TaskGroups | undefined;
  readonly groups: readonly ListGroup[];
  readonly isFolded: (group: TaskGroupId) => boolean;
  readonly toggleGroup: (group: TaskGroupId) => void;
  readonly order: readonly string[];
  readonly selected: TaskGroupItem | null;
  readonly selectedId: string | null;
  readonly select: (id: string | null) => void;
  readonly step: (delta: 1 | -1) => void;
  readonly toggleFollow: (item: TaskGroupItem) => void;
  readonly loadMore: (group: TaskGroupId) => void;
  /** The agent working on each task now, by issue id. */
  readonly working: ReadonlyMap<string, string>;
  readonly empty: boolean;
}

export function useTaskList({
  filters,
  follow,
  pageKey,
  selectedParam,
  onSelect,
  autoSelect = true,
}: {
  /** Selects the first task while none is (the split view); the phone starts on the list. */
  readonly autoSelect?: boolean;
  readonly filters: IssueFilters;
  readonly follow: 'all' | 'scope';
  /** The page the folded groups are remembered for. */
  readonly pageKey: string;
  /** `?issue=`: the selected task's id or key. */
  readonly selectedParam: string | null;
  /** Writes the selection to the URL, replacing the entry. */
  readonly onSelect: (id: string | null) => void;
}): TaskListState {
  const { t } = useTranslation();
  const notify = useNotify();
  const toaster = useToaster();
  const api = usePmApi();
  const client = useQueryClient();
  const [pages, setPages] = useState<Partial<Record<TaskGroupId, number>>>({});
  const query = useTaskGroups({ filters, mode: 'split', follow, pages });
  const folded = useFoldedGroups(pageKey);
  const [sticky, setSticky] = useState<Placement | null>(null);
  const raw = useMemo(() => listGroups(query.data?.groups ?? []), [query.data]);
  const groups = useMemo(() => keepPlacement(raw, sticky), [raw, sticky]);
  const order = useMemo(
    () => visibleOrder(groups, folded.isFolded),
    [groups, folded.isFolded],
  );
  const selected = findItem(groups, selectedParam);
  const selectedId = selected?.issue.id ?? null;
  // A task selected another way than from the list (the address, the toast's next task) keeps its place too.
  if (
    selectedId &&
    (sticky?.id !== selectedId || sticky.followed !== selected?.followed)
  ) {
    const placement = placementOf(groups, selectedId);
    // eslint-disable-next-line @eslint-react/set-state-in-effect -- Adjusts state while rendering a new selection, React's pattern for state derived from a changed prop; no effect runs here.
    if (placement) setSticky(placement);
  }

  const select = useCallback(
    (id: string | null) => {
      // The task handled before moves to its new group now; the newly selected one keeps its place from here.
      setSticky(id ? placementOf(groups, id) : null);
      onSelect(id);
    },
    [groups, onSelect],
  );

  // Nothing selected yet: the first task in the list.
  useEffect(() => {
    if (!autoSelect || !query.data || selectedParam) return;
    const first = order[0];
    if (first) onSelect(first);
  }, [autoSelect, query.data, selectedParam, order, onSelect]);

  const step = useCallback(
    (delta: 1 | -1) => {
      if (order.length === 0) return;
      const at = selectedId ? order.indexOf(selectedId) : -1;
      const next =
        at < 0
          ? order[0]
          : order[Math.min(order.length - 1, Math.max(0, at + delta))];
      if (next && next !== selectedId) select(next);
    },
    [order, selectedId, select],
  );

  const followIssue = useFollowIssue((error) =>
    notify.error(error, t('issueLive.follow.saveFailed')),
  );
  const toggleFollow = useCallback(
    (item: TaskGroupItem) =>
      followIssue.mutate({ issueId: item.issue.id, follow: !item.followed }),
    [followIssue],
  );

  const loadMore = useCallback(
    (group: TaskGroupId) =>
      setPages((current) => ({
        ...current,
        [group]: (current[group] ?? 1) + 1,
      })),
    [],
  );

  const issues = useMemo(
    () => groups.flatMap((group) => group.items.map((item) => item.issue)),
    [groups],
  );
  const agentIds = useIssueAgentWork(issues, JSON.stringify(filters));
  const working = useMemo(() => {
    const names = new Map<string, string>();
    for (const issue of issues)
      if (agentIds.has(issue.id))
        names.set(issue.id, issue.executorName ?? agentIds.get(issue.id)!);
    return names;
  }, [issues, agentIds]);

  // Once the selected task stops waiting for the viewer, say so, with the way back and the way to the next one.
  const previousRef = useRef<{
    readonly id: string;
    readonly waiting: boolean;
    readonly statusKey: string;
  } | null>(null);
  useEffect(() => {
    if (!selected) return;
    const before = previousRef.current;
    const now = {
      id: selected.issue.id,
      waiting: selected.waits.length > 0,
      statusKey: selected.issue.statusKey,
    };
    previousRef.current = now;
    if (!before || before.id !== now.id || !before.waiting || now.waiting)
      return;
    const issue = selected.issue;
    const next = nextWaiting(groups, issue.id);
    const undo =
      before.statusKey !== now.statusKey
        ? async () => {
            const current = await api.issue(issue.id);
            await api.updateIssue(issue.id, {
              revision: current.revision,
              statusKey: before.statusKey,
            });
            await Promise.all([
              client.invalidateQueries({ queryKey: pmKeys.issue(issue.id) }),
              client.invalidateQueries({ queryKey: taskGroupKeys.all }),
            ]);
            toaster.show({
              type: 'success',
              title: t('taskGroups.toast.undone', {
                identifier: issue.identifier,
              }),
            });
          }
        : null;
    const id = toaster.show({
      type: 'success',
      title: t('taskGroups.toast.handled', { identifier: issue.identifier }),
      description: undo ? (
        <button
          type='button'
          className='text-sm font-medium underline underline-offset-2'
          data-testid='task-toast-undo'
          onClick={() => {
            toaster.close(id);
            void undo().catch((error: unknown) => notify.error(error));
          }}
        >
          {t('taskGroups.toast.undo')}
        </button>
      ) : next ? undefined : (
        t('taskGroups.toast.allDone')
      ),
      duration: next ? 8000 : 4000,
      ...(next
        ? {
            action: {
              label: t('taskGroups.toast.next', {
                identifier: next.issue.identifier,
              }),
              onClick: () => select(next.issue.id),
            },
          }
        : {}),
    });
  }, [selected, groups, api, client, toaster, notify, t, select]);

  return {
    query,
    data: query.data,
    groups,
    isFolded: folded.isFolded,
    toggleGroup: folded.toggle,
    order,
    selected,
    selectedId,
    select,
    step,
    toggleFollow,
    loadMore,
    working,
    empty:
      Boolean(query.data) && raw.every((group) => group.items.length === 0),
  };
}

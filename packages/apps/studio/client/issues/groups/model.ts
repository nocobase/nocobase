/**
 * The split list as the person sees it, worked out from a grouped read (`TaskGroups`): the task they just handled
 * keeps its place until they move on, the order J and K step through, and the next task waiting for them.
 */
import type {
  TaskGroupId,
  TaskGroupItem,
  TaskGroupPage,
} from '../../../shared/task-groups.js';

export interface ListGroup {
  readonly group: TaskGroupId;
  readonly count: number;
  readonly items: readonly TaskGroupItem[];
  readonly nextCursor: string | null;
}

/** Where a task was shown: its group and its place in it. */
export interface Placement {
  readonly id: string;
  readonly group: TaskGroupId;
  readonly index: number;
}

export function listGroups(pages: readonly TaskGroupPage[]): ListGroup[] {
  return pages.map((page) => ({
    group: page.group,
    count: page.count,
    items: page.data,
    nextCursor: page.nextCursor,
  }));
}

export function placementOf(
  groups: readonly ListGroup[],
  id: string,
): Placement | null {
  for (const group of groups) {
    const index = group.items.findIndex((item) => item.issue.id === id);
    if (index >= 0) return { id, group: group.group, index };
  }
  return null;
}

/**
 * The groups with the task at `sticky` kept where it was shown, so the list does not jump under the person's eyes
 * once they handle it; it moves to its new group when they select another task. A task the read no longer lists stays
 * out. Counts stay the server's.
 */
export function keepPlacement(
  groups: readonly ListGroup[],
  sticky: Placement | null,
): ListGroup[] {
  if (!sticky) return [...groups];
  const now = placementOf(groups, sticky.id);
  // Following or unfollowing moves it at once: the person asked for exactly that.
  if (
    !now ||
    now.group === sticky.group ||
    now.group === 'follow' ||
    sticky.group === 'follow'
  )
    return [...groups];
  const item = groups
    .find((group) => group.group === now.group)!
    .items.find((entry) => entry.issue.id === sticky.id)!;
  const result = groups.map((group) =>
    group.group === now.group
      ? {
          ...group,
          items: group.items.filter((entry) => entry.issue.id !== sticky.id),
        }
      : group,
  );
  const target = result.find((group) => group.group === sticky.group);
  if (target) {
    const items = [...target.items];
    items.splice(Math.min(sticky.index, items.length), 0, item);
    return result.map((group) =>
      group.group === sticky.group ? { ...group, items } : group,
    );
  }
  // Its group has nothing else left: show it again in its old place in the group order.
  return [
    ...result,
    { group: sticky.group, count: 0, items: [item], nextCursor: null },
  ].sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group));
}

const GROUP_ORDER: readonly TaskGroupId[] = [
  'follow',
  'wait',
  'doing',
  'review',
  'blocked',
  'backlog',
  'done',
  'cancelled',
];

/** The ids in the order the list shows them, folded groups left out, each once. */
export function visibleOrder(
  groups: readonly ListGroup[],
  isFolded: (group: TaskGroupId) => boolean,
): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const group of groups) {
    if (isFolded(group.group)) continue;
    for (const item of group.items)
      if (!seen.has(item.issue.id)) {
        seen.add(item.issue.id);
        ids.push(item.issue.id);
      }
  }
  return ids;
}

/** The first task after `fromId` in the list that waits for the viewer, else the first one before it. */
export function nextWaiting(
  groups: readonly ListGroup[],
  fromId: string | null,
): TaskGroupItem | null {
  const all = groups.flatMap((group) => group.items);
  const waiting = (item: TaskGroupItem) =>
    item.waits.length > 0 && item.issue.id !== fromId;
  const at = fromId ? all.findIndex((item) => item.issue.id === fromId) : -1;
  return (
    all.slice(at + 1).find(waiting) ??
    all.slice(0, Math.max(at, 0)).find(waiting) ??
    null
  );
}

/** The task with `id` among the groups. */
export function findItem(
  groups: readonly ListGroup[],
  id: string | null,
): TaskGroupItem | null {
  if (!id) return null;
  for (const group of groups) {
    const item = group.items.find(
      (entry) => entry.issue.id === id || entry.issue.identifier === id,
    );
    if (item) return item;
  }
  return null;
}

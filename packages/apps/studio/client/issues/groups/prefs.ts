/**
 * What the grouped views remember for the person in this browser, beside the view the issues pages already remember
 * (`storeIssueView`): the split list's width, the groups folded on each page, and the tasks expanded or folded in the
 * table. Storage may be unavailable (a private window); then each choice lasts as long as the page.
 */
import { useCallback, useState } from 'react';

import type { TaskGroupId } from '../../../shared/task-groups.js';

const PREFIX = 'studio:task-groups:';

/** The split list's width, in pixels. */
export const LIST_WIDTH = { min: 280, max: 520, initial: 360 } as const;

function read<T>(key: string, parse: (value: unknown) => T | null): T | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw === null ? null : parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // A convenience only: the choice lasts as long as the page.
  }
}

export function clampWidth(width: number): number {
  return Math.round(Math.min(LIST_WIDTH.max, Math.max(LIST_WIDTH.min, width)));
}

export function useListWidth(): readonly [number, (width: number) => void] {
  const [width, setWidth] = useState(
    () =>
      read('width', (value) =>
        typeof value === 'number' && Number.isFinite(value)
          ? clampWidth(value)
          : null,
      ) ?? LIST_WIDTH.initial,
  );
  const update = useCallback((next: number) => {
    const clamped = clampWidth(next);
    setWidth(clamped);
    write('width', clamped);
  }, []);
  return [width, update] as const;
}

/** The groups folded on `page`; the done group starts folded. */
export function useFoldedGroups(page: string): {
  readonly isFolded: (group: TaskGroupId) => boolean;
  readonly toggle: (group: TaskGroupId) => void;
} {
  const key = `folded:${page}`;
  const [choices, setChoices] = useState<Partial<Record<TaskGroupId, boolean>>>(
    () =>
      read(key, (value) =>
        value && typeof value === 'object' && !Array.isArray(value)
          ? (value as Partial<Record<TaskGroupId, boolean>>)
          : null,
      ) ?? {},
  );
  const isFolded = useCallback(
    (group: TaskGroupId) => choices[group] ?? group === 'done',
    [choices],
  );
  const toggle = useCallback(
    (group: TaskGroupId) =>
      setChoices((current) => {
        const next = {
          ...current,
          [group]: !(current[group] ?? group === 'done'),
        };
        write(key, next);
        return next;
      }),
    [key],
  );
  return { isFolded, toggle };
}

/** How many task choices the table keeps; the oldest go first. */
const EXPANDED_MAX = 300;

/**
 * The tasks the person expanded or folded in the table, by id; a task they never touched follows `fallback` (expanded
 * down to what waits for them).
 */
export function useExpandedTasks(): {
  readonly isExpanded: (id: string, fallback: boolean) => boolean;
  readonly toggle: (id: string, fallback: boolean) => void;
} {
  const [choices, setChoices] = useState<Record<string, boolean>>(
    () =>
      read('expanded', (value) =>
        value && typeof value === 'object' && !Array.isArray(value)
          ? (value as Record<string, boolean>)
          : null,
      ) ?? {},
  );
  const isExpanded = useCallback(
    (id: string, fallback: boolean) => choices[id] ?? fallback,
    [choices],
  );
  const toggle = useCallback((id: string, fallback: boolean) => {
    setChoices((current) => {
      const { [id]: previous, ...rest } = current;
      const entries = Object.entries({
        ...rest,
        [id]: !(previous ?? fallback),
      });
      const next = Object.fromEntries(entries.slice(-EXPANDED_MAX));
      write('expanded', next);
      return next;
    });
  }, []);
  return { isExpanded, toggle };
}

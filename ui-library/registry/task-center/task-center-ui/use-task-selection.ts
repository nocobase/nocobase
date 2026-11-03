import { useState } from 'react';

import type {
  TaskCardData,
  TaskListSelection,
  TaskSelectionState,
} from './types.js';

export interface UseTaskSelectionOptions<T extends TaskCardData> {
  /** The tasks on screen; selection never reaches a task the viewer cannot see. */
  readonly tasks: readonly T[];
  /** Whether a batch action of the task's type applies to it. */
  readonly canSelect: (task: T) => boolean;
  /**
   * Anything that changes what is on screen, such as the source, subject, tab and page. A new scope starts an empty
   * selection.
   */
  readonly scope: string;
  /** Name of a subject, for the hint on the checkboxes of other types. */
  readonly subjectLabel?: (subject: string) => string;
}

export interface TaskSelection<T extends TaskCardData> {
  /** The checked tasks, in list order. */
  readonly selected: readonly T[];
  /** The subject the first checked task fixed, while anything is checked. */
  readonly subject?: string;
  /** Pass to `TaskList`; undefined when nothing on screen can be selected. */
  readonly list?: TaskListSelection;
  readonly clear: () => void;
}

/**
 * Batch selection over one type at a time: the first checked task fixes its subject, tasks of other subjects stay
 * disabled until the selection is empty again, and open tasks whose type has no batch action show a disabled
 * checkbox.
 */
export function useTaskSelection<T extends TaskCardData>({
  canSelect,
  scope,
  subjectLabel,
  tasks,
}: UseTaskSelectionOptions<T>): TaskSelection<T> {
  const [state, setState] = useState<{
    readonly scope: string;
    readonly ids: ReadonlySet<string>;
  }>();
  const ids = state?.scope === scope ? state.ids : new Set<string>();
  const selectable = tasks.filter(canSelect);
  const selected = selectable.filter((task) => ids.has(task.id));
  const subject = selected[0]?.subject;
  const set = (next: ReadonlySet<string>): void =>
    setState({ scope, ids: next });

  const stateOf = (task: TaskCardData): TaskSelectionState => {
    const known = tasks.find((item) => item.id === task.id);
    if (known && canSelect(known))
      return subject !== undefined && task.subject !== subject
        ? 'locked'
        : 'available';
    return task.status === 'pending' ? 'unsupported' : 'none';
  };

  return {
    selected,
    subject,
    clear: () => set(new Set()),
    list: selectable.length
      ? {
          stateOf,
          isSelected: (task) => ids.has(task.id),
          onChange: (task, checked) => {
            const next = new Set(ids);
            if (checked) next.add(task.id);
            else next.delete(task.id);
            set(next);
          },
          selectedLabel:
            subject === undefined
              ? undefined
              : (subjectLabel?.(subject) ?? subject),
        }
      : undefined,
  };
}

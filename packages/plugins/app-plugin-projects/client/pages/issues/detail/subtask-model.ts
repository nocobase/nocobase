import type { SubtaskSummary } from '../../../../shared/subtasks.js';

export interface StageGroup {
  /** The batch number, or null for sub-issues without a stage. */
  readonly stage: number | null;
  readonly subtasks: readonly SubtaskSummary[];
  /** How many are finished, for the "2/3" beside the group. */
  readonly done: number;
}

/**
 * Sub-issues grouped by stage, the lowest stage first and those without one last; inside a group the server's order
 * (by number) is kept. Whether one is finished comes from the server, by its own workflow.
 */
export function groupSubtasksByStage(
  subtasks: readonly SubtaskSummary[],
): StageGroup[] {
  const groups = new Map<number | null, SubtaskSummary[]>();
  for (const subtask of subtasks)
    groups.set(subtask.stage, [...(groups.get(subtask.stage) ?? []), subtask]);
  return [...groups]
    .sort(([a], [b]) => {
      if (a === b) return 0;
      if (a === null) return 1;
      if (b === null) return -1;
      return a - b;
    })
    .map(([stage, items]) => ({
      stage,
      subtasks: items,
      done: items.filter((item) => item.terminal).length,
    }));
}

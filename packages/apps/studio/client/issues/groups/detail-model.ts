/** The task detail's sections and its place in a list (`detail-pane.tsx`). */
export const DETAIL_TABS = ['feed', 'desc', 'subs', 'code', 'runs'] as const;
export type DetailTab = (typeof DETAIL_TABS)[number];

/** Where the task sits in the list it was opened from, and the way to its neighbours. */
export interface TaskNav {
  /** 1-based; 0 when the task is not in the list. */
  readonly index: number;
  readonly total: number;
  readonly onPrevious?: (() => void) | undefined;
  readonly onNext?: (() => void) | undefined;
}

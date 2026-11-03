import type { ComponentType, ReactNode } from 'react';

/** The three states a task index keeps for every task. */
export type TaskCenterStatus = 'pending' | 'completed' | 'cancelled';

/** The status tabs: `closed` stands for both completed and cancelled tasks. */
export type TaskCenterStatusTab = 'pending' | 'closed' | 'all';

/** An icon such as a lucide-react one. */
export type TaskCenterIcon = ComponentType<{
  readonly className?: string;
  readonly 'aria-hidden'?: boolean;
}>;

/** A subject under a source in the navigation, such as one approval flow. */
export interface TaskNavSubject {
  readonly key: string;
  /** Translated name; the navigation search matches against it. */
  readonly label: string;
  /** Pending tasks of the subject. It should not follow the status tab. */
  readonly count?: number;
}

/** A source of tasks in the navigation, such as "Waiting for my approval". */
export interface TaskNavSource {
  readonly key: string;
  readonly label: string;
  readonly icon?: TaskCenterIcon;
  /** Pending tasks of the whole source. */
  readonly count?: number;
  readonly subjects: readonly TaskNavSubject[];
}

export type TaskBadgeVariant =
  'default' | 'secondary' | 'outline' | 'destructive';

/** One task shaped for its card, with the wording already translated. */
export interface TaskCardData {
  readonly id: string;
  readonly title: string;
  readonly status: TaskCenterStatus;
  /** The status as its source words it, such as "In review" for a request of one's own. */
  readonly statusLabel: string;
  /** Overrides the badge variant the status implies. */
  readonly statusVariant?: TaskBadgeVariant;
  /** RFC 3339 instant: when a pending task arrived, or when a closed one closed. */
  readonly time: string;
  /** The subject the task belongs to; selection groups by it. */
  readonly subject: string;
  /** Shown in the card's meta line when the list spans several subjects. */
  readonly subjectLabel?: string;
  readonly icon?: TaskCenterIcon;
  /** Contributed by the task's type; a task without one shows no summary. */
  readonly summary?: ReactNode;
}

/** A batch action contributed by a task type, as the bulk bar shows it. */
export interface TaskBulkActionView {
  readonly key: string;
  /** Translated, usually with the count it applies to, such as "Approve (3)". */
  readonly label: string;
  readonly icon?: TaskCenterIcon;
  /** At most one primary action per view. */
  readonly primary?: boolean;
  /** Selected tasks the action applies to; 0 disables it. */
  readonly count: number;
}

/** How a card's checkbox appears while batch selection is offered. */
export type TaskSelectionState =
  /** Can be checked. */
  | 'available'
  /** Its type has batch actions, but tasks of another type are selected. */
  | 'locked'
  /** Still open, but its type contributes no batch action. */
  | 'unsupported'
  /** No checkbox, such as for a closed task. */
  | 'none';

/** What a list needs to draw checkboxes; `useTaskSelection` returns it. */
export interface TaskListSelection {
  readonly stateOf: (task: TaskCardData) => TaskSelectionState;
  readonly isSelected: (task: TaskCardData) => boolean;
  readonly onChange: (task: TaskCardData, checked: boolean) => void;
  /** Name of the selected type, for a locked checkbox's hint. */
  readonly selectedLabel?: string;
}

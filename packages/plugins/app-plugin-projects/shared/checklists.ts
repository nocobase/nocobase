/**
 * An issue's checklists: when an issue enters a status with a checklist, it gets a copy of the items, kept per status.
 * Anyone who may edit the issue checks and unchecks them; the issue leaves the status (except to a closed one) only
 * once the required items are checked.
 */

export interface ChecklistItem {
  readonly itemKey: string;
  readonly label: string;
  readonly required: boolean;
  readonly checked: boolean;
  readonly checkedByType: string | null;
  readonly checkedById: string | null;
  readonly checkedByName: string | null;
  readonly checkedAt: string | null;
}

export interface IssueChecklist {
  readonly statusKey: string;
  /** Whether the issue is in this status now. */
  readonly current: boolean;
  /** Every required item is checked. */
  readonly complete: boolean;
  readonly items: readonly ChecklistItem[];
}

export interface UpdateChecklistItemRequest {
  readonly checked: boolean;
}

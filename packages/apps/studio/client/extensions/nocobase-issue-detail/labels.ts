/**
 * The words of the issue-detail block, English by default. A consumer passes its own, from its locale resources;
 * `{name}`-style placeholders are filled in by the block.
 */
export interface IssueDetailLabels {
  readonly editTitle: string;
  readonly titleLabel: string;
  readonly parent: string;
  readonly description: string;
  readonly descriptionPlaceholder: string;
  readonly editDescription: string;
  readonly noDescription: string;
  readonly save: string;
  readonly cancel: string;
  readonly delete: string;
  /** `{identifier}` is the issue's. */
  readonly deleteTitle: string;
  readonly deleteDescription: string;
  readonly properties: string;
  readonly saving: string;
  readonly createNamed: string;
  readonly noOptions: string;
  readonly checklist: {
    readonly title: string;
    readonly label: string;
    /** `{done}` of `{total}`. */
    readonly progress: string;
    readonly required: string;
    /** `{name}`, `{time}`. */
    readonly checkedBy: string;
    readonly incomplete: string;
  };
  readonly approvals: {
    readonly label: string;
    readonly pending: string;
    readonly requester: string;
    readonly approvers: string;
    readonly comment: string;
    readonly commentPlaceholder: string;
    readonly approve: string;
    readonly reject: string;
    readonly withdraw: string;
    readonly waiting: string;
    readonly recent: string;
  };
  readonly subtasks: {
    readonly title: string;
    readonly none: string;
    /** `{stage}`. */
    readonly stage: string;
    readonly noStage: string;
  };
  readonly dependencies: {
    readonly title: string;
    readonly blockedBy: string;
    readonly blocks: string;
    readonly related: string;
    /** `{identifier}`. */
    readonly remove: string;
    readonly add: string;
    readonly addPlaceholder: string;
    readonly addLabel: string;
    readonly addDependency: string;
    readonly searchEmpty: string;
  };
  readonly labelColors: {
    readonly open: string;
    readonly title: string;
    /** `{name}` is the label. */
    readonly for: string;
  };
  readonly followers: {
    readonly title: string;
    readonly none: string;
    readonly follow: string;
    readonly unfollow: string;
    /** `{count}`. */
    readonly label: string;
  };
  readonly dates: {
    readonly title: string;
    readonly created: string;
    readonly updated: string;
  };
  readonly start: {
    readonly title: string;
    readonly later: string;
    readonly start: string;
  };
}

export const defaultIssueDetailLabels: IssueDetailLabels = {
  editTitle: 'Edit title',
  titleLabel: 'Title',
  parent: 'Parent',
  description: 'Description',
  descriptionPlaceholder: 'Describe the issue… Type @ to mention someone',
  editDescription: 'Edit description',
  noDescription: 'No description.',
  save: 'Save',
  cancel: 'Cancel',
  delete: 'Delete',
  deleteTitle: 'Delete {identifier}?',
  deleteDescription: 'An administrator can restore it later.',
  properties: 'Properties',
  saving: 'Saving…',
  createNamed: 'Create “{name}”',
  noOptions: 'No options',
  checklist: {
    title: 'Checklist',
    label: 'Checklist of the current status',
    progress: '{done} of {total}',
    required: 'Required',
    checkedBy: '{name} · {time}',
    incomplete: 'The issue moves on once the required items are checked.',
  },
  approvals: {
    label: 'Status change waiting for approval',
    pending: 'Waiting for approval',
    requester: 'Asked by',
    approvers: 'Approvers',
    comment: 'Comment',
    commentPlaceholder: 'Add a comment (optional)',
    approve: 'Approve',
    reject: 'Reject',
    withdraw: 'Withdraw',
    waiting: 'Waiting for an approver.',
    recent: 'Recent approvals',
  },
  subtasks: {
    title: 'Sub-issues',
    none: 'none',
    stage: 'Stage {stage}',
    noStage: 'No stage',
  },
  dependencies: {
    title: 'Dependencies',
    blockedBy: 'Blocked by',
    blocks: 'Blocks',
    related: 'Related',
    remove: 'Remove {identifier}',
    add: 'Add a blocker',
    addPlaceholder: 'Search issues…',
    addLabel: 'Add:',
    addDependency: 'Dependency',
    searchEmpty: 'No issues found',
  },
  labelColors: {
    open: 'Change label colors',
    title: 'Label colors',
    for: 'Color of {name}',
  },
  followers: {
    title: 'Followers',
    none: 'Nobody follows it yet.',
    follow: 'Follow',
    unfollow: 'Unfollow',
    label: '{count} followers',
  },
  dates: { title: 'Details', created: 'Created', updated: 'Updated' },
  start: { title: 'Start now?', later: 'Don’t start now', start: 'Start' },
};

/** Puts `values` into a label's `{name}` placeholders. */
export function fill(
  text: string,
  values: Readonly<Record<string, string | number>>,
): string {
  return text.replace(/\{(\w+)\}/gu, (whole, key: string) =>
    key in values ? String(values[key]) : whole,
  );
}

const UNITS: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
];

/** "3 minutes ago" in `locale`, or "—". */
export function relativeTime(iso: string | null, locale?: string): string {
  const date = iso ? new Date(iso) : null;
  if (!date || Number.isNaN(date.getTime())) return '—';
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  for (const [unit, size] of UNITS)
    if (Math.abs(seconds) >= size || unit === 'second')
      return format.format(Math.round(seconds / size), unit);
  return '—';
}

/** Date and time in `locale`, or "—". */
export function dateTime(iso: string | null, locale?: string): string {
  const date = iso ? new Date(iso) : null;
  return date && !Number.isNaN(date.getTime())
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
    : '—';
}

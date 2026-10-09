/**
 * What the approval components draw. Every value is ready to show: labels
 * are translated and people are ids the `ApprovalUiProvider` names, so the
 * components know nothing about where an approval comes from. The page that
 * renders them maps its approval backend's data into these shapes.
 */

/** How a control or a badge stands out. */
export type ApprovalTone = 'default' | 'primary' | 'danger';

/** How a badge looks, as the shadcn `Badge` variants. */
export type ApprovalBadgeVariant =
  'default' | 'secondary' | 'outline' | 'destructive';

export interface ApprovalBadge {
  readonly label: string;
  readonly variant?: ApprovalBadgeVariant;
}

/** Where one step of a request's progress stands. */
export type ApprovalStepState =
  | 'done'
  | 'current'
  | 'rejected'
  | 'returned'
  | 'ended'
  | 'upcoming'
  | 'skipped';

/** When something is due, in words, and whether that time has passed. */
export interface ApprovalDue {
  /** Such as "due in 3 hours" or "overdue by a day". */
  readonly label: string;
  readonly overdue: boolean;
}

/** One person's part in a step: who, their state or answer, and what else is worth saying. */
export interface ApprovalStepTask {
  readonly key: string;
  readonly personId: string;
  readonly badges: readonly ApprovalBadge[];
  /** Short notes after the badges, such as who answered for them or how the task reached them. */
  readonly notes?: readonly string[];
  /** The opinion they gave. */
  readonly comment?: string | null;
  /** When their answer is due, while they have not given it. */
  readonly due?: ApprovalDue | null;
}

/** How an answer counts in a tally: towards passing, against, or neither. */
export type ApprovalTallyTone = 'positive' | 'negative' | 'neutral';

/** One kind of answer in a tally, such as "Approve 2". */
export interface ApprovalTallyCount {
  readonly key: string;
  readonly label: string;
  readonly count: number;
  readonly tone: ApprovalTallyTone;
}

/**
 * Where a step that several people decide stands: the answers so far
 * against everyone who has a say, and what carries it.
 */
export interface ApprovalTally {
  /** Everyone who has a say. */
  readonly total: number;
  /** The answers given so far, by kind, in the order to show them. */
  readonly counts: readonly ApprovalTallyCount[];
  /** The positive answers that carry the step, marked on the bar; omitted when everyone has to. */
  readonly needed?: number | null;
  /** The rules in words, such as "Three approvals pass" or "The chair may veto". */
  readonly rules?: readonly string[];
}

/** One stage as a progress shows it: one it went through, the one now, or one ahead. */
export interface ApprovalStep {
  readonly key: string;
  readonly title: string;
  readonly state: ApprovalStepState;
  /** How the people of the step decide, such as "everyone approves"; shown beside the title. */
  readonly policy?: string | null;
  /** Why the step is there, or why it is skipped. */
  readonly because?: string | null;
  /** When it ended, or started while it goes on, as an ISO string. */
  readonly at?: string | null;
  /** The count of answers, for a step several people decide. */
  readonly tally?: ApprovalTally | null;
  readonly tasks: readonly ApprovalStepTask[];
}

/** Someone a request was copied to. */
export interface ApprovalCopy {
  readonly key: string;
  readonly personId: string;
  readonly read: boolean;
}

/** One line of a request's history. */
export interface ApprovalTimelineLine {
  readonly key: string;
  /** An ISO string; lines are shown oldest first. */
  readonly at: string;
  readonly actorId: string;
  /**
   * `action` lines carry their whole sentence in `title`, actor included;
   * `event` lines show the actor's name, then `title`.
   */
  readonly kind: 'action' | 'event';
  readonly title: string;
  /** `muted` for bookkeeping, `accent` for a move of the request. Event lines only. */
  readonly emphasis?: 'default' | 'muted' | 'accent';
  /** Whom a delegate acted for. */
  readonly onBehalfOf?: string | null;
  readonly details?: readonly {
    readonly label: string;
    readonly value: string;
  }[];
  /** A reason or opinion given with it. */
  readonly comment?: string | null;
  /** What the action changed, folded under its line. */
  readonly children?: readonly {
    readonly key: string;
    readonly label: string;
  }[];
  /** Whether the children start folded. Defaults to true. */
  readonly collapsed?: boolean;
}

/** One branch of a request split into parallel parts, each handled on its own. */
export interface ApprovalBranch {
  readonly key: string;
  readonly title: string;
  /** Where it stands, read the way a progress step reads. */
  readonly state: ApprovalStepState;
  /** Its state in words, such as "Awaiting IT review". */
  readonly badge?: ApprovalBadge | null;
  /** Who it waits for now. */
  readonly ownerIds: readonly string[];
  /** The step it is at, such as "Manager review". */
  readonly step?: string | null;
  /** Whether the request waits for it. Defaults to true. */
  readonly required?: boolean;
  /** Whether it holds the request up: rejected, failed, or waiting longer than it should. */
  readonly blocked?: boolean;
  readonly note?: string | null;
}

/** Where one recipient of a notice stands. */
export type ApprovalReceiptState = 'unread' | 'read' | 'confirmed' | 'revoked';

/** One person a notice reached, and what they did with it. */
export interface ApprovalReceipt {
  readonly key: string;
  readonly personId: string;
  readonly state: ApprovalReceiptState;
  /** The state in words. */
  readonly label: string;
  /** When they read or confirmed it, as an ISO string. */
  readonly at?: string | null;
  readonly comments?: readonly {
    readonly key: string;
    readonly text: string;
  }[];
}

/** One stop a new request would reach. */
export interface ApprovalRouteStop {
  readonly key: string;
  readonly title: string;
  readonly people: readonly string[];
  /** How several people decide, such as "everyone approves"; shown when there is more than one. */
  readonly policy?: string | null;
  /**
   * Whether the stop is passed at all; skipped stops are listed apart, with
   * `because`. An included stop shows `because` as what added it, such as a
   * threshold the request crosses.
   */
  readonly included: boolean;
  /** For a parallel branch: whether the request waits for it. Defaults to true. */
  readonly required?: boolean;
  readonly because?: string | null;
}

/** Who a request would go to if it were submitted now. */
export interface ApprovalRoute {
  /** `stages` one after another, `branches` in parallel, `none` for a request no one decides. */
  readonly mode: 'stages' | 'branches' | 'none';
  readonly stops: readonly ApprovalRouteStop[];
  /** Why the request could not go anywhere as it stands. */
  readonly problems: readonly string[];
  /** Why the people are who they are. */
  readonly notes: readonly string[];
}

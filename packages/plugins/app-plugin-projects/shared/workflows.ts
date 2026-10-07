/**
 * Workflows: the statuses of a project's issues and who may move an issue between them. A project uses one workflow;
 * a project without one, and an issue without a project, use the default workflow, or the built-in statuses
 * (`BUILTIN_STATUSES`, people move freely) while no workflow is the default. The plugin ships no workflow; other
 * plugins' templates may add some.
 *
 * A status may carry rules, run when an issue enters it (and, for a checklist, when it leaves it); a transition may
 * need an approval before it takes effect.
 */
import type { Color } from './common.js';
import type { StatusCategory } from './issues.js';

export const STATUS_CATEGORIES: readonly StatusCategory[] = [
  'unstarted',
  'started',
  'done',
  'closed',
];

/**
 * Who moves an issue: a kind's key (`shared/kinds.ts`): `user` for people, `system` for the plugin's own rules (a
 * merged pull request, for instance), or a kind another plugin registered.
 */
export type TransitionActor = string;

/** One item of a status's checklist. */
export interface ChecklistItemDefinition {
  /** `^[a-z0-9][a-z0-9_-]{0,63}$`, unique within the checklist. */
  readonly key: string;
  readonly label: string;
  /** An issue leaves the status (except to a closed one) only once every required item is checked. */
  readonly required: boolean;
}

/**
 * What entering a status does, built into this plugin:
 *
 * - `checklist`: the issue gets the items to check; leaving the status for anything but a closed status waits until
 *   the required ones are checked (400 `CHECKLIST_INCOMPLETE`).
 * - `notifyOwner`: the issue's owner is told, with an optional message (unless they moved it themselves). The message is
 *   plain text, or an i18n key (`LocalizedMessage`) so each reader sees it in their own language.
 * - `subtasksDone`: an issue enters the status only once its sub-issues are finished (400 `SUBTASKS_OPEN`); a closed
 *   status never waits.
 * - `blockersDone`: an issue enters the status only when nothing holds it (400 `ISSUE_BLOCKED`).
 * - `startOption`: the New issue form offers the status as a way to start an issue, with an optional label and hint
 *   (plain text or keys), such as "Design first" on Analysis. Entering the status does nothing.
 */
export type BuiltInStatusRule =
  | {
      readonly type: 'checklist';
      readonly config: { readonly items: readonly ChecklistItemDefinition[] };
    }
  | {
      readonly type: 'notifyOwner';
      readonly config?: { readonly message?: RuleMessage };
    }
  | { readonly type: 'subtasksDone' }
  | { readonly type: 'blockersDone' }
  | {
      readonly type: 'startOption';
      readonly config?: {
        readonly label?: RuleMessage;
        readonly hint?: RuleMessage;
      };
    };

/**
 * A rule another plugin contributes (`projectsStatusRulesToken` on the server, `StatusRuleTypesContext` in the
 * browser), such as an agent runtime's `runAgent`. A definition keeps one whose plugin is gone: the editor shows it as
 * unavailable, and entering the status skips it.
 */
export interface ContributedStatusRule {
  readonly type: string;
  readonly config?: Readonly<Record<string, unknown>>;
}

export type WorkflowStatusRule = BuiltInStatusRule | ContributedStatusRule;

export type WorkflowStatusRuleType = BuiltInStatusRule['type'];
export const STATUS_RULE_TYPES: readonly WorkflowStatusRuleType[] = [
  'checklist',
  'notifyOwner',
  'subtasksDone',
  'blockersDone',
  'startOption',
];

/** The longest `startOption` label, as text or as a key's default. */
export const START_LABEL_MAX = 64;

/** A contributed rule type's key: not a built-in one. */
export const STATUS_RULE_TYPE_PATTERN: RegExp = /^[a-z][A-Za-z0-9]{1,63}$/u;

export function isBuiltInRule(
  rule: WorkflowStatusRule,
): rule is BuiltInStatusRule {
  return (STATUS_RULE_TYPES as readonly string[]).includes(rule.type);
}

/**
 * What a workflow may react to on its own, through a transition with `on`. Built in: `subtasks.done` when every
 * sub-issue of an issue is finished. Other plugins contribute their own (`projectsWorkflowEventsToken` on the server,
 * `WorkflowEventsContext` in the browser) and fire them for the issues they concern; this plugin never knows what they
 * mean. A definition keeps a transition on an event whose plugin is gone: nobody fires it, and the editor shows it as
 * unavailable.
 */
export type BuiltInWorkflowEvent = 'subtasks.done';
export const WORKFLOW_EVENTS: readonly BuiltInWorkflowEvent[] = [
  'subtasks.done',
];
/** A built-in event's key or a contributed one's. */
export type WorkflowEvent = BuiltInWorkflowEvent | (string & {});

/** A contributed event's key: dotted, its plugin's prefix first, such as `acme.merged`. */
export const WORKFLOW_EVENT_PATTERN: RegExp =
  /^[a-z][a-zA-Z0-9]{0,31}(\.[a-z][a-zA-Z0-9]{0,63}){1,3}$/u;

export function isBuiltInEvent(event: string): event is BuiltInWorkflowEvent {
  return (WORKFLOW_EVENTS as readonly string[]).includes(event);
}

/**
 * Where a workflow may use an event, the same on the server and in the browser: the categories of status a transition
 * on it may leave (`from`) and enter (`to`); every category when left out.
 */
export interface WorkflowEventPlacement {
  readonly key: string;
  readonly from?: readonly StatusCategory[];
  readonly to?: readonly StatusCategory[];
}

export interface WorkflowStatus {
  /** `^[a-z][a-z0-9_]{1,31}$`, fixed once issues use it. */
  readonly key: string;
  readonly name: string;
  readonly category: StatusCategory;
  readonly color: Color;
  /** One of the nine statuses every workflow has: not removable, key and category fixed. */
  readonly builtIn?: boolean;
  /** At most one of each type. */
  readonly rules?: readonly WorkflowStatusRule[];
}

/** Who may approve a move: the issue's owner, the lead of its project, the plugin's admins and owners. */
export type ApproverRole = 'owner' | 'projectLead' | 'admin';
export const APPROVER_ROLES: readonly ApproverRole[] = [
  'owner',
  'projectLead',
  'admin',
];

/** `*` stands for any status. */
export const ANY_STATUS = '*';

export interface WorkflowTransition {
  readonly from: string;
  readonly to: string;
  readonly actors: readonly TransitionActor[];
  /**
   * The move waits for one of these to approve it. It goes through at once when the mover is one of them, or when
   * none resolves to anybody (an issue without a project has no project lead).
   */
  readonly approval?: { readonly approvers: readonly ApproverRole[] };
  /**
   * Taken by the system when the event happens, never by a person or an ordinary move: from a concrete status to
   * another, with `actors: ['system']`. One per status and event.
   */
  readonly on?: WorkflowEvent;
}

export interface WorkflowDefinition {
  readonly states: readonly WorkflowStatus[];
  readonly transitions: readonly WorkflowTransition[];
}

export interface Workflow {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly isDefault: boolean;
  /** Set on a workflow a template created (its key); its name is translated until someone renames it. */
  readonly builtInKey: string | null;
  readonly definition: WorkflowDefinition;
  /** Increases with every change; an update must name the revision it read. */
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface WorkflowListItem extends Workflow {
  /** Projects on it; the default workflow also counts projects without one. */
  readonly projectCount: number;
  /**
   * The translated name of a workflow another plugin's template created (`builtInKey`), while nobody renamed it: an
   * i18n key in that plugin's namespace.
   */
  readonly title?: { readonly key: string; readonly ns: string };
  /** The translated description of such a workflow, while nobody changed it: an i18n key like `title`. */
  readonly descriptionTitle?: { readonly key: string; readonly ns: string };
}

/** A status rule added to or removed from a workflow, as `POST /api/projects/workflows/{workflowId}/preview` lists it. */
export interface WorkflowRuleChange {
  readonly statusKey: string;
  readonly change: 'added' | 'removed';
  readonly rule: WorkflowStatusRule;
  /** The rule's type is known to the server: built in, or contributed by a plugin that is there. */
  readonly available: boolean;
  /** What the rule does, in English; null when its type is unavailable. */
  readonly summary: string | null;
  /** Entering the status wakes someone without anybody confirming it. */
  readonly attention: boolean;
}

/** What saving a definition would change in the workflow's rules (`POST /api/projects/workflows/{workflowId}/preview`). */
export interface WorkflowPreview {
  readonly rules: readonly WorkflowRuleChange[];
  /**
   * Every rule of the new definition that wakes someone on entering its status without anybody confirming it, `isNew`
   * when the current definition does not have it on that status.
   */
  readonly attention: readonly {
    readonly statusKey: string;
    readonly rule: WorkflowStatusRule;
    readonly summary: string;
    readonly isNew: boolean;
  }[];
}

/** A new workflow starts as a copy of an existing one, or of the built-in statuses (`copyFrom: null`). */
export interface CreateWorkflowRequest {
  readonly name: string;
  readonly copyFrom: string | null;
}

export interface UpdateWorkflowRequest {
  readonly revision: number;
  readonly name?: string;
  readonly description?: string | null;
  readonly definition?: WorkflowDefinition;
}

/** One problem of a definition, at its path (`states[3].key`): `metadata.issues` of 400 `INVALID_WORKFLOW`. */
export interface WorkflowValidationIssue {
  readonly path: string;
  readonly message: string;
}

/** `metadata` of 400 `WORKFLOW_STATUS_CONFLICT`: issues still in statuses the workflow would lose. */
export interface WorkflowStatusConflict {
  readonly conflicts: readonly {
    readonly statusKey: string;
    readonly projectId: string | null;
    readonly projectName: string | null;
    readonly count: number;
  }[];
}

export const WORKFLOW_NAME_MAX = 100;
export const CHECKLIST_ITEMS_MAX = 20;
export const CHECKLIST_LABEL_MAX = 200;
export const CHECKLIST_ITEM_KEY_PATTERN: RegExp = /^[a-z0-9][a-z0-9_-]{0,63}$/u;
export const NOTIFY_MESSAGE_MAX = 500;
export const MESSAGE_KEY_MAX = 200;
export const MESSAGE_NAMESPACE_PATTERN: RegExp =
  /^[@a-z0-9][@a-z0-9._/-]{0,99}$/u;

/**
 * A message in the reader's language: an i18n key in a namespace (the application's or a plugin's, such as the one
 * that ships a workflow template), and the words to show where the key has no translation. A rule's message is
 * stored like this, translated by whoever shows it: the browser in the reader's language, the server in the
 * application's default one.
 */
export interface LocalizedMessage {
  /** At most `MESSAGE_KEY_MAX` characters. */
  readonly key: string;
  /** The namespace; the reader's default namespace when left out. */
  readonly ns?: string;
  /** At most `NOTIFY_MESSAGE_MAX` characters. */
  readonly defaultValue?: string;
}

/** A rule's message: plain text, or a key to translate. */
export type RuleMessage = string | LocalizedMessage;

export function isLocalizedMessage(value: unknown): value is LocalizedMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as { key?: unknown }).key === 'string'
  );
}

/**
 * A message in words: plain text as it is, a key through `t` (with its namespace and default). Blank text and
 * anything else read as no message.
 */
export function messageText(
  message: unknown,
  t: (key: string, options?: Record<string, unknown>) => string,
): string | null {
  if (typeof message === 'string') return message.trim() || null;
  if (!isLocalizedMessage(message)) return null;
  const text = t(message.key, {
    ...(message.ns ? { ns: message.ns } : {}),
    defaultValue: message.defaultValue ?? message.key,
  });
  return text.trim() || null;
}
export const STATUS_NAME_MAX = 64;
export const STATUS_KEY_PATTERN: RegExp = /^[a-z][a-z0-9_]{1,31}$/u;
/** Where a new issue starts, in every workflow. */
export const INITIAL_STATUS = 'todo';
/**
 * Where issues wait before anyone plans them, in every workflow. Work does not start there: an executor given an issue
 * in backlog starts when the issue leaves it.
 */
export const BACKLOG_STATUS = 'backlog';

/**
 * The nine statuses every workflow has, in the order of the old NocoProject's default workflow; notifications and
 * reports rely on their keys.
 */
export const BUILTIN_STATUSES: readonly WorkflowStatus[] = [
  {
    key: BACKLOG_STATUS,
    name: 'Backlog',
    category: 'unstarted',
    color: 'gray',
    builtIn: true,
  },
  {
    key: 'todo',
    name: 'Todo',
    category: 'unstarted',
    color: 'blue',
    builtIn: true,
  },
  {
    key: 'analysis',
    name: 'Analysis',
    category: 'started',
    color: 'orange',
    builtIn: true,
  },
  {
    key: 'proposal_review',
    name: 'Proposal review',
    category: 'started',
    color: 'purple',
    builtIn: true,
  },
  {
    key: 'in_progress',
    name: 'In progress',
    category: 'started',
    color: 'yellow',
    builtIn: true,
  },
  {
    key: 'in_review',
    name: 'In review',
    category: 'started',
    color: 'purple',
    builtIn: true,
  },
  {
    key: 'blocked',
    name: 'Blocked',
    category: 'started',
    color: 'red',
    builtIn: true,
  },
  {
    key: 'done',
    name: 'Done',
    category: 'done',
    color: 'green',
    builtIn: true,
  },
  {
    key: 'cancelled',
    name: 'Cancelled',
    category: 'closed',
    color: 'gray',
    builtIn: true,
  },
];

/** Whether a built-in status still has its default name, so the interface shows the translation instead. */
export function hasDefaultName(status: {
  readonly key: string;
  readonly name: string;
}): boolean {
  return BUILTIN_STATUSES.some(
    (builtIn) => builtIn.key === status.key && builtIn.name === status.name,
  );
}

export function isTerminalCategory(category: StatusCategory | null): boolean {
  return category === 'done' || category === 'closed';
}

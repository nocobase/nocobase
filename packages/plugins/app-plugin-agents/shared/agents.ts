/**
 * Agents as the browser and the server's admin API exchange them.
 *
 * An agent is who works and how: its name and instructions, its type, the business actions it may perform. Its type is
 * chosen when it is created and never changes:
 *
 * - `runner`: it drives a coding tool on a runner, with its skills, its tool policy and its own
 *   variables. Where it runs is not configured beyond an optional list of runners: a run goes to any online runner that
 *   has one of its tools installed and signed in, may run the waking person's work, and has a free slot.
 * - `online`: it talks to a model of a model service directly, on the server: no runner, no working directory, no
 *   variables. Its tools are the application's commands it may run, and whatever else the application offers
 *   (knowledge search). It answers in seconds and runs only on subjects that need no working directory, such as
 *   conversations.
 *
 * Which tool or model it works with, and with what reasoning effort, is an ordered list (`modelEntries`), the first
 * being its default. A runner takes a runner agent's run with the first entry whose tool it has enabled and signed in;
 * nobody chooses. An online agent's runs use the first entry, except in a conversation, whose owner may pick another of
 * its entries. The run records the entry it used (`Run.tool`, `Run.modelService`, `Run.model`, `Run.effort`).
 *
 * An online agent with no entry is not configured yet (such as an application's built-in assistant before a model service exists): it is
 * kept, shown as needing a model, and offered no work until an entry is added. A runner agent always has one.
 */
import {
  TOOL_EFFORTS,
  type AgentTool,
  type ToolPolicy,
} from '@nocobase/agent-protocol';

import type { I18nText } from './i18n.js';

/** Who may wake an agent: its owner, the listed users, or everyone. */
export const AGENT_ACCESS = ['ownerOnly', 'users', 'everyone'] as const;

export type AgentAccess = (typeof AGENT_ACCESS)[number];

/** What kind of agent it is; chosen at creation and never changed (`runner`: a coding tool on a runner, `online`: a model on the server). */
export const AGENT_TYPES = ['online', 'runner'] as const;

export type AgentType = (typeof AGENT_TYPES)[number];

/**
 * When an agent in a conversation asks the person before changing data for them: `always` (every change goes through an
 * operation plan they confirm) or `larger` (small changes are made directly, within the application's direct-write
 * rules, and anything larger goes through a plan). There is no "never": what the rules call larger (waking an agent,
 * finishing an issue, changing an owner, …) always needs the person's confirmation.
 */
export const CONFIRM_CHANGES = ['always', 'larger'] as const;

export type ConfirmChanges = (typeof CONFIRM_CHANGES)[number];

/** The reasoning efforts an online agent's entry may name, weakest first, as the model gateway passes them to providers. */
export const ONLINE_EFFORTS = [
  'minimal',
  'low',
  'medium',
  'high',
  'xhigh',
] as const;

/**
 * An entry of a runner agent's list: a coding tool, its model (null: the tool's default) and its reasoning effort, one
 * of the tool's (`TOOL_EFFORTS`; null or absent: the tool's default).
 */
export interface RunnerModelEntry {
  readonly tool: AgentTool;
  readonly model: string | null;
  readonly effort?: string | null;
}

/**
 * An entry of an online agent's list: a model service (its name among the application's), one of its models, and its
 * reasoning effort (`ONLINE_EFFORTS`; null or absent: the provider's default).
 */
export interface OnlineModelEntry {
  readonly modelService: string;
  readonly model: string;
  readonly effort?: string | null;
}

/** A tool and model an agent may work with; a runner agent's entries are all `RunnerModelEntry`, an online agent's all `OnlineModelEntry`. */
export type AgentModelEntry = RunnerModelEntry | OnlineModelEntry;

/** The most entries an agent's list holds. */
export const MAX_MODEL_ENTRIES = 20;

export function isRunnerEntry(
  entry: AgentModelEntry,
): entry is RunnerModelEntry {
  return 'tool' in entry;
}

export function isOnlineEntry(
  entry: AgentModelEntry,
): entry is OnlineModelEntry {
  return 'modelService' in entry;
}

/** The reasoning efforts `entry` may name: its tool's for a runner entry, `ONLINE_EFFORTS` for an online one. */
export function effortsFor(
  entry: { readonly tool: AgentTool } | { readonly modelService: string },
): readonly string[] {
  return 'tool' in entry ? TOOL_EFFORTS[entry.tool] : ONLINE_EFFORTS;
}

/** A runner agent's entries, in order; empty for an online agent. */
export function runnerEntries(agent: {
  readonly modelEntries: readonly AgentModelEntry[];
}): RunnerModelEntry[] {
  return agent.modelEntries.filter(isRunnerEntry);
}

/** An online agent's entries, in order; empty for a runner agent. */
export function onlineEntries(agent: {
  readonly modelEntries: readonly AgentModelEntry[];
}): OnlineModelEntry[] {
  return agent.modelEntries.filter(isOnlineEntry);
}

/**
 * The entries an online agent answers with: its own, or, when it lists none, the system default chat model
 * (`DefaultModels`) as its only one; empty for a runner agent or when there is no default either.
 */
export function onlineEntriesOrDefault(
  agent: {
    readonly type: AgentType;
    readonly modelEntries: readonly AgentModelEntry[];
  },
  defaultModel: {
    readonly modelService: string;
    readonly model: string;
  } | null,
): OnlineModelEntry[] {
  if (agent.type !== 'online') return [];
  const own = onlineEntries(agent);
  if (own.length > 0) return own;
  return defaultModel
    ? [{ modelService: defaultModel.modelService, model: defaultModel.model }]
    : [];
}

/** The coding tools a runner agent's entries name, in order and once each; empty for an online agent. */
export function entryTools(agent: {
  readonly modelEntries: readonly AgentModelEntry[];
}): AgentTool[] {
  return [...new Set(runnerEntries(agent).map((entry) => entry.tool))];
}

/** Whether two entries name the same tool or service and model, whatever their efforts. */
export function sameEntry(a: AgentModelEntry, b: AgentModelEntry): boolean {
  if (isRunnerEntry(a))
    return (
      isRunnerEntry(b) &&
      a.tool === b.tool &&
      (a.model ?? null) === (b.model ?? null)
    );
  return (
    isOnlineEntry(b) && a.modelService === b.modelService && a.model === b.model
  );
}

export interface Agent {
  readonly id: string;
  /** As written; for an agent the application ships, the English its `nameText` translates. */
  readonly name: string;
  readonly description: string | null;
  /**
   * For an agent the application ships (such as an application's built-in agents): its name and description as i18n references, shown
   * in the viewer's language in place of `name` and `description`. Editing a field drops its reference, so the text
   * someone wrote shows as written. Null otherwise.
   */
  readonly nameText: I18nText | null;
  readonly descriptionText: I18nText | null;
  /** An image URL; null shows the bot icon. */
  readonly avatar: string | null;
  /** Immutable. */
  readonly type: AgentType;
  /**
   * The tools and models it works with, each with its reasoning effort, in order; the first is its default. Never empty
   * for a runner agent; empty for an online agent not configured yet.
   */
  readonly modelEntries: readonly AgentModelEntry[];
  /** Rendered as the last layer of the brief; they are preferences and never override the rules or the task. */
  readonly instructions: string | null;
  /** Business action keys the agent may perform, within what the person who woke it may do. */
  readonly actions: readonly string[];
  /** In conversations: whether it asks before every change or only before larger ones. */
  readonly confirmChanges: ConfirmChanges;
  readonly access: AgentAccess;
  /** For access `users`. */
  readonly userIds: readonly string[];
  readonly ownerUserId: string;
  /** Run only on these runners; empty: any runner that fits. */
  readonly runnerIds: readonly string[];
  /** The skills attached to the agent, in the skill library. */
  readonly skillIds: readonly string[];
  readonly maxConcurrentRuns: number;
  readonly maxAttempts: number;
  /** Overrides of the default tool policy (`DEFAULT_TOOL_POLICY`). */
  readonly toolPolicy: Partial<ToolPolicy> | null;
  readonly archivedAt: string | null;
  /**
   * Raised by every change to its configuration (editing, archiving, restoring). An edit names the revision it was
   * made against (`AgentPatch.expectedRevision`) and is refused with 409 when the agent changed since.
   */
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** An agent in the list: with what the list shows about its runs and runners. */
export interface AgentSummary extends Agent {
  readonly ownerName: string | null;
  /** Runs dispatched or running now. */
  readonly activeRuns: number;
  /**
   * `runner`: online runners that have the agent's tool installed and signed in, among `runnerIds` when it names any.
   * `online`: 1 while its model service offers its model, else 0.
   */
  readonly onlineRunners: number;
  /**
   * Whether the caller may change it: edit, archive, restore and delete it and set its variables. Managers of agents
   * may change every agent; others the agents their role's "related" level reaches (the ones they own).
   */
  readonly canEdit: boolean;
  /** Whether the caller may wake it, and so make a private copy of it for themselves (`ChatApi.copyAgent`). */
  readonly canCopy: boolean;
}

/** An agent the caller may give work to: what it is good at, and whether it can take work now. */
export interface AvailableAgent {
  readonly id: string;
  readonly name: string;
  /** Its description. */
  readonly goodAt: string;
  readonly type: AgentType;
  /** A runner agent's default coding tool (its first entry's); null for an online agent. */
  readonly tool: AgentTool | null;
  /** Whether it could start work now: an online runner that fits it, or its model offered. */
  readonly online: boolean;
  /** Its runs that have not finished. */
  readonly busy: number;
}

/**
 * What creating an agent takes; updating takes any subset but `type`, which an agent keeps for good. A `runner` agent
 * needs at least one entry in `modelEntries`, each naming a coding tool; an `online` agent's entries name model services
 * and their models, and it may have none until one is configured. Each entry may name a reasoning effort its tool or
 * service takes (`effortsFor`). An `online` agent takes no runners, tool policy or variables.
 */
export interface AgentInput {
  readonly name: string;
  readonly description?: string | null;
  readonly avatar?: string | null;
  /** `runner` by default. */
  readonly type?: AgentType;
  readonly modelEntries?: readonly AgentModelEntry[];
  readonly instructions?: string | null;
  readonly actions?: readonly string[];
  /** `larger` by default. */
  readonly confirmChanges?: ConfirmChanges;
  readonly access?: AgentAccess;
  readonly userIds?: readonly string[];
  /** Defaults to the creator. */
  readonly ownerUserId?: string;
  readonly runnerIds?: readonly string[];
  readonly skillIds?: readonly string[];
  readonly maxConcurrentRuns?: number;
  readonly maxAttempts?: number;
  readonly toolPolicy?: Partial<ToolPolicy> | null;
}

/**
 * What updating an agent takes (`PATCH /api/agents/:agentId`): any fields of the input, and the revision the edit was made
 * against. A stale revision is refused with 409 `REVISION_CONFLICT` (`metadata.revision` the
 * current one).
 */
export type AgentPatch = Partial<Omit<AgentInput, 'type'>> & {
  readonly expectedRevision: number;
};

/** What a change to an agent's configuration was. */
export const AGENT_CHANGE_ACTIONS = [
  'created',
  'updated',
  'archived',
  'restored',
  'variables',
] as const;

export type AgentChangeAction = (typeof AGENT_CHANGE_ACTIONS)[number];

/** The fields of an agent whose changes its history records, in the order the history shows them. */
export const AGENT_HISTORY_FIELDS = [
  'name',
  'description',
  'avatar',
  'instructions',
  'type',
  'modelEntries',
  'skillIds',
  'actions',
  'confirmChanges',
  'toolPolicy',
  'runnerIds',
  'maxConcurrentRuns',
  'maxAttempts',
  'access',
  'userIds',
  'ownerUserId',
] as const;

export type AgentHistoryField = (typeof AGENT_HISTORY_FIELDS)[number];

/** Fields no longer recorded that older history entries still carry, so the history can still name them. */
export const RETIRED_AGENT_HISTORY_FIELDS = [
  'tool',
  'model',
  'llmService',
  'modelService',
  'reasoningEffort',
] as const;

/**
 * One field that changed. A variable is a secret: it is named (`name`) with what happened to it (`change`), never with
 * its value.
 */
export type AgentFieldChange =
  | {
      readonly field: AgentHistoryField;
      readonly before: unknown;
      readonly after: unknown;
    }
  | {
      readonly field: 'variable';
      readonly name: string;
      readonly change: 'added' | 'changed' | 'removed';
    };

/** An entry of an agent's history (`GET /api/agents/:agentId/history`), newest first. */
export interface AgentChange {
  readonly id: string;
  readonly agentId: string;
  /** The agent's revision after the change. */
  readonly revision: number;
  readonly action: AgentChangeAction;
  readonly actorUserId: string | null;
  readonly actorName: string | null;
  readonly changes: readonly AgentFieldChange[];
  readonly createdAt: string;
}

/**
 * A business action an agent may be configured with (`GET /api/agents/actions`), as the application offers it:
 * the key its commands name, and how the editor shows it.
 */
export interface AgentActionOption {
  /** The business action key the server stores, such as `crm.deals/comment`. */
  readonly key: string;
  /** What groups it in the editor, such as `crm.deals`. */
  readonly group: string;
  /** The checkbox label; the key when absent. */
  readonly title?: I18nText;
  /** The group's heading; the group when absent. */
  readonly groupTitle?: I18nText;
  /** One line under the label saying what it lets the agent do. */
  readonly description?: I18nText;
  /** Ticked in the new-agent dialog. */
  readonly defaultOn?: boolean;
  /**
   * False for an action listed only to show where the boundary is: the agent page shows it greyed out with `reason`,
   * and it is never offered or granted. Grantable when absent.
   */
  readonly grantable?: boolean;
  /** Why it can never be granted to an agent, for a `grantable: false` action. */
  readonly reason?: I18nText;
  /**
   * The agent types it may be given; both when absent. An action that needs a working directory (attaching a file
   * from one) is `['runner']`.
   */
  readonly types?: readonly AgentType[];
}

/** A person, as pickers and audit lines show them (`GET /api/agents/users`). */
export interface UserRef {
  readonly id: string;
  readonly name: string;
}

/**
 * The tool policy an agent starts from; an agent's `toolPolicy` overrides fields of it. The editor shows it so people
 * see what they override.
 */
export const DEFAULT_TOOL_POLICY: ToolPolicy = {
  permissionMode: 'acceptEdits',
  allowedCommands: [
    '^(cd|git|ls|cat|head|tail|grep|rg|find|wc|diff|sed|awk|sort|uniq|echo|printf|pwd|which|mkdir|touch|cp|mv)\\b',
    '^(node|npm|npx|pnpm|yarn|tsc|vitest|jest|eslint|prettier|python3?|pip3?|pytest|go|cargo|make)\\b',
  ],
  deniedPatterns: [
    '\\brm\\s+-[a-z]*r[a-z]*f?\\s+/(\\s|$)',
    '\\bsudo\\b',
    '\\bcurl\\b[^|]*\\|\\s*(sh|bash|zsh)\\b',
    '\\bgit\\s+push\\b[^\\n]*--force\\b',
    '\\bchmod\\s+-R\\s+777\\b',
  ],
  idleTimeoutMs: 30 * 60_000,
};

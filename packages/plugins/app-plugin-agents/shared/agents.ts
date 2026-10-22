/**
 * Agents as the browser and the server's admin API exchange them.
 *
 * Nobody creates an agent. Each coding tool and model the runners report becomes one agent (`source: 'runner'`): the
 * runners report, per tool, whether it is installed and signed in and which models it can use, and the server keeps one
 * agent per tool and model (`model-catalog.ts` names it and normalizes the model), however many runners report it. A new
 * one waits (`pending`) until someone who manages agents writes what it is good at and enables it. The application may
 * also keep agents of its own (`source: 'system'`), such as a project manager, which it configures through its own
 * settings and runs with the tool and model of the agents it names.
 *
 * Which tool and model an agent works with, and with what reasoning effort, is an ordered list (`modelEntries`); a
 * runner takes a run with the first entry it reports. An agent discovered from runners has exactly one entry, its own
 * tool and model; only its default reasoning effort can be changed. The rest of what an agent is (its instructions,
 * the business actions it may perform, how many attempts a run gets) is the application's, the same for every agent.
 */
import type { QuotaLocation } from './quota.js';

import {
  TOOL_EFFORTS,
  type AgentTool,
  type ToolPolicy,
} from '@nocobase/agent-protocol';

import type { I18nText } from './i18n.js';

/** Where an agent comes from: discovered from what runners report, or kept by the application. */
export const AGENT_SOURCES = ['runner', 'system'] as const;

export type AgentSource = (typeof AGENT_SOURCES)[number];

/**
 * Whether an agent is offered work: `pending` (discovered, nobody enabled it yet), `enabled`, `disabled`. Only enabled
 * agents are offered work, mentioned or chatted with.
 */
export const AGENT_STATUSES = ['pending', 'enabled', 'disabled'] as const;

export type AgentStatus = (typeof AGENT_STATUSES)[number];

/** How long a tool and model may go unreported by every runner before its agent shows as having no runner. */
export const AGENT_UNREPORTED_AFTER_MS: number = 14 * 24 * 60 * 60_000;

/** When in a conversation an agent asks before changing data: every change, or only larger ones. */
export const CONFIRM_CHANGES = ['always', 'larger'] as const;

export type ConfirmChanges = (typeof CONFIRM_CHANGES)[number];

/**
 * An entry of an agent's list: a coding tool, its model (null: the tool's default) and its reasoning effort, one of the
 * tool's (`TOOL_EFFORTS`; null or absent: the tool's default).
 */
export interface RunnerModelEntry {
  readonly tool: AgentTool;
  readonly model: string | null;
  readonly effort?: string | null;
}

/** The most entries an agent's list holds. */
export const MAX_MODEL_ENTRIES = 20;

/** The reasoning efforts `entry`'s tool takes. */
export function effortsFor(entry: {
  readonly tool: AgentTool;
}): readonly string[] {
  return TOOL_EFFORTS[entry.tool] ?? [];
}

/** The coding tools an agent's entries name, in order and once each. */
export function entryTools(agent: {
  readonly modelEntries: readonly RunnerModelEntry[];
}): AgentTool[] {
  return [...new Set(agent.modelEntries.map((entry) => entry.tool))];
}

/** Whether two entries name the same tool and model, whatever their efforts. */
export function sameEntry(a: RunnerModelEntry, b: RunnerModelEntry): boolean {
  return a.tool === b.tool && (a.model ?? null) === (b.model ?? null);
}

export interface Agent {
  readonly id: string;
  /** As the model catalog names it (`Claude · Opus 5.5`), or as the application named its own. */
  readonly name: string;
  /** What it is good at: the project manager hands it work by this. Null until someone writes it. */
  readonly description: string | null;
  /** An application's own agent's name as an i18n reference, shown in the viewer's language in place of `name`. */
  readonly nameText: I18nText | null;
  readonly descriptionText: I18nText | null;
  /** An image URL; null shows the bot icon. */
  readonly avatar: string | null;
  readonly source: AgentSource;
  readonly status: AgentStatus;
  /** For an agent discovered from runners: its coding tool and its model, normalized. Null for the application's own. */
  readonly tool: AgentTool | null;
  readonly model: string | null;
  /**
   * The tools and models it works with, each with its reasoning effort, in order; the first is its default. Exactly one
   * for an agent discovered from runners; an application's own agent may have none until it is configured.
   */
  readonly modelEntries: readonly RunnerModelEntry[];
  /** The application's built-in instructions, the last layer of the brief. */
  readonly instructions: string | null;
  /** Business action keys the agent may perform, within what the person who woke it may do. */
  readonly actions: readonly string[];
  /** In conversations: whether it asks before every change or only before larger ones. */
  readonly confirmChanges: ConfirmChanges;
  readonly maxConcurrentRuns: number;
  readonly maxAttempts: number;
  /** Overrides of the default tool policy (`DEFAULT_TOOL_POLICY`). */
  readonly toolPolicy: Partial<ToolPolicy> | null;
  /** When a runner last reported its tool and model; null for the application's own. */
  readonly lastReportedAt: string | null;
  /**
   * Raised by every change (its good-at, its effort, enabling or disabling it). An edit names the revision it was made
   * against (`AgentPatch.expectedRevision`) and is refused with 409 when the agent changed since.
   */
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * Why an agent cannot take the caller's work now: `pending` and `disabled` (not enabled), `unreported` (no runner
 * reported its tool and model for `AGENT_UNREPORTED_AFTER_MS`), `notConfigured` (an application's own agent with no
 * tool and model yet), `noRunner` (no runner online that has it and would take the caller's work), `othersPersonal`
 * (only other people's personal runners have it).
 */
export const AGENT_UNUSABLE_REASONS = [
  'pending',
  'disabled',
  'unreported',
  'notConfigured',
  'noRunner',
  'othersPersonal',
] as const;

export type AgentUnusableReason = (typeof AGENT_UNUSABLE_REASONS)[number];

/** Where an agent can run now: the online runners that have its tool and model signed in and take its work. */
export interface AgentRunners {
  /** Online team runners: they take anyone's work. */
  readonly team: number;
  /** Online personal runners: each takes only its owner's work. */
  readonly personal: number;
  /** Of `personal`, the caller's own. */
  readonly mine: number;
  /** A few of their names, team runners first. */
  readonly names: readonly string[];
}

/** An agent as the Agent page lists it (`GET /api/agents`), for the caller. */
export interface AgentView extends Agent {
  readonly quota?: readonly QuotaLocation[];
  readonly discoveryKey?: string;
  readonly discoveryRevision?: number;
  readonly ignored?: boolean;
  /** Its default reasoning effort: its first entry's. */
  readonly effort: string | null;
  /** The efforts its tool takes, weakest first; empty for an application's own agent. */
  readonly efforts: readonly string[];
  /** A runner reported its tool and model within `AGENT_UNREPORTED_AFTER_MS`, or it is the application's own. */
  readonly reported: boolean;
  readonly runners: AgentRunners;
  /** Only personal runners have it: it takes the work of their owners only. */
  readonly personalOnly: boolean;
  /** Null when it could take the caller's work now; otherwise why not. */
  readonly unusable: AgentUnusableReason | null;
  /** Its runs that have not finished. */
  readonly busy: number;
  /** What the model catalog says it is good at, to start from when enabling it; null for a model it does not know. */
  readonly suggestion: { readonly en: string; readonly zh: string } | null;
  /** Whether the caller may change it: good-at, effort, enabled. */
  readonly canEdit: boolean;
}

/** An agent's name (`GET /api/agents/agentNames`): every agent there has been, for the runs that name it. */
export interface AgentName {
  readonly id: string;
  readonly name: string;
  readonly nameText: I18nText | null;
}

/** An agent the caller may give work to: what it is good at, and whether it can take work now. */
export interface AvailableAgent {
  readonly quota?: readonly QuotaLocation[];
  readonly runners?: AgentRunners;
  readonly id: string;
  readonly name: string;
  /** Its description. */
  readonly goodAt: string;
  /** Its coding tool and model. */
  readonly tool: AgentTool | null;
  readonly model: string | null;
  /** Whether it could start the caller's work now: an online runner that has it and would take the work. */
  readonly online: boolean;
  /** Only personal runners have it: it takes the work of their owners only. */
  readonly personalOnly: boolean;
  /** Its runs that have not finished. */
  readonly busy: number;
}

/**
 * What changing an agent takes (`PATCH /api/agents/:agentId`): what it is good at, its default reasoning effort and
 * whether it is enabled, with the revision the edit was made against. An agent is enabled only with a description.
 */
export interface AgentPatch {
  readonly description?: string | null;
  readonly effort?: string | null;
  readonly enabled?: boolean;
  readonly expectedRevision: number;
}

/**
 * Whether a tool's models can be created into agents right now, computed per model from the online runners currently
 * offering it (never an offline one, never another model's runner): `available` when at least one does; otherwise the
 * most actionable reason none does, read from their own reports (`ToolStatusReason`, bucketed: `notLoggedIn`,
 * `notConfigured` and the handshake-only `signInUnconfirmed` to `needsSetup`; `versionTooOld` unchanged; everything
 * else — `otherProgram`, `timeout`, `startFailed`, a legacy report with neither a reason nor a recognized status, or
 * no reason at all — to `failed`). A legacy runner's plain `status: 'needsLogin'`, reported before this field existed,
 * still buckets to `needsSetup`.
 */
export const MODEL_AVAILABILITY_STATUSES = [
  'available',
  'needsSetup',
  'versionTooOld',
  'failed',
] as const;

export type ModelAvailabilityStatus =
  (typeof MODEL_AVAILABILITY_STATUSES)[number];

/** How many of a group's or a row's runners can run it now, and a few of their names. */
export interface AvailableModelRunners {
  readonly ready: number;
  readonly total: number;
  readonly names: readonly string[];
}

/**
 * One coding tool in the enable dialog (`GET /api/agents/availableModels` without `tool`): how many models it has and
 * how many runners have it selected, its aggregated availability and, when unavailable, why — grouped so a tool with
 * hundreds of models (the discovery bug this replaced) reads as one row until someone opens it.
 */
export interface AvailableModelGroup {
  readonly tool: AgentTool;
  readonly modelCount: number;
  readonly runnerCount: number;
  readonly status: ModelAvailabilityStatus;
  /** The reason behind `status`, when it is not `available` and a runner gave one (protocol 13). */
  readonly statusReason?: string;
  /** A runner's own words about `statusReason`, redacted and bounded. */
  readonly statusDetail?: string;
  readonly recommendedCount: number;
}

/**
 * A tool and model a runner has reported, whether or not an agent exists for it yet (`GET /api/agents/availableModels`
 * with `tool`, replacing the discovery list a runner's report used to create one pending agent per combination for):
 * the enable dialog groups these by tool and lets someone create an agent from one that has none, instead of a
 * runner's report creating one for every model it lists.
 */
export interface AvailableModel {
  readonly tool: AgentTool;
  /** Normalized; empty for a tool that cannot list models (one entry stands for the whole tool). */
  readonly model: string;
  /** As the tool names it, when known and different from `model`. */
  readonly displayModel?: string;
  /** The agent already kept for this tool and model, if any. */
  readonly agentId: string | null;
  readonly status: AgentStatus | null;
  /** In the application's recommended list: a runner reporting it signed in creates and enables it on its own. */
  readonly recommended: boolean;
  /** What the model catalog or the application's own list says it is good at; null for a model neither knows. */
  readonly suggestion: { readonly en: string; readonly zh: string } | null;
  /** Its group's availability (`AvailableModelGroup.status`); unselectable to create unless `available`. */
  readonly availability: ModelAvailabilityStatus;
  /** The runners currently offering this exact model. */
  readonly runners: AvailableModelRunners;
}

/** What creating an agent from an available model takes (`POST /api/agents/runnerAgents`). */
export interface RunnerAgentCreateInput {
  readonly tool: AgentTool;
  readonly model: string;
  /** As the tool names it (`AvailableModel.displayModel`), for the agent's name; `model` itself when absent. */
  readonly displayModel?: string;
  /** What it is good at: required, as enabling any agent needs one. */
  readonly description: string;
  /** Its default reasoning effort, one of its tool's; the tool's default (`medium` when it takes one) when absent. */
  readonly effort?: string | null;
}

/**
 * A runner-discovered agent nobody enabled and that never ran (`GET /api/agents/cleanupCandidates` with `tool`): safe
 * for an administrator to remove outright, such as a batch a tool reporting far too many models created before the
 * application stopped creating one agent per reported model.
 */
export interface CleanupCandidate {
  readonly id: string;
  readonly name: string;
  readonly tool: AgentTool | null;
  readonly model: string | null;
  readonly createdAt: string;
}

/** One coding tool's cleanup candidates (`GET /api/agents/cleanupCandidates` without `tool`), for the cleanup drawer. */
export interface CleanupGroup {
  readonly tool: AgentTool | null;
  readonly count: number;
}

/** Paging shared by the available-model and cleanup-candidate row pages. */
export interface ListPageMeta {
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

/** `GET /api/agents/availableModels` without `tool`. */
export interface AvailableModelGroupsPage {
  readonly data: readonly AvailableModelGroup[];
  readonly meta: ListPageMeta;
}

/** `GET /api/agents/availableModels` with `tool`. */
export interface AvailableModelsPage {
  readonly data: readonly AvailableModel[];
  readonly meta: ListPageMeta;
}

/** `GET /api/agents/cleanupCandidates` without `tool`. */
export interface CleanupGroupsPage {
  readonly data: readonly CleanupGroup[];
  readonly meta: ListPageMeta;
}

/** `GET /api/agents/cleanupCandidates` with `tool`. */
export interface CleanupCandidatesPage {
  readonly data: readonly CleanupCandidate[];
  readonly meta: ListPageMeta;
}

/**
 * What the application keeps of an agent of its own (`AgentService.ensureSystem`): its fixed id, name, description,
 * instructions, actions and the tools and models it runs with (none until it is configured).
 */
export interface SystemAgentInput {
  readonly id: string;
  readonly name: string;
  readonly nameText?: I18nText | null;
  readonly description: string | null;
  readonly instructions: string | null;
  readonly actions: readonly string[];
  readonly modelEntries: readonly RunnerModelEntry[];
}

/** What a change to an agent was. */
export const AGENT_CHANGE_ACTIONS = [
  'created',
  'updated',
  'enabled',
  'disabled',
  'variables',
  // Recorded by earlier versions, which kept agents people configured.
  'archived',
  'restored',
] as const;

export type AgentChangeAction = (typeof AGENT_CHANGE_ACTIONS)[number];

/** The fields of an agent whose changes its history records, in the order the history shows them. */
export const AGENT_HISTORY_FIELDS = [
  'name',
  'description',
  'status',
  'modelEntries',
  'instructions',
  'actions',
] as const;

export type AgentHistoryField = (typeof AGENT_HISTORY_FIELDS)[number];

/**
 * One field that changed. A variable is a secret: it is named (`name`) with what happened to it (`change`), never with
 * its value. Entries recorded by earlier versions may name fields no longer listed here.
 */
export type AgentFieldChange =
  | {
      readonly field: string;
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
 * A business action the application lets agents perform (`GET /api/agents/actions`): the key its commands name, and
 * how it is shown.
 */
export interface AgentActionOption {
  /** The business action key the server stores, such as `crm.deals/comment`. */
  readonly key: string;
  /** What groups it, such as `crm.deals`. */
  readonly group: string;
  /** The label; the key when absent. */
  readonly title?: I18nText;
  /** The group's heading; the group when absent. */
  readonly groupTitle?: I18nText;
  /** One line saying what it lets the agent do. */
  readonly description?: I18nText;
  /** Given to every agent the runners report. */
  readonly defaultOn?: boolean;
  /** False for an action listed only to show where the boundary is: it is never granted. Grantable when absent. */
  readonly grantable?: boolean;
  /** Why it can never be granted to an agent, for a `grantable: false` action. */
  readonly reason?: I18nText;
}

/** A person, as pickers and audit lines show them (`GET /api/agents/users`). */
export interface UserRef {
  readonly id: string;
  readonly name: string;
}

/** The tool policy every agent runs with; an agent's `toolPolicy` overrides fields of it. */
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

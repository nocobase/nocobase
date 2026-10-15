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
  return TOOL_EFFORTS[entry.tool];
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

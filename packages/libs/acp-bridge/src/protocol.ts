/**
 * The wire protocol between an application's agent sessions and the bridge on a person's computer (`<cli> acp start`).
 *
 * The bridge speaks plain HTTP to the application: signed in as that person, it registers the computer and receives the
 * computer's own key, with which it then registers again, long-polls for commands and reports what its agents do
 * (`BRIDGE_HEADERS.computerKey`), however long the person's sign-in lasts. What an agent says is carried as the Agent Client Protocol's own
 * `session/update` payloads, so the application stores and renders ACP as it is. This module has no Node dependency:
 * the application's server and browser code read it too.
 */
import { z } from 'zod';

/** Raised on every incompatible change; the server answers a bridge speaking another version with `upgradeRequired`. */
export const BRIDGE_PROTOCOL_VERSION: number = 3;

/** Includes agent initialization and opening a prompt-free session. */
export const DISCOVERY_TIMEOUT_MS: number = 150_000;

/** The bridge's routes, relative to the application's address. */
export const BRIDGE_ROUTES: {
  readonly register: string;
  readonly poll: string;
  readonly report: string;
  readonly reply: string;
} = {
  register: '/api/agentSessions/bridge/register',
  poll: '/api/agentSessions/bridge/poll',
  report: '/api/agentSessions/bridge/report',
  reply: '/api/agentSessions/bridge/reply',
};

/** Request headers of the bridge. */
export const BRIDGE_HEADERS: { readonly computerKey: string } = {
  /** The key a computer received when its owner registered it (`RegisterResponse.key`). */
  computerKey: 'x-nocobase-computer-key',
};

/** How long a poll waits for a command before answering with none. */
export const POLL_WAIT_MS: number = 25_000;

/** A computer that has not polled for this long is offline. */
export const COMPUTER_OFFLINE_MS: number = 60_000;

/** The most events one report carries. */
export const MAX_EVENTS_PER_REPORT: number = 200;

/** Strings in an event are cut to this many characters. */
export const MAX_EVENT_TEXT: number = 32_768;

/** The most folders one listing carries. */
export const MAX_FOLDERS: number = 500;

const id = z.string().min(1).max(200);
const isoTime = z.string().min(1).max(40);
const record = z.record(z.string(), z.unknown());

/** One coding agent a computer can run, as the bridge found it. */
export interface AgentInfo {
  /** Stable across computers, such as `codex` or `opencode`. */
  readonly id: string;
  readonly name: string;
  /** The version its ACP `initialize` reported, or null before the bridge has asked. */
  readonly version: string | null;
  /** The values of the `mode` choice that give the agent full access: a new session opens in the first offered. */
  readonly modes?: readonly string[] | undefined;
  /**
   * Why it cannot start a session, absent when it can: `notInstalled` (no program found), or `failed` (the program did
   * not answer ACP `initialize`; `detail` says what it printed).
   */
  readonly problem?: 'notInstalled' | 'failed' | undefined;
  readonly detail?: string | undefined;
}

export const AgentInfoSchema: z.ZodType<AgentInfo> = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,39}$/u),
  name: z.string().min(1).max(100),
  version: z.string().max(100).nullable(),
  modes: z.array(id).max(10).optional(),
  problem: z.enum(['notInstalled', 'failed']).optional(),
  detail: z.string().max(2000).optional(),
});

export interface ComputerInfo {
  /** What its owner calls it; the host name unless they chose another. */
  readonly name: string;
  /** `process.platform` and `process.arch`. */
  readonly platform: string;
  readonly arch: string;
  /** The command line that runs the bridge and its version, such as `nb-studio 1.0.0`. */
  readonly host: string;
  /** The person's home directory there, which the application shows as `~`. */
  readonly home?: string | undefined;
  /** The absolute directories sessions may work in. */
  readonly roots: readonly string[];
  readonly agents: readonly AgentInfo[];
}

export const ComputerInfoSchema: z.ZodType<ComputerInfo> = z.object({
  name: z.string().min(1).max(200),
  platform: z.string().min(1).max(32),
  arch: z.string().min(1).max(32),
  host: z.string().min(1).max(200),
  home: z.string().min(1).max(1000).optional(),
  roots: z.array(z.string().min(1).max(1000)).max(20),
  agents: z.array(AgentInfoSchema).max(50),
});

export interface RegisterRequest {
  readonly protocol: number;
  /** The id an earlier registration of this computer received, or null for a new computer. */
  readonly computerId: string | null;
  /** When this run of the bridge started: another run than the last one ends what the computer's sessions did. */
  readonly bridgeStartedAt: string;
  readonly computer: ComputerInfo;
}

export const RegisterRequestSchema: z.ZodType<RegisterRequest> = z.object({
  protocol: z.number().int().positive(),
  computerId: id.nullable(),
  bridgeStartedAt: isoTime,
  computer: ComputerInfoSchema,
});

export interface RegisterResponse {
  readonly computerId: string;
  /**
   * The computer's key, when its owner registered it signed in: the bridge sends it from then on instead of the
   * person's credentials. It does not expire; removing the computer, or registering it signed in again, revokes it.
   */
  readonly key?: string | undefined;
}

/** Where a session works and what it continues. */
export interface SessionTarget {
  readonly id: string;
  readonly agentId: string;
  readonly cwd: string;
  /** The agent's own session id once it has one; a session without one starts a new conversation. */
  readonly acpSessionId: string | null;
  /** The choices the person made (`SessionChoice` id to value), applied again whenever the session reopens. */
  readonly settings: Readonly<Record<string, string>>;
}

const SessionTargetSchema: z.ZodType<SessionTarget> = z.object({
  id,
  agentId: z.string().min(1).max(40),
  cwd: z.string().min(1).max(1000),
  acpSessionId: id.nullable(),
  settings: z.record(id, id),
});

/** A part of what a person sends, as ACP content blocks. */
export type PromptContent =
  | { readonly type: 'text'; readonly text: string }
  | {
      readonly type: 'image';
      readonly mimeType: string;
      readonly data: string;
    };

export const PromptContentSchema: z.ZodType<PromptContent> =
  z.discriminatedUnion('type', [
    z.object({ type: z.literal('text'), text: z.string().min(1).max(100_000) }),
    z.object({
      type: z.literal('image'),
      mimeType: z.string().regex(/^image\/[a-z0-9.+-]+$/u),
      data: z.string().min(1).max(14_000_000),
    }),
  ]);

/**
 * What a transcript keeps of a message the person sent: its text, and each image as sent (`data`) or, once the
 * application stored the image apart, the name it serves it under (`file`).
 */
export type PromptPart =
  | { readonly type: 'text'; readonly text: string }
  | {
      readonly type: 'image';
      readonly mimeType: string;
      readonly data?: string;
      readonly file?: string;
    };

/** What the application asks of the bridge: session commands name their target in full; discovery and folders use correlated replies. */
export type BridgeCommand =
  | {
      readonly type: 'discoverChoices';
      readonly requestId: string;
      readonly agentId: string;
      readonly cwd: string;
      readonly settings: Readonly<Record<string, string>>;
    }
  | {
      readonly type: 'prompt';
      readonly session: SessionTarget;
      readonly promptId: string;
      readonly content: readonly PromptContent[];
    }
  | { readonly type: 'cancel'; readonly session: SessionTarget }
  | {
      readonly type: 'permission';
      readonly session: SessionTarget;
      readonly requestId: string;
      /** The option the person chose, or null to decline. */
      readonly optionId: string | null;
    }
  | {
      /** Changes one of the session's choices, its mode among them. */
      readonly type: 'choose';
      readonly session: SessionTarget;
      readonly choiceId: string;
      readonly value: string;
    }
  | { readonly type: 'close'; readonly sessionId: string }
  | {
      /** Lists the folders in `path`, for a person choosing one; the bridge answers with a reply. */
      readonly type: 'listFolders';
      readonly requestId: string;
      readonly path: string;
    };

export const BridgeCommandSchema: z.ZodType<BridgeCommand> =
  z.discriminatedUnion('type', [
    z.object({
      type: z.literal('discoverChoices'),
      requestId: id,
      agentId: z.string().min(1).max(40),
      cwd: z.string().min(1).max(1000),
      settings: z.record(id, id),
    }),
    z.object({
      type: z.literal('prompt'),
      session: SessionTargetSchema,
      promptId: id,
      content: z.array(PromptContentSchema).min(1).max(20),
    }),
    z.object({ type: z.literal('cancel'), session: SessionTargetSchema }),
    z.object({
      type: z.literal('permission'),
      session: SessionTargetSchema,
      requestId: id,
      optionId: id.nullable(),
    }),
    z.object({
      type: z.literal('choose'),
      session: SessionTargetSchema,
      choiceId: id,
      value: id,
    }),
    z.object({ type: z.literal('close'), sessionId: id }),
    z.object({
      type: z.literal('listFolders'),
      requestId: id,
      path: z.string().min(1).max(1000),
    }),
  ]);

export interface PollRequest {
  readonly computerId: string;
  /** Wait up to `POLL_WAIT_MS` for a command instead of answering at once. */
  readonly wait: boolean;
}

export const PollRequestSchema: z.ZodType<PollRequest> = z.object({
  computerId: id,
  wait: z.boolean(),
});

export interface PollResponse {
  readonly commands: readonly BridgeCommand[];
}

/** One option of a permission request, as ACP offers it. */
export interface PermissionOption {
  readonly optionId: string;
  readonly name: string;
  /** `allow_once`, `allow_always`, `reject_once` or `reject_always`. */
  readonly kind: string;
}

const PermissionOptionSchema: z.ZodType<PermissionOption> = z.object({
  optionId: id,
  name: z.string().min(1).max(200),
  kind: z.string().min(1).max(40),
});

/** Tokens one turn used, as `session/prompt` reported them. */
export interface TurnUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cachedReadTokens?: number | undefined;
  readonly cachedWriteTokens?: number | undefined;
  readonly thoughtTokens?: number | undefined;
  readonly totalTokens?: number | undefined;
}

const count = z.number().int().nonnegative();

const TurnUsageSchema: z.ZodType<TurnUsage> = z.object({
  inputTokens: count,
  outputTokens: count,
  cachedReadTokens: count.optional(),
  cachedWriteTokens: count.optional(),
  thoughtTokens: count.optional(),
  totalTokens: count.optional(),
});

/**
 * What happened in a session. The bridge reports all but `prompt` and `link`, which the application writes itself:
 *
 * - `prompt`: what the person sent; the turn that answers it starts with `turnStarted` naming the same `promptId`.
 * - `update`: one ACP `session/update`, as the agent sent it (streamed text arrives merged into fewer updates).
 * - `turnEnded`: the turn's stop reason and usage, or the error that ended it.
 * - `permissionRequested` / `permissionResolved`: the agent asking before a tool call, and how it was answered.
 * - `notice`: something the bridge has to say, such as an agent that could not start.
 * - `link`: the application tied something to the session, such as an issue the agent created.
 */
export type SessionEvent =
  | {
      readonly kind: 'prompt';
      readonly at: string;
      readonly promptId: string;
      readonly content: readonly PromptPart[];
    }
  | {
      readonly kind: 'update';
      readonly at: string;
      readonly update: Readonly<Record<string, unknown>>;
    }
  | {
      readonly kind: 'turnStarted';
      readonly at: string;
      readonly promptId: string;
    }
  | {
      readonly kind: 'turnEnded';
      readonly at: string;
      readonly promptId: string;
      readonly stopReason: string | null;
      readonly usage: TurnUsage | null;
      readonly error: string | null;
    }
  | {
      readonly kind: 'permissionRequested';
      readonly at: string;
      readonly requestId: string;
      readonly toolCall: Readonly<Record<string, unknown>>;
      readonly options: readonly PermissionOption[];
    }
  | {
      readonly kind: 'permissionResolved';
      readonly at: string;
      readonly requestId: string;
      readonly optionId: string | null;
      /** `answered` by a person, or `cancelled` because the turn ended first, or `timedOut`. */
      readonly reason: 'answered' | 'cancelled' | 'timedOut';
    }
  | {
      readonly kind: 'notice';
      readonly at: string;
      readonly level: 'error' | 'warning';
      readonly message: string;
    }
  | {
      readonly kind: 'link';
      readonly at: string;
      readonly linkKind: string;
      readonly refId: string;
    };

/** The events a bridge may report. */
export type BridgeEvent = Exclude<
  SessionEvent,
  { readonly kind: 'prompt' } | { readonly kind: 'link' }
>;

export const BridgeEventSchema: z.ZodType<BridgeEvent> = z.discriminatedUnion(
  'kind',
  [
    z.object({
      kind: z.literal('update'),
      at: isoTime,
      update: record.refine(
        (value) => typeof value.sessionUpdate === 'string',
        'sessionUpdate is required',
      ),
    }),
    z.object({ kind: z.literal('turnStarted'), at: isoTime, promptId: id }),
    z.object({
      kind: z.literal('turnEnded'),
      at: isoTime,
      promptId: id,
      stopReason: z.string().max(40).nullable(),
      usage: TurnUsageSchema.nullable(),
      error: z.string().max(MAX_EVENT_TEXT).nullable(),
    }),
    z.object({
      kind: z.literal('permissionRequested'),
      at: isoTime,
      requestId: id,
      toolCall: record,
      options: z.array(PermissionOptionSchema).max(10),
    }),
    z.object({
      kind: z.literal('permissionResolved'),
      at: isoTime,
      requestId: id,
      optionId: id.nullable(),
      reason: z.enum(['answered', 'cancelled', 'timedOut']),
    }),
    z.object({
      kind: z.literal('notice'),
      at: isoTime,
      level: z.enum(['error', 'warning']),
      message: z.string().min(1).max(MAX_EVENT_TEXT),
    }),
  ],
);

/**
 * A choice a session offers, such as its mode, model or reasoning effort: one of the agent's ACP configuration options,
 * or its session modes as the choice `mode` when it offers no configuration options.
 */
export interface SessionChoice {
  readonly id: string;
  readonly name: string;
  /** `mode`, `model`, `thought_level` or another category the agent names. */
  readonly category?: string | undefined;
  readonly currentValue: string;
  readonly options: readonly {
    readonly value: string;
    readonly name: string;
    readonly description?: string | undefined;
  }[];
}

const SessionChoiceSchema: z.ZodType<SessionChoice> = z.object({
  id,
  name: z.string().min(1).max(200),
  category: z.string().max(40).optional(),
  currentValue: id,
  options: z
    .array(
      z.object({
        value: id,
        name: z.string().min(1).max(200),
        description: z.string().max(1000).optional(),
      }),
    )
    .max(200),
});

/** Empty available choices and an unsupported configuration surface are distinct. */
export interface DiscoveredChoices {
  readonly status: 'available' | 'unsupported';
  readonly choices: readonly SessionChoice[];
}

export const DiscoveredChoicesSchema: z.ZodType<DiscoveredChoices> = z.object({
  status: z.enum(['available', 'unsupported']),
  choices: z.array(SessionChoiceSchema).max(20),
});

/** What a session is now: the agent's own id for it, and what it offers. */
export interface SessionState {
  readonly acpSessionId: string;
  /** The agent's name and version, as `initialize` reported them. */
  readonly agent: string;
  readonly choices: readonly SessionChoice[];
  /** The slash commands it offers. */
  readonly commands: readonly {
    readonly name: string;
    readonly description: string;
  }[];
  /** The title the agent gave the session, if any. */
  readonly title: string | null;
  /** Context window use and what the session has cost so far, from the latest `usage_update`. */
  readonly context: {
    readonly used: number;
    readonly size: number;
    readonly cost?:
      { readonly amount: number; readonly currency: string } | undefined;
  } | null;
}

export const SessionStateSchema: z.ZodType<SessionState> = z.object({
  acpSessionId: id,
  agent: z.string().max(200),
  choices: z.array(SessionChoiceSchema).max(20),
  commands: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        description: z.string().max(2000),
      }),
    )
    .max(200),
  title: z.string().max(500).nullable(),
  context: z
    .object({
      used: count,
      size: count,
      cost: z
        .object({
          amount: z.number().nonnegative(),
          currency: z.string().min(1).max(10),
        })
        .optional(),
    })
    .nullable(),
});

export interface ReportRequest {
  readonly computerId: string;
  readonly sessionId: string;
  /** Increases with every report of the session from this bridge; a report the server has seen is ignored. */
  readonly batch: number;
  /** When the bridge started, so a restarted bridge's batches are not taken for repeats. */
  readonly bridgeStartedAt: string;
  readonly events: readonly BridgeEvent[];
  readonly state: SessionState | null;
}

export const ReportRequestSchema: z.ZodType<ReportRequest> = z.object({
  computerId: id,
  sessionId: id,
  batch: z.number().int().positive(),
  bridgeStartedAt: isoTime,
  events: z.array(BridgeEventSchema).max(MAX_EVENTS_PER_REPORT),
  state: SessionStateSchema.nullable(),
});

export interface ReportResponse {
  /** False when the session is gone or closed: the bridge stops its agent. */
  readonly open: boolean;
}

/** The folders in one directory of the computer. */
export interface FolderListing {
  /** The directory listed, absolute. */
  readonly path: string;
  /** Its folders' names, sorted; hidden ones are left out. */
  readonly folders: readonly string[];
  /** It holds more than `MAX_FOLDERS` folders, and the rest are left out. */
  readonly truncated: boolean;
}

const FolderListingSchema: z.ZodType<FolderListing> = z.object({
  path: z.string().min(1).max(1000),
  folders: z.array(z.string().min(1).max(1000)).max(MAX_FOLDERS),
  truncated: z.boolean(),
});

/** The bridge's answer to a command that asks for one, such as `listFolders`: what it found, or why it could not. */
export interface ReplyRequest {
  readonly computerId: string;
  readonly requestId: string;
  readonly listing: FolderListing | null;
  readonly discovery?: DiscoveredChoices | null | undefined;
  readonly error: string | null;
}

export const ReplyRequestSchema: z.ZodType<ReplyRequest> = z.object({
  computerId: id,
  requestId: id,
  listing: FolderListingSchema.nullable(),
  discovery: DiscoveredChoicesSchema.nullable().optional(),
  error: z.string().max(2000).nullable(),
});

type Update = Readonly<Record<string, unknown>>;

/** Joins consecutive pieces of one streamed message, and consecutive updates of one tool call, into one update. */
export function coalesce<T extends SessionEvent>(events: readonly T[]): T[] {
  const joined: T[] = [];
  for (const event of events) {
    const last = joined.at(-1);
    const merged =
      last?.kind === 'update' && event.kind === 'update'
        ? joinUpdates(last.update, event.update)
        : undefined;
    if (merged && last?.kind === 'update')
      joined[joined.length - 1] = { ...last, update: merged };
    else joined.push(event);
  }
  return joined;
}

const CHUNKS = new Set([
  'agent_message_chunk',
  'agent_thought_chunk',
  'user_message_chunk',
]);

/**
 * One update for two consecutive ones that belong together: two pieces of one streamed message, or two updates of one
 * tool call; undefined when they do not, or when the result would be longer than `MAX_EVENT_TEXT`.
 */
export function joinUpdates(first: Update, second: Update): Update | undefined {
  const kind = first.sessionUpdate;
  if (kind !== second.sessionUpdate) return undefined;
  if (
    typeof kind === 'string' &&
    CHUNKS.has(kind) &&
    first.messageId === second.messageId
  ) {
    const a = textOf(first.content);
    const b = textOf(second.content);
    if (
      a === undefined ||
      b === undefined ||
      a.length + b.length > MAX_EVENT_TEXT
    )
      return undefined;
    return { ...first, content: { type: 'text', text: a + b } };
  }
  if (kind === 'tool_call_update' && first.toolCallId === second.toolCallId) {
    // Codex streams a command's output as `_meta.terminal_output_delta` pieces; the rest of an update replaces.
    const a = deltaOf(first);
    const b = deltaOf(second);
    if (
      a !== undefined &&
      b !== undefined &&
      a.length + b.length > MAX_EVENT_TEXT
    )
      return undefined;
    const merged: Record<string, unknown> = { ...first, ...second };
    if (a !== undefined && b !== undefined) {
      const meta = second._meta as Record<string, unknown>;
      merged._meta = {
        ...meta,
        terminal_output_delta: {
          ...(meta.terminal_output_delta as object),
          data: a + b,
        },
      };
    }
    return merged;
  }
  return undefined;
}

function textOf(content: unknown): string | undefined {
  const block = content as { type?: unknown; text?: unknown } | undefined;
  return block?.type === 'text' && typeof block.text === 'string'
    ? block.text
    : undefined;
}

function deltaOf(update: Update): string | undefined {
  const delta = (
    update._meta as { terminal_output_delta?: { data?: unknown } } | undefined
  )?.terminal_output_delta;
  return typeof delta?.data === 'string' ? delta.data : undefined;
}

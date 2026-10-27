/**
 * What the agent sessions API answers, read by the server and the browser alike. The transcript and the session's
 * state are the bridge protocol's own (`@nocobase/acp-bridge/protocol`): ACP as the agent sent it.
 */
import type {
  AgentInfo,
  SessionChoice,
  SessionEvent,
  SessionStartup,
  SessionState,
} from '@nocobase/acp-bridge/protocol';

export type {
  DiscoveredChoices,
  AgentInfo,
  FolderListing,
  PromptContent,
  PromptPart,
  SessionChoice,
  SessionEvent,
  SessionStartup,
  SessionState,
} from '@nocobase/acp-bridge/protocol';

/** Where the session's page loads an image the transcript names by `file`, under the application's API. */
export function imagePath(sessionId: string, file: string): string {
  return `/api/agentSessions/sessions/${encodeURIComponent(sessionId)}/images/${encodeURIComponent(file)}`;
}

/** One of the viewer's computers. */
export interface Computer {
  readonly id: string;
  readonly name: string;
  readonly platform: string;
  readonly arch: string;
  /** The command line that runs its bridge, with its version. */
  readonly host: string;
  /** The person's home directory there, shown as `~`; null when its bridge does not say. */
  readonly home: string | null;
  readonly roots: readonly string[];
  readonly agents: readonly AgentInfo[];
  /** Historical choices from the latest session; new sessions discover their own choices. */
  readonly choices: Readonly<Record<string, readonly SessionChoice[]>>;
  /** The slash commands each agent offered in its latest session here, by agent id, for a new session. */
  readonly commands: Readonly<Record<string, SessionState['commands']>>;
  /** The directories sessions here may work in: those its owner chose under `roots`, else `roots`. */
  readonly folders: readonly string[];
  /** Whether `folders` are all of `roots`, its owner having chosen none. */
  readonly defaultFolders: boolean;
  /** Whether its bridge polled within the last minute. */
  readonly online: boolean;
  readonly lastSeenAt: string;
  readonly createdAt: string;
  /** Present while its bridge was lately refused for speaking an older protocol: its command line needs an update. */
  readonly outdatedBridge?: OutdatedBridge;
}

/** A computer's bridge the application refused because it speaks an older protocol. */
export interface OutdatedBridge {
  /** The command line that ran it, with its version, such as `nb-studio 1.0.0`. */
  readonly host: string;
  readonly bridgeProtocol: number;
  /** The protocol the application speaks. */
  readonly protocol: number;
  readonly refusedAt: string;
}

/**
 * A status's shape: not started (a dashed ring), started (half filled), blocked (a pause), in review (three quarters),
 * done (a check) and closed without being done (a cross).
 */
export const SESSION_LINK_ICONS = [
  'backlog',
  'started',
  'blocked',
  'review',
  'done',
  'closed',
] as const;
export type SessionLinkIcon = (typeof SESSION_LINK_ICONS)[number];

/** How something tied to a session stands, as the application that owns it says. */
export interface SessionLink {
  readonly kind: string;
  readonly refId: string;
  /** Its short identifier, such as an issue's `ST-58`, shown apart from its title. */
  readonly key: string | null;
  readonly title: string;
  /** What to show it under, such as its project. */
  readonly group: string | null;
  readonly status: {
    readonly label: string;
    /**
     * `attention` when it waits for the viewer, `active` while work goes on, `done` once finished. Drawn only for a
     * link without `icon`, as older applications and stored data give it.
     */
    readonly tone: 'idle' | 'active' | 'attention' | 'done';
    /** The shape and colour of its status (`SessionLinkIcon`), the same wherever the application draws it. */
    readonly icon?: SessionLinkIcon;
    /** What it waits on the viewer for, such as "Waiting for you to accept"; null or absent when it waits for nothing. */
    readonly needsYou?: string | null;
  } | null;
  /** Where the application shows it, relative to the application's routes. */
  readonly href: string | null;
  /** Whether the work on it can start from the session, as the application says. */
  readonly startable: boolean;
  /** When the session's owner started the work on it from the session, or chose not to; null while that waits. */
  readonly decidedAt: string | null;
}

/** A project a session works for, as the application names its projects. */
export interface SessionProject {
  readonly id: string;
  readonly name: string;
}

/** Something a person can mention in a message with `#`, such as an issue, found by the application. */
export interface Reference {
  readonly kind: string;
  readonly refId: string;
  readonly key: string | null;
  readonly title: string;
  readonly group: string | null;
  readonly status: SessionLink['status'];
}

export interface Session {
  readonly id: string;
  readonly computerId: string;
  readonly agentId: string;
  readonly cwd: string;
  /** Its owner's title, else the agent's, else its first message. */
  readonly title: string;
  readonly titleSource: 'owner' | 'agent' | 'message';
  readonly state: SessionState | null;
  /** What the bridge is doing to open its agent, null once it is open. */
  readonly startup: SessionStartup | null;
  /** The choices its owner made, by `SessionChoice` id. */
  readonly settings: Readonly<Record<string, string>>;
  /** A turn is running. */
  readonly running: boolean;
  /** A permission request waits for its owner. */
  readonly waiting: boolean;
  /** Whether its computer is connected; false once the computer is removed. */
  readonly computerOnline: boolean;
  readonly lastSeq: number;
  /** Committed read position; permissions are independent of reading. */
  readonly seenSeq: number;
  /** The project it works for, when its owner chose one. */
  readonly project: SessionProject | null;
  readonly links: readonly SessionLink[];
  readonly archivedAt: string | null;
  readonly lastActivityAt: string;
  readonly createdAt: string;
}

/** One entry of a session's transcript. */
export type TranscriptEvent = SessionEvent & { readonly seq: number };

/** The realtime topic that tells the viewer's pages what changed; they read the change through the API. */
export const AGENT_SESSIONS_TOPIC: string = 'agent-sessions';

export type AgentSessionsChange =
  | {
      readonly kind: 'session';
      readonly sessionId: string;
      readonly lastSeq: number;
    }
  | { readonly kind: 'computers' };

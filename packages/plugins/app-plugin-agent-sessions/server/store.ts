/**
 * The plugin's collections and the reads and writes on them. Only `service.ts` calls these; it decides who may.
 *
 * Every write to a session's transcript first writes the session's row (`lockSession`), so concurrent writers of one
 * session wait there and each event gets the next `seq`.
 */
import { randomUUID } from 'node:crypto';

import { createRedactor, type Redactor } from '@nocobase/agent-protocol';
import type { DatabaseConnection, Repository } from '@nocobase/db';

import type {
  AgentInfo,
  Computer,
  Session,
  SessionChoice,
  SessionEvent,
  SessionLink,
  SessionProject,
  SessionStartup,
  SessionState,
  TranscriptEvent,
} from '../shared/api.js';
import type { WorkSnapshot } from './work.js';
import {
  COMPUTER_OFFLINE_MS,
  joinUpdates,
  type BridgeCommand,
} from '@nocobase/acp-bridge/protocol';

/** Removes secrets from what is stored: transcripts, titles and the agent's state. */
export const redactor: Redactor = createRedactor();

export interface ComputerRecord {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly platform: string;
  readonly arch: string;
  readonly host: string;
  readonly home: string | null;
  readonly roots: readonly string[];
  readonly agents: readonly AgentInfo[];
  readonly choices: Readonly<Record<string, readonly SessionChoice[]>>;
  readonly commands: Readonly<Record<string, SessionState['commands']>>;
  readonly folders: readonly string[] | null;
  /** The SHA-256 of the key its bridge authenticates with, or null before its owner registered it with one. */
  readonly keyHash: string | null;
  /** When the run of the bridge that last registered it started. */
  readonly bridgeStartedAt: string | null;
  readonly lastSeenAt: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface SessionRecord {
  readonly id: string;
  readonly userId: string;
  readonly computerId: string;
  readonly agentId: string;
  readonly projectId: string | null;
  readonly cwd: string;
  readonly title: string | null;
  readonly firstMessage: string;
  readonly acpSessionId: string | null;
  readonly state: SessionState | null;
  /** What the bridge last said it is doing to open the agent, null once it is open (`SessionStartup`). */
  readonly startup: SessionStartup | null;
  readonly settings: Readonly<Record<string, string>>;
  /** What its agent was last told about the work tied to it (`work.ts`). */
  readonly toldWork: WorkSnapshot | null;
  /** The hash of the application's instructions its agent was told (`instructionsHash`). */
  readonly toldInstructions: string | null;
  /** The last event its owner saw, and the last they were told of until they see it (`notices.ts`). */
  readonly seenSeq: number;
  readonly noticedSeq: number | null;
  /** The interface language supplied with its owner's latest message. */
  readonly locale: string | null;
  readonly running: boolean;
  readonly pendingPermissions: number;
  readonly lastSeq: number;
  readonly reportedBatch: number;
  readonly bridgeStartedAt: string | null;
  readonly archivedAt: string | null;
  readonly lastActivityAt: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface EventRecord {
  readonly id: string;
  readonly sessionId: string;
  readonly seq: number;
  readonly kind: string;
  readonly data: Readonly<Record<string, unknown>>;
  readonly createdAt: string;
}

interface CommandRecord {
  readonly id: string;
  readonly computerId: string;
  readonly command: BridgeCommand;
  readonly createdAt: string;
}

export interface LinkRecord {
  readonly id: string;
  readonly sessionId: string;
  readonly kind: string;
  readonly refId: string;
  readonly seq: number;
  readonly decidedAt: string | null;
  readonly createdAt: string;
}

export const computers = (
  conn: DatabaseConnection,
): Repository<ComputerRecord> =>
  conn.repository<ComputerRecord>('agentSessionComputers');
export const sessions = (conn: DatabaseConnection): Repository<SessionRecord> =>
  conn.repository<SessionRecord>('agentSessions');
export const events = (conn: DatabaseConnection): Repository<EventRecord> =>
  conn.repository<EventRecord>('agentSessionEvents');
const commands = (conn: DatabaseConnection): Repository<CommandRecord> =>
  conn.repository<CommandRecord>('agentSessionCommands');
export const links = (conn: DatabaseConnection): Repository<LinkRecord> =>
  conn.repository<LinkRecord>('agentSessionLinks');
export const images = (conn: DatabaseConnection): Repository<ImageRecord> =>
  conn.repository<ImageRecord>('agentSessionImages');

/** An image sent in a session, stored through the file plugin (`images.ts`). */
export interface ImageRecord {
  readonly id: string;
  readonly disk: string;
  readonly key: string;
  readonly mimeType: string;
  readonly sessionId: string;
  readonly userId: string;
}

export function isOnline(
  computer: Pick<ComputerRecord, 'lastSeenAt'> | undefined,
  now: number,
): boolean {
  return (
    computer !== undefined &&
    now - Date.parse(computer.lastSeenAt) < COMPUTER_OFFLINE_MS
  );
}

export function computerView(record: ComputerRecord, now: number): Computer {
  return {
    id: record.id,
    name: record.name,
    platform: record.platform,
    arch: record.arch,
    host: record.host,
    home: record.home,
    roots: record.roots,
    agents: record.agents,
    choices: record.choices,
    commands: record.commands,
    folders: allowedFolders(record),
    defaultFolders: record.folders === null,
    online: isOnline(record, now),
    lastSeenAt: record.lastSeenAt,
    createdAt: record.createdAt,
  };
}

/** The directories sessions on the computer may work in: those its owner chose, else all its bridge allows. */
export function allowedFolders(
  computer: Pick<ComputerRecord, 'folders' | 'roots'>,
): readonly string[] {
  return computer.folders ?? computer.roots;
}

export function sessionView(
  record: SessionRecord,
  context: {
    readonly computer: ComputerRecord | undefined;
    readonly links: readonly SessionLink[];
    readonly project: SessionProject | null;
    readonly now: number;
  },
): Session {
  const agentTitle = record.state?.title?.trim();
  return {
    id: record.id,
    computerId: record.computerId,
    agentId: record.agentId,
    cwd: record.cwd,
    title: record.title ?? (agentTitle || record.firstMessage),
    titleSource: record.title ? 'owner' : agentTitle ? 'agent' : 'message',
    state: record.state,
    startup: record.startup ?? null,
    settings: record.settings,
    running: Boolean(record.running),
    waiting: Number(record.pendingPermissions) > 0,
    computerOnline: isOnline(context.computer, context.now),
    lastSeq: Number(record.lastSeq),
    project: context.project,
    links: context.links,
    archivedAt: record.archivedAt,
    lastActivityAt: record.lastActivityAt,
    createdAt: record.createdAt,
  };
}

/** Writes the session's row first, so concurrent writers of the session wait; the row as it is now. */
export async function lockSession(
  conn: DatabaseConnection,
  id: string,
  now: string,
): Promise<SessionRecord | undefined> {
  const { updatedCount } = await sessions(conn).updateMany({
    filter: { id },
    values: { updatedAt: now },
  });
  return updatedCount === 1
    ? sessions(conn).findOne({ filter: { id } })
    : undefined;
}

/**
 * Appends events to a session locked by the caller, numbering them on from its `lastSeq`; the new `lastSeq`. A piece
 * of a streamed message that continues the session's last event grows that event instead, so a reader reads on from
 * its last event rather than after it. Secrets are redacted before anything is stored.
 */
export async function appendEvents(
  conn: DatabaseConnection,
  session: SessionRecord,
  appended: readonly SessionEvent[],
  now: string,
  submission?: { readonly id: string; readonly digest: string },
): Promise<number> {
  const base = Number(session.lastSeq);
  const head = appended[0];
  if (head?.kind === 'update' && base > 0) {
    const last = await events(conn).findOne({
      filter: { sessionId: session.id, seq: base },
    });
    const update =
      last?.kind === 'update'
        ? (last.data.update as Readonly<Record<string, unknown>>)
        : undefined;
    const joined = update ? joinUpdates(update, head.update) : undefined;
    if (last && joined) {
      // Redacted again whole, for a secret split between two pieces.
      const data = { ...last.data, update: redactor.value(joined) };
      await events(conn).updateMany({
        filter: { id: last.id },
        values: { data },
      });
      return appendEvents(conn, session, appended.slice(1), now);
    }
  }
  const [first, ...rest] = appended
    .map(redacted)
    .map(({ kind, ...data }, index) => ({
      id: index === 0 && submission ? submission.id : randomUUID(),
      sessionId: session.id,
      seq: base + index + 1,
      kind,
      data:
        index === 0 && submission
          ? { ...data, _submission: submission.digest }
          : data,
      createdAt: now,
    }));
  if (first) await events(conn).createMany({ values: [first, ...rest] });
  return base + appended.length;
}

/** The session's events after `after`, at most `limit`, oldest first. */
export async function readEvents(
  conn: DatabaseConnection,
  sessionId: string,
  after: number,
  limit: number,
): Promise<TranscriptEvent[]> {
  const rows = await events(conn).findMany({
    filter: (f) =>
      f.and([f.string('sessionId').eq(sessionId), f.number('seq').gt(after)]),
    sort: (sort) => sort.field('seq').asc(),
    limit,
  });
  return rows.map(eventView);
}

/** Internal submission metadata never enters public transcripts or bridge commands. */
export function eventView(row: EventRecord): TranscriptEvent {
  const { _submission: _internal, ...data } = row.data;
  return {
    ...data,
    kind: row.kind,
    seq: Number(row.seq),
  } as TranscriptEvent;
}

export async function enqueue(
  conn: DatabaseConnection,
  computerId: string,
  command: BridgeCommand,
  now: string,
): Promise<void> {
  await commands(conn).createOne({
    values: { id: randomUUID(), computerId, command, createdAt: now },
  });
}

/** Takes the computer's waiting commands away, oldest first. */
export async function takeCommands(
  conn: DatabaseConnection,
  computerId: string,
): Promise<BridgeCommand[]> {
  const waiting = await commands(conn).findMany({
    filter: { computerId },
    sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
    limit: 50,
  });
  if (waiting.length === 0) return [];
  await commands(conn).deleteMany({
    filter: (f) => f.or(waiting.map((row) => f.string('id').eq(row.id))),
  });
  return waiting.map((row) => row.command);
}

/** The event with the secrets in its text removed (`createRedactor`'s patterns); a prompt's images are kept as sent. */
function redacted(event: SessionEvent): SessionEvent {
  if (event.kind !== 'prompt') return redactor.value(event);
  return {
    ...event,
    content: event.content.map((part) =>
      part.type === 'text' ? { ...part, text: redactor.text(part.text) } : part,
    ),
  };
}

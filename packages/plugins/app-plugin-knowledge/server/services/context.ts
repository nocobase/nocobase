/**
 * What every part of the knowledge base shares: the database, ids, the clock, the application's access resolver, the
 * events it announces once a change commits, and the work that follows a commit (a file's text to extract, a file no
 * longer needed to delete).
 *
 * Access is decided before a transaction opens: on SQLite a transaction holds the one connection there is, and the
 * application's resolver reads through its own. Inside a transaction only the transaction's connection is used.
 */
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';

import {
  chunkingOf,
  DEFAULT_CHUNKING,
  type KnowledgeChunking,
  type SpaceRef,
} from '../../shared/knowledge.js';
import type { KnowledgeAccessResolver } from './access.js';
import { fileUrls, type FileUrls } from './file-info.js';
import type { ProposalRecord } from './store.js';
import { createSubjects, type KnowledgeSubjects } from './subjects.js';
import { DEFAULT_SETTINGS, type KnowledgeSettingsSource } from './tuning.js';

export type KnowledgeEvent =
  /** A document has a new version (created, edited, or a proposal accepted). */
  | {
      readonly type: 'doc.versioned';
      readonly docId: string;
      readonly version: number;
      readonly space: SpaceRef;
    }
  /**
   * An entry moved, was renamed (a folder), archived or restored, marked verified, had its permissions changed, or its
   * file's text parsed.
   */
  | { readonly type: 'doc.changed'; readonly docId: string }
  /**
   * The sections search reads of an entry changed: an article's new version, a file's text extracted (or emptied while
   * its new version is parsed), or the entry archived (its sections leave search) or restored (they return). Sections
   * are rewritten with new ids each time, and keep the entry's access key: when that changes (its permissions, or a
   * move), this is announced too, with the sections unchanged. What an index of its own (a vector index) re-reads with
   * `chunksOf`, which answers none for an archived entry.
   */
  | {
      readonly type: 'chunks.changed';
      readonly docId: string;
      readonly version: number;
      readonly spaceId: string;
      readonly space: SpaceRef;
    }
  | {
      readonly type: 'proposal.created';
      readonly proposal: ProposalRecord;
      readonly space: SpaceRef;
      /** The document it changes as it is now; null for a new document. */
      readonly doc: ProposalDoc | null;
    }
  | {
      readonly type: 'proposal.decided';
      readonly proposal: ProposalRecord;
      readonly space: SpaceRef;
      readonly doc: ProposalDoc | null;
      readonly decision: 'accepted' | 'rejected' | 'withdrawn';
      /** Who decided; null when the system did. */
      readonly byUserId: string | null;
    }
  /**
   * A proposal, or a document's version (`proposal.origin` `document`), was sent back for changes: its proposer (the
   * version's author) is to propose again, with `comment` as what should change. The application wakes it where it
   * worked (`proposal.sourceKind`/`sourceId`, the run `proposal.runId`) for `byUserId`; the proposal it submits from
   * the same source replaces this one.
   */
  | {
      readonly type: 'proposal.changesRequested';
      readonly proposal: ProposalRecord;
      readonly space: SpaceRef;
      readonly doc: ProposalDoc | null;
      readonly comment: string;
      readonly byUserId: string;
    };

/** What a proposal's events say of its document, for a listener that words a notice without reading the base. */
export interface ProposalDoc {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
}

export type KnowledgeListener = (event: KnowledgeEvent) => void | Promise<void>;

export interface KnowledgeEvents {
  /** Every event after its change commits; returns what stops listening. */
  on(listener: KnowledgeListener): () => void;
}

export interface KnowledgeTx {
  readonly conn: DatabaseConnection;
  /**
   * The application's chunking, read before the transaction opened: its settings source reads through its own
   * connection, which on SQLite would wait for the one this transaction holds.
   */
  readonly defaultChunking: KnowledgeChunking;
  emit(event: KnowledgeEvent): void;
  /** Runs `fn` once the transaction commits; a failure is reported, never thrown. */
  afterCommit(fn: () => void | Promise<void>): void;
}

export interface KnowledgeContext {
  readonly database: Pick<DatabaseManager, 'transaction' | 'connection'>;
  readonly access: KnowledgeAccessResolver;
  /** The application's types of subject that entries' permissions name. */
  readonly subjects: KnowledgeSubjects;
  newId(): string;
  now(): Date;
  /** Runs `fn` in a transaction and announces its events once it commits. */
  transaction<T>(fn: (tx: KnowledgeTx) => Promise<T>): Promise<T>;
  read(): DatabaseConnection;
  readonly events: KnowledgeEvents;
  /** Where stored files' bytes are read. */
  readonly urls: FileUrls;
  /** Asks for a file version's text to be extracted; bound by the file service. */
  parse(versionId: string): void;
  /** Binds what `parse` does. */
  onParse(parse: (versionId: string) => void): void;
  readonly onError: (message: string, error: unknown) => void;
  /** The application's chunking and recall settings (`tuning.ts`); the defaults until it binds its own. */
  settings(): KnowledgeSettingsSource;
  /** Binds the application's settings; answers what unbinds them. */
  bindSettings(source: KnowledgeSettingsSource): () => void;
}

export interface KnowledgeContextDeps {
  readonly database: Pick<DatabaseManager, 'transaction' | 'connection'>;
  readonly access: KnowledgeAccessResolver;
  readonly newId: () => string;
  readonly now?: () => Date;
  /** The application's public base path (`/app`, or empty), for the addresses of stored files. */
  readonly basePath?: () => string;
  readonly onError?: (message: string, error: unknown) => void;
}

export function createKnowledgeContext(
  deps: KnowledgeContextDeps,
): KnowledgeContext {
  const listeners = new Set<KnowledgeListener>();
  const onError =
    deps.onError ?? ((message, error) => console.error(message, error));
  const publish = (event: KnowledgeEvent) => {
    for (const listener of listeners)
      try {
        void Promise.resolve(listener(event)).catch((error: unknown) =>
          onError('A knowledge listener failed.', error),
        );
      } catch (error) {
        onError('A knowledge listener failed.', error);
      }
  };
  let parse: (versionId: string) => void = () => undefined;
  let settings: KnowledgeSettingsSource = DEFAULT_SETTINGS;
  return {
    settings: () => settings,
    bindSettings(source) {
      settings = source;
      return () => {
        if (settings === source) settings = DEFAULT_SETTINGS;
      };
    },
    database: deps.database,
    access: deps.access,
    subjects: createSubjects(onError),
    newId: deps.newId,
    now: deps.now ?? (() => new Date()),
    read: () => deps.database.connection(),
    urls: fileUrls(deps.basePath ?? (() => '')),
    onError,
    parse: (versionId) => parse(versionId),
    onParse(next) {
      parse = next;
    },
    async transaction(fn) {
      const pending: KnowledgeEvent[] = [];
      const after: (() => void | Promise<void>)[] = [];
      const defaultChunking =
        chunkingOf(await settings.chunking()) ?? DEFAULT_CHUNKING;
      const result = await deps.database.transaction((conn) =>
        fn({
          conn,
          defaultChunking,
          emit: (event) => pending.push(event),
          afterCommit: (task) => after.push(task),
        }),
      );
      for (const event of pending) publish(event);
      for (const task of after)
        try {
          void Promise.resolve(task()).catch((error: unknown) =>
            onError('Knowledge work after a commit failed.', error),
          );
        } catch (error) {
          onError('Knowledge work after a commit failed.', error);
        }
      return result;
    },
    events: {
      on(listener) {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
    },
  };
}

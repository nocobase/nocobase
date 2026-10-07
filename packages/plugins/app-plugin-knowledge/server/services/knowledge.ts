/**
 * The knowledge base, assembled (`knowledgeToken`): entries (with search), files, proposals, the spaces a reader reads
 * and snapshots of them. The plugin's provider binds it over the application's access resolver and file storage; tests
 * call `createKnowledge` against a real database.
 */
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';

import type { SpaceRef } from '../../shared/knowledge.js';
import { workerExtractor, type TextExtractor } from '../parsing/index.js';
import type { KnowledgeAccessResolver, KnowledgeReader } from './access.js';
import {
  createKnowledgeContext,
  type KnowledgeContext,
  type KnowledgeEvents,
} from './context.js';
import { cleanupUploads, type CleanupReport } from './cleanup.js';
import {
  createPermissionService,
  type PermissionService,
} from './doc-permissions.js';
import { createDocumentService, type DocumentService } from './documents.js';
import { createFileService, type FileService } from './files.js';
import { createProposalService, type ProposalService } from './proposals.js';
import {
  createIndexingService,
  type IndexingService,
  type KnowledgeIndexer,
} from './indexing.js';
import {
  outlineOf,
  readableSpaces,
  type ReadableSpaces,
  type SpaceOutline,
} from './readable.js';
import {
  chunksOf,
  eachChunk,
  textsOf,
  type ChunksOfDoc,
  type KnowledgeChunkRow,
  type KnowledgeTexts,
} from './reading.js';
import {
  createContainsSearch,
  type KnowledgeSearchProvider,
  type KnowledgeSearchReranker,
} from './search.js';
import { createSnapshots, type KnowledgeSnapshots } from './snapshots.js';
import {
  createChunkingService,
  type ChunkingService,
  type KnowledgeSettingsSource,
} from './tuning.js';
import type { KnowledgeFileStore } from './storage.js';
import type { KnowledgeSubjectProvider } from './subjects.js';

export interface Knowledge {
  readonly events: KnowledgeEvents;
  readonly docs: DocumentService;
  readonly files: FileService;
  readonly proposals: ProposalService;
  /** Who may do what on each folder and article (`docs/permissions.md`). */
  readonly permissions: PermissionService;
  /** How each space is cut into sections, and cutting it again when that changes (`tuning.ts`). */
  readonly chunking: ChunkingService;
  /**
   * Binds the application's chunking default and recall settings, read on each use; answers what unbinds them. Without
   * them the plugin's defaults apply.
   */
  bindSettings(source: KnowledgeSettingsSource): () => void;
  /** Where each entry's sections stand in the application's semantic index (`indexing.ts`). */
  readonly indexing: IndexingService;
  /** Binds the application's semantic index; a second replaces the first. Answers what unbinds it. */
  registerIndexer(indexer: KnowledgeIndexer): () => void;
  /**
   * Adds a type of subject entries may grant to (a user, a role…); a second provider of the same type replaces the
   * first. Answers what removes it again.
   */
  registerSubjectProvider(provider: KnowledgeSubjectProvider): () => void;
  /**
   * Of `refs` (nearest first), the spaces `reader` reads something in, with what they read there (their gates);
   * decide it before a transaction that reads them.
   */
  readable(
    reader: KnowledgeReader,
    refs: readonly SpaceRef[],
  ): Promise<ReadableSpaces>;
  /** Through `conn`: the live documents of each readable space. */
  outline(
    conn: DatabaseConnection,
    readable: ReadableSpaces,
  ): Promise<SpaceOutline[]>;
  /** Readable spaces exported as files, recorded under a key. */
  readonly snapshots: KnowledgeSnapshots;
  /** A connection outside any transaction, for `snapshots` reads made outside one. */
  connection(): DatabaseConnection;
  /**
   * Adds a search provider beside the built-in contains match: search fuses every provider's ranking (`search.ts`).
   * Answers what removes it again.
   */
  registerSearchProvider(provider: KnowledgeSearchProvider): () => void;
  /** The providers search asks, the built-in contains match first. */
  searchProviders(): readonly KnowledgeSearchProvider[];
  /**
   * Adds a reranker search hands its best fused sections to (`search.ts`); the first that answers orders them. Answers
   * what removes it again.
   */
  registerReranker(reranker: KnowledgeSearchReranker): () => void;
  /**
   * Deletes expired upload tickets and stored files nothing names, uploaded more than `graceMs` ago (a day by default);
   * the provider runs it on a timer (`knowledge.cleanup`).
   */
  cleanup(options?: { readonly graceMs?: number }): Promise<CleanupReport>;
  /** Through `conn`: an entry's sections at its current version; none for an archived or missing entry or a folder. */
  chunksOf(conn: DatabaseConnection, docId: string): Promise<ChunksOfDoc>;
  /** Every live entry's current sections, in batches, for rebuilding an index of the application's own. */
  eachChunk(options?: {
    readonly batchSize?: number;
  }): AsyncIterable<KnowledgeChunkRow[]>;
  /**
   * Through `conn`: the whole current text of the readable spaces' live articles and files. With `maxChars`, a base
   * whose sections are longer is not loaded (`complete` false).
   */
  texts(
    conn: DatabaseConnection,
    readable: ReadableSpaces,
    options?: { readonly maxChars?: number },
  ): Promise<KnowledgeTexts>;
}

export interface KnowledgeDeps {
  readonly database: Pick<DatabaseManager, 'transaction' | 'connection'>;
  /** The application's spaces and who may do what in them. */
  readonly access: KnowledgeAccessResolver;
  readonly newId: () => string;
  readonly now?: () => Date;
  /** The application's public base path (`/app`, or empty), for the addresses of stored files. */
  readonly basePath?: () => string;
  /** Where files are stored, how large one may be, and how their text is extracted (a worker thread by default). */
  readonly files?: {
    readonly store?: () => KnowledgeFileStore | null;
    readonly maxBytes?: number;
    readonly extract?: TextExtractor;
  };
  readonly onError?: (message: string, error: unknown) => void;
}

export function createKnowledge(deps: KnowledgeDeps): Knowledge {
  const context: KnowledgeContext = createKnowledgeContext(deps);
  const providers: KnowledgeSearchProvider[] = [
    createContainsSearch(() => context.read()),
  ];
  const rerankers: KnowledgeSearchReranker[] = [];
  let indexer: KnowledgeIndexer | null = null;
  const docs = createDocumentService(
    context,
    () => providers,
    () => rerankers,
  );
  const store = deps.files?.store ?? (() => null);
  const files = createFileService(context, docs, {
    store,
    extract: deps.files?.extract ?? workerExtractor(),
    ...(deps.files?.maxBytes ? { maxBytes: deps.files.maxBytes } : {}),
  });
  return {
    events: context.events,
    docs,
    files,
    proposals: createProposalService(context, {
      store,
      maxBytes: files.maxBytes,
    }),
    permissions: createPermissionService(context),
    chunking: createChunkingService(context),
    bindSettings: (source) => context.bindSettings(source),
    indexing: createIndexingService(context, () => indexer),
    registerIndexer(next) {
      indexer = next;
      return () => {
        if (indexer === next) indexer = null;
      };
    },
    registerSubjectProvider: (provider) => context.subjects.register(provider),
    readable: (reader, refs) => readableSpaces(context, reader, refs),
    outline: outlineOf,
    snapshots: createSnapshots({
      newId: deps.newId,
      now: () => context.now(),
    }),
    connection: () => context.read(),
    registerSearchProvider(provider) {
      providers.push(provider);
      return () => {
        const at = providers.indexOf(provider);
        if (at !== -1) providers.splice(at, 1);
      };
    },
    searchProviders: () => [...providers],
    registerReranker(reranker) {
      rerankers.push(reranker);
      return () => {
        const at = rerankers.indexOf(reranker);
        if (at !== -1) rerankers.splice(at, 1);
      };
    },
    cleanup: (options) => cleanupUploads(context, store(), options),
    chunksOf,
    eachChunk: (options) => eachChunk(() => context.read(), options),
    texts: textsOf,
  };
}

/**
 * The plugin's service token and the port the assembling application binds. The plugin keeps no roles and names no
 * spaces: the application binds `knowledgeAccessToken` with its spaces, what each inherits and what a reader may do in
 * each. Unbound, there are no spaces and nobody reads anything.
 */
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { KnowledgeAccessResolver } from './services/access.js';
import type { Knowledge } from './services/knowledge.js';

/** The knowledge base: documents, search, proposals and snapshots, each asked with a reader. */
export const knowledgeToken: ServiceToken<Knowledge> =
  createServiceToken<Knowledge>('@nocobase/app-plugin-knowledge/knowledge');

/** The application's spaces and their access. */
export const knowledgeAccessToken: ServiceToken<KnowledgeAccessResolver> =
  createServiceToken<KnowledgeAccessResolver>(
    '@nocobase/app-plugin-knowledge/access',
  );

export type {
  KnowledgeAccessResolver,
  KnowledgeReader,
  KnowledgeReaderAccess,
} from './services/access.js';
export type { PermissionService } from './services/doc-permissions.js';
export type { SpaceGates } from './services/permissions.js';
export type {
  KnowledgePrincipal,
  KnowledgeSubjectContext,
  KnowledgeSubjectProvider,
} from './services/subjects.js';
export type { Knowledge, KnowledgeDeps } from './services/knowledge.js';
export type {
  KnowledgeEvent,
  KnowledgeEvents,
  KnowledgeListener,
  ProposalDoc,
} from './services/context.js';
export type { DocumentService } from './services/documents.js';
export type { FileContent, FileService } from './services/files.js';
export type {
  ProposalFilter,
  ProposalInput,
  ProposalService,
  ProposalTicket,
  TicketInput,
} from './services/proposals.js';
export type {
  OutlineDoc,
  ReadableSpaces,
  SpaceOutline,
} from './services/readable.js';
export type {
  KnowledgeSearchProvider,
  KnowledgeSearchRank,
  KnowledgeSearchReranker,
  KnowledgeSearchSpace,
} from './services/search.js';
export type { CleanupReport } from './services/cleanup.js';
export type {
  IndexingService,
  KnowledgeIndexer,
  KnowledgeSectionState,
} from './services/indexing.js';
export type {
  ChunkingService,
  KnowledgeSettingsSource,
} from './services/tuning.js';
export type {
  ChunksOfDoc,
  KnowledgeChunkRow,
  KnowledgeTexts,
} from './services/reading.js';
export type {
  KnowledgeSnapshot,
  KnowledgeSnapshots,
  SnapshotChange,
  SnapshotFiles,
  SnapshotLayout,
  SnapshotSpace,
  TakeSnapshotRequest,
} from './services/snapshots.js';
export type { ProposalRecord, SnapshotDoc } from './services/store.js';

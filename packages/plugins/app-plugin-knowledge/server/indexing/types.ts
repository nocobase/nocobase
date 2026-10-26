import type { AuthorizationContext } from '@nocobase/authorization/core';
import type { DatabaseManager } from '@nocobase/db';
import type { JobExecutor, ScheduleExecutor } from '@nocobase/jobs';

import type {
  EmbeddingRef,
  EmbeddingServiceView,
  IndexingChannel,
  IndexingDirectory,
  IndexingFieldError,
  IndexingInstanceView,
  IndexingReceipt,
  IndexingRevision,
  IndexingSettingsView,
  IndexingStatus,
  JsonObject,
  RebuildIndexingRequest,
  RetryIndexingRequest,
  SaveIndexingRequest,
} from '../../shared/indexing.js';
import type { Knowledge } from '../services/knowledge.js';

export type IndexingInput =
  | { readonly kind: 'text' }
  | {
      readonly kind: 'embedding';
      readonly model: EmbeddingRef;
      readonly encoding: 'kb-chunk-text-v1';
    };
export interface ParsedIndexingSettings {
  readonly options: JsonObject;
  readonly input: IndexingInput;
}
export interface KnowledgeIndexingExtension {
  readonly type: string;
  readonly contractVersion: 1;
  readonly channels: readonly IndexingChannel[];
  parseConfig(value: JsonObject): JsonObject;
  parseSettings(value: JsonObject): ParsedIndexingSettings;
  resourceIdentity(config: JsonObject): string;
  create(context: IndexingBackendContext): KnowledgeIndexingBackend;
}
export interface IndexingBackendContext {
  readonly key: string;
  readonly config: JsonObject;
  readonly storagePath: string;
  readonly onError: (reason: string, error: unknown) => void;
}
export interface IndexingScope {
  readonly spaceId: string;
  readonly gates: readonly string[];
}
export interface IndexingTarget {
  readonly namespace: string;
  readonly generationId: string;
  readonly type: string;
  readonly contractVersion: 1;
  readonly options: JsonObject;
  readonly dimension: number | null;
  readonly identityHash: string;
}
export interface IndexingDocument {
  readonly docId: string;
  readonly spaceId: string;
  readonly revision: IndexingRevision;
  readonly snapshotHash: string;
  readonly deleted: boolean;
}
export interface IndexingItem {
  readonly chunkId: string;
  readonly docId: string;
  readonly spaceId: string;
  readonly version: number;
  readonly ordinal: number;
  readonly contentHash: string;
  readonly gate: string;
  readonly text: string;
  readonly vector?: readonly number[];
}
export type IndexingQuery =
  | { readonly kind: 'lexical'; readonly text: string }
  | { readonly kind: 'vector'; readonly vector: readonly number[] };
export interface KnowledgeIndexingBackend {
  ensureTarget(target: IndexingTarget, signal: AbortSignal): Promise<void>;
  replaceDocument(
    target: IndexingTarget,
    document: IndexingDocument,
    items: AsyncIterable<IndexingItem>,
    signal: AbortSignal,
  ): Promise<'applied' | 'alreadyApplied' | 'obsolete'>;
  vectorsOf(
    target: IndexingTarget,
    docId: string,
    chunks: readonly {
      readonly chunkId: string;
      readonly contentHash: string;
    }[],
    signal: AbortSignal,
  ): Promise<ReadonlyMap<string, readonly number[]>>;
  search(
    target: IndexingTarget,
    request: {
      readonly channel: string;
      readonly query: IndexingQuery;
      readonly scopes: readonly IndexingScope[];
      readonly limit: number;
    },
    signal: AbortSignal,
  ): Promise<readonly { readonly chunkId: string; readonly score: number }[]>;
  dropTarget(target: IndexingTarget, signal: AbortSignal): Promise<void>;
  close(): Promise<void>;
}
export interface KnowledgeIndexingRegistry {
  register(extension: KnowledgeIndexingExtension): () => void;
  get(type: string): KnowledgeIndexingExtension | undefined;
  list(): readonly KnowledgeIndexingExtension[];
  seal(): void;
}
export class KnowledgeIndexingValidationError extends Error {
  public readonly issues: readonly IndexingFieldError[];
  public constructor(issues: readonly IndexingFieldError[]) {
    super('Invalid Knowledge indexing configuration.');
    this.name = 'KnowledgeIndexingValidationError';
    this.issues = issues.map((issue) => Object.freeze({ ...issue }));
  }
}
export interface KnowledgeEmbeddingProvider {
  catalog(): Promise<readonly EmbeddingServiceView[]>;
  identity(
    ref: EmbeddingRef,
  ): Promise<{ readonly hash: string; readonly dimensions: number | null }>;
  embed(request: {
    readonly model: EmbeddingRef;
    readonly values: readonly string[];
    readonly source: string;
    readonly signal: AbortSignal;
  }): Promise<{
    readonly embeddings: readonly (readonly number[])[];
    readonly dimension: number;
  }>;
}
export interface KnowledgeIndexing {
  settings(context: AuthorizationContext): Promise<IndexingSettingsView>;
  save(
    context: AuthorizationContext,
    input: SaveIndexingRequest,
  ): Promise<IndexingReceipt>;
  status(context: AuthorizationContext): Promise<IndexingStatus>;
  instances(
    context: AuthorizationContext,
  ): Promise<IndexingDirectory<IndexingInstanceView>>;
  models(
    context: AuthorizationContext,
  ): Promise<IndexingDirectory<EmbeddingServiceView>>;
  rebuild(
    context: AuthorizationContext,
    input: RebuildIndexingRequest,
  ): Promise<IndexingReceipt>;
  retry(
    context: AuthorizationContext,
    input: RetryIndexingRequest,
  ): Promise<IndexingReceipt>;
}
export interface KnowledgeIndexingRuntime {
  readonly service: KnowledgeIndexing;
  start(): Promise<void>;
  close(): Promise<void>;
}
export interface KnowledgeIndexingDeps {
  readonly database: Pick<DatabaseManager, 'transaction' | 'connection'>;
  readonly knowledge: Knowledge;
  readonly registry: KnowledgeIndexingRegistry;
  readonly indexing: Readonly<Record<string, JsonObject>>;
  readonly embedding: () => Promise<KnowledgeEmbeddingProvider | null>;
  readonly newId: () => string;
  readonly now?: () => Date;
  readonly jobs: () => {
    readonly executor: JobExecutor;
    readonly schedule: ScheduleExecutor;
  } | null;
  readonly storagePath: string;
  readonly onError: (reason: string, error: unknown) => void;
}

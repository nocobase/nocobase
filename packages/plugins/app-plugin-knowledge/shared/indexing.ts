/** Safe, transport-neutral contracts for the application's single Knowledge index. */
export type JsonValue =
  null | boolean | number | string | JsonObject | readonly JsonValue[];
export type JsonObject = { readonly [key: string]: JsonValue };
export type IndexingRevision = string;
export interface EmbeddingRef {
  readonly modelService: string;
  readonly model: string;
}
export interface IndexingConfig {
  readonly version: 1;
  readonly key: string;
  readonly options: JsonObject;
}
export interface IndexingFieldError {
  readonly field: string;
  readonly message: string;
}
export interface IndexingChannel {
  readonly name: string;
  readonly kind: 'lexical' | 'vector';
}
export interface SaveIndexingRequest {
  readonly requestId: string;
  readonly expectedRevision: IndexingRevision;
  readonly config: IndexingConfig | null;
  readonly acknowledgeFullRebuild: boolean;
}
export interface RebuildIndexingRequest {
  readonly requestId: string;
  readonly expectedRevision: IndexingRevision;
  readonly acknowledgeFullRebuild: true;
}
export interface RetryIndexingRequest extends RebuildIndexingRequest {
  readonly generationId: string;
}
export interface IndexingReceipt {
  readonly requestId: string;
  readonly revision: IndexingRevision;
  readonly changed: boolean;
  readonly enabled: boolean;
  readonly generationId: string | null;
  readonly acceptedAt: string;
}
export interface IndexingSettingsView {
  readonly revision: IndexingRevision;
  readonly config: IndexingConfig | null;
  readonly updatedAt: string;
  readonly capabilities: {
    readonly configure: boolean;
    readonly rebuild: boolean;
  };
}
export interface IndexingInstanceView {
  readonly key: string;
  readonly name: string;
  readonly type: string;
  readonly channels: readonly IndexingChannel[];
  readonly available: boolean;
  readonly reason: string | null;
}
export interface EmbeddingServiceView {
  readonly name: string;
  readonly title: string;
  readonly provider: string;
  readonly models: readonly {
    readonly value: string;
    readonly label: string;
    readonly dimensions: number | null;
  }[];
}
export type IndexingGenerationState =
  | 'queued'
  | 'building'
  | 'failed'
  | 'active'
  | 'retired'
  | 'superseded'
  | 'dropping'
  | 'dropped';
export interface GenerationStatus {
  readonly id: string;
  readonly configRevision: IndexingRevision;
  readonly state: IndexingGenerationState;
  readonly type: string;
  readonly instanceKey: string;
  readonly scanComplete: boolean;
  readonly dimension: number | null;
  readonly documents: {
    readonly total: number | null;
    readonly done: number;
    readonly pending: number;
    readonly failed: number;
  };
  readonly chunks: {
    readonly total: number | null;
    readonly prepared: number;
    readonly committed: number;
  };
  readonly retryPolicy: 'hostJobs';
  readonly error: { readonly reason: string; readonly message: string } | null;
  readonly createdAt: string;
  readonly publishedAt: string | null;
  readonly cleanupAfter: string | null;
}
export interface IndexingStatus {
  readonly revision: IndexingRevision;
  readonly enabled: boolean;
  readonly availability:
    'disabled' | 'unavailable' | 'building' | 'ready' | 'degraded';
  readonly reason: string | null;
  readonly serving: GenerationStatus | null;
  readonly target: GenerationStatus | null;
  readonly observedAt: string;
}
export interface IndexingDirectory<T> {
  readonly items: readonly T[];
  readonly reason: string | null;
}

import type { DatabaseConnection, Repository } from '@nocobase/db';
import type {
  IndexingConfig,
  IndexingGenerationState,
  IndexingReceipt,
  JsonObject,
} from '../../shared/indexing.js';
import { json } from '../services/store.js';
import { nextRevision } from './vector.js';

export interface SettingsRow {
  readonly id: string;
  readonly namespace: string;
  readonly revision: string | bigint | number;
  readonly sourceSeq: string | bigint | number;
  readonly config: unknown;
  readonly configHash: string | null;
  readonly activeGenerationId: string | null;
  readonly buildingGenerationId: string | null;
  readonly lockNonce: string;
  readonly updatedByKind: string | null;
  readonly updatedById: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
export interface GenerationRow {
  readonly id: string;
  readonly configRevision: string | bigint | number;
  readonly instanceKey: string;
  readonly type: string;
  readonly contractVersion: 1;
  readonly config: unknown;
  readonly configHash: string;
  readonly resourceHash: string;
  readonly embeddingHash: string | null;
  readonly dimension: number | null;
  readonly target: unknown;
  readonly state: IndexingGenerationState;
  readonly scanCursor: string | null;
  readonly scanComplete: boolean;
  readonly errorReason: string | null;
  readonly errorMessage: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly publishedAt: string | null;
  readonly retiredAt: string | null;
  readonly cleanupAfter: string | null;
}
export interface SourceRow {
  readonly docId: string;
  readonly spaceId: string;
  readonly revision: string | bigint | number;
  readonly deleted: boolean;
  readonly forceEmbeddingRevision: string | bigint | number;
  readonly updatedAt: string;
}
export interface WorkRow {
  readonly id: string;
  readonly generationId: string;
  readonly docId: string;
  readonly wantedRevision: string | bigint | number;
  readonly appliedRevision: string | bigint | number;
  readonly state: 'pending' | 'failed' | 'done';
  readonly dispatchId: string | null;
  readonly lastJobId: string | null;
  readonly lastDispatchedAt: string | null;
  readonly lastActivityAt: string | null;
  readonly observedRevision: string | bigint | number | null;
  readonly totalChunks: number;
  readonly preparedChunks: number;
  readonly errorRevision: string | bigint | number | null;
  readonly errorRetryable: boolean | null;
  readonly errorReason: string | null;
  readonly errorMessage: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
export interface RequestRow {
  readonly id: string;
  readonly principalType: string;
  readonly principalId: string;
  readonly requestId: string;
  readonly operation: string;
  readonly payloadHash: string;
  readonly receipt: unknown;
  readonly createdAt: string;
  readonly expiresAt: string;
}
export interface TargetData {
  readonly resource: JsonObject | null;
  readonly lifecycle: {
    readonly dispatchId: string | null;
    readonly lastJobId: string | null;
    readonly lastDispatchedAt: string | null;
    readonly lastActivityAt: string | null;
    readonly errorRetryable: boolean | null;
  };
}
export const EMPTY_TARGET: TargetData = {
  resource: null,
  lifecycle: {
    dispatchId: null,
    lastJobId: null,
    lastDispatchedAt: null,
    lastActivityAt: null,
    errorRetryable: null,
  },
};
export const settingsRepo = (
  conn: DatabaseConnection,
): Repository<SettingsRow> =>
  conn.repository<SettingsRow>('kbIndexingSettings');
export const generationsRepo = (
  conn: DatabaseConnection,
): Repository<GenerationRow> =>
  conn.repository<GenerationRow>('kbIndexGenerations');
export const sourcesRepo = (conn: DatabaseConnection): Repository<SourceRow> =>
  conn.repository<SourceRow>('kbIndexSources');
export const workRepo = (conn: DatabaseConnection): Repository<WorkRow> =>
  conn.repository<WorkRow>('kbIndexWork');
export const requestsRepo = (
  conn: DatabaseConnection,
): Repository<RequestRow> => conn.repository<RequestRow>('kbIndexRequests');
export const configOf = (
  row: SettingsRow | GenerationRow,
): IndexingConfig | null => json<IndexingConfig | null>(row.config, null);
export const receiptOf = (row: RequestRow): IndexingReceipt =>
  json<IndexingReceipt | null>(row.receipt, null) ??
  (() => {
    throw new Error('Invalid indexing receipt.');
  })();
export const targetOf = (row: GenerationRow): TargetData =>
  json<TargetData>(row.target, EMPTY_TARGET);

/** All business/control transactions acquire the same real write lock before reading dependent state. */
export async function lockSettings(
  conn: DatabaseConnection,
  nonce: string,
): Promise<SettingsRow> {
  await settingsRepo(conn).updateMany({
    filter: { id: 'global' },
    values: { lockNonce: nonce },
  });
  const row = await settingsRepo(conn).findOne({ filter: { id: 'global' } });
  if (!row) throw new Error('Knowledge indexing migration is required.');
  return row;
}
export async function putWork(
  conn: DatabaseConnection,
  generationId: string,
  source: SourceRow,
  newId: () => string,
  now: string,
): Promise<void> {
  const filter = { generationId, docId: source.docId };
  const previous = await workRepo(conn).findOne({ filter });
  const values: Partial<WorkRow> = {
    wantedRevision: source.revision,
    state: 'pending',
    dispatchId: null,
    lastJobId: null,
    lastDispatchedAt: null,
    lastActivityAt: null,
    observedRevision: null,
    totalChunks: 0,
    preparedChunks: 0,
    errorRevision: null,
    errorRetryable: null,
    errorReason: null,
    errorMessage: null,
    updatedAt: now,
  };
  if (previous) await workRepo(conn).updateMany({ filter, values });
  else
    await workRepo(conn).createOne({
      values: {
        id: newId(),
        ...filter,
        ...values,
        appliedRevision: '0',
        createdAt: now,
      },
    });
}
export async function advanceSources(
  conn: DatabaseConnection,
  settings: SettingsRow,
  changes: readonly {
    readonly docId: string;
    readonly spaceId: string;
    readonly deleted: boolean;
    readonly force?: boolean;
  }[],
  newId: () => string,
  now: string,
): Promise<void> {
  if (!changes.length) return;
  const revision = nextRevision(settings.sourceSeq);
  await settingsRepo(conn).updateMany({
    filter: { id: 'global' },
    values: { sourceSeq: revision },
  });
  for (const change of changes) {
    const previous = await sourcesRepo(conn).findOne({
      filter: { docId: change.docId },
    });
    const source: SourceRow = {
      docId: change.docId,
      spaceId: change.spaceId,
      deleted: change.deleted,
      revision,
      forceEmbeddingRevision: change.force
        ? revision
        : (previous?.forceEmbeddingRevision ?? '0'),
      updatedAt: now,
    };
    if (previous)
      await sourcesRepo(conn).updateMany({
        filter: { docId: change.docId },
        values: source,
      });
    else await sourcesRepo(conn).createOne({ values: source });
    if (configOf(settings))
      for (const id of new Set([
        settings.activeGenerationId,
        settings.buildingGenerationId,
      ])) {
        if (id) await putWork(conn, id, source, newId, now);
      }
  }
}

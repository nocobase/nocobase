import type { AuthorizationContext } from '@nocobase/authorization/core';
import type { DatabaseConnection } from '@nocobase/db';
import type { JobExecutionContext } from '@nocobase/jobs';
import { z } from 'zod';

import type {
  GenerationStatus,
  IndexingConfig,
  IndexingReceipt,
  IndexingStatus,
  SaveIndexingRequest,
} from '../../shared/indexing.js';
import { conflict, invalid } from '../errors.js';
import { findDoc } from '../services/store.js';
import { gatesOf } from '../services/permissions.js';
import type { KnowledgeSearchSpace } from '../services/search.js';
import { parseIndexingInstances } from './config.js';
import {
  createIndexingJobs,
  type DocumentPayload,
  type GenerationPayload,
} from './jobs.js';
import {
  advanceSources,
  configOf,
  EMPTY_TARGET,
  generationsRepo,
  lockSettings,
  putWork,
  receiptOf,
  requestsRepo,
  settingsRepo,
  sourcesRepo,
  targetOf,
  workRepo,
  type GenerationRow,
  type SettingsRow,
} from './store.js';
import type {
  IndexingItem,
  IndexingTarget,
  KnowledgeIndexingBackend,
  KnowledgeIndexingDeps,
  KnowledgeIndexingRuntime,
} from './types.js';
import {
  canonicalJson,
  nextRevision,
  revisionOf,
  sha256,
  validateVectors,
} from './vector.js';
import { indexingFailure } from './failures.js';
import { withinSignal } from './budget.js';
import { cleanupIndexingSpools } from './spool.js';
import { dueCleanupTargets, purgeIndexingMetadata } from './cleanup.js';

const requestSchema = z
  .object({
    requestId: z.uuid().regex(/^[0-9a-f-]+$/),
    expectedRevision: z.string().refine((v) => {
      try {
        return revisionOf(v) === v;
      } catch {
        return false;
      }
    }),
    config: z
      .object({
        version: z.literal(1),
        key: z.string().min(1).max(64),
        options: z.record(z.string(), z.json()),
      })
      .strict()
      .nullable(),
    acknowledgeFullRebuild: z.boolean(),
  })
  .strict();
const rebuildSchema = requestSchema
  .omit({ config: true })
  .extend({ acknowledgeFullRebuild: z.literal(true) });
const retrySchema = rebuildSchema.extend({
  generationId: z.string().min(1).max(64),
});
const requestHash = (value: unknown): string =>
  sha256(canonicalJson(z.json().parse(value)));
const requireAction = (context: AuthorizationContext, action: string) =>
  context.require({
    resource: { type: 'settings', id: 'kb.indexing' },
    action,
  });
const cleanupAt = (now: Date) =>
  new Date(now.getTime() + 86400000).toISOString();

/** All authoritative state lives in the business database or the backend manifest, never Job events. */
export function createKnowledgeIndexing(
  deps: KnowledgeIndexingDeps,
): KnowledgeIndexingRuntime {
  const now = () => (deps.now?.() ?? new Date()).toISOString();
  const tx = <T>(
    fn: (conn: DatabaseConnection, settings: SettingsRow) => Promise<T>,
  ) =>
    deps.database.transaction(async (conn) =>
      fn(conn, await lockSettings(conn, deps.newId())),
    );
  const instances = parseIndexingInstances(deps.indexing, deps.registry);
  const backends = new Map<string, KnowledgeIndexingBackend>();
  let executors: ReturnType<KnowledgeIndexingDeps['jobs']> = null;
  let ready = false;
  let stopping = false;
  let closing: Promise<void> | undefined;
  let unsubscribe: (() => void) | undefined;
  let releaseSearch: (() => void) | undefined;
  let releaseIndexer: (() => void) | undefined;
  const indexListeners = new Set<(docId: string) => void>();
  const notify = (docId: string) => {
    for (const listener of indexListeners) {
      try {
        listener(docId);
      } catch {
        deps.onError(
          'INDEXING_NOTIFICATION_FAILED',
          new Error('Knowledge indexing notification failed.'),
        );
      }
    }
  };

  async function plan(config: IndexingConfig) {
    const instance = instances.get(config.key);
    if (!instance)
      throw invalid(
        'INDEXING_INSTANCE_UNKNOWN',
        'Unknown indexing instance.',
        'config.key',
      );
    const settings = instance.extension.parseSettings(config.options);
    let embeddingHash: string | null = null;
    let dimension: number | null = null;
    if (settings.input.kind === 'embedding') {
      const provider = await deps.embedding();
      if (!provider)
        throw invalid(
          'INDEXING_MODEL_UNKNOWN',
          'Embedding is unavailable.',
          'config.options.embedding',
        );
      const identity = await provider.identity(settings.input.model);
      embeddingHash = identity.hash;
      dimension = identity.dimensions;
    }
    const normalized: IndexingConfig = {
      version: 1,
      key: config.key,
      options: settings.options,
    };
    const resourceHash = instance.extension.resourceIdentity(instance.config);
    const configHash = requestHash({
      type: instance.type,
      contractVersion: instance.extension.contractVersion,
      options: normalized.options,
      resourceHash,
      embeddingHash,
      encoding: 'kb-chunk-text-v1',
    });
    return {
      instance,
      settings,
      normalized,
      resourceHash,
      embeddingHash,
      dimension,
      configHash,
    };
  }
  function storageConnection(
    generation: GenerationRow,
  ): KnowledgeIndexingBackend {
    const config = configOf(generation);
    const instance = config ? instances.get(config.key) : undefined;
    if (
      !config ||
      !instance ||
      config.key !== generation.instanceKey ||
      instance.type !== generation.type ||
      instance.extension.contractVersion !== generation.contractVersion ||
      instance.extension.resourceIdentity(instance.config) !==
        generation.resourceHash
    )
      throw invalid(
        'INDEXING_TARGET_OWNERSHIP_CONFLICT',
        'Knowledge index target ownership does not match.',
      );
    let backend = backends.get(config.key);
    if (!backend) {
      backend = instance.extension.create({
        key: config.key,
        config: instance.config,
        storagePath: deps.storagePath,
        onError: deps.onError,
      });
      backends.set(config.key, backend);
    }
    return backend;
  }
  async function connection(generation: GenerationRow) {
    const config = configOf(generation);
    if (!config)
      throw invalid('INDEXING_UNAVAILABLE', 'Indexing is unavailable.');
    const current = await plan(config);
    if (current.configHash !== generation.configHash)
      throw invalid('INDEXING_MODEL_CHANGED', 'Indexing dependencies changed.');
    return { backend: storageConnection(generation), ...current };
  }
  function target(
    settings: SettingsRow,
    generation: GenerationRow,
  ): IndexingTarget {
    const config = configOf(generation);
    if (!config)
      throw invalid('INDEXING_UNAVAILABLE', 'Indexing is unavailable.');
    return {
      namespace: settings.namespace,
      generationId: generation.id,
      type: generation.type,
      contractVersion: generation.contractVersion,
      options: config.options,
      dimension:
        generation.dimension === null ? null : Number(generation.dimension),
      identityHash: generation.configHash,
    };
  }
  async function current(
    conn: DatabaseConnection,
    settings: SettingsRow,
    id: string,
  ) {
    if (
      !configOf(settings) ||
      ![settings.activeGenerationId, settings.buildingGenerationId].includes(id)
    )
      return null;
    return generationsRepo(conn).findOne({ filter: { id } });
  }
  async function tryPublish(
    conn: DatabaseConnection,
    settings: SettingsRow,
  ): Promise<void> {
    if (!settings.buildingGenerationId) return;
    const generation = await current(
      conn,
      settings,
      settings.buildingGenerationId,
    );
    if (
      !generation ||
      !generation.scanComplete ||
      (generation.errorReason !== null &&
        targetOf(generation).lifecycle.errorRetryable === false) ||
      revisionOf(settings.revision) !== revisionOf(generation.configRevision)
    )
      return;
    const outstanding = await conn.query
      .selectFrom('kbIndexSources as source')
      .leftJoin('kbIndexWork as work', (join) =>
        join
          .onRef('work.docId', '=', 'source.docId')
          .on('work.generationId', '=', generation.id),
      )
      .select('source.docId')
      .where((eb) =>
        eb.or([
          eb('work.id', 'is', null),
          eb('work.state', '!=', 'done'),
          eb('work.appliedRevision', '!=', eb.ref('source.revision')),
        ]),
      )
      .limit(1)
      .executeTakeFirst();
    if (outstanding) return;
    if (settings.activeGenerationId)
      await generationsRepo(conn).updateMany({
        filter: { id: settings.activeGenerationId },
        values: {
          state: 'retired',
          retiredAt: now(),
          cleanupAfter: cleanupAt(new Date(now())),
          updatedAt: now(),
        },
      });
    await generationsRepo(conn).updateMany({
      filter: { id: generation.id },
      values: {
        state: 'active',
        errorReason: null,
        errorMessage: null,
        publishedAt: now(),
        updatedAt: now(),
      },
    });
    await settingsRepo(conn).updateMany({
      filter: { id: 'global' },
      values: { activeGenerationId: generation.id, buildingGenerationId: null },
    });
  }
  async function dispatchGeneration(id: string): Promise<void> {
    if (!ready || stopping || !executors) return;
    const dispatchId = deps.newId();
    const accepted = await tx(async (conn, settings) => {
      const g = await current(conn, settings, id);
      if (!g || g.scanComplete || g.state === 'failed') return false;
      const data = targetOf(g);
      if (
        data.lifecycle.lastDispatchedAt &&
        [data.lifecycle.lastDispatchedAt, data.lifecycle.lastActivityAt ?? '']
          .sort()
          .at(-1)! > new Date(new Date(now()).getTime() - 300000).toISOString()
      )
        return false;
      await generationsRepo(conn).updateMany({
        filter: { id },
        values: {
          target: {
            ...data,
            lifecycle: {
              ...data.lifecycle,
              dispatchId,
              lastDispatchedAt: now(),
            },
          },
        },
      });
      return true;
    });
    if (!accepted || stopping || !ready) return;
    try {
      const receipt = await executors.executor.addJob(
        new jobs.Generation({ version: 1, generationId: id }),
      );
      await tx(async (conn, settings) => {
        const g = await current(conn, settings, id);
        if (g && targetOf(g).lifecycle.dispatchId === dispatchId)
          await generationsRepo(conn).updateMany({
            filter: { id },
            values: {
              target: {
                ...targetOf(g),
                lifecycle: {
                  ...targetOf(g).lifecycle,
                  lastJobId: receipt.jobId,
                },
              },
            },
          });
      });
    } catch {
      deps.onError(
        'INDEXING_DISPATCH_FAILED',
        new Error('Knowledge generation dispatch failed.'),
      );
    }
  }
  async function dispatchDocument(payload: DocumentPayload): Promise<void> {
    if (!ready || stopping || !executors) return;
    const dispatchId = deps.newId();
    const accepted = await tx(async (conn, settings) => {
      if (!(await current(conn, settings, payload.generationId))) return false;
      const work = await workRepo(conn).findOne({
        filter: { generationId: payload.generationId, docId: payload.docId },
      });
      if (
        !work ||
        work.state !== 'pending' ||
        revisionOf(work.wantedRevision) !== payload.sourceRevision
      )
        return false;
      if (
        work.lastDispatchedAt &&
        [work.lastDispatchedAt, work.lastActivityAt ?? ''].sort().at(-1)! >
          new Date(new Date(now()).getTime() - 300000).toISOString()
      )
        return false;
      await workRepo(conn).updateMany({
        filter: { id: work.id },
        values: { dispatchId, lastDispatchedAt: now() },
      });
      return true;
    });
    if (!accepted || stopping || !ready) return;
    try {
      const receipt = await executors.executor.addJob(
        new jobs.Document(payload),
      );
      await tx(async (conn) => {
        const work = await workRepo(conn).findOne({
          filter: { generationId: payload.generationId, docId: payload.docId },
        });
        if (
          work?.dispatchId === dispatchId &&
          revisionOf(work.wantedRevision) === payload.sourceRevision
        )
          await workRepo(conn).updateMany({
            filter: { id: work.id },
            values: { lastJobId: receipt.jobId },
          });
      });
    } catch {
      deps.onError(
        'INDEXING_DISPATCH_FAILED',
        new Error('Knowledge document dispatch failed.'),
      );
    }
  }
  async function reconcile(): Promise<void> {
    if (!ready || stopping) return;
    const cutoff = new Date(new Date(now()).getTime() - 300000).toISOString();
    const pending = await tx(async (conn, settings) => {
      const generations: string[] = [];
      if (settings.buildingGenerationId) {
        const g = await current(conn, settings, settings.buildingGenerationId);
        if (g && !g.scanComplete && g.state !== 'failed') {
          const life = targetOf(g).lifecycle;
          if (
            !life.lastDispatchedAt ||
            [life.lastDispatchedAt, life.lastActivityAt ?? ''].sort().at(-1)! <
              cutoff
          )
            generations.push(g.id);
        }
      }
      const work = await workRepo(conn).findMany({
        filter: (f) =>
          f.and([
            f.string('state').eq('pending'),
            f.or([
              f.date('lastDispatchedAt').empty(),
              f.and([
                f.date('lastDispatchedAt').before(cutoff),
                f.or([
                  f.date('lastActivityAt').empty(),
                  f.date('lastActivityAt').before(cutoff),
                ]),
              ]),
            ]),
          ]),
        limit: 100,
      });
      return { generations, work };
    });
    for (const id of pending.generations) await dispatchGeneration(id);
    for (const work of pending.work)
      await dispatchDocument({
        version: 1,
        generationId: work.generationId,
        docId: work.docId,
        sourceRevision: revisionOf(work.wantedRevision),
      });
  }
  async function generationJob(
    payload: GenerationPayload,
    context: JobExecutionContext,
  ): Promise<void> {
    for (;;) {
      context.signal.throwIfAborted();
      const page = await tx(async (conn, settings) => {
        const g = await current(conn, settings, payload.generationId);
        if (
          !g ||
          g.scanComplete ||
          (g.state === 'failed' &&
            targetOf(g).lifecycle.errorRetryable === false)
        )
          return null;
        let query = conn.query
          .selectFrom('kbDocs')
          .select('id')
          .where('kind', '!=', 'folder')
          .orderBy('id', 'asc')
          .limit(100);
        if (g.scanCursor) query = query.where('id', '>', g.scanCursor);
        const ids = z
          .array(z.object({ id: z.string() }))
          .parse(await query.execute());
        const docs = [];
        for (const { id } of ids) {
          const doc = await findDoc(conn, id);
          if (doc) docs.push(doc);
        }
        const missing = [];
        for (const doc of docs)
          if (!(await sourcesRepo(conn).findOne({ filter: { docId: doc.id } })))
            missing.push({
              docId: doc.id,
              spaceId: doc.spaceId,
              deleted: Boolean(doc.archivedAt),
            });
        await advanceSources(conn, settings, missing, deps.newId, now());
        for (const doc of docs) {
          const source = await sourcesRepo(conn).findOne({
            filter: { docId: doc.id },
          });
          if (
            source &&
            !(await workRepo(conn).findOne({
              filter: { generationId: g.id, docId: doc.id },
            }))
          )
            await putWork(conn, g.id, source, deps.newId, now());
        }
        const missingSources =
          docs.length === 0
            ? await conn.query
                .selectFrom('kbIndexSources as source')
                .leftJoin('kbIndexWork as work', (join) =>
                  join
                    .onRef('work.docId', '=', 'source.docId')
                    .on('work.generationId', '=', g.id),
                )
                .select('source.docId')
                .where('work.id', 'is', null)
                .orderBy('source.docId', 'asc')
                .limit(100)
                .execute()
            : [];
        for (const row of missingSources) {
          const { docId } = z.object({ docId: z.string() }).parse(row);
          const source = await sourcesRepo(conn).findOne({ filter: { docId } });
          if (source) await putWork(conn, g.id, source, deps.newId, now());
        }
        const data = targetOf(g);
        await generationsRepo(conn).updateMany({
          filter: { id: g.id },
          values: {
            state: 'building',
            errorReason: null,
            errorMessage: null,
            scanCursor: docs.at(-1)?.id ?? g.scanCursor,
            scanComplete: docs.length === 0 && missingSources.length === 0,
            target: {
              ...data,
              lifecycle: {
                ...data.lifecycle,
                lastActivityAt: now(),
                lastJobId: context.jobId,
                errorRetryable: null,
              },
            },
            updatedAt: now(),
          },
        });
        await tryPublish(conn, settings);
        return docs.length || missingSources.length;
      });
      if (page === null) return;
      await reconcile();
      if (page === 0) return;
    }
  }
  async function documentJob(
    payload: DocumentPayload,
    context: JobExecutionContext,
  ): Promise<void> {
    const snapshot = await tx(async (conn, settings) => {
      const generation = await current(conn, settings, payload.generationId);
      if (!generation) return null;
      if (
        generation.errorReason !== null &&
        targetOf(generation).lifecycle.errorRetryable === false
      )
        return null;
      const source = await sourcesRepo(conn).findOne({
        filter: { docId: payload.docId },
      });
      const work = await workRepo(conn).findOne({
        filter: { generationId: payload.generationId, docId: payload.docId },
      });
      if (
        !source ||
        !work ||
        revisionOf(source.revision) !== payload.sourceRevision ||
        revisionOf(work.wantedRevision) !== payload.sourceRevision ||
        BigInt(revisionOf(work.appliedRevision)) >=
          BigInt(payload.sourceRevision) ||
        (work.state === 'failed' && !work.errorRetryable)
      )
        return null;
      await workRepo(conn).updateMany({
        filter: { id: work.id },
        values: { lastActivityAt: now(), lastJobId: context.jobId },
      });
      const content = await deps.knowledge.chunksOf(conn, payload.docId);
      const items: IndexingItem[] = content.chunks.map((chunk) => ({
        chunkId: chunk.id,
        docId: source.docId,
        spaceId: source.spaceId,
        version: content.doc?.version ?? 0,
        ordinal: chunk.ordinal,
        contentHash: sha256(chunk.text),
        gate: content.doc?.gate ?? '',
        text: chunk.text,
      }));
      const document = {
        docId: source.docId,
        spaceId: source.spaceId,
        revision: payload.sourceRevision,
        deleted: source.deleted,
        snapshotHash: requestHash({
          docId: source.docId,
          spaceId: source.spaceId,
          revision: payload.sourceRevision,
          deleted: source.deleted,
          chunks: items.map(({ text: _text, ...item }) => item),
        }),
      };
      return { settings, generation, source, work, items, document };
    });
    if (!snapshot) return;
    try {
      context.signal.throwIfAborted();
      const { backend, settings: parsed } = await connection(
        snapshot.generation,
      );
      let dimension =
        snapshot.generation.dimension === null
          ? null
          : Number(snapshot.generation.dimension);
      const items: IndexingItem[] = [];
      // Compatible endpoints may accept fewer inputs than their generic SDK advertises.
      const batchSize = 8;
      for (let at = 0; at < snapshot.items.length; at += batchSize) {
        const batch = snapshot.items.slice(at, at + batchSize);
        context.signal.throwIfAborted();
        const alive = await tx((conn, settings) =>
          current(conn, settings, payload.generationId),
        );
        if (!alive) return;
        if (parsed.input.kind === 'embedding') {
          const model = parsed.input.model;
          const provider = await deps.embedding();
          if (!provider)
            throw invalid(
              'INDEXING_MODEL_UNKNOWN',
              'Embedding is unavailable.',
            );
          if (
            (await provider.identity(parsed.input.model)).hash !==
            snapshot.generation.embeddingHash
          )
            throw invalid('INDEXING_MODEL_CHANGED', 'Embedding changed.');
          const signal = AbortSignal.any([
            context.signal,
            AbortSignal.timeout(60000),
          ]);
          const cached =
            BigInt(revisionOf(snapshot.source.forceEmbeddingRevision)) <=
              BigInt(revisionOf(snapshot.work.appliedRevision)) &&
            targetOf(snapshot.generation).resource
              ? new Map(
                  await backend.vectorsOf(
                    target(snapshot.settings, snapshot.generation),
                    payload.docId,
                    batch,
                    signal,
                  ),
                )
              : new Map<string, readonly number[]>();
          const missing = batch.filter((item) => !cached.has(item.chunkId));
          const output = missing.length
            ? await withinSignal(signal, () =>
                provider.embed({
                  model: model,
                  values: missing.map((item) => item.text),
                  source: 'knowledge.indexing',
                  signal,
                }),
              )
            : null;
          if (
            (await provider.identity(parsed.input.model)).hash !==
            snapshot.generation.embeddingHash
          )
            throw invalid('INDEXING_MODEL_CHANGED', 'Embedding changed.');
          if (output) {
            dimension = validateVectors(
              output.embeddings,
              missing.length,
              dimension,
            );
            if (output.dimension !== dimension)
              throw invalid(
                'INDEXING_MODEL_CHANGED',
                'Embedding dimension changed.',
              );
            missing.forEach((item, index) => {
              const vector = output.embeddings[index];
              if (vector) cached.set(item.chunkId, vector);
            });
          }
          dimension = validateVectors(
            batch.map((item) => cached.get(item.chunkId) ?? []),
            batch.length,
            dimension,
          );
          batch.forEach((item) =>
            items.push({ ...item, vector: cached.get(item.chunkId) }),
          );
        } else items.push(...batch);
        await tx(async (conn) => {
          const work = await workRepo(conn).findOne({
            filter: { id: snapshot.work.id },
          });
          if (
            work &&
            revisionOf(work.wantedRevision) === payload.sourceRevision
          )
            await workRepo(conn).updateMany({
              filter: { id: work.id },
              values: {
                observedRevision: payload.sourceRevision,
                totalChunks: snapshot.items.length,
                preparedChunks: items.length,
                lastActivityAt: now(),
              },
            });
        });
      }
      const applicable = await tx(async (conn, settings) => {
        const g = await current(conn, settings, payload.generationId);
        if (!g) return null;
        if (
          g.dimension !== null &&
          dimension !== null &&
          Number(g.dimension) !== dimension
        )
          throw invalid(
            'INDEXING_MODEL_CHANGED',
            'Embedding dimension changed.',
          );
        if (g.dimension === null && dimension !== null)
          await generationsRepo(conn).updateMany({
            filter: { id: g.id },
            values: { dimension },
          });
        return {
          settings,
          generation: { ...g, dimension: dimension ?? g.dimension },
        };
      });
      if (!applicable) return;
      const destination = target(applicable.settings, applicable.generation);
      await backend.ensureTarget(destination, context.signal);
      const result = await backend.replaceDocument(
        destination,
        snapshot.document,
        (async function* () {
          yield* items;
        })(),
        context.signal,
      );
      if (result === 'obsolete') return;
      await tx(async (conn, settings) => {
        const g = await current(conn, settings, payload.generationId);
        const work = await workRepo(conn).findOne({
          filter: { id: snapshot.work.id },
        });
        if (!g || !work) return;
        if (
          BigInt(revisionOf(work.appliedRevision)) >
          BigInt(payload.sourceRevision)
        )
          return;
        const done = revisionOf(work.wantedRevision) === payload.sourceRevision;
        await workRepo(conn).updateMany({
          filter: { id: work.id },
          values: {
            appliedRevision: payload.sourceRevision,
            ...(done
              ? {
                  state: 'done',
                  errorRevision: null,
                  errorReason: null,
                  errorMessage: null,
                  errorRetryable: null,
                }
              : {}),
            updatedAt: now(),
          },
        });
        const data = targetOf(g);
        await generationsRepo(conn).updateMany({
          filter: { id: g.id },
          values: {
            target: { ...data, resource: { initialized: true } },
            updatedAt: now(),
          },
        });
        await tryPublish(conn, settings);
      });
      notify(payload.docId);
    } catch (error) {
      if (context.signal.aborted) context.signal.throwIfAborted();
      const failure = indexingFailure(error);
      await tx(async (conn, settings) => {
        const g = await current(conn, settings, payload.generationId);
        const work = await workRepo(conn).findOne({
          filter: { id: snapshot.work.id },
        });
        if (
          !g ||
          !work ||
          revisionOf(work.wantedRevision) !== payload.sourceRevision ||
          BigInt(revisionOf(work.appliedRevision)) >=
            BigInt(payload.sourceRevision)
        )
          return;
        await workRepo(conn).updateMany({
          filter: { id: work.id },
          values: {
            state: 'failed',
            errorRevision: payload.sourceRevision,
            errorRetryable: failure.retryable,
            errorReason: failure.reason,
            errorMessage: 'Knowledge indexing failed.',
            updatedAt: now(),
          },
        });
        if (settings.buildingGenerationId === g.id)
          await generationsRepo(conn).updateMany({
            filter: { id: g.id },
            values: {
              state: 'failed',
              errorReason: failure.reason,
              errorMessage: 'Knowledge indexing failed.',
              updatedAt: now(),
            },
          });
      });
      deps.onError(
        'INDEXING_UNAVAILABLE',
        new Error('Knowledge indexing failed.'),
      );
      notify(payload.docId);
      // eslint-disable-next-line preserve-caught-error -- The host must never receive private provider error causes.
      if (failure.retryable) throw new Error(failure.reason);
    }
  }
  async function sectionStates(
    sections: readonly { readonly docId: string; readonly ordinal: number }[],
  ) {
    return tx(async (conn, settings) => {
      if (!configOf(settings)) return null;
      const id = settings.buildingGenerationId ?? settings.activeGenerationId;
      if (!id) return null;
      const result = new Map<
        string,
        import('../services/indexing.js').KnowledgeSectionState
      >();
      for (const docId of new Set(sections.map((section) => section.docId))) {
        const source = await sourcesRepo(conn).findOne({ filter: { docId } });
        const work = await workRepo(conn).findOne({
          filter: { generationId: id, docId },
        });
        const ordinals = sections
          .filter((section) => section.docId === docId)
          .map((section) => section.ordinal);
        const chunks = z
          .array(z.object({ id: z.string(), ordinal: z.number() }))
          .parse(
            await conn.query
              .selectFrom('kbChunks')
              .select(['id', 'ordinal'])
              .where('docId', '=', docId)
              .where('ordinal', 'in', ordinals)
              .execute(),
          );
        const currentOrdinals = new Set(chunks.map((chunk) => chunk.ordinal));
        const state =
          source &&
          work &&
          revisionOf(work.wantedRevision) === revisionOf(source.revision)
            ? work.state === 'done' &&
              revisionOf(work.appliedRevision) !== revisionOf(source.revision)
              ? 'pending'
              : work.state
            : 'pending';
        for (const section of sections.filter(
          (item) =>
            item.docId === docId &&
            currentOrdinals.has(item.ordinal) &&
            !source?.deleted,
        ))
          result.set(docId + ':' + section.ordinal, {
            state,
            error: state === 'failed' ? 'Knowledge indexing failed.' : null,
          });
      }
      return result;
    });
  }
  async function capture(spaces: readonly KnowledgeSearchSpace[]) {
    return tx(async (conn, settings) => {
      if (!settings.activeGenerationId) return null;
      const generation = await current(
        conn,
        settings,
        settings.activeGenerationId,
      );
      if (!generation) return null;
      const scopes = [];
      const fences: Record<string, string> = {};
      let nonempty = false;
      for (const space of spaces) {
        const gates = gatesOf([space.gates]);
        if (!gates.length) continue;
        const sources = await sourcesRepo(conn).findMany({
          filter: { spaceId: space.id },
        });
        let safe = true;
        let fence = 0n;
        let chunks = false;
        for (const source of sources) {
          fence =
            BigInt(revisionOf(source.revision)) > fence
              ? BigInt(revisionOf(source.revision))
              : fence;
          const work = await workRepo(conn).findOne({
            filter: { generationId: generation.id, docId: source.docId },
          });
          if (
            !work ||
            work.state !== 'done' ||
            revisionOf(work.appliedRevision) !== revisionOf(source.revision)
          ) {
            safe = false;
            break;
          }
          const content = await deps.knowledge.chunksOf(conn, source.docId);
          if (
            content.doc &&
            gates.includes(content.doc.gate) &&
            content.chunks.length
          )
            chunks = true;
        }
        if (safe) {
          scopes.push({ spaceId: space.id, gates });
          fences[space.id] = String(fence);
          nonempty ||= chunks;
        }
      }
      return { settings, generation, scopes, fences, nonempty };
    });
  }
  async function vectorSearch(
    spaces: readonly KnowledgeSearchSpace[],
    query: string,
    limit: number,
  ) {
    if (!ready || stopping) return [];
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<readonly { chunkId: string; score: number }[]>(
      (resolve) => {
        timer = setTimeout(() => {
          controller.abort();
          resolve([]);
        }, 5000);
      },
    );
    const work = (async () => {
      const snapshot = await capture(spaces);
      if (!snapshot || !snapshot.nonempty || !snapshot.scopes.length) return [];
      const { backend, settings: parsed } = await connection(
        snapshot.generation,
      );
      const channel = instances.get(snapshot.generation.instanceKey)?.extension
        .channels[0];
      if (!channel) return [];
      let input;
      if (parsed.input.kind === 'embedding') {
        const provider = await deps.embedding();
        if (!provider) return [];
        const output = await provider.embed({
          model: parsed.input.model,
          values: [query],
          source: 'knowledge.search',
          signal: controller.signal,
        });
        validateVectors(
          output.embeddings,
          1,
          snapshot.generation.dimension === null
            ? null
            : Number(snapshot.generation.dimension),
        );
        const vector = output.embeddings[0];
        if (!vector) return [];
        input = { kind: 'vector', vector } as const;
      } else input = { kind: 'lexical', text: query } as const;
      controller.signal.throwIfAborted();
      const ranking = await backend.search(
        target(snapshot.settings, snapshot.generation),
        { channel: channel.name, query: input, scopes: snapshot.scopes, limit },
        controller.signal,
      );
      const after = await capture(spaces);
      if (
        !after ||
        after.generation.id !== snapshot.generation.id ||
        requestHash(after.fences) !== requestHash(snapshot.fences) ||
        requestHash(after.scopes) !== requestHash(snapshot.scopes)
      )
        return [];
      await connection(snapshot.generation);
      controller.signal.throwIfAborted();
      return ranking;
    })().catch(() => []);
    try {
      return await Promise.race([work, timeout]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  async function generationTask(
    payload: GenerationPayload,
    context: JobExecutionContext,
  ): Promise<void> {
    try {
      await generationJob(payload, context);
    } catch (error) {
      if (context.signal.aborted) context.signal.throwIfAborted();
      const failure = indexingFailure(error);
      await tx(async (conn, settings) => {
        const g = await current(conn, settings, payload.generationId);
        if (!g || g.scanComplete) return;
        const data = targetOf(g);
        await generationsRepo(conn).updateMany({
          filter: { id: g.id },
          values: {
            state: 'failed',
            errorReason: failure.reason,
            errorMessage: failure.message,
            target: {
              ...data,
              lifecycle: {
                ...data.lifecycle,
                lastActivityAt: now(),
                errorRetryable: failure.retryable,
              },
            },
            updatedAt: now(),
          },
        });
      });
      // eslint-disable-next-line preserve-caught-error -- The host must never receive private provider error causes.
      if (failure.retryable) throw new Error(failure.reason);
    }
  }
  async function dropTargetJob(
    payload: GenerationPayload,
    context: JobExecutionContext,
  ): Promise<void> {
    try {
      context.signal.throwIfAborted();
      const value = await tx(async (conn, settings) => {
        if (
          [settings.activeGenerationId, settings.buildingGenerationId].includes(
            payload.generationId,
          )
        )
          return null;
        const generation = await generationsRepo(conn).findOne({
          filter: { id: payload.generationId },
        });
        if (
          !generation ||
          !['retired', 'superseded', 'failed', 'dropping'].includes(
            generation.state,
          ) ||
          !generation.cleanupAfter ||
          generation.cleanupAfter > now()
        )
          return null;
        await generationsRepo(conn).updateMany({
          filter: { id: generation.id },
          values: { state: 'dropping', updatedAt: now() },
        });
        return { settings, generation };
      });
      if (!value) return;
      // Even an uninitialized target needs its permanent external closed marker before late writers can arrive.
      await storageConnection(value.generation).dropTarget(
        target(value.settings, value.generation),
        context.signal,
      );
      await tx(async (conn, settings) => {
        if (
          [settings.activeGenerationId, settings.buildingGenerationId].includes(
            value.generation.id,
          )
        )
          return;
        await generationsRepo(conn).updateMany({
          filter: { id: value.generation.id, state: 'dropping' },
          values: {
            state: 'dropped',
            errorReason: null,
            errorMessage: null,
            updatedAt: now(),
          },
        });
      });
    } catch (error) {
      const failure = indexingFailure(error);
      await tx(async (conn, settings) => {
        if (
          [settings.activeGenerationId, settings.buildingGenerationId].includes(
            payload.generationId,
          )
        )
          return;
        await generationsRepo(conn).updateMany({
          filter: { id: payload.generationId, state: 'dropping' },
          values: {
            errorReason: failure.reason,
            errorMessage: failure.message,
            updatedAt: now(),
          },
        });
      }).catch(() =>
        deps.onError(
          'INDEXING_CLEANUP_FAILED',
          new Error('Knowledge index cleanup failed.'),
        ),
      );
      if (context.signal.aborted) context.signal.throwIfAborted();
      // Cleanup is not model work: retain its intent for the next hourly sweep, without another retry chain.
      deps.onError('INDEXING_CLEANUP_FAILED', new Error(failure.message));
    }
  }
  async function cleanup(signal: AbortSignal): Promise<void> {
    if (!ready || stopping || !executors) return;
    signal.throwIfAborted();
    const ids = await tx(async (conn, settings) => {
      const time = now();
      await purgeIndexingMetadata(conn, settings, time);
      return dueCleanupTargets(conn, settings, time);
    });
    for (const id of ids) {
      signal.throwIfAborted();
      if (stopping || !ready) return;
      try {
        await executors.executor.addJob(
          new jobs.DropTarget({ version: 1, generationId: id }),
        );
      } catch {
        deps.onError(
          'INDEXING_CLEANUP_DISPATCH_FAILED',
          new Error('Knowledge index cleanup dispatch failed.'),
        );
      }
    }
    await cleanupIndexingSpools(
      deps.storagePath,
      new Date(new Date(now()).getTime() - 86400000),
      signal,
    ).catch(() => {
      if (signal.aborted) signal.throwIfAborted();
      deps.onError(
        'INDEXING_SPOOL_CLEANUP_FAILED',
        new Error('Knowledge index temporary data cleanup failed.'),
      );
    });
  }
  const jobs = createIndexingJobs({
    document: documentJob,
    generation: generationTask,
    dropTarget: dropTargetJob,
  });
  async function replay(
    context: AuthorizationContext,
    requestId: string,
    hash: string,
    operation: string,
  ): Promise<IndexingReceipt | null> {
    const principal = context.identity.principal;
    const prior = await requestsRepo(deps.database.connection()).findOne({
      filter: {
        principalType: principal.type,
        principalId: principal.id,
        requestId,
      },
    });
    if (!prior) return null;
    if (prior.payloadHash !== hash || prior.operation !== operation)
      throw conflict(
        'INDEXING_REQUEST_CONFLICT',
        'The request ID is already in use.',
      );
    return receiptOf(prior);
  }
  async function admit(
    context: AuthorizationContext,
    input: SaveIndexingRequest,
    operation: 'save' | 'rebuild',
  ): Promise<IndexingReceipt> {
    await requireAction(
      context,
      operation === 'save' ? 'configure' : 'rebuild',
    );
    const request = requestSchema.parse(input);
    if (request.config && !request.acknowledgeFullRebuild)
      throw invalid(
        'INVALID_INPUT',
        'Full rebuild acknowledgement is required.',
      );
    const hash = requestHash(
      operation === 'rebuild'
        ? {
            operation,
            requestId: request.requestId,
            expectedRevision: request.expectedRevision,
            acknowledgeFullRebuild: request.acknowledgeFullRebuild,
          }
        : { ...request, operation },
    );
    const principal = context.identity.principal;
    const prior = await requestsRepo(deps.database.connection()).findOne({
      filter: {
        principalType: principal.type,
        principalId: principal.id,
        requestId: request.requestId,
      },
    });
    if (prior) {
      if (prior.payloadHash !== hash || prior.operation !== operation)
        throw conflict(
          'INDEXING_REQUEST_CONFLICT',
          'The request ID is already in use.',
        );
      return receiptOf(prior);
    }
    const prepared = request.config ? await plan(request.config) : null;
    const receipt = await tx(
      async (conn, settings): Promise<IndexingReceipt> => {
        const principal = context.identity.principal;
        const filter = {
          principalType: principal.type,
          principalId: principal.id,
          requestId: request.requestId,
        };
        const prior = await requestsRepo(conn).findOne({ filter });
        if (prior) {
          if (prior.payloadHash !== hash || prior.operation !== operation)
            throw conflict(
              'INDEXING_REQUEST_CONFLICT',
              'The request ID is already in use.',
            );
          return receiptOf(prior);
        }
        if (revisionOf(settings.revision) !== request.expectedRevision)
          throw conflict(
            'INDEXING_REVISION_CONFLICT',
            'Indexing settings changed.',
          );
        if (prepared && !ready)
          throw invalid(
            'INDEXING_JOBS_UNAVAILABLE',
            'Host jobs are unavailable.',
          );
        const changed =
          operation === 'rebuild' ||
          settings.configHash !== (prepared?.configHash ?? null);
        const revision = changed
          ? nextRevision(settings.revision)
          : revisionOf(settings.revision);
        let generationId =
          settings.buildingGenerationId ?? settings.activeGenerationId;
        if (changed) {
          if (settings.buildingGenerationId)
            await generationsRepo(conn).updateMany({
              filter: { id: settings.buildingGenerationId },
              values: {
                state: 'superseded',
                retiredAt: now(),
                cleanupAfter: cleanupAt(new Date(now())),
                updatedAt: now(),
              },
            });
          generationId = prepared ? deps.newId() : null;
          if (prepared && generationId)
            await generationsRepo(conn).createOne({
              values: {
                id: generationId,
                configRevision: revision,
                instanceKey: prepared.instance.key,
                type: prepared.instance.type,
                contractVersion: 1,
                config: { ...prepared.normalized },
                configHash: prepared.configHash,
                resourceHash: prepared.resourceHash,
                embeddingHash: prepared.embeddingHash,
                dimension: prepared.dimension,
                target: { ...EMPTY_TARGET },
                state: 'queued',
                scanCursor: null,
                scanComplete: false,
                errorReason: null,
                errorMessage: null,
                createdAt: now(),
                updatedAt: now(),
                publishedAt: null,
                retiredAt: null,
                cleanupAfter: null,
              },
            });
          if (!prepared && settings.activeGenerationId)
            await generationsRepo(conn).updateMany({
              filter: { id: settings.activeGenerationId },
              values: {
                state: 'retired',
                retiredAt: now(),
                cleanupAfter: cleanupAt(new Date(now())),
                updatedAt: now(),
              },
            });
          await settingsRepo(conn).updateMany({
            filter: { id: 'global' },
            values: {
              revision,
              config: prepared?.normalized ?? null,
              configHash: prepared?.configHash ?? null,
              buildingGenerationId: generationId,
              ...(!prepared ? { activeGenerationId: null } : {}),
              updatedByKind: principal.type,
              updatedById: principal.id,
              updatedAt: now(),
            },
          });
        }
        const result: IndexingReceipt = {
          requestId: request.requestId,
          revision,
          changed,
          enabled: prepared !== null,
          generationId,
          acceptedAt: now(),
        };
        await requestsRepo(conn).createOne({
          values: {
            id: deps.newId(),
            ...filter,
            operation,
            payloadHash: hash,
            receipt: { ...result },
            createdAt: result.acceptedAt,
            expiresAt: new Date(
              new Date(result.acceptedAt).getTime() + 7 * 86400000,
            ).toISOString(),
          },
        });
        return result;
      },
    );
    // Never turn a committed admission into a rejection because submission or its receipt failed.
    if (receipt.changed && receipt.enabled && receipt.generationId)
      await dispatchGeneration(receipt.generationId).catch(() =>
        deps.onError(
          'INDEXING_DISPATCH_FAILED',
          new Error('Knowledge dispatch failed.'),
        ),
      );
    return receipt;
  }
  async function generationStatus(
    conn: DatabaseConnection,
    id: string | null,
  ): Promise<GenerationStatus | null> {
    if (!id) return null;
    const row = await generationsRepo(conn).findOne({ filter: { id } });
    if (!row) return null;
    const raw = await conn.query
      .selectFrom('kbIndexWork')
      .where('generationId', '=', id)
      .select((eb) => [
        'state',
        eb.fn.countAll().as('total'),
        eb.fn.sum('totalChunks').as('chunks'),
        eb.fn.sum('preparedChunks').as('prepared'),
      ])
      .groupBy('state')
      .execute();
    const count = z.coerce.number().int().nonnegative().safe();
    const groups = z
      .array(
        z.object({
          state: z.enum(['pending', 'done', 'failed']),
          total: count,
          chunks: count,
          prepared: count,
        }),
      )
      .parse(raw);
    const counts = {
      total: groups.reduce((sum, group) => sum + group.total, 0),
      done: groups.find((group) => group.state === 'done')?.total ?? 0,
      pending: groups.find((group) => group.state === 'pending')?.total ?? 0,
      failed: groups.find((group) => group.state === 'failed')?.total ?? 0,
      chunks: groups.reduce((sum, group) => sum + group.chunks, 0),
      prepared: groups.reduce((sum, group) => sum + group.prepared, 0),
      committed: groups.find((group) => group.state === 'done')?.chunks ?? 0,
    };
    return {
      id,
      configRevision: revisionOf(row.configRevision),
      state: row.state,
      type: row.type,
      instanceKey: row.instanceKey,
      scanComplete: Boolean(row.scanComplete),
      dimension: row.dimension === null ? null : Number(row.dimension),
      documents: {
        total: row.scanComplete ? counts.total : null,
        done: counts.done,
        pending: counts.pending,
        failed: counts.failed,
      },
      chunks: {
        total: row.scanComplete ? counts.chunks : null,
        prepared: counts.prepared,
        committed: counts.committed,
      },
      retryPolicy: 'hostJobs',
      error: row.errorReason
        ? { reason: row.errorReason, message: 'Knowledge indexing failed.' }
        : null,
      createdAt: row.createdAt,
      publishedAt: row.publishedAt,
      cleanupAfter: row.cleanupAfter,
    };
  }
  return {
    service: {
      async settings(context) {
        await requireAction(context, 'read');
        const row = await settingsRepo(deps.database.connection()).findOne({
          filter: { id: 'global' },
        });
        if (!row)
          throw invalid('INDEXING_UNAVAILABLE', 'Indexing is unavailable.');
        return {
          revision: revisionOf(row.revision),
          config: configOf(row),
          updatedAt: row.updatedAt,
          capabilities: {
            configure: await context.can({
              resource: { type: 'settings', id: 'kb.indexing' },
              action: 'configure',
            }),
            rebuild: await context.can({
              resource: { type: 'settings', id: 'kb.indexing' },
              action: 'rebuild',
            }),
          },
        };
      },
      save: (context, input) => admit(context, input, 'save'),
      async rebuild(context, input) {
        await requireAction(context, 'rebuild');
        const request = rebuildSchema.parse(input);
        const prior = await replay(
          context,
          request.requestId,
          requestHash({ ...request, operation: 'rebuild' }),
          'rebuild',
        );
        if (prior) return prior;
        const row = await settingsRepo(deps.database.connection()).findOne({
          filter: { id: 'global' },
        });
        const config = row ? configOf(row) : null;
        if (!config)
          throw invalid('INDEXING_DISABLED', 'Indexing is disabled.');
        return admit(context, { ...input, config }, 'rebuild');
      },
      async retry(context, input) {
        await requireAction(context, 'rebuild');
        const request = retrySchema.parse(input);
        const hash = requestHash({ ...request, operation: 'retry' });
        const prior = await replay(context, request.requestId, hash, 'retry');
        if (prior) return prior;
        if (!ready)
          throw invalid(
            'INDEXING_JOBS_UNAVAILABLE',
            'Host jobs are unavailable.',
          );
        const generation = await generationsRepo(
          deps.database.connection(),
        ).findOne({ filter: { id: request.generationId } });
        if (!generation)
          throw invalid('INDEXING_UNAVAILABLE', 'Indexing is unavailable.');
        await connection(generation);
        const receipt = await tx(async (conn, settings) => {
          const principal = context.identity.principal;
          const filter = {
            principalType: principal.type,
            principalId: principal.id,
            requestId: request.requestId,
          };
          const previous = await requestsRepo(conn).findOne({ filter });
          if (previous) {
            if (previous.payloadHash !== hash || previous.operation !== 'retry')
              throw conflict(
                'INDEXING_REQUEST_CONFLICT',
                'The request ID is already in use.',
              );
            return receiptOf(previous);
          }
          if (revisionOf(settings.revision) !== request.expectedRevision)
            throw conflict(
              'INDEXING_REVISION_CONFLICT',
              'Indexing settings changed.',
            );
          const currentGeneration = await current(
            conn,
            settings,
            request.generationId,
          );
          if (!currentGeneration)
            throw invalid('INDEXING_UNAVAILABLE', 'Indexing is unavailable.');
          const data = targetOf(currentGeneration);
          await generationsRepo(conn).updateMany({
            filter: { id: currentGeneration.id },
            values: {
              state:
                settings.activeGenerationId === currentGeneration.id
                  ? 'active'
                  : 'building',
              errorReason: null,
              errorMessage: null,
              target: { ...data, lifecycle: { ...EMPTY_TARGET.lifecycle } },
              updatedAt: now(),
            },
          });
          await workRepo(conn).updateMany({
            filter: { generationId: currentGeneration.id, state: 'failed' },
            values: {
              state: 'pending',
              dispatchId: null,
              lastJobId: null,
              lastDispatchedAt: null,
              lastActivityAt: null,
              errorRevision: null,
              errorRetryable: null,
              errorReason: null,
              errorMessage: null,
              updatedAt: now(),
            },
          });
          const accepted: IndexingReceipt = {
            requestId: request.requestId,
            revision: revisionOf(settings.revision),
            changed: true,
            enabled: true,
            generationId: currentGeneration.id,
            acceptedAt: now(),
          };
          await requestsRepo(conn).createOne({
            values: {
              id: deps.newId(),
              ...filter,
              operation: 'retry',
              payloadHash: hash,
              receipt: { ...accepted },
              createdAt: accepted.acceptedAt,
              expiresAt: new Date(
                new Date(accepted.acceptedAt).getTime() + 7 * 86400000,
              ).toISOString(),
            },
          });
          return accepted;
        });
        await reconcile().catch(() =>
          deps.onError(
            'INDEXING_DISPATCH_FAILED',
            new Error('Knowledge dispatch failed.'),
          ),
        );
        return receipt;
      },
      async instances(context) {
        await requireAction(context, 'read');
        return {
          items: [...instances.values()].map((i) => ({
            key: i.key,
            name: i.name,
            type: i.type,
            channels: i.extension.channels,
            available: true,
            reason: null,
          })),
          reason: null,
        };
      },
      async models(context) {
        await requireAction(context, 'read');
        const provider = await deps.embedding();
        return {
          items: provider ? await provider.catalog() : [],
          reason: provider ? null : 'INDEXING_MODEL_UNKNOWN',
        };
      },
      async status(context): Promise<IndexingStatus> {
        await requireAction(context, 'read');
        const conn = deps.database.connection();
        const row = await settingsRepo(conn).findOne({
          filter: { id: 'global' },
        });
        if (!row)
          throw invalid('INDEXING_UNAVAILABLE', 'Indexing is unavailable.');
        const serving = await generationStatus(conn, row.activeGenerationId);
        const desired =
          (await generationStatus(conn, row.buildingGenerationId)) ?? serving;
        const enabled = configOf(row) !== null;
        let dependencyReason: string | null = null;
        const observedGenerationId =
          row.activeGenerationId ?? row.buildingGenerationId;
        if (enabled && ready && observedGenerationId) {
          try {
            const observed = await generationsRepo(conn).findOne({
              filter: { id: observedGenerationId },
            });
            const config = observed && configOf(observed);
            if (!observed || !config)
              throw invalid('INDEXING_UNAVAILABLE', 'Indexing is unavailable.');
            if ((await plan(config)).configHash !== observed.configHash)
              throw invalid(
                'INDEXING_MODEL_CHANGED',
                'Indexing dependencies changed.',
              );
          } catch (error) {
            dependencyReason = indexingFailure(error).reason;
          }
        }
        return {
          revision: revisionOf(row.revision),
          enabled,
          availability: !enabled
            ? 'disabled'
            : !ready || dependencyReason !== null
              ? 'unavailable'
              : !serving
                ? desired?.state === 'failed'
                  ? 'unavailable'
                  : 'building'
                : serving.documents.pending ||
                    serving.documents.failed ||
                    desired?.state === 'failed' ||
                    desired?.documents.failed
                  ? 'degraded'
                  : row.buildingGenerationId
                    ? 'building'
                    : 'ready',
          reason: enabled
            ? !ready
              ? 'INDEXING_JOBS_UNAVAILABLE'
              : dependencyReason
            : null,
          serving,
          target: desired,
          observedAt: now(),
        };
      },
    },
    async start() {
      releaseIndexer = deps.knowledge.registerIndexer({
        notifications: 'partial',
        onChange(listener) {
          indexListeners.add(listener);
          return () => indexListeners.delete(listener);
        },
        async states(sections) {
          return sectionStates(sections);
        },
        async unfinished(spaceId, limit) {
          const sections = await tx(async (conn, settings) => {
            if (!configOf(settings)) return null;
            const generationId =
              settings.buildingGenerationId ?? settings.activeGenerationId;
            if (!generationId) return null;
            const page = async (failed: boolean, count: number) => {
              if (count <= 0) return [];
              let query = conn.query
                .selectFrom('kbChunks as chunk')
                .innerJoin(
                  'kbIndexSources as source',
                  'source.docId',
                  'chunk.docId',
                )
                .leftJoin('kbIndexWork as work', (join) =>
                  join
                    .onRef('work.docId', '=', 'source.docId')
                    .on('work.generationId', '=', generationId),
                )
                .select(['chunk.docId', 'chunk.ordinal'])
                .where('source.spaceId', '=', spaceId)
                .where('source.deleted', '=', false);
              query = failed
                ? query.where('work.state', '=', 'failed')
                : query.where((eb) =>
                    eb.and([
                      eb.or([
                        eb('work.state', 'is', null),
                        eb('work.state', '!=', 'failed'),
                      ]),
                      eb.or([
                        eb('work.id', 'is', null),
                        eb('work.state', '!=', 'done'),
                        eb(
                          'work.appliedRevision',
                          '!=',
                          eb.ref('source.revision'),
                        ),
                      ]),
                    ]),
                  );
              return z
                .array(z.object({ docId: z.string(), ordinal: z.number() }))
                .parse(
                  await query
                    .orderBy('chunk.docId', 'asc')
                    .orderBy('chunk.ordinal', 'asc')
                    .limit(count)
                    .execute(),
                );
            };
            const failed = await page(true, limit);
            return [...failed, ...(await page(false, limit - failed.length))];
          });
          if (!sections) return null;
          const states = await sectionStates(sections);
          if (!states) return null;
          return sections
            .flatMap((section) => {
              const state = states.get(section.docId + ':' + section.ordinal);
              return state && state.state !== 'done'
                ? [{ ...section, ...state }]
                : [];
            })
            .sort((a, b) =>
              a.state === b.state ? 0 : a.state === 'failed' ? -1 : 1,
            );
        },
        async reindex(docId) {
          await tx(async (conn, settings) => {
            if (!configOf(settings)) return;
            const doc = await findDoc(conn, docId);
            if (!doc || doc.kind === 'folder' || doc.archivedAt) return;
            await advanceSources(
              conn,
              settings,
              [{ docId, spaceId: doc.spaceId, deleted: false, force: true }],
              deps.newId,
              now(),
            );
          });
          notify(docId);
          await reconcile().catch(() =>
            deps.onError(
              'INDEXING_DISPATCH_FAILED',
              new Error('Knowledge dispatch failed.'),
            ),
          );
        },
      });
      deps.registry.seal();
      executors = deps.jobs();
      if (!executors) return;
      try {
        executors.executor.registerJob(jobs.Document);
        executors.executor.registerJob(jobs.Generation);
        executors.executor.registerJob(jobs.DropTarget);
        await executors.executor.setup();
        await executors.schedule.addJob({
          name: 'knowledge.indexing.reconcile',
          options: { every: 30000 },
          payload: { version: 1 },
          execute: async () => reconcile(),
        });
        await executors.schedule.addJob({
          name: 'knowledge.indexing.cleanup',
          options: { every: 3600000 },
          payload: { version: 1 },
          execute: async ({ signal }) => cleanup(signal),
        });
        await executors.schedule.setup();
        ready = true;
        releaseSearch = deps.knowledge.registerSearchProvider({
          name: 'knowledgeIndex',
          search: (spaces, query, { limit }) =>
            vectorSearch(spaces, query, limit),
        });
        unsubscribe = deps.knowledge.events.on((event) => {
          if (event.type === 'chunks.changed')
            void reconcile().catch(() =>
              deps.onError(
                'INDEXING_DISPATCH_FAILED',
                new Error('Knowledge reconciliation failed.'),
              ),
            );
        });
        await reconcile();
      } catch {
        ready = false;
        await executors.schedule.shutdown();
        await executors.executor.shutdown();
        deps.onError(
          'INDEXING_JOBS_UNAVAILABLE',
          new Error('Knowledge jobs setup failed.'),
        );
      }
    },
    async close() {
      closing ??= (async () => {
        stopping = true;
        ready = false;
        unsubscribe?.();
        releaseSearch?.();
        releaseIndexer?.();
        indexListeners.clear();
        let scheduleFailed = false;
        try {
          await executors?.schedule.shutdown();
        } catch {
          scheduleFailed = true;
        }
        try {
          await executors?.executor.shutdown();
        } catch {
          // Do not close storage while handler quiescence is unproven.
          throw new Error('Knowledge indexing executor shutdown failed.');
        }
        const results = await Promise.allSettled(
          [...backends.values()].map((backend) => backend.close()),
        );
        if (
          scheduleFailed ||
          results.some((result) => result.status === 'rejected')
        )
          throw new Error('Knowledge indexing resource shutdown failed.');
      })();
      await closing;
    },
  };
}

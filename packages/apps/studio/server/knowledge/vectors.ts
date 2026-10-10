/**
 * Vector search over the knowledge base: Studio joins the knowledge plugin (which has no AI) to the agents plugin's
 * model services and vector index (`agents.vectors`).
 *
 * - **The index** is the vector collection `studio-knowledge`: one item per section of a live entry's current version
 *   (`<docId>:<ordinal>`), with the metadata `{ spaceKey, docId, version, chunkId, gate }` (`spaceKey` is the knowledge
 *   plugin's space id, as its search providers are given spaces; `gate` its access gate, `space:<spaceId>` or
 *   `node:<aclKey>`). Its embedding model is the knowledge search
 *   settings' (`search-settings.ts`); none, or no vector store (`agents.vectors`: sqlite-vec by default, or pgvector, or
 *   turned off), and search is by words only. When the model changes, the agents plugin builds a new index in the background from every section
 *   (`eachChunk`) and keeps answering from the old one until it is ready.
 * - **Keeping it current**: each `chunks.changed` of the knowledge plugin replaces the entry's items with its sections
 *   now (none when it was archived), through the collection's queue, which embeds in batches, skips sections whose text
 *   did not change and retries failures. A change of permissions announces it too, so only the gate is updated.
 * - **Index state**: the knowledge plugin's indexer (`registerIndexer`) answers each section's state from the
 *   collection's entries, the unfinished sections of a space, and queues an entry again (the failed ones included).
 * - **Search**: a `KnowledgeSearchProvider` named `vector` embeds the query and asks the index for the nearest sections
 *   whose gate the reader's gates hold (the filter is applied in the store's query, before its top-k), so the knowledge
 *   plugin fuses it with its word match by Reciprocal Rank Fusion, and a restricted section is never among the top-k. With a rerank model set, a reranker reorders the
 *   fused hits, at most the recall settings' `rerankCandidates`.
 * - **Contextual retrieval** (Anthropic's): for the spaces the settings name, and only with a context model set, a
 *   section is embedded after a sentence situating it in its document, which that model writes once per section text
 *   and Studio keeps (`studioKbContexts`); the sentence is part of what the queue hashes, so turning it on or off for a
 *   space re-embeds that space's sections.
 */
import { createHash } from 'node:crypto';

import type {
  ModelGateway,
  VectorCollection,
  VectorIndexInfo,
  VectorSourceItem,
  Vectors,
} from '@nocobase/app-plugin-agents/server/tokens';
import { gatesOf } from '@nocobase/app-plugin-knowledge/server';
import type {
  Knowledge,
  KnowledgeSearchProvider,
  KnowledgeSearchReranker,
} from '@nocobase/app-plugin-knowledge/server/tokens';
import type { SpaceRef } from '@nocobase/app-plugin-knowledge/shared/knowledge';
import type { DatabaseManager } from '@nocobase/db';

import {
  spaceSettingKey,
  type KnowledgeIndexStatus,
  type KnowledgeSearchSettings,
} from '../../shared/knowledge.js';
import type { KnowledgeSearchSettingsStore } from './search-settings.js';

export const KNOWLEDGE_COLLECTION = 'studio-knowledge';
/** What the agents plugin's usage records name this use. */
export const KNOWLEDGE_USAGE_SOURCE = 'studio.knowledge';
/** The variant of a section embedded with its context sentence. */
const CONTEXT_VARIANT = 'ctx';
/** How much of a document a context sentence is written from. */
const DOCUMENT_MAX = 24_000;
/** How many fused hits a reranker reorders at most. */
export const RERANK_MAX = 50;
const CONTEXTS = 'studioKbContexts';

export interface KnowledgeVectorsDeps {
  readonly knowledge: () => Knowledge;
  readonly vectors: () => Vectors;
  readonly gateway: () => ModelGateway;
  readonly settings: KnowledgeSearchSettingsStore;
  readonly database: Pick<DatabaseManager, 'connection' | 'transaction'>;
  readonly onError: (message: string, error: unknown) => void;
}

export interface KnowledgeVectors {
  /** The vector index as the settings page shows it. */
  status(): Promise<KnowledgeIndexStatus>;
  /** Stops listening and removes the provider, the reranker and the collection. */
  close(): void;
}

const sha256 = (text: string) =>
  createHash('sha256').update(text, 'utf8').digest('hex');

/** The prompt of Anthropic's contextual retrieval, asking for one sentence. */
export function contextPrompt(chunk: string): string {
  return [
    'Here is the chunk we want to situate within the whole document:',
    '<chunk>',
    chunk,
    '</chunk>',
    'Please give a short succinct context, one sentence, to situate this chunk within the overall document for the purposes of improving search retrieval of the chunk. Answer only with the succinct context and nothing else.',
  ].join('\n');
}

/** The text embedded for a section: its context sentence first, when it has one. */
export function withContext(context: string | null, text: string): string {
  return context ? `${context.trim()}\n\n${text}` : text;
}

export function createKnowledgeVectors(
  deps: KnowledgeVectorsDeps,
): KnowledgeVectors {
  const releases: (() => void)[] = [];
  const knowledge = deps.knowledge();
  const gateway = () => deps.gateway();

  /** Whether a space's sections are embedded with a context sentence now. */
  const contextualIn = (settings: KnowledgeSearchSettings, space: SpaceRef) =>
    settings.contextModel !== null &&
    settings.contextual.includes(spaceSettingKey(space));

  const item = (
    settings: KnowledgeSearchSettings,
    section: {
      readonly chunkId: string;
      readonly docId: string;
      readonly spaceId: string;
      readonly space: SpaceRef;
      readonly version: number;
      readonly ordinal: number;
      readonly text: string;
      readonly gate: string;
    },
  ): VectorSourceItem => ({
    id: `${section.docId}:${section.ordinal}`,
    text: section.text,
    metadata: {
      spaceKey: section.spaceId,
      docId: section.docId,
      version: section.version,
      chunkId: section.chunkId,
      gate: section.gate,
    },
    ...(contextualIn(settings, section.space)
      ? { variant: CONTEXT_VARIANT }
      : {}),
  });

  /** The context sentences of `docId`'s sections, keyed by their text's hash. */
  async function contextsOf(docId: string): Promise<Map<string, string>> {
    const rows = await deps.database
      .connection()
      .repository<{ docId: string; chunkHash: string; context: string }>(
        CONTEXTS,
      )
      .findMany({ filter: { docId } });
    return new Map(rows.map((row) => [row.chunkHash, row.context]));
  }

  /** Writes the missing context sentences of one entry's sections, and answers each section's. */
  async function contextualize(
    docId: string,
    texts: readonly string[],
    signal: AbortSignal,
  ): Promise<(string | null)[]> {
    const settings = await deps.settings.get();
    const model = settings.contextModel;
    const known = await contextsOf(docId);
    if (!model) return texts.map((text) => known.get(sha256(text)) ?? null);
    const conn = deps.database.connection();
    const { chunks } = await knowledge.chunksOf(conn, docId);
    const document = chunks
      .map((chunk) => chunk.text)
      .join('\n\n')
      .slice(0, DOCUMENT_MAX);
    const answers: (string | null)[] = [];
    for (const text of texts) {
      const hash = sha256(text);
      let context = known.get(hash) ?? null;
      if (context === null) {
        const { text: written } = await gateway().generate({
          model,
          system: `<document>\n${document}\n</document>`,
          prompt: contextPrompt(text),
          maxOutputTokens: 120,
          source: KNOWLEDGE_USAGE_SOURCE,
          signal,
        });
        context = written.replace(/\s+/gu, ' ').trim().slice(0, 600) || null;
        if (context) {
          known.set(hash, context);
          await deps.database
            .connection()
            .repository(CONTEXTS)
            .deleteMany({ filter: { id: `${docId}:${hash}` } });
          await deps.database
            .connection()
            .repository(CONTEXTS)
            .createOne({
              values: {
                id: `${docId}:${hash}`,
                docId,
                chunkHash: hash,
                context,
                model: `${model.modelService}/${model.model}`,
                createdAt: new Date().toISOString(),
              },
            });
        }
      }
      answers.push(context);
    }
    return answers;
  }

  const collection: VectorCollection = deps.vectors().collection({
    name: KNOWLEDGE_COLLECTION,
    source: KNOWLEDGE_USAGE_SOURCE,
    filterable: ['spaceKey', 'docId', 'gate'],
    model: async () => (await deps.settings.get()).embedding,
    async *items() {
      const settings = await deps.settings.get();
      for await (const batch of knowledge.eachChunk({ batchSize: 200 }))
        yield batch.map((section) => item(settings, section));
    },
    async prepare(items, signal) {
      const texts = items.map((entry) => entry.text);
      const contextual = items
        .map((entry, index) => ({ entry, index }))
        .filter(({ entry }) => entry.variant === CONTEXT_VARIANT);
      const byDoc = new Map<string, { index: number; text: string }[]>();
      for (const { entry, index } of contextual) {
        const docId = String(entry.metadata.docId);
        const list = byDoc.get(docId) ?? [];
        list.push({ index, text: entry.text });
        byDoc.set(docId, list);
      }
      for (const [docId, list] of byDoc) {
        const contexts = await contextualize(
          docId,
          list.map((entry) => entry.text),
          signal,
        );
        list.forEach((entry, at) => {
          texts[entry.index] = withContext(contexts[at] ?? null, entry.text);
        });
      }
      return texts;
    },
  });
  releases.push(() => collection.close());

  /** Replaces an entry's items with its sections now, and drops the context sentences it no longer needs. */
  async function reindex(docId: string): Promise<void> {
    const settings = await deps.settings.get();
    const { doc, chunks } = await knowledge.chunksOf(
      deps.database.connection(),
      docId,
    );
    const items =
      doc && !doc.archived
        ? chunks.map((chunk) =>
            item(settings, {
              chunkId: chunk.id,
              docId,
              spaceId: doc.spaceId,
              space: doc.space,
              version: doc.version,
              ordinal: chunk.ordinal,
              text: chunk.text,
              gate: doc.gate,
            }),
          )
        : [];
    await collection.replace({ docId }, items);
    const keep = new Set(chunks.map((chunk) => sha256(chunk.text)));
    const stale = [...(await contextsOf(docId)).keys()].filter(
      (hash) => !keep.has(hash),
    );
    if (stale.length > 0)
      await deps.database
        .connection()
        .repository(CONTEXTS)
        .deleteMany({
          filter: (f) =>
            f.or(stale.map((hash) => f.string('id').eq(`${docId}:${hash}`))),
        });
  }

  /** Upserts every section of the spaces whose contextual retrieval changed, so they are embedded again. */
  async function refreshSpaces(keys: ReadonlySet<string>): Promise<void> {
    const settings = await deps.settings.get();
    for await (const batch of knowledge.eachChunk({ batchSize: 200 })) {
      const changed = batch.filter((section) =>
        keys.has(spaceSettingKey(section.space)),
      );
      if (changed.length > 0)
        await collection.upsert(
          changed.map((section) => item(settings, section)),
        );
    }
  }

  releases.push(
    knowledge.events.on(async (event) => {
      if (event.type !== 'chunks.changed') return;
      try {
        await reindex(event.docId);
      } catch (error) {
        deps.onError(
          `Studio could not index the knowledge entry ${event.docId}.`,
          error,
        );
      }
    }),
  );

  releases.push(
    deps.settings.onChange((next, previous) => {
      const before = new Set(
        previous.contextModel ? previous.contextual : ([] as string[]),
      );
      const after = new Set(
        next.contextModel ? next.contextual : ([] as string[]),
      );
      const flipped = new Set(
        [...before, ...after].filter(
          (key) => before.has(key) !== after.has(key),
        ),
      );
      void (async () => {
        await collection.sync();
        if (flipped.size > 0) await refreshSpaces(flipped);
      })().catch((error: unknown) =>
        deps.onError(
          'Studio could not apply the knowledge search settings.',
          error,
        ),
      );
    }),
  );

  const provider: KnowledgeSearchProvider = {
    name: 'vector',
    async search(spaces, query, { limit }) {
      if (spaces.length === 0 || !query.trim()) return [];
      const matches = await collection.search(query, {
        topK: limit,
        filter: { gate: { in: gatesOf(spaces.map((space) => space.gates)) } },
      });
      return (matches ?? []).flatMap((match) =>
        typeof match.metadata.chunkId === 'string'
          ? [{ chunkId: match.metadata.chunkId, score: match.score }]
          : [],
      );
    },
  };
  releases.push(knowledge.registerSearchProvider(provider));

  const reranker: KnowledgeSearchReranker = {
    name: 'rerank',
    async rerank(query, candidates, { limit }) {
      const settings = await deps.settings.get();
      const model = settings.rerank;
      // Without a rerank model the fused order stands.
      if (!model || candidates.length < 2) return [];
      const shown = candidates.slice(
        0,
        Math.min(settings.recall.rerankCandidates, RERANK_MAX),
      );
      const { ranking } = await gateway().rerank({
        model,
        query,
        documents: shown.map((candidate) => candidate.text),
        topN: Math.min(limit, shown.length),
        source: KNOWLEDGE_USAGE_SOURCE,
      });
      return ranking.flatMap(({ index, score }) => {
        const candidate = shown[index];
        return candidate ? [{ chunkId: candidate.chunkId, score }] : [];
      });
    },
  };
  releases.push(knowledge.registerReranker(reranker));

  // Each section's state in the index searches read, by its item (`<docId>:<ordinal>`).
  const itemOf = (id: string) => {
    const at = id.lastIndexOf(':');
    return { docId: id.slice(0, at), ordinal: Number(id.slice(at + 1)) };
  };
  releases.push(
    knowledge.registerIndexer({
      async states(sections) {
        const found = await collection.states(
          sections.map((section) => `${section.docId}:${section.ordinal}`),
        );
        return found
          ? new Map(
              [...found].map(([id, item]) => [
                id,
                { state: item.state, error: item.error },
              ]),
            )
          : null;
      },
      async unfinished(spaceId, limit) {
        const found = await collection.unfinished({
          filter: { spaceKey: spaceId },
          limit,
        });
        return found
          ? found.map((item) => ({
              ...itemOf(item.id),
              state: item.state,
              error: item.error,
            }))
          : null;
      },
      reindex,
    }),
  );

  void collection
    .sync()
    .catch((error: unknown) =>
      deps.onError('Studio could not prepare the knowledge index.', error),
    );

  return {
    async status() {
      const status = await collection.status();
      const brief = (index: VectorIndexInfo | null) =>
        index
          ? {
              modelService: index.modelService,
              model: index.model,
              dimension: index.dimension,
              indexed: index.indexed,
              total: index.total,
            }
          : null;
      return {
        available: status.available,
        store: status.store ? { type: status.store.type } : null,
        reason: status.reason?.code ?? null,
        active: brief(status.active),
        building: brief(status.building),
        pending: status.pending,
        failed: status.failed,
      };
    },
    close() {
      for (const release of releases.splice(0).reverse()) release();
    },
  };
}

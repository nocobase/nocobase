/**
 * How documents are cut and searched, as the application sets it (`KnowledgeSettingsSource`, the defaults until it
 * binds its own with `Knowledge.bindSettings`), and each space's own chunking (`kbSpaces.settings.chunking`, set by
 * whoever manages the space).
 *
 * When a space's chunking changes, or the application's default does for the spaces that follow it, every entry of the
 * space is cut again in the background (`schedule`), one transaction per entry, rewriting only those whose sections
 * change: each rewrite announces `chunks.changed`, so a semantic index follows and its progress shows in the index
 * status. A space being cut again is marked in its settings (`rechunk`), so work cut short by a stop is picked up at
 * start (`resume`).
 */
import {
  chunkingOf,
  DEFAULT_CHUNKING,
  DEFAULT_RECALL,
  type KnowledgeChunking,
  type KnowledgeChunkingConfig,
  type KnowledgeRecall,
  type SpaceRef,
} from '../../shared/knowledge.js';
import { forbidden, invalid } from '../errors.js';
import { createAccessCheck, type KnowledgeReader } from './access.js';
import { chunkMarkdown } from './chunks.js';
import type { KnowledgeContext, KnowledgeTx } from './context.js';
import {
  chunksRepo,
  docsRepo,
  findDoc,
  findSpace,
  findSpaceById,
  findVersion,
  json,
  num,
  spacesRepo,
} from './store.js';
import { ensureSpace, writeChunks } from './writes.js';

/** The application's settings for cutting and searching, read on each use. */
export interface KnowledgeSettingsSource {
  /** The chunking of every space without its own. */
  chunking(): Promise<KnowledgeChunking>;
  recall(): Promise<KnowledgeRecall>;
  /**
   * Whether `reader` may see how hits are ranked in any space (the application's search settings); someone who manages
   * a space may anyway.
   */
  mayExplain?(reader: KnowledgeReader): Promise<boolean>;
}

export const DEFAULT_SETTINGS: KnowledgeSettingsSource = {
  chunking: () => Promise.resolve(DEFAULT_CHUNKING),
  recall: () => Promise.resolve(DEFAULT_RECALL),
};

interface SpaceSettings {
  readonly chunking?: unknown;
  readonly rechunk?: boolean;
}

const settingsOf = (value: unknown): SpaceSettings =>
  json<SpaceSettings>(value, {}) ?? {};

/** The application's chunking, or the default when what it answers is not valid. */
export async function defaultChunking(
  context: Pick<KnowledgeContext, 'settings'>,
): Promise<KnowledgeChunking> {
  return chunkingOf(await context.settings().chunking()) ?? DEFAULT_CHUNKING;
}

/** The chunking of a space now, inside a transaction: its own, else the application's. */
export async function chunkingFor(
  tx: Pick<KnowledgeTx, 'conn' | 'defaultChunking'>,
  spaceId: string,
): Promise<KnowledgeChunking> {
  const space = await findSpaceById(tx.conn, spaceId);
  return chunkingOf(settingsOf(space?.settings).chunking) ?? tx.defaultChunking;
}

/** The application's recall settings, each bounded. */
export async function recallOf(
  context: Pick<KnowledgeContext, 'settings'>,
): Promise<KnowledgeRecall> {
  const raw = await context.settings().recall();
  const bounded = (
    value: unknown,
    min: number,
    max: number,
    fallback: number,
  ) =>
    typeof value === 'number' && Number.isFinite(value)
      ? Math.min(max, Math.max(min, value))
      : fallback;
  const weights: Record<string, number> = {};
  for (const [name, weight] of Object.entries(raw.weights ?? {}))
    weights[name] = bounded(weight, 0, 10, 1);
  return {
    limit: Math.round(bounded(raw.limit, 1, 100, DEFAULT_RECALL.limit)),
    minScore: bounded(raw.minScore, 0, 1, DEFAULT_RECALL.minScore),
    weights,
    rerankCandidates: Math.round(
      bounded(raw.rerankCandidates, 1, 50, DEFAULT_RECALL.rerankCandidates),
    ),
  };
}

export interface ChunkingService {
  /** A space's chunking: the application's, the space's own and whether it is being cut again. */
  get(
    viewer: KnowledgeReader,
    space: SpaceRef,
  ): Promise<KnowledgeChunkingConfig>;
  /** Sets or clears (`null`) a space's own chunking (`manage` on the space), and cuts it again when that changes. */
  set(
    viewer: KnowledgeReader,
    space: SpaceRef,
    override: unknown,
  ): Promise<KnowledgeChunkingConfig>;
  /** After the application's default changed: cuts again every space that follows it. */
  defaultChanged(): Promise<void>;
  /** Picks up the spaces whose cutting a stop cut short. */
  resume(): Promise<void>;
  /** Resolves once no space is being cut again; for tests. */
  idle(): Promise<void>;
}

export function createChunkingService(
  context: KnowledgeContext,
): ChunkingService {
  const queued = new Set<string>();
  /** Spaces whose chunking changed again while they were being cut. */
  const again = new Set<string>();
  let running: string | null = null;
  let chain: Promise<void> = Promise.resolve();

  async function mark(spaceId: string, rechunk: boolean): Promise<void> {
    const conn = context.read();
    const space = await findSpaceById(conn, spaceId);
    if (!space) return;
    const { rechunk: _was, ...rest } = settingsOf(space.settings);
    await spacesRepo(conn).updateMany({
      filter: { id: spaceId },
      values: {
        settings: rechunk ? { ...rest, rechunk: true } : rest,
        updatedAt: context.now().toISOString(),
      },
    });
  }

  /** Cuts one entry again when its sections would change. */
  async function rechunkDoc(docId: string): Promise<void> {
    await context.transaction(async (tx) => {
      const doc = await findDoc(tx.conn, docId);
      if (!doc || doc.kind === 'folder') return;
      const version = await findVersion(
        tx.conn,
        docId,
        num(doc.currentVersion),
      );
      if (!version) return;
      const text =
        !version.fileId || version.parseStatus === 'ready'
          ? version.content
          : '';
      const next = text.trim()
        ? chunkMarkdown(text, await chunkingFor(tx, doc.spaceId))
        : [];
      const now = await chunksRepo(tx.conn).findMany({
        filter: { docId },
        sort: (sort) => sort.field('ordinal').asc(),
      });
      const same =
        now.length === next.length &&
        now.every((chunk, at) => {
          const wanted = next[at];
          return (
            num(chunk.ordinal) === wanted.ordinal &&
            chunk.hash === wanted.hash &&
            num(chunk.lineStart) === wanted.lineStart &&
            num(chunk.lineEnd) === wanted.lineEnd &&
            JSON.stringify(json<string[]>(chunk.headingPath, [])) ===
              JSON.stringify(wanted.headingPath)
          );
        });
      if (same) return;
      const space = await findSpaceById(tx.conn, doc.spaceId);
      if (!space) return;
      await writeChunks(
        context,
        tx,
        doc,
        { scope: space.scope, scopeId: space.scopeId ?? '' },
        num(doc.currentVersion),
        text,
      );
    });
  }

  async function run(spaceId: string): Promise<void> {
    running = spaceId;
    try {
      const ids = (
        await docsRepo(context.read()).findMany({ filter: { spaceId } })
      ).map((doc) => doc.id);
      for (const id of ids)
        try {
          await rechunkDoc(id);
        } catch (error) {
          context.onError(
            `Could not cut the knowledge entry ${id} again.`,
            error,
          );
        }
      if (!again.has(spaceId)) await mark(spaceId, false);
    } finally {
      running = null;
      queued.delete(spaceId);
    }
    if (again.delete(spaceId)) await schedule(spaceId);
  }

  async function schedule(spaceId: string): Promise<void> {
    await mark(spaceId, true);
    if (running === spaceId) again.add(spaceId);
    if (queued.has(spaceId)) return;
    queued.add(spaceId);
    chain = chain
      .then(() => run(spaceId))
      .catch((error: unknown) =>
        context.onError('Could not cut a knowledge space again.', error),
      );
  }

  async function config(
    viewer: KnowledgeReader,
    space: SpaceRef,
  ): Promise<KnowledgeChunkingConfig> {
    const access = createAccessCheck(context, viewer);
    const rights = await access.requireRead(space);
    const record = await findSpace(context.read(), space);
    const own = chunkingOf(settingsOf(record?.settings).chunking);
    const defaults = await defaultChunking(context);
    return {
      defaults,
      override: own,
      effective: own ?? defaults,
      rechunking:
        record !== null &&
        (queued.has(record.id) || settingsOf(record.settings).rechunk === true),
      canManage: rights.manage && !viewer.actor,
    };
  }

  return {
    get: config,

    async set(viewer, space, override) {
      const access = createAccessCheck(context, viewer);
      const rights = await access.requireRead(space);
      if (!rights.manage || viewer.actor)
        throw forbidden(
          'Only someone who manages the space may change how it is cut.',
        );
      const wanted = override === null ? null : chunkingOf(override);
      if (override !== null && wanted === null)
        throw invalid(
          'INVALID_CHUNKING',
          'The heading depth is 1 to 3, and the target and the limit are 200 to 8000 characters, the target at most the limit.',
          'override',
        );
      const record = await context.transaction(async (tx) => {
        const found = await ensureSpace(
          context,
          tx.conn,
          space,
          context.now().toISOString(),
        );
        const { chunking: _before, ...rest } = settingsOf(found.settings);
        await spacesRepo(tx.conn).updateMany({
          filter: { id: found.id },
          values: {
            settings: wanted ? { ...rest, chunking: wanted } : rest,
            updatedAt: context.now().toISOString(),
          },
        });
        return {
          id: found.id,
          before: chunkingOf(settingsOf(found.settings).chunking),
        };
      });
      if (JSON.stringify(record.before) !== JSON.stringify(wanted))
        await schedule(record.id);
      return config(viewer, space);
    },

    async defaultChanged() {
      for (const space of await spacesRepo(context.read()).findMany({}))
        if (!chunkingOf(settingsOf(space.settings).chunking))
          await schedule(space.id);
    },

    async resume() {
      for (const space of await spacesRepo(context.read()).findMany({}))
        if (settingsOf(space.settings).rechunk === true)
          await schedule(space.id);
    },

    async idle() {
      for (;;) {
        const current = chain;
        await current;
        if (current === chain) return;
      }
    },
  };
}

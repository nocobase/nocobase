/**
 * How the knowledge base is searched (`KnowledgeSearchSettings`, `shared/knowledge.ts`), kept in `studioSettings` under
 * `knowledgeSearch`: the embedding, rerank and context models, the spaces with contextual retrieval, the token
 * threshold of whole-in-prompt, the default chunking and how search ranks its hits. Read often (every search and online claim), so the last value read is kept for a few
 * seconds; a save replaces it at once and tells the listeners (the vector index re-reads its model).
 */
import type { DatabaseManager } from '@nocobase/db';
import { z } from 'zod';

import {
  CHUNK_SIZE_MAX,
  CHUNK_SIZE_MIN,
} from '@nocobase/app-plugin-knowledge/shared/knowledge';

import {
  DEFAULT_KNOWLEDGE_SEARCH,
  WHOLE_TOKENS_MAX,
  type KnowledgeSearchSettings,
} from '../../shared/knowledge.js';

const SETTINGS_TABLE = 'studioSettings';
export const KNOWLEDGE_SEARCH_SETTING = 'knowledgeSearch';
const CACHE_MS = 5_000;

const modelRef = {
  modelService: z.string().trim().min(1).max(64),
  model: z.string().trim().min(1).max(200),
};

const size = z.number().int().min(CHUNK_SIZE_MIN).max(CHUNK_SIZE_MAX);
const chunking = {
  headingDepth: z.number().int().min(1).max(3),
  target: size,
  max: size,
};
const targetWithinMax = (value: { target: number; max: number }) =>
  value.target <= value.max;
const recall = {
  limit: z.number().int().min(1).max(100),
  minScore: z.number().min(0).max(1),
  keywordWeight: z.number().min(0).max(1),
  rerankCandidates: z.number().int().min(1).max(50),
};

const fields = {
  contextual: z.array(z.string().trim().min(1).max(200)).max(1000),
  wholeTokens: z.number().int().min(0).max(WHOLE_TOKENS_MAX),
};

/** The stored settings, read leniently. */
export const KnowledgeSearchSettingsSchema: z.ZodType<KnowledgeSearchSettings> =
  z.object({
    embedding: z.object(modelRef).nullable(),
    rerank: z.object(modelRef).nullable(),
    contextModel: z.object(modelRef).nullable(),
    ...fields,
    chunking: z.object(chunking).refine(targetWithinMax),
    recall: z.object(recall),
  });

/** The body of `PUT /api/knowledgeSearch`: every field, nothing else; `chunking` and `recall` keep their defaults when left out. */
export const KnowledgeSearchSettingsInput: z.ZodType<
  KnowledgeSearchSettings,
  unknown
> = z.strictObject({
  embedding: z.strictObject(modelRef).nullable(),
  rerank: z.strictObject(modelRef).nullable(),
  contextModel: z.strictObject(modelRef).nullable(),
  ...fields,
  chunking: z
    .strictObject(chunking)
    .refine(targetWithinMax, {
      message: 'The target must not be more than the limit.',
      path: ['target'],
    })
    .default(DEFAULT_KNOWLEDGE_SEARCH.chunking),
  recall: z.strictObject(recall).default(DEFAULT_KNOWLEDGE_SEARCH.recall),
});

/** A stored value as settings, the defaults filling what is missing or unreadable. */
export function settingsOf(value: unknown): KnowledgeSearchSettings {
  const raw: unknown = typeof value === 'string' ? safeParse(value) : value;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    return DEFAULT_KNOWLEDGE_SEARCH;
  const merged = {
    ...DEFAULT_KNOWLEDGE_SEARCH,
    ...(raw as Record<string, unknown>),
  };
  // Settings saved before a field existed, or with a part that is no longer valid, keep the rest.
  const parsed =
    KnowledgeSearchSettingsSchema.safeParse(merged).data ??
    KnowledgeSearchSettingsSchema.safeParse({
      ...merged,
      chunking: DEFAULT_KNOWLEDGE_SEARCH.chunking,
      recall: DEFAULT_KNOWLEDGE_SEARCH.recall,
    }).data;
  return parsed
    ? { ...parsed, contextual: [...new Set(parsed.contextual)] }
    : DEFAULT_KNOWLEDGE_SEARCH;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export interface KnowledgeSearchSettingsStore {
  get(): Promise<KnowledgeSearchSettings>;
  /** Replaces the settings; answers what was saved. */
  save(input: KnowledgeSearchSettings): Promise<KnowledgeSearchSettings>;
  /** Hears each save, with the settings before and after; answers what stops listening. */
  onChange(
    listener: (
      next: KnowledgeSearchSettings,
      previous: KnowledgeSearchSettings,
    ) => void,
  ): () => void;
}

export function createKnowledgeSearchSettings(deps: {
  readonly database: Pick<DatabaseManager, 'transaction' | 'connection'>;
  readonly now?: () => number;
}): KnowledgeSearchSettingsStore {
  const now = deps.now ?? Date.now;
  const listeners = new Set<
    (next: KnowledgeSearchSettings, previous: KnowledgeSearchSettings) => void
  >();
  let cached: { value: KnowledgeSearchSettings; at: number } | null = null;

  async function read(): Promise<KnowledgeSearchSettings> {
    const row = await deps.database
      .connection()
      .query.selectFrom(SETTINGS_TABLE)
      .select('value')
      .where('key', '=', KNOWLEDGE_SEARCH_SETTING)
      .executeTakeFirst();
    return settingsOf(row?.value ?? null);
  }

  return {
    async get() {
      if (cached && now() - cached.at < CACHE_MS) return cached.value;
      const value = await read();
      cached = { value, at: now() };
      return value;
    },

    async save(input) {
      const next = settingsOf(input);
      const previous = await read();
      await deps.database.transaction(async (conn) => {
        const existing = await conn.query
          .selectFrom(SETTINGS_TABLE)
          .select('key')
          .where('key', '=', KNOWLEDGE_SEARCH_SETTING)
          .executeTakeFirst();
        const at = new Date();
        if (existing)
          await conn.query
            .updateTable(SETTINGS_TABLE)
            .set({ value: JSON.stringify(next), updatedAt: at })
            .where('key', '=', KNOWLEDGE_SEARCH_SETTING)
            .execute();
        else
          await conn.query
            .insertInto(SETTINGS_TABLE)
            .values({
              key: KNOWLEDGE_SEARCH_SETTING,
              value: JSON.stringify(next),
              createdAt: at,
              updatedAt: at,
            })
            .execute();
      });
      cached = { value: next, at: now() };
      for (const listener of listeners) listener(next, previous);
      return next;
    },

    onChange(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

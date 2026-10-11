/** The answers of Studio's knowledge search routes (`search-routes.ts`), and the `nb-studio kb` views' (`routes.ts`). */
import {
  KnowledgeDocSchema,
  KnowledgeProposalSchema,
  KnowledgeSpaceDocsSchema,
} from '@nocobase/app-plugin-knowledge/server';
import type {
  KnowledgeProposal,
  KnowledgeTree,
} from '@nocobase/app-plugin-knowledge/shared/knowledge';
import { z } from 'zod';

import type {
  KnowledgeIndexReason,
  KnowledgeModelOption,
  KnowledgeSearchConfig,
} from '../../shared/knowledge.js';
import type { KbChangedResult, KbDoc, KbHit, KbListItem } from './views.js';

const modelRef = { modelService: z.string(), model: z.string() };

const ModelOptionSchema: z.ZodType<KnowledgeModelOption> = z.object({
  ...modelRef,
  label: z.string(),
  serviceTitle: z.string(),
});

const IndexModelSchema = z.object({
  model: z.string(),
  modelService: z.string(),
  dimension: z.number().int(),
  indexed: z.number().int().meta({
    description: 'Sections embedded into the index.',
  }),
  total: z.number().int().meta({
    description: 'Sections the index holds or is about to.',
  }),
});

const INDEX_REASONS = [
  'VECTORS_OFF',
  'VECTOR_STORE_UNKNOWN',
  'SQLITE_VEC_UNSUPPORTED',
  'SQLITE_VEC_OPEN_FAILED',
  'PGVECTOR_NOT_CONFIGURED',
  'PGVECTOR_CONNECTION_FAILED',
  'PGVECTOR_EXTENSION_MISSING',
  'VECTOR_STORE_FAILED',
  'INDEX_NOT_SET_UP',
] as const satisfies readonly KnowledgeIndexReason[];

export const KnowledgeSearchConfigSchema: z.ZodType<KnowledgeSearchConfig> = z
  .object({
    settings: z.object({
      embedding: z.object(modelRef).nullable().meta({
        description:
          'The vector index’s embedding model; null searches by words only.',
      }),
      rerank: z.object(modelRef).nullable(),
      contextModel: z.object(modelRef).nullable(),
      contextual: z.array(z.string()).meta({
        description:
          'The spaces with contextual retrieval, as `system:` or `project:<id>`.',
      }),
      wholeTokens: z.number().int(),
      chunking: z
        .object({
          headingDepth: z.number().int(),
          target: z.number().int(),
          max: z.number().int(),
        })
        .meta({
          description:
            'How every space without its own chunking is cut into sections: the deepest heading a section starts at (1–3), the size long sections are cut towards and the length past which they are cut, in characters.',
        }),
      recall: z
        .object({
          limit: z.number().int(),
          minScore: z.number(),
          keywordWeight: z.number(),
          rerankCandidates: z.number().int(),
        })
        .meta({
          description:
            'How search ranks hits: the default count, the least normalized relevance kept (0–1), keywords’ weight against meaning (0–1, 0.5 equal), and how many fused hits the rerank model reads (1–50).',
        }),
    }),
    index: z.object({
      available: z.boolean().meta({
        description:
          'Whether semantic search can be used: the vector store (`agents.vectors`) answers.',
      }),
      store: z
        .object({
          type: z.string().meta({
            description:
              'The vector store type, such as `sqlite-vec` or `pgvector`.',
          }),
          target: z.string().nullable().meta({
            description:
              'Where it points, with no secret: a file path, or `postgres://user@host:port/database`.',
          }),
        })
        .nullable()
        .meta({ description: 'Null when vectors are turned off.' }),
      reason: z.enum(INDEX_REASONS).nullable().meta({
        description: 'Why semantic search is unavailable, as a code.',
      }),
      active: IndexModelSchema.nullable(),
      building: IndexModelSchema.nullable(),
      pending: z.number().int(),
      failed: z.number().int(),
    }),
    spaces: z.array(
      z.object({
        key: z.string(),
        scope: z.string(),
        scopeId: z.string(),
        title: z.string(),
      }),
    ),
    models: z.object({
      embedding: z.array(ModelOptionSchema),
      rerank: z.array(ModelOptionSchema),
      chat: z.array(ModelOptionSchema),
    }),
    canManage: z.boolean(),
  })
  .meta({ ref: 'StudioKnowledgeSearchConfig' });

/** The `nb-studio kb` views' inputs and answers (`routes.ts`). */
const projectId = z.string().min(1).optional().meta({
  description:
    "A project's id: read its knowledge too. A run on an issue reads its project's without it, and a conversation the projects it is about.",
});
const docRef = z
  .string()
  .min(1)
  .meta({ description: 'The document: its slug or id.' });
const version = z.coerce
  .number()
  .int()
  .min(1)
  .optional()
  .meta({ description: 'An older version instead of the current one.' });

export const KbScopeQuery = z.object({ projectId });

export const KbListQuery = z.object({
  q: z.string().optional().meta({
    description:
      'Only documents matching these words (title, summary or text).',
  }),
  parent: z
    .string()
    .optional()
    .meta({ description: "Only this document's children (slug or id)." }),
  projectId,
});

export const KbDocParams = z.object({ doc: docRef });

export const KbVersionQuery = z.object({ version, projectId });

export const KbSearchQuery = z.object({
  q: z
    .string()
    .min(1)
    .meta({ description: 'The words, quoted when there are several.' }),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .meta({ description: 'At most this many hits.' }),
  projectId,
});

const space = z.enum(['project', 'system']).optional().meta({
  description:
    'Where a new document goes without a parent: the project read (default) or the system.',
});
const reason = z.string().meta({
  description:
    'Why it should change, for the person deciding (at most 500 characters).',
});
const summary = z
  .string()
  .optional()
  .meta({ description: 'A one-line summary.' });

const proposeFields = {
  doc: z.string().optional().meta({
    description: 'The document to update or verify (slug or id).',
  }),
  title: z.string().optional().meta({ description: 'A new document’s title.' }),
  slug: z.string().optional().meta({ description: 'A new document’s slug.' }),
  parent: z
    .string()
    .optional()
    .meta({ description: 'A new document’s parent (slug or id).' }),
  space,
  content: z
    .string()
    .optional()
    .meta({ description: 'The whole new Markdown content.' }),
  summary,
  reason,
  projectId,
};

export const KbProposeBody = z.strictObject({
  ...proposeFields,
  verify: z.boolean().optional().meta({
    description: 'With `doc`: the document still holds; nothing in it changes.',
  }),
});

/** The multipart form of `KbProposeBody`: its text fields and the changed files, each named by its path in the mount. */
export const KbProposeForm = z.strictObject({
  ...proposeFields,
  verify: z.enum(['true', 'false']).optional(),
  files: z
    .array(z.string().meta({ format: 'binary' }))
    .meta({ description: 'The changed files; each filename is its path.' }),
});

export const KbUploadBody = z.strictObject({
  doc: z
    .string()
    .optional()
    .meta({ description: 'The file to replace (slug or id).' }),
  title: z
    .string()
    .optional()
    .meta({ description: "A new file's title; its name when absent." }),
  parent: z
    .string()
    .optional()
    .meta({ description: "A new file's folder or document (slug or id)." }),
  space,
  summary,
  reason: z.string().meta({
    description:
      'Why it belongs in the knowledge base, for the person deciding (at most 500 characters).',
  }),
  projectId,
});

export const KbListItemSchema: z.ZodType<KbListItem> = z
  .object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    kind: z.enum(['folder', 'article', 'file']),
    filename: z.string().optional(),
    space: z.string(),
    version: z.number().int(),
    summary: z
      .string()
      .meta({ description: 'Its summary, or the matching excerpt with `q`.' }),
    parentId: z.string().nullable().optional(),
    children: z.number().int().optional(),
    url: z.string().meta({ description: 'The page that shows it.' }),
  })
  .meta({ ref: 'StudioKbListItem' });

export const KbTreeSchema: z.ZodType<KnowledgeTree> = z
  .object({ spaces: z.array(KnowledgeSpaceDocsSchema) })
  .meta({ ref: 'StudioKbTree' });

export const KbDocSchema: z.ZodType<KbDoc> = z
  .intersection(
    KnowledgeDocSchema,
    z.object({
      url: z.string().meta({ description: 'The page that shows it.' }),
    }),
  )
  .meta({ ref: 'StudioKbDoc' });

export const KbHitSchema: z.ZodType<KbHit> = z
  .object({
    docId: z.string(),
    kind: z.enum(['folder', 'article', 'file']),
    slug: z.string(),
    title: z.string(),
    version: z.number().int(),
    scope: z.string(),
    scopeId: z.string(),
    inherited: z.boolean(),
    headingPath: z.array(z.string()),
    section: z
      .string()
      .meta({ description: 'The headings above it, joined by `>`.' }),
    anchor: z.string().nullable(),
    lines: z
      .string()
      .meta({ description: 'The first and last line, such as `1-3`.' }),
    excerpt: z.string(),
    titleMatch: z.boolean(),
    updatedAt: z.string(),
    score: z.number(),
    providers: z.array(
      z.object({ name: z.string(), rank: z.number().int(), score: z.number() }),
    ),
    reranked: z.number().nullable(),
    url: z
      .string()
      .meta({ description: 'The page that shows it, at the section.' }),
  })
  .meta({ ref: 'StudioKbHit' });

export const KbChangedResultSchema: z.ZodType<KbChangedResult> = z
  .object({
    path: z.string().meta({ description: 'The file, as in the mount.' }),
    kind: z.string().optional(),
    proposalId: z.string().optional(),
    error: z
      .string()
      .optional()
      .meta({ description: 'Why this file was not proposed.' }),
  })
  .meta({ ref: 'StudioKbChangedResult' });

export const KbProposedSchema: z.ZodType<
  KnowledgeProposal | KbChangedResult[]
> = z.union([KnowledgeProposalSchema, z.array(KbChangedResultSchema)]);

export interface KbUploadTicket {
  readonly url: string;
  readonly method: 'POST';
  readonly headers: Readonly<Record<string, string>>;
  readonly message: string;
}

export const KbUploadTicketSchema: z.ZodType<KbUploadTicket> = z
  .object({
    url: z.string().meta({ description: 'Where the file goes, once.' }),
    method: z.literal('POST'),
    headers: z
      .record(z.string(), z.string())
      .meta({ description: 'The ticket’s credential.' }),
    message: z.string(),
  })
  .meta({ ref: 'StudioKbUploadTicket' });

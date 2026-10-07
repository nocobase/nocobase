/**
 * The shapes of `/knowledge` requests. They check types and strictness; the services check the rules of the content
 * (lengths, slugs, versions) with reasons of their own, the same for the API and for commands.
 */
import { z } from 'zod';

import type {
  AcceptKnowledgeProposalRequest,
  CreateKnowledgeDocRequest,
  KnowledgeAccess,
  KnowledgeAuthor,
  KnowledgeChunking,
  KnowledgeChunkingConfig,
  KnowledgeDoc,
  KnowledgeDocIndex,
  KnowledgeDocSummary,
  KnowledgeEffectiveAccess,
  KnowledgeFileInfo,
  KnowledgePermissions,
  KnowledgeProposal,
  KnowledgeProposalStatus,
  KnowledgeSearchHit,
  KnowledgeSource,
  KnowledgeSubject,
  KnowledgeSubjectType,
  KnowledgeText,
  KnowledgeTree,
  KnowledgeVersion,
  KnowledgeUnindexedDoc,
  MoveKnowledgeDocRequest,
  ProposeKnowledgeRequest,
  ReplaceKnowledgePermissionsRequest,
  UpdateKnowledgeChunkingRequest,
  UpdateKnowledgeDocRequest,
} from '../../shared/knowledge.js';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

const id = z.string().min(1);
const flag = z.enum(['true', 'false']).optional();
const pageSize = z.coerce
  .number()
  .int()
  .min(1)
  .max(MAX_PAGE_SIZE)
  .default(DEFAULT_PAGE_SIZE);
const page = z.coerce.number().int().min(1).default(1);
const versionNumber = z.coerce.number().int().min(1);

export interface DocParams {
  readonly docId: string;
}
export const DocParams: z.ZodType<DocParams> = z.object({ docId: id });

export interface VersionParams extends DocParams {
  readonly version: number;
}
export const VersionParams: z.ZodType<VersionParams, unknown> = z.object({
  docId: id,
  version: versionNumber,
});

export interface ProposalParams {
  readonly proposalId: string;
}
export const ProposalParams: z.ZodType<ProposalParams> = z.object({
  proposalId: id,
});

export interface TicketParams {
  readonly ticketId: string;
}
export const TicketParams: z.ZodType<TicketParams> = z.object({
  ticketId: id,
});

/** A space by its kind and key; the key is empty for a space that has none. */
export interface SpaceQuery {
  readonly scope: string;
  readonly scopeId: string;
}
const spaceQuery = {
  scope: z.string().min(1),
  scopeId: z.string().default(''),
};

export interface SpacesQuery extends SpaceQuery {
  readonly archived?: 'true' | 'false';
}
export const SpacesQuery: z.ZodType<SpacesQuery, unknown> = z.object({
  ...spaceQuery,
  archived: flag,
});

export interface SearchQuery extends SpaceQuery {
  readonly q: string;
  readonly pageSize?: number;
  readonly explain?: 'true' | 'false';
}
export const SearchQuery: z.ZodType<SearchQuery, unknown> = z.object({
  ...spaceQuery,
  q: z.string().default(''),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).optional().meta({
    description:
      'How many hits at most; the application’s recall settings decide by default (20 unless changed).',
  }),
  explain: flag.meta({
    description:
      '`true` adds `explain` to each hit (how it was ranked), for someone who manages the space or the search settings; others get the hits without it.',
  }),
});

export const SpaceOnlyQuery: z.ZodType<SpaceQuery, unknown> =
  z.object(spaceQuery);

const chunkingShape = z.object({
  headingDepth: z
    .number()
    .int()
    .meta({ description: 'The deepest heading a section starts at: 1–3.' }),
  target: z.number().int().meta({
    description:
      'The size, in characters, the pieces of a long section aim at: 200–8000.',
  }),
  max: z.number().int().meta({
    description:
      'A section longer than this many characters is cut between paragraphs: 200–8000, at least `target`.',
  }),
});

export const ChunkingBody: z.ZodType<UpdateKnowledgeChunkingRequest, unknown> =
  z.strictObject({
    scope: z.string().min(1),
    scopeId: z.string().default(''),
    override: z
      .strictObject({
        headingDepth: z.number().int(),
        target: z.number().int(),
        max: z.number().int(),
      })
      .nullable()
      .meta({
        description:
          'The space’s own chunking; null follows the application’s default.',
      }),
  });

export interface PageQuery {
  readonly page: number;
  readonly pageSize: number;
}
export const PageQuery: z.ZodType<PageQuery, unknown> = z.object({
  page,
  pageSize,
});

export interface ProposalsQuery extends PageQuery {
  readonly status: KnowledgeProposalStatus;
  readonly scope?: string;
  readonly scopeId: string;
  readonly docId?: string;
  readonly decidable?: 'true' | 'false';
}
export const ProposalsQuery: z.ZodType<ProposalsQuery, unknown> = z.object({
  status: z
    .enum(['pending', 'accepted', 'rejected', 'withdrawn'])
    .default('pending'),
  scope: z.string().min(1).optional(),
  scopeId: z.string().default(''),
  docId: id.optional(),
  decidable: flag,
  page,
  pageSize,
});

export interface FileQuery {
  readonly version?: number;
  readonly download?: 'true' | 'false';
}
export const FileQuery: z.ZodType<FileQuery, unknown> = z.object({
  version: versionNumber.optional(),
  download: flag,
});

export const CreateDocBody: z.ZodType<CreateKnowledgeDocRequest, unknown> =
  z.strictObject({
    scope: z.string(),
    scopeId: z.string().default(''),
    kind: z.enum(['article', 'folder']).optional(),
    parentId: z.string().nullable().optional(),
    title: z.string(),
    slug: z.string().optional(),
    summary: z.string().optional(),
    content: z.string().optional(),
  });

export const UpdateDocBody: z.ZodType<UpdateKnowledgeDocRequest> =
  z.strictObject({
    expectedVersion: z.number().int(),
    title: z.string().optional(),
    summary: z.string().optional(),
    content: z.string().optional(),
    note: z.string().optional(),
  });

export const MoveDocBody: z.ZodType<MoveKnowledgeDocRequest> = z.strictObject({
  parentId: z.string().nullable(),
  sortOrder: z.number().int().optional(),
});

export interface ReparseBody {
  readonly version?: number;
}
export const ReparseBody: z.ZodType<ReparseBody> = z.strictObject({
  version: z.number().int().optional(),
});

export const ProposeBody: z.ZodType<ProposeKnowledgeRequest> = z.strictObject({
  kind: z.enum(['update', 'create', 'verify']),
  reason: z.string(),
  docId: z.string().optional(),
  scope: z.string().optional(),
  scopeId: z.string().optional(),
  parentId: z.string().nullable().optional(),
  title: z.string().optional(),
  slug: z.string().optional(),
  summary: z.string().optional(),
  content: z.string().optional(),
  baseVersion: z.number().int().optional(),
});

export const AcceptBody: z.ZodType<AcceptKnowledgeProposalRequest> =
  z.strictObject({
    comment: z.string().optional(),
    confirmStale: z.boolean().optional(),
  });

export interface RejectBody {
  readonly comment?: string;
}
export const RejectBody: z.ZodType<RejectBody> = z.strictObject({
  comment: z.string().optional(),
});

/** The text fields of `POST /knowledge/docs/upload`, beside its `file`. */
export interface UploadFields {
  readonly scope: string;
  readonly scopeId: string;
  readonly parentId?: string;
  readonly title?: string;
  readonly slug?: string;
  readonly summary?: string;
}
export const UploadFields: z.ZodType<UploadFields, unknown> = z.strictObject({
  ...spaceQuery,
  parentId: z.string().optional(),
  title: z.string().optional(),
  slug: z.string().optional(),
  summary: z.string().optional(),
});

/** The text fields of `POST /knowledge/docs/:docId/replaceFile`, beside its `file`. */
export interface ReplaceFileFields {
  readonly expectedVersion?: number;
  readonly note?: string;
}
export const ReplaceFileFields: z.ZodType<ReplaceFileFields, unknown> =
  z.strictObject({
    expectedVersion: versionNumber.optional(),
    note: z.string().optional(),
  });

/** The text fields of `POST /knowledge/proposals/upload`, beside its `file`. */
export interface ProposeFileFields {
  readonly kind: 'create' | 'update';
  readonly reason: string;
  readonly docId?: string;
  readonly scope?: string;
  readonly scopeId: string;
  readonly parentId?: string;
  readonly title?: string;
  readonly slug?: string;
  readonly summary?: string;
  readonly baseVersion?: number;
}
export const ProposeFileFields: z.ZodType<ProposeFileFields, unknown> =
  z.strictObject({
    kind: z.enum(['create', 'update']),
    reason: z.string(),
    docId: z.string().optional(),
    scope: z.string().optional(),
    scopeId: z.string().default(''),
    parentId: z.string().optional(),
    title: z.string().optional(),
    slug: z.string().optional(),
    summary: z.string().optional(),
    baseVersion: versionNumber.optional(),
  });

export const PermissionsBody: z.ZodType<ReplaceKnowledgePermissionsRequest> =
  z.strictObject({
    mode: z.enum(['inherit', 'custom']),
    entries: z
      .array(
        z.strictObject({
          subject: z.strictObject({
            type: z.string().min(1).max(32),
            id: z.string().min(1).max(128),
          }),
          level: z.enum(['read', 'propose', 'edit', 'manage']),
        }),
      )
      .max(200),
  });

/** At most this many subjects a picker's search answers. */
export const MAX_SUBJECTS = 50;

export interface SubjectsQuery extends SpaceQuery {
  readonly q: string;
  readonly type?: string;
  readonly pageSize: number;
}
export const SubjectsQuery: z.ZodType<SubjectsQuery, unknown> = z.object({
  ...spaceQuery,
  q: z.string().default(''),
  type: z.string().min(1).optional(),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_SUBJECTS)
    .default(DEFAULT_PAGE_SIZE),
});

/*
 * The documented shapes of what the routes answer, each held to the view type the service returns.
 */

const dateTime = (): z.ZodString => z.string().meta({ format: 'date-time' });

const binaryFile = z
  .string()
  .meta({ format: 'binary', description: 'The file.' });

/** `POST /docs/upload` as the document shows it: `file` beside the text fields. */
export const UploadForm: z.ZodType = z.strictObject({
  file: binaryFile,
  ...spaceQuery,
  parentId: z.string().optional(),
  title: z
    .string()
    .optional()
    .meta({ description: "The entry's title; the file's name when absent." }),
  slug: z.string().optional(),
  summary: z.string().optional(),
});

/** `POST /docs/:docId/replaceFile` as the document shows it. */
export const ReplaceFileForm: z.ZodType = z.strictObject({
  file: binaryFile,
  expectedVersion: versionNumber.optional().meta({
    description: 'The version read; the current one when absent.',
  }),
  note: z.string().optional(),
});

/** `POST /proposals/upload` as the document shows it. */
export const ProposeFileForm: z.ZodType = z.strictObject({
  file: binaryFile,
  kind: z.enum(['create', 'update']).meta({
    description: '`create` a new file entry, or `update` one with this file.',
  }),
  reason: z.string(),
  docId: z
    .string()
    .optional()
    .meta({ description: 'The file entry an `update` replaces.' }),
  scope: z.string().optional(),
  scopeId: z.string().default(''),
  parentId: z.string().optional(),
  title: z.string().optional(),
  slug: z.string().optional(),
  summary: z.string().optional(),
  baseVersion: versionNumber.optional(),
});

const accessShape = {
  read: z.boolean(),
  propose: z.boolean(),
  edit: z.boolean(),
  manage: z.boolean(),
};
export const KnowledgeAccessSchema: z.ZodType<KnowledgeAccess> = z
  .object(accessShape)
  .meta({
    ref: 'KnowledgeAccess',
    description: 'What the caller may do; each implies the ones before it.',
  });

export const KnowledgeFileInfoSchema: z.ZodType<KnowledgeFileInfo> = z
  .object({
    id: z.string(),
    filename: z.string(),
    ext: z
      .string()
      .meta({ description: 'Lower-case, without the dot; empty without one.' }),
    mimeType: z.string(),
    size: z.number().int(),
    parseStatus: z
      .enum(['parsing', 'ready', 'failed', 'unsupported'])
      .nullable()
      .meta({
        description:
          'Where the extraction of its text stands; null for a proposed file.',
      }),
    parseError: z.string().nullable(),
    contentUrl: z.string().meta({ description: 'Serves the bytes.' }),
    downloadUrl: z
      .string()
      .meta({ description: 'Serves the bytes as an attachment.' }),
  })
  .meta({ ref: 'KnowledgeFileInfo' });

export const KnowledgeAuthorSchema: z.ZodType<KnowledgeAuthor> = z
  .object({
    kind: z.string().meta({
      description: '`user`, `system`, or an actor kind the application names.',
    }),
    id: z.string().nullable(),
    name: z.string().nullable(),
  })
  .meta({ ref: 'KnowledgeAuthor' });

export const KnowledgeSourceSchema: z.ZodType<KnowledgeSource> = z
  .object({
    kind: z.string(),
    id: z.string(),
    title: z.string().nullable().optional(),
    url: z.string().nullable().optional(),
  })
  .meta({
    ref: 'KnowledgeSource',
    description: 'What a version or a proposal came from, such as an issue.',
  });

const accessMode = z.enum(['inherit', 'custom']);

const docSummaryShape = {
  id: z.string(),
  kind: z.enum(['folder', 'article', 'file']),
  spaceId: z.string(),
  scope: z.string(),
  scopeId: z.string(),
  parentId: z.string().nullable(),
  sortOrder: z.number(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  version: z.number().int().meta({ description: '0 for a folder.' }),
  file: KnowledgeFileInfoSchema.nullable(),
  verifiedAt: dateTime().nullable(),
  archivedAt: dateTime().nullable(),
  updatedAt: dateTime(),
  updatedBy: KnowledgeAuthorSchema,
  childCount: z.number().int(),
  pendingProposals: z.number().int(),
  access: KnowledgeAccessSchema,
  accessMode,
  accessEntries: z.number().int(),
};
export const KnowledgeDocSummarySchema: z.ZodType<KnowledgeDocSummary> = z
  .object(docSummaryShape)
  .meta({ ref: 'KnowledgeDocSummary' });

export const KnowledgeDocSchema: z.ZodType<KnowledgeDoc> = z
  .object({
    ...docSummaryShape,
    content: z.string().meta({
      description:
        "An article's Markdown; a file's extracted text (empty until parsed); empty for a folder.",
    }),
    contentHash: z.string(),
    verifiedBy: KnowledgeAuthorSchema.nullable(),
    breadcrumbs: z
      .array(z.object({ id: z.string(), slug: z.string(), title: z.string() }))
      .meta({ description: "Root first, the document's parent last." }),
  })
  .meta({ ref: 'KnowledgeDoc' });

export const KnowledgeVersionSchema: z.ZodType<KnowledgeVersion> = z
  .object({
    docId: z.string(),
    version: z.number().int(),
    title: z.string(),
    summary: z.string(),
    content: z
      .string()
      .optional()
      .meta({ description: 'Present when one version is read.' }),
    contentHash: z.string(),
    file: KnowledgeFileInfoSchema.nullable(),
    author: KnowledgeAuthorSchema,
    source: KnowledgeSourceSchema.nullable(),
    runId: z.string().nullable(),
    proposalId: z.string().nullable(),
    approvedBy: KnowledgeAuthorSchema.nullable(),
    note: z.string().nullable(),
    createdAt: dateTime(),
  })
  .meta({ ref: 'KnowledgeVersion' });

export const KnowledgeSpaceDocsSchema: z.ZodType<
  KnowledgeTree['spaces'][number]
> = z
  .object({
    space: z.object({
      scope: z.string(),
      scopeId: z.string(),
      id: z
        .string()
        .nullable()
        .meta({ description: 'Null until its first document.' }),
      title: z.string().nullable(),
      inherited: z.boolean().meta({
        description:
          "Shown in the requested space's view because that space inherits it.",
      }),
      access: KnowledgeAccessSchema,
    }),
    docs: z.array(KnowledgeDocSummarySchema),
  })
  .meta({ ref: 'KnowledgeSpaceDocs' });

// Not `KnowledgeSearch…`: an application's own `/api/knowledgeSearch` routes own that prefix.
export const KnowledgeHitSchema: z.ZodType<KnowledgeSearchHit> = z
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
    anchor: z.string().nullable(),
    lines: z
      .tuple([z.number().int(), z.number().int()])
      .meta({ description: 'The first and last line of the section.' }),
    excerpt: z.string(),
    titleMatch: z.boolean(),
    updatedAt: dateTime(),
    score: z.number(),
    providers: z.array(
      z.object({
        name: z.string(),
        rank: z.number().int(),
        score: z.number(),
      }),
    ),
    reranked: z.number().nullable(),
    explain: z
      .object({
        normalized: z.number().meta({
          description:
            'The fused score over the most the providers that answered could give: 0–1, what the minimum relevance compares.',
        }),
        providers: z.array(
          z.object({
            name: z.string(),
            rank: z.number().int(),
            score: z.number(),
            weight: z.number(),
          }),
        ),
        reranked: z.number().nullable(),
      })
      .optional()
      .meta({
        description:
          'How it was ranked: only with `explain=true`, for someone who manages the space or the search settings.',
      }),
  })
  .meta({ ref: 'KnowledgeHit' });

export const KnowledgeChunkingSchema: z.ZodType<KnowledgeChunking> =
  chunkingShape.meta({ ref: 'KnowledgeChunking' });

export const KnowledgeChunkingConfigSchema: z.ZodType<KnowledgeChunkingConfig> =
  z
    .object({
      defaults: KnowledgeChunkingSchema,
      override: KnowledgeChunkingSchema.nullable(),
      effective: KnowledgeChunkingSchema,
      rechunking: z.boolean().meta({
        description:
          'Whether the space’s documents are being cut again in the background.',
      }),
      canManage: z.boolean(),
    })
    .meta({ ref: 'KnowledgeChunkingConfig' });

const indexState = z.enum(['pending', 'done', 'failed']);

export const KnowledgeDocIndexSchema: z.ZodType<KnowledgeDocIndex> = z
  .object({
    docId: z.string(),
    version: z.number().int(),
    enabled: z.boolean().meta({
      description:
        'Whether semantic search indexes the sections; without it every state is null.',
    }),
    total: z.number().int(),
    indexed: z.number().int(),
    pending: z.number().int(),
    failed: z.number().int(),
    state: indexState.nullable(),
    chunks: z.array(
      z.object({
        ordinal: z.number().int(),
        headingPath: z.array(z.string()),
        anchor: z.string().nullable(),
        lines: z.tuple([z.number().int(), z.number().int()]),
        chars: z.number().int(),
        state: indexState.nullable(),
        error: z.string().nullable(),
      }),
    ),
  })
  .meta({ ref: 'KnowledgeDocIndex' });

export const KnowledgeUnindexedDocSchema: z.ZodType<KnowledgeUnindexedDoc> = z
  .object({
    docId: z.string(),
    title: z.string(),
    kind: z.enum(['folder', 'article', 'file']),
    pending: z.number().int(),
    failed: z.number().int(),
    error: z.string().nullable(),
  })
  .meta({ ref: 'KnowledgeUnindexedDoc' });

export interface KnowledgeIndexingMeta {
  readonly enabled: boolean;
}
export const KnowledgeIndexingMetaSchema: z.ZodType<KnowledgeIndexingMeta> =
  z.object({
    enabled: z.boolean().meta({
      description: 'Whether semantic search is on; the list is empty without.',
    }),
  });

export const KnowledgeTextSchema: z.ZodType<KnowledgeText> = z
  .union([z.string(), z.object({ key: z.string(), ns: z.string() })])
  .meta({
    ref: 'KnowledgeText',
    description: 'Plain text, or a key in an i18n namespace.',
  });

export const KnowledgeSubjectSchema: z.ZodType<KnowledgeSubject> = z
  .object({
    type: z.string(),
    id: z.string(),
    label: KnowledgeTextSchema,
    hint: KnowledgeTextSchema.nullable().optional(),
    known: z.boolean().optional().meta({
      description: 'False for a subject the application no longer knows.',
    }),
  })
  .meta({ ref: 'KnowledgeSubject' });

export const KnowledgeSubjectTypeSchema: z.ZodType<KnowledgeSubjectType> = z
  .object({
    type: z.string(),
    title: KnowledgeTextSchema,
    icon: z.enum(['user', 'group', 'role', 'agent', 'organization']),
  })
  .meta({ ref: 'KnowledgeSubjectType' });

export interface KnowledgeSubjectsMeta {
  readonly types: readonly KnowledgeSubjectType[];
}
export const KnowledgeSubjectsMetaSchema: z.ZodType<KnowledgeSubjectsMeta> =
  z.object({ types: z.array(KnowledgeSubjectTypeSchema) });

const permissionEntry = z.object({
  subject: KnowledgeSubjectSchema,
  level: z.enum(['read', 'propose', 'edit', 'manage']),
});

export const KnowledgePermissionsSchema: z.ZodType<KnowledgePermissions> = z
  .object({
    docId: z.string(),
    mode: accessMode,
    entries: z.array(permissionEntry),
    inherited: z
      .array(
        z.object({
          from: z.union([
            z.object({ kind: z.literal('space') }),
            z.object({
              kind: z.literal('doc'),
              id: z.string(),
              title: z.string(),
              mode: accessMode,
            }),
          ]),
          entries: z.array(permissionEntry),
        }),
      )
      .meta({
        description:
          "Nearest first: each ancestor up to the first `custom` one, then the space's default. Empty for a `custom` node.",
      }),
    types: z.array(KnowledgeSubjectTypeSchema),
  })
  .meta({ ref: 'KnowledgePermissions' });

export const KnowledgeEffectiveAccessSchema: z.ZodType<KnowledgeEffectiveAccess> =
  z
    .object({
      docId: z.string(),
      level: z.enum(['none', 'read', 'propose', 'edit', 'manage']),
      access: KnowledgeAccessSchema,
      source: z
        .union([
          z.object({ kind: z.literal('none') }),
          z.object({ kind: z.literal('space') }),
          z.object({ kind: z.literal('manager') }),
          z.object({
            kind: z.literal('entry'),
            docId: z.string(),
            docTitle: z.string(),
            subject: KnowledgeSubjectSchema,
          }),
        ])
        .meta({ description: 'Where the access comes from.' }),
      mode: accessMode,
      entryCount: z.number().int(),
      restrictedBy: z
        .object({ id: z.string(), title: z.string() })
        .nullable()
        .meta({
          description:
            'The nearest ancestor-or-self in `custom` mode, or null.',
        }),
    })
    .meta({ ref: 'KnowledgeEffectiveAccess' });

export const KnowledgeProposalSchema: z.ZodType<KnowledgeProposal> = z
  .object({
    id: z.string(),
    kind: z.enum(['update', 'create', 'verify']),
    status: z.enum(['pending', 'accepted', 'rejected', 'withdrawn']),
    scope: z.string(),
    scopeId: z.string(),
    spaceTitle: z.string().nullable(),
    docId: z.string().nullable(),
    docTitle: z.string(),
    docSlug: z.string().nullable(),
    parentId: z.string().nullable(),
    title: z.string().nullable(),
    slug: z.string().nullable(),
    summary: z.string().nullable(),
    content: z.string().nullable(),
    file: KnowledgeFileInfoSchema.nullable(),
    baseVersion: z.number().int().nullable(),
    currentVersion: z.number().int().nullable(),
    stale: z.boolean().meta({
      description:
        'The document moved past `baseVersion`: accepting overwrites what changed since.',
    }),
    baseContent: z.string().nullable().optional().meta({
      description: 'The content at `baseVersion`, when one proposal is read.',
    }),
    currentContent: z
      .string()
      .nullable()
      .optional()
      .meta({ description: 'The content now, when one proposal is read.' }),
    reason: z.string(),
    proposer: KnowledgeAuthorSchema,
    authorizedBy: KnowledgeAuthorSchema,
    source: KnowledgeSourceSchema.nullable(),
    runId: z.string().nullable(),
    decidedBy: KnowledgeAuthorSchema.nullable(),
    decidedAt: dateTime().nullable(),
    comment: z.string().nullable(),
    appliedVersion: z.number().int().nullable(),
    createdAt: dateTime(),
    canDecide: z
      .boolean()
      .meta({ description: 'Whether the caller may accept or reject it now.' }),
  })
  .meta({ ref: 'KnowledgeProposal' });

export interface KnowledgePageMeta {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
}
export const KnowledgePageMetaSchema: z.ZodType<KnowledgePageMeta> = z
  .object({
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
  })
  .meta({ ref: 'KnowledgePageMeta' });

export interface KnowledgeTotalMeta {
  readonly total: number;
}
export const KnowledgeTotalMetaSchema: z.ZodType<KnowledgeTotalMeta> = z.object(
  { total: z.number().int() },
);

/** `meta` of a ranking, which has no next page. */
export const KnowledgeEmptyMetaSchema: z.ZodType<Record<string, never>> =
  z.object({});

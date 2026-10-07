/**
 * `/api/knowledge`, signed in; every answer is `{ data }` (a list `{ data, meta }`), every refusal the standard error
 * body with domain `knowledge`. What a caller may do is decided by the application's access resolver and each
 * node's permissions (`services/access.ts`, `docs/permissions.md`): someone who may not read a space or a node gets
 * 404.
 *
 * | Method and path                                             | What it does                                                 |
 * | ----------------------------------------------------------- | ------------------------------------------------------------ |
 * | `GET /spaces?scope=&scopeId=&archived=true`                 | A space and the spaces it inherits, each with its documents  |
 * | `GET /search?scope=&scopeId=&q=&pageSize=&explain=`         | The best hits in that view, with excerpts (and how ranked)   |
 * | `GET /chunking?scope=&scopeId=`, `PUT /chunking` (`manage`) | How the space is cut into sections; its own override         |
 * | `GET /indexing?scope=&scopeId=`                             | Its documents whose sections are not all semantically indexed |
 * | `POST /docs` (`CreateKnowledgeDocRequest`)                  | A new article or folder                                      |
 * | `POST /docs/upload` (multipart `file`, `scope`, `scopeId`…) | A new file entry; its text is parsed after                   |
 * | `GET /docs/:docId`, `PATCH /docs/:docId`                    | A document; a new version against `expectedVersion`          |
 * | `GET /docs/:docId/versions?page=&pageSize=`, `…/:version`   | Its versions, newest first; one with its content             |
 * | `POST /docs/:docId/{move,archive,restore,verify}`           | No new version                                               |
 * | `POST /docs/:docId/replaceFile` (multipart `file`…)         | A file entry's next version: another file                    |
 * | `GET /docs/:docId/file?version=&download=true`              | A file's bytes (inline for an image, a PDF or text)          |
 * | `POST /docs/:docId/reparse`                                 | Parses a file whose text could not be extracted again        |
 * | `GET /docs/:docId/index`, `POST /docs/:docId/reindex`       | Its sections and their index state; queues them again (`edit`) |
 * | `GET /docs/:docId/permissions`, `PUT …` (`manage`)          | Its mode, entries and what it inherits; replaces them        |
 * | `GET /docs/:docId/access`                                   | The caller's access to it, and where that comes from         |
 * | `GET /subjects?scope=&scopeId=&q=&type=&pageSize=`          | Subjects to grant, for someone who manages something there   |
 * | `GET /proposals?status=&scope=&scopeId=&docId=&decidable=`  | Proposals in the spaces the caller reads, paged              |
 * | `POST /proposals` (`ProposeKnowledgeRequest`)               | Proposes a change, a new article or a verification           |
 * | `POST /proposals/upload` (multipart `file`, `kind`…)        | Proposes a new file, or a replacement                        |
 * | `GET /proposals/:proposalId`, `…/file`                      | One, with its base and current contents; its file            |
 * | `POST /proposals/:proposalId/{accept,reject,withdraw}`      | Decides one (`confirmStale` accepts a stale one)             |
 *
 * `createKnowledgeTicketRoutes` serves `POST /knowledge/tickets/:ticketId/redeem` outside the session: the body is a
 * ticket's file and `Authorization: Bearer <token>` its credential (`ProposalService.ticket`).
 */
import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  cliRoute,
  dataResponse,
  describeRoute,
  listResponse,
  parseApiInput,
} from '@nocobase/app-server/router';
import { Hono, type Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import type { z } from 'zod';

import type {
  KnowledgeFileInfo,
  ProposeKnowledgeRequest,
  SpaceRef,
} from '../../shared/knowledge.js';
import { invalid } from '../errors.js';
import type { KnowledgeReader } from '../services/access.js';
import type { FileContent } from '../services/files.js';
import type { Knowledge } from '../services/knowledge.js';
import type { ProposalInput } from '../services/proposals.js';
import * as check from '../services/validate.js';
import {
  fileTooLarge,
  knowledgeErrorHandler,
  unsupportedContentType,
} from './errors.js';
import {
  docNotFoundResponse,
  fileContentResponse,
  fileTooLargeResponse,
  multipartBody,
  notMultipartResponse,
  proposalNotFoundResponse,
  tags,
} from './openapi.js';
import {
  AcceptBody,
  ChunkingBody,
  CreateDocBody,
  DocParams,
  FileQuery,
  KnowledgeChunkingConfigSchema,
  KnowledgeDocIndexSchema,
  KnowledgeDocSchema,
  KnowledgeEffectiveAccessSchema,
  KnowledgeEmptyMetaSchema,
  KnowledgeHitSchema,
  KnowledgeIndexingMetaSchema,
  KnowledgePageMetaSchema,
  KnowledgePermissionsSchema,
  KnowledgeProposalSchema,
  KnowledgeSpaceDocsSchema,
  KnowledgeSubjectSchema,
  KnowledgeSubjectsMetaSchema,
  KnowledgeTotalMetaSchema,
  KnowledgeUnindexedDocSchema,
  KnowledgeVersionSchema,
  MoveDocBody,
  PageQuery,
  PermissionsBody,
  ProposalParams,
  ProposalsQuery,
  ProposeBody,
  ProposeFileFields,
  ProposeFileForm,
  RejectBody,
  ReparseBody,
  ReplaceFileFields,
  ReplaceFileForm,
  SearchQuery,
  SpaceOnlyQuery,
  SpacesQuery,
  SubjectsQuery,
  TicketParams,
  UpdateDocBody,
  UploadFields,
  UploadForm,
  VersionParams,
} from './schemas.js';

/** Room for the multipart envelope around one file. */
/** `scopeId` on the command line: what a scope belongs to, such as a project, beside `--scope`. */
const OWNER_FLAG = {
  name: 'owner',
  description:
    'What the space belongs to within `--scope`, such as the project’s id; none for a scope with one space.',
};

const ENVELOPE = 64 * 1024;

const sizeLimit = (maxBytes: number) =>
  bodyLimit({
    maxSize: maxBytes + ENVELOPE,
    onError: (context) =>
      knowledgeErrorHandler(fileTooLarge(maxBytes), context),
  });

/** The text fields, checked against `schema`, and the one `file` of a multipart body. */
async function formOf<T>(
  context: Context,
  schema: z.ZodType<T, unknown>,
): Promise<{ fields: T; file: File }> {
  const type = context.req.header('content-type') ?? '';
  if (!/^multipart\/form-data\b/iu.test(type))
    throw unsupportedContentType('multipart/form-data');
  let body: Record<string, unknown>;
  try {
    body = await context.req.parseBody();
  } catch {
    throw invalid(
      'INVALID_FILE',
      'Send one file as multipart form data.',
      'file',
    );
  }
  const { file, ...rest } = body;
  if (!(file instanceof File))
    throw invalid('INVALID_FILE', 'Send one file as `file`.', 'file');
  const fields: Record<string, string> = {};
  for (const [name, value] of Object.entries(rest))
    if (typeof value === 'string') fields[name] = value;
  return { fields: parseApiInput(schema, fields), file };
}

/** `filename*` per RFC 5987, so any name survives; the plain `filename` is an ASCII fallback. */
export function contentDisposition(
  kind: 'inline' | 'attachment',
  filename: string,
): string {
  const ascii = filename.replace(/[^\x20-\x7e]|["\\]/gu, '_') || 'file';
  const encoded = encodeURIComponent(filename).replace(
    /['()*]/gu,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `${kind}; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

/** The name a `content-disposition` header gives, or null. */
export function filenameOf(header: string | undefined): string | null {
  if (!header) return null;
  const extended = /filename\*\s*=\s*UTF-8''([^;]+)/iu.exec(header);
  if (extended)
    try {
      return decodeURIComponent(extended[1].trim());
    } catch {
      // Fall back to the plain name.
    }
  const plain = /filename\s*=\s*"?([^";]+)"?/iu.exec(header);
  return plain ? plain[1].trim() : null;
}

const MIME = /^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/iu;
const INLINE =
  /^(image\/(png|jpeg|gif|webp|avif|bmp)|application\/pdf|text\/plain|text\/markdown|text\/csv)$/u;

/** The headers a file is served with: inline only for a safe image, a PDF or plain text, unless a download is asked for. */
export function contentHeaders(
  file: KnowledgeFileInfo,
  download: boolean,
): Record<string, string> {
  const type = file.mimeType.split(';')[0]?.trim().toLowerCase() ?? '';
  const safe = MIME.test(type) ? type : 'application/octet-stream';
  return {
    'Content-Type': safe,
    'Content-Length': String(file.size),
    'Content-Disposition': contentDisposition(
      INLINE.test(safe) && !download ? 'inline' : 'attachment',
      file.filename,
    ),
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "sandbox; default-src 'none'",
    'Cache-Control': 'private, no-store',
  };
}

function serve(content: FileContent, download: boolean): Response {
  return new Response(content.body, {
    status: 200,
    headers: contentHeaders(content.file, download),
  });
}

/** One page of a list the service answers whole. */
function pageOf<T>(
  items: readonly T[],
  { page, pageSize }: PageQuery,
): { data: T[]; meta: { page: number; pageSize: number; total: number } } {
  const start = (page - 1) * pageSize;
  return {
    data: items.slice(start, start + pageSize),
    meta: { page, pageSize, total: items.length },
  };
}

/** A proposal's fields as a form sends them. */
function proposalOfForm(fields: ProposeFileFields): ProposalInput {
  return {
    kind: fields.kind,
    reason: fields.reason,
    ...(fields.docId ? { docId: fields.docId } : {}),
    ...(fields.scope
      ? { space: { scope: fields.scope, scopeId: fields.scopeId } }
      : {}),
    ...(fields.parentId ? { parentId: fields.parentId } : {}),
    ...(fields.title ? { title: fields.title } : {}),
    ...(fields.slug ? { slug: fields.slug } : {}),
    ...(fields.summary !== undefined ? { summary: fields.summary } : {}),
    ...(fields.baseVersion !== undefined
      ? { baseVersion: fields.baseVersion }
      : {}),
  };
}

/** A proposal's fields from a JSON body; a file is proposed with `POST /proposals/upload`. */
function proposalOfBody(body: ProposeKnowledgeRequest): ProposalInput {
  return {
    kind: body.kind,
    reason: body.reason,
    ...(body.docId ? { docId: body.docId } : {}),
    ...(body.scope
      ? { space: { scope: body.scope, scopeId: body.scopeId ?? '' } }
      : {}),
    ...(body.parentId ? { parentId: body.parentId } : {}),
    ...(body.title ? { title: body.title } : {}),
    ...(body.slug ? { slug: body.slug } : {}),
    ...(body.summary !== undefined ? { summary: body.summary } : {}),
    ...(body.content !== undefined ? { content: body.content } : {}),
    ...(body.baseVersion !== undefined
      ? {
          baseVersion: check.version(
            body.baseVersion,
            'INVALID_BASE_VERSION',
            'baseVersion',
          ),
        }
      : {}),
  };
}

/** The request body as one file, at most `maxBytes`; 413 beyond. */
async function bodyFile(
  context: Context,
  maxBytes: number,
  name: string,
): Promise<File> {
  const reader = context.req.raw.body?.getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let size = 0;
  if (reader)
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel().catch(() => undefined);
        throw fileTooLarge(maxBytes);
      }
      chunks.push(new Uint8Array(value));
    }
  return new File(chunks, name);
}

/**
 * `POST /:ticketId/redeem`, mounted at `/knowledge/tickets` ahead of the session-guarded routes: a ticket's file as the
 * raw body, the ticket's token as the bearer credential; no session is read.
 */
export function createKnowledgeTicketRoutes(knowledge: Knowledge): Hono {
  const routes = new Hono();
  routes.onError(knowledgeErrorHandler);
  routes.post(
    '/:ticketId/redeem',
    describeRoute({
      tags,
      summary: 'Upload the file of a proposal ticket',
      operationId: 'knowledgeRedeemTicket',
      description:
        "Takes no session or API key: the credential is the ticket's one-time token, as `Authorization: Bearer <token>`, issued with the ticket to a client that sends a file apart from its request (an agent's command). The body is the file's bytes, named by `Content-Disposition` when the ticket names none. The file is proposed as the ticket's request said, on behalf of the person and actor the ticket was issued to; the ticket is spent.",
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/octet-stream': {
            schema: {
              type: 'string',
              format: 'binary',
              description: 'The file, of any type.',
            },
          },
        },
      },
      responses: {
        200: dataResponse(KnowledgeProposalSchema, 'The proposal made.'),
        400: apiErrorResponse(
          400,
          'The application stores no files (`FILES_UNAVAILABLE`), or the proposal the ticket holds is refused (`INVALID_*`).',
        ),
        401: apiErrorResponse(
          401,
          'The ticket is unknown, its token wrong, or it was used or expired (`INVALID_TICKET`).',
        ),
        403: apiErrorResponse(
          403,
          'The person the ticket was issued to may no longer propose there (`FORBIDDEN`).',
        ),
        404: docNotFoundResponse,
        409: apiErrorResponse(
          409,
          'The document is archived (`KNOWLEDGE_ARCHIVED`), or a pending proposal or the run limit stands in the way (`KNOWLEDGE_PROPOSAL_PENDING`, `KNOWLEDGE_PROPOSAL_LIMIT`).',
        ),
        413: fileTooLargeResponse,
        500: apiErrorResponse(500),
      },
      // Plumbing: the CLI streams `kb upload`'s file here with the ticket's credential.
      ...cliRoute(false),
    }),
    apiValidator('param', TicketParams),
    async (c) => {
      const { ticketId } = c.req.valid('param');
      const header = c.req.header('authorization') ?? '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;
      const file = await bodyFile(
        c,
        knowledge.files.maxBytes,
        filenameOf(c.req.header('content-disposition')) ?? 'file',
      );
      return c.json({
        data: await knowledge.proposals.redeem(ticketId, token, file),
      });
    },
  );
  return routes;
}

const spaceNotFound = apiErrorResponse(
  404,
  'The caller may not read the space (`SPACE_NOT_FOUND`).',
);
const unknownSpace = apiErrorResponse(
  400,
  'The application has no such space (`INVALID_SCOPE`).',
);
const archived =
  'The document is archived, and read-only until restored (`KNOWLEDGE_ARCHIVED`)';
const docActions = {
  archive: {
    summary: 'Archive a document',
    operationId: 'knowledgeArchiveDoc',
    description:
      'Requires `edit`. Takes the entry out of the tree and search; one already archived stays as it is. No new version.',
    responses: {
      409: apiErrorResponse(
        409,
        'It still has live sub-documents (`KNOWLEDGE_HAS_CHILDREN`).',
      ),
    },
  },
  restore: {
    summary: 'Restore an archived document',
    operationId: 'knowledgeRestoreDoc',
    description:
      'Requires `edit`. Under a parent still archived, or gone, it comes back at the top. No new version.',
    responses: {},
  },
  verify: {
    summary: 'Mark a document verified',
    operationId: 'knowledgeVerifyDoc',
    description:
      'Requires `edit`. Records that the current version was checked, and by whom. No new version.',
    responses: {
      400: apiErrorResponse(400, 'A folder is not verified (`INVALID_KIND`).'),
      409: apiErrorResponse(409, `${archived}.`),
    },
  },
} as const;

/** The knowledge API on a router of its own; `viewerOf` names the caller. */
export function createKnowledgeRoutes(
  knowledge: Knowledge,
  viewerOf: (context: Context) => KnowledgeReader,
  spaces: (space: SpaceRef) => SpaceRef | null,
): Hono {
  const spaceOf = (space: SpaceRef): SpaceRef => check.space(space, spaces);
  const routes = new Hono();
  routes.onError(knowledgeErrorHandler);
  const { docs, files, proposals, permissions } = knowledge;
  const viewer = viewerOf;
  const limit = sizeLimit(files.maxBytes);
  const docParam = apiValidator('param', DocParams);
  const proposalParam = apiValidator('param', ProposalParams);
  const fileQuery = apiValidator('query', FileQuery);

  routes.get(
    '/spaces',
    describeRoute({
      tags,
      summary: 'List a space and the spaces it inherits, with their documents',
      operationId: 'knowledgeListSpaces',
      description:
        'Each space comes with every document of it the caller may read. `archived=true` lists archived documents as well. A short list the application bounds, not paged.',
      responses: {
        200: listResponse(KnowledgeSpaceDocsSchema, KnowledgeTotalMetaSchema),
        ...apiErrorResponses,
        400: unknownSpace,
        404: spaceNotFound,
      },
      // The knowledge page's tree; `kb tree` and `kb list` read the caller's spaces.
      ...cliRoute(false),
    }),
    apiValidator('query', SpacesQuery),
    async (c) => {
      const query = c.req.valid('query');
      const tree = await docs.tree(viewer(c), spaceOf(query), {
        archived: query.archived === 'true',
      });
      // A space and the ones it inherits: a short list the application bounds, not paged.
      return c.json({
        data: tree.spaces,
        meta: { total: tree.spaces.length },
      });
    },
  );
  routes.get(
    '/search',
    describeRoute({
      tags,
      summary: 'Search the documents of a space',
      operationId: 'knowledgeSearchDocs',
      description:
        'Search over the space and the spaces it inherits, in what the caller may read: every search provider’s ranking (keywords, and meaning where the application adds it) fused, cut at the application’s minimum relevance and reranked when it sets a rerank model; the best `pageSize` sections, each with an excerpt. `explain=true` adds how each was ranked for someone who manages the space or the search settings. A ranking has no next page, so `meta` is empty.',
      responses: {
        200: listResponse(KnowledgeHitSchema, KnowledgeEmptyMetaSchema),
        ...apiErrorResponses,
        400: unknownSpace,
        404: spaceNotFound,
      },
      // The knowledge page's search; `kb search` searches the caller's spaces.
      ...cliRoute(false),
    }),
    apiValidator('query', SearchQuery),
    async (c) => {
      const query = c.req.valid('query');
      // The best `pageSize` hits by rank; a ranking has no next page.
      return c.json({
        data: await docs.search(viewer(c), spaceOf(query), query.q, {
          ...(query.pageSize ? { limit: query.pageSize } : {}),
          explain: query.explain === 'true',
        }),
        meta: {},
      });
    },
  );

  routes.get(
    '/chunking',
    describeRoute({
      tags,
      summary: 'Get how a space is cut into sections',
      operationId: 'knowledgeGetChunking',
      description:
        'For someone who reads the space: the application’s default chunking, the space’s own override and the one in effect, and whether its documents are being cut again.',
      responses: {
        200: dataResponse(KnowledgeChunkingConfigSchema),
        ...apiErrorResponses,
        400: unknownSpace,
        404: spaceNotFound,
      },
      ...cliRoute({
        command: 'kb chunking get',
        flags: { scopeId: OWNER_FLAG },
      }),
    }),
    apiValidator('query', SpaceOnlyQuery),
    async (c) =>
      c.json({
        data: await knowledge.chunking.get(
          viewer(c),
          spaceOf(c.req.valid('query')),
        ),
      }),
  );
  routes.put(
    '/chunking',
    describeRoute({
      tags,
      summary: 'Set how a space is cut into sections',
      operationId: 'knowledgeUpdateChunking',
      description:
        'Requires `manage` on the space. `override` replaces the application’s default for this space, or null follows it again. When the chunking in effect changes, every document of the space is cut again in the background, and re-indexed when semantic search is on.',
      responses: {
        200: dataResponse(KnowledgeChunkingConfigSchema),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The application has no such space (`INVALID_SCOPE`), or the chunking is out of range (`INVALID_CHUNKING`).',
        ),
        404: spaceNotFound,
      },
      ...cliRoute({
        command: 'kb chunking set',
        flags: { scopeId: OWNER_FLAG },
        bodyFile: 'file',
        examples: ['kb chunking set --file ./chunking.json'],
      }),
    }),
    apiValidator('json', ChunkingBody),
    async (c) => {
      const body = c.req.valid('json');
      return c.json({
        data: await knowledge.chunking.set(
          viewer(c),
          spaceOf(body),
          body.override,
        ),
      });
    },
  );
  routes.get(
    '/indexing',
    describeRoute({
      tags,
      summary: 'List the documents of a space not yet semantically indexed',
      operationId: 'knowledgeListUnindexedDocs',
      description:
        'The documents of the space the caller reads with sections still waiting for or failing their embedding, failed first, at most 50. Empty, with `meta.enabled` false, while semantic search is off.',
      responses: {
        200: listResponse(
          KnowledgeUnindexedDocSchema,
          KnowledgeIndexingMetaSchema,
        ),
        ...apiErrorResponses,
        400: unknownSpace,
        404: spaceNotFound,
      },
      // The space home's list; `kb doc index` reads one document.
      ...cliRoute(false),
    }),
    apiValidator('query', SpaceOnlyQuery),
    async (c) => {
      const found = await knowledge.indexing.unfinished(
        viewer(c),
        spaceOf(c.req.valid('query')),
      );
      return c.json({
        data: found ?? [],
        meta: { enabled: found !== null },
      });
    },
  );

  routes.get(
    '/subjects',
    describeRoute({
      tags,
      summary: 'Search the subjects access can be granted to',
      operationId: 'knowledgeListSubjects',
      description:
        'For someone who manages the space: the best `pageSize` matches of each subject type (or of `type`), and the types in `meta`. A search has no next page.',
      responses: {
        200: listResponse(KnowledgeSubjectSchema, KnowledgeSubjectsMetaSchema),
        ...apiErrorResponses,
        400: unknownSpace,
        404: spaceNotFound,
      },
      ...cliRoute({
        command: 'kb subject list',
        flags: { scopeId: OWNER_FLAG, pageSize: { name: 'limit' } },
        columns: ['type', 'id', 'label', 'hint'],
        examples: ['kb subject list --scope system --q alice'],
      }),
    }),
    apiValidator('query', SubjectsQuery),
    async (c) => {
      const query = c.req.valid('query');
      const found = await permissions.subjects(
        viewer(c),
        spaceOf(query),
        query.q,
        {
          ...(query.type ? { type: query.type } : {}),
          limit: query.pageSize,
        },
      );
      // The best `pageSize` matches of each type; a search has no next page.
      return c.json({ data: found.subjects, meta: { types: found.types } });
    },
  );

  // Fixed segments before `/docs/:docId`.
  routes.post(
    '/docs',
    describeRoute({
      tags,
      summary: 'Create an article or a folder',
      operationId: 'knowledgeCreateDoc',
      description:
        'Requires `edit` on the parent, or on the space at the top. The slug is derived from the title unless given. Files are uploaded with `knowledgeUploadDoc`.',
      responses: {
        201: dataResponse(KnowledgeDocSchema, 'The new document.'),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The application has no such space (`INVALID_SCOPE`), the parent is not a document of the space, or is a file (`INVALID_PARENT`), or a title, slug, summary or content breaks its rules.',
        ),
        404: spaceNotFound,
        409: apiErrorResponse(
          409,
          'The slug is taken (`KNOWLEDGE_SLUG_TAKEN`), the parent is archived (`KNOWLEDGE_ARCHIVED`), or it would nest too deep (`KNOWLEDGE_DEPTH_EXCEEDED`).',
        ),
      },
      ...cliRoute({
        command: 'kb doc create',
        flags: {
          scopeId: OWNER_FLAG,
          parentId: { name: 'parent' },
          content: { contentFile: true },
        },
        examples: [
          'kb doc create --scope system --title "Conventions" --content-file ./conventions.md',
        ],
      }),
    }),
    apiValidator('json', CreateDocBody),
    async (c) =>
      c.json({ data: await docs.create(viewer(c), c.req.valid('json')) }, 201),
  );
  routes.post(
    '/docs/upload',
    describeRoute({
      tags,
      summary: 'Upload a file as a new document',
      operationId: 'knowledgeUploadDoc',
      description:
        "Requires `edit` on the parent, or on the space at the top. A multipart body of one `file` and the entry's fields. The title is the file's name unless given; the text of a parsed type is extracted in the background (`file.parseStatus`).",
      requestBody: multipartBody(UploadForm),
      responses: {
        200: dataResponse(KnowledgeDocSchema, 'The new file entry.'),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'No `file` or invalid fields (`INVALID_FILE`, `INVALID_ARGUMENT`), no such space (`INVALID_SCOPE`), or the application stores no files (`FILES_UNAVAILABLE`).',
        ),
        404: spaceNotFound,
        409: apiErrorResponse(
          409,
          'The slug is taken (`KNOWLEDGE_SLUG_TAKEN`), the parent is archived (`KNOWLEDGE_ARCHIVED`), or it would nest too deep (`KNOWLEDGE_DEPTH_EXCEEDED`).',
        ),
        413: fileTooLargeResponse,
        415: notMultipartResponse,
      },
      ...cliRoute({
        command: 'kb doc upload',
        flags: { scopeId: OWNER_FLAG, parentId: { name: 'parent' } },
        examples: ['kb doc upload --file ./runbook.pdf --scope system'],
      }),
    }),
    limit,
    async (c) => {
      const { fields, file } = await formOf(c, UploadFields);
      return c.json({ data: await files.upload(viewer(c), fields, file) });
    },
  );
  routes.get(
    '/docs/:docId',
    describeRoute({
      tags,
      summary: 'Get a document at its current version',
      operationId: 'knowledgeGetDoc',
      responses: {
        200: dataResponse(KnowledgeDocSchema),
        ...apiErrorResponses,
        404: docNotFoundResponse,
      },
      // The knowledge page's reader; `kb read` reads a document by slug or id.
      ...cliRoute(false),
    }),
    docParam,
    async (c) =>
      c.json({ data: await docs.get(viewer(c), c.req.valid('param').docId) }),
  );
  routes.patch(
    '/docs/:docId',
    describeRoute({
      tags,
      summary: 'Save a new version of a document',
      operationId: 'knowledgeUpdateDoc',
      description:
        "Requires `edit`. Written against `expectedVersion`, the version read. A file entry's new version keeps its file (replace it with `knowledgeReplaceDocFile`); a folder is renamed, with no version.",
      responses: {
        200: dataResponse(KnowledgeDocSchema),
        ...apiErrorResponses,
        404: docNotFoundResponse,
        409: apiErrorResponse(
          409,
          `The document moved past \`expectedVersion\` (\`KNOWLEDGE_VERSION_CONFLICT\`), or ${archived.charAt(0).toLowerCase()}${archived.slice(1)}.`,
        ),
      },
      ...cliRoute({
        command: 'kb doc update',
        flags: { docId: { name: 'doc' }, content: { contentFile: true } },
        examples: [
          'kb doc update <doc> --expected-version 3 --content-file ./doc.md',
        ],
      }),
    }),
    docParam,
    apiValidator('json', UpdateDocBody),
    async (c) =>
      c.json({
        data: await docs.update(
          viewer(c),
          c.req.valid('param').docId,
          c.req.valid('json'),
        ),
      }),
  );
  routes.get(
    '/docs/:docId/versions',
    describeRoute({
      tags,
      summary: 'List the versions of a document',
      operationId: 'knowledgeListDocVersions',
      description: 'Newest first, without their content.',
      responses: {
        200: listResponse(KnowledgeVersionSchema, KnowledgePageMetaSchema),
        ...apiErrorResponses,
        404: docNotFoundResponse,
      },
      ...cliRoute({
        command: 'kb doc version list',
        flags: { docId: { name: 'doc' }, pageSize: { name: 'limit' } },
        columns: ['version', 'title', 'author.name', 'note', 'createdAt'],
      }),
    }),
    docParam,
    apiValidator('query', PageQuery),
    async (c) =>
      c.json(
        pageOf(
          await docs.versions(viewer(c), c.req.valid('param').docId),
          c.req.valid('query'),
        ),
      ),
  );
  routes.get(
    '/docs/:docId/versions/:version',
    describeRoute({
      tags,
      summary: 'Get one version of a document',
      operationId: 'knowledgeGetDocVersion',
      description: 'With its content.',
      responses: {
        200: dataResponse(KnowledgeVersionSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(
          404,
          'The document or the version does not exist, or the caller may not read it (`DOC_NOT_FOUND`, `VERSION_NOT_FOUND`).',
        ),
      },
      ...cliRoute({
        command: 'kb doc version get',
        flags: { docId: { name: 'doc' } },
      }),
    }),
    apiValidator('param', VersionParams),
    async (c) => {
      const { docId, version } = c.req.valid('param');
      return c.json({ data: await docs.version(viewer(c), docId, version) });
    },
  );
  routes.post(
    '/docs/:docId/move',
    describeRoute({
      tags,
      summary: 'Move a document',
      operationId: 'knowledgeMoveDoc',
      description:
        'Requires `edit` on the document and on where it goes. `parentId: null` moves it to the top of its space. No new version.',
      responses: {
        200: dataResponse(KnowledgeDocSchema),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The parent is not a document of the same space, or is a file (`INVALID_PARENT`).',
        ),
        404: docNotFoundResponse,
        409: apiErrorResponse(
          409,
          `It would move under itself (\`KNOWLEDGE_INVALID_MOVE\`) or nest too deep (\`KNOWLEDGE_DEPTH_EXCEEDED\`), or the document or the parent is archived (\`KNOWLEDGE_ARCHIVED\`).`,
        ),
      },
      ...cliRoute({
        command: 'kb doc move',
        flags: { docId: { name: 'doc' }, parentId: { name: 'parent' } },
      }),
    }),
    docParam,
    apiValidator('json', MoveDocBody),
    async (c) =>
      c.json({
        data: await docs.move(
          viewer(c),
          c.req.valid('param').docId,
          c.req.valid('json'),
        ),
      }),
  );
  for (const action of ['archive', 'restore', 'verify'] as const) {
    const { responses, ...spec } = docActions[action];
    routes.post(
      `/docs/:docId/${action}`,
      describeRoute({
        tags,
        ...spec,
        responses: {
          200: dataResponse(KnowledgeDocSchema),
          ...apiErrorResponses,
          404: docNotFoundResponse,
          ...responses,
        },
        ...cliRoute({
          command: `kb doc ${action}`,
          flags: { docId: { name: 'doc' } },
          ...(action === 'archive'
            ? {
                confirm:
                  'Archive the document? It leaves the tree and search until restored.',
              }
            : {}),
        }),
      }),
      docParam,
      async (c) =>
        c.json({
          data: await docs[action](viewer(c), c.req.valid('param').docId),
        }),
    );
  }
  routes.post(
    '/docs/:docId/replaceFile',
    describeRoute({
      tags,
      summary: 'Replace the file of a file entry',
      operationId: 'knowledgeReplaceDocFile',
      description:
        "Requires `edit`. A multipart body of one `file`, `expectedVersion` (the current version when absent) and `note`. The new file becomes the entry's next version; its text is extracted in the background.",
      requestBody: multipartBody(ReplaceFileForm),
      responses: {
        200: dataResponse(KnowledgeDocSchema),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'No `file` or invalid fields (`INVALID_FILE`, `INVALID_ARGUMENT`), the entry is not a file (`INVALID_KIND`), or the application stores no files (`FILES_UNAVAILABLE`).',
        ),
        404: docNotFoundResponse,
        409: apiErrorResponse(
          409,
          `The entry moved past \`expectedVersion\` (\`KNOWLEDGE_VERSION_CONFLICT\`), or it is archived (\`KNOWLEDGE_ARCHIVED\`).`,
        ),
        413: fileTooLargeResponse,
        415: notMultipartResponse,
      },
      ...cliRoute({
        command: 'kb doc replace-file',
        flags: { docId: { name: 'doc' } },
      }),
    }),
    limit,
    docParam,
    async (c) => {
      const { fields, file } = await formOf(c, ReplaceFileFields);
      return c.json({
        data: await files.replace(
          viewer(c),
          c.req.valid('param').docId,
          fields,
          file,
        ),
      });
    },
  );
  routes.get(
    '/docs/:docId/file',
    describeRoute({
      tags,
      summary: 'Download the file of a file entry',
      operationId: 'knowledgeGetDocFile',
      description:
        "The current version's file, or `version`'s. `download=true` serves it as an attachment.",
      responses: {
        200: fileContentResponse,
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The application stores no files (`FILES_UNAVAILABLE`).',
        ),
        404: apiErrorResponse(
          404,
          'The document, the version or its file does not exist, or the caller may not read it (`DOC_NOT_FOUND`, `FILE_NOT_FOUND`).',
        ),
      },
      // The knowledge page's file view; `kb download` saves a file by slug or id.
      ...cliRoute(false),
    }),
    docParam,
    fileQuery,
    async (c) => {
      const { version, download } = c.req.valid('query');
      return serve(
        await files.content(viewer(c), c.req.valid('param').docId, {
          ...(version === undefined ? {} : { version }),
        }),
        download === 'true',
      );
    },
  );
  routes.post(
    '/docs/:docId/reparse',
    describeRoute({
      tags,
      summary: 'Extract the text of a file again',
      operationId: 'knowledgeReparseDoc',
      description:
        'Requires `edit`. For a version whose extraction failed: the current one unless `version` names another. The extraction runs in the background.',
      responses: {
        200: dataResponse(KnowledgeDocSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(
          404,
          'The document does not exist or the caller may not read it (`DOC_NOT_FOUND`), or the version holds no file (`FILE_NOT_FOUND`).',
        ),
        409: apiErrorResponse(
          409,
          'The extraction has not failed (`KNOWLEDGE_NOT_FAILED`).',
        ),
      },
      ...cliRoute({
        command: 'kb doc reparse',
        flags: { docId: { name: 'doc' } },
      }),
    }),
    docParam,
    apiValidator('json', ReparseBody),
    async (c) =>
      c.json({
        data: await files.reparse(
          viewer(c),
          c.req.valid('param').docId,
          c.req.valid('json'),
        ),
      }),
  );

  routes.get(
    '/docs/:docId/index',
    describeRoute({
      tags,
      summary: 'Get a document’s sections and their index state',
      operationId: 'knowledgeGetDocIndex',
      description:
        'Its sections at the current version: headings, lines and length, and with semantic search on where each stands in the index (`pending`, `done`, or `failed` with why).',
      responses: {
        200: dataResponse(KnowledgeDocIndexSchema),
        ...apiErrorResponses,
        404: docNotFoundResponse,
      },
      ...cliRoute({
        command: 'kb doc index',
        flags: { docId: { name: 'doc' } },
      }),
    }),
    docParam,
    async (c) =>
      c.json({
        data: await knowledge.indexing.doc(
          viewer(c),
          c.req.valid('param').docId,
        ),
      }),
  );
  routes.post(
    '/docs/:docId/reindex',
    describeRoute({
      tags,
      summary: 'Index a document’s sections again',
      operationId: 'knowledgeReindexDoc',
      description:
        'Requires `edit`. Queues its sections for embedding again, the failed ones included; nothing happens while semantic search is off. Answers where they stand.',
      responses: {
        200: dataResponse(KnowledgeDocIndexSchema),
        ...apiErrorResponses,
        404: docNotFoundResponse,
      },
      ...cliRoute({
        command: 'kb doc reindex',
        flags: { docId: { name: 'doc' } },
      }),
    }),
    docParam,
    async (c) =>
      c.json({
        data: await knowledge.indexing.reindex(
          viewer(c),
          c.req.valid('param').docId,
        ),
      }),
  );

  routes.get(
    '/docs/:docId/permissions',
    describeRoute({
      tags,
      summary: 'Get who may do what on a document',
      operationId: 'knowledgeGetDocPermissions',
      description:
        'Requires `manage`. The mode, the entries, what it inherits and the subject types.',
      responses: {
        200: dataResponse(KnowledgePermissionsSchema),
        ...apiErrorResponses,
        404: docNotFoundResponse,
      },
      ...cliRoute({
        command: 'kb doc permission get',
        flags: { docId: { name: 'doc' } },
      }),
    }),
    docParam,
    async (c) =>
      c.json({
        data: await permissions.get(viewer(c), c.req.valid('param').docId),
      }),
  );
  // A node's permissions are one configuration, always written whole.
  routes.put(
    '/docs/:docId/permissions',
    describeRoute({
      tags,
      summary: 'Replace who may do what on a document',
      operationId: 'knowledgeReplaceDocPermissions',
      description:
        'Requires `manage`, checked before the body is read. `inherit` adds the entries to what the parent grants; `custom` grants only them.',
      responses: {
        200: dataResponse(KnowledgePermissionsSchema),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'An entry names a subject the application does not know, grants an unknown level or repeats a subject (`INVALID_SUBJECT`, `INVALID_LEVEL`, `DUPLICATE_SUBJECT`).',
        ),
        404: docNotFoundResponse,
      },
      ...cliRoute({
        command: 'kb doc permission set',
        flags: { docId: { name: 'doc' } },
        bodyFile: 'file',
        confirm: "Replace the document's permissions?",
        examples: ['kb doc permission set <doc> --file ./permissions.json'],
      }),
    }),
    docParam,
    // Who may change them is checked before what they asked for.
    async (c, next) => {
      await permissions.authorize(viewer(c), c.req.valid('param').docId);
      await next();
    },
    apiValidator('json', PermissionsBody),
    async (c) =>
      c.json({
        data: await permissions.replace(
          viewer(c),
          c.req.valid('param').docId,
          c.req.valid('json'),
        ),
      }),
  );
  routes.get(
    '/docs/:docId/access',
    describeRoute({
      tags,
      summary: "Get the caller's access to a document",
      operationId: 'knowledgeGetDocAccess',
      description: 'With where that access comes from.',
      responses: {
        200: dataResponse(KnowledgeEffectiveAccessSchema),
        ...apiErrorResponses,
        404: docNotFoundResponse,
      },
      ...cliRoute({
        command: 'kb doc access get',
        flags: { docId: { name: 'doc' } },
      }),
    }),
    docParam,
    async (c) =>
      c.json({
        data: await permissions.effective(
          viewer(c),
          c.req.valid('param').docId,
        ),
      }),
  );

  // Fixed segments before `/proposals/:proposalId`.
  routes.get(
    '/proposals',
    describeRoute({
      tags,
      summary: 'List proposals',
      operationId: 'knowledgeListProposals',
      description:
        'Proposals of `status` (`pending` by default) in the spaces the caller reads, narrowed to a space or a document; `decidable=true` keeps those the caller may decide.',
      responses: {
        200: listResponse(KnowledgeProposalSchema, KnowledgePageMetaSchema),
        ...apiErrorResponses,
        400: unknownSpace,
      },
      ...cliRoute({
        command: 'kb proposal list',
        flags: {
          scopeId: OWNER_FLAG,
          docId: { name: 'doc' },
          pageSize: { name: 'limit' },
        },
        columns: [
          'id',
          'kind',
          'status',
          'docTitle',
          'proposer.name',
          'reason',
        ],
        examples: ['kb proposal list --decidable true'],
      }),
    }),
    apiValidator('query', ProposalsQuery),
    async (c) => {
      const query = c.req.valid('query');
      return c.json(
        pageOf(
          await proposals.list(viewer(c), {
            status: query.status,
            ...(query.scope
              ? {
                  space: spaceOf({
                    scope: query.scope,
                    scopeId: query.scopeId,
                  }),
                }
              : {}),
            ...(query.docId ? { docId: query.docId } : {}),
            decidable: query.decidable === 'true',
          }),
          query,
        ),
      );
    },
  );
  routes.post(
    '/proposals',
    describeRoute({
      tags,
      summary: 'Propose a knowledge change',
      operationId: 'knowledgeCreateProposal',
      description:
        'Requires `propose`. `update` and `verify` name the document (`update` against `baseVersion`, the current version when absent); `create` names its space or its parent. Someone who may edit decides. Files are proposed with `knowledgeUploadProposal`.',
      responses: {
        201: dataResponse(KnowledgeProposalSchema, 'The proposal.'),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The document or the parent is missing or hidden (`DOC_NOT_FOUND`, `INVALID_PARENT`), no such space (`INVALID_SCOPE`), or a field breaks its rules.',
        ),
        409: apiErrorResponse(
          409,
          'A proposal from the same source is pending for the document (`KNOWLEDGE_PROPOSAL_PENDING`), the run has proposed its limit (`KNOWLEDGE_PROPOSAL_LIMIT`), the same content was rejected before (`KNOWLEDGE_PROPOSAL_REJECTED`), or the document is archived (`KNOWLEDGE_ARCHIVED`).',
        ),
      },
      // `kb propose` proposes by slug in the caller's spaces, from a run's mount too.
      ...cliRoute(false),
    }),
    apiValidator('json', ProposeBody),
    async (c) =>
      c.json(
        {
          data: await proposals.propose(
            viewer(c),
            proposalOfBody(c.req.valid('json')),
          ),
        },
        201,
      ),
  );
  routes.post(
    '/proposals/upload',
    describeRoute({
      tags,
      summary: 'Propose a new file, or a replacement',
      operationId: 'knowledgeUploadProposal',
      description:
        "Requires `propose`. A multipart body of one `file` and the proposal's fields: `create` a new file entry, or `update` the file entry `docId`. The file waits unparsed until the proposal is accepted.",
      requestBody: multipartBody(ProposeFileForm),
      responses: {
        200: dataResponse(KnowledgeProposalSchema, 'The proposal.'),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'No `file` or invalid fields (`INVALID_FILE`, `INVALID_ARGUMENT`), the document is missing or not a file (`DOC_NOT_FOUND`, `INVALID_KIND`), or the application stores no files (`FILES_UNAVAILABLE`).',
        ),
        409: apiErrorResponse(
          409,
          'A proposal from the same source is pending (`KNOWLEDGE_PROPOSAL_PENDING`), the run has proposed its limit (`KNOWLEDGE_PROPOSAL_LIMIT`), or the document is archived (`KNOWLEDGE_ARCHIVED`).',
        ),
        413: fileTooLargeResponse,
        415: notMultipartResponse,
      },
      // `kb upload` proposes a file by slug in the caller's spaces.
      ...cliRoute(false),
    }),
    limit,
    async (c) => {
      const { fields, file } = await formOf(c, ProposeFileFields);
      return c.json({
        data: await proposals.proposeFile(
          viewer(c),
          proposalOfForm(fields),
          file,
        ),
      });
    },
  );
  routes.get(
    '/proposals/:proposalId',
    describeRoute({
      tags,
      summary: 'Get a proposal',
      operationId: 'knowledgeGetProposal',
      description:
        'With the content at its base version and now, for the diffs a stale proposal shows.',
      responses: {
        200: dataResponse(KnowledgeProposalSchema),
        ...apiErrorResponses,
        404: proposalNotFoundResponse,
      },
      ...cliRoute({
        command: 'kb proposal get',
        flags: { proposalId: { name: 'proposal' } },
      }),
    }),
    proposalParam,
    async (c) =>
      c.json({
        data: await proposals.get(viewer(c), c.req.valid('param').proposalId),
      }),
  );
  routes.get(
    '/proposals/:proposalId/file',
    describeRoute({
      tags,
      summary: 'Download the file of a proposal',
      operationId: 'knowledgeGetProposalFile',
      description:
        '`download=true` serves it as an attachment; `version` is ignored.',
      responses: {
        200: fileContentResponse,
        ...apiErrorResponses,
        404: apiErrorResponse(
          404,
          'The proposal or its file does not exist, or the caller may not read it (`PROPOSAL_NOT_FOUND`, `FILE_NOT_FOUND`).',
        ),
      },
      ...cliRoute({
        command: 'kb proposal download',
        flags: {
          proposalId: { name: 'proposal' },
          version: { hidden: true },
          download: { hidden: true },
        },
      }),
    }),
    proposalParam,
    fileQuery,
    async (c) =>
      serve(
        await proposals.file(viewer(c), c.req.valid('param').proposalId),
        c.req.valid('query').download === 'true',
      ),
  );
  routes.post(
    '/proposals/:proposalId/accept',
    describeRoute({
      tags,
      summary: 'Accept a proposal',
      operationId: 'knowledgeAcceptProposal',
      description:
        "Requires `edit` where the proposal applies. Applies it as the document's next version (or a new document), authored by its proposer. A stale `update` is refused unless `confirmStale` is true, which makes its content the next version whole.",
      responses: {
        200: dataResponse(KnowledgeProposalSchema, 'The accepted proposal.'),
        ...apiErrorResponses,
        404: proposalNotFoundResponse,
        409: apiErrorResponse(
          409,
          'It is no longer pending (`KNOWLEDGE_PROPOSAL_DECIDED`), it is stale or its document or file is gone (`KNOWLEDGE_PROPOSAL_STALE`), the document is archived (`KNOWLEDGE_ARCHIVED`), or the slug is taken (`KNOWLEDGE_SLUG_TAKEN`).',
        ),
      },
      ...cliRoute({
        command: 'kb proposal accept',
        flags: { proposalId: { name: 'proposal' } },
        examples: ['kb proposal accept <proposal> --comment "Thanks"'],
      }),
    }),
    proposalParam,
    apiValidator('json', AcceptBody),
    async (c) =>
      c.json({
        data: await proposals.accept(
          viewer(c),
          c.req.valid('param').proposalId,
          c.req.valid('json'),
        ),
      }),
  );
  routes.post(
    '/proposals/:proposalId/reject',
    describeRoute({
      tags,
      summary: 'Reject a proposal',
      operationId: 'knowledgeRejectProposal',
      description:
        'Requires `edit` where the proposal applies. The same content from the same source is refused from then on.',
      responses: {
        200: dataResponse(KnowledgeProposalSchema, 'The rejected proposal.'),
        ...apiErrorResponses,
        404: proposalNotFoundResponse,
        409: apiErrorResponse(
          409,
          'It is no longer pending (`KNOWLEDGE_PROPOSAL_DECIDED`).',
        ),
      },
      ...cliRoute({
        command: 'kb proposal reject',
        flags: { proposalId: { name: 'proposal' } },
        confirm:
          'Reject the proposal? The same content is refused from then on.',
      }),
    }),
    proposalParam,
    apiValidator('json', RejectBody),
    async (c) =>
      c.json({
        data: await proposals.reject(
          viewer(c),
          c.req.valid('param').proposalId,
          c.req.valid('json'),
        ),
      }),
  );
  routes.post(
    '/proposals/:proposalId/withdraw',
    describeRoute({
      tags,
      summary: 'Withdraw a proposal',
      operationId: 'knowledgeWithdrawProposal',
      description: 'For the person it was made for, or the actor that made it.',
      responses: {
        200: dataResponse(KnowledgeProposalSchema, 'The withdrawn proposal.'),
        ...apiErrorResponses,
        404: proposalNotFoundResponse,
        409: apiErrorResponse(
          409,
          'It is no longer pending (`KNOWLEDGE_PROPOSAL_DECIDED`).',
        ),
      },
      ...cliRoute({
        command: 'kb proposal withdraw',
        flags: { proposalId: { name: 'proposal' } },
        confirm: 'Withdraw the proposal?',
      }),
    }),
    proposalParam,
    async (c) =>
      c.json({
        data: await proposals.withdraw(
          viewer(c),
          c.req.valid('param').proposalId,
        ),
      }),
  );
  return routes;
}

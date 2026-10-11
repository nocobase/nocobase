/**
 * `/api/kb`: the knowledge base as the person or the run asking reads it, the `nb-studio kb` commands (`views.ts`). A
 * person signs in or uses an API key (its scope honoured); a run uses its token. Reading needs `kb.knowledge` `read`,
 * proposing `propose`, from Studio's roles, and for a run only what its agent is configured with
 * (those agents may be given, `../access/action-policy.ts`, through the action gate), checked before the input.
 *
 * | route                          | command                  | what                                                     |
 * | ------------------------------ | ------------------------ | -------------------------------------------------------- |
 * | `GET /docs?q=&parent=`         | `kb list`                | the documents, flat (`q` filters by words)               |
 * | `GET /tree`                    | `kb tree`                | the documents as a tree; `meta.message` draws it         |
 * | `GET /docs/:doc?version=`      | `kb read <doc>`          | one by slug or id; `meta.message` is its Markdown        |
 * | `GET /search?q=&pageSize=`     | `kb search <query>`      | hits with section and lines, merged over the spaces read |
 * | `GET /docs/:doc/file?version=` | `kb download <doc>`      | a file's original bytes                                  |
 * | `POST /proposals`              | `kb propose`             | JSON, or multipart with the run's changed files          |
 * | `POST /uploadTickets`          | `kb upload --file <path>`| a one-time ticket the file of a file proposal is sent to |
 *
 * Every route takes `projectId`; without it a run on an issue reads its project's knowledge, a run on a conversation
 * the projects it is about, and a person the system's. Knowledge refusals keep the plugin's domain (`knowledge`).
 */
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import type { CallerIdentity } from '@nocobase/app-plugin-agents/server/tokens';
import {
  contentHeaders,
  KnowledgeError,
  knowledgeErrorHandler,
  MANIFEST_FILE,
  type Knowledge,
} from '@nocobase/app-plugin-knowledge/server';
import { knowledgeToken } from '@nocobase/app-plugin-knowledge/server/tokens';
import {
  KNOWLEDGE_CONTENT_MAX,
  KNOWLEDGE_PROPOSALS_PER_RUN,
} from '@nocobase/app-plugin-knowledge/shared/knowledge';
import type { Application } from '@nocobase/app-server/application';
import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  cliRoute,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  listResponse,
  parseApiInput,
  resolver,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import {
  levelActionsOf,
  type BusinessKey,
} from '@nocobase/app-plugin-knowledge/shared/access';
import { Hono, type ErrorHandler, type MiddlewareHandler } from 'hono';
import { z } from 'zod';

import { businessResource } from '../access/catalog.js';
import { callerOfRequest } from '../agents/run-principal.js';
import { studioError, studioErrorHandler } from '../http/errors.js';
import { KNOWLEDGE_PROPOSE, KNOWLEDGE_READ } from './actions.js';
import { KNOWLEDGE_TARGET } from './mount.js';
import {
  KbChangedResultSchema,
  KbDocParams,
  KbDocSchema,
  KbHitSchema,
  KbListItemSchema,
  KbListQuery,
  KbProposeBody,
  KbProposedSchema,
  KbProposeForm,
  KbScopeQuery,
  KbSearchQuery,
  KbTreeSchema,
  KbUploadBody,
  KbUploadTicketSchema,
  KbVersionQuery,
  type KbUploadTicket,
} from './schemas.js';
import type { KbProposeInput, KnowledgeViews } from './views.js';

const tags = ['Studio'];
/** A person (session or API key) or an agent's run. */
const personOrRun: Record<string, string[]>[] = [
  { cookieAuth: [] },
  { apiKeyAuth: [] },
  { runToken: [] },
];
const project = {
  projectId: {
    name: 'project',
    description:
      "A project's id: read its knowledge too. A run on an issue reads its project's without it, and a conversation the projects it is about.",
  },
} as const;

/** What the routes reach, bound by `StudioKnowledgeProvider`. */
export interface StudioKnowledgeViews {
  readonly views: KnowledgeViews;
  /** The business actions an identity holds (the action gate). */
  readonly allowed: (identity: CallerIdentity) => Promise<ReadonlySet<string>>;
  /** Studio's public base path (`/app`, or empty), for the address a file is uploaded to. */
  readonly basePath: () => string;
}

export const studioKnowledgeViewsToken: ServiceToken<StudioKnowledgeViews> =
  createServiceToken<StudioKnowledgeViews>('studio/knowledge/views');

export interface KnowledgeViewRoutesDeps extends StudioKnowledgeViews {
  readonly knowledge: () => Pick<Knowledge, 'files'>;
  readonly authenticate: MiddlewareHandler;
  readonly authorize: MiddlewareHandler;
}

const onError: ErrorHandler = (error, context) =>
  error instanceof KnowledgeError
    ? knowledgeErrorHandler(error, context)
    : studioErrorHandler(error, context);

const notFound = apiErrorResponse(
  404,
  'No space read has the document, or the caller may not read it (`DOC_NOT_FOUND`).',
);

/** A multipart proposal: its text fields, and the changed files. */
async function proposalForm(
  request: Request,
): Promise<{ files: File[]; fields: KbProposeInput }> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new KnowledgeError(
      400,
      'INVALID_FILE',
      'Send the changed files as multipart form data.',
    );
  }
  const files: File[] = [];
  const fields: Record<string, unknown> = {};
  for (const [name, value] of form.entries()) {
    if (name === 'files') {
      if (typeof value !== 'string') files.push(value);
    } else if (typeof value === 'string')
      fields[name] = name === 'verify' ? value === 'true' : value;
  }
  return { files, fields: parseApiInput(KbProposeBody, fields) };
}

/** The `/kb` router; `createKnowledgeViewRoutes` alone in tests. */
export function createKnowledgeViewRoutes(deps: KnowledgeViewRoutesDeps): Hono {
  const routes = new Hono();
  routes.onError(onError);
  routes.use('*', deps.authenticate);
  routes.use('*', deps.authorize);

  const caller = (
    context: Parameters<MiddlewareHandler>[0],
  ): CallerIdentity => {
    const identity = callerOfRequest(context);
    if (!identity)
      throw studioError('UNAUTHENTICATED', 'UNAUTHENTICATED', 'Sign in first.');
    return identity;
  };

  /** Refuses a caller without `action`, before the input is read; a key's scope bounds a person too. */
  const may =
    (action: string, message: string): MiddlewareHandler =>
    async (context, next) => {
      const identity = caller(context);
      const business = action.slice(0, action.indexOf('/'));
      const scope = identity.keyScope;
      // The scope covers the action at any of its levels (`read.related`, `read.all`).
      const allowed =
        (await deps.allowed(identity)).has(action) &&
        (identity.kind === 'run' ||
          !scope ||
          levelActionsOf(action as BusinessKey).some(({ name }) =>
            scope.allows(businessResource(business), name),
          ));
      if (!allowed)
        throw studioError('PERMISSION_DENIED', 'FORBIDDEN', message);
      await next();
    };
  const read = may(KNOWLEDGE_READ, 'You may not read the knowledge base.');
  const propose = may(
    KNOWLEDGE_PROPOSE,
    'You may not propose knowledge changes.',
  );

  routes.get(
    '/docs',
    read,
    describeRoute({
      tags,
      summary: 'List the knowledge documents',
      operationId: 'kbListDocs',
      description:
        "The documents the caller reads in the spaces read (with the system's), each with the page that shows it. `q` keeps those matching the words, best first; `parent` one document's children. A bounded list, not paged.",
      security: personOrRun,
      responses: {
        200: listResponse(
          KbListItemSchema,
          z.object({ total: z.number().int() }),
        ),
        ...apiErrorResponses,
        404: notFound,
      },
      ...cliRoute({
        command: 'kb list',
        flags: project,
        columns: ['slug', 'title', 'kind', 'space', 'version', 'summary'],
        action: KNOWLEDGE_READ,
        examples: ['kb list', 'kb list --parent known-pitfalls'],
      }),
    }),
    apiValidator('query', KbListQuery),
    async (c) => {
      const query = c.req.valid('query');
      const data = await deps.views.list(caller(c), query);
      return c.json({ data, meta: { total: data.length } });
    },
  );

  routes.get(
    '/tree',
    read,
    describeRoute({
      tags,
      summary: 'Get the knowledge documents as a tree',
      operationId: 'kbGetTree',
      description:
        'Each space read with its documents, the system’s last. `meta.message` draws the tree with each slug and summary.',
      security: personOrRun,
      responses: {
        200: dataResponse(KbTreeSchema),
        ...apiErrorResponses,
      },
      ...cliRoute({
        command: 'kb tree',
        flags: project,
        action: KNOWLEDGE_READ,
      }),
    }),
    apiValidator('query', KbScopeQuery),
    async (c) => {
      const { data, message } = await deps.views.tree(
        caller(c),
        c.req.valid('query'),
      );
      return c.json({ data, meta: { message } });
    },
  );

  routes.get(
    '/search',
    read,
    describeRoute({
      tags,
      summary: 'Search the knowledge',
      operationId: 'kbSearch',
      description:
        "Hits in articles and files' text the caller reads, over the spaces read, each section once at its best score: its document, section, lines and the page at that heading. A ranking has no next page.",
      security: personOrRun,
      responses: {
        200: listResponse(KbHitSchema, z.object({})),
        ...apiErrorResponses,
      },
      ...cliRoute({
        command: 'kb search',
        args: ['q'],
        flags: {
          q: { name: 'query' },
          pageSize: { name: 'limit' },
          ...project,
        },
        columns: ['slug', 'title', 'section', 'lines', 'excerpt'],
        action: KNOWLEDGE_READ,
        examples: ['kb search "release checklist"'],
      }),
    }),
    apiValidator('query', KbSearchQuery),
    async (c) => {
      const { q, pageSize, projectId } = c.req.valid('query');
      return c.json({
        data: await deps.views.search(caller(c), q, {
          limit: pageSize,
          ...(projectId ? { projectId } : {}),
        }),
        meta: {},
      });
    },
  );

  routes.get(
    '/docs/:doc',
    read,
    describeRoute({
      tags,
      summary: 'Read a knowledge document',
      operationId: 'kbReadDoc',
      description:
        "A document by slug or id, at its current version or `version`. `meta.message` is its Markdown, with a note when the run's mounted copy is older.",
      security: personOrRun,
      responses: {
        200: dataResponse(KbDocSchema),
        ...apiErrorResponses,
        404: notFound,
      },
      ...cliRoute({
        command: 'kb read',
        flags: project,
        action: KNOWLEDGE_READ,
        examples: ['kb read conventions', 'kb read conventions --version 2'],
      }),
    }),
    apiValidator('param', KbDocParams),
    apiValidator('query', KbVersionQuery),
    async (c) => {
      const { data, message } = await deps.views.read(
        caller(c),
        c.req.valid('param').doc,
        c.req.valid('query'),
      );
      return c.json({ data, meta: { message } });
    },
  );

  routes.get(
    '/docs/:doc/file',
    read,
    describeRoute({
      tags,
      summary: 'Download a knowledge file',
      operationId: 'kbDownloadDoc',
      description:
        "A file's original bytes by slug or id, as an attachment; `kb read` gives its extracted text.",
      security: personOrRun,
      responses: {
        200: {
          description: 'The file, as an attachment.',
          content: { '*/*': { schema: { type: 'string', format: 'binary' } } },
        },
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The document is not a file (`INVALID_ARGUMENT`), or the application stores no files (`FILES_UNAVAILABLE`).',
        ),
        404: notFound,
      },
      ...cliRoute({
        command: 'kb download',
        flags: project,
        action: KNOWLEDGE_READ,
        examples: ['kb download budget-xlsx --out ./budget.xlsx'],
      }),
    }),
    apiValidator('param', KbDocParams),
    apiValidator('query', KbVersionQuery),
    async (c) => {
      const content = await deps.views.download(
        caller(c),
        c.req.valid('param').doc,
        c.req.valid('query'),
      );
      return new Response(content.body, {
        status: 200,
        headers: contentHeaders(content.file, true),
      });
    },
  );

  routes.post(
    '/proposals',
    propose,
    describeRoute({
      tags,
      summary: 'Propose a knowledge change',
      operationId: 'kbPropose',
      description: `For someone who may edit to decide: an update (\`doc\` with \`content\`), a verification (\`doc\` with \`verify\`), a new document (\`title\` with \`content\`), or, as \`multipart/form-data\`, one proposal per changed file of the run's mounted knowledge (\`files\`, each named by its path in \`${KNOWLEDGE_TARGET}\`). A run proposes at most ${KNOWLEDGE_PROPOSALS_PER_RUN} times, and one waits per document at a time. Answers the proposal (201), or each file's outcome.`,
      security: personOrRun,
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: resolver(KbProposeBody, 'input') },
          'multipart/form-data': { schema: resolver(KbProposeForm, 'input') },
        },
      },
      responses: {
        200: dataResponse(
          z.array(KbChangedResultSchema),
          "Each changed file's outcome.",
        ),
        201: dataResponse(KbProposedSchema, 'The proposal.'),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'Not exactly one of `doc`, `title` or changed files, or a field breaks its rules.',
        ),
        404: notFound,
        409: apiErrorResponse(
          409,
          'A proposal is pending for the document (`KNOWLEDGE_PROPOSAL_PENDING`), the same content was rejected (`KNOWLEDGE_PROPOSAL_REJECTED`), or the document is archived (`KNOWLEDGE_ARCHIVED`).',
        ),
        429: apiErrorResponse(
          429,
          'The run has proposed its limit (`KNOWLEDGE_PROPOSAL_LIMIT`).',
        ),
      },
      ...cliRoute({
        command: 'kb propose',
        flags: {
          content: { contentFile: true },
          ...project,
        },
        changedFiles: {
          flag: 'changed',
          field: 'files',
          dir: KNOWLEDGE_TARGET,
          manifest: MANIFEST_FILE,
          maxBytes: KNOWLEDGE_CONTENT_MAX,
          maxFiles: KNOWLEDGE_PROPOSALS_PER_RUN,
          accept: ['.md'],
          description: `Propose every file you changed or added in ${KNOWLEDGE_TARGET} (compared with its ${MANIFEST_FILE}).`,
        },
        action: KNOWLEDGE_PROPOSE,
        examples: [
          'kb propose --changed --reason "Learned while fixing the lists"',
          'kb propose --doc conventions --content-file ./kb.md --reason "..."',
          'kb propose --doc conventions --verify --reason "Still true"',
        ],
      }),
    }),
    async (c) => {
      const identity = caller(c);
      const type = c.req.header('content-type') ?? '';
      if (/^multipart\/form-data\b/iu.test(type)) {
        const { files, fields } = await proposalForm(c.req.raw);
        if (files.length > 0) {
          if (fields.doc?.trim() || fields.title?.trim())
            throw new KnowledgeError(
              400,
              'INVALID_ARGUMENT',
              'Give exactly one of --doc, --title or --changed.',
            );
          const { data, message } = await deps.views.proposeChanged(
            identity,
            fields,
            files,
          );
          return c.json({ data, meta: { message } });
        }
        return proposed(c, identity, fields);
      }
      let body: unknown;
      try {
        body = await c.req.json();
      } catch {
        body = undefined;
      }
      return proposed(c, identity, parseApiInput(KbProposeBody, body));
    },
  );

  async function proposed(
    c: Parameters<MiddlewareHandler>[0],
    identity: CallerIdentity,
    input: KbProposeInput,
  ): Promise<Response> {
    const { data, message } = await deps.views.propose(identity, input);
    return c.json({ data, meta: { message } }, 201);
  }

  routes.post(
    '/uploadTickets',
    propose,
    describeRoute({
      tags,
      summary: 'Propose a knowledge file',
      operationId: 'kbCreateUploadTicket',
      description: `A new file, or with \`doc\` a new version of a file, for someone who may edit to decide. Answers a one-time ticket: the file goes as the body of a \`POST\` to its \`url\` with its \`headers\` (\`knowledgeRedeemTicket\`), which answers the proposal; its text is extracted once accepted. A run proposes at most ${KNOWLEDGE_PROPOSALS_PER_RUN} times.`,
      security: personOrRun,
      responses: {
        201: dataResponse(KbUploadTicketSchema, 'The ticket.'),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The document is not a file, a field breaks its rules, or the application stores no files (`FILES_UNAVAILABLE`).',
        ),
        404: notFound,
      },
      ...cliRoute({
        command: 'kb upload',
        flags: project,
        ticketUpload: {
          flag: 'file',
          maxBytes: deps.knowledge().files.maxBytes,
          description: 'The file to propose.',
        },
        action: KNOWLEDGE_PROPOSE,
        examples: [
          'kb upload --file ./runbook.pdf --parent runbooks --reason "The on-call runbook"',
          'kb upload --doc queue-md --file ./queue.md --reason "The runbook changed"',
        ],
      }),
    }),
    apiValidator('json', KbUploadBody),
    async (c) => {
      const ticket = await deps.views.ticket(caller(c), c.req.valid('json'));
      const root = deps.basePath().replace(/\/+$/u, '');
      const data: KbUploadTicket = {
        url: `${root}/api/knowledge/tickets/${encodeURIComponent(ticket.id)}/redeem`,
        method: 'POST',
        headers: { authorization: `Bearer ${ticket.token}` },
        message: 'Proposed the file; someone who may edit decides.',
      };
      return c.json({ data }, 201);
    },
  );

  return routes;
}

export const knowledgeViewRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes(({ container }) => {
    if (
      !container.has(authenticationToken) ||
      !container.has(authorizationToken) ||
      !container.has(knowledgeToken) ||
      !container.has(studioKnowledgeViewsToken)
    )
      return new Hono();
    const router = new Hono();
    router.route(
      '/kb',
      createKnowledgeViewRoutes({
        ...container.resolve(studioKnowledgeViewsToken),
        knowledge: () => container.resolve(knowledgeToken),
        authenticate: container
          .resolve(authenticationToken)
          .required({ scopedKeys: true }) as MiddlewareHandler,
        authorize: container.resolve(authorizationToken).middleware(),
      }),
    );
    return router;
  });

/**
 * The people-facing API, mounted at `/api/agents`: agents and their brief preview, variables, the skill library, runs,
 * usage and prices; runners and registration tokens are in `runners/admin.ts`. Every route is behind the guard the
 * route contribution passes (a signed-in user and their authorization context); `scoped` lets a scoped API key
 * through as well, on the routes whose every operation is a settings check its scope narrows. What each caller may do
 * is checked here, before the route's input is validated.
 *
 * - `agents.agents` read/manage: agents, skills, and every run. An agent's variables need manage.
 * - The `agents.agents` `edit` action's level: at `all`, changing every agent and editing every skill; at `related`,
 *   the agents the caller owns and the skills they created (their settings, skills and variables; archiving, restoring
 *   and deleting the agent; saving and restoring the skill). Such an editor does not hand an agent to another owner,
 *   and adds to it only business actions they hold themselves. Every edit names the revision it was made against;
 *   the agent's history (`GET /agents/:agentId/history`) is for anyone who reads agents.
 * - Reading agents is enough to see every runner (to pick where an agent runs).
 * - The variables and default skills of a working directory or of a scope the application registers: the scope's kind
 *   decides who reads them and who changes them (`agents.scopes`).
 * - Anyone signed in sees, cancels and retries the runs they started or own, and may ask for a fresh working
 *   directory on a subject they started work on.
 * - The vocabulary (what the application calls subjects and scopes) is labels only: anyone signed in reads it, for the
 *   run panels on the application's pages.
 * - Model services and the catalog of their models: `online/routes.ts`.
 * - Model prices, each of a source (a model service for chat, a coding tool for work), and the coding tools paid by
 *   subscription: `agents.prices` read shows them with the models coding tools reported, manage replaces them.
 * - Usage (`GET /agents/usage`, `shared/reports.ts`): what runs used and cost, for whoever the usage page's grant
 *   opens it to; every run for a reader of agents, otherwise the runs the caller started or owns, on subjects they may
 *   see; and `GET /agents/usage/models`, the model calls made outside runs (embeddings, reranking, utility texts), for
 *   a reader of agents. Other reports are the application's: it reads them from `agents.reporting`.
 */
import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  cliRoute,
  dataResponse,
  describeRoute,
  emptyResponse,
  listResponse,
  type ApiResponseObject,
  type OpenAPIV3_1,
} from '@nocobase/app-server/router';
import type { Context, Hono, MiddlewareHandler } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { z } from 'zod';

import { policyAllowsAgent } from '@nocobase/agent-protocol';
import {
  reaches,
  type BusinessKey,
  type Page,
  type Scope,
  type SettingsAction,
  type SettingsItem,
} from '../../shared/access.js';
import type { AgentSummary, Agent } from '../../shared/agents.js';
import { offersEntry } from '../../shared/models.js';
import { SKILL_UPLOAD_MAX_BYTES, type SkillView } from '../../shared/skills.js';
import { CONVERSATION_SUBJECT } from '../../shared/conversations.js';
import type { Run } from '../../shared/runs.js';
import type { VariableScope } from '../../shared/variables.js';
import type { AgentsVocabulary } from '../../shared/vocabulary.js';
import type { Agents } from '../composition.js';
import { AgentInputSchema, AgentPatchSchema } from '../core/agents/index.js';
import { ModelPricesSchema } from '../core/reports/index.js';
import { countActive, hasTool, onlineEntryOf } from '../core/runs/index.js';
import {
  SkillIdsSchema,
  SkillImportSchema,
  SkillInputSchema,
  SkillSaveSchema,
} from '../core/skills/index.js';
import { forbidden, invalid, notFound } from '../kernel/errors.js';
import {
  decodePageToken,
  domainRouter,
  encodePageToken,
} from '../kernel/http.js';
import { WORKDIR_TITLE } from '../kernel/scopes.js';
import { tags } from './openapi.js';
import {
  AgentActionOptionSchema,
  AgentChangeSchema,
  AgentHistoryQuery,
  AgentListQuery,
  AgentParams,
  AgentSchema,
  AgentSummarySchema,
  BriefPreviewSchema,
  ModelUsageReportSchema,
  PageTokenMetaSchema,
  PricesSchema,
  RunBriefSchema,
  RunDetailSchema,
  RunEventItemSchema,
  RunSchema,
  SeqPageMetaSchema,
  SkillArchiveQuery,
  SkillAttachmentsSchema,
  SkillDetailSchema,
  SkillFileQuery,
  SkillUploadSchema,
  SkillSchema,
  SkillVersionDetailSchema,
  SkillVersionSchema,
  SkillViewSchema,
  UsageReportSchema,
  UserRefSchema,
  VariableAuditSchema,
  VariableSchema,
  VariableValueSchema,
  VocabularySchema,
  AuditListQuery,
  ModelUsageQuery,
  PreviewBriefQuery,
  RunEventsQuery,
  RunListQuery,
  RunParams,
  ScopeParams,
  SkillParams,
  SkillRestoreInput,
  SkillVersionParams,
  UsageQuerySchema,
  VariableParams,
  VariableValueInput,
  WorkspaceParams,
} from './schemas.js';

/** A multipart body of one file, as `file`. */
const skillUploadBody: OpenAPIV3_1.RequestBodyObject = {
  required: true,
  content: {
    'multipart/form-data': {
      schema: {
        type: 'object',
        required: ['file'],
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'The file, or a zip to import.',
          },
        },
      },
    },
  },
};

/** Room for the multipart envelope around one file. */
const ENVELOPE = 64 * 1024;

/** `filename*` per RFC 5987, so any name survives; the plain `filename` is an ASCII fallback. */
function attachmentDisposition(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7e]|["\\]/gu, '_') || 'file';
  const encoded = encodeURIComponent(filename).replace(
    /['()*]/gu,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

const notFoundAs = (what: string): ApiResponseObject =>
  apiErrorResponse(
    404,
    `${what} does not exist, or the caller may not see it.`,
  );
const revisionConflict = (what: string): ApiResponseObject =>
  apiErrorResponse(
    409,
    `The ${what} changed since \`expectedRevision\` (\`REVISION_CONFLICT\`, \`metadata.revision\` the current one).`,
  );

/** Who is asking, what the settings items allow them, and how far their business actions reach. */
export interface AdminCaller {
  readonly userId: string;
  can(item: SettingsItem, action: SettingsAction): Promise<boolean>;
  /** Whether a page grant (`PAGES`) opens the page for the caller. */
  opens(page: Page): Promise<boolean>;
  scope(key: BusinessKey): Promise<Scope>;
  /** Set when a run's token authenticated the request: the subject the run works on. */
  readonly run?: {
    readonly subjectKind: string;
    readonly subjectId: string;
  } | null;
}

export interface AdminEnv {
  Variables: { caller: AdminCaller };
}

function caller(context: Context<AdminEnv>): AdminCaller {
  return context.get('caller');
}

async function requireCan(
  context: Context<AdminEnv>,
  item: SettingsItem,
  action: SettingsAction,
): Promise<AdminCaller> {
  const who = caller(context);
  if (!(await who.can(item, action)))
    throw forbidden(`This needs ${item} ${action} permission.`);
  return who;
}

/**
 * Whether the caller may change a record of `agents.agents/edit` related to `relatedTo` (an agent's owner, a skill's
 * creator): managers of agents and `all` change every one, a set of users the ones related to them.
 */
async function mayEdit(
  who: AdminCaller,
  relatedTo: string | null,
): Promise<boolean> {
  if (await who.can('agents.agents', 'manage')) return true;
  return reaches(await who.scope('agents.agents/edit'), relatedTo);
}

function involves(run: Run, userId: string): boolean {
  return run.actorUserId === userId || run.ownerUserId === userId;
}

const RunPosition = z.object({ createdAt: z.string(), id: z.string() });
const AuditPosition = z.object({ at: z.string(), id: z.string() });
const ChangePosition = z.object({
  createdAt: z.string(),
  revision: z.number(),
  id: z.string(),
});

/**
 * `guard` authenticates the request and sets `caller`; `scoped` does too, and lets a scoped API key through. The route
 * contribution passes the real ones, tests a fake.
 */
export function createAdminRoutes(
  services: Agents,
  guard: MiddlewareHandler<AdminEnv>,
  scoped: MiddlewareHandler<AdminEnv> = guard,
): Hono<AdminEnv> {
  const router = domainRouter<AdminEnv>();

  /** Lets the request through when the caller holds `action` on `item`. */
  const can =
    (item: SettingsItem, action: SettingsAction): MiddlewareHandler<AdminEnv> =>
    async (context, next) => {
      await requireCan(context, item, action);
      await next();
    };

  /** The run, if the caller may see it (404 otherwise, as if it did not exist). */
  const visibleRun = async (
    context: Context<AdminEnv>,
    action: SettingsAction,
  ): Promise<Run> => {
    const who = caller(context);
    const run = await services.runs.get(context.req.param('runId') ?? '');
    if (involves(run, who.userId)) return run;
    // A private subject's runs (a conversation) belong to the people they involve, whatever the caller manages.
    if (isPrivate(run)) throw notFound('Run');
    if (await who.can('agents.agents', action)) return run;
    if (action === 'manage' && (await who.can('agents.agents', 'read')))
      throw forbidden('This needs agents.agents manage permission.');
    throw notFound('Run');
  };

  const isPrivate = (run: Run): boolean =>
    services.subjects.get(run.subject.kind)?.private === true;

  const nameOf = async (userId: string): Promise<string> =>
    (await services.people.names(services.tx.read(), [userId])).get(userId) ??
    userId;

  /** The agents with what the list shows about their runs and runners, and whether the caller may change each. */
  const summarize = async (
    who: AdminCaller,
    agents: readonly Agent[],
  ): Promise<AgentSummary[]> => {
    const conn = services.tx.read();
    const online = await services.runners.online(conn);
    const owners = await services.people.names(
      conn,
      agents.map((agent) => agent.ownerUserId),
    );
    const catalog = await services.online.gateway.catalog();
    const result: AgentSummary[] = [];
    for (const agent of agents)
      result.push({
        ...agent,
        ownerName: owners.get(agent.ownerUserId) ?? null,
        activeRuns: await countActive(conn, 'agentId', agent.id),
        // An online agent runs here: "online" while the service of its first entry offers its model.
        onlineRunners:
          agent.type === 'online'
            ? Number(
                offersEntry(
                  catalog,
                  onlineEntryOf(agent, undefined, catalog.defaultModel ?? null),
                ),
              )
            : online.filter(
                (runner) =>
                  hasTool(runner, agent) &&
                  policyAllowsAgent(runner.policy, agent) &&
                  (agent.runnerIds.length === 0 ||
                    agent.runnerIds.includes(runner.id)),
              ).length,
        canEdit: await mayEdit(who, agent.ownerUserId),
        canCopy: services.agents.mayInvoke(agent, who.userId),
      });
    return result;
  };

  /** Only a caller who may change the agent of the path goes on: 404 when they may not read it, 403 when not change it. */
  const editableAgent: MiddlewareHandler<AdminEnv> = async (context, next) => {
    const who = caller(context);
    const agent = await services.agents.get(context.req.param('agentId') ?? '');
    if (!(await mayEdit(who, agent.ownerUserId))) {
      if (!(await who.can('agents.agents', 'read'))) throw notFound('Agent');
      throw forbidden(
        'Only its owner (with the related level of agents.agents edit) or a manager of agents may change this agent.',
      );
    }
    await next();
  };

  /** Only a caller who may edit the skill of the path goes on: 404 when they may not read it, 403 when not edit it. */
  const editableSkill: MiddlewareHandler<AdminEnv> = async (context, next) => {
    const who = caller(context);
    const skill = await services.skills.get(context.req.param('skillId') ?? '');
    if (!(await mayEdit(who, skill.createdById))) {
      if (!(await who.can('agents.agents', 'read'))) throw notFound('Skill');
      throw forbidden(
        'Only its creator (with the related level of agents.agents edit) or a manager of agents may edit this skill.',
      );
    }
    await next();
  };

  /**
   * The scope of a variables or skills path, with what the caller may do there (404 when they may not see it).
   * `withAgent`: an agent's own may be named (variables; an agent's skills are its own field).
   */
  const scopeRights = async (
    context: Context<AdminEnv>,
    withAgent: boolean,
  ): Promise<{
    readonly scope: VariableScope;
    readonly scopeId: string;
    readonly manage: boolean;
  }> => {
    const scope = context.req.param('scopeKind') ?? '';
    const scopeId = context.req.param('scopeId') ?? '';
    const allowed = services.scopes
      .keys()
      .filter((key) => withAgent || key !== 'agent');
    if (!allowed.includes(scope) || !scopeId) throw notFound('Scope');
    const who = caller(context);
    if (scope === 'agent') {
      const agent = await services.agents.get(scopeId);
      const manage = await mayEdit(who, agent.ownerUserId);
      if (!manage && !(await who.can('agents.agents', 'read')))
        throw notFound('Agent');
      return { scope: 'agent', scopeId, manage };
    }
    const access = await services.scopes.access(scope, scopeId, who.userId);
    if (!access?.visible) throw notFound('Scope');
    return { scope, scopeId, manage: access.manage };
  };

  /** Reads the scope of the path into `target`; with `manage`, only a caller who may change it goes on. */
  const scopeOf =
    (withAgent: boolean, manage: boolean): MiddlewareHandler<ScopedEnv> =>
    async (context, next) => {
      const target = await scopeRights(
        context as unknown as Context<AdminEnv>,
        withAgent,
      );
      if (manage && !target.manage) throw forbidden('You may not change this.');
      context.set('target', target);
      await next();
    };

  // The business actions an agent may be configured with.
  router.get(
    '/actions',
    guard,
    can('agents.agents', 'read'),
    describeRoute({
      tags,
      summary: 'List the business actions an agent may be given',
      operationId: 'agentsListActions',
      ...cliRoute({
        command: 'agent action list',
        columns: ['key', 'group', 'defaultOn', 'grantable', 'types'],
      }),
      description:
        'As the application offers them. Needs `agents.agents` read.',
      responses: {
        200: listResponse(AgentActionOptionSchema),
        ...apiErrorResponses,
      },
    }),
    (context) => {
      const data = services.actions.list();
      return context.json({ data, meta: { total: data.length } });
    },
  );

  // What the application calls the subjects runs work on and the scopes of variables and skills.
  router.get(
    '/vocabulary',
    guard,
    describeRoute({
      tags,
      summary: 'Get the agents vocabulary',
      operationId: 'agentsGetVocabulary',
      // UI-only: the labels the run panels show.
      ...cliRoute(false),
      description:
        'What the application calls the subjects runs work on, the scopes of variables and skills, and the places conversations start from. Labels only: anyone signed in reads it.',
      responses: {
        200: dataResponse(VocabularySchema),
        ...apiErrorResponses,
      },
    }),
    (context) => {
      const registered = services.scopes.list();
      const vocabulary: AgentsVocabulary = {
        subjects: services.subjects.list().map((binding) => ({
          kind: binding.kind,
          title: binding.title ?? null,
          groupTitle: binding.groupTitle ?? null,
          path: binding.path ?? null,
          groupPath: binding.groupPath ?? null,
          triggers: binding.triggers ?? {},
          preview: binding.preview !== undefined,
        })),
        sources: services.conversations.sources
          .list()
          .map((source) => ({ key: source.key, title: source.title })),
        scopes: [
          ...registered.map((kind) => ({
            key: kind.key,
            title: kind.title,
            description: kind.description ?? null,
          })),
          ...(registered.some((kind) => kind.key === 'workdir')
            ? []
            : [{ key: 'workdir', title: WORKDIR_TITLE, description: null }]),
        ],
      };
      return context.json({ data: vocabulary });
    },
  );

  // People to pick from: the directory, every active person (a picker shows them all).
  router.get(
    '/users',
    guard,
    can('agents.agents', 'read'),
    describeRoute({
      tags,
      summary: 'List the people agents can be given to',
      operationId: 'agentsListUsers',
      // UI-only: the people picker.
      ...cliRoute(false),
      description:
        'Every active person in the directory, for pickers. Needs `agents.agents` read.',
      responses: { 200: listResponse(UserRefSchema), ...apiErrorResponses },
    }),
    async (context) => {
      const data = await services.people.list(services.tx.read());
      return context.json({ data, meta: { total: data.length } });
    },
  );

  // Variables of an agent, a working directory, or a scope the application registers.
  const scopedRouter = router as unknown as Hono<ScopedEnv>;
  const variableParam = apiValidator('param', VariableParams);
  const scopeParam = apiValidator('param', ScopeParams);
  const scopeAccess =
    "The scope kind (`agent`, `workdir` or one the application registers, see the vocabulary) decides who may read and change it; an agent's own needs edit rights on the agent.";
  const noScope = notFoundAs('The scope');
  scopedRouter.get(
    '/variables/:scopeKind/:scopeId',
    guard as unknown as MiddlewareHandler<ScopedEnv>,
    scopeOf(true, false),
    describeRoute({
      tags,
      summary: "List a scope's variables",
      operationId: 'agentsListVariables',
      ...cliRoute({
        command: 'variable list',
        flags: {
          scopeKind: {
            name: 'kind',
            description:
              'The scope kind: `agent`, `workdir`, or one the application registers.',
          },
          scopeId: {
            name: 'scope',
            description:
              'The scope: an agent id, a working directory id, or the id the application gives.',
          },
        },
        columns: ['name', 'updatedByName', 'updatedAt'],
        examples: ['variable list agent <agent>'],
      }),
      description: `Names and who changed them, never values. ${scopeAccess}`,
      responses: {
        200: listResponse(VariableSchema),
        404: noScope,
        ...apiErrorResponses,
      },
    }),
    scopeParam,
    async (context) => {
      const data = await services.variables.list(context.get('target'));
      return context.json({ data, meta: { total: data.length } });
    },
  );
  scopedRouter.get(
    '/variables/:scopeKind/:scopeId/audits',
    guard as unknown as MiddlewareHandler<ScopedEnv>,
    scopeOf(true, true),
    describeRoute({
      tags,
      summary: "List a scope's variable audit",
      operationId: 'agentsListVariableAudits',
      ...cliRoute({
        command: 'variable audit list',
        flags: {
          scopeKind: {
            name: 'kind',
            description:
              'The scope kind: `agent`, `workdir`, or one the application registers.',
          },
          scopeId: {
            name: 'scope',
            description:
              'The scope: an agent id, a working directory id, or the id the application gives.',
          },
          pageSize: { name: 'limit' },
        },
        columns: ['at', 'action', 'names', 'userName', 'runId'],
      }),
      description: `Who set, deleted, revealed or received the scope's variables, newest first. Needs the right to change the scope. ${scopeAccess}`,
      responses: {
        200: listResponse(VariableAuditSchema, PageTokenMetaSchema),
        404: noScope,
        ...apiErrorResponses,
      },
    }),
    scopeParam,
    apiValidator('query', AuditListQuery),
    async (context) => {
      const { pageSize, pageToken } = context.req.valid('query');
      const rows = await services.variables.audits(
        context.get('target'),
        pageSize + 1,
        pageToken === undefined
          ? undefined
          : decodePageToken(pageToken, AuditPosition),
      );
      const data = rows.slice(0, pageSize);
      const last = data.at(-1);
      return context.json({
        data,
        meta:
          rows.length > pageSize && last
            ? { nextPageToken: encodePageToken({ at: last.at, id: last.id }) }
            : {},
      });
    },
  );
  scopedRouter.post(
    '/variables/:scopeKind/:scopeId/reveal',
    guard as unknown as MiddlewareHandler<ScopedEnv>,
    scopeOf(true, true),
    describeRoute({
      tags,
      summary: "Reveal a scope's variable values",
      operationId: 'agentsRevealVariables',
      ...cliRoute({
        command: 'variable reveal',
        flags: {
          scopeKind: {
            name: 'kind',
            description:
              'The scope kind: `agent`, `workdir`, or one the application registers.',
          },
          scopeId: {
            name: 'scope',
            description:
              'The scope: an agent id, a working directory id, or the id the application gives.',
          },
        },
        confirm:
          'Show every value of this scope? The reveal is recorded in its audit.',
      }),
      description: `Every value of the scope, recorded in its audit as revealed by the caller. Needs the right to change the scope. ${scopeAccess}`,
      responses: {
        200: dataResponse(z.array(VariableValueSchema)),
        404: noScope,
        ...apiErrorResponses,
      },
    }),
    scopeParam,
    async (context) =>
      context.json({
        data: await services.variables.reveal(
          context.get('target'),
          caller(context as unknown as Context<AdminEnv>).userId,
        ),
      }),
  );
  scopedRouter.put(
    '/variables/:scopeKind/:scopeId/:variableName',
    guard as unknown as MiddlewareHandler<ScopedEnv>,
    scopeOf(true, true),
    describeRoute({
      tags,
      summary: 'Set a variable',
      operationId: 'agentsSetVariable',
      ...cliRoute({
        command: 'variable set',
        flags: {
          scopeKind: {
            name: 'kind',
            description:
              'The scope kind: `agent`, `workdir`, or one the application registers.',
          },
          scopeId: {
            name: 'scope',
            description:
              'The scope: an agent id, a working directory id, or the id the application gives.',
          },
          variableName: { name: 'name' },
          value: {
            prompt: true,
            contentFile: true,
            description:
              'The value; stored encrypted and never shown again. Asked for when left out.',
          },
        },
        examples: [
          'variable set agent <agent> NPM_TOKEN --value-file token.txt',
        ],
      }),
      description: `Creates or replaces the variable; the value is encrypted at rest and never answered. Needs the right to change the scope. ${scopeAccess}`,
      responses: {
        200: dataResponse(VariableSchema.nullable()),
        404: noScope,
        ...apiErrorResponses,
      },
    }),
    variableParam,
    apiValidator('json', VariableValueInput),
    async (context) => {
      const target = context.get('target');
      const { variableName } = context.req.valid('param');
      await services.variables.set(
        target,
        variableName,
        context.req.valid('json').value,
        caller(context as unknown as Context<AdminEnv>).userId,
      );
      const variable = (await services.variables.list(target)).find(
        (item) => item.name === variableName,
      );
      return context.json({ data: variable ?? null });
    },
  );
  scopedRouter.delete(
    '/variables/:scopeKind/:scopeId/:variableName',
    guard as unknown as MiddlewareHandler<ScopedEnv>,
    scopeOf(true, true),
    describeRoute({
      tags,
      summary: 'Delete a variable',
      operationId: 'agentsDeleteVariable',
      ...cliRoute({
        command: 'variable delete',
        flags: {
          scopeKind: {
            name: 'kind',
            description:
              'The scope kind: `agent`, `workdir`, or one the application registers.',
          },
          scopeId: {
            name: 'scope',
            description:
              'The scope: an agent id, a working directory id, or the id the application gives.',
          },
          variableName: { name: 'name' },
        },
        confirm: 'Delete this variable?',
      }),
      description: `Needs the right to change the scope. ${scopeAccess}`,
      responses: {
        204: emptyResponse(),
        404: noScope,
        ...apiErrorResponses,
      },
    }),
    variableParam,
    async (context) => {
      await services.variables.remove(
        context.get('target'),
        context.req.valid('param').variableName,
        caller(context as unknown as Context<AdminEnv>).userId,
      );
      return context.body(null, 204);
    },
  );

  // Skills.
  /** The skill with whether the caller may edit it. */
  const viewOf = async (
    context: Context<AdminEnv>,
    id: string,
  ): Promise<SkillView> => {
    const skill = await services.skills.get(id);
    return {
      ...skill,
      canEdit: await mayEdit(caller(context), skill.createdById),
    };
  };
  const skillParam = apiValidator('param', SkillParams);
  const versionParam = apiValidator('param', SkillVersionParams);
  const noSkill = notFoundAs('The skill');
  router.get(
    '/skills',
    scoped,
    can('agents.agents', 'read'),
    describeRoute({
      tags,
      summary: 'List skills',
      operationId: 'agentsListSkills',
      ...cliRoute({
        command: 'skill list',
        columns: ['id', 'name', 'version', 'agentCount', 'updatedAt'],
      }),
      description: 'The skill library. Needs `agents.agents` read.',
      responses: { 200: listResponse(SkillSchema), ...apiErrorResponses },
    }),
    async (context) => {
      const data = await services.skills.list();
      return context.json({ data, meta: { total: data.length } });
    },
  );
  router.post(
    '/skills',
    scoped,
    can('agents.agents', 'manage'),
    describeRoute({
      tags,
      summary: 'Create a skill',
      operationId: 'agentsCreateSkill',
      ...cliRoute({
        command: 'skill create',
        bodyFile: 'file',
        flags: { content: { contentFile: true } },
        examples: ['skill create --content-file SKILL.md'],
      }),
      description:
        "Named and described by its SKILL.md front matter, checked against the Agent Skills specification: a problem answers 400 with each one's `field` and `reason` in `metadata.problems` (`taken` when another skill has the name). Needs `agents.agents` manage.",
      responses: {
        201: dataResponse(SkillDetailSchema, 'Created.'),
        ...apiErrorResponses,
      },
    }),
    apiValidator('json', SkillInputSchema),
    async (context) =>
      context.json(
        {
          data: await services.skills.create(
            caller(context).userId,
            context.req.valid('json'),
          ),
        },
        201,
      ),
  );
  router.get(
    '/skills/:skillId',
    scoped,
    can('agents.agents', 'read'),
    describeRoute({
      tags,
      summary: 'Get a skill',
      operationId: 'agentsGetSkill',
      ...cliRoute({
        command: 'skill get',
        args: ['skillId'],
        flags: { skillId: { name: 'skill' } },
      }),
      description:
        'Its body, files and where it is attached, with whether the caller may edit it. Needs `agents.agents` read.',
      responses: {
        200: dataResponse(SkillViewSchema),
        404: noSkill,
        ...apiErrorResponses,
      },
    }),
    skillParam,
    async (context) =>
      context.json({
        data: await viewOf(context, context.req.valid('param').skillId),
      }),
  );
  router.patch(
    '/skills/:skillId',
    scoped,
    editableSkill,
    describeRoute({
      tags,
      summary: 'Save a skill',
      operationId: 'agentsSaveSkill',
      ...cliRoute({
        command: 'skill update',
        args: ['skillId'],
        flags: {
          skillId: { name: 'skill' },
          content: { contentFile: true },
          expectedRevision: { name: 'revision' },
        },
        bodyFile: 'file',
        examples: ['skill update <skill> --content-file SKILL.md --revision 3'],
      }),
      description:
        "Saves a new version with everything it holds, its SKILL.md checked as a new skill's is; a new front matter `name` renames the skill. Its creator (at the related level of `agents.agents` edit) or a manager of agents may.",
      responses: {
        200: dataResponse(SkillViewSchema),
        404: noSkill,
        409: revisionConflict('skill'),
        ...apiErrorResponses,
      },
    }),
    skillParam,
    apiValidator('json', SkillSaveSchema),
    async (context) => {
      const saved = await services.skills.save(
        context.req.valid('param').skillId,
        caller(context).userId,
        context.req.valid('json'),
      );
      return context.json({ data: await viewOf(context, saved.id) });
    },
  );
  router.delete(
    '/skills/:skillId',
    scoped,
    can('agents.agents', 'manage'),
    describeRoute({
      tags,
      summary: 'Delete a skill',
      operationId: 'agentsDeleteSkill',
      ...cliRoute({
        command: 'skill delete',
        args: ['skillId'],
        flags: { skillId: { name: 'skill' } },
        confirm: 'Delete this skill from the library?',
      }),
      description: 'Needs `agents.agents` manage.',
      responses: {
        204: emptyResponse(),
        404: noSkill,
        ...apiErrorResponses,
      },
    }),
    skillParam,
    async (context) => {
      await services.skills.remove(context.req.valid('param').skillId);
      return context.body(null, 204);
    },
  );
  router.get(
    '/skills/:skillId/versions',
    scoped,
    can('agents.agents', 'read'),
    describeRoute({
      tags,
      summary: "List a skill's versions",
      operationId: 'agentsListSkillVersions',
      ...cliRoute({
        command: 'skill version list',
        args: ['skillId'],
        flags: { skillId: { name: 'skill' } },
        columns: ['version', 'name', 'note', 'createdByName', 'createdAt'],
      }),
      description: 'Newest first. Needs `agents.agents` read.',
      responses: {
        200: listResponse(SkillVersionSchema),
        404: noSkill,
        ...apiErrorResponses,
      },
    }),
    skillParam,
    async (context) => {
      const data = await services.skills.versions(
        context.req.valid('param').skillId,
      );
      return context.json({ data, meta: { total: data.length } });
    },
  );
  router.get(
    '/skills/:skillId/versions/:version',
    scoped,
    can('agents.agents', 'read'),
    describeRoute({
      tags,
      summary: 'Get a skill version',
      operationId: 'agentsGetSkillVersion',
      ...cliRoute({
        command: 'skill version get',
        args: ['skillId', 'version'],
        flags: { skillId: { name: 'skill' } },
      }),
      description: 'Needs `agents.agents` read.',
      responses: {
        200: dataResponse(SkillVersionDetailSchema),
        404: notFoundAs('The skill or version'),
        ...apiErrorResponses,
      },
    }),
    versionParam,
    async (context) => {
      const { skillId, version } = context.req.valid('param');
      return context.json({
        data: await services.skills.version(skillId, version),
      });
    },
  );
  router.post(
    '/skills/:skillId/versions/:version/restore',
    scoped,
    editableSkill,
    describeRoute({
      tags,
      summary: 'Restore a skill version',
      operationId: 'agentsRestoreSkillVersion',
      ...cliRoute({
        command: 'skill version restore',
        args: ['skillId', 'version'],
        flags: {
          skillId: { name: 'skill' },
          expectedRevision: { name: 'revision' },
        },
        confirm: 'Make this version the current one?',
      }),
      description:
        'The version becomes current again, as a new version. Its creator (at the related level of `agents.agents` edit) or a manager of agents may.',
      responses: {
        200: dataResponse(SkillViewSchema),
        400: apiErrorResponse(
          400,
          'The version is the current one (`SKILL_VERSION_CURRENT`).',
        ),
        404: notFoundAs('The skill or version'),
        409: revisionConflict('skill'),
        ...apiErrorResponses,
      },
    }),
    versionParam,
    apiValidator('json', SkillRestoreInput),
    async (context) => {
      const { skillId, version } = context.req.valid('param');
      const restored = await services.skills.restore(
        skillId,
        version,
        caller(context).userId,
        context.req.valid('json').expectedRevision,
      );
      return context.json({ data: await viewOf(context, restored.id) });
    },
  );

  /** A caller who may create skills, or edit some: who may store their files. */
  const mayUpload: MiddlewareHandler<AdminEnv> = async (context, next) => {
    const who = caller(context);
    if (
      !(await who.can('agents.agents', 'manage')) &&
      (await who.scope('agents.agents/edit')) === 'none'
    )
      throw forbidden(
        'This needs agents.agents manage, or the edit action on skills.',
      );
    await next();
  };
  router.post(
    '/skills/uploads',
    scoped,
    mayUpload,
    describeRoute({
      tags,
      summary: 'Upload a skill file or archive',
      operationId: 'agentsUploadSkillFile',
      ...cliRoute({ command: 'skill upload' }),
      description: `Stores one file (the \`file\` field of a multipart body, at most ${SKILL_UPLOAD_MAX_BYTES} bytes) once per content and answers its SHA-256 as \`id\`: a save names it as a file's \`hash\`, an import as its \`archive\`. What no version names is deleted after an hour. Needs \`agents.agents\` manage, or the edit action on skills.`,
      requestBody: skillUploadBody,
      responses: {
        201: dataResponse(SkillUploadSchema, 'Stored.'),
        413: apiErrorResponse(
          413,
          `The file is over ${SKILL_UPLOAD_MAX_BYTES} bytes (\`FILE_TOO_LARGE\`).`,
        ),
        ...apiErrorResponses,
      },
    }),
    bodyLimit({
      maxSize: SKILL_UPLOAD_MAX_BYTES + ENVELOPE,
      onError: () => {
        throw invalid(`An upload is at most ${SKILL_UPLOAD_MAX_BYTES} bytes.`, {
          reason: 'FILE_TOO_LARGE',
          maxBytes: SKILL_UPLOAD_MAX_BYTES,
        });
      },
    }),
    async (context) => {
      let body: Record<string, unknown>;
      try {
        body = await context.req.parseBody();
      } catch {
        throw invalid('Send one file as multipart form data, as `file`.');
      }
      const file = body.file;
      if (!(file instanceof File))
        throw invalid('Send one file as multipart form data, as `file`.');
      return context.json(
        {
          data: await services.skills.upload(
            new Uint8Array(await file.arrayBuffer()),
          ),
        },
        201,
      );
    },
  );
  router.post(
    '/skills/import',
    scoped,
    describeRoute({
      tags,
      summary: 'Import a skill',
      operationId: 'agentsImportSkill',
      ...cliRoute({
        command: 'skill import',
        flags: {
          skillId: {
            name: 'skill',
            description:
              'Import as a new version of this skill instead of a new skill.',
          },
          expectedRevision: { name: 'revision' },
        },
        uploads: {
          archive: {
            upload: 'agentsUploadSkillFile',
            field: 'archive',
            maxBytes: SKILL_UPLOAD_MAX_BYTES,
            description:
              "The zip: SKILL.md (with `name` and `description` in its front matter) at its root or in a single top folder named as `name`, beside the skill's files.",
          },
        },
        examples: [
          'skill import --archive release-notes.zip',
          'skill import --archive release-notes.zip --skill <skill> --revision 3',
        ],
      }),
      description:
        'A zip in the Agent Skills layout, uploaded first (`agentsUploadSkillFile`): a new skill named by its front matter, or with `skillId` a new version of that skill, checked as a save is. Executable files stay executable. A new skill needs `agents.agents` manage; a new version, the right to edit the skill.',
      responses: {
        201: dataResponse(SkillViewSchema, 'Imported.'),
        404: noSkill,
        409: revisionConflict('skill'),
        ...apiErrorResponses,
      },
    }),
    apiValidator('json', SkillImportSchema),
    async (context) => {
      const input = context.req.valid('json');
      const who = caller(context);
      if (input.skillId) {
        const skill = await services.skills.get(input.skillId);
        if (!(await mayEdit(who, skill.createdById))) {
          if (!(await who.can('agents.agents', 'read')))
            throw notFound('Skill');
          throw forbidden(
            'Only its creator (with the related level of agents.agents edit) or a manager of agents may edit this skill.',
          );
        }
      } else await requireCan(context, 'agents.agents', 'manage');
      const imported = await services.skills.importArchive(who.userId, input);
      return context.json({ data: await viewOf(context, imported.id) }, 201);
    },
  );
  router.get(
    '/skills/:skillId/archive',
    scoped,
    can('agents.agents', 'read'),
    describeRoute({
      tags,
      summary: 'Export a skill',
      operationId: 'agentsExportSkill',
      ...cliRoute({
        command: 'skill export',
        args: ['skillId'],
        flags: { skillId: { name: 'skill' } },
        examples: ['skill export <skill> --version 2 --out skills/'],
      }),
      description:
        'A version (the current one by default) as a zip in the Agent Skills layout: `<slug>/SKILL.md` with its front matter, and its files, executable ones with the executable bit. Needs `agents.agents` read.',
      responses: {
        200: {
          description: 'The zip.',
          headers: {
            'Content-Disposition': {
              description: '`attachment`, named `<slug>-v<version>.zip`.',
              schema: { type: 'string' },
            },
          },
          content: {
            'application/zip': {
              schema: { type: 'string', format: 'binary' },
            },
          },
        },
        404: notFoundAs('The skill or version'),
        ...apiErrorResponses,
      },
    }),
    skillParam,
    apiValidator('query', SkillArchiveQuery),
    async (context) => {
      const archive = await services.skills.exportArchive(
        context.req.valid('param').skillId,
        context.req.valid('query').version,
      );
      return new Response(Buffer.from(archive.bytes), {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Length': String(archive.bytes.length),
          'Content-Disposition': attachmentDisposition(archive.filename),
        },
      });
    },
  );
  router.get(
    '/skills/:skillId/versions/:version/file',
    scoped,
    can('agents.agents', 'read'),
    describeRoute({
      tags,
      summary: 'Download a skill file',
      operationId: 'agentsGetSkillFile',
      ...cliRoute({
        command: 'skill file get',
        args: ['skillId', 'version'],
        flags: { skillId: { name: 'skill' } },
        examples: ['skill file get <skill> 3 --path assets/logo.png --out .'],
      }),
      description:
        "One file of a version, as it is stored, named by its path's last part. Needs `agents.agents` read.",
      responses: {
        200: {
          description: 'The file.',
          content: {
            'application/octet-stream': {
              schema: { type: 'string', format: 'binary' },
            },
          },
        },
        404: notFoundAs('The skill, version or file'),
        ...apiErrorResponses,
      },
    }),
    versionParam,
    apiValidator('query', SkillFileQuery),
    async (context) => {
      const { skillId, version } = context.req.valid('param');
      const file = await services.skills.file(
        skillId,
        version,
        context.req.valid('query').path,
      );
      return new Response(Buffer.from(file.bytes), {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': String(file.bytes.length),
          'Content-Disposition': attachmentDisposition(
            file.path.split('/').pop() ?? 'file',
          ),
        },
      });
    },
  );

  // Default skills of a working directory, or of a scope the application registers.
  scopedRouter.get(
    '/skillAttachments/:scopeKind/:scopeId',
    guard as unknown as MiddlewareHandler<ScopedEnv>,
    scopeOf(false, false),
    describeRoute({
      tags,
      summary: "Get a scope's default skills",
      operationId: 'agentsGetSkillAttachments',
      ...cliRoute({
        command: 'skill attachment get',
        flags: {
          scopeKind: {
            name: 'kind',
            description:
              'The scope kind: `agent`, `workdir`, or one the application registers.',
          },
          scopeId: {
            name: 'scope',
            description:
              'The scope: an agent id, a working directory id, or the id the application gives.',
          },
        },
      }),
      description:
        "The skills every run working in the scope gets (a working directory, or a scope the application registers; an agent's own skills are its `skillIds`).",
      responses: {
        200: dataResponse(SkillAttachmentsSchema),
        404: noScope,
        ...apiErrorResponses,
      },
    }),
    scopeParam,
    async (context) =>
      context.json({
        data: {
          skillIds: await services.skills.attached(context.get('target')),
        },
      }),
  );
  scopedRouter.put(
    '/skillAttachments/:scopeKind/:scopeId',
    guard as unknown as MiddlewareHandler<ScopedEnv>,
    scopeOf(false, true),
    describeRoute({
      tags,
      summary: "Replace a scope's default skills",
      operationId: 'agentsReplaceSkillAttachments',
      ...cliRoute({
        command: 'skill attachment set',
        flags: {
          scopeKind: {
            name: 'kind',
            description:
              'The scope kind: `agent`, `workdir`, or one the application registers.',
          },
          scopeId: {
            name: 'scope',
            description:
              'The scope: an agent id, a working directory id, or the id the application gives.',
          },
          skillIds: { name: 'skills' },
        },
        examples: [
          'skill attachment set workdir <workdir> --skills <skill>,<skill>',
        ],
      }),
      description:
        'Makes `skillIds` the skills attached to the scope. Needs the right to change the scope.',
      responses: {
        200: dataResponse(SkillAttachmentsSchema),
        400: apiErrorResponse(
          400,
          'A skill id is unknown (`INVALID_ARGUMENT`).',
        ),
        404: noScope,
        ...apiErrorResponses,
      },
    }),
    scopeParam,
    apiValidator('json', SkillIdsSchema),
    async (context) =>
      context.json({
        data: {
          skillIds: await services.skills.attach(
            context.get('target'),
            context.req.valid('json').skillIds,
          ),
        },
      }),
  );

  // Runs.
  const runParam = apiValidator('param', RunParams);
  const noRun = notFoundAs('The run');
  const runVisibility =
    "The caller sees the runs they started or own, and every run but a private subject's (a conversation) with `agents.agents` read.";
  /** Only a caller who may see the run of the path (or, with `manage`, act on it) goes on. */
  const runAccess =
    (action: SettingsAction): MiddlewareHandler<AdminEnv> =>
    async (context, next) => {
      await visibleRun(context, action);
      await next();
    };
  router.get(
    '/runs',
    guard,
    describeRoute({
      tags,
      summary: 'List runs',
      operationId: 'agentsListRuns',
      ...cliRoute({
        command: 'run list',
        flags: {
          subjectId: { name: 'subject' },
          agentId: { name: 'agent' },
          pageSize: { name: 'limit' },
        },
        columns: [
          'id',
          'agentId',
          'subject.kind',
          'subject.id',
          'status',
          'createdAt',
        ],
        examples: ['run list --status failed', 'run list --agent <agent>'],
      }),
      description: `Newest first, a page at a time. ${runVisibility}`,
      responses: {
        200: listResponse(RunSchema, PageTokenMetaSchema),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', RunListQuery),
    async (context) => {
      const who = caller(context);
      const query = context.req.valid('query');
      const all = await who.can('agents.agents', 'read');
      const runs = await services.runs.list({
        ...(query.subjectKind ? { subjectKind: query.subjectKind } : {}),
        ...(query.subjectId ? { subjectId: query.subjectId } : {}),
        ...(query.agentId ? { agentId: query.agentId } : {}),
        ...(query.status ? { status: query.status } : {}),
        limit: query.pageSize + 1,
        ...(query.pageToken === undefined
          ? {}
          : { cursor: decodePageToken(query.pageToken, RunPosition) }),
        ...(all ? {} : { involvingUserId: who.userId }),
      });
      const page = runs.slice(0, query.pageSize);
      const last = page.at(-1);
      return context.json({
        data: page.filter(
          (run) => involves(run, who.userId) || !isPrivate(run),
        ),
        meta:
          runs.length > query.pageSize && last
            ? {
                nextPageToken: encodePageToken({
                  createdAt: last.createdAt,
                  id: last.id,
                }),
              }
            : {},
      });
    },
  );
  router.get(
    '/runs/:runId',
    guard,
    runAccess('read'),
    describeRoute({
      tags,
      summary: 'Get a run',
      operationId: 'agentsGetRun',
      ...cliRoute({
        command: 'run get',
        args: ['runId'],
        flags: { runId: { name: 'run' } },
      }),
      description: `With its inputs, repositories and usage. ${runVisibility}`,
      responses: {
        200: dataResponse(RunDetailSchema),
        404: noRun,
        ...apiErrorResponses,
      },
    }),
    runParam,
    async (context) =>
      context.json({
        data: await services.runs.detail(context.req.valid('param').runId),
      }),
  );
  router.get(
    '/runs/:runId/brief',
    guard,
    runAccess('read'),
    describeRoute({
      tags,
      summary: "Get a run's brief",
      operationId: 'agentsGetRunBrief',
      ...cliRoute({
        command: 'run brief',
        args: ['runId'],
        flags: { runId: { name: 'run' } },
      }),
      description: `The brief the run's latest attempt was given. ${runVisibility}`,
      responses: {
        200: dataResponse(RunBriefSchema),
        404: notFoundAs('The run or its brief'),
        ...apiErrorResponses,
      },
    }),
    runParam,
    async (context) =>
      context.json({
        data: await services.runs.brief(context.req.valid('param').runId),
      }),
  );
  router.get(
    '/runs/:runId/events',
    guard,
    runAccess('read'),
    describeRoute({
      tags,
      summary: "List a run's events",
      operationId: 'agentsListRunEvents',
      ...cliRoute({
        command: 'run events',
        args: ['runId'],
        flags: { runId: { name: 'run' }, pageSize: { name: 'limit' } },
        columns: ['seq', 'at', 'type', 'tool'],
      }),
      description: `The run's transcript as JSON pages, in order: a page holds the events after \`after\` (a \`seq\`), up to \`pageSize\`. Not a stream: to follow a run, ask again with \`after\` set to \`meta.lastSeq\`, when the run's realtime topic announces a change. ${runVisibility}`,
      responses: {
        200: listResponse(RunEventItemSchema, SeqPageMetaSchema),
        404: noRun,
        ...apiErrorResponses,
      },
    }),
    runParam,
    apiValidator('query', RunEventsQuery),
    async (context) => {
      const { after, pageSize, pageToken } = context.req.valid('query');
      const from =
        pageToken === undefined
          ? (after ?? 0)
          : decodePageToken(pageToken, z.number().int().min(0));
      const page = await services.runs.events(
        context.req.valid('param').runId,
        from,
        pageSize,
      );
      return context.json({
        data: page.events,
        meta: {
          lastSeq: page.lastSeq,
          ...(page.events.length === pageSize
            ? { nextPageToken: encodePageToken(page.lastSeq) }
            : {}),
        },
      });
    },
  );
  router.post(
    '/runs/:runId/cancel',
    guard,
    runAccess('manage'),
    describeRoute({
      tags,
      summary: 'Cancel a run',
      operationId: 'agentsCancelRun',
      ...cliRoute({
        command: 'run cancel',
        args: ['runId'],
        flags: { runId: { name: 'run' } },
        confirm: 'Cancel this run?',
      }),
      description:
        'A queued run is cancelled at once; a held one is asked to stop. Whoever started or owns it, or a manager of agents, may.',
      responses: {
        200: dataResponse(RunSchema),
        400: apiErrorResponse(400, 'The run has ended (`RUN_NOT_ACTIVE`).'),
        404: noRun,
        ...apiErrorResponses,
      },
    }),
    runParam,
    async (context) =>
      context.json({
        data: await services.runs.cancel(
          context.req.valid('param').runId,
          caller(context).userId,
        ),
      }),
  );
  router.post(
    '/runs/:runId/retry',
    guard,
    runAccess('manage'),
    describeRoute({
      tags,
      summary: 'Retry a run',
      operationId: 'agentsRetryRun',
      ...cliRoute({
        command: 'run retry',
        args: ['runId'],
        flags: { runId: { name: 'run' } },
      }),
      description:
        'Queues a new run with the same input. Whoever started or owns it, or a manager of agents, may.',
      responses: {
        200: dataResponse(RunSchema),
        400: apiErrorResponse(
          400,
          'The run cannot be retried (`RUN_NOT_RETRYABLE`).',
        ),
        404: noRun,
        ...apiErrorResponses,
      },
    }),
    runParam,
    async (context) =>
      context.json({
        data: await services.runs.retry(
          context.req.valid('param').runId,
          caller(context).userId,
        ),
      }),
  );

  // What runs used and cost, behind the usage page's grant.
  const usagePage: MiddlewareHandler<AdminEnv> = async (context, next) => {
    if (!(await caller(context).opens('usage')))
      throw forbidden('This needs the usage page.');
    await next();
  };
  router.get(
    '/usage',
    scoped,
    usagePage,
    describeRoute({
      tags,
      summary: 'Get the usage report',
      operationId: 'agentsGetUsage',
      ...cliRoute({
        command: 'run usage',
        flags: {
          groupId: { name: 'group' },
          agentId: { name: 'agent' },
          userId: { name: 'user' },
        },
        examples: ['run usage --group-by agent --from 2026-09-01'],
      }),
      description:
        'What runs used and cost, grouped by `groupBy`, over `from` to `to` (UTC days, the last 30 by default, at most 366). Needs the usage page; every run for a reader of agents, otherwise the runs the caller started or owns.',
      responses: {
        200: dataResponse(UsageReportSchema),
        400: apiErrorResponse(
          400,
          '`from` or `to` is not a date, they are out of order, or they span more than 366 days (`INVALID_ARGUMENT`).',
        ),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', UsageQuerySchema),
    async (context) => {
      const who = caller(context);
      const { groupBy, ...filters } = context.req.valid('query');
      return context.json({
        data: await services.reporting.usage(
          {
            userId: who.userId,
            allRuns: await who.can('agents.agents', 'read'),
          },
          {
            ...Object.fromEntries(
              Object.entries(filters).filter(([, value]) => value),
            ),
            groupBy,
          },
        ),
      });
    },
  );

  // What model calls outside runs used (embeddings, reranking, utility texts), behind the usage page's grant.
  router.get(
    '/usage/models',
    scoped,
    usagePage,
    describeRoute({
      tags,
      summary: 'Get the model usage outside runs',
      operationId: 'agentsGetModelUsage',
      ...cliRoute({ command: 'model usage' }),
      description:
        'The model calls made outside runs (embeddings, reranking, utility texts), over `from` to `to`. Needs the usage page; rows only for a reader of agents.',
      responses: {
        200: dataResponse(ModelUsageReportSchema),
        400: apiErrorResponse(
          400,
          '`from` or `to` is not a date, they are out of order, or they span more than 366 days (`INVALID_ARGUMENT`).',
        ),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', ModelUsageQuery),
    async (context) => {
      const who = caller(context);
      const range = Object.fromEntries(
        Object.entries(context.req.valid('query')).filter(([, value]) => value),
      );
      return context.json({
        data: await services.reporting.modelUsage(
          {
            userId: who.userId,
            allRuns: await who.can('agents.agents', 'read'),
          },
          range,
        ),
      });
    },
  );

  // Model prices.
  router.get(
    '/prices',
    scoped,
    can('agents.prices', 'read'),
    describeRoute({
      tags,
      summary: 'Get the model prices',
      operationId: 'agentsGetPrices',
      ...cliRoute({ command: 'model price get' }),
      description:
        'The prices reports estimate costs from, the coding tools paid by subscription, and the models coding tools reported. Needs `agents.prices` read.',
      responses: { 200: dataResponse(PricesSchema), ...apiErrorResponses },
    }),
    async (context) => context.json({ data: await services.prices.list() }),
  );
  router.put(
    '/prices',
    scoped,
    can('agents.prices', 'manage'),
    describeRoute({
      tags,
      summary: 'Replace the model prices',
      operationId: 'agentsReplacePrices',
      ...cliRoute({
        command: 'model price set',
        bodyFile: 'file',
        confirm: 'Replace the whole price table and the subscriptions?',
        examples: ['model price set --file prices.json'],
      }),
      description:
        'Replaces the whole price table and the subscriptions; a model may appear once per source. Needs `agents.prices` manage.',
      responses: {
        200: dataResponse(PricesSchema),
        400: apiErrorResponse(
          400,
          'A model is priced twice for one source (`INVALID_ARGUMENT`).',
        ),
        ...apiErrorResponses,
      },
    }),
    apiValidator('json', ModelPricesSchema),
    async (context) =>
      context.json({
        data: await services.prices.replace(context.req.valid('json')),
      }),
  );

  // A fresh working directory for the next run on a subject.
  router.post(
    '/workspaces/:subjectKind/:subjectId/reset',
    guard,
    async (context, next) => {
      const who = caller(context);
      if (!(await who.can('agents.agents', 'manage'))) {
        const mine = await services.runs.list({
          subjectKind: context.req.param('subjectKind') ?? '',
          subjectId: context.req.param('subjectId') ?? '',
          involvingUserId: who.userId,
          limit: 1,
        });
        if (mine.length === 0)
          throw forbidden(
            'Only someone who started work on it, or a manager of agents, may reset its working directory.',
          );
      }
      await next();
    },
    describeRoute({
      tags,
      summary: 'Reset the working directory of a subject',
      operationId: 'agentsResetWorkspace',
      ...cliRoute({
        command: 'run workspace reset',
        flags: {
          subjectKind: { name: 'kind' },
          subjectId: { name: 'subject' },
        },
        confirm:
          'Start the next run on this subject in a fresh working directory?',
      }),
      description:
        'The next run on the subject starts in a fresh working directory. Whoever started work on it, or a manager of agents, may.',
      responses: { 204: emptyResponse(), ...apiErrorResponses },
    }),
    apiValidator('param', WorkspaceParams),
    async (context) => {
      const { subjectKind, subjectId } = context.req.valid('param');
      await services.runs.resetWorkspace(
        { kind: subjectKind, id: subjectId },
        caller(context).userId,
      );
      return context.body(null, 204);
    },
  );

  // Agents, last: `/:agentId` would otherwise shadow the fixed segments above.
  const agentParam = apiValidator('param', AgentParams);
  const noAgent = notFoundAs('The agent');
  const editAccess =
    'Its owner (at the related level of `agents.agents` edit) or a manager of agents may.';
  router.get(
    '/',
    scoped,
    can('agents.agents', 'read'),
    describeRoute({
      tags,
      summary: 'List agents',
      operationId: 'agentsListAgents',
      ...cliRoute({
        command: 'agent list-all',
        flags: { includeArchived: { name: 'archived' } },
        columns: [
          'id',
          'name',
          'type',
          'ownerName',
          'activeRuns',
          'archivedAt',
        ],
        examples: ['agent list-all --archived'],
      }),
      description:
        'With what the list shows about their runs and runners, and whether the caller may change each. Needs `agents.agents` read.',
      responses: {
        200: listResponse(AgentSummarySchema),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', AgentListQuery),
    async (context) => {
      const data = await summarize(
        caller(context),
        await services.agents.list({
          includeArchived: context.req.valid('query').includeArchived === true,
        }),
      );
      return context.json({ data, meta: { total: data.length } });
    },
  );
  router.post(
    '/',
    scoped,
    can('agents.agents', 'manage'),
    describeRoute({
      tags,
      summary: 'Create an agent',
      operationId: 'agentsCreateAgent',
      ...cliRoute({
        command: 'agent create',
        bodyFile: 'file',
        flags: {
          instructions: { contentFile: true },
          modelEntries: { name: 'models' },
          ownerUserId: { name: 'owner' },
          runnerIds: { name: 'runtimes' },
          skillIds: { name: 'skills' },
          userIds: { name: 'users' },
        },
        examples: [
          'agent create --name Coder --models \'[{"tool":"claude"},{"tool":"codex","model":"gpt-5"}]\'',
          'agent create --name PM --type online --models \'[{"modelService":"openai","model":"gpt-5"}]\'',
          'agent create --file agent.json',
        ],
      }),
      description:
        '`modelEntries` lists the tools and models it works with, in order (the first is its default): `{ tool, model? }` for a runner agent, `{ modelService, model }` for an online one. Needs `agents.agents` manage.',
      responses: {
        201: dataResponse(AgentSchema, 'Created.'),
        ...apiErrorResponses,
      },
    }),
    apiValidator('json', AgentInputSchema),
    async (context) =>
      context.json(
        {
          data: await services.agents.create(
            caller(context).userId,
            context.req.valid('json'),
          ),
        },
        201,
      ),
  );
  router.get(
    '/:agentId',
    scoped,
    can('agents.agents', 'read'),
    describeRoute({
      tags,
      summary: 'Get an agent',
      operationId: 'agentsGetAgent',
      ...cliRoute({
        command: 'agent get',
        args: ['agentId'],
        flags: { agentId: { name: 'agent' } },
      }),
      description: 'Needs `agents.agents` read.',
      responses: {
        200: dataResponse(AgentSummarySchema),
        404: noAgent,
        ...apiErrorResponses,
      },
    }),
    agentParam,
    async (context) => {
      const [agent] = await summarize(caller(context), [
        await services.agents.get(context.req.valid('param').agentId),
      ]);
      return context.json({ data: agent });
    },
  );
  router.get(
    '/:agentId/history',
    guard,
    can('agents.agents', 'read'),
    describeRoute({
      tags,
      summary: "List an agent's history",
      operationId: 'agentsListAgentHistory',
      ...cliRoute({
        command: 'agent history',
        args: ['agentId'],
        flags: {
          agentId: { name: 'agent' },
          afterRevision: { name: 'after' },
          pageSize: { name: 'limit' },
        },
        columns: ['revision', 'action', 'actorName', 'createdAt'],
      }),
      description:
        "The changes to the agent's configuration, newest first; `afterRevision` reads only those after a revision. A variable is named, never its value. Needs `agents.agents` read.",
      responses: {
        200: listResponse(AgentChangeSchema, PageTokenMetaSchema),
        404: noAgent,
        ...apiErrorResponses,
      },
    }),
    agentParam,
    apiValidator('query', AgentHistoryQuery),
    async (context) => {
      const { afterRevision, pageSize, pageToken } = context.req.valid('query');
      const rows = await services.agents.history(
        context.req.valid('param').agentId,
        {
          ...(afterRevision === undefined ? {} : { afterRevision }),
          limit: pageSize + 1,
          ...(pageToken === undefined
            ? {}
            : { cursor: decodePageToken(pageToken, ChangePosition) }),
        },
      );
      const data = rows.slice(0, pageSize);
      const last = data.at(-1);
      return context.json({
        data,
        meta:
          rows.length > pageSize && last
            ? {
                nextPageToken: encodePageToken({
                  createdAt: last.createdAt,
                  revision: last.revision,
                  id: last.id,
                }),
              }
            : {},
      });
    },
  );
  router.patch(
    '/:agentId',
    scoped,
    editableAgent,
    describeRoute({
      tags,
      summary: 'Update an agent',
      operationId: 'agentsUpdateAgent',
      ...cliRoute({
        command: 'agent update',
        args: ['agentId'],
        bodyFile: 'file',
        flags: {
          agentId: { name: 'agent' },
          instructions: { contentFile: true },
          modelEntries: { name: 'models' },
          ownerUserId: { name: 'owner' },
          runnerIds: { name: 'runtimes' },
          skillIds: { name: 'skills' },
          userIds: { name: 'users' },
          expectedRevision: { name: 'revision' },
        },
        examples: [
          'agent update <agent> --instructions-file notes.md --revision 4',
          'agent update <agent> --models \'[{"tool":"codex"},{"tool":"claude","model":"opus"}]\' --revision 4',
        ],
      }),
      description: `Changes the fields given, against \`expectedRevision\`. ${editAccess} Only a manager of agents may give it to another owner, and an owner adds only business actions they hold themselves.`,
      responses: {
        200: dataResponse(AgentSchema),
        404: noAgent,
        409: revisionConflict('agent'),
        ...apiErrorResponses,
      },
    }),
    agentParam,
    apiValidator('json', AgentPatchSchema),
    async (context) => {
      const who = caller(context);
      const agent = await services.agents.get(
        context.req.valid('param').agentId,
      );
      const patch = context.req.valid('json');
      if (!(await who.can('agents.agents', 'manage'))) {
        // Someone editing as the owner gives the agent only what they may grant themselves.
        if (
          patch.ownerUserId !== undefined &&
          patch.ownerUserId !== agent.ownerUserId
        )
          throw forbidden(
            'Only a manager of agents may give an agent to another owner.',
          );
        if (patch.actions !== undefined) {
          const held = await services.gate.allowed({
            kind: 'user',
            userId: who.userId,
            displayName: who.userId,
          });
          const beyond = patch.actions.filter(
            (action) => !agent.actions.includes(action) && !held.has(action),
          );
          if (beyond.length > 0)
            throw forbidden(
              `You may not give the agent business actions you do not hold yourself: ${beyond.join(', ')}.`,
            );
        }
      }
      return context.json({
        data: await services.agents.update(agent.id, who.userId, patch),
      });
    },
  );
  router.delete(
    '/:agentId',
    scoped,
    editableAgent,
    describeRoute({
      tags,
      summary: 'Delete an agent',
      operationId: 'agentsDeleteAgent',
      ...cliRoute({
        command: 'agent delete',
        args: ['agentId'],
        flags: { agentId: { name: 'agent' } },
        confirm: 'Delete this archived agent with its variables and history?',
      }),
      description: `Deletes an archived agent with no open runs, with its variables, skill attachments and history; its past runs stay. ${editAccess}`,
      responses: {
        204: emptyResponse(),
        400: apiErrorResponse(
          400,
          'The agent is not archived, or has open runs (`AGENT_NOT_ARCHIVED`, `AGENT_HAS_ACTIVE_RUNS`).',
        ),
        404: noAgent,
        ...apiErrorResponses,
      },
    }),
    agentParam,
    async (context) => {
      await services.agents.remove(
        context.req.valid('param').agentId,
        caller(context).userId,
      );
      return context.body(null, 204);
    },
  );
  router.post(
    '/:agentId/archive',
    scoped,
    editableAgent,
    describeRoute({
      tags,
      summary: 'Archive an agent',
      operationId: 'agentsArchiveAgent',
      ...cliRoute({
        command: 'agent archive',
        args: ['agentId'],
        flags: { agentId: { name: 'agent' } },
        confirm: 'Archive this agent? Its queued runs are withdrawn.',
      }),
      description: `An archived agent is not run: its queued runs are withdrawn. ${editAccess}`,
      responses: {
        200: dataResponse(AgentSchema),
        404: noAgent,
        ...apiErrorResponses,
      },
    }),
    agentParam,
    async (context) =>
      context.json({
        data: await services.agents.archive(
          context.req.valid('param').agentId,
          caller(context).userId,
        ),
      }),
  );
  router.post(
    '/:agentId/restore',
    scoped,
    editableAgent,
    describeRoute({
      tags,
      summary: 'Restore an archived agent',
      operationId: 'agentsRestoreAgent',
      ...cliRoute({
        command: 'agent restore',
        args: ['agentId'],
        flags: { agentId: { name: 'agent' } },
      }),
      description: editAccess,
      responses: {
        200: dataResponse(AgentSchema),
        404: noAgent,
        ...apiErrorResponses,
      },
    }),
    agentParam,
    async (context) =>
      context.json({
        data: await services.agents.restore(
          context.req.valid('param').agentId,
          caller(context).userId,
        ),
      }),
  );
  router.get(
    '/:agentId/previewBrief',
    guard,
    can('agents.agents', 'read'),
    describeRoute({
      tags,
      summary: "Preview an agent's full prompt",
      operationId: 'agentsPreviewAgentBrief',
      ...cliRoute({
        command: 'agent brief',
        args: ['agentId'],
        flags: { agentId: { name: 'agent' } },
        examples: [
          'agent brief <agent>',
          'agent brief <agent> --scenario conversation',
        ],
      }),
      description:
        "What a run of the agent would be sent now in a scenario, rendered on a made-up subject whose values are marked `[sample]`: the system prompt in one (the rules, the task, the context and, last, the agent's own prompt) and the first message. `scenario` is a subject kind that offers a sample (for example, `issue` or `conversation`), the application's first by default. Needs `agents.agents` read.",
      responses: {
        200: dataResponse(BriefPreviewSchema),
        400: apiErrorResponse(
          400,
          'The scenario offers no sample, or no scenario is given and none offers one (`INVALID_ARGUMENT`).',
        ),
        404: notFoundAs('The agent'),
        ...apiErrorResponses,
      },
    }),
    agentParam,
    apiValidator('query', PreviewBriefQuery),
    async (context) => {
      const who = caller(context);
      const query = context.req.valid('query');
      // The application's own kinds first: a conversation is previewed only when asked for.
      const offered = services.subjects
        .list()
        .filter((binding) => binding.preview);
      const scenario =
        query.scenario ??
        offered.find((binding) => binding.kind !== CONVERSATION_SUBJECT)
          ?.kind ??
        offered[0]?.kind;
      if (!scenario)
        throw invalid('scenario is required: no subject offers a preview.', {
          field: 'scenario',
        });
      return context.json({
        data: await services.briefs.preview(
          context.req.valid('param').agentId,
          scenario,
          { id: who.userId, name: await nameOf(who.userId) },
        ),
      });
    },
  );

  return router;
}

/** A route on the variables or skills of a scope, once `scopeOf` read it. */
interface ScopedEnv {
  Variables: {
    caller: AdminCaller;
    target: {
      readonly scope: VariableScope;
      readonly scopeId: string;
      readonly manage: boolean;
    };
  };
}

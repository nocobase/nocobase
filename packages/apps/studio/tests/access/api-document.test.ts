// @vitest-environment node
/**
 * The API document of Studio's access, inbox, agents, reports and knowledge search routes: every route declares itself
 * under the `Studio` tag with an operationId named after its first path segment, and the schemas convert cleanly.
 */
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { knowledgeToken } from '@nocobase/app-plugin-knowledge/server/tokens';
import {
  projectsAccessToken,
  projectsToken,
} from '@nocobase/app-plugin-projects/server/tokens';
import type { Application } from '@nocobase/app-server/application';
import {
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
  generateApiDocument,
  inspectApiRoutes,
  type ApiDocument,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono, type MiddlewareHandler } from 'hono';
import { beforeAll, describe, expect, it } from 'vitest';

import { accessRoutes } from '../../server/access/routes.js';
import { studioAccessToken } from '../../server/access/token.js';
import { studioAgentsRoutes } from '../../server/agents/routes.js';
import { inboxRoutes } from '../../server/inbox/routes.js';
import {
  studioInboxSourceToken,
  studioInboxToken,
} from '../../server/inbox/token.js';
import {
  studioKnowledgeSearchToken,
  knowledgeSearchRoutes,
} from '../../server/knowledge/search-routes.js';
import { reportsRoutes } from '../../server/reports/routes.js';
import { studioReportsToken } from '../../server/reports/token.js';

const pass: MiddlewareHandler = async (_context, next) => {
  await next();
};

/** Every service the routes need, as stubs: the routes are only built and inspected, never called. */
function application(): Application {
  const services = new Map<unknown, unknown>([
    [authenticationToken, { required: () => pass }],
    [authorizationToken, { middleware: () => pass }],
    [studioAccessToken, { roles: {} }],
    [studioInboxToken, {}],
    [studioInboxSourceToken, {}],
    [agentsToken, { runs: {} }],
    [projectsToken, {}],
    [projectsAccessToken, {}],
    [knowledgeToken, {}],
    [studioReportsToken, {}],
    [studioKnowledgeSearchToken, {}],
  ]);
  const container = {
    has: (token: unknown) => services.has(token),
    resolve: (token: unknown) => {
      if (!services.has(token)) throw new Error('not registered');
      return services.get(token);
    },
  };
  return { container } as unknown as Application;
}

const contributions: readonly AppApiRouteContribution<Application>[] = [
  accessRoutes,
  inboxRoutes,
  studioAgentsRoutes,
  reportsRoutes,
  knowledgeSearchRoutes,
];

const FIRST_SEGMENTS = [
  'access',
  'organizationKeys',
  'inbox',
  'organizeIntake',
  'intakeDrafts',
  'failedRuns',
  'designProposals',
  'agentBoard',
  'reports',
  'knowledgeSearch',
];

describe('Studio access, inbox, agents, reports and knowledge search API document', () => {
  let router: Hono;
  let document: ApiDocument;

  beforeAll(async () => {
    const app = application();
    router = new Hono();
    for (const contribution of contributions)
      router.route('/', await contribution.createRouter(app));
    document = await generateApiDocument(router, {
      info: { title: 'Studio', version: '0.0.0' },
    });
  });

  it('declares every route and hides none', () => {
    expect(findUndeclaredApiRoutes(router)).toEqual([]);
    const routes = inspectApiRoutes(router);
    expect(routes.filter((route) => route.hidden)).toEqual([]);
    expect(routes).toHaveLength(41);
  });

  it('converts every schema cleanly', () => {
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
  });

  it('tags every operation Studio, with a unique operationId named after its first path segment', () => {
    const operations = Object.entries(document.paths ?? {}).flatMap(
      ([path, item]) =>
        Object.values(item ?? {}).map((operation) => ({
          path,
          operation: operation as {
            tags?: string[];
            summary?: string;
            operationId?: string;
          },
        })),
    );
    expect(operations).toHaveLength(41);
    for (const { path, operation } of operations) {
      expect(operation.tags).toEqual(['Studio']);
      expect(operation.summary).toBeTruthy();
      const segment = path.split('/')[2];
      expect(FIRST_SEGMENTS).toContain(segment);
      expect(operation.operationId?.startsWith(segment ?? '')).toBe(true);
    }
    const ids = operations.map(({ operation }) => operation.operationId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(
      expect.arrayContaining([
        'accessListRoles',
        'accessGetCatalog',
        'organizationKeysRotateKey',
        'inboxListNotices',
        'inboxListItems',
        'organizeIntake',
        'intakeDraftsDeliver',
        'designProposalsSubmit',
        'reportsGetUsage',
        'failedRunsDecide',
        'designProposalsApprove',
        'agentBoardStartIssue',
        'reportsGetDashboard',
        'reportsGetAttention',
        'knowledgeSearchGetSettings',
      ]),
    );
  });

  it('keeps the organization keys to a signed-in session', () => {
    const list = document.paths?.['/api/organizationKeys']?.get;
    expect(list?.security).toEqual([{ cookieAuth: [] }]);
  });
});

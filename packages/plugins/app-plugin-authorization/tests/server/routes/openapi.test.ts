import type { DatabaseConnection } from '@nocobase/db';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  ApiDocsService,
  apiDocsToken,
  findUndeclaredApiRoutes,
  type ApiDocument,
} from '@nocobase/app-server/router';
import { ServiceContainer } from '@nocobase/service-provider';
import { describeRoute, emptyResponse } from '@nocobase/app-server/router';
import { describe, expect, it } from 'vitest';

import { Hono } from 'hono';

import {
  createRouteHandler,
  createSettingsRouter,
  documentAuthorizationRoutes,
} from '../../../server/extension/http.js';
import {
  AuthorizationProvider,
  createAppAuthorization,
  type AppAuthorization,
} from '../../../server/index.js';
import { mountedRouter } from '../../helpers/mounted-router.js';
import { testRulePlugin } from '../../helpers/rule-plugin.js';

/** Permission Sets need a connection to build their store; nothing here queries. */
const connection = { query: {} } as unknown as DatabaseConnection;

function operationIds(document: ApiDocument): string[] {
  return Object.values(document.paths ?? {})
    .flatMap((item) =>
      Object.values(item ?? {}).map(
        (operation) => (operation as { operationId?: string }).operationId,
      ),
    )
    .filter((id): id is string => id !== undefined)
    .sort();
}

const settingsOperationIds = [
  'authorizationAssignPermissionSet',
  'authorizationBatchDecideAccess',
  'authorizationCreatePermissionSet',
  'authorizationDecideAccess',
  'authorizationDeletePermissionSet',
  'authorizationGetConfiguredAccess',
  'authorizationGetPermissionSet',
  'authorizationListInspectorOptions',
  'authorizationListInspectorSubjects',
  'authorizationListPermissionSetAssignments',
  'authorizationListPermissionSetOptions',
  'authorizationListPermissionSetSubjects',
  'authorizationListPermissionSets',
  'authorizationResolveInspectorSubjects',
  'authorizationResolvePermissionSetSubjects',
  'authorizationRevokePermissionSetAssignment',
  'authorizationUpdatePermissionSet',
];

const ruleOperationIds = [
  'authorizationListSharingRulesOptions',
  'authorizationListSharingRulesRecords',
  'authorizationListSharingRulesSubjects',
  'authorizationResolveSharingRulesSubjects',
];

async function documentOf(
  authorization: AppAuthorization,
  warnings: string[] = [],
): Promise<ApiDocument> {
  const container = new ServiceContainer();
  const docs = new ApiDocsService();
  container.instance(apiDocsToken, docs);
  // Registers the authorization and authentication services, which the provider then reads.
  const mounted = await mountedRouter(authorization, { container });
  const provider = new AuthorizationProvider({
    container,
    config: { get: () => undefined },
  } as unknown as AppPluginApplication);
  await provider.boot();
  docs.attach({
    api: mounted,
    describe: () => ({ info: { title: 'Test', version: '1.0.0' } }),
    onWarning: (message) => warnings.push(message),
  });
  try {
    // `mountedRouter` mounts the routes under `/api` already, so the document is generated without a prefix of its own.
    return await generateApiDocumentFrom(docs);
  } finally {
    await provider.shutdown();
  }
}

/** The document as the service generates it, with the `/api` prefix the mounted router already carries removed. */
async function generateApiDocumentFrom(
  docs: ApiDocsService,
): Promise<ApiDocument> {
  const document = await docs.getDocument();
  const paths = Object.fromEntries(
    Object.entries(document.paths ?? {}).map(([path, item]) => [
      path.replace(/^\/api\/api\//, '/api/'),
      item,
    ]),
  );
  return { ...document, paths };
}

/**
 * The API documentation service with every `authz.routes` registration registered on it, as the provider does, and an
 * empty `/api` router: what it documents and reports is only what sits behind the dispatcher.
 */
function dispatcherDocs(
  authorization: AppAuthorization,
  warnings: string[] = [],
): ApiDocsService {
  const docs = new ApiDocsService();
  documentAuthorizationRoutes(docs, authorization.routes, (message) =>
    warnings.push(message),
  );
  docs.attach({
    api: new Hono(),
    describe: () => ({ info: { title: 'Test', version: '1.0.0' } }),
  });
  return docs;
}

describe('the API document', () => {
  it('declares the routes the application mounts and every route behind the dispatcher', async () => {
    const authorization = createAppAuthorization({
      connection,
      config: { plugins: [testRulePlugin('sharing-rules')] },
    });
    // The administration routes `mountedRouter` registers are part of the check once they are registered.
    const mounted = await mountedRouter(authorization);

    expect(authorization.routes.list()).toEqual([
      '/inspector',
      '/permissionSets',
      '/sharingRules',
    ]);
    expect(findUndeclaredApiRoutes(dispatcherDocs(authorization))).toEqual([]);
    expect(findUndeclaredApiRoutes(mounted, '')).toEqual([]);
  });

  it('documents each registered router at its full path below /api/authorization', async () => {
    const authorization = createAppAuthorization({
      connection,
      config: { plugins: [testRulePlugin('sharing-rules')] },
    });
    await mountedRouter(authorization);
    const warnings: string[] = [];
    const document = await dispatcherDocs(
      authorization,
      warnings,
    ).getDocument();

    expect(warnings).toEqual([]);
    expect(Object.keys(document.paths ?? {}).sort()).toEqual([
      '/api/authorization/inspector/batchDecide',
      '/api/authorization/inspector/configuredAccess',
      '/api/authorization/inspector/decide',
      '/api/authorization/inspector/options',
      '/api/authorization/inspector/subjects/{type}',
      '/api/authorization/inspector/subjects/{type}/resolve',
      '/api/authorization/permissionSets',
      '/api/authorization/permissionSets/options',
      '/api/authorization/permissionSets/subjects/{type}',
      '/api/authorization/permissionSets/subjects/{type}/resolve',
      '/api/authorization/permissionSets/{key}',
      '/api/authorization/permissionSets/{key}/assignments',
      '/api/authorization/permissionSets/{key}/assignments/{assignmentId}',
      '/api/authorization/sharingRules/options',
      '/api/authorization/sharingRules/records/{collection}',
      '/api/authorization/sharingRules/subjects/{type}',
      '/api/authorization/sharingRules/subjects/{type}/resolve',
    ]);
    expect(document.tags?.map((tag) => tag.name)).toEqual(['Authorization']);
  });

  it('reports a handler it cannot describe and a route the dispatcher never reaches', async () => {
    const authorization = createAppAuthorization({
      connection,
      config: { plugins: [] },
    });
    authorization.routes.add('/handWritten', () =>
      Promise.resolve(new Response(null, { status: 204 })),
    );
    const misplaced = createSettingsRouter();
    misplaced.post(
      '/elsewhere/reset',
      describeRoute({
        tags: ['Authorization'],
        summary: 'Reset',
        operationId: 'authorizationTestReset',
        responses: { 204: emptyResponse() },
      }),
      (context) => context.body(null, 204),
    );
    misplaced.get('/misplaced/undeclared', (context) =>
      context.body(null, 204),
    );
    authorization.routes.add('/misplaced', createRouteHandler(misplaced));

    const warnings: string[] = [];
    const docs = dispatcherDocs(authorization, warnings);

    expect(findUndeclaredApiRoutes(docs)).toEqual([
      { method: 'POST', path: '/api/authorization/elsewhere/reset' },
      { method: 'GET', path: '/api/authorization/misplaced/undeclared' },
      { method: 'ALL', path: '/api/authorization/handWritten' },
    ]);
    // The administration routes `createAppAuthorization` registers are documented as usual; the route the dispatcher
    // never reaches and the plain function are not.
    const document = await docs.getDocument();
    expect(
      Object.keys(document.paths ?? {}).filter(
        (path) =>
          !/^\/api\/authorization\/(inspector|permissionSets)\//.test(
            `${path}/`,
          ),
      ),
    ).toEqual([]);
    expect(warnings).toEqual([
      expect.stringContaining(
        '/api/authorization/handWritten is handled by a function createRouteHandler did not build',
      ),
      expect.stringContaining(
        'POST /api/authorization/elsewhere/reset is declared by the router registered under /api/authorization/misplaced',
      ),
    ]);
  });

  it('lists every operation once the provider registers the settings routes', async () => {
    const warnings: string[] = [];
    const document = await documentOf(
      createAppAuthorization({
        connection,
        config: { plugins: [testRulePlugin('sharing-rules')] },
      }),
      warnings,
    );

    // The fragment's components match the declared routes' own, so nothing is renamed or dropped.
    expect(warnings).toEqual([]);

    expect(operationIds(document)).toEqual(
      [
        'authorizationGetPermissions',
        ...settingsOperationIds,
        ...ruleOperationIds,
      ].sort(),
    );
    const create = document.paths?.['/api/authorization/permissionSets']?.post;
    expect(create?.tags).toEqual(['Authorization']);
    expect(Object.keys(create?.responses ?? {})).toEqual(
      expect.arrayContaining(['201', '400', '401', '403', '409']),
    );
    expect(create?.requestBody).toBeDefined();
    expect(
      document.paths?.['/api/authorization/permissionSets/{key}']?.get
        ?.parameters,
    ).toEqual([
      expect.objectContaining({ in: 'path', name: 'key', required: true }),
    ]);
    expect(document.components?.schemas).toHaveProperty(
      'AuthorizationPermissionSet',
    );
  });
});

import {
  authenticationToken,
  type Auth,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type Authorization,
} from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
  generateApiDocument,
  inspectApiRoutes,
  type ApiDocument,
  type OpenAPIV3_1,
} from '@nocobase/app-server/router';
import { ServiceContainer } from '@nocobase/service-provider';
import type { Hono } from 'hono';
import { beforeAll, describe, expect, it } from 'vitest';

import { apiRoutes } from '../server/routes/index.js';
import { hubServiceToken, type HubService } from '../server/tokens.js';

/** Every Hub route with its operationId. A route added without a declaration fails the first test below. */
const HUB_OPERATIONS: readonly (readonly [string, string, string])[] = [
  ['GET', '/hub/apiKeys/apps', 'hubListApiKeyApps'],
  ['GET', '/hub/apiKeys', 'hubListApiKeys'],
  ['POST', '/hub/apiKeys', 'hubCreateApiKey'],
  ['POST', '/hub/apiKeys/:keyId/reveal', 'hubRevealApiKey'],
  ['POST', '/hub/apiKeys/:keyId/disable', 'hubDisableApiKey'],
  ['DELETE', '/hub/apiKeys/:keyId', 'hubDeleteApiKey'],
  ['GET', '/hub/apps', 'hubListApps'],
  ['GET', '/hub/roles', 'hubListRoles'],
  ['POST', '/hub/apps', 'hubCreateApp'],
  ['GET', '/hub/apps/:appId', 'hubGetApp'],
  ['POST', '/hub/apps/:appId/releases/uploads', 'hubStartReleaseUpload'],
  ['GET', '/hub/apps/:appId/releases/uploads/:uploadId', 'hubGetReleaseUpload'],
  [
    'PATCH',
    '/hub/apps/:appId/releases/uploads/:uploadId',
    'hubAppendReleaseUpload',
  ],
  [
    'POST',
    '/hub/apps/:appId/releases/uploads/:uploadId/complete',
    'hubCompleteReleaseUpload',
  ],
  ['GET', '/hub/apps/:appId/releases', 'hubListReleases'],
  ['POST', '/hub/apps/:appId/releases', 'hubUploadRelease'],
  ['GET', '/hub/apps/:appId/releases/:releaseId', 'hubGetRelease'],
  [
    'GET',
    '/hub/apps/:appId/releases/:releaseId/configTemplate',
    'hubGetReleaseConfigTemplate',
  ],
  ['GET', '/hub/apps/:appId/config', 'hubGetAppConfig'],
  ['PUT', '/hub/apps/:appId/config', 'hubUpdateAppConfig'],
  ['PATCH', '/hub/apps/:appId/settings', 'hubUpdateAppSettings'],
  ['POST', '/hub/apps/:appId/deploy', 'hubDeployApp'],
  ['GET', '/hub/apps/:appId/deployments', 'hubListDeployments'],
  [
    'GET',
    '/hub/apps/:appId/deployments/:deploymentId/status',
    'hubGetDeploymentStatus',
  ],
  [
    'GET',
    '/hub/apps/:appId/deployments/:deploymentId/logs',
    'hubReadDeploymentLogs',
  ],
  ['GET', '/hub/apps/:appId/deployments/:deploymentId', 'hubGetDeployment'],
  ['GET', '/hub/apps/:appId/logs', 'hubReadAppLogs'],
  ['POST', '/hub/apps/:appId/rollback', 'hubRollbackApp'],
  ['POST', '/hub/apps/:appId/stop', 'hubStopApp'],
  ['POST', '/hub/apps/:appId/start', 'hubStartApp'],
  ['POST', '/hub/apps/:appId/restart', 'hubRestartApp'],
  ['POST', '/hub/apps/:appId/refresh', 'hubRefreshApp'],
  ['DELETE', '/hub/apps/:appId', 'hubDeleteApp'],
  ['GET', '/hub/host/status', 'hubGetHostStatus'],
];

/** Hono's `:name` path parameters, as the API document writes them. */
function documentPath(path: string): string {
  return `/api${path.replace(/:(\w+)/g, '{$1}')}`;
}

describe('Hub API document', () => {
  let router: Hono;
  let document: ApiDocument;

  beforeAll(async () => {
    router = await apiRoutes.createRouter(createApplication());
    document = await generateApiDocument(router, {
      info: { title: 'Hub', version: '0.0.0' },
    });
  });

  function operation(
    method: string,
    path: string,
  ): OpenAPIV3_1.OperationObject {
    const found =
      document.paths?.[documentPath(path)]?.[
        method.toLowerCase() as OpenAPIV3_1.HttpMethods
      ];
    if (!found) throw new Error(`${method} ${path} is not in the document`);
    return found;
  }

  function responseOf(
    method: string,
    path: string,
    status: string,
  ): OpenAPIV3_1.ResponseObject {
    return operation(method, path).responses?.[
      status
    ] as OpenAPIV3_1.ResponseObject;
  }

  it('declares every route, hides none, and the document resolves', () => {
    expect(findUndeclaredApiRoutes(router)).toEqual([]);
    const routes = inspectApiRoutes(router);
    expect(routes.filter((route) => route.hidden)).toEqual([]);
    expect(
      routes.map(({ method, path }) => `${method} ${path}`).sort(),
    ).toEqual(
      HUB_OPERATIONS.map(([method, path]) => `${method} /api${path}`).sort(),
    );
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
  });

  it('documents every route under the Hub tag with its unique hub operationId', () => {
    for (const [method, path, operationId] of HUB_OPERATIONS) {
      const documented = operation(method, path);
      expect(documented.tags).toEqual(['Hub']);
      expect(documented.summary).toBeTruthy();
      expect(documented.operationId).toBe(operationId);
    }
    expect(
      new Set(HUB_OPERATIONS.map(([, , operationId]) => operationId)).size,
    ).toBe(HUB_OPERATIONS.length);
  });

  it('documents the single Release upload as a binary body with its headers and refusals', () => {
    const upload = operation('POST', '/hub/apps/:appId/releases');
    expect(
      Object.keys(
        (upload.requestBody as OpenAPIV3_1.RequestBodyObject).content,
      ),
    ).toEqual(['application/gzip', 'application/octet-stream']);
    expect(upload.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ in: 'path', name: 'appId' }),
        expect.objectContaining({ in: 'header', name: 'x-artifact-sha256' }),
        expect.objectContaining({ in: 'header', name: 'idempotency-key' }),
      ]),
    );
    expect(upload.parameters).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'content-type' }),
      ]),
    );
    expect(Object.keys(upload.responses ?? {})).toEqual(
      expect.arrayContaining([
        '201',
        '400',
        '401',
        '403',
        '404',
        '409',
        '413',
        '415',
      ]),
    );
    expect(
      responseOf('POST', '/hub/apps/:appId/releases', '201').content?.[
        'application/json'
      ],
    ).toBeDefined();
  });

  it('documents a chunk append with its required headers and the offset conflict', () => {
    const append = operation(
      'PATCH',
      '/hub/apps/:appId/releases/uploads/:uploadId',
    );
    expect(
      Object.keys(
        (append.requestBody as OpenAPIV3_1.RequestBodyObject).content,
      ),
    ).toEqual(['application/octet-stream']);
    expect(append.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          in: 'header',
          name: 'upload-offset',
          required: true,
        }),
        expect.objectContaining({
          in: 'header',
          name: 'content-length',
          required: true,
        }),
      ]),
    );
    const conflict = responseOf(
      'PATCH',
      '/hub/apps/:appId/releases/uploads/:uploadId',
      '409',
    );
    expect(conflict.description).toContain('UPLOAD_OFFSET_MISMATCH');
    expect(conflict.description).toContain('error.metadata.offset');
    expect(Object.keys(append.responses ?? {})).toEqual(
      expect.arrayContaining(['200', '404', '409', '413', '415']),
    );
  });

  it('documents a deployment as accepted asynchronously, and logs as a token-paged feed', () => {
    expect(
      Object.keys(operation('POST', '/hub/apps/:appId/deploy').responses ?? {}),
    ).toEqual(expect.arrayContaining(['202', '409']));
    expect(
      operation('POST', '/hub/apps/:appId/deploy').responses,
    ).not.toHaveProperty('200');
    expect(
      operation('POST', '/hub/apps/:appId/rollback').responses,
    ).toHaveProperty('202');

    const logs = operation('GET', '/hub/apps/:appId/logs');
    expect(logs.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ in: 'query', name: 'pageToken' }),
        expect.objectContaining({ in: 'query', name: 'level' }),
      ]),
    );
    const schema = responseOf('GET', '/hub/apps/:appId/logs', '200').content?.[
      'application/json'
    ]?.schema as OpenAPIV3_1.SchemaObject;
    expect(schema.properties?.meta).toEqual({
      $ref: '#/components/schemas/HubLogMeta',
    });
    expect(document.components?.schemas?.HubLogMeta).toMatchObject({
      required: expect.arrayContaining(['nextPageToken', 'hasMore', 'reset']),
    });
  });

  it('describes responses with shared components', () => {
    expect(document.components?.schemas).toEqual(
      expect.objectContaining({
        HubApp: expect.any(Object),
        HubAppSummary: expect.any(Object),
        HubBuildTarget: expect.any(Object),
        HubRelease: expect.any(Object),
        HubUploadedRelease: expect.any(Object),
        HubReleaseUpload: expect.any(Object),
        HubReleaseUploadStart: expect.any(Object),
        HubDeployment: expect.any(Object),
        HubDeploymentListItem: expect.any(Object),
        HubConfig: expect.any(Object),
        HubApiKey: expect.any(Object),
        HubHostStatus: expect.any(Object),
        HubLogEntry: expect.any(Object),
      }),
    );
    // A Date travels as an RFC 3339 string.
    const app = document.components?.schemas
      ?.HubApp as OpenAPIV3_1.SchemaObject;
    const identity = app.properties?.app as OpenAPIV3_1.SchemaObject;
    expect(identity.properties?.updatedAt).toMatchObject({
      type: 'string',
      format: 'date-time',
    });
  });
});

function createApplication(): AppPluginApplication {
  const container = new ServiceContainer();
  container.instance(authenticationToken, {
    required: () => async (_context, next) => next(),
  } as Auth);
  container.instance(authorizationToken, {
    permissionSets: { list: () => Promise.resolve([]) },
    middleware: () => async (_context, next) => next(),
  } as unknown as Authorization);
  container.instance(hubServiceToken, {} as HubService);
  return {
    appName: 'hub',
    publicBasePath: '',
    config: {} as AppPluginApplication['config'],
    container,
    paths: {} as AppPluginApplication['paths'],
  };
}

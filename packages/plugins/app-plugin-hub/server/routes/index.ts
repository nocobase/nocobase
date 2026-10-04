import { HUB_RELEASE_ACTIONS } from '../../shared/permissions.js';
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { loggingToken } from '@nocobase/app-server/logging';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  apiErrorHandler,
  defineApiRoutes,
  parseApiInput,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono, type Context, type MiddlewareHandler } from 'hono';
import { validator } from 'hono/validator';
import type { z } from 'zod';
import type { Logger } from '@nocobase/logging';

import { hubApiKeyServiceToken } from '../services/api-keys.js';
import { HubError } from '../services/hub.js';
import { MAX_ARTIFACT_SIZE } from '../services/artifact-upload.js';
import { RELEASE_UPLOAD_CHUNK_SIZE } from '../services/release-uploads.js';
import { hubServiceToken, type HubReleaseRecord } from '../tokens.js';
import {
  appSummaryResponse,
  appDetailResponse,
  releaseResponse,
  releaseSummaryResponse,
  deploymentResponse,
  deploymentListResponse,
} from './responses.js';
import { HUB_PERMISSION_SET_KEYS } from '../authorization.js';
import {
  apiKeyForbidden,
  HubAppRoutes,
  publishingKeySecret,
  type HubApiKeyRequirement,
  type HubRouteEnv,
} from './api-key-access.js';
import {
  ApiKeyParams,
  AppParams,
  CreateApiKeyInput,
  CreateAppInput,
  DeployInput,
  DeploymentParams,
  IdempotencyHeaders,
  ListAppsQuery,
  LogQuery,
  PageQuery,
  ReleaseParams,
  ReleaseUploadHeaders,
  RollbackInput,
  StartUploadInput,
  UpdateConfigInput,
  UpdateSettingsInput,
  UploadChunkHeaders,
  UploadParams,
} from './schemas.js';

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container }) => {
    const router = new Hono();
    const routes = new Hono<HubRouteEnv>();
    const authentication = container.resolve(authenticationToken);
    const authorization = container.resolve(authorizationToken);
    const { permissionSets } = authorization;
    const hub = container.resolve(hubServiceToken);
    const apiKeys = () => container.resolve(hubApiKeyServiceToken);
    const securityLogger = container.has(loggingToken)
      ? container.resolve(loggingToken).getLogger('security')
      : undefined;

    // App routes declare their own access, including whether a publishing key may call them.
    const appRoutes = new HubAppRoutes({
      apiKeys,
      authorizationFor: (userId) =>
        authorization.for({
          principal: { type: 'user', id: userId },
          subjects: [{ type: 'authenticated', id: '*' }],
        }),
      ...(securityLogger ? { securityLogger } : {}),
    });
    /** The first middleware of a route on one App: the `hub.app` action a user needs, and what a publishing key needs. */
    const onApp = (
      action: string,
      apiKey?: HubApiKeyRequirement,
    ): MiddlewareHandler<HubRouteEnv> =>
      appRoutes.access({ action, ...(apiKey ? { apiKey } : {}) });
    /** The first middleware of a route on every App: the `hub.app` action a user needs on all of them. */
    const onHub =
      (action: string): MiddlewareHandler<HubRouteEnv> =>
      async (context, next) => {
        await requireHubAction(context, '*', action);
        await next();
      };

    // Publishing credentials never enter the Session authentication pipeline. A route accepts one only when it
    // declared a requirement through `appRoutes`, which then verifies the key against the App in its path.
    routes.use('*', async (context: Context<HubRouteEnv, string>, next) => {
      const credential = context.req.header('authorization');
      if (!credential) {
        if (
          /\/apiKeys(?:\/|$)/.test(context.req.path) &&
          context.req.header('x-api-key')
        )
          throw new HubError(
            'Sign in to manage publishing keys.',
            'SESSION_REQUIRED',
            'UNAUTHENTICATED',
          );
        return next();
      }
      if (!publishingKeySecret(credential))
        throw new HubError(
          'Invalid publishing credential.',
          'INVALID_API_KEY',
          'UNAUTHENTICATED',
        );
      if (!appRoutes.acceptsApiKey(context)) throw apiKeyForbidden();
      return next();
    });
    routes.use(
      '*',
      authentication.required({
        skip: (context) => Boolean(context.req.header('authorization')),
      }),
    );
    routes.use('*', async (context: Context<HubRouteEnv, string>, next) => {
      if (context.req.header('authorization')) return next();
      return authorization.middleware()(context, next);
    });
    // `HubError` is an `ApiError`, so the framework's handler renders it, authorization denials and validation errors
    // in the standard body even when the routes are mounted on a bare Hono, and rethrows anything else.
    routes.onError(apiErrorHandler);

    // Publishing keys. `apps` is a fixed segment, so it is registered before the `:keyId` routes.
    routes.get('/apiKeys/apps', noStore, async (context) => {
      const data = await apiKeys().appOptions(userIdOf(context));
      return context.json({ data, meta: { total: data.length } });
    });
    routes.get(
      '/apiKeys',
      onHub('manage-api-keys'),
      noStore,
      async (context) => {
        const data = await apiKeys().list(userIdOf(context));
        return context.json({ data, meta: { total: data.length } });
      },
    );
    routes.post(
      '/apiKeys',
      onHub('manage-api-keys'),
      noStore,
      validator('json', (value) => parseApiInput(CreateApiKeyInput, value)),
      async (context) => {
        const result = await apiKeys().create(
          userIdOf(context),
          context.req.valid('json'),
        );
        logSecurityEvent(securityLogger, context, 'hub.api-key.create', '*', {
          keyId: result.key.id,
        });
        return context.json({ data: result }, 201);
      },
    );
    routes.post(
      '/apiKeys/:keyId/reveal',
      onHub('manage-api-keys'),
      noStore,
      validator('param', (value) => parseApiInput(ApiKeyParams, value)),
      async (context) => {
        const { keyId } = context.req.valid('param');
        const secret = await apiKeys().reveal(keyId, userIdOf(context));
        logSecurityEvent(securityLogger, context, 'hub.api-key.reveal', '*', {
          keyId,
        });
        return context.json({ data: { secret } });
      },
    );
    routes.post(
      '/apiKeys/:keyId/disable',
      onHub('manage-api-keys'),
      noStore,
      validator('param', (value) => parseApiInput(ApiKeyParams, value)),
      async (context) => {
        const { keyId } = context.req.valid('param');
        const key = await apiKeys().disable(keyId, userIdOf(context));
        logSecurityEvent(securityLogger, context, 'hub.api-key.disable', '*', {
          keyId,
        });
        return context.json({ data: key });
      },
    );
    routes.delete(
      '/apiKeys/:keyId',
      onHub('manage-api-keys'),
      noStore,
      validator('param', (value) => parseApiInput(ApiKeyParams, value)),
      async (context) => {
        const { keyId } = context.req.valid('param');
        await apiKeys().remove(keyId, userIdOf(context));
        logSecurityEvent(securityLogger, context, 'hub.api-key.delete', '*', {
          keyId,
        });
        return context.body(null, 204);
      },
    );

    routes.get(
      '/apps',
      onHub('read'),
      validator('query', (value) => parseApiInput(ListAppsQuery, value)),
      async (context) => {
        const authz = context.get('authz');
        const allApps = await authz.can({
          resource: { type: 'hub.app', id: '*' },
          action: 'read-all',
        });
        const { q, page, pageSize } = context.req.valid('query');
        const result = await hub.listAppsPage({
          ...(allApps ? {} : { createdBy: authz.identity.principal.id }),
          ...(q === undefined ? {} : { search: q }),
          page,
          pageSize,
        });
        return context.json({
          data: result.items.map(appSummaryResponse),
          meta: pageMeta(result),
        });
      },
    );
    routes.get('/roles', async (context) => {
      await context.get('authz').require({
        resource: { type: 'user', id: '*' },
        action: 'read',
      });
      const sets = await permissionSets.list();
      const byKey = new Map(
        sets.map((permissionSet) => [permissionSet.key, permissionSet]),
      );
      const data = HUB_PERMISSION_SET_KEYS.flatMap((key) => {
        const permissionSet = byKey.get(key);
        return permissionSet
          ? [
              {
                key: permissionSet.key,
                title: permissionSet.title,
                grants: permissionSet.grants.map((grant) => ({
                  resource: grant.resource,
                  actions: grant.actions.map(({ action }) => action),
                })),
              },
            ]
          : [];
      });
      return context.json({ data, meta: { total: data.length } });
    });
    routes.post(
      '/apps',
      onHub('create'),
      validator('json', (value) => parseApiInput(CreateAppInput, value)),
      async (context) => {
        const app = await hub.createApp(
          context.req.valid('json'),
          userIdOf(context),
        );
        logSecurityEvent(securityLogger, context, 'hub.app.create', app.app.id);
        return context.json({ data: appDetailResponse(app) }, 201);
      },
    );
    routes.get(
      '/apps/:appId',
      onApp('read', 'any'),
      validator('param', (value) => parseApiInput(AppParams, value)),
      async (context) => {
        const { appId } = context.req.valid('param');
        return context.json({
          data: appDetailResponse(await hub.getApp(appId)),
        });
      },
    );

    // Resumable uploads: declare the archive, send it in chunks of at most `chunkSize`, then complete it. The
    // completed upload becomes a Release through the same checks and storage as the single upload. `uploads` is a
    // fixed segment, so these are registered before the `:releaseId` routes.
    const upload = HUB_RELEASE_ACTIONS.upload;
    routes.post(
      '/apps/:appId/releases/uploads',
      onApp(upload, upload),
      validator('param', (value) => parseApiInput(AppParams, value)),
      validator('json', (value) => parseApiInput(StartUploadInput, value)),
      async (context) => {
        const { appId } = context.req.valid('param');
        const started = await hub.createReleaseUpload(
          appId,
          context.req.valid('json'),
        );
        // Every answer is the upload resource. When the App already has a Release with this checksum there is nothing
        // to send: no session is created, so `uploadId` is absent, `offset` equals `size`, and `releaseId` names the
        // Release, exactly as a completed upload reports it.
        if (started.kind === 'release')
          return context.json({
            data: {
              offset: started.release.size,
              size: started.release.size,
              chunkSize: RELEASE_UPLOAD_CHUNK_SIZE,
              releaseId: started.release.id,
              version: started.release.version,
              reused: true,
            },
          });
        return context.json(
          { data: started.upload },
          started.kind === 'created' ? 201 : 200,
        );
      },
    );
    routes.get(
      '/apps/:appId/releases/uploads/:uploadId',
      onApp(upload, upload),
      validator('param', (value) => parseApiInput(UploadParams, value)),
      async (context) => {
        const { appId, uploadId } = context.req.valid('param');
        return context.json({
          data: await hub.getReleaseUpload(appId, uploadId),
        });
      },
    );
    // Appending a chunk changes part of the upload, which is what PATCH means; `Upload-Offset` says where it goes.
    routes.patch(
      '/apps/:appId/releases/uploads/:uploadId',
      onApp(upload, upload),
      validator('param', (value) => parseApiInput(UploadParams, value)),
      validator('header', (value) => parseApiInput(UploadChunkHeaders, value)),
      async (context) => {
        const { appId, uploadId } = context.req.valid('param');
        const headers = context.req.valid('header');
        if (mediaType(headers['content-type']) !== 'application/octet-stream')
          throw new HubError(
            'Use application/octet-stream for upload chunks.',
            'INVALID_CONTENT_TYPE',
            'INVALID_ARGUMENT',
            { httpStatus: 415 },
          );
        const length = Number(headers['content-length']);
        if (length > RELEASE_UPLOAD_CHUNK_SIZE)
          throw new HubError(
            `A chunk may carry at most ${RELEASE_UPLOAD_CHUNK_SIZE} bytes.`,
            'CHUNK_TOO_LARGE',
            'INVALID_ARGUMENT',
            { httpStatus: 413 },
          );
        const chunks = requestChunks(context.req.raw);
        try {
          return context.json({
            data: await hub.appendReleaseUpload(appId, uploadId, {
              offset: Number(headers['upload-offset']),
              length,
              chunks,
            }),
          });
        } finally {
          await chunks.return(undefined);
        }
      },
    );
    routes.post(
      '/apps/:appId/releases/uploads/:uploadId/complete',
      onApp(upload, upload),
      validator('param', (value) => parseApiInput(UploadParams, value)),
      validator('header', (value) => parseApiInput(IdempotencyHeaders, value)),
      async (context) => {
        const { appId, uploadId } = context.req.valid('param');
        const idempotencyKey = context.req.valid('header')['idempotency-key'];
        const release = await hub.completeReleaseUpload(appId, uploadId, {
          ...(idempotencyKey === undefined ? {} : { idempotencyKey }),
        });
        logSecurityEvent(securityLogger, context, 'hub.release.upload', appId, {
          releaseId: release.id,
          uploadId,
        });
        return context.json({ data: uploadedReleaseResponse(release) });
      },
    );
    routes.get(
      '/apps/:appId/releases',
      onApp('read-release', 'any'),
      validator('param', (value) => parseApiInput(AppParams, value)),
      validator('query', (value) => parseApiInput(PageQuery, value)),
      async (context) => {
        const { appId } = context.req.valid('param');
        const result = await hub.listReleasesPage(
          appId,
          context.req.valid('query'),
        );
        return context.json({
          data: result.items.map(releaseSummaryResponse),
          meta: pageMeta(result),
        });
      },
    );
    // The archive is the body, as `application/gzip`; only its headers can be validated before it is read.
    routes.post(
      '/apps/:appId/releases',
      onApp(upload, upload),
      validator('param', (value) => parseApiInput(AppParams, value)),
      validator('header', (value) =>
        parseApiInput(ReleaseUploadHeaders, value),
      ),
      async (context) => {
        const { appId } = context.req.valid('param');
        const headers = context.req.valid('header');
        const contentType = mediaType(headers['content-type']);
        if (
          contentType !== 'application/gzip' &&
          contentType !== 'application/octet-stream'
        )
          throw new HubError(
            'Use application/gzip for release uploads.',
            'INVALID_CONTENT_TYPE',
            'INVALID_ARGUMENT',
            { httpStatus: 415 },
          );
        const length = headers['content-length'];
        if (length !== undefined && Number(length) > MAX_ARTIFACT_SIZE)
          throw new HubError(
            'Invalid or excessive artifact length.',
            'ARTIFACT_TOO_LARGE',
            'INVALID_ARGUMENT',
            { httpStatus: 413 },
          );
        const checksum = headers['x-artifact-sha256'];
        const idempotencyKey = headers['idempotency-key'];
        const chunks = requestChunks(context.req.raw);
        let release;
        try {
          release = await hub.createRelease(appId, {
            stream: chunks,
            ...(checksum === undefined ? {} : { checksum }),
            ...(idempotencyKey === undefined ? {} : { idempotencyKey }),
          });
        } finally {
          await chunks.return(undefined);
        }
        logSecurityEvent(securityLogger, context, 'hub.release.upload', appId, {
          releaseId: release.id,
        });
        return context.json({ data: uploadedReleaseResponse(release) }, 201);
      },
    );
    routes.get(
      '/apps/:appId/releases/:releaseId',
      onApp('read-release', 'any'),
      validator('param', (value) => parseApiInput(ReleaseParams, value)),
      async (context) => {
        const { appId, releaseId } = context.req.valid('param');
        return context.json({
          data: releaseSummaryResponse(
            await hub.getReleaseSummary(appId, releaseId),
          ),
        });
      },
    );
    routes.get(
      '/apps/:appId/releases/:releaseId/configTemplate',
      onApp('read-config-template'),
      noStore,
      validator('param', (value) => parseApiInput(ReleaseParams, value)),
      async (context) => {
        const { appId, releaseId } = context.req.valid('param');
        const release = await hub.getRelease(appId, releaseId);
        return context.json({ data: { content: release.configTemplate } });
      },
    );

    routes.get(
      '/apps/:appId/config',
      onApp('read-config'),
      noStore,
      validator('param', (value) => parseApiInput(AppParams, value)),
      async (context) => {
        const { appId } = context.req.valid('param');
        return context.json({ data: await hub.readConfig(appId) });
      },
    );
    routes.put(
      '/apps/:appId/config',
      onApp('update-config'),
      noStore,
      validator('param', (value) => parseApiInput(AppParams, value)),
      validator('json', (value) => parseApiInput(UpdateConfigInput, value)),
      async (context) => {
        const { appId } = context.req.valid('param');
        const result = await hub.updateConfig(appId, context.req.valid('json'));
        logSecurityEvent(securityLogger, context, 'hub.config.update', appId);
        return context.json({ data: result });
      },
    );
    // Settings are updated field by field: any of `name` and `activation` may be sent, so this is a partial update.
    routes.patch(
      '/apps/:appId/settings',
      onApp('update-settings'),
      validator('param', (value) => parseApiInput(AppParams, value)),
      validator('json', (value) => parseApiInput(UpdateSettingsInput, value)),
      async (context) => {
        const { appId } = context.req.valid('param');
        const app = await hub.updateSettings(appId, context.req.valid('json'));
        logSecurityEvent(securityLogger, context, 'hub.settings.update', appId);
        return context.json({
          data: {
            name: app.app.name,
            activation: app.deployment.activation,
          },
        });
      },
    );
    routes.post(
      '/apps/:appId/deploy',
      onApp(HUB_RELEASE_ACTIONS.deploy, HUB_RELEASE_ACTIONS.deploy),
      validator('param', (value) => parseApiInput(AppParams, value)),
      validator('header', (value) => parseApiInput(IdempotencyHeaders, value)),
      validator('json', (value) => parseApiInput(DeployInput, value)),
      async (context) => {
        const { appId } = context.req.valid('param');
        const idempotencyKey = context.req.valid('header')['idempotency-key'];
        const deployment = await hub.deploy(appId, {
          ...context.req.valid('json'),
          ...(idempotencyKey === undefined ? {} : { idempotencyKey }),
        });
        logSecurityEvent(securityLogger, context, 'hub.app.deploy', appId, {
          deploymentId: deployment.id,
        });
        return context.json(
          {
            data: {
              id: deployment.id,
              operationId: deployment.id,
              status: deployment.status,
              // A reused operation was created by an earlier request, so the App may be running another Release by
              // now. Clients must not read it as "this Release is live".
              reused: deployment.reused === true,
              createdAt: deployment.createdAt,
            },
          },
          202,
        );
      },
    );

    // Deployments. The `status` and `logs` sub-resources are one segment deeper than `:deploymentId`, so the order
    // among these does not change which route matches.
    routes.get(
      '/apps/:appId/deployments',
      onApp('read-deployment', 'any'),
      validator('param', (value) => parseApiInput(AppParams, value)),
      validator('query', (value) => parseApiInput(PageQuery, value)),
      async (context) => {
        const { appId } = context.req.valid('param');
        const result = await hub.listDeployments(
          appId,
          context.req.valid('query'),
        );
        return context.json({
          data: result.items.map(deploymentListResponse),
          meta: pageMeta(result),
        });
      },
    );
    // Any publishing key for the App may observe a minimal result, never configuration or logs.
    routes.get(
      '/apps/:appId/deployments/:deploymentId/status',
      onApp(HUB_RELEASE_ACTIONS.deploy, 'any'),
      noStore,
      validator('param', (value) => parseApiInput(DeploymentParams, value)),
      async (context) => {
        const { appId, deploymentId } = context.req.valid('param');
        const deployment = await hub.getDeployment(appId, deploymentId);
        return context.json({
          data: {
            operationId: deployment.id,
            releaseId: deployment.releaseId,
            status: deployment.status,
            phase: deployment.phase,
          },
        });
      },
    );
    routes.get(
      '/apps/:appId/deployments/:deploymentId/logs',
      onApp('read-deployment'),
      noStore,
      validator('param', (value) => parseApiInput(DeploymentParams, value)),
      validator('query', (value) => parseApiInput(LogQuery, value)),
      async (context) => {
        const { appId, deploymentId } = context.req.valid('param');
        return context.json(
          await readLogs(appId, context.req.valid('query'), deploymentId),
        );
      },
    );
    routes.get(
      '/apps/:appId/deployments/:deploymentId',
      onApp('read-deployment'),
      validator('param', (value) => parseApiInput(DeploymentParams, value)),
      async (context) => {
        const { appId, deploymentId } = context.req.valid('param');
        return context.json({
          data: deploymentResponse(
            await hub.getDeployment(appId, deploymentId),
          ),
        });
      },
    );
    routes.get(
      '/apps/:appId/logs',
      onApp('read-log'),
      noStore,
      validator('param', (value) => parseApiInput(AppParams, value)),
      validator('query', (value) => parseApiInput(LogQuery, value)),
      async (context) => {
        const { appId } = context.req.valid('param');
        return context.json(await readLogs(appId, context.req.valid('query')));
      },
    );
    routes.post(
      '/apps/:appId/rollback',
      onApp('rollback'),
      validator('param', (value) => parseApiInput(AppParams, value)),
      validator('json', (value) => parseApiInput(RollbackInput, value)),
      async (context) => {
        const { appId } = context.req.valid('param');
        const deployment = await hub.rollback(appId, context.req.valid('json'));
        logSecurityEvent(securityLogger, context, 'hub.app.rollback', appId, {
          deploymentId: deployment.id,
        });
        return context.json(
          {
            data: {
              id: deployment.id,
              operationId: deployment.id,
              status: deployment.status,
            },
          },
          202,
        );
      },
    );
    // Lifecycle operations answer with the App as it stands afterwards.
    for (const action of ['stop', 'start', 'restart', 'refresh'] as const) {
      routes.post(
        `/apps/:appId/${action}`,
        onApp(action),
        validator('param', (value) => parseApiInput(AppParams, value)),
        async (context) => {
          const { appId } = context.req.valid('param');
          const app = await hub[action](appId);
          logSecurityEvent(securityLogger, context, `hub.app.${action}`, appId);
          return context.json({ data: appDetailResponse(app) });
        },
      );
    }
    routes.delete(
      '/apps/:appId',
      onApp('remove'),
      validator('param', (value) => parseApiInput(AppParams, value)),
      async (context) => {
        const { appId } = context.req.valid('param');
        await hub.remove(appId);
        logSecurityEvent(securityLogger, context, 'hub.app.remove', appId);
        return context.body(null, 204);
      },
    );
    routes.get('/host/status', async (context) => {
      const authz = context.get('authz');
      await authz.require({
        resource: { type: 'hub.host', id: 'global' },
        action: 'read',
      });
      const status = await hub.hostStatus();
      const visible = await Promise.all(
        status.deployments.map(async (deployment) =>
          (await authz.can({
            resource: { type: 'hub.app', id: deployment.appId },
            action: 'read',
          }))
            ? deployment
            : null,
        ),
      );
      return context.json({
        data: {
          ...status,
          deployments: visible.filter((deployment) => deployment !== null),
        },
      });
    });

    /** A log read as a feed: the entries, with the token to read on from and the journal's state in `meta`. */
    async function readLogs(
      appId: string,
      query: z.output<typeof LogQuery>,
      deploymentId?: string,
    ): Promise<{
      readonly data: unknown[];
      readonly meta: Readonly<Record<string, unknown>>;
    }> {
      const { pageToken, q, fromStart, since, until, ...filters } = query;
      const { entries, cursor, ...state } = await hub.readLogs(
        appId,
        {
          ...definedOnly(filters),
          // Entries store milliseconds (`.000Z`) and are compared as text, so the bounds use the same form.
          ...(since === undefined ? {} : { since: canonicalTime(since) }),
          ...(until === undefined ? {} : { until: canonicalTime(until) }),
          ...(pageToken === undefined ? {} : { cursor: pageToken }),
          ...(q === undefined ? {} : { search: q }),
          fromStart: fromStart === 'true',
        },
        deploymentId,
      );
      // A log is read forward while it grows, so the token is always returned: reading from it again later returns
      // what was written since. `hasMore` says whether more is already there.
      return { data: entries, meta: { ...state, nextPageToken: cursor } };
    }

    router.route('/hub', routes);
    return router;
  });

async function requireHubAction(
  context: Pick<Context<HubRouteEnv>, 'get'>,
  appId: string,
  action: string,
): Promise<void> {
  await context.get('authz').require({
    resource: { type: 'hub.app', id: appId },
    action,
  });
}

function userIdOf(context: Pick<Context<HubRouteEnv>, 'get'>): string {
  return context.get('authz').identity.principal.id;
}

function logSecurityEvent(
  logger: Logger | undefined,
  context: Pick<Context<HubRouteEnv>, 'get'>,
  event: string,
  appId: string,
  details: Readonly<Record<string, unknown>> = {},
): void {
  logger?.info(
    {
      event,
      actorId: userIdOf(context),
      appId,
      ...details,
    },
    event,
  );
}

function pageMeta(result: {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
}): {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
} {
  return {
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
  };
}

function definedOnly<T extends Record<string, unknown>>(
  value: T,
): { [K in keyof T]?: Exclude<T[K], undefined> } {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as { [K in keyof T]?: Exclude<T[K], undefined> };
}

function canonicalTime(value: string): string {
  return new Date(value).toISOString();
}

/** The media type of a `Content-Type` header, without its parameters. */
function mediaType(value: string | undefined): string | undefined {
  return value?.split(';')[0]?.trim();
}

/** What a finished upload answers with, whether it arrived in one request or in chunks. */
function uploadedReleaseResponse(release: HubReleaseRecord): ReturnType<
  typeof releaseResponse
> & {
  readonly releaseId: string;
  readonly reused: boolean;
} {
  return {
    ...releaseResponse(release),
    releaseId: release.id,
    reused: release.reused ?? false,
  };
}

const noStore: MiddlewareHandler = async (context, next) => {
  context.header('Cache-Control', 'no-store');
  context.header('Pragma', 'no-cache');
  await next();
};

async function* requestChunks(request: Request): AsyncGenerator<Uint8Array> {
  if (!request.body) return;
  const reader = request.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield value;
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
}

const routes: readonly AppApiRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];

export default routes;

import { HUB_RELEASE_ACTIONS } from '../../shared/permissions.js';
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { loggingToken } from '@nocobase/app-server/logging';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  apiErrorHandler,
  apiErrorResponse,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  emptyResponse,
  listResponse,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono, type Context, type MiddlewareHandler } from 'hono';
import type { z } from 'zod';
import type { Logger } from '@nocobase/logging';

import { hubApiKeyServiceToken } from '../services/api-keys.js';
import { HubError } from '../services/hub.js';
import { MAX_ARTIFACT_SIZE } from '../services/artifact-upload.js';
import {
  MAX_RESUMABLE_ARTIFACT_SIZE,
  RELEASE_UPLOAD_CHUNK_SIZE,
} from '../services/release-uploads.js';
import { hubServiceToken } from '../tokens.js';
import {
  appSummaryResponse,
  appDetailResponse,
  releaseSummaryResponse,
  deploymentResponse,
  deploymentListResponse,
  uploadedReleaseResponse,
  type DeploymentAcceptedResponse,
  type DeploymentStatusResponse,
  type HostStatusResponse,
  type HubRoleResponse,
  type LogFeedResponse,
  type ReusedReleaseUploadResponse,
  type RollbackAcceptedResponse,
  type SettingsResponse,
} from './responses.js';
import {
  appNotFoundResponse,
  hubErrorResponses,
  publishingKeyNote,
  tags,
} from './openapi.js';
import { HUB_PERMISSION_SET_KEYS } from '../authorization.js';
import {
  apiKeyForbidden,
  HubAppRoutes,
  publishingKeySecret,
  type HubApiKeyRequirement,
  type HubRouteEnv,
} from './api-key-access.js';
import {
  ApiKeyAppOptionSchema,
  ApiKeyParams,
  ApiKeySchema,
  ApiKeySecretSchema,
  AppDetailSchema,
  AppParams,
  AppSummarySchema,
  ConfigSchema,
  ConfigTemplateSchema,
  CreateApiKeyInput,
  CreateAppInput,
  CreatedApiKeySchema,
  DeployInput,
  DeploymentAcceptedSchema,
  DeploymentListItemSchema,
  DeploymentParams,
  DeploymentSchema,
  DeploymentStatusSchema,
  HostStatusSchema,
  IdempotencyHeaders,
  ListAppsQuery,
  LogEntrySchema,
  LogMetaSchema,
  LogQuery,
  PageQuery,
  ReleaseParams,
  ReleaseSummarySchema,
  ReleaseUploadHeaders,
  ReleaseUploadSchema,
  RoleSchema,
  RollbackAcceptedSchema,
  RollbackInput,
  SettingsSchema,
  StartReleaseUploadSchema,
  StartUploadInput,
  UpdateConfigInput,
  UpdateSettingsInput,
  UploadChunkHeaders,
  UploadedReleaseSchema,
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

    // Publishing keys. `apps` is a fixed segment, so it is registered before the `:keyId` routes. Key management takes
    // a signed-in session: a publishing key or an application API key is refused before any of these runs.
    const keyManagement =
      'Requires a signed-in session with `hub.app / manage-api-keys`; publishing keys and application API keys are refused (`SESSION_REQUIRED`, `API_KEY_FORBIDDEN`).';
    routes.get(
      '/apiKeys/apps',
      noStore,
      describeRoute({
        tags,
        summary: 'List the Apps a publishing key can be bound to',
        operationId: 'hubListApiKeyApps',
        description:
          'The Apps the signed-in user may bind a new publishing key to, each with the scopes the user may grant for it. Unpaged; `meta.total` counts them.',
        responses: {
          200: listResponse(ApiKeyAppOptionSchema),
          ...hubErrorResponses,
        },
      }),
      async (context) => {
        const data = await apiKeys().appOptions(userIdOf(context));
        return context.json({ data, meta: { total: data.length } });
      },
    );
    routes.get(
      '/apiKeys',
      onHub('manage-api-keys'),
      noStore,
      describeRoute({
        tags,
        summary: 'List publishing keys',
        operationId: 'hubListApiKeys',
        description: `Operators see their own keys, administrators every key. Unpaged; \`meta.total\` counts them. ${keyManagement}`,
        responses: {
          200: listResponse(ApiKeySchema),
          ...hubErrorResponses,
        },
      }),
      async (context) => {
        const data = await apiKeys().list(userIdOf(context));
        return context.json({ data, meta: { total: data.length } });
      },
    );
    routes.post(
      '/apiKeys',
      onHub('manage-api-keys'),
      noStore,
      describeRoute({
        tags,
        summary: 'Create a publishing key',
        operationId: 'hubCreateApiKey',
        description: `The key is bound to its creator: its Apps and scopes never exceed what the creator may do, and every use checks that again. The secret is answered once here; only its creator can read it again. ${keyManagement}`,
        responses: {
          201: dataResponse(CreatedApiKeySchema, 'The key and its secret.'),
          ...hubErrorResponses,
          400: apiErrorResponse(
            400,
            'The input names an App or scope the creator may not grant (`INVALID_API_KEY_INPUT`).',
          ),
        },
      }),
      apiValidator('json', CreateApiKeyInput),
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
      describeRoute({
        tags,
        summary: 'Read a publishing key’s secret again',
        operationId: 'hubRevealApiKey',
        description: `Only the key's creator may read its secret, and only while the key is active and was created with a recoverable copy. ${keyManagement}`,
        responses: {
          200: dataResponse(ApiKeySecretSchema),
          ...hubErrorResponses,
          400: apiErrorResponse(
            400,
            'The key is disabled or expired (`API_KEY_INACTIVE`), or has no recoverable copy (`API_KEY_NOT_RECOVERABLE`).',
          ),
          403: apiErrorResponse(
            403,
            'The caller lacks the Hub permission (`PERMISSION_DENIED`), or did not create the key (`API_KEY_OWNER_REQUIRED`).',
          ),
          404: apiErrorResponse(
            404,
            'No key has this ID (`API_KEY_NOT_FOUND`).',
          ),
        },
      }),
      apiValidator('param', ApiKeyParams),
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
      describeRoute({
        tags,
        summary: 'Disable a publishing key',
        operationId: 'hubDisableApiKey',
        description: `Takes effect for subsequent requests and clears the key's recoverable copy; a deployment it already started is not cancelled. Operators may disable their own keys, administrators any key. ${keyManagement}`,
        responses: {
          200: dataResponse(ApiKeySchema, 'The disabled key.'),
          ...hubErrorResponses,
          403: apiErrorResponse(
            403,
            'The caller lacks the Hub permission (`PERMISSION_DENIED`), or may not manage another user’s key (`API_KEY_OWNER_REQUIRED`).',
          ),
          404: apiErrorResponse(
            404,
            'No key has this ID (`API_KEY_NOT_FOUND`).',
          ),
        },
      }),
      apiValidator('param', ApiKeyParams),
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
      describeRoute({
        tags,
        summary: 'Delete a publishing key',
        operationId: 'hubDeleteApiKey',
        description: `Operators may delete their own keys, administrators any key. ${keyManagement}`,
        responses: {
          204: emptyResponse('The key is deleted.'),
          ...hubErrorResponses,
          403: apiErrorResponse(
            403,
            'The caller lacks the Hub permission (`PERMISSION_DENIED`), or may not manage another user’s key (`API_KEY_OWNER_REQUIRED`).',
          ),
          404: apiErrorResponse(
            404,
            'No key has this ID (`API_KEY_NOT_FOUND`).',
          ),
        },
      }),
      apiValidator('param', ApiKeyParams),
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
      describeRoute({
        tags,
        summary: 'List Apps',
        operationId: 'hubListApps',
        description:
          'Paged by number. A user with `hub.app / read-all` sees every App; anyone else the Apps they created.',
        responses: {
          200: listResponse(AppSummarySchema),
          ...hubErrorResponses,
        },
      }),
      apiValidator('query', ListAppsQuery),
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
    routes.get(
      '/roles',
      describeRoute({
        tags,
        summary: 'List the Hub roles',
        operationId: 'hubListRoles',
        description:
          'The Hub’s permission sets with their grants, for assigning users a Hub role. Requires `user / read`. Unpaged; `meta.total` counts them.',
        responses: {
          200: listResponse(RoleSchema),
          ...hubErrorResponses,
        },
      }),
      async (context) => {
        await context.get('authz').require({
          resource: { type: 'user', id: '*' },
          action: 'read',
        });
        const sets = await permissionSets.list();
        const byKey = new Map(
          sets.map((permissionSet) => [permissionSet.key, permissionSet]),
        );
        const data = HUB_PERMISSION_SET_KEYS.flatMap(
          (key): HubRoleResponse[] => {
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
          },
        );
        return context.json({ data, meta: { total: data.length } });
      },
    );
    routes.post(
      '/apps',
      onHub('create'),
      describeRoute({
        tags,
        summary: 'Create an App',
        operationId: 'hubCreateApp',
        description:
          'Creates an App without a Release; upload one and deploy it to run the App.',
        responses: {
          201: dataResponse(AppDetailSchema, 'The created App.'),
          ...hubErrorResponses,
          400: apiErrorResponse(
            400,
            'The ID is malformed, reserved or overlaps the Hub’s own path (`INVALID_APP_ID`), the name is empty (`INVALID_APP_NAME`), or the creator is disabled (`APP_OWNER_UNAVAILABLE`).',
          ),
          409: apiErrorResponse(
            409,
            'An App already has this ID (`APP_EXISTS`).',
          ),
        },
      }),
      apiValidator('json', CreateAppInput),
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
      describeRoute({
        tags,
        summary: 'Get an App',
        operationId: 'hubGetApp',
        description: `Includes \`buildTarget\`, the platform an uploaded archive has to be built for. ${publishingKeyNote('any')}`,
        responses: {
          200: dataResponse(AppDetailSchema),
          ...hubErrorResponses,
          404: appNotFoundResponse,
        },
      }),
      apiValidator('param', AppParams),
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
    const uploadNote = `Requires \`hub.app / ${upload}\`. ${publishingKeyNote(upload)}`;
    const uploadNotFound = apiErrorResponse(
      404,
      'No App has this ID (`APP_NOT_FOUND`), or no live upload session of this App has this ID (`UPLOAD_NOT_FOUND`); a session expires 24 hours after its last accepted chunk.',
    );
    routes.post(
      '/apps/:appId/releases/uploads',
      onApp(upload, upload),
      describeRoute({
        tags,
        summary: 'Start a resumable Release upload',
        operationId: 'hubStartReleaseUpload',
        description: `Declares an archive of up to ${MAX_RESUMABLE_ARTIFACT_SIZE} bytes to send in chunks with \`hubAppendReleaseUpload\`, then complete with \`hubCompleteReleaseUpload\`. Starting again with the same size and checksum resumes the unfinished session (\`200\`) instead of creating one (\`201\`), and when the App already has a Release with this checksum the answer is that Release and nothing has to be sent. ${uploadNote}`,
        responses: {
          200: dataResponse(
            StartReleaseUploadSchema,
            'An unfinished session with this archive resumed, or the App’s existing Release with this checksum.',
          ),
          201: dataResponse(StartReleaseUploadSchema, 'A new session.'),
          ...hubErrorResponses,
          400: apiErrorResponse(
            400,
            'The size or checksum is out of range or malformed (`INVALID_UPLOAD`).',
          ),
          404: appNotFoundResponse,
        },
      }),
      apiValidator('param', AppParams),
      apiValidator('json', StartUploadInput),
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
            } satisfies ReusedReleaseUploadResponse,
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
      describeRoute({
        tags,
        summary: 'Get a resumable Release upload',
        operationId: 'hubGetReleaseUpload',
        description: `Answers where the session stands, so a client resumes from \`offset\` after a failure. ${uploadNote}`,
        responses: {
          200: dataResponse(ReleaseUploadSchema),
          ...hubErrorResponses,
          404: uploadNotFound,
        },
      }),
      apiValidator('param', UploadParams),
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
      describeRoute({
        tags,
        summary: 'Append a chunk to a resumable Release upload',
        operationId: 'hubAppendReleaseUpload',
        description: `The body is the next chunk of the archive, at most \`chunkSize\` bytes, sent as \`application/octet-stream\` with \`Upload-Offset\` set to the session's current \`offset\` and a \`Content-Length\`. A chunk is accepted whole or not at all; after a failure, read the session with \`hubGetReleaseUpload\` and send from its \`offset\`. ${uploadNote}`,
        requestBody: {
          required: true,
          content: {
            'application/octet-stream': {
              schema: {
                type: 'string',
                format: 'binary',
                description: 'The chunk’s bytes.',
              },
            },
          },
        },
        responses: {
          200: dataResponse(
            ReleaseUploadSchema,
            'The session with the chunk accepted.',
          ),
          ...hubErrorResponses,
          400: apiErrorResponse(
            400,
            'The chunk extends past the declared size (`UPLOAD_TOO_LARGE`), the body is shorter or longer than `Content-Length` (`INCOMPLETE_CHUNK`, `INVALID_CHUNK`), or the upload is already completed (`UPLOAD_COMPLETED`, `FAILED_PRECONDITION`, with the session’s offset in `error.metadata.offset`).',
          ),
          404: uploadNotFound,
          409: apiErrorResponse(
            409,
            '`Upload-Offset` is not the session’s current offset (`ABORTED`, reason `UPLOAD_OFFSET_MISMATCH`); `error.metadata.offset` is where to send from.',
          ),
          413: apiErrorResponse(
            413,
            `The chunk is larger than \`chunkSize\`, ${RELEASE_UPLOAD_CHUNK_SIZE} bytes (\`CHUNK_TOO_LARGE\`).`,
          ),
          415: apiErrorResponse(
            415,
            'The body is not `application/octet-stream` (`INVALID_CONTENT_TYPE`).',
          ),
        },
      }),
      apiValidator('param', UploadParams),
      apiValidator('header', UploadChunkHeaders),
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
      describeRoute({
        tags,
        summary: 'Complete a resumable Release upload',
        operationId: 'hubCompleteReleaseUpload',
        description: `Checks the received archive against the declared checksum and the Host and stores it as a Release, exactly as \`hubUploadRelease\` does. Completing an already completed session answers the same Release again. An archive the Hub refuses discards the session; any other failure keeps it, so completing can be retried. ${uploadNote}`,
        responses: {
          200: dataResponse(UploadedReleaseSchema, 'The Release.'),
          ...hubErrorResponses,
          400: apiErrorResponse(
            400,
            'Not every byte has arrived (`UPLOAD_INCOMPLETE`, `FAILED_PRECONDITION`, with the session’s offset in `error.metadata.offset`), or the archive is refused: its checksum does not match (`CHECKSUM_MISMATCH`), it is malformed or unsafe (`INVALID_ARTIFACT`, `UNSAFE_ARTIFACT`, `INVALID_ARTIFACT_VERSION`), it targets another platform (`BUILD_TARGET_MISMATCH`) or another base path (`BASE_PATH_MISMATCH`), or `Idempotency-Key` is malformed (`INVALID_IDEMPOTENCY_KEY`).',
          ),
          404: uploadNotFound,
          409: apiErrorResponse(
            409,
            '`Idempotency-Key` was already used for another archive (`ABORTED`, reason `IDEMPOTENCY_CONFLICT`).',
          ),
        },
      }),
      apiValidator('param', UploadParams),
      apiValidator('header', IdempotencyHeaders),
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
      describeRoute({
        tags,
        summary: 'List an App’s Releases',
        operationId: 'hubListReleases',
        description: `Newest first, paged by number. ${publishingKeyNote('any')}`,
        responses: {
          200: listResponse(ReleaseSummarySchema),
          ...hubErrorResponses,
          404: appNotFoundResponse,
        },
      }),
      apiValidator('param', AppParams),
      apiValidator('query', PageQuery),
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
      describeRoute({
        tags,
        summary: 'Upload a Release',
        operationId: 'hubUploadRelease',
        description: `The body is the deployment archive \`pnpm build --tar\` produces, up to ${MAX_ARTIFACT_SIZE} bytes; use the resumable upload for a larger one or behind a proxy with a small body limit. The archive is checked against the Host before anything is stored. Uploading never deploys: deploy the Release with \`hubDeployApp\`. An archive the App already has, by checksum or \`Idempotency-Key\`, answers that Release with \`reused\` true. ${uploadNote}`,
        requestBody: {
          required: true,
          content: {
            'application/gzip': {
              schema: {
                type: 'string',
                format: 'binary',
                description: 'The `.tar.gz` deployment archive.',
              },
            },
            'application/octet-stream': {
              schema: {
                type: 'string',
                format: 'binary',
                description: 'The same archive, sent as untyped bytes.',
              },
            },
          },
        },
        responses: {
          201: dataResponse(UploadedReleaseSchema, 'The Release.'),
          ...hubErrorResponses,
          400: apiErrorResponse(
            400,
            'The archive is refused: its checksum does not match `X-Artifact-SHA256` or is malformed (`CHECKSUM_MISMATCH`, `INVALID_CHECKSUM`), it is empty, malformed or unsafe (`INVALID_ARTIFACT_SIZE`, `INVALID_ARTIFACT`, `UNSAFE_ARTIFACT`, `INVALID_ARTIFACT_VERSION`), it targets another platform (`BUILD_TARGET_MISMATCH`) or another base path (`BASE_PATH_MISMATCH`), or `Idempotency-Key` is malformed (`INVALID_IDEMPOTENCY_KEY`).',
          ),
          404: appNotFoundResponse,
          409: apiErrorResponse(
            409,
            '`Idempotency-Key` was already used for another archive (`ABORTED`, reason `IDEMPOTENCY_CONFLICT`).',
          ),
          413: apiErrorResponse(
            413,
            `The archive is larger than ${MAX_ARTIFACT_SIZE} bytes, by \`Content-Length\` or as it arrives (\`ARTIFACT_TOO_LARGE\`).`,
          ),
          415: apiErrorResponse(
            415,
            'The body is neither `application/gzip` nor `application/octet-stream` (`INVALID_CONTENT_TYPE`).',
          ),
        },
      }),
      apiValidator('param', AppParams),
      apiValidator('header', ReleaseUploadHeaders),
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
    const releaseNotFound = apiErrorResponse(
      404,
      'No App has this ID (`APP_NOT_FOUND`), or the App has no Release with this ID (`RELEASE_NOT_FOUND`).',
    );
    routes.get(
      '/apps/:appId/releases/:releaseId',
      onApp('read-release', 'any'),
      describeRoute({
        tags,
        summary: 'Get a Release',
        operationId: 'hubGetRelease',
        description: publishingKeyNote('any'),
        responses: {
          200: dataResponse(ReleaseSummarySchema),
          ...hubErrorResponses,
          404: releaseNotFound,
        },
      }),
      apiValidator('param', ReleaseParams),
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
      describeRoute({
        tags,
        summary: 'Get a Release’s configuration template',
        operationId: 'hubGetReleaseConfigTemplate',
        description:
          'The `config.yml` template the archive carries, to start a first deployment’s configuration from. Requires `hub.app / read-config-template`.',
        responses: {
          200: dataResponse(ConfigTemplateSchema),
          ...hubErrorResponses,
          404: releaseNotFound,
        },
      }),
      apiValidator('param', ReleaseParams),
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
      describeRoute({
        tags,
        summary: 'Get an App’s configuration',
        operationId: 'hubGetAppConfig',
        description:
          'The `config.yml` of the App’s current deployment. Requires `hub.app / read-config`.',
        responses: {
          200: dataResponse(ConfigSchema),
          ...hubErrorResponses,
          404: appNotFoundResponse,
        },
      }),
      apiValidator('param', AppParams),
      async (context) => {
        const { appId } = context.req.valid('param');
        return context.json({ data: await hub.readConfig(appId) });
      },
    );
    routes.put(
      '/apps/:appId/config',
      onApp('update-config'),
      noStore,
      describeRoute({
        tags,
        summary: 'Replace an App’s configuration',
        operationId: 'hubUpdateAppConfig',
        description:
          'Writes the `config.yml` of the current deployment and has the running App reload it, without a new deployment. Secrets the new content leaves out are kept from the current file. Requires `hub.app / update-config`.',
        responses: {
          200: dataResponse(ConfigSchema, 'The configuration as saved.'),
          ...hubErrorResponses,
          400: apiErrorResponse(
            400,
            'The content is not valid YAML (`INVALID_CONFIG_FILE`), or the current deployment’s configuration is not a Hub-managed file (`CONFIG_NOT_EDITABLE`, `FAILED_PRECONDITION`).',
          ),
          404: appNotFoundResponse,
          503: apiErrorResponse(
            503,
            'The configuration was saved, but the running App could not reload it (`CONFIG_RELOAD_FAILED`).',
          ),
        },
      }),
      apiValidator('param', AppParams),
      apiValidator('json', UpdateConfigInput),
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
      describeRoute({
        tags,
        summary: 'Update an App’s settings',
        operationId: 'hubUpdateAppSettings',
        description:
          'A partial update: any of `name` and `activation` may be sent. Requires `hub.app / update-settings`.',
        responses: {
          200: dataResponse(SettingsSchema, 'The settings as saved.'),
          ...hubErrorResponses,
          400: apiErrorResponse(
            400,
            'The name is empty or longer than 255 characters (`INVALID_APP_NAME`).',
          ),
          404: appNotFoundResponse,
        },
      }),
      apiValidator('param', AppParams),
      apiValidator('json', UpdateSettingsInput),
      async (context) => {
        const { appId } = context.req.valid('param');
        const app = await hub.updateSettings(appId, context.req.valid('json'));
        logSecurityEvent(securityLogger, context, 'hub.settings.update', appId);
        return context.json({
          data: {
            name: app.app.name,
            activation: app.deployment.activation,
          } satisfies SettingsResponse,
        });
      },
    );
    routes.post(
      '/apps/:appId/deploy',
      onApp(HUB_RELEASE_ACTIONS.deploy, HUB_RELEASE_ACTIONS.deploy),
      describeRoute({
        tags,
        summary: 'Deploy a Release',
        operationId: 'hubDeployApp',
        description: `Starts deploying a stored Release, the only way a deployment starts, and answers \`202\` with the operation at once; follow it with \`hubGetDeploymentStatus\`. A repeated request with the same \`Idempotency-Key\` and input answers the first one's operation with \`reused\` true. Requires \`hub.app / ${HUB_RELEASE_ACTIONS.deploy}\`. ${publishingKeyNote(HUB_RELEASE_ACTIONS.deploy)}`,
        responses: {
          202: dataResponse(
            DeploymentAcceptedSchema,
            'The deployment operation, accepted.',
          ),
          ...hubErrorResponses,
          400: apiErrorResponse(
            400,
            'The input is inconsistent (`INVALID_DEPLOYMENT_INPUT`, `INVALID_CONFIG_MODE`, `INVALID_CONFIG_FILE`), `releaseId` names no Release of the App (`RELEASE_NOT_FOUND`, as a field violation), `Idempotency-Key` is malformed (`INVALID_IDEMPOTENCY_KEY`), or another deployment of the App is in progress (`DEPLOYMENT_IN_PROGRESS`, `FAILED_PRECONDITION`).',
          ),
          404: appNotFoundResponse,
          409: apiErrorResponse(
            409,
            '`Idempotency-Key` was already used for another deployment (`ABORTED`, reason `IDEMPOTENCY_CONFLICT`).',
          ),
        },
      }),
      apiValidator('param', AppParams),
      apiValidator('header', IdempotencyHeaders),
      apiValidator('json', DeployInput),
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
            } satisfies DeploymentAcceptedResponse,
          },
          202,
        );
      },
    );

    // Deployments. The `status` and `logs` sub-resources are one segment deeper than `:deploymentId`, so the order
    // among these does not change which route matches.
    const deploymentNotFound = apiErrorResponse(
      404,
      'No App has this ID (`APP_NOT_FOUND`), or the App has no deployment with this ID (`DEPLOYMENT_NOT_FOUND`).',
    );
    const logReadErrors = {
      400: apiErrorResponse(
        400,
        '`pageToken` was not issued for this log and query (`INVALID_LOG_CURSOR`).',
      ),
    };
    const logDescription =
      'Read as a feed rather than a list: each read returns what fits in one bounded chunk of the journal, so there is no `pageSize`. Pass `meta.nextPageToken` back as `pageToken` to read on; it is always returned, and reading from it later returns what was written since. `meta.reset` true means the token could not be continued and the read started again. Reading never removes anything.';
    routes.get(
      '/apps/:appId/deployments',
      onApp('read-deployment', 'any'),
      describeRoute({
        tags,
        summary: 'List an App’s deployments',
        operationId: 'hubListDeployments',
        description: `Newest first, paged by number. ${publishingKeyNote('any')}`,
        responses: {
          200: listResponse(DeploymentListItemSchema),
          ...hubErrorResponses,
          404: appNotFoundResponse,
        },
      }),
      apiValidator('param', AppParams),
      apiValidator('query', PageQuery),
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
      describeRoute({
        tags,
        summary: 'Get a deployment’s status',
        operationId: 'hubGetDeploymentStatus',
        description: `The minimal view of a deployment, to poll after \`hubDeployApp\` until \`status\` is final. Requires \`hub.app / ${HUB_RELEASE_ACTIONS.deploy}\`. ${publishingKeyNote('any')}`,
        responses: {
          200: dataResponse(DeploymentStatusSchema),
          ...hubErrorResponses,
          404: deploymentNotFound,
        },
      }),
      apiValidator('param', DeploymentParams),
      async (context) => {
        const { appId, deploymentId } = context.req.valid('param');
        const deployment = await hub.getDeployment(appId, deploymentId);
        return context.json({
          data: {
            operationId: deployment.id,
            releaseId: deployment.releaseId,
            status: deployment.status,
            phase: deployment.phase,
          } satisfies DeploymentStatusResponse,
        });
      },
    );
    routes.get(
      '/apps/:appId/deployments/:deploymentId/logs',
      onApp('read-deployment'),
      noStore,
      describeRoute({
        tags,
        summary: 'Read a deployment’s log',
        operationId: 'hubReadDeploymentLogs',
        description: `${logDescription} \`meta\` also carries the deployment's \`status\` and \`phase\`. Requires \`hub.app / read-deployment\`.`,
        responses: {
          200: listResponse(LogEntrySchema, LogMetaSchema),
          ...hubErrorResponses,
          ...logReadErrors,
          404: deploymentNotFound,
        },
      }),
      apiValidator('param', DeploymentParams),
      apiValidator('query', LogQuery),
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
      describeRoute({
        tags,
        summary: 'Get a deployment',
        operationId: 'hubGetDeployment',
        description: 'Requires `hub.app / read-deployment`.',
        responses: {
          200: dataResponse(DeploymentSchema),
          ...hubErrorResponses,
          404: deploymentNotFound,
        },
      }),
      apiValidator('param', DeploymentParams),
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
      describeRoute({
        tags,
        summary: 'Read an App’s log',
        operationId: 'hubReadAppLogs',
        description: `The App's retained runtime log, readable while the App or the Host is stopped. ${logDescription} Requires \`hub.app / read-log\`.`,
        responses: {
          200: listResponse(LogEntrySchema, LogMetaSchema),
          ...hubErrorResponses,
          ...logReadErrors,
          404: appNotFoundResponse,
        },
      }),
      apiValidator('param', AppParams),
      apiValidator('query', LogQuery),
      async (context) => {
        const { appId } = context.req.valid('param');
        return context.json(await readLogs(appId, context.req.valid('query')));
      },
    );
    routes.post(
      '/apps/:appId/rollback',
      onApp('rollback'),
      describeRoute({
        tags,
        summary: 'Roll an App back to an earlier deployment',
        operationId: 'hubRollbackApp',
        description:
          'Starts deploying the Release of an earlier successful deployment and answers `202` with the operation at once; follow it with `hubGetDeploymentStatus`. Requires `hub.app / rollback`.',
        responses: {
          202: dataResponse(
            RollbackAcceptedSchema,
            'The rollback operation, accepted.',
          ),
          ...hubErrorResponses,
          400: apiErrorResponse(
            400,
            '`deploymentId` names no deployment of the App (`DEPLOYMENT_NOT_FOUND`, as a field violation) or one that did not succeed (`INVALID_ROLLBACK_TARGET`), `config.mode` differs from the target’s (`ROLLBACK_CONFIG_MODE_MISMATCH`), or another deployment is in progress (`DEPLOYMENT_IN_PROGRESS`).',
          ),
          404: appNotFoundResponse,
        },
      }),
      apiValidator('param', AppParams),
      apiValidator('json', RollbackInput),
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
            } satisfies RollbackAcceptedResponse,
          },
          202,
        );
      },
    );
    // Lifecycle operations answer with the App as it stands afterwards.
    const lifecycle = {
      stop: {
        summary: 'Stop an App',
        operationId: 'hubStopApp',
        description:
          'Stops the running App on the Host; it stays stopped until started again.',
        errors: {
          400: apiErrorResponse(
            400,
            'The App has never been deployed (`APP_NOT_DEPLOYED`, `FAILED_PRECONDITION`).',
          ),
          503: apiErrorResponse(
            503,
            'The Host could not stop the App (`STOP_FAILED`).',
          ),
        },
      },
      start: {
        summary: 'Start an App',
        operationId: 'hubStartApp',
        description: 'Starts the App’s current deployment on the Host.',
        errors: {
          400: apiErrorResponse(
            400,
            'The App has never been deployed (`APP_NOT_DEPLOYED`, `FAILED_PRECONDITION`).',
          ),
          503: apiErrorResponse(
            503,
            'The Host could not start the App (`START_FAILED`).',
          ),
        },
      },
      restart: {
        summary: 'Restart an App',
        operationId: 'hubRestartApp',
        description: 'Restarts the running App on the Host.',
        errors: {
          400: apiErrorResponse(
            400,
            'The App has never been deployed (`APP_NOT_DEPLOYED`) or is not running (`APP_NOT_RUNNING`), both `FAILED_PRECONDITION`.',
          ),
          503: apiErrorResponse(
            503,
            'The Host could not restart the App (`RESTART_FAILED`).',
          ),
        },
      },
      refresh: {
        summary: 'Refresh an App’s state',
        operationId: 'hubRefreshApp',
        description:
          'Reads the App’s state from the Host again without changing anything.',
        errors: {},
      },
    } as const;
    for (const action of ['stop', 'start', 'restart', 'refresh'] as const) {
      const { summary, operationId, description, errors } = lifecycle[action];
      routes.post(
        `/apps/:appId/${action}`,
        onApp(action),
        describeRoute({
          tags,
          summary,
          operationId,
          description: `${description} Answers with the App as it stands afterwards. Requires \`hub.app / ${action}\`.`,
          responses: {
            200: dataResponse(AppDetailSchema, 'The App afterwards.'),
            ...hubErrorResponses,
            ...errors,
            404: appNotFoundResponse,
          },
        }),
        apiValidator('param', AppParams),
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
      describeRoute({
        tags,
        summary: 'Delete an App',
        operationId: 'hubDeleteApp',
        description:
          'Removes the App from the Host and deletes its Releases, deployments, logs, upload sessions and publishing-key bindings; a key bound to no other App is deleted with it. Requires `hub.app / remove`.',
        responses: {
          204: emptyResponse('The App is deleted.'),
          ...hubErrorResponses,
          404: appNotFoundResponse,
        },
      }),
      apiValidator('param', AppParams),
      async (context) => {
        const { appId } = context.req.valid('param');
        await hub.remove(appId);
        logSecurityEvent(securityLogger, context, 'hub.app.remove', appId);
        return context.body(null, 204);
      },
    );
    routes.get(
      '/host/status',
      describeRoute({
        tags,
        summary: 'Get the App Host’s status',
        operationId: 'hubGetHostStatus',
        description:
          'The Host’s platform, readiness and deployment set, listing only the deployments of Apps the caller may read. Requires `hub.host / read`.',
        responses: {
          200: dataResponse(HostStatusSchema),
          ...hubErrorResponses,
        },
      }),
      async (context) => {
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
          } satisfies HostStatusResponse,
        });
      },
    );

    /** A log read as a feed: the entries, with the token to read on from and the journal's state in `meta`. */
    async function readLogs(
      appId: string,
      query: z.output<typeof LogQuery>,
      deploymentId?: string,
    ): Promise<LogFeedResponse> {
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

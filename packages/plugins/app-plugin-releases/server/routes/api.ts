/**
 * The HTTP API under `/api/releases`. Callers are authenticated by the application — a session, or an API key, whose
 * scope the application's identity carries (CI uses a key scoped to `releases.apps`) — and described by its
 * `ReleasesAccess`; one bearer credential reaches the upload route without either: an upload ticket
 * (`Bearer rel_ticket_…`: one upload). Each route checks what the caller may do at all before it reads its input; the
 * services then check the record itself, so in-process callers meet the same rules.
 */
import {
  apiErrorHandler,
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  cliRoute,
  dataResponse,
  describeRoute,
  emptyResponse,
  listResponse,
  type ApiFieldViolation,
} from '@nocobase/app-server/router';
import { Hono, type Context, type MiddlewareHandler } from 'hono';

import type { AppAction } from '../../shared/access.js';
import { UPLOAD_TICKET_PREFIX } from '../../shared/releases.js';
import type { Caller } from '../access/caller.js';
import type { Releases } from '../composition.js';
import { ReleasesError, referencedBy } from '../errors.js';
import { parseLabelFilter } from '../services/validation.js';
import {
  AppParams,
  ApproveRequestBody,
  CheckEnvironmentBody,
  CheckRegistryBody,
  CreateAppBody,
  CreateEnvironmentBody,
  CreateRegistryBody,
  CreateRequestBody,
  CreateUploadTicketBody,
  DeleteAppQuery,
  DeployBody,
  DeployQuery,
  DeploymentParams,
  EmptyBody,
  EnvironmentParams,
  IdempotencyHeaders,
  LabelReleaseBody,
  ListAppsQuery,
  ListReleasesQuery,
  ListRequestsQuery,
  LogQuery,
  PageQuery,
  PromoteBody,
  RegisterImageReleaseBody,
  ReleasesAppSchema,
  ReleasesCallerSchema,
  ReleasesConfigSchema,
  ReleasesConfigTemplateSchema,
  ReleasesDeploymentRequestSchema,
  ReleasesDeploymentSchema,
  ReleasesDriverSchema,
  ReleasesEnvironmentCheckSchema,
  ReleasesEnvironmentSchema,
  ReleasesLogEntrySchema,
  ReleasesLogMeta,
  ReleasesPageMeta,
  ReleasesRegistryCheckSchema,
  ReleasesRegistrySchema,
  ReleasesReleaseSchema,
  ReleasesTotalMeta,
  ReleasesUploadTicketSchema,
  ReleasesAppVariableSchema,
  ReleasesAppVariablesMeta,
  ReleasesEnvironmentDeclaredVariableSchema,
  ReleasesEnvironmentVariableSchema,
  ReleasesInitialAdminSchema,
  ReleasesVariablesManifestSchema,
  AppVariableParams,
  AppVariablesQuery,
  EnvironmentVariableParams,
  SetAppVariableBody,
  SetEnvironmentVariableBody,
  RegistryParams,
  RejectRequestBody,
  ReleaseParams,
  RequestParams,
  RollbackBody,
  UpdateAppBody,
  UpdateConfigBody,
  UpdateEnvironmentBody,
  UpdateRegistryBody,
  UploadHeaders,
  type Paging,
} from './schemas.js';

export interface ReleasesApiEnv {
  Variables: {
    releasesCaller?: Caller;
    releasesBearer?: {
      readonly kind: 'ticket';
      readonly token: string;
    };
  };
}

export interface ReleasesApiOptions {
  /**
   * Authenticates the caller and runs the application's authorization middleware; answers 401 itself. It accepts
   * scoped API keys: every check is the services', which narrow by the identity's `keyScope`.
   */
  readonly authenticate: MiddlewareHandler;
  /** The caller for an authenticated request. */
  readonly callerOf: (context: Context) => Promise<Caller>;
  readonly securityLog?: (
    event: string,
    details: Record<string, unknown>,
  ) => void;
}

const UPLOAD_CONTENT_TYPES = ['application/gzip', 'application/octet-stream'];
const tags = ['Releases'];

/**
 * A person (a session or an API key), or an agent's run (its run token, `x-nocobase-run-token`, when the application
 * assembles the agents plugin): the run acts for the person who woke the agent, within the actions its scope keeps.
 */
const personOrRunSecurity: Record<string, string[]>[] = [
  { cookieAuth: [] },
  { apiKeyAuth: [] },
  { runToken: [] },
];

export function createReleasesApi(
  services: Releases,
  options: ReleasesApiOptions,
): Hono<ReleasesApiEnv> {
  const api = new Hono<ReleasesApiEnv>();
  const log = options.securityLog ?? (() => undefined);
  const { guard } = services;

  // `ReleasesError` is an `ApiError`: the framework's handler renders it, validation errors and denials alike.
  api.onError(apiErrorHandler);

  // An upload ticket skips the application's authentication; anything else is the application's business.
  api.use('*', async (context, next) => {
    const token = /^Bearer\s+(\S+)$/i.exec(
      context.req.header('authorization') ?? '',
    )?.[1];
    if (token?.startsWith(UPLOAD_TICKET_PREFIX)) {
      context.set('releasesBearer', { kind: 'ticket', token });
      return await next();
    }
    const plain = context as unknown as Parameters<MiddlewareHandler>[0];
    return await options.authenticate(plain, async () => {
      context.set('releasesCaller', await options.callerOf(plain));
      await next();
    });
  });

  /** The authenticated caller; an upload ticket is refused everywhere but its upload. */
  const person = (context: Context<ReleasesApiEnv>): Caller => {
    const caller = context.get('releasesCaller');
    if (!caller)
      throw new ReleasesError(
        'This endpoint requires a signed-in user.',
        'SESSION_REQUIRED',
        'PERMISSION_DENIED',
      );
    return caller;
  };

  /** A route's permission check, made before its input is read. */
  const allow =
    (check: (caller: Caller) => void): MiddlewareHandler<ReleasesApiEnv> =>
    async (context, next) => {
      check(person(context));
      await next();
    };
  const signedIn = allow(() => undefined);
  const environmentReader = allow((caller) =>
    services.environments.requireReader(caller),
  );
  const settings = (action: 'read' | 'manage') =>
    allow((caller) => guard.requireSetting(caller, 'rel.environments', action));
  /** Any App the caller may take one of `actions` on; the App in the path is checked by the service. */
  const onApps = (...actions: AppAction[]) =>
    allow((caller) => guard.requireAnyApp(caller, ...actions));

  api.get(
    '/me',
    signedIn,
    describeRoute({
      tags,
      summary: 'Get the caller and their release permissions',
      operationId: 'releasesGetMe',
      ...cliRoute({ command: 'release permissions' }),
      description: 'Any signed-in caller.',
      responses: {
        200: dataResponse(ReleasesCallerSchema),
        ...apiErrorResponses,
      },
    }),
    (context) => {
      const caller = person(context);
      return context.json({
        data: {
          userId: caller.userId,
          kind: caller.kind,
          permissions: caller.permissions,
        },
      });
    },
  );

  api.get(
    '/drivers',
    environmentReader,
    describeRoute({
      tags,
      summary: 'List deployment drivers',
      operationId: 'releasesListDrivers',
      ...cliRoute({
        command: 'env driver list',
        columns: ['kind', 'title.key'],
        action: 'rel.environments/read',
      }),
      description:
        'Requires the `rel.environments` `read` setting, access to the Apps page, or the `create` action on every App.',
      responses: {
        200: listResponse(ReleasesDriverSchema, ReleasesTotalMeta),
        ...apiErrorResponses,
      },
    }),
    (context) => {
      const data = services.environments.drivers(person(context));
      return context.json({ data, meta: { total: data.length } });
    },
  );

  // --- Environments. `check` is a fixed segment, registered before `:environmentId`; no environment may take it. ---
  api.get(
    '/environments',
    environmentReader,
    describeRoute({
      tags,
      summary: 'List environments',
      operationId: 'releasesListEnvironments',
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'env list',
        columns: ['id', 'name', 'driver', 'protected'],
        action: 'rel.environments/read',
      }),
      description:
        'Requires the `rel.environments` `read` setting, access to the Apps page, or the `create` action on every App.',
      responses: {
        200: listResponse(ReleasesEnvironmentSchema, ReleasesTotalMeta),
        ...apiErrorResponses,
      },
    }),
    async (context) => {
      const data = await services.environments.list(person(context));
      return context.json({ data, meta: { total: data.length } });
    },
  );
  api.post(
    '/environments',
    settings('manage'),
    describeRoute({
      tags,
      summary: 'Create an environment',
      operationId: 'releasesCreateEnvironment',
      ...cliRoute({
        command: 'env create',
        args: ['id'],
        flags: {
          id: { name: 'env' },
          registryId: { name: 'registry' },
          publicUrl: { name: 'url' },
        },
        bodyFile: 'file',
        examples: [
          'env create staging --name Staging --driver host --protected',
          'env create production --file production.json',
        ],
        action: 'rel.environments/manage',
      }),
      description:
        'Requires the `rel.environments` `manage` setting. Credentials are write-only and never returned.',
      responses: {
        201: dataResponse(
          ReleasesEnvironmentSchema,
          'The created environment.',
        ),
        ...apiErrorResponses,
        409: apiErrorResponse(
          409,
          'An environment with this ID exists (`ENVIRONMENT_EXISTS`).',
        ),
      },
    }),
    apiValidator('json', CreateEnvironmentBody),
    async (context) => {
      const caller = person(context);
      const environment = await services.environments.create(
        caller,
        context.req.valid('json'),
      );
      log('releases.environment.create', {
        actorId: caller.userId,
        environmentId: environment.id,
      });
      return context.json({ data: environment }, 201);
    },
  );
  // Settings tried before they are saved, from the environment form.
  api.post(
    '/environments/check',
    settings('manage'),
    describeRoute({
      tags,
      summary: 'Check unsaved environment settings',
      operationId: 'releasesCheckEnvironmentDraft',
      // The environment form's dry run; `env create` validates, and `env check` checks a saved one.
      ...cliRoute(false),
      description:
        'Requires the `rel.environments` `manage` setting. Runs the driver check against the settings given; `id` names a stored environment whose credentials fill in the ones not given.',
      responses: {
        200: dataResponse(ReleasesEnvironmentCheckSchema),
        ...apiErrorResponses,
      },
    }),
    apiValidator('json', CheckEnvironmentBody),
    async (context) =>
      context.json({
        data: await services.environments.checkDraft(
          person(context),
          context.req.valid('json'),
        ),
      }),
  );
  api.get(
    '/environments/:environmentId',
    environmentReader,
    describeRoute({
      tags,
      summary: 'Get an environment',
      operationId: 'releasesGetEnvironment',
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'env get',
        flags: { environmentId: { name: 'env' } },
        action: 'rel.environments/read',
      }),
      description:
        'Requires the `rel.environments` `read` setting, access to the Apps page, or the `create` action on every App.',
      responses: {
        200: dataResponse(ReleasesEnvironmentSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', EnvironmentParams),
    async (context) =>
      context.json({
        data: await services.environments.get(
          person(context),
          context.req.valid('param').environmentId,
        ),
      }),
  );
  api.patch(
    '/environments/:environmentId',
    settings('manage'),
    describeRoute({
      tags,
      summary: 'Update an environment',
      operationId: 'releasesUpdateEnvironment',
      ...cliRoute({
        command: 'env update',
        flags: {
          environmentId: { name: 'env' },
          registryId: { name: 'registry' },
          publicUrl: { name: 'url' },
        },
        bodyFile: 'file',
        action: 'rel.environments/manage',
      }),
      description: 'Requires the `rel.environments` `manage` setting.',
      responses: {
        200: dataResponse(ReleasesEnvironmentSchema),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The driver or its run mode cannot change once Apps use the environment (`ENVIRONMENT_DRIVER_FIXED`, `ENVIRONMENT_VARIANT_FIXED`).',
        ),
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', EnvironmentParams),
    apiValidator('json', UpdateEnvironmentBody),
    async (context) => {
      const caller = person(context);
      const environment = await services.environments.update(
        caller,
        context.req.valid('param').environmentId,
        context.req.valid('json'),
      );
      log('releases.environment.update', {
        actorId: caller.userId,
        environmentId: environment.id,
      });
      return context.json({ data: environment });
    },
  );
  api.delete(
    '/environments/:environmentId',
    settings('manage'),
    describeRoute({
      tags,
      summary: 'Delete an environment',
      operationId: 'releasesDeleteEnvironment',
      ...cliRoute({
        command: 'env delete',
        flags: { environmentId: { name: 'env' } },
        confirm: 'Delete the environment?',
        action: 'rel.environments/manage',
      }),
      description: 'Requires the `rel.environments` `manage` setting.',
      responses: {
        204: emptyResponse(),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'Apps still use the environment (`ENVIRONMENT_IN_USE`).',
        ),
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', EnvironmentParams),
    async (context) => {
      const caller = person(context);
      const { environmentId } = context.req.valid('param');
      await services.environments.remove(caller, environmentId);
      log('releases.environment.remove', {
        actorId: caller.userId,
        environmentId,
      });
      return context.body(null, 204);
    },
  );
  api.post(
    '/environments/:environmentId/check',
    settings('read'),
    describeRoute({
      tags,
      summary: 'Check an environment',
      operationId: 'releasesCheckEnvironment',
      ...cliRoute({
        command: 'env check',
        flags: { environmentId: { name: 'env' } },
        action: 'rel.environments/read',
      }),
      description:
        'Requires the `rel.environments` `read` setting. Runs the driver check against the stored settings.',
      responses: {
        200: dataResponse(ReleasesEnvironmentCheckSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
        503: apiErrorResponse(
          503,
          'The environment’s driver is not available (`DRIVER_UNAVAILABLE`).',
        ),
      },
    }),
    apiValidator('param', EnvironmentParams),
    async (context) =>
      context.json({
        data: await services.environments.check(
          person(context),
          context.req.valid('param').environmentId,
        ),
      }),
  );

  // --- Environment variables ---
  api.get(
    '/environments/:environmentId/variables',
    settings('read'),
    describeRoute({
      tags,
      summary: "List an environment's variables",
      operationId: 'releasesListEnvironmentVariables',
      ...cliRoute({
        command: 'env var list',
        args: ['environmentId'],
        flags: { environmentId: { name: 'env' } },
        columns: ['name', 'secret', 'value', 'updatedAt'],
        action: 'rel.environments/read',
      }),
      description:
        'Requires the `rel.environments` `read` setting. Every App of the environment gets these unless it sets its own. A secret’s value is never returned.',
      responses: {
        200: listResponse(ReleasesEnvironmentVariableSchema, ReleasesTotalMeta),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    noStore,
    apiValidator('param', EnvironmentParams),
    async (context) => {
      const data = await services.environments.listVariables(
        person(context),
        context.req.valid('param').environmentId,
      );
      return context.json({ data, meta: { total: data.length } });
    },
  );
  api.get(
    '/environments/:environmentId/declaredVariables',
    settings('read'),
    describeRoute({
      tags,
      summary: "List the variables an environment's Apps declare",
      operationId: 'releasesListEnvironmentDeclaredVariables',
      ...cliRoute({
        command: 'env var declared',
        args: ['environmentId'],
        flags: { environmentId: { name: 'env' } },
        columns: ['name', 'required', 'set', 'apps', 'missingIn'],
        action: 'rel.environments/read',
      }),
      description:
        'Requires the `rel.environments` `read` setting. The variables the most recent build of each App of the environment declares (its newest release with a variables manifest), merged by name: which Apps declare each, whether the environment sets it, and which Apps require it and get no value. Only Apps the caller may view count. No value is returned.',
      responses: {
        200: listResponse(
          ReleasesEnvironmentDeclaredVariableSchema,
          ReleasesTotalMeta,
        ),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    noStore,
    apiValidator('param', EnvironmentParams),
    async (context) => {
      const data = await services.releases.listEnvironmentDeclaredVariables(
        person(context),
        context.req.valid('param').environmentId,
      );
      return context.json({ data, meta: { total: data.length } });
    },
  );
  api.put(
    '/environments/:environmentId/variables/:name',
    settings('manage'),
    describeRoute({
      tags,
      summary: "Set an environment's variable",
      operationId: 'releasesSetEnvironmentVariable',
      ...cliRoute({
        command: 'env var set',
        args: ['environmentId', 'name', 'value'],
        flags: {
          environmentId: { name: 'env' },
          value: { fromEnv: 'name' },
        },
        examples: [
          'env var set preview SMTP_HOST smtp.example.com',
          'env var set preview SMTP_PASSWORD --from-env',
        ],
        action: 'rel.environments/manage',
      }),
      description:
        'Requires the `rel.environments` `manage` setting. Every App of the environment gets it with its next deployment, unless the App sets its own. A name the runtime sets itself (`NODE_ENV`, `APP_BASE_PATH`, …) is refused (`VARIABLE_RESERVED`).',
      responses: {
        200: dataResponse(ReleasesEnvironmentVariableSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    noStore,
    apiValidator('param', EnvironmentVariableParams),
    apiValidator('json', SetEnvironmentVariableBody),
    async (context) => {
      const caller = person(context);
      const { environmentId, name } = context.req.valid('param');
      const variable = await services.environments.setVariable(
        caller,
        environmentId,
        name,
        context.req.valid('json'),
      );
      log('releases.environment.variable.set', {
        actorId: caller.userId,
        environmentId,
        name,
      });
      return context.json({ data: variable });
    },
  );
  api.delete(
    '/environments/:environmentId/variables/:name',
    settings('manage'),
    describeRoute({
      tags,
      summary: "Remove an environment's variable",
      operationId: 'releasesDeleteEnvironmentVariable',
      ...cliRoute({
        command: 'env var unset',
        args: ['environmentId', 'name'],
        flags: { environmentId: { name: 'env' } },
        action: 'rel.environments/manage',
      }),
      description: 'Requires the `rel.environments` `manage` setting.',
      responses: {
        204: emptyResponse(),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', EnvironmentVariableParams),
    async (context) => {
      const caller = person(context);
      const { environmentId, name } = context.req.valid('param');
      await services.environments.unsetVariable(caller, environmentId, name);
      log('releases.environment.variable.unset', {
        actorId: caller.userId,
        environmentId,
        name,
      });
      return context.body(null, 204);
    },
  );

  // --- Image registries. `check` is a fixed segment, as for environments. ---
  api.get(
    '/registries',
    settings('read'),
    describeRoute({
      tags,
      summary: 'List image registries',
      operationId: 'releasesListRegistries',
      ...cliRoute({
        command: 'registry list',
        columns: ['id', 'name', 'host', 'namespace', 'environmentIds'],
        action: 'rel.environments/read',
      }),
      description: 'Requires the `rel.environments` `read` setting.',
      responses: {
        200: listResponse(ReleasesRegistrySchema, ReleasesTotalMeta),
        ...apiErrorResponses,
      },
    }),
    async (context) => {
      const data = await services.registries.list(person(context));
      return context.json({ data, meta: { total: data.length } });
    },
  );
  api.post(
    '/registries',
    settings('manage'),
    describeRoute({
      tags,
      summary: 'Create an image registry',
      operationId: 'releasesCreateRegistry',
      ...cliRoute({
        command: 'registry create',
        args: ['id'],
        flags: { id: { name: 'registry' } },
        bodyFile: 'file',
        examples: [
          'registry create ghcr --name GHCR --url https://ghcr.io --namespace my-org',
        ],
        action: 'rel.environments/manage',
      }),
      description:
        'Requires the `rel.environments` `manage` setting. The pull password is write-only and never returned.',
      responses: {
        201: dataResponse(ReleasesRegistrySchema, 'The created registry.'),
        ...apiErrorResponses,
        409: apiErrorResponse(
          409,
          'A registry with this ID exists (`REGISTRY_EXISTS`).',
        ),
      },
    }),
    apiValidator('json', CreateRegistryBody),
    async (context) => {
      const caller = person(context);
      const registry = await services.registries.create(
        caller,
        context.req.valid('json'),
      );
      log('releases.registry.create', {
        actorId: caller.userId,
        registryId: registry.id,
      });
      return context.json({ data: registry }, 201);
    },
  );
  // Settings tried before they are saved, from the registry form.
  api.post(
    '/registries/check',
    settings('manage'),
    describeRoute({
      tags,
      summary: 'Check unsaved registry settings',
      operationId: 'releasesCheckRegistryDraft',
      // The registry form's dry run; `registry check` checks a saved one.
      ...cliRoute(false),
      description:
        'Requires the `rel.environments` `manage` setting. `id` names a stored registry whose passwords fill in the ones not given.',
      responses: {
        200: dataResponse(ReleasesRegistryCheckSchema),
        ...apiErrorResponses,
      },
    }),
    apiValidator('json', CheckRegistryBody),
    async (context) =>
      context.json({
        data: await services.registries.checkDraft(
          person(context),
          context.req.valid('json'),
        ),
      }),
  );
  api.get(
    '/registries/:registryId',
    settings('read'),
    describeRoute({
      tags,
      summary: 'Get an image registry',
      operationId: 'releasesGetRegistry',
      ...cliRoute({
        command: 'registry get',
        flags: { registryId: { name: 'registry' } },
        action: 'rel.environments/read',
      }),
      description: 'Requires the `rel.environments` `read` setting.',
      responses: {
        200: dataResponse(ReleasesRegistrySchema),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', RegistryParams),
    async (context) =>
      context.json({
        data: await services.registries.get(
          person(context),
          context.req.valid('param').registryId,
        ),
      }),
  );
  api.patch(
    '/registries/:registryId',
    settings('manage'),
    describeRoute({
      tags,
      summary: 'Update an image registry',
      operationId: 'releasesUpdateRegistry',
      ...cliRoute({
        command: 'registry update',
        flags: { registryId: { name: 'registry' } },
        bodyFile: 'file',
        action: 'rel.environments/manage',
      }),
      description: 'Requires the `rel.environments` `manage` setting.',
      responses: {
        200: dataResponse(ReleasesRegistrySchema),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', RegistryParams),
    apiValidator('json', UpdateRegistryBody),
    async (context) => {
      const caller = person(context);
      const registry = await services.registries.update(
        caller,
        context.req.valid('param').registryId,
        context.req.valid('json'),
      );
      log('releases.registry.update', {
        actorId: caller.userId,
        registryId: registry.id,
      });
      return context.json({ data: registry });
    },
  );
  api.delete(
    '/registries/:registryId',
    settings('manage'),
    describeRoute({
      tags,
      summary: 'Delete an image registry',
      operationId: 'releasesDeleteRegistry',
      ...cliRoute({
        command: 'registry delete',
        flags: { registryId: { name: 'registry' } },
        confirm: 'Delete the image registry?',
        action: 'rel.environments/manage',
      }),
      description: 'Requires the `rel.environments` `manage` setting.',
      responses: {
        204: emptyResponse(),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', RegistryParams),
    async (context) => {
      const caller = person(context);
      const { registryId } = context.req.valid('param');
      await services.registries.remove(caller, registryId);
      log('releases.registry.remove', { actorId: caller.userId, registryId });
      return context.body(null, 204);
    },
  );
  api.post(
    '/registries/:registryId/check',
    settings('read'),
    describeRoute({
      tags,
      summary: 'Check an image registry',
      operationId: 'releasesCheckRegistry',
      ...cliRoute({
        command: 'registry check',
        flags: { registryId: { name: 'registry' } },
        action: 'rel.environments/read',
      }),
      description:
        'Requires the `rel.environments` `read` setting. Tries the stored settings and pull credentials against the registry.',
      responses: {
        200: dataResponse(ReleasesRegistryCheckSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', RegistryParams),
    async (context) =>
      context.json({
        data: await services.registries.check(
          person(context),
          context.req.valid('param').registryId,
        ),
      }),
  );

  // --- Apps ---
  api.get(
    '/apps',
    onApps('view'),
    describeRoute({
      tags,
      summary: 'List apps',
      operationId: 'releasesListApps',
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'app list',
        flags: {
          pageSize: { name: 'limit' },
          environmentId: { name: 'env' },
          q: { name: 'search' },
          label: { description: 'A label (key=value); repeat for more.' },
        },
        columns: [
          'app.id',
          'app.name',
          'environment.name',
          'runtime.state',
          'currentVersion',
          'url',
        ],
        action: 'rel.apps/view',
      }),
      description:
        'Requires the `view` action; lists the Apps it reaches. `q` searches, `label=key=value` (repeatable) filters by label.',
      responses: {
        200: listResponse(ReleasesAppSchema, ReleasesPageMeta),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', ListAppsQuery),
    async (context) => {
      const query = context.req.valid('query');
      const result = await services.releases.listApps(person(context), {
        page: query.page,
        pageSize: query.pageSize,
        ...(query.q === undefined ? {} : { search: query.q }),
        ...(query.environmentId === undefined
          ? {}
          : { environmentId: query.environmentId }),
        labels: parseLabelFilter(query.label),
      });
      return context.json({ data: result.items, meta: pageMeta(result) });
    },
  );
  api.post(
    '/apps',
    allow((caller) => guard.requireCreate(caller)),
    describeRoute({
      tags,
      summary: 'Create an app',
      operationId: 'releasesCreateApp',
      ...cliRoute({
        command: 'app create',
        examples: ['app create my-app --name "My App" --env staging'],
        args: ['id'],
        flags: {
          labels: {
            name: 'label',
            description: 'A label (key=value); repeat for more.',
          },
          id: { name: 'app' },
          environmentId: { name: 'env' },
        },
        action: 'rel.apps/create',
      }),
      description: 'Requires the `create` action on every App.',
      responses: {
        201: dataResponse(ReleasesAppSchema, 'The created App.'),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The environment is full (`ENVIRONMENT_FULL`).',
        ),
        409: apiErrorResponse(
          409,
          'An App with this ID exists (`APP_EXISTS`).',
        ),
      },
    }),
    apiValidator('json', CreateAppBody),
    async (context) => {
      const caller = person(context);
      const input = context.req.valid('json');
      const app = await referencedBy(
        {
          environmentId: {
            reason: 'ENVIRONMENT_NOT_FOUND',
            id: input.environmentId,
          },
        },
        () => services.releases.createApp(caller, input),
      );
      log('releases.app.create', { actorId: caller.userId, appId: app.app.id });
      return context.json({ data: app }, 201);
    },
  );
  api.get(
    '/apps/:appId',
    onApps('view'),
    describeRoute({
      tags,
      summary: 'Get an app',
      operationId: 'releasesGetApp',
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'app get',
        flags: { appId: { name: 'app' } },
        action: 'rel.apps/view',
      }),
      description:
        'Requires the `view` action on the App. The answer includes `allowed`, what the caller may do on it.',
      responses: {
        200: dataResponse(ReleasesAppSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', AppParams),
    async (context) =>
      context.json({
        data: await services.releases.getApp(
          person(context),
          context.req.valid('param').appId,
        ),
      }),
  );
  api.patch(
    '/apps/:appId',
    onApps('configure'),
    describeRoute({
      tags,
      summary: 'Update an app',
      operationId: 'releasesUpdateApp',
      ...cliRoute({
        command: 'app update',
        flags: {
          appId: { name: 'app' },
          labels: {
            name: 'label',
            description: 'A label (key=value); repeat for more.',
          },
        },
        action: 'rel.apps/configure',
      }),
      description:
        'Requires the `configure` action on the App. People only: agents and keys are refused.',
      responses: {
        200: dataResponse(ReleasesAppSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', AppParams),
    apiValidator('json', UpdateAppBody),
    async (context) => {
      const caller = person(context);
      const { appId } = context.req.valid('param');
      const app = await services.releases.updateApp(
        caller,
        appId,
        context.req.valid('json'),
      );
      log('releases.app.update', { actorId: caller.userId, appId });
      return context.json({ data: app });
    },
  );
  api.delete(
    '/apps/:appId',
    onApps('delete'),
    describeRoute({
      tags,
      summary: 'Delete an app',
      operationId: 'releasesDeleteApp',
      ...cliRoute({
        command: 'app delete',
        flags: {
          appId: { name: 'app' },
          confirm: { description: 'The App ID again.' },
        },
        action: 'rel.apps/delete',
        confirm: 'Delete the App with its data?',
      }),
      description:
        'Requires the `delete` action on the App. People only. Removes the App with its releases and data; `confirm` must repeat the App ID.',
      responses: {
        204: emptyResponse(),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          '`confirm` does not repeat the App ID (`CONFIRMATION_REQUIRED`).',
        ),
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', AppParams),
    apiValidator('query', DeleteAppQuery),
    async (context) => {
      const caller = person(context);
      const { appId } = context.req.valid('param');
      await services.releases.deleteApp(caller, appId, {
        confirm: context.req.valid('query').confirm,
      });
      log('releases.app.delete', { actorId: caller.userId, appId });
      return context.body(null, 204);
    },
  );
  const operations = {
    start: { summary: 'Start an app', operationId: 'releasesStartApp' },
    stop: { summary: 'Stop an app', operationId: 'releasesStopApp' },
    restart: { summary: 'Restart an app', operationId: 'releasesRestartApp' },
  } as const;
  for (const operation of ['start', 'stop', 'restart'] as const)
    api.post(
      `/apps/:appId/${operation}`,
      onApps('operate'),
      describeRoute({
        tags,
        ...operations[operation],
        description: 'Requires the `operate` action on the App.',
        ...cliRoute({
          command: `app ${operation}`,
          flags: { appId: { name: 'app' } },
          action: 'rel.apps/operate',
        }),
        responses: {
          200: dataResponse(
            ReleasesAppSchema,
            'The App with its runtime status.',
          ),
          ...apiErrorResponses,
          400: apiErrorResponse(
            400,
            'The App has never been deployed (`APP_NOT_DEPLOYED`).',
          ),
          404: apiErrorResponse(404),
          503: apiErrorResponse(
            503,
            'The environment’s driver is not available (`DRIVER_UNAVAILABLE`).',
          ),
        },
      }),
      apiValidator('param', AppParams),
      async (context) => {
        const caller = person(context);
        const { appId } = context.req.valid('param');
        const app = await services.releases[operation](caller, appId);
        log(`releases.app.${operation}`, { actorId: caller.userId, appId });
        return context.json({ data: app });
      },
    );

  // --- Configuration ---
  api.get(
    '/apps/:appId/config',
    onApps('configure'),
    describeRoute({
      tags,
      summary: "Read an app's configuration",
      operationId: 'releasesGetAppConfig',
      ...cliRoute({
        command: 'app config get',
        flags: { appId: { name: 'app' } },
        action: 'rel.apps/configure',
      }),
      description:
        'Requires the `configure` action on the App. People only. Secret values are masked and never returned.',
      responses: {
        200: dataResponse(ReleasesConfigSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    noStore,
    apiValidator('param', AppParams),
    async (context) =>
      context.json({
        data: await services.releases.readConfig(
          person(context),
          context.req.valid('param').appId,
        ),
      }),
  );
  api.put(
    '/apps/:appId/config',
    onApps('configure'),
    describeRoute({
      tags,
      summary: "Replace an app's configuration",
      operationId: 'releasesReplaceAppConfig',
      ...cliRoute({
        command: 'app config set',
        flags: {
          appId: { name: 'app' },
          content: {
            contentFile: true,
            description: 'The configuration, as YAML.',
          },
        },
        action: 'rel.apps/configure',
      }),
      description:
        'Requires the `configure` action on the App. People only. Saves the running deployment’s `config.yml` and asks the runtime to reload it; a masked value keeps the stored secret, `secretChanges` set or remove secrets.',
      responses: {
        200: dataResponse(
          ReleasesConfigSchema,
          'The saved configuration, masked.',
        ),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The App has no file configuration to edit (`CONFIG_NOT_EDITABLE`).',
        ),
        404: apiErrorResponse(404),
      },
    }),
    noStore,
    apiValidator('param', AppParams),
    apiValidator('json', UpdateConfigBody),
    async (context) => {
      const caller = person(context);
      const { appId } = context.req.valid('param');
      const { content, secretChanges } = context.req.valid('json');
      const result = await services.releases.updateConfig(
        caller,
        appId,
        content,
        { secretChanges },
      );
      log('releases.config.update', { actorId: caller.userId, appId });
      return context.json({ data: result });
    },
  );

  // --- Variables ---
  api.get(
    '/apps/:appId/variables',
    onApps('view'),
    describeRoute({
      tags,
      summary: "List an app's variables",
      operationId: 'releasesListAppVariables',
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'app env list',
        args: ['appId'],
        flags: { appId: { name: 'app' }, releaseId: { name: 'release' } },
        columns: ['name', 'source', 'value', 'required', 'missing'],
        action: 'rel.apps/view',
      }),
      description:
        'Requires the `view` action on the App. The variables its release declares and those set on it or its environment, with where each value comes from (`source`) and whether a required one is `missing`. A secret’s value is never returned.',
      responses: {
        200: listResponse(ReleasesAppVariableSchema, ReleasesAppVariablesMeta),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    noStore,
    apiValidator('param', AppParams),
    apiValidator('query', AppVariablesQuery),
    async (context) => {
      const { items, meta } = await services.releases.listAppVariables(
        person(context),
        context.req.valid('param').appId,
        context.req.valid('query'),
      );
      return context.json({ data: items, meta });
    },
  );
  api.put(
    '/apps/:appId/variables/:name',
    onApps('configure'),
    describeRoute({
      tags,
      summary: "Set an app's variable",
      operationId: 'releasesSetAppVariable',
      ...cliRoute({
        command: 'app env set',
        args: ['appId', 'name', 'value'],
        flags: { appId: { name: 'app' }, value: { fromEnv: 'name' } },
        examples: [
          'app env set crm-staging SMTP_HOST smtp.example.com',
          'app env set crm-staging SMTP_PASSWORD --from-env',
        ],
        action: 'rel.apps/configure',
      }),
      description:
        'Requires the `configure` action on the App. People only. It reaches the App with its next deployment. A name the runtime sets itself is refused (`VARIABLE_RESERVED`).',
      responses: {
        200: dataResponse(ReleasesAppVariableSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    noStore,
    apiValidator('param', AppVariableParams),
    apiValidator('json', SetAppVariableBody),
    async (context) => {
      const caller = person(context);
      const { appId, name } = context.req.valid('param');
      const variable = await services.releases.setAppVariable(
        caller,
        appId,
        name,
        context.req.valid('json'),
      );
      log('releases.app.variable.set', { actorId: caller.userId, appId, name });
      return context.json({ data: variable });
    },
  );
  api.delete(
    '/apps/:appId/variables/:name',
    onApps('configure'),
    describeRoute({
      tags,
      summary: "Remove an app's variable",
      operationId: 'releasesDeleteAppVariable',
      ...cliRoute({
        command: 'app env unset',
        args: ['appId', 'name'],
        flags: { appId: { name: 'app' } },
        action: 'rel.apps/configure',
      }),
      description:
        'Requires the `configure` action on the App. People only. Removes the App’s value; its environment’s applies again.',
      responses: {
        204: emptyResponse(),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', AppVariableParams),
    async (context) => {
      const caller = person(context);
      const { appId, name } = context.req.valid('param');
      await services.releases.unsetAppVariable(caller, appId, name);
      log('releases.app.variable.unset', {
        actorId: caller.userId,
        appId,
        name,
      });
      return context.body(null, 204);
    },
  );
  // The first administrator a first deployment generated: a person copies it from the App page, never a script.
  api.get(
    '/apps/:appId/initialAdmin',
    onApps('deploy'),
    describeRoute({
      tags,
      summary: "Read an app's generated first administrator",
      operationId: 'releasesGetInitialAdmin',
      // A password: it stays out of the command line, so it never lands in a terminal's history or an agent's log.
      ...cliRoute(false),
      description:
        'Requires the `deploy` action on the App. People only: agents and keys are refused. The first administrator its first deployment generated, until someone saves it (`dismiss`) or 24 hours pass (a preview App’s stays until the App goes).',
      responses: {
        200: dataResponse(ReleasesInitialAdminSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(
          404,
          'Nothing to show: it was saved or expired, or none was generated (`INITIAL_ADMIN_UNAVAILABLE`).',
        ),
      },
    }),
    noStore,
    apiValidator('param', AppParams),
    async (context) =>
      context.json({
        data: await services.releases.readInitialAdmin(
          person(context),
          context.req.valid('param').appId,
        ),
      }),
  );
  api.post(
    '/apps/:appId/initialAdmin/dismiss',
    onApps('deploy'),
    describeRoute({
      tags,
      summary: "Forget an app's generated first administrator",
      operationId: 'releasesDismissInitialAdmin',
      ...cliRoute(false),
      description:
        'Requires the `deploy` action on the App. People only. Deletes the generated first administrator once someone has saved it.',
      responses: {
        204: emptyResponse(),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', AppParams),
    async (context) => {
      const caller = person(context);
      const { appId } = context.req.valid('param');
      await services.releases.dismissInitialAdmin(caller, appId);
      log('releases.app.initialAdmin.dismiss', {
        actorId: caller.userId,
        appId,
      });
      return context.body(null, 204);
    },
  );

  // --- Releases ---
  api.get(
    '/apps/:appId/releases',
    onApps('view'),
    describeRoute({
      tags,
      summary: "List an app's releases",
      operationId: 'releasesListReleases',
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'release list',
        flags: {
          pageSize: { name: 'limit' },
          appId: { name: 'app' },
          label: { description: 'A label (key=value); repeat for more.' },
        },
        columns: ['id', 'version', 'createdAt', 'createdVia'],
        action: 'rel.apps/view',
      }),
      description:
        'Requires the `view` action on the App. `label=key=value` (repeatable) filters by label.',
      responses: {
        200: listResponse(ReleasesReleaseSchema, ReleasesPageMeta),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', AppParams),
    apiValidator('query', ListReleasesQuery),
    async (context) => {
      const query = context.req.valid('query');
      const releases = await services.releases.listReleases(
        person(context),
        context.req.valid('param').appId,
        { labels: parseLabelFilter(query.label) },
      );
      const start = (query.page - 1) * query.pageSize;
      return context.json({
        data: releases.slice(start, start + query.pageSize),
        meta: pageMeta({ ...query, total: releases.length }),
      });
    },
  );
  // The archive is the body, as `application/gzip`; only its headers can be validated before it is read.
  api.post(
    '/apps/:appId/releases',
    async (context, next) => {
      // Uploading needs `upload`, and deploying it too needs `deploy`: the services check both against the caller,
      // whose permissions a scoped key or a ticket has already narrowed.
      const bearer = context.get('releasesBearer');
      if (bearer?.kind === 'ticket')
        await services.tickets.verify(
          bearer.token,
          context.req.param('appId') ?? '',
        );
      else guard.requireAnyApp(person(context), 'upload');
      await next();
    },
    describeRoute({
      tags,
      summary: 'Upload a release',
      operationId: 'releasesUploadRelease',
      // The archive upload itself: a binary body, reached with an upload ticket; `release upload` streams to the application's.
      ...cliRoute(false),
      description:
        'Requires the `upload` action on the App, and `deploy` too when it deploys. Besides a session or an API key, an upload ticket from `POST /api/releases/apps/{appId}/uploadTickets` authenticates this route alone: `Authorization: Bearer rel_ticket_…`, valid for one upload to that App before it expires. The body is the release archive (`dist.tar.gz`). `X-Artifact-SHA256` is checked against it; `X-Release-Deploy: true` deploys it as well (a deploying ticket deploys unless the header says `false`), and is refused on a protected environment; `X-Release-Labels` is a JSON object of labels.',
      requestBody: {
        required: true,
        content: {
          'application/gzip': { schema: { type: 'string', format: 'binary' } },
          'application/octet-stream': {
            schema: { type: 'string', format: 'binary' },
          },
        },
      },
      responses: {
        200: dataResponse(
          ReleasesReleaseSchema,
          'The same archive was uploaded before (same checksum or idempotency key): its release, with `reused`.',
        ),
        201: dataResponse(ReleasesReleaseSchema, 'The created release.'),
        202: dataResponse(
          ReleasesReleaseSchema,
          'The created release, whose deployment (`deploymentId`) has started.',
        ),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The archive is invalid or does not match its checksum, or its variables manifest is (`INVALID_VARIABLES_MANIFEST`), or deploying it is refused (`APPROVAL_REQUIRED` on a protected environment, `DEPLOYMENT_IN_PROGRESS`, `VARIABLES_MISSING`: the release is kept, and deploys by its ID once the variables are set).',
        ),
        404: apiErrorResponse(404),
        409: apiErrorResponse(
          409,
          'The idempotency key was used for another archive (`IDEMPOTENCY_CONFLICT`).',
        ),
        413: apiErrorResponse(
          413,
          'The archive exceeds the size limit (`ARTIFACT_TOO_LARGE`).',
        ),
        415: apiErrorResponse(
          415,
          'The body is not `application/gzip` or `application/octet-stream` (`INVALID_CONTENT_TYPE`).',
        ),
      },
    }),
    apiValidator('param', AppParams),
    apiValidator('header', UploadHeaders),
    async (context) => {
      const { appId } = context.req.valid('param');
      const headers = context.req.valid('header');
      const contentType = headers['content-type']?.split(';')[0]?.trim();
      if (!contentType || !UPLOAD_CONTENT_TYPES.includes(contentType))
        throw new ReleasesError(
          'Use application/gzip for release uploads.',
          'INVALID_CONTENT_TYPE',
          'INVALID_ARGUMENT',
          { httpStatus: 415 },
        );
      const deployHeader = headers['x-release-deploy'];
      const labels =
        headers['x-release-labels'] === undefined
          ? undefined
          : parseLabelsHeader(headers['x-release-labels']);
      let deploy = deployHeader === 'true';
      const bearer = context.get('releasesBearer');
      let caller: Caller;
      let ticketId: string | undefined;
      if (bearer?.kind === 'ticket') {
        const ticket = await services.tickets.consume(bearer.token, appId);
        caller = ticket.caller;
        ticketId = ticket.ticketId;
        // A deploying ticket deploys unless the upload says otherwise; a plain one never does.
        if (deployHeader === undefined) deploy = ticket.deploy;
        if (deploy && !ticket.deploy)
          throw new ReleasesError(
            'This ticket does not deploy.',
            'TICKET_FORBIDDEN',
            'PERMISSION_DENIED',
          );
      } else {
        caller = person(context);
      }
      const chunks = requestChunks(context.req.raw);
      try {
        const release = await services.releases.uploadRelease(caller, appId, {
          stream: chunks,
          checksum: headers['x-artifact-sha256'],
          idempotencyKey: headers['idempotency-key'],
          labels,
          sourceCommit: headers['x-release-source-commit'],
          build: headers['x-release-build'],
          ...(deploy ? { deploy: {} } : {}),
        });
        if (ticketId)
          await services.tickets.recordRelease(ticketId, release.id);
        log('releases.release.upload', {
          actorId: caller.userId,
          via: caller.kind,
          appId,
          releaseId: release.id,
        });
        // An upload that also deploys answers before the deployment finishes; its progress is the deployment's.
        return context.json(
          { data: release },
          release.reused ? 200 : release.deploymentId ? 202 : 201,
        );
      } finally {
        await chunks.return(undefined);
      }
    },
  );
  api.get(
    '/apps/:appId/releases/:releaseId',
    onApps('view'),
    describeRoute({
      tags,
      summary: 'Get a release',
      operationId: 'releasesGetRelease',
      ...cliRoute({
        command: 'release get',
        flags: { appId: { name: 'app' }, releaseId: { name: 'release' } },
        action: 'rel.apps/view',
      }),
      description: 'Requires the `view` action on the App.',
      responses: {
        200: dataResponse(ReleasesReleaseSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', ReleaseParams),
    async (context) => {
      const { appId, releaseId } = context.req.valid('param');
      return context.json({
        data: await services.releases.getRelease(
          person(context),
          appId,
          releaseId,
        ),
      });
    },
  );
  api.patch(
    '/apps/:appId/releases/:releaseId',
    onApps('upload'),
    describeRoute({
      tags,
      summary: "Replace a release's labels",
      operationId: 'releasesLabelRelease',
      ...cliRoute({
        command: 'release update',
        flags: {
          appId: { name: 'app' },
          releaseId: { name: 'release' },
          labels: {
            name: 'label',
            description:
              'A label (key=value); repeat for more. Replaces every label.',
          },
        },
        action: 'rel.apps/upload',
      }),
      description: 'Requires the `upload` action on the App.',
      responses: {
        200: dataResponse(ReleasesReleaseSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', ReleaseParams),
    apiValidator('json', LabelReleaseBody),
    async (context) => {
      const { appId, releaseId } = context.req.valid('param');
      return context.json({
        data: await services.releases.labelRelease(
          person(context),
          appId,
          releaseId,
          context.req.valid('json').labels,
        ),
      });
    },
  );
  api.get(
    '/apps/:appId/releases/:releaseId/configTemplate',
    onApps('configure'),
    describeRoute({
      tags,
      summary: "Read a release's configuration template",
      operationId: 'releasesGetReleaseConfigTemplate',
      ...cliRoute({
        command: 'release config-template',
        flags: { appId: { name: 'app' }, releaseId: { name: 'release' } },
        action: 'rel.apps/configure',
      }),
      description: 'Requires the `configure` action on the App. People only.',
      responses: {
        200: dataResponse(ReleasesConfigTemplateSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    noStore,
    apiValidator('param', ReleaseParams),
    async (context) => {
      const { appId, releaseId } = context.req.valid('param');
      return context.json({
        data: {
          content: await services.releases.readConfigTemplate(
            person(context),
            appId,
            releaseId,
          ),
        },
      });
    },
  );
  api.get(
    '/apps/:appId/releases/:releaseId/variables',
    onApps('view'),
    describeRoute({
      tags,
      summary: "Read a release's variables manifest",
      operationId: 'releasesGetReleaseVariables',
      ...cliRoute({
        command: 'release variables',
        args: ['appId', 'releaseId'],
        flags: { appId: { name: 'app' }, releaseId: { name: 'release' } },
        action: 'rel.apps/view',
      }),
      description:
        'Requires the `view` action on the App. The variables the build declared (`dist/variables.json`); null for a build without a manifest.',
      responses: {
        200: dataResponse(ReleasesVariablesManifestSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', ReleaseParams),
    async (context) => {
      const { appId, releaseId } = context.req.valid('param');
      return context.json({
        data: await services.releases.readReleaseVariables(
          person(context),
          appId,
          releaseId,
        ),
      });
    },
  );
  api.post(
    '/apps/:appId/releases/:releaseId/promote',
    onApps('upload'),
    describeRoute({
      tags,
      summary: 'Promote a release to another app',
      operationId: 'releasesPromoteRelease',
      ...cliRoute({
        command: 'release promote',
        flags: {
          labels: {
            name: 'label',
            description: 'A label (key=value); repeat for more.',
          },
          appId: { name: 'app' },
          releaseId: { name: 'release' },
          toAppId: { name: 'to' },
        },
        action: 'rel.apps/upload',
      }),
      description:
        'Requires the `view` action on this App and `upload` on `toAppId`. Copies the release into `toAppId`, or answers the release it already has with the same checksum.',
      responses: {
        200: dataResponse(
          ReleasesReleaseSchema,
          'The release in the target App.',
        ),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', ReleaseParams),
    apiValidator('json', PromoteBody),
    async (context) => {
      const caller = person(context);
      const { appId, releaseId } = context.req.valid('param');
      const { toAppId, labels } = context.req.valid('json');
      const release = await referencedBy(
        toAppId === appId
          ? {}
          : { toAppId: { reason: 'APP_NOT_FOUND', id: toAppId } },
        () =>
          services.releases.promoteRelease(
            caller,
            appId,
            releaseId,
            toAppId,
            labels === undefined ? {} : { labels },
          ),
      );
      log('releases.release.promote', {
        actorId: caller.userId,
        appId: toAppId,
        releaseId: release.id,
      });
      return context.json({ data: release });
    },
  );
  // An image CI built and pushed, registered by digest as a release (`upload` on the App).
  api.post(
    '/apps/:appId/imageReleases',
    onApps('upload'),
    describeRoute({
      tags,
      summary: 'Register an image release',
      operationId: 'releasesRegisterImageRelease',
      ...cliRoute({
        command: 'release image',
        flags: {
          labels: {
            name: 'label',
            description: 'A label (key=value); repeat for more.',
          },
          appId: { name: 'app' },
          sourceCommit: { name: 'commit' },
          variables: {
            contentFile: true,
            description:
              'The build’s variables manifest; pass `--variables-file dist/variables.json`.',
          },
        },
        examples: [
          'release image crm --version 1.4.0 --ref ghcr.io/acme/crm --digest sha256:… --variables-file dist/variables.json',
        ],
        action: 'rel.apps/upload',
      }),
      description:
        'Requires the `upload` action on the App. Registers an OCI image CI built and pushed, by digest, as a release of `version`; another platform’s image of the same version joins that release.',
      responses: {
        200: dataResponse(
          ReleasesReleaseSchema,
          'The digest is registered already: its release, with `reused`.',
        ),
        201: dataResponse(ReleasesReleaseSchema, 'The created release.'),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', AppParams),
    apiValidator('json', RegisterImageReleaseBody),
    async (context) => {
      const caller = person(context);
      const { appId } = context.req.valid('param');
      const { deploy, ...input } = context.req.valid('json');
      const release = await services.releases.registerImageRelease(
        caller,
        appId,
        input,
      );
      log('releases.release.image', {
        actorId: caller.userId,
        via: caller.kind,
        appId,
        releaseId: release.id,
      });
      if (!deploy)
        return context.json({ data: release }, release.reused ? 200 : 201);
      const deployment = await services.releases.deploy(caller, appId, {
        releaseId: release.id,
      });
      log('releases.app.deploy', {
        actorId: caller.userId,
        via: caller.kind,
        appId,
        deploymentId: deployment.id,
      });
      return context.json(
        { data: { ...release, deploymentId: deployment.id } },
        release.reused ? 200 : 201,
      );
    },
  );
  api.post(
    '/apps/:appId/uploadTickets',
    onApps('upload'),
    describeRoute({
      tags,
      summary: 'Create an upload ticket',
      operationId: 'releasesCreateUploadTicket',
      // A credential for a script's own upload of the archive; the CLI uploads with `release upload` (such as an application's verified builds).
      ...cliRoute(false),
      description:
        'Requires the `upload` action on the App, and `deploy` for a deploying ticket. Issued to a person. The ticket is a one-time credential for `POST /api/releases/apps/{appId}/releases` sent as `Authorization: Bearer rel_ticket_…`; `ttlSeconds` defaults to 900. A ticket cannot deploy to a protected environment.',
      responses: {
        201: dataResponse(
          ReleasesUploadTicketSchema,
          'The ticket; its token is shown only here.',
        ),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The ticket would deploy to a protected environment (`TICKET_DEPLOY_REFUSED`).',
        ),
        404: apiErrorResponse(404),
      },
    }),
    noStore,
    apiValidator('param', AppParams),
    apiValidator('json', CreateUploadTicketBody),
    async (context) => {
      const caller = person(context);
      const { appId } = context.req.valid('param');
      const ticket = await services.tickets.create(
        caller,
        appId,
        context.req.valid('json'),
      );
      log('releases.ticket.create', {
        actorId: caller.userId,
        appId,
        ticketId: ticket.id,
      });
      return context.json({ data: ticket }, 201);
    },
  );

  // --- Deployments. Deploying answers 202 with the deployment, whose progress `GET` reads. ---
  api.post(
    '/apps/:appId/deploy',
    onApps('deploy'),
    describeRoute({
      tags,
      summary: 'Deploy a release',
      operationId: 'releasesDeployApp',
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'app deploy',
        examples: ['app deploy my-app --release <release> --wait true'],
        flags: {
          appId: { name: 'app' },
          releaseId: { name: 'release' },
          idempotencyKey: { hidden: true },
        },
        action: 'rel.apps/deploy',
      }),
      description:
        'Requires the `deploy` action on the App. A protected environment is deployed only through a deployment request an approver approves (`POST /apps/{appId}/deploymentRequests`), so deploying there directly is refused. The `Idempotency-Key` header, or `idempotencyKey`, answers a repeated request with its first deployment.',
      responses: {
        200: dataResponse(
          ReleasesDeploymentSchema,
          'With `wait=true`: the deployment, finished.',
        ),
        202: dataResponse(
          ReleasesDeploymentSchema,
          'The deployment, which continues in the background; read it for progress.',
        ),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The release is not given, the environment is protected (`APPROVAL_REQUIRED`: request the deployment instead), a deployment is in progress (`DEPLOYMENT_IN_PROGRESS`) or a required variable is not set (`VARIABLES_MISSING`, naming them in `metadata.variables`).',
        ),
        404: apiErrorResponse(404),
        409: apiErrorResponse(
          409,
          'The idempotency key was used for another request (`IDEMPOTENCY_CONFLICT`).',
        ),
      },
    }),
    apiValidator('param', AppParams),
    apiValidator('query', DeployQuery),
    apiValidator('header', IdempotencyHeaders),
    apiValidator('json', DeployBody),
    async (context) => {
      const caller = person(context);
      const { appId } = context.req.valid('param');
      const input = context.req.valid('json');
      const deployment = await referencedBy(
        { releaseId: { reason: 'RELEASE_NOT_FOUND', id: input.releaseId } },
        () =>
          services.releases.deploy(caller, appId, {
            ...input,
            idempotencyKey:
              context.req.valid('header')['idempotency-key'] ??
              input.idempotencyKey,
          }),
      );
      log('releases.app.deploy', {
        actorId: caller.userId,
        via: caller.kind,
        appId,
        deploymentId: deployment.id,
      });
      if (context.req.valid('query').wait !== 'true')
        return context.json({ data: deployment }, 202);
      const settled = await services.releases.waitForDeployment(
        deployment.id,
        100_000,
      );
      const finished =
        settled.status !== 'queued' && settled.status !== 'deploying';
      return context.json({ data: settled }, finished ? 200 : 202);
    },
  );
  api.post(
    '/apps/:appId/rollback',
    onApps('deploy'),
    describeRoute({
      tags,
      summary: 'Roll an app back',
      operationId: 'releasesRollbackApp',
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'app rollback',
        flags: { appId: { name: 'app' }, deploymentId: { name: 'deployment' } },
        action: 'rel.apps/deploy',
      }),
      description:
        'Requires the `deploy` action on the App. Deploys again the release of an earlier successful deployment; on a protected environment it is requested instead (`rollbackToDeploymentId`).',
      responses: {
        202: dataResponse(
          ReleasesDeploymentSchema,
          'The rollback deployment, which continues in the background.',
        ),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The target is not a successful deployment of this App (`INVALID_ROLLBACK_TARGET`), the environment is protected (`APPROVAL_REQUIRED`) or a deployment is in progress.',
        ),
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', AppParams),
    apiValidator('json', RollbackBody),
    async (context) => {
      const caller = person(context);
      const { appId } = context.req.valid('param');
      const input = context.req.valid('json');
      const deployment = await referencedBy(
        {
          deploymentId: {
            reason: 'DEPLOYMENT_NOT_FOUND',
            id: input.deploymentId,
          },
        },
        () => services.releases.rollback(caller, appId, input),
      );
      log('releases.app.rollback', {
        actorId: caller.userId,
        appId,
        deploymentId: deployment.id,
      });
      return context.json({ data: deployment }, 202);
    },
  );
  api.get(
    '/apps/:appId/deployments',
    onApps('view'),
    describeRoute({
      tags,
      summary: "List an app's deployments",
      operationId: 'releasesListDeployments',
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'deploy list',
        flags: { appId: { name: 'app' }, pageSize: { name: 'limit' } },
        columns: [
          'id',
          'kind',
          'status',
          'phase',
          'release.version',
          'createdAt',
        ],
        action: 'rel.apps/view',
      }),
      description: 'Requires the `view` action on the App.',
      responses: {
        200: listResponse(ReleasesDeploymentSchema, ReleasesPageMeta),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', AppParams),
    apiValidator('query', PageQuery),
    async (context) => {
      const result = await services.releases.listDeployments(
        person(context),
        context.req.valid('param').appId,
        context.req.valid('query'),
      );
      return context.json({ data: result.items, meta: pageMeta(result) });
    },
  );
  // Whoever may deploy the App reads a deployment too, so CI holding only a deploying key can wait for the result.
  api.get(
    '/apps/:appId/deployments/:deploymentId',
    onApps('view', 'deploy'),
    describeRoute({
      tags,
      summary: 'Get a deployment',
      operationId: 'releasesGetDeployment',
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'deploy get',
        flags: { appId: { name: 'app' }, deploymentId: { name: 'deployment' } },
        action: 'rel.apps/view',
      }),
      description:
        'Requires the `view` or the `deploy` action on the App, so CI holding only a deploying key can wait for the result.',
      responses: {
        200: dataResponse(ReleasesDeploymentSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', DeploymentParams),
    async (context) => {
      const { appId, deploymentId } = context.req.valid('param');
      return context.json({
        data: await services.releases.getDeployment(
          person(context),
          appId,
          deploymentId,
        ),
      });
    },
  );
  api.get(
    '/apps/:appId/logs',
    onApps('read-logs'),
    describeRoute({
      tags,
      summary: "Read an app's runtime logs",
      operationId: 'releasesReadAppLogs',
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'app logs',
        flags: { appId: { name: 'app' }, q: { name: 'search' } },
        columns: ['time', 'level', 'msg'],
        action: 'rel.apps/read-logs',
      }),
      description:
        'Requires the `read-logs` action on the App. Not a stream: each read returns one bounded chunk as JSON. Read on with `pageToken` set to the previous `meta.nextPageToken`; reading the same token later returns what was appended since, so a client tails a log by polling. `meta.enabled` is false when the driver keeps no logs.',
      responses: {
        200: listResponse(ReleasesLogEntrySchema, ReleasesLogMeta),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          '`pageToken` is not a token this log issued (`INVALID_LOG_CURSOR`).',
        ),
        404: apiErrorResponse(404),
      },
    }),
    noStore,
    apiValidator('param', AppParams),
    apiValidator('query', LogQuery),
    async (context) =>
      context.json(
        await readLogs(
          person(context),
          context.req.valid('param').appId,
          context.req.valid('query'),
        ),
      ),
  );
  api.get(
    '/apps/:appId/deployments/:deploymentId/logs',
    onApps('read-logs'),
    describeRoute({
      tags,
      summary: "Read a deployment's logs",
      operationId: 'releasesReadDeploymentLogs',
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'deploy logs',
        flags: {
          appId: { name: 'app' },
          deploymentId: { name: 'deployment' },
          q: { name: 'search' },
        },
        columns: ['time', 'level', 'msg'],
        action: 'rel.apps/read-logs',
      }),
      description:
        'Requires the `read-logs` action on the App. Read like the App logs: one bounded JSON chunk per request, continued with `pageToken`; `meta.status` and `meta.phase` report the deployment’s progress.',
      responses: {
        200: listResponse(ReleasesLogEntrySchema, ReleasesLogMeta),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          '`pageToken` is not a token this log issued (`INVALID_LOG_CURSOR`).',
        ),
        404: apiErrorResponse(404),
      },
    }),
    noStore,
    apiValidator('param', DeploymentParams),
    apiValidator('query', LogQuery),
    async (context) => {
      const { appId, deploymentId } = context.req.valid('param');
      return context.json(
        await readLogs(
          person(context),
          appId,
          context.req.valid('query'),
          deploymentId,
        ),
      );
    },
  );

  // --- Deployment requests. Who may see or decide one depends on the request, so the services check it. ---
  api.get(
    '/deploymentRequests',
    signedIn,
    describeRoute({
      tags,
      summary: 'List deployment requests',
      operationId: 'releasesListDeploymentRequests',
      ...cliRoute({
        command: 'deploy request list',
        flags: {
          appId: { name: 'app' },
          pageSize: { name: 'limit' },
          awaitingMe: { name: 'awaiting-me' },
        },
        columns: [
          'id',
          'appId',
          'environmentId',
          'kind',
          'status',
          'createdAt',
        ],
        examples: ['deploy request list --awaiting-me true'],
      }),
      description:
        'Any signed-in caller; lists the requests on Apps they may view or requests they may decide. `awaitingMe=true` lists the pending requests the caller may decide.',
      responses: {
        200: listResponse(ReleasesDeploymentRequestSchema, ReleasesPageMeta),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', ListRequestsQuery),
    async (context) => {
      const { awaitingMe, ...query } = context.req.valid('query');
      const result = await services.requests.list(person(context), {
        ...query,
        awaitingMe: awaitingMe === 'true',
      });
      return context.json({ data: result.items, meta: pageMeta(result) });
    },
  );
  api.post(
    '/apps/:appId/deploymentRequests',
    onApps('deploy'),
    describeRoute({
      tags,
      summary: 'Request a deployment',
      operationId: 'releasesCreateDeploymentRequest',
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'deploy request',
        examples: [
          'deploy request my-app --release <release> --note "Ready for production"',
        ],
        flags: {
          labels: {
            name: 'label',
            description: 'A label (key=value); repeat for more.',
          },
          appId: { name: 'app' },
          releaseId: { name: 'release' },
          rollbackToDeploymentId: { name: 'rollback-to' },
          note: { contentFile: true },
        },
        action: 'rel.apps/deploy',
      }),
      description:
        'Requires the `deploy` action on the App. Asks for `releaseId` to be deployed, or with `rollbackToDeploymentId` for a rollback, to be approved by one of the environment’s approvers. On a protected environment this is the only way to deploy.',
      responses: {
        201: dataResponse(
          ReleasesDeploymentRequestSchema,
          'The pending request.',
        ),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The App already has a pending request (`REQUEST_PENDING`), or a required variable of the release is not set (`VARIABLES_MISSING`).',
        ),
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', AppParams),
    apiValidator('json', CreateRequestBody),
    async (context) => {
      const caller = person(context);
      const { appId } = context.req.valid('param');
      const input = context.req.valid('json');
      const request = await referencedBy(
        {
          releaseId: { reason: 'RELEASE_NOT_FOUND', id: input.releaseId },
          rollbackToDeploymentId: {
            reason: 'DEPLOYMENT_NOT_FOUND',
            id: input.rollbackToDeploymentId,
          },
        },
        () => services.requests.create(caller, appId, input),
      );
      log('releases.request.create', {
        actorId: caller.userId,
        appId,
        requestId: request.id,
      });
      return context.json({ data: request }, 201);
    },
  );
  api.get(
    '/deploymentRequests/:requestId',
    signedIn,
    describeRoute({
      tags,
      summary: 'Get a deployment request',
      operationId: 'releasesGetDeploymentRequest',
      ...cliRoute({
        command: 'deploy request get',
        flags: { requestId: { name: 'request' } },
      }),
      description:
        'The caller must be able to view the App or decide the request.',
      responses: {
        200: dataResponse(ReleasesDeploymentRequestSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', RequestParams),
    async (context) =>
      context.json({
        data: await services.requests.get(
          person(context),
          context.req.valid('param').requestId,
        ),
      }),
  );
  api.post(
    '/deploymentRequests/:requestId/approve',
    signedIn,
    describeRoute({
      tags,
      summary: 'Approve a deployment request',
      operationId: 'releasesApproveDeploymentRequest',
      ...cliRoute({
        command: 'deploy request approve',
        flags: {
          requestId: { name: 'request' },
          note: { contentFile: true },
          confirm: {
            description: 'The App ID again, for a protected environment.',
          },
        },
        confirm: 'Approve and deploy the release?',
        examples: [
          'deploy request approve <request> --note "Checked on staging"',
        ],
      }),
      description:
        'One of the environment’s approvers (with none named, a person holding `deploy-protected` on the App), other than the requester. Approving deploys the release the request fixed; `confirm` repeats the App ID on a protected environment.',
      responses: {
        200: dataResponse(
          ReleasesDeploymentRequestSchema,
          'The approved request, with its `deploymentId`.',
        ),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The request is decided already (`REQUEST_DECIDED`), a confirmation is missing (`CONFIRMATION_REQUIRED`) or a required variable is not set (`VARIABLES_MISSING`).',
        ),
        404: apiErrorResponse(404),
        409: apiErrorResponse(
          409,
          'The release changed since the request (`RELEASE_CHANGED`).',
        ),
      },
    }),
    apiValidator('param', RequestParams),
    apiValidator('json', ApproveRequestBody),
    async (context) => {
      const caller = person(context);
      const { requestId } = context.req.valid('param');
      const { note, confirm } = context.req.valid('json');
      const request = await services.requests.approve(
        caller,
        requestId,
        note,
        confirm,
      );
      log('releases.request.approve', { actorId: caller.userId, requestId });
      return context.json({ data: request });
    },
  );
  api.post(
    '/deploymentRequests/:requestId/reject',
    signedIn,
    describeRoute({
      tags,
      summary: 'Reject a deployment request',
      operationId: 'releasesRejectDeploymentRequest',
      ...cliRoute({
        command: 'deploy request reject',
        flags: { requestId: { name: 'request' }, note: { contentFile: true } },
      }),
      description:
        'One of the environment’s approvers, a person other than the requester.',
      responses: {
        200: dataResponse(ReleasesDeploymentRequestSchema),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The request is decided already (`REQUEST_DECIDED`).',
        ),
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', RequestParams),
    apiValidator('json', RejectRequestBody),
    async (context) => {
      const caller = person(context);
      const { requestId } = context.req.valid('param');
      const request = await services.requests.reject(
        caller,
        requestId,
        context.req.valid('json').note,
      );
      log('releases.request.reject', { actorId: caller.userId, requestId });
      return context.json({ data: request });
    },
  );
  api.post(
    '/deploymentRequests/:requestId/cancel',
    signedIn,
    describeRoute({
      tags,
      summary: 'Cancel a deployment request',
      operationId: 'releasesCancelDeploymentRequest',
      ...cliRoute({
        command: 'deploy request cancel',
        flags: { requestId: { name: 'request' } },
      }),
      description: 'The requester, or a caller who may decide it.',
      responses: {
        200: dataResponse(ReleasesDeploymentRequestSchema),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The request is decided already (`REQUEST_DECIDED`).',
        ),
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', RequestParams),
    apiValidator('json', EmptyBody),
    async (context) => {
      const caller = person(context);
      const { requestId } = context.req.valid('param');
      const request = await services.requests.cancel(caller, requestId);
      log('releases.request.cancel', { actorId: caller.userId, requestId });
      return context.json({ data: request });
    },
  );

  /** A log read: its entries as `data`, and the token to read on from (always present: a log keeps growing). */
  async function readLogs(
    caller: Caller,
    appId: string,
    query: {
      pageToken?: string;
      level?: string;
      source?: string;
      q?: string;
      since?: string;
      until?: string;
      fromStart?: 'true' | 'false';
    },
    deploymentId?: string,
  ): Promise<{
    readonly data: unknown[];
    readonly meta: Readonly<Record<string, unknown>>;
  }> {
    const { pageToken, q, fromStart, since, until, level, source } = query;
    const { entries, cursor, ...state } = await services.releases.readLogs(
      caller,
      appId,
      {
        ...(pageToken === undefined ? {} : { cursor: pageToken }),
        ...(level === undefined ? {} : { level }),
        ...(source === undefined ? {} : { source }),
        ...(q === undefined ? {} : { search: q }),
        // Entries store milliseconds in UTC and are compared as text, so the bounds take the same form.
        ...(since === undefined
          ? {}
          : { since: new Date(since).toISOString() }),
        ...(until === undefined
          ? {}
          : { until: new Date(until).toISOString() }),
        fromStart: fromStart === 'true',
      },
      deploymentId,
    );
    return { data: entries, meta: { ...state, nextPageToken: cursor } };
  }

  return api;
}

const noStore: MiddlewareHandler = async (context, next) => {
  context.header('Cache-Control', 'no-store');
  context.header('Pragma', 'no-cache');
  await next();
};

function pageMeta(result: Paging & { readonly total: number }): {
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

function parseLabelsHeader(value: string): Record<string, string> {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed))
      return parsed as Record<string, string>;
  } catch {
    // Reported below.
  }
  const violation: ApiFieldViolation = {
    field: 'x-release-labels',
    description: 'X-Release-Labels must be a JSON object.',
  };
  throw new ReleasesError(
    violation.description,
    'INVALID_LABELS',
    'INVALID_ARGUMENT',
    { fieldViolations: [violation] },
  );
}

async function* requestChunks(request: Request): AsyncGenerator<Uint8Array> {
  if (!request.body) return;
  const reader = request.body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      yield value;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

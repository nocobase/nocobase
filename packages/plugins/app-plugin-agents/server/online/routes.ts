/**
 * The online agents' model endpoints under `/api/agents` (`shared/models.ts` lists them): the catalog and a model check
 * for whoever picks a model for an agent, and the model services as an administrator manages them, behind
 * `agents.services` (read lists them; manage writes, reaches a provider or uses a key). Keys are never answered.
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
} from '@nocobase/app-server/router';
import type { Hono, MiddlewareHandler } from 'hono';

import type { SettingsAction } from '../../shared/access.js';
import type { Agents } from '../composition.js';
import { forbidden } from '../kernel/errors.js';
import { domainRouter } from '../kernel/http.js';
import type { AdminEnv } from '../routes/admin.js';
import { tags } from '../routes/openapi.js';
import {
  DefaultModelsSchema,
  ModelCatalogQuery,
  ModelCatalogServiceSchema,
  ModelCheckSchema,
  ModelServiceViewSchema,
  ProviderModelsSchema,
  ServiceParams,
} from '../routes/schemas.js';
import {
  ConnectionCheckSchema,
  ConnectionSchema,
  CreateServiceSchema,
  ModelRefSchema,
  UpdateServiceSchema,
} from './services.js';

/**
 * `guard` authenticates the request and sets `caller`; `scoped` does too, and lets a scoped API key through (the
 * services, whose every operation is a settings check).
 */
export function createModelRoutes(
  agents: Agents,
  guard: MiddlewareHandler<AdminEnv>,
  scoped: MiddlewareHandler<AdminEnv> = guard,
): Hono<AdminEnv> {
  const router = domainRouter<AdminEnv>();
  const { online } = agents;

  const allow =
    (
      item: 'agents.services' | 'agents.agents',
      action: SettingsAction,
    ): MiddlewareHandler<AdminEnv> =>
    async (context, next) => {
      if (!(await context.get('caller').can(item, action)))
        throw forbidden(`This needs ${item} ${action} permission.`);
      await next();
    };
  const serviceParam = apiValidator('param', ServiceParams);
  const invalidConnection = apiErrorResponse(
    400,
    'The connection is incomplete: no provider, or a base URL the provider needs is missing or not a URL (`INVALID_ARGUMENT`).',
  );
  const noService = apiErrorResponse(
    404,
    'No such model service (`MODEL_SERVICE_NOT_FOUND`).',
  );

  // The services and models of one kind (chat, which online agents use, by default); names only, never keys.
  router.get(
    '/models',
    guard,
    describeRoute({
      tags,
      summary: 'List the models of the model services',
      operationId: 'agentsListModels',
      ...cliRoute({
        command: 'model list',
        columns: ['name', 'title', 'provider', 'models'],
      }),
      description:
        'The enabled model services and their models of one kind (`chat` by default), for whoever picks a model; names only, never keys.',
      responses: {
        200: listResponse(ModelCatalogServiceSchema),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', ModelCatalogQuery),
    async (context) => {
      const { services } = await online.gateway.catalog(
        context.req.valid('query').kind,
      );
      return context.json({ data: services, meta: { total: services.length } });
    },
  );
  router.post(
    '/checkModel',
    guard,
    allow('agents.agents', 'read'),
    describeRoute({
      tags,
      summary: 'Check that a model answers',
      operationId: 'agentsCheckModel',
      ...cliRoute({
        command: 'model check',
        flags: { modelService: { name: 'service' } },
        examples: ['model check --service openai --model gpt-5'],
      }),
      description:
        'Asks a model of a saved model service for a short answer. Needs `agents.agents` read. A model that does not answer is `ok: false` with the reason, not an error.',
      responses: { 200: dataResponse(ModelCheckSchema), ...apiErrorResponses },
    }),
    apiValidator('json', ModelRefSchema),
    async (context) =>
      context.json({
        data: await online.gateway.check(context.req.valid('json')),
      }),
  );

  // The system default chat model: what online agents with no models of their own answer with.
  router.get(
    '/defaultModels',
    guard,
    describeRoute({
      tags,
      summary: 'Show the default models',
      operationId: 'agentsGetDefaultModels',
      ...cliRoute({ command: 'model default get' }),
      description:
        'The system default chat model online agents with no models of their own answer with: as set (`chat`), and as used now (`effectiveChat`), which is the first chat model an enabled service offers when none is set or the one set is no longer offered. Adding the first chat model sets it.',
      responses: {
        200: dataResponse(DefaultModelsSchema),
        ...apiErrorResponses,
      },
    }),
    async (context) => context.json({ data: await online.services.defaults() }),
  );
  router.put(
    '/defaultModels/chat',
    scoped,
    allow('agents.services', 'manage'),
    describeRoute({
      tags,
      summary: 'Set the default chat model',
      operationId: 'agentsSetDefaultChatModel',
      ...cliRoute({
        command: 'model default set',
        flags: { modelService: { name: 'service' } },
        examples: ['model default set --service openai --model gpt-5'],
      }),
      description:
        'Sets the chat model online agents with no models of their own answer with. It must be a chat model an enabled service offers. Needs `agents.services` manage.',
      responses: {
        200: dataResponse(DefaultModelsSchema),
        400: apiErrorResponse(
          400,
          'No enabled model service offers that chat model (`INVALID_REQUEST`).',
        ),
        ...apiErrorResponses,
      },
    }),
    apiValidator('json', ModelRefSchema),
    async (context) =>
      context.json({
        data: await online.services.setDefaultChat(
          context.req.valid('json'),
          context.get('caller').userId,
        ),
      }),
  );

  router.get(
    '/services',
    scoped,
    allow('agents.services', 'read'),
    describeRoute({
      tags,
      summary: 'List model services',
      operationId: 'agentsListModelServices',
      ...cliRoute({
        command: 'service list',
        columns: ['name', 'title', 'provider', 'enabled', 'apiKeySet'],
      }),
      description:
        'Needs `agents.services` read. Keys are never answered, only whether one is set.',
      responses: {
        200: listResponse(ModelServiceViewSchema),
        ...apiErrorResponses,
      },
    }),
    async (context) => {
      const data = await online.services.list();
      return context.json({ data, meta: { total: data.length } });
    },
  );
  router.post(
    '/services',
    scoped,
    allow('agents.services', 'manage'),
    describeRoute({
      tags,
      summary: 'Create a model service',
      operationId: 'agentsCreateModelService',
      ...cliRoute({
        command: 'service create',
        bodyFile: 'file',
        flags: { apiKey: { prompt: true } },
        examples: ['service create --title OpenAI --provider openai'],
      }),
      description:
        'Needs `agents.services` manage. The key is stored encrypted and never answered.',
      responses: {
        201: dataResponse(ModelServiceViewSchema, 'Created.'),
        400: invalidConnection,
        ...apiErrorResponses,
      },
    }),
    apiValidator('json', CreateServiceSchema),
    async (context) =>
      context.json(
        { data: await online.services.create(context.req.valid('json')) },
        201,
      ),
  );
  // The models a provider lists over a connection being edited or saved.
  router.post(
    '/discoverModels',
    scoped,
    allow('agents.services', 'manage'),
    describeRoute({
      tags,
      summary: 'Discover the models a provider lists',
      operationId: 'agentsDiscoverModels',
      ...cliRoute({ command: 'service discover' }),
      description:
        "Asks the provider for its models over a connection being edited, or a saved service's (`service`), whose stored key is used when none is given. Needs `agents.services` manage. A provider that cannot be reached is `ok: false` with the reason, not an error.",
      responses: {
        200: dataResponse(ProviderModelsSchema),
        400: invalidConnection,
        404: noService,
        ...apiErrorResponses,
      },
    }),
    apiValidator('json', ConnectionSchema),
    async (context) =>
      context.json({
        data: await online.services.models(context.req.valid('json')),
      }),
  );
  // Whether a model answers over a connection being edited or saved.
  router.post(
    '/checkConnection',
    scoped,
    allow('agents.services', 'manage'),
    describeRoute({
      tags,
      summary: 'Check a model over a connection',
      operationId: 'agentsCheckConnection',
      ...cliRoute({ command: 'service check' }),
      description:
        "Asks a model for a short answer (an embedding, a ranking) over a connection being edited, or a saved service's. Needs `agents.services` manage. A model that does not answer is `ok: false` with the reason, not an error.",
      responses: {
        200: dataResponse(ModelCheckSchema),
        400: invalidConnection,
        404: noService,
        ...apiErrorResponses,
      },
    }),
    apiValidator('json', ConnectionCheckSchema),
    async (context) =>
      context.json({
        data: await online.services.check(context.req.valid('json')),
      }),
  );
  router.patch(
    '/services/:serviceName',
    scoped,
    allow('agents.services', 'manage'),
    describeRoute({
      tags,
      summary: 'Update a model service',
      operationId: 'agentsUpdateModelService',
      ...cliRoute({
        command: 'service update',
        args: ['serviceName'],
        bodyFile: 'file',
        flags: { serviceName: { name: 'service' } },
      }),
      description:
        'Needs `agents.services` manage. An omitted key keeps the stored one; `null` removes it.',
      responses: {
        200: dataResponse(ModelServiceViewSchema),
        400: invalidConnection,
        404: noService,
        ...apiErrorResponses,
      },
    }),
    serviceParam,
    apiValidator('json', UpdateServiceSchema),
    async (context) =>
      context.json({
        data: await online.services.update(
          context.req.valid('param').serviceName,
          context.req.valid('json'),
        ),
      }),
  );
  router.delete(
    '/services/:serviceName',
    scoped,
    allow('agents.services', 'manage'),
    describeRoute({
      tags,
      summary: 'Delete a model service',
      operationId: 'agentsDeleteModelService',
      ...cliRoute({
        command: 'service delete',
        args: ['serviceName'],
        flags: { serviceName: { name: 'service' } },
        confirm: 'Delete this model service? Agents using it stop answering.',
      }),
      description: 'Needs `agents.services` manage.',
      responses: {
        204: emptyResponse(),
        404: noService,
        ...apiErrorResponses,
      },
    }),
    serviceParam,
    async (context) => {
      await online.services.remove(context.req.valid('param').serviceName);
      return context.body(null, 204);
    },
  );
  return router;
}

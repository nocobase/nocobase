import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  describeRoute,
  listResponse,
} from '@nocobase/app-server/router';
import type { Hono } from 'hono';

import type { ServiceFactory } from '../factory/service-factory.js';
import { bodyTooLargeResponse, tags } from './openapi.js';
import type { AIRouteGuards } from './settings-access.js';
import { boundedList, jsonBody } from './utils.js';
import {
  BoundedListMeta,
  EnabledModelsInput,
  LLMProviderResponse,
  LLMServiceResponse,
  ModelGroupResponse,
  ModelsQuery,
  NameParams,
  ProviderModelResponse,
  ProviderModelsQuery,
} from './schemas.js';

const llmServiceNotFound = apiErrorResponse(
  404,
  'No LLM service has this name (`LLM_SERVICE_NOT_FOUND`).',
);

/**
 * Models, providers and LLM services. LLM services are defined in config.yml `ai.llmServices`; the settings page may
 * only switch a service on or off and choose its models. The model and provider catalogs carry no secrets, and the chat
 * and other plugins read them as any signed-in user.
 */
export function createLLMServicesRouter(
  app: Hono,
  services: ServiceFactory,
  { settings, signedIn }: AIRouteGuards,
): void {
  // The models a caller may choose, grouped by enabled service: chat models by default, or the embedding models each
  // service's provider suggests.
  app.get(
    '/aiEmployee/models',
    signedIn,
    describeRoute({
      tags,
      summary: 'List the models a caller may choose',
      operationId: 'aiEmployeesListModels',
      description:
        "Grouped by enabled LLM service. `type=LLM` (the default) lists each service's enabled chat models, leaving out services with none or whose provider is not installed; `type=EMBEDDING` lists the embedding models each service's provider suggests, leaving out services whose provider has none. Any signed-in user may read it.",
      responses: {
        200: listResponse(ModelGroupResponse, BoundedListMeta),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
      },
    }),
    apiValidator('query', ModelsQuery),
    async (context) => {
      const data =
        context.req.valid('query').type === 'EMBEDDING'
          ? await services.modelService.listEmbeddingModels({})
          : await services.modelService.listEnabled({});
      return context.json(boundedList(data));
    },
  );

  app.get(
    '/aiEmployee/llmProviders',
    signedIn,
    describeRoute({
      tags,
      summary: 'List LLM providers',
      operationId: 'aiEmployeesListLLMProviders',
      description:
        'The providers installed in the application and what each supports. Any signed-in user may read it.',
      responses: {
        200: listResponse(LLMProviderResponse, BoundedListMeta),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
      },
    }),
    async (context) => {
      const data = await services.modelService.listLLMProviders({});
      return context.json(boundedList(data));
    },
  );

  app.get(
    '/aiEmployee/llmServices',
    settings,
    describeRoute({
      tags,
      summary: 'List LLM services',
      operationId: 'aiEmployeesListLLMServices',
      description:
        'The services configured in config.yml `ai.llmServices`, with secrets redacted. Requires AI settings access.',
      responses: {
        200: listResponse(LLMServiceResponse, BoundedListMeta),
        ...apiErrorResponses,
      },
    }),
    async (context) => {
      const data = await services.llmService.list({});
      return context.json(boundedList(data));
    },
  );

  app.get(
    '/aiEmployee/llmServices/:name',
    settings,
    describeRoute({
      tags,
      summary: 'Get an LLM service',
      operationId: 'aiEmployeesGetLLMService',
      description: 'Secrets are redacted. Requires AI settings access.',
      responses: {
        200: dataResponse(LLMServiceResponse),
        ...apiErrorResponses,
        404: llmServiceNotFound,
      },
    }),
    apiValidator('param', NameParams),
    async (context) => {
      const data = await services.llmService.get({
        name: context.req.valid('param').name,
      });
      return context.json({ data });
    },
  );

  for (const [verb, enabled, Verb] of [
    ['enable', true, 'Enable'],
    ['disable', false, 'Disable'],
  ] as const) {
    app.post(
      `/aiEmployee/llmServices/:name/${verb}`,
      settings,
      describeRoute({
        tags,
        summary: `${Verb} an LLM service`,
        operationId: `aiEmployees${Verb}LLMService`,
        description: enabled
          ? 'Offers the service and its models to employees again. Requires AI settings access.'
          : 'Withdraws the service and its models from every employee. Requires AI settings access.',
        responses: {
          200: dataResponse(LLMServiceResponse),
          ...apiErrorResponses,
          404: llmServiceNotFound,
        },
      }),
      apiValidator('param', NameParams),
      async (context) => {
        const data = await services.llmService.setEnabled({
          name: context.req.valid('param').name,
          enabled,
        });
        return context.json({ data });
      },
    );
  }

  app.put(
    '/aiEmployee/llmServices/:name/enabledModels',
    settings,
    describeRoute({
      tags,
      summary: 'Replace the models an LLM service offers',
      operationId: 'aiEmployeesReplaceLLMServiceEnabledModels',
      description:
        "`models` are what the service offers to employees and the chat; `mode` records whether they were picked from the provider's list (`provider`) or entered by hand (`custom`). Requires AI settings access.",
      responses: {
        200: dataResponse(LLMServiceResponse),
        ...apiErrorResponses,
        404: llmServiceNotFound,
        413: bodyTooLargeResponse,
      },
    }),
    apiValidator('param', NameParams),
    jsonBody,
    apiValidator('json', EnabledModelsInput),
    async (context) => {
      const data = await services.llmService.updateEnabledModels({
        name: context.req.valid('param').name,
        enabledModels: context.req.valid('json'),
      });
      return context.json({ data });
    },
  );

  // The models the provider itself offers, read from its API with the service's credentials.
  app.get(
    '/aiEmployee/llmServices/:name/providerModels',
    settings,
    describeRoute({
      tags,
      summary: "List the models an LLM service's provider offers",
      operationId: 'aiEmployeesListLLMServiceProviderModels',
      description:
        "Read from the provider's own API with the service's credentials; `q` keeps the model ids containing it. Answers `400 FAILED_PRECONDITION` (`LLM_PROVIDER_NOT_FOUND`) when the service's provider is not installed. Requires AI settings access.",
      responses: {
        200: listResponse(ProviderModelResponse, BoundedListMeta),
        400: apiErrorResponse(
          400,
          "The service's provider is not installed (`FAILED_PRECONDITION`, `LLM_PROVIDER_NOT_FOUND`).",
        ),
        ...apiErrorResponses,
        404: llmServiceNotFound,
        503: apiErrorResponse(
          503,
          'The provider could not be reached or refused to list its models (`PROVIDER_MODELS_UNAVAILABLE`).',
        ),
      },
    }),
    apiValidator('param', NameParams),
    apiValidator('query', ProviderModelsQuery),
    async (context) => {
      const data = await services.modelService.listProviderModels({
        input: {
          llmService: context.req.valid('param').name,
          search: context.req.valid('query').q,
        },
      });
      return context.json(boundedList(data));
    },
  );
}

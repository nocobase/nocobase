import { parseApiInput } from '@nocobase/app-server/router';
import type { Hono } from 'hono';
import { validator } from 'hono/validator';

import type { ServiceFactory } from '../factory/service-factory.js';
import type { AIRouteGuards } from './settings-access.js';
import { boundedList, jsonBody } from './utils.js';
import {
  EnabledModelsInput,
  ModelsQuery,
  NameParams,
  ProviderModelsQuery,
} from './schemas.js';

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
    validator('query', (value) => parseApiInput(ModelsQuery, value)),
    async (context) => {
      const data =
        context.req.valid('query').type === 'EMBEDDING'
          ? await services.modelService.listEmbeddingModels({})
          : await services.modelService.listEnabled({});
      return context.json(boundedList(data));
    },
  );

  app.get('/aiEmployee/llmProviders', signedIn, async (context) => {
    const data = await services.modelService.listLLMProviders({});
    return context.json(boundedList(data));
  });

  app.get('/aiEmployee/llmServices', settings, async (context) => {
    const data = await services.llmService.list({});
    return context.json(boundedList(data));
  });

  app.get(
    '/aiEmployee/llmServices/:name',
    settings,
    validator('param', (value) => parseApiInput(NameParams, value)),
    async (context) => {
      const data = await services.llmService.get({
        name: context.req.valid('param').name,
      });
      return context.json({ data });
    },
  );

  for (const [verb, enabled] of [
    ['enable', true],
    ['disable', false],
  ] as const) {
    app.post(
      `/aiEmployee/llmServices/:name/${verb}`,
      settings,
      validator('param', (value) => parseApiInput(NameParams, value)),
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
    validator('param', (value) => parseApiInput(NameParams, value)),
    jsonBody,
    validator('json', (value) => parseApiInput(EnabledModelsInput, value)),
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
    validator('param', (value) => parseApiInput(NameParams, value)),
    validator('query', (value) => parseApiInput(ProviderModelsQuery, value)),
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

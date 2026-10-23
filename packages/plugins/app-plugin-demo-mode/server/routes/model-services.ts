import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import type { AuthorizationEnv } from '@nocobase/app-plugin-authorization';
import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  describeRoute,
} from '@nocobase/app-server/router';
import { databaseManagerToken } from '@nocobase/db';
import { Hono, type MiddlewareHandler } from 'hono';
import { z } from 'zod';

import type {
  DemoModelConnectionInput,
  DemoModelService,
} from '../../shared/model-services.js';
import { demoDataError } from '../errors.js';
import { demoWriteGuardToken } from '../guard.js';
import { resolveDemoAgents } from '../integrations/agents.js';
import { demoConfigurationToken } from '../tokens.js';

const ModelService: z.ZodType<DemoModelService> = z
  .object({
    name: z.string(),
    title: z.string(),
    provider: z.string(),
    baseUrl: z.string().nullable(),
    apiKeySet: z.boolean(),
    enabled: z.boolean(),
    models: z.array(
      z.object({
        value: z.string(),
        label: z.string(),
        kind: z.enum(['chat', 'embedding', 'rerank']),
        dimensions: z.number().nullable(),
      }),
    ),
  })
  .meta({ ref: 'DemoModeModelService' });
const Connection: z.ZodType<DemoModelConnectionInput> = z.strictObject({
  service: z.string().trim().min(1).max(64).nullable(),
  baseUrl: z
    .url({ protocol: /^https?$/ })
    .max(500)
    .refine((value) => {
      if (!URL.canParse(value)) return false;
      const url = new URL(value);
      return !url.username && !url.password;
    }, 'Use the API key field for credentials.')
    .nullable(),
  apiKey: z.string().trim().min(1).max(4000).nullable().optional(),
  model: z.string().trim().min(1).max(200),
});

/** Model connection management keeps the Agents permission and encrypted storage boundary. */
export function modelServiceRoutes(
  container: AppPluginApplication['container'],
  allowed: (
    action: 'read' | 'configure',
  ) => MiddlewareHandler<AuthorizationEnv>,
): Hono<AuthorizationEnv> {
  const routes = new Hono<AuthorizationEnv>();
  const permission =
    (action: 'read' | 'manage'): MiddlewareHandler<AuthorizationEnv> =>
    async (c, next) => {
      await c.get('authz').require({
        resource: { type: 'settings', id: 'agents.services' },
        action,
      });
      await next();
    };
  const services = async () => {
    const api = (await resolveDemoAgents(container))?.models?.services;
    if (!api)
      throw demoDataError(
        'DEMO_MODELS_UNAVAILABLE',
        'Register the Agents plugin to configure a model connection.',
        'NOT_FOUND',
      );
    return api;
  };
  const list = async () => {
    const binding = await container
      .resolve(databaseManagerToken)
      .query()
      .selectFrom('demoModeModel')
      .select(['modelService'])
      .where('id', '=', 'default')
      .executeTakeFirst();
    return (await (await services()).list()).filter(
      (item) => item.name !== binding?.modelService,
    );
  };
  routes.get(
    '/',
    allowed('read'),
    permission('read'),
    describeRoute({
      tags: ['DemoMode'],
      summary: 'List real model connections for demo chat',
      operationId: 'demoModeListModelServices',
      responses: {
        200: dataResponse(z.array(ModelService)),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    async (c) => c.json({ data: z.array(ModelService).parse(await list()) }),
  );
  routes.post(
    '/',
    allowed('configure'),
    permission('read'),
    permission('manage'),
    describeRoute({
      tags: ['DemoMode'],
      summary: 'Save a real model connection for demo chat',
      operationId: 'demoModeSaveModelConnection',
      description:
        'Creates an OpenAI-compatible service when service is null, otherwise edits that Agents service. Omit apiKey to retain it; null clears it. The connection is saved independently of demo chat policy. Needs demoMode.configuration configure and agents.services read/manage.',
      responses: {
        200: dataResponse(ModelService),
        ...apiErrorResponses,
        400: apiErrorResponse(400),
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('json', Connection),
    async (c) => {
      const input = c.req.valid('json');
      if ((await container.resolve(demoConfigurationToken).read()).busy)
        throw demoDataError(
          'DEMO_DATA_BUSY',
          'Wait for the demo operation to finish.',
        );
      if (!input.service && !input.baseUrl)
        throw demoDataError(
          'DEMO_MODEL_INVALID',
          'Enter a base URL for the new service.',
          'INVALID_ARGUMENT',
        );
      const api = await services();
      const current = input.service
        ? (await list()).find((item) => item.name === input.service)
        : undefined;
      if (input.service && !current)
        throw demoDataError(
          'DEMO_MODEL_NOT_FOUND',
          'Model service not found.',
          'NOT_FOUND',
        );
      if (current?.provider === 'openai-compatible' && !input.baseUrl)
        throw demoDataError(
          'DEMO_MODEL_INVALID',
          'Enter the API base URL.',
          'INVALID_ARGUMENT',
        );
      if (current && !current.enabled)
        throw demoDataError(
          'DEMO_MODEL_DISABLED',
          'Enable this model service before using it in demo chat.',
        );
      if (
        current?.models.some(
          (item) => item.value === input.model && item.kind !== 'chat',
        )
      )
        throw demoDataError(
          'DEMO_MODEL_INVALID',
          'Choose a chat model.',
          'INVALID_ARGUMENT',
        );
      const model = { value: input.model, label: input.model };
      const connection = {
        baseUrl: input.baseUrl,
        ...(input.apiKey === undefined ? {} : { apiKey: input.apiKey }),
      };
      const saved = await container
        .resolve(demoWriteGuardToken)
        .runDemoData(async () => {
          if (!current)
            return api.create({
              title: 'Demo live model',
              provider: 'openai-compatible',
              ...connection,
              models: [model],
            });
          // Preserve every other model and its metadata on shared services.
          await api.update(current.name, {
            ...connection,
            ...(current.models.some((item) => item.value === input.model)
              ? {}
              : { models: [...current.models, model] }),
          });
          return (await api.list()).find((item) => item.name === current.name)!;
        });
      return c.json({ data: ModelService.parse(saved) });
    },
  );
  return routes;
}

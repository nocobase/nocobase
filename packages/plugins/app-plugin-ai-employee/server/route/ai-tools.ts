import { parseApiInput } from '@nocobase/app-server/router';
import type { Hono } from 'hono';
import { validator } from 'hono/validator';

import type { ServiceFactory } from '../factory/service-factory.js';
import type { AIRouteGuards } from './settings-access.js';
import { boundedList, jsonBody } from './utils.js';
import { CreateToolInput, NameParams, UpdateToolInput } from './schemas.js';

/** `/aiEmployee/tools`: what the AI settings page manages, and what the employee editor offers. */
export function createAIToolsRouter(
  app: Hono,
  services: ServiceFactory,
  { settings }: AIRouteGuards,
): void {
  app.get('/aiEmployee/tools', settings, async (context) => {
    const data = await services.toolService.list({
      actor: context.var.aiSettingsActor,
    });
    return context.json(boundedList(data));
  });

  app.post(
    '/aiEmployee/tools',
    settings,
    jsonBody,
    validator('json', (value) => parseApiInput(CreateToolInput, value)),
    async (context) => {
      const data = await services.toolService.create({
        actor: context.var.aiSettingsActor,
        input: context.req.valid('json'),
      });
      return context.json({ data }, 201);
    },
  );

  app.get(
    '/aiEmployee/tools/:name',
    settings,
    validator('param', (value) => parseApiInput(NameParams, value)),
    async (context) => {
      const data = await services.toolService.get({
        actor: context.var.aiSettingsActor,
        name: context.req.valid('param').name,
      });
      return context.json({ data });
    },
  );

  app.patch(
    '/aiEmployee/tools/:name',
    settings,
    validator('param', (value) => parseApiInput(NameParams, value)),
    jsonBody,
    validator('json', (value) => parseApiInput(UpdateToolInput, value)),
    async (context) => {
      const data = await services.toolService.update({
        actor: context.var.aiSettingsActor,
        name: context.req.valid('param').name,
        input: context.req.valid('json'),
      });
      return context.json({ data });
    },
  );

  app.delete(
    '/aiEmployee/tools/:name',
    settings,
    validator('param', (value) => parseApiInput(NameParams, value)),
    async (context) => {
      await services.toolService.delete({
        name: context.req.valid('param').name,
      });
      return context.body(null, 204);
    },
  );
}

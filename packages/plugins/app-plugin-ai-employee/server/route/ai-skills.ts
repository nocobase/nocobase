import { parseApiInput } from '@nocobase/app-server/router';
import type { Hono } from 'hono';
import { validator } from 'hono/validator';

import type { ServiceFactory } from '../factory/service-factory.js';
import type { AIRouteGuards } from './settings-access.js';
import { boundedList, jsonBody } from './utils.js';
import { CreateSkillInput, NameParams, UpdateSkillInput } from './schemas.js';

/** `/aiEmployee/skills`: what the AI settings page manages, and what the employee editor offers. */
export function createAISkillsRouter(
  app: Hono,
  services: ServiceFactory,
  { settings }: AIRouteGuards,
): void {
  app.get('/aiEmployee/skills', settings, async (context) => {
    const data = await services.skillService.list({
      actor: context.var.aiSettingsActor,
    });
    return context.json(boundedList(data));
  });

  app.post(
    '/aiEmployee/skills',
    settings,
    jsonBody,
    validator('json', (value) => parseApiInput(CreateSkillInput, value)),
    async (context) => {
      const data = await services.skillService.create({
        actor: context.var.aiSettingsActor,
        input: context.req.valid('json'),
      });
      return context.json({ data }, 201);
    },
  );

  app.get(
    '/aiEmployee/skills/:name',
    settings,
    validator('param', (value) => parseApiInput(NameParams, value)),
    async (context) => {
      const data = await services.skillService.get({
        actor: context.var.aiSettingsActor,
        name: context.req.valid('param').name,
      });
      return context.json({ data });
    },
  );

  app.patch(
    '/aiEmployee/skills/:name',
    settings,
    validator('param', (value) => parseApiInput(NameParams, value)),
    jsonBody,
    validator('json', (value) => parseApiInput(UpdateSkillInput, value)),
    async (context) => {
      const data = await services.skillService.update({
        actor: context.var.aiSettingsActor,
        name: context.req.valid('param').name,
        input: context.req.valid('json'),
      });
      return context.json({ data });
    },
  );

  app.delete(
    '/aiEmployee/skills/:name',
    settings,
    validator('param', (value) => parseApiInput(NameParams, value)),
    async (context) => {
      await services.skillService.delete({
        name: context.req.valid('param').name,
      });
      return context.body(null, 204);
    },
  );
}

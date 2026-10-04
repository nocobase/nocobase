import { parseApiInput } from '@nocobase/app-server/router';
import type { Hono } from 'hono';
import { validator } from 'hono/validator';

import type { ServiceFactory } from '../factory/service-factory.js';
import { identityTranslate } from '../types.js';
import { AI_EMPLOYEE_FIXED_SEGMENTS } from './reserved-names.js';
import type { AIRouteGuards } from './settings-access.js';
import { boundedList, jsonBody } from './utils.js';
import {
  AIEmployeeParams,
  CreateAIEmployeeInput,
  UpdateAIEmployeeInput,
  UserPromptInput,
} from './schemas.js';

/**
 * `/aiEmployees`: the employees themselves. The fixed segments (`roster`, `templates`) are registered before
 * `/aiEmployees/:username`, and an employee may not take one of them as a username.
 */
export function createAIEmployeeRouter(
  app: Hono,
  services: ServiceFactory,
  { settings, signedIn }: AIRouteGuards,
): void {
  // The employees this user may chat with, with this user's own prompt for each. Every signed-in user reads it, which
  // is why it is a resource of its own rather than a view of the settings list.
  app.get(
    `/aiEmployees/${AI_EMPLOYEE_FIXED_SEGMENTS.roster}`,
    signedIn,
    async (context) => {
      const data = await services.employeeService.listByUser({
        actor: context.var.currentUser,
        translate: identityTranslate,
      });
      return context.json(boundedList(data));
    },
  );

  app.get(
    `/aiEmployees/${AI_EMPLOYEE_FIXED_SEGMENTS.templates}`,
    settings,
    (context) =>
      context.json(boundedList(services.employeeService.getTemplates({}))),
  );

  app.get('/aiEmployees', settings, async (context) => {
    const data = await services.employeeService.list({
      translate: identityTranslate,
    });
    return context.json(boundedList(data));
  });

  app.post(
    '/aiEmployees',
    settings,
    jsonBody,
    validator('json', (value) => parseApiInput(CreateAIEmployeeInput, value)),
    async (context) => {
      const data = await services.employeeService.create({
        input: context.req.valid('json'),
        translate: identityTranslate,
      });
      return context.json({ data }, 201);
    },
  );

  app.get(
    '/aiEmployees/:username',
    settings,
    validator('param', (value) => parseApiInput(AIEmployeeParams, value)),
    async (context) => {
      const data = await services.employeeService.get({
        username: context.req.valid('param').username,
        translate: identityTranslate,
      });
      return context.json({ data });
    },
  );

  app.patch(
    '/aiEmployees/:username',
    settings,
    validator('param', (value) => parseApiInput(AIEmployeeParams, value)),
    jsonBody,
    validator('json', (value) => parseApiInput(UpdateAIEmployeeInput, value)),
    async (context) => {
      const data = await services.employeeService.update({
        username: context.req.valid('param').username,
        input: context.req.valid('json'),
        translate: identityTranslate,
      });
      return context.json({ data });
    },
  );

  app.delete(
    '/aiEmployees/:username',
    settings,
    validator('param', (value) => parseApiInput(AIEmployeeParams, value)),
    async (context) => {
      await services.employeeService.delete({
        username: context.req.valid('param').username,
      });
      return context.body(null, 204);
    },
  );

  // The signed-in user's own prompt for one employee, replaced as a whole.
  app.put(
    '/aiEmployees/:username/userPrompt',
    signedIn,
    validator('param', (value) => parseApiInput(AIEmployeeParams, value)),
    jsonBody,
    validator('json', (value) => parseApiInput(UserPromptInput, value)),
    async (context) => {
      const data = await services.employeeService.updateUserPrompt({
        actorId: context.var.currentUser.id,
        employeeKey: context.req.valid('param').username,
        prompt: context.req.valid('json').prompt,
      });
      return context.json({ data });
    },
  );
}

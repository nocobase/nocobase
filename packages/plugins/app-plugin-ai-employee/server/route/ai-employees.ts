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
import { identityTranslate } from '../types.js';
import { AI_EMPLOYEE_FIXED_SEGMENTS } from './reserved-names.js';
import { requiresSettings, type AIRouteGuards } from './settings-access.js';
import { bodyTooLargeResponse, tags } from './openapi.js';
import { boundedList, jsonBody } from './utils.js';
import {
  AIEmployeeParams,
  AIEmployeeResponse,
  AIEmployeeRosterEntryResponse,
  BoundedListMeta,
  UpdateAIEmployeeInput,
  UserPromptInput,
  UserPromptResponse,
} from './schemas.js';

const employeeNotFound = apiErrorResponse(
  404,
  'No AI employee has this username (`AI_EMPLOYEE_NOT_FOUND`).',
);

/**
 * `/aiEmployees`: the employees themselves. The fixed segment `roster` is registered before `/aiEmployees/:username`.
 * The settings page only reads and edits employees, so no route creates or deletes one.
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
    describeRoute({
      tags,
      summary: 'List the AI employees the caller may chat with',
      operationId: 'aiEmployeesListRoster',
      description:
        "Every enabled employee, in the caller's own order, with the caller's own prompt for each and the skills and tools it may use. Any signed-in user may read it.",
      responses: {
        200: listResponse(AIEmployeeRosterEntryResponse, BoundedListMeta),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
      },
    }),
    async (context) => {
      const data = await services.employeeService.listByUser({
        actor: context.var.currentUser,
        translate: identityTranslate,
      });
      return context.json(boundedList(data));
    },
  );

  // The conversation center filters by employee, deprecated ones included, so it reads the same list.
  app.get(
    '/aiEmployees',
    settings(['employees', 'read'], ['conversations', 'read']),
    describeRoute({
      tags,
      summary: 'List AI employees',
      operationId: 'aiEmployeesListEmployees',
      description: `Every employee, enabled or not, as the settings page edits it. ${requiresSettings(['employees', 'read'], ['conversations', 'read'])}`,
      responses: {
        200: listResponse(AIEmployeeResponse, BoundedListMeta),
        ...apiErrorResponses,
      },
    }),
    async (context) => {
      const data = await services.employeeService.list({
        translate: identityTranslate,
      });
      return context.json(boundedList(data));
    },
  );

  app.get(
    '/aiEmployees/:username',
    settings(['employees', 'read']),
    describeRoute({
      tags,
      summary: 'Get an AI employee',
      operationId: 'aiEmployeesGetEmployee',
      description: requiresSettings(['employees', 'read']),
      responses: {
        200: dataResponse(AIEmployeeResponse),
        ...apiErrorResponses,
        404: employeeNotFound,
      },
    }),
    apiValidator('param', AIEmployeeParams),
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
    settings(['employees', 'manage']),
    describeRoute({
      tags,
      summary: 'Update an AI employee',
      operationId: 'aiEmployeesUpdateEmployee',
      description: `Changes the fields given and keeps the rest. ${requiresSettings(['employees', 'manage'])}`,
      responses: {
        200: dataResponse(AIEmployeeResponse),
        ...apiErrorResponses,
        404: employeeNotFound,
        413: bodyTooLargeResponse,
      },
    }),
    apiValidator('param', AIEmployeeParams),
    jsonBody,
    apiValidator('json', UpdateAIEmployeeInput),
    async (context) => {
      const data = await services.employeeService.update({
        username: context.req.valid('param').username,
        input: context.req.valid('json'),
        translate: identityTranslate,
      });
      return context.json({ data });
    },
  );

  // The signed-in user's own prompt for one employee, replaced as a whole.
  app.put(
    '/aiEmployees/:username/userPrompt',
    signedIn,
    describeRoute({
      tags,
      summary: "Replace the caller's own prompt for an AI employee",
      operationId: 'aiEmployeesReplaceUserPrompt',
      description:
        'The prompt is added to every conversation the caller has with this employee. Any signed-in user may set their own.',
      responses: {
        200: dataResponse(UserPromptResponse),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
        404: employeeNotFound,
        413: bodyTooLargeResponse,
      },
    }),
    apiValidator('param', AIEmployeeParams),
    jsonBody,
    apiValidator('json', UserPromptInput),
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

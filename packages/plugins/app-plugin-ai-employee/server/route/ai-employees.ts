import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  describeRoute,
  emptyResponse,
  listResponse,
} from '@nocobase/app-server/router';
import type { Hono } from 'hono';

import type { ServiceFactory } from '../factory/service-factory.js';
import { identityTranslate } from '../types.js';
import {
  AI_EMPLOYEE_FIXED_SEGMENTS,
  AI_EMPLOYEE_RESERVED_USERNAMES,
} from './reserved-names.js';
import type { AIRouteGuards } from './settings-access.js';
import { bodyTooLargeResponse, tags } from './openapi.js';
import { boundedList, jsonBody } from './utils.js';
import {
  AIEmployeeParams,
  AIEmployeeResponse,
  AIEmployeeRosterEntryResponse,
  AIEmployeeTemplateResponse,
  BoundedListMeta,
  CreateAIEmployeeInput,
  UpdateAIEmployeeInput,
  UserPromptInput,
  UserPromptResponse,
} from './schemas.js';

const AI_EMPLOYEE_RESERVED_USERNAMES_TEXT = AI_EMPLOYEE_RESERVED_USERNAMES.map(
  (name) => `\`${name}\``,
).join(', ');

const employeeNotFound = apiErrorResponse(
  404,
  'No AI employee has this username (`AI_EMPLOYEE_NOT_FOUND`).',
);

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

  app.get(
    `/aiEmployees/${AI_EMPLOYEE_FIXED_SEGMENTS.templates}`,
    settings,
    describeRoute({
      tags,
      summary: 'List AI employee templates',
      operationId: 'aiEmployeesListTemplates',
      description: 'Requires AI settings access.',
      responses: {
        200: listResponse(AIEmployeeTemplateResponse, BoundedListMeta),
        ...apiErrorResponses,
      },
    }),
    (context) =>
      context.json(boundedList(services.employeeService.getTemplates({}))),
  );

  app.get(
    '/aiEmployees',
    settings,
    describeRoute({
      tags,
      summary: 'List AI employees',
      operationId: 'aiEmployeesListEmployees',
      description:
        'Every employee, enabled or not, as the settings page edits it. Requires AI settings access.',
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

  app.post(
    '/aiEmployees',
    settings,
    describeRoute({
      tags,
      summary: 'Create an AI employee',
      operationId: 'aiEmployeesCreateEmployee',
      description: `Requires AI settings access. \`username\` may not be one of the fixed path segments beside \`/aiEmployees/{username}\`: ${AI_EMPLOYEE_RESERVED_USERNAMES_TEXT}.`,
      responses: {
        201: dataResponse(AIEmployeeResponse, 'The created employee.'),
        ...apiErrorResponses,
        409: apiErrorResponse(
          409,
          'An employee with this username already exists (`AI_EMPLOYEE_ALREADY_EXISTS`).',
        ),
        413: bodyTooLargeResponse,
      },
    }),
    jsonBody,
    apiValidator('json', CreateAIEmployeeInput),
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
    describeRoute({
      tags,
      summary: 'Get an AI employee',
      operationId: 'aiEmployeesGetEmployee',
      description: 'Requires AI settings access.',
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
    settings,
    describeRoute({
      tags,
      summary: 'Update an AI employee',
      operationId: 'aiEmployeesUpdateEmployee',
      description:
        'Changes the fields given and keeps the rest. Requires AI settings access.',
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

  app.delete(
    '/aiEmployees/:username',
    settings,
    describeRoute({
      tags,
      summary: 'Delete an AI employee',
      operationId: 'aiEmployeesDeleteEmployee',
      description:
        'Deletes the employee and its conversations. Requires AI settings access.',
      responses: {
        204: emptyResponse('The employee was deleted.'),
        ...apiErrorResponses,
        404: employeeNotFound,
      },
    }),
    apiValidator('param', AIEmployeeParams),
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

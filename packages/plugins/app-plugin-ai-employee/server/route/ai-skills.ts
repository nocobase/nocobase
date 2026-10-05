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
import type { AIRouteGuards } from './settings-access.js';
import { boundedList, jsonBody } from './utils.js';
import { bodyTooLargeResponse, tags } from './openapi.js';
import {
  BoundedListMeta,
  CreateSkillInput,
  NameParams,
  SkillResponse,
  SkillSummaryResponse,
  UpdateSkillInput,
} from './schemas.js';

const CREATE_DESCRIPTION =
  'Registers a skill an employee can be given. Fields left out take their defaults: scope `SPECIFIED`, source `loader`, the name as title. Requires AI settings access.';

const UPDATE_DESCRIPTION =
  'Changes the fields given and keeps the rest. Requires AI settings access.';

const skillNotFound = apiErrorResponse(
  404,
  'No skill has this name (`SKILL_NOT_FOUND`).',
);

/** `/aiEmployee/skills`: what the AI settings page manages, and what the employee editor offers. */
export function createAISkillsRouter(
  app: Hono,
  services: ServiceFactory,
  { settings }: AIRouteGuards,
): void {
  app.get(
    '/aiEmployee/skills',
    settings,
    describeRoute({
      tags,
      summary: 'List skills',
      operationId: 'aiEmployeesListSkills',
      description: 'Every registered skill. Requires AI settings access.',
      responses: {
        200: listResponse(SkillSummaryResponse, BoundedListMeta),
        ...apiErrorResponses,
      },
    }),
    async (context) => {
      const data = await services.skillService.list({
        actor: context.var.aiSettingsActor,
      });
      return context.json(boundedList(data));
    },
  );

  app.post(
    '/aiEmployee/skills',
    settings,
    describeRoute({
      tags,
      summary: 'Create a skill',
      operationId: 'aiEmployeesCreateSkill',
      description: CREATE_DESCRIPTION,
      responses: {
        201: dataResponse(SkillResponse, 'The created skill.'),
        ...apiErrorResponses,
        409: apiErrorResponse(
          409,
          'A skill with this name already exists (`SKILL_ALREADY_EXISTS`).',
        ),
        413: bodyTooLargeResponse,
      },
    }),
    jsonBody,
    apiValidator('json', CreateSkillInput),
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
    describeRoute({
      tags,
      summary: 'Get a skill',
      operationId: 'aiEmployeesGetSkill',
      description: 'Requires AI settings access.',
      responses: {
        200: dataResponse(SkillResponse),
        ...apiErrorResponses,
        404: skillNotFound,
      },
    }),
    apiValidator('param', NameParams),
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
    describeRoute({
      tags,
      summary: 'Update a skill',
      operationId: 'aiEmployeesUpdateSkill',
      description: UPDATE_DESCRIPTION,
      responses: {
        200: dataResponse(SkillResponse),
        ...apiErrorResponses,
        404: skillNotFound,
        413: bodyTooLargeResponse,
      },
    }),
    apiValidator('param', NameParams),
    jsonBody,
    apiValidator('json', UpdateSkillInput),
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
    describeRoute({
      tags,
      summary: 'Delete a skill',
      operationId: 'aiEmployeesDeleteSkill',
      description: 'Requires AI settings access.',
      responses: {
        204: emptyResponse('The skill was deleted.'),
        ...apiErrorResponses,
        404: skillNotFound,
      },
    }),
    apiValidator('param', NameParams),
    async (context) => {
      await services.skillService.delete({
        name: context.req.valid('param').name,
      });
      return context.body(null, 204);
    },
  );
}

import {
  apiErrorResponse,
  apiValidator,
  apiErrorResponses,
  dataResponse,
  describeRoute,
  listResponse,
} from '@nocobase/app-server/router';
import type { Hono } from 'hono';

import type { ServiceFactory } from '../factory/service-factory.js';
import { requiresSettings, type AIRouteGuards } from './settings-access.js';
import { boundedList } from './utils.js';
import { tags } from './openapi.js';
import {
  BoundedListMeta,
  NameParams,
  SkillResponse,
  SkillSummaryResponse,
} from './schemas.js';

const skillNotFound = apiErrorResponse(
  404,
  'No skill has this name (`SKILL_NOT_FOUND`).',
);

/**
 * `/aiEmployee/skills`: the skills registered in code, which the AI settings page shows read-only and the employee
 * editor offers.
 */
export function createAISkillsRouter(
  app: Hono,
  services: ServiceFactory,
  { settings }: AIRouteGuards,
): void {
  app.get(
    '/aiEmployee/skills',
    settings(['skills', 'read'], ['employees', 'read']),
    describeRoute({
      tags,
      summary: 'List skills',
      operationId: 'aiEmployeesListSkills',
      description: `Every registered skill. ${requiresSettings(['skills', 'read'], ['employees', 'read'])}`,
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

  app.get(
    '/aiEmployee/skills/:name',
    settings(['skills', 'read']),
    describeRoute({
      tags,
      summary: 'Get a skill',
      operationId: 'aiEmployeesGetSkill',
      description: requiresSettings(['skills', 'read']),
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
}

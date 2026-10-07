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
import { requiresSettings, type AIRouteGuards } from './settings-access.js';
import { boundedList } from './utils.js';
import { tags } from './openapi.js';
import {
  BoundedListMeta,
  NameParams,
  ToolResponse,
  ToolSummaryResponse,
} from './schemas.js';

const toolNotFound = apiErrorResponse(
  404,
  'No tool has this name (`TOOL_NOT_FOUND`).',
);

/**
 * `/aiEmployee/tools`: the tools registered in code, which the AI settings page shows read-only and the employee
 * editor offers.
 */
export function createAIToolsRouter(
  app: Hono,
  services: ServiceFactory,
  { settings }: AIRouteGuards,
): void {
  app.get(
    '/aiEmployee/tools',
    settings(['tools', 'read'], ['employees', 'read']),
    describeRoute({
      tags,
      summary: 'List tools',
      operationId: 'aiEmployeesListTools',
      description: `Every registered tool. ${requiresSettings(['tools', 'read'], ['employees', 'read'])}`,
      responses: {
        200: listResponse(ToolSummaryResponse, BoundedListMeta),
        ...apiErrorResponses,
      },
    }),
    async (context) => {
      const data = await services.toolService.list({
        actor: context.var.aiSettingsActor,
      });
      return context.json(boundedList(data));
    },
  );

  app.get(
    '/aiEmployee/tools/:name',
    settings(['tools', 'read']),
    describeRoute({
      tags,
      summary: 'Get a tool',
      operationId: 'aiEmployeesGetTool',
      description: requiresSettings(['tools', 'read']),
      responses: {
        200: dataResponse(ToolResponse),
        ...apiErrorResponses,
        404: toolNotFound,
      },
    }),
    apiValidator('param', NameParams),
    async (context) => {
      const data = await services.toolService.get({
        actor: context.var.aiSettingsActor,
        name: context.req.valid('param').name,
      });
      return context.json({ data });
    },
  );
}

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
  CreateToolInput,
  NameParams,
  ToolResponse,
  ToolSummaryResponse,
  UpdateToolInput,
} from './schemas.js';

const CREATE_DESCRIPTION =
  'Registers a tool by its `definition`. An HTTP request cannot carry code, so only a `frontend` tool, which the page runs, can be created this way; a backend tool is refused with `400`. Fields left out take their defaults: scope `SPECIFIED`, source `loader`, `defaultPermission` `ASK`. Requires AI settings access.';

const UPDATE_DESCRIPTION =
  'Changes the fields given and keeps the rest. A backend tool keeps the code it was registered with. Requires AI settings access.';

const toolNotFound = apiErrorResponse(
  404,
  'No tool has this name (`TOOL_NOT_FOUND`).',
);

/** `/aiEmployee/tools`: what the AI settings page manages, and what the employee editor offers. */
export function createAIToolsRouter(
  app: Hono,
  services: ServiceFactory,
  { settings }: AIRouteGuards,
): void {
  app.get(
    '/aiEmployee/tools',
    settings,
    describeRoute({
      tags,
      summary: 'List tools',
      operationId: 'aiEmployeesListTools',
      description: 'Every registered tool. Requires AI settings access.',
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

  app.post(
    '/aiEmployee/tools',
    settings,
    describeRoute({
      tags,
      summary: 'Create a tool',
      operationId: 'aiEmployeesCreateTool',
      description: CREATE_DESCRIPTION,
      responses: {
        201: dataResponse(ToolResponse, 'The created tool.'),
        400: apiErrorResponse(
          400,
          'A backend tool cannot be created over HTTP, which cannot carry its code (`INVALID_REQUEST`).',
        ),
        ...apiErrorResponses,
        409: apiErrorResponse(
          409,
          'A tool with this name already exists (`TOOL_ALREADY_EXISTS`).',
        ),
        413: bodyTooLargeResponse,
      },
    }),
    jsonBody,
    apiValidator('json', CreateToolInput),
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
    describeRoute({
      tags,
      summary: 'Get a tool',
      operationId: 'aiEmployeesGetTool',
      description: 'Requires AI settings access.',
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

  app.patch(
    '/aiEmployee/tools/:name',
    settings,
    describeRoute({
      tags,
      summary: 'Update a tool',
      operationId: 'aiEmployeesUpdateTool',
      description: UPDATE_DESCRIPTION,
      responses: {
        200: dataResponse(ToolResponse),
        400: apiErrorResponse(
          400,
          'The update would make a tool registered without code a backend tool (`INVALID_REQUEST`).',
        ),
        ...apiErrorResponses,
        404: toolNotFound,
        413: bodyTooLargeResponse,
      },
    }),
    apiValidator('param', NameParams),
    jsonBody,
    apiValidator('json', UpdateToolInput),
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
    describeRoute({
      tags,
      summary: 'Delete a tool',
      operationId: 'aiEmployeesDeleteTool',
      description: 'Requires AI settings access.',
      responses: {
        204: emptyResponse('The tool was deleted.'),
        ...apiErrorResponses,
        404: toolNotFound,
      },
    }),
    apiValidator('param', NameParams),
    async (context) => {
      await services.toolService.delete({
        name: context.req.valid('param').name,
      });
      return context.body(null, 204);
    },
  );
}

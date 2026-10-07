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
import { bodyTooLargeResponse, tags } from './openapi.js';
import { MCP_SERVER_FIXED_SEGMENTS } from './reserved-names.js';
import { requiresSettings, type AIRouteGuards } from './settings-access.js';
import { boundedList, jsonBody } from './utils.js';
import {
  BoundedListMeta,
  MCPServerResponse,
  MCPToolParams,
  MCPToolPermissionInput,
  MCPToolResponse,
  MCPToolsByServerResponse,
  NameParams,
} from './schemas.js';

const read = requiresSettings(['mcpServers', 'read']);
const manage = requiresSettings(['mcpServers', 'manage']);

const serverNotFound = apiErrorResponse(
  404,
  'No MCP server has this name (`MCP_SERVER_NOT_FOUND`).',
);

/**
 * `/aiEmployee/mcpServers`: servers configured in config.yml `ai.mcpServers`. The settings page switches a server on or
 * off and sets its tools' permissions. A configured server may not be named after the fixed segment `tools`.
 */
export function createAIMCPServersRouter(
  app: Hono,
  services: ServiceFactory,
  { settings }: AIRouteGuards,
): void {
  app.get(
    '/aiEmployee/mcpServers',
    settings(['mcpServers', 'read']),
    describeRoute({
      tags,
      summary: 'List MCP servers',
      operationId: 'aiEmployeesListMCPServers',
      description: `The servers configured in config.yml \`ai.mcpServers\`, with secret environment variables and headers redacted. ${read}`,
      responses: {
        200: listResponse(MCPServerResponse, BoundedListMeta),
        ...apiErrorResponses,
      },
    }),
    async (context) => {
      const data = await services.mcpServerService.list({});
      return context.json(boundedList(data));
    },
  );

  // The tools of every connected server, keyed by server name.
  app.get(
    `/aiEmployee/mcpServers/${MCP_SERVER_FIXED_SEGMENTS.tools}`,
    settings(['mcpServers', 'read']),
    describeRoute({
      tags,
      summary: 'List the tools of every connected MCP server',
      operationId: 'aiEmployeesListMCPTools',
      description: `Keyed by server name. A server that is not connected has no entry. ${read}`,
      responses: {
        200: dataResponse(MCPToolsByServerResponse),
        ...apiErrorResponses,
      },
    }),
    async (context) => {
      const data = await services.mcpServerService.listTools();
      return context.json({ data });
    },
  );

  for (const [verb, enabled, Verb] of [
    ['enable', true, 'Enable'],
    ['disable', false, 'Disable'],
  ] as const) {
    app.post(
      `/aiEmployee/mcpServers/:name/${verb}`,
      settings(['mcpServers', 'manage']),
      describeRoute({
        tags,
        summary: `${Verb} an MCP server`,
        operationId: `aiEmployees${Verb}MCPServer`,
        description: enabled
          ? `Reconnects the MCP clients with the server included again. ${manage}`
          : `Reconnects the MCP clients without the server, so its tools are no longer offered. ${manage}`,
        responses: {
          200: dataResponse(MCPServerResponse),
          ...apiErrorResponses,
          404: serverNotFound,
        },
      }),
      apiValidator('param', NameParams),
      async (context) => {
        const data = await services.mcpServerService.setEnabled({
          name: context.req.valid('param').name,
          enabled,
        });
        return context.json({ data });
      },
    );
  }

  app.patch(
    '/aiEmployee/mcpServers/:name/tools/:toolName',
    settings(['mcpServers', 'manage']),
    describeRoute({
      tags,
      summary: "Set an MCP tool's permission",
      operationId: 'aiEmployeesUpdateMCPToolPermission',
      description: `\`ALLOW\` runs a call without asking, \`ASK\` asks the user first. Only a tool of a connected server can be set. ${manage}`,
      responses: {
        200: dataResponse(MCPToolResponse),
        ...apiErrorResponses,
        404: apiErrorResponse(
          404,
          'No MCP server has this name (`MCP_SERVER_NOT_FOUND`), or the server has no connected tool of this name (`MCP_TOOL_NOT_FOUND`).',
        ),
        413: bodyTooLargeResponse,
      },
    }),
    apiValidator('param', MCPToolParams),
    jsonBody,
    apiValidator('json', MCPToolPermissionInput),
    async (context) => {
      const { name, toolName } = context.req.valid('param');
      const data = await services.mcpServerService.updateToolPermission({
        serverName: name,
        toolName,
        permission: context.req.valid('json').permission,
      });
      return context.json({ data });
    },
  );
}

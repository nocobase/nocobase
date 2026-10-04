import { parseApiInput } from '@nocobase/app-server/router';
import type { Hono } from 'hono';
import { validator } from 'hono/validator';

import type { ServiceFactory } from '../factory/service-factory.js';
import { MCP_SERVER_FIXED_SEGMENTS } from './reserved-names.js';
import type { AIRouteGuards } from './settings-access.js';
import { boundedList, jsonBody } from './utils.js';
import {
  MCPCandidateInput,
  MCPToolParams,
  MCPToolPermissionInput,
  NameParams,
} from './schemas.js';

/**
 * `/aiEmployee/mcpServers`: servers configured in config.yml `ai.mcpServers`. The fixed segments (`tools`,
 * `testConnection`) are registered before `/:name`.
 */
export function createAIMCPServersRouter(
  app: Hono,
  services: ServiceFactory,
  { settings }: AIRouteGuards,
): void {
  app.get('/aiEmployee/mcpServers', settings, async (context) => {
    const data = await services.mcpServerService.list({});
    return context.json(boundedList(data));
  });

  // The tools of every connected server, keyed by server name.
  app.get(
    `/aiEmployee/mcpServers/${MCP_SERVER_FIXED_SEGMENTS.tools}`,
    settings,
    async (context) => {
      const data = await services.mcpServerService.listTools();
      return context.json({ data });
    },
  );

  // A remote server's values, tested before they are saved anywhere.
  app.post(
    `/aiEmployee/mcpServers/${MCP_SERVER_FIXED_SEGMENTS.testConnection}`,
    settings,
    jsonBody,
    validator('json', (value) => parseApiInput(MCPCandidateInput, value)),
    async (context) => {
      const data = await services.mcpServerService.testCandidate({
        values: context.req.valid('json'),
      });
      // A failed connection is the answer to the test, not a failed request, so `{ success, error }` is data.
      return context.json({ data });
    },
  );

  app.get(
    '/aiEmployee/mcpServers/:name',
    settings,
    validator('param', (value) => parseApiInput(NameParams, value)),
    async (context) => {
      const data = await services.mcpServerService.get({
        name: context.req.valid('param').name,
      });
      return context.json({ data });
    },
  );

  app.post(
    '/aiEmployee/mcpServers/:name/testConnection',
    settings,
    validator('param', (value) => parseApiInput(NameParams, value)),
    async (context) => {
      const data = await services.mcpServerService.testConnection({
        name: context.req.valid('param').name,
      });
      // As above: the outcome of the test is the result, reported as `{ success, error }`.
      return context.json({ data });
    },
  );

  for (const [verb, enabled] of [
    ['enable', true],
    ['disable', false],
  ] as const) {
    app.post(
      `/aiEmployee/mcpServers/:name/${verb}`,
      settings,
      validator('param', (value) => parseApiInput(NameParams, value)),
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
    settings,
    validator('param', (value) => parseApiInput(MCPToolParams, value)),
    jsonBody,
    validator('json', (value) => parseApiInput(MCPToolPermissionInput, value)),
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

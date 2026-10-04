import type { Auth } from '@nocobase/app-plugin-authentication';
import type { Authorization } from '@nocobase/app-plugin-authorization';
import type { Logger } from '@nocobase/logging';
import { Hono } from 'hono';

import type { ServiceFactory } from '../factory/service-factory.js';
import { createAIConversationsRouter } from './ai-conversations.js';
import { createAIEmployeeRouter } from './ai-employees.js';
import { createAIFilesRouter } from './ai-files.js';
import { createAIMCPServersRouter } from './ai-mcp-servers.js';
import { createAISkillsRouter } from './ai-skills.js';
import { createAIToolsRouter } from './ai-tools.js';
import { createLLMServicesRouter } from './llm-services.js';
import {
  createAIRouteGuards,
  provideAISettingsAccess,
  type AIRouteGuards,
} from './settings-access.js';
import { createAIUsageStatisticsRouter } from './usage-statistics.js';
import {
  aiEmployeeErrorHandler,
  createAIActorMiddleware,
  createAIRequestMiddleware,
} from './utils.js';

export {
  AI_EMPLOYEE_RESERVED_USERNAMES,
  MCP_SERVER_RESERVED_NAMES,
} from './reserved-names.js';
export {
  AI_FILE_UPLOAD_MAX_BYTES,
  AI_JSON_BODY_MAX_BYTES,
  AI_RUN_BODY_MAX_BYTES,
} from './utils.js';
export {
  listAIRouteAccess,
  type AIRouteAccess,
  type AIRouteGuards,
} from './settings-access.js';

export interface CreateAIEmployeeRoutesOptions {
  readonly authentication: Auth;
  readonly authorization: Authorization;
  readonly services: ServiceFactory;
  readonly logger: Logger;
  /** The largest upload `POST /aiEmployee/files` accepts, in bytes; `AI_FILE_UPLOAD_MAX_BYTES` by default. */
  readonly uploadMaxSize?: number;
}

/** The two path prefixes the plugin owns under `/api`: the employees, and every other AI resource. */
export const AI_EMPLOYEE_ROUTE_PREFIXES: readonly string[] = [
  '/aiEmployees',
  '/aiEmployee',
];

/**
 * The plugin's HTTP API, mounted under `/api`. Employees live at `/aiEmployees`; skills, tools, models, LLM services,
 * MCP servers, files, usage and conversations at `/aiEmployee/...`.
 */
export function createAIEmployeeRoutes(
  options: CreateAIEmployeeRoutesOptions,
): Hono {
  const routes = new Hono();
  routes.onError(aiEmployeeErrorHandler);
  // Every AI route runs as a signed-in user; there is no anonymous caller. The middleware is scoped to the plugin's own
  // prefixes because this router is mounted at `/api` beside every other plugin's routes.
  for (const prefix of AI_EMPLOYEE_ROUTE_PREFIXES) {
    routes.use(
      `${prefix}/*`,
      options.authentication.required(),
      options.authorization.middleware(),
      provideAISettingsAccess(),
      createAIActorMiddleware(),
    );
  }
  // Each route names one of these first, which both decides who may call it and readies the services afterwards.
  const guards: AIRouteGuards = createAIRouteGuards(
    createAIRequestMiddleware({
      ready: () => options.services.ready(),
      logger: options.logger,
    }),
  );
  createAIEmployeeRouter(routes, options.services, guards);
  createAIConversationsRouter(routes, options.services, guards);
  createAIFilesRouter(routes, options.services, guards, options.uploadMaxSize);
  createAIToolsRouter(routes, options.services, guards);
  createAISkillsRouter(routes, options.services, guards);
  createLLMServicesRouter(routes, options.services, guards);
  createAIMCPServersRouter(routes, options.services, guards);
  createAIUsageStatisticsRouter(routes, options.services, guards);
  return routes;
}

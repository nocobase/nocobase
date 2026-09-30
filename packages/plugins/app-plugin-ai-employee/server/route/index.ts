import type { Auth } from '@nocobase/app-plugin-authentication';
import type { Authorization } from '@nocobase/app-plugin-authorization';
import type { Logger } from '@nocobase/logging';
import { Hono } from 'hono';

import type { ServiceFactory } from '../factory/service-factory.js';
import { createAIConversationsRouter } from './ai-conversations.js';
import { requireConversationManagement } from './conversation-management.js';
import { requireSkillsManagement } from './skills-management.js';
import { requireToolsManagement } from './tools-management.js';
import {
  AI_SETTINGS_ACTIONS,
  provideAISettingsAccess,
  requireAISettingsAccess,
} from './settings-access.js';
import { createAIEmployeeRouter } from './ai-employees.js';
import { createAIFilesRouter } from './ai-files.js';
import { createAIMCPServersRouter } from './ai-mcp-servers.js';
import { createAISkillsRouter } from './ai-skills.js';
import { createAIToolsRouter } from './ai-tools.js';
import { createAIRouter } from './ai.js';
import {
  createAIActorMiddleware,
  createAIRequestMiddleware,
  errorResponse,
} from './utils.js';
import { createLLMServicesRouter } from './llm-services.js';

export * from './contracts.js';

export interface CreateAIEmployeeRoutesOptions {
  readonly authentication: Auth;
  readonly authorization: Authorization;
  readonly services: ServiceFactory;
  readonly logger: Logger;
}

export function createAIEmployeeRoutes(
  options: CreateAIEmployeeRoutesOptions,
): Hono {
  const routes = new Hono();
  routes.onError((error) => errorResponse(error));
  // Every AI action runs as a signed-in user; there is no anonymous caller.
  routes.use(
    '*',
    options.authentication.required(),
    options.authorization.middleware(),
    provideAISettingsAccess(),
  );
  for (const path of [
    '/aiConversations:listAll',
    '/aiConversations:listUsers',
    '/aiConversations:getAllMessages',
  ]) {
    routes.use(path, requireConversationManagement());
  }
  for (const path of ['/aiSkills:listAll', '/aiSkills:getDetails']) {
    routes.use(path, requireSkillsManagement());
  }
  for (const path of ['/aiTools:listAll', '/aiTools:getDetails']) {
    routes.use(path, requireToolsManagement());
  }
  for (const action of AI_SETTINGS_ACTIONS) {
    routes.use(`/${action}`, requireAISettingsAccess());
  }
  routes.use('*', createAIActorMiddleware());
  routes.use(
    '*',
    createAIRequestMiddleware({
      ready: () => options.services.ready(),
      logger: options.logger,
    }),
  );
  createAIRouter(routes, options.services);
  createAIEmployeeRouter(routes, options.services);
  createAIConversationsRouter(routes, options.services);
  createAIFilesRouter(routes, options.services);
  createAIToolsRouter(routes, options.services);
  createAISkillsRouter(routes, options.services);
  createLLMServicesRouter(routes, options.services);
  createAIMCPServersRouter(routes, options.services);
  return routes;
}

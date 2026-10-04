import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { authenticationToken } from '@nocobase/app-plugin-authentication/server';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import {
  defineApiRoutes,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { loggingToken } from '@nocobase/app-server/logging';

import { createAIEmployeeRoutes } from './index.js';
import { serviceFactoryToken } from '../tokens.js';

/** `/api/aiEmployees` and `/api/aiEmployee/...`; see `createAIEmployeeRoutes`. */
export const aiEmployeeApiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container }) =>
    createAIEmployeeRoutes({
      authentication: container.resolve(authenticationToken),
      authorization: container.resolve(authorizationToken),
      services: container.resolve(serviceFactoryToken),
      logger: container.resolve(loggingToken).getLogger('ai-employee'),
    }),
  );

export default [aiEmployeeApiRoutes] as const;

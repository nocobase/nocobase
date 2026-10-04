import { databaseManagerToken } from '@nocobase/db';
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  defineApiRoutes,
  defineRootRoutes,
  type AppRouteContribution,
  type AppRootRouteContribution,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { serveSpaAsset } from '@nocobase/app-server/spa';
import path from 'node:path';

import { workflowError } from '../errors.js';
import type { WorkflowProviderConfig } from '../provider.js';
import { internalWorkflowServiceToken } from '../tokens.js';
import { workflowErrorHandler, workflowErrorResponse } from './errors.js';
import { createWorkflowRoutes } from './workflow.js';

const workflowRoutePaths = ['/workflows', '/workflows/*'] as const;

export const apiRoutes: AppApiRouteContribution<
  AppPluginApplication<WorkflowProviderConfig>
> = defineApiRoutes(({ container }) => {
  const router = new Hono<AuthorizationEnv>();
  router.onError(workflowErrorHandler);
  const authentication = container.resolve(authenticationToken);
  const authorization = container.resolve(authorizationToken);
  for (const path of workflowRoutePaths) {
    router.use(
      path,
      authentication.required(),
      authorization.middleware(),
      async (context, next) => {
        const allowed = await context.get('authz').can({
          resource: { type: 'settings', id: 'workflow' },
          action: 'manage',
        });
        if (!allowed) {
          return workflowErrorResponse(
            context,
            workflowError({
              status: 'PERMISSION_DENIED',
              reason: 'WORKFLOW_MANAGEMENT_REQUIRED',
              message: 'Workflow management permission is required.',
            }),
          );
        }
        await next();
      },
    );
  }
  if (
    container.has(databaseManagerToken) &&
    container.has(internalWorkflowServiceToken)
  ) {
    router.route(
      '/',
      createWorkflowRoutes(
        container.resolve(databaseManagerToken),
        container.resolve(internalWorkflowServiceToken),
      ),
    );
  } else {
    for (const path of workflowRoutePaths) {
      router.all(path, (context) =>
        workflowErrorResponse(
          context,
          workflowError({
            status: 'UNAVAILABLE',
            reason: 'WORKFLOW_SERVICE_NOT_CONFIGURED',
            message: 'Workflow service is not configured.',
          }),
        ),
      );
    }
  }
  return new Hono().route('/', router);
});

// Browser artifacts contain public compiled assets only. Keep this route ahead
// of the SPA/Vite fallback so development serves the same immutable URLs.
export const clientArtifactRoutes: AppRootRouteContribution<
  AppPluginApplication<WorkflowProviderConfig>
> = defineRootRoutes<AppPluginApplication<WorkflowProviderConfig>>(
  ({ paths }) => {
    const router = new Hono();
    router.all('/assets/workflow-artifacts/:hash/client/*', (context) => {
      const hash = context.req.param('hash');
      if (!/^[a-f0-9]{64}$/.test(hash)) return context.notFound();
      const prefix = `/assets/workflow-artifacts/${hash}/client`;
      const offset = context.req.path.indexOf(prefix);
      return serveSpaAsset(context.req.raw, {
        rootDir: path.join(
          paths.clientDir,
          'assets/workflow-artifacts',
          hash,
          'client',
        ),
        basePath: context.req.path.slice(0, offset) + prefix,
      });
    });
    return router;
  },
);

const routes: readonly AppRouteContribution<
  AppPluginApplication<WorkflowProviderConfig>
>[] = [apiRoutes, clientArtifactRoutes];

export default routes;

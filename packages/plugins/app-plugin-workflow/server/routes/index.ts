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

import { AppServiceError } from '../errors.js';
import { WorkflowInvocationError } from '../engine/index.js';
import type { WorkflowProviderConfig } from '../provider.js';
import { internalWorkflowServiceToken } from '../tokens.js';
import { translateWorkflowMessage } from '../i18n.js';
import { createWorkflowRoutes } from './workflow.js';

const workflowRoutePaths = [
  '/workflows',
  '/workflows/*',
  '/workflow-runs',
  '/workflow-runs/*',
] as const;

export const apiRoutes: AppApiRouteContribution<
  AppPluginApplication<WorkflowProviderConfig>
> = defineApiRoutes(({ container }) => {
  const router = new Hono<AuthorizationEnv>();
  router.onError((error, context) => {
    if (error instanceof AppServiceError) {
      const key =
        error.status === 409
          ? 'errors.conflict'
          : error.status === 503
            ? 'errors.serviceUnavailable'
            : 'errors.badRequest';
      return context.json(
        { message: translateWorkflowMessage(context, key, error.message) },
        error.status,
      );
    }
    if (error instanceof WorkflowInvocationError) {
      const key =
        error.code === 'WORKFLOW_NOT_FOUND'
          ? 'errors.workflowNotFound'
          : error.code === 'INVALID_INPUT'
            ? 'errors.invalidInput'
            : error.code === 'PARENT_RUN_NOT_FOUND'
              ? 'errors.parentRunNotFound'
              : error.code === 'STACK_LIMIT_EXCEEDED'
                ? 'errors.stackLimitExceeded'
                : error.code === 'INPUT_TOO_LARGE'
                  ? 'errors.inputTooLarge'
                  : 'errors.badRequest';
      return context.json(
        {
          message: translateWorkflowMessage(context, key, error.message),
          code: error.code,
        },
        400,
      );
    }
    return context.json(
      {
        message: translateWorkflowMessage(
          context,
          'errors.internal',
          'Internal server error.',
        ),
      },
      500,
    );
  });
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
          return context.json(
            {
              code: 'FORBIDDEN',
              message: translateWorkflowMessage(
                context,
                'errors.forbidden',
                'Workflow management permission is required.',
              ),
            },
            403,
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
        context.json(
          {
            message: translateWorkflowMessage(
              context,
              'errors.notConfigured',
              'Workflow service is not configured.',
            ),
          },
          503,
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

import type { Application } from '@nocobase/app-server/application';
import type { AppApiRouteContribution } from '@nocobase/app-server/router';
import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  lifecycleExampleServiceToken,
  DescriptionViewSchema,
  RecordViewSchema,
} from '@nocobase/app-plugin-lifecycle-example/server';
import { officeFlowsServiceToken } from '@nocobase/app-plugin-office-flows-example/server';
import { databaseManagerToken } from '@nocobase/db';
import {
  apiErrorHandler,
  apiErrorResponse,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  listResponse,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { WorkflowsService } from '../providers/workflows.js';
import {
  WorkflowExecutionParams,
  WorkflowParams,
  WorkflowPageQuery,
  WorkflowSummarySchema,
  WorkflowDefinitionSchema,
  WorkflowExecutionSchema,
  WorkflowPageMeta,
} from './schemas.js';
import {
  EXAMPLES_APP_TAGS as tags,
  EXAMPLES_APP_DOMAIN,
  hideDatabaseUnavailable,
} from './domain.js';
import { databaseUnavailable } from './database-unavailable.js';
import { z } from 'zod';

export const workflowRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes((app) => {
    const router = new Hono<AuthEnv>();
    router.onError(apiErrorHandler);
    if (!app.container.has(databaseManagerToken)) {
      router.all('*', hideDatabaseUnavailable, (context) =>
        databaseUnavailable(context, EXAMPLES_APP_DOMAIN),
      );
      return new Hono().route('/workflows', router);
    }
    router.use('*', app.container.resolve(authenticationToken).required());
    const lifecycle = app.container.resolve(lifecycleExampleServiceToken);
    const office = app.container.resolve(officeFlowsServiceToken);
    const service = new WorkflowsService(
      app.container.resolve(databaseManagerToken),
      [
        {
          source: 'lifecycle',
          runtime: lifecycle.runtime,
          definitions: lifecycle.workflowDefinitions(),
        },
        {
          source: 'office',
          runtime: office.runtime,
          definitions: office.workflowDefinitions(),
        },
      ],
    );
    const failures = {
      401: apiErrorResponse(401),
      404: apiErrorResponse(404),
      500: apiErrorResponse(500),
    };
    router.get(
      '/definitions',
      describeRoute({
        tags,
        summary: 'List example workflow definitions',
        operationId: 'examplesListWorkflowDefinitions',
        description:
          'Signed-in users may inspect all runnable workflow examples, including office task subflows.',
        responses: {
          200: dataResponse(z.array(WorkflowSummarySchema)),
          ...failures,
        },
      }),
      (context) => context.json({ data: service.definitions() }),
    );
    router.get(
      '/definitions/:workflowId',
      describeRoute({
        tags,
        summary: 'Describe an example workflow',
        operationId: 'examplesGetWorkflowDefinition',
        responses: { 200: dataResponse(WorkflowDefinitionSchema), ...failures },
      }),
      apiValidator('param', WorkflowParams),
      async (context) =>
        context.json({
          data: await service.definition(context.req.valid('param').workflowId),
        }),
    );
    router.get(
      '/executions',
      describeRoute({
        tags,
        summary: 'List example workflow executions',
        operationId: 'examplesListWorkflowExecutions',
        description:
          'An execution is one lifecycle-managed business record. All signed-in users may inspect demonstration records. Results default to newest first, with chronological sorting, workflow filtering and pagination.',
        responses: {
          200: listResponse(WorkflowExecutionSchema, WorkflowPageMeta),
          ...failures,
        },
      }),
      apiValidator('query', WorkflowPageQuery),
      async (context) => {
        const { page, pageSize, workflowId, order } =
          context.req.valid('query');
        return context.json(
          await service.executions(page, pageSize, workflowId, order),
        );
      },
    );
    router.get(
      '/executions/:workflowId/:recordId',
      describeRoute({
        tags,
        summary: 'Inspect an example workflow execution',
        operationId: 'examplesGetWorkflowExecution',
        description:
          'The complete persisted transition and effect history of a demonstration record, together with its current definition. Snapshot parameter values remain on the record view.',
        responses: {
          200: dataResponse(
            z.intersection(
              z.object({ workflow: WorkflowSummarySchema }),
              z.intersection(
                DescriptionViewSchema,
                z.object({ view: RecordViewSchema }),
              ),
            ),
          ),
          ...failures,
        },
      }),
      apiValidator('param', WorkflowExecutionParams),
      async (context) => {
        const { workflowId, recordId } = context.req.valid('param');
        return context.json({
          data: await service.execution(
            workflowId,
            recordId,
            String(context.get('auth')!.user.id),
          ),
        });
      },
    );
    return new Hono().route('/workflows', router);
  });

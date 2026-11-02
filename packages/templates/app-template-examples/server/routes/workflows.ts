import {
  parameterConfigurationServiceToken,
  parameterConfigurationApiError,
} from '@nocobase/app-plugin-lifecycle-example/server';
import {
  OfficeWorkflowParameterService,
  OfficeWorkflowValues,
} from '@nocobase/app-plugin-office-flows-example/server';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import { createMiddleware } from 'hono/factory';
import { WorkflowCatalogService } from '@nocobase/app-plugin-lifecycle-example/server';
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
  ApiError,
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
  WorkflowDefinitionQuery,
  WorkflowSummarySchema,
  WorkflowDefinitionSchema,
  WorkflowExecutionSchema,
  WorkflowPageMeta,
  WorkflowCategorySchema,
  WorkflowCategoryInput,
  WorkflowCategoryParams,
  WorkflowCategoryAssignment,
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
    const router = new Hono<AuthEnv & AuthorizationEnv>();
    router.onError((error, context) =>
      apiErrorHandler(parameterConfigurationApiError(error), context),
    );
    if (!app.container.has(databaseManagerToken)) {
      router.all('*', hideDatabaseUnavailable, (context) =>
        databaseUnavailable(context, EXAMPLES_APP_DOMAIN),
      );
      return new Hono().route('/workflows', router);
    }
    const authz = app.container.resolve(authorizationToken);
    const allowed = (action: 'read' | 'update') =>
      createMiddleware<AuthorizationEnv>(async (context, next) => {
        await context.get('authz').require({
          resource: { type: 'settings', id: 'workflow-management' },
          action,
        });
        await next();
      });
    router.use(
      '*',
      app.container.resolve(authenticationToken).required(),
      authz.middleware(),
      allowed('read'),
    );
    const catalog = new WorkflowCatalogService(
      app.container.resolve(databaseManagerToken),
    );
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
      403: apiErrorResponse(403),
      400: apiErrorResponse(400),
      404: apiErrorResponse(404),
      500: apiErrorResponse(500),
    };
    router.get(
      '/categories',
      describeRoute({
        tags,
        summary: 'List workflow categories',
        operationId: 'examplesListWorkflowCategories',
        responses: {
          200: dataResponse(z.array(WorkflowCategorySchema)),
          ...failures,
        },
      }),
      async (c) => c.json({ data: await catalog.categories() }),
    );
    router.put(
      '/categoryOrder',
      allowed('update'),
      describeRoute({
        tags,
        summary: 'Reorder workflow categories',
        operationId: 'examplesReorderWorkflowCategories',
        responses: {
          200: dataResponse(z.null()),
          409: apiErrorResponse(409),
          ...failures,
        },
      }),
      apiValidator(
        'json',
        z.strictObject({ ids: z.array(z.string().min(1).max(100)).max(1000) }),
      ),
      async (c) => {
        await catalog.reorder(c.req.valid('json').ids);
        return c.json({ data: null });
      },
    );
    router.post(
      '/categories',
      allowed('update'),
      describeRoute({
        tags,
        summary: 'Create a workflow category',
        operationId: 'examplesCreateWorkflowCategory',
        responses: { 201: dataResponse(WorkflowCategorySchema), ...failures },
      }),
      apiValidator('json', WorkflowCategoryInput),
      async (c) =>
        c.json({ data: await catalog.saveCategory(c.req.valid('json')) }, 201),
    );
    router.patch(
      '/categories/:categoryId',
      allowed('update'),
      describeRoute({
        tags,
        summary: 'Update a workflow category',
        operationId: 'examplesUpdateWorkflowCategory',
        responses: { 200: dataResponse(WorkflowCategorySchema), ...failures },
      }),
      apiValidator('param', WorkflowCategoryParams),
      apiValidator('json', WorkflowCategoryInput),
      async (c) =>
        c.json({
          data: await catalog.saveCategory(
            c.req.valid('json'),
            c.req.valid('param').categoryId,
          ),
        }),
    );
    router.delete(
      '/categories/:categoryId',
      allowed('update'),
      describeRoute({
        tags,
        summary: 'Delete a category and uncategorize its workflows',
        operationId: 'examplesDeleteWorkflowCategory',
        responses: { 200: dataResponse(z.null()), ...failures },
      }),
      apiValidator('param', WorkflowCategoryParams),
      async (c) => {
        await catalog.deleteCategory(c.req.valid('param').categoryId);
        return c.json({ data: null });
      },
    );
    router.put(
      '/definitions/:workflowId/category',
      allowed('update'),
      describeRoute({
        tags,
        summary: 'Assign a workflow category',
        operationId: 'examplesAssignWorkflowCategory',
        responses: { 200: dataResponse(z.null()), ...failures },
      }),
      apiValidator('param', WorkflowParams),
      apiValidator('json', WorkflowCategoryAssignment),
      async (c) => {
        const { workflowId } = c.req.valid('param');
        service.assertWorkflow(workflowId);
        await catalog.assign(workflowId, c.req.valid('json').categoryId);
        return c.json({ data: null });
      },
    );
    router.get(
      '/definitions',
      describeRoute({
        tags,
        summary: 'List example workflow definitions',
        operationId: 'examplesListWorkflowDefinitions',
        description:
          'Users granted workflow management read access may inspect runnable workflow examples. The q keyword matches workflow identifiers and English or Chinese display names, ignoring case. Category filtering is applied before execution statistics are loaded.',
        responses: {
          200: dataResponse(z.array(WorkflowSummarySchema)),
          ...failures,
        },
      }),
      apiValidator('query', WorkflowDefinitionQuery),
      async (context) => {
        const { q, category } = context.req.valid('query');
        return context.json({ data: await service.definitions(q, category) });
      },
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
    const parameters = app.container.resolve(
      parameterConfigurationServiceToken,
    );
    const officeParameters = new OfficeWorkflowParameterService(
      app.container.resolve(databaseManagerToken),
    );
    router.get(
      '/definitions/:workflowId/parameters',
      describeRoute({
        tags,
        summary: 'Read parameters owned by a workflow',
        operationId: 'examplesGetWorkflowParameters',
        responses: {
          200: dataResponse(z.record(z.string(), z.unknown())),
          ...failures,
        },
      }),
      apiValidator('param', WorkflowParams),
      async (c) => {
        const { workflowId } = c.req.valid('param');
        const { workflow } = await service.definition(workflowId);
        return c.json({
          data:
            workflow.source === 'office'
              ? {
                  kind: 'office',
                  ...(await officeParameters.read(workflow.name)),
                }
              : await parameters.readWorkflow('zhao', workflow.name),
        });
      },
    );
    router.put(
      '/definitions/:workflowId/parameters',
      allowed('update'),
      describeRoute({
        tags,
        summary: 'Save parameters owned by a workflow',
        operationId: 'examplesSaveWorkflowParameters',
        responses: {
          200: dataResponse(z.record(z.string(), z.unknown())),
          409: apiErrorResponse(409),
          ...failures,
        },
      }),
      apiValidator('param', WorkflowParams),
      apiValidator(
        'json',
        z.discriminatedUnion('kind', [
          z.strictObject({
            kind: z.literal('lifecycle'),
            values: z.record(z.string(), z.unknown()),
            expectedRevision: z.number().int().min(0),
            requestId: z.string().min(1).max(100),
          }),
          z.strictObject({
            kind: z.literal('office'),
            values: OfficeWorkflowValues,
            organization: z
              .strictObject({
                expectedRevision: z.number().int().min(0),
                departments: z
                  .array(z.unknown())
                  .max(100)
                  .transform((departments, ctx) => {
                    const parsed = OfficeWorkflowValues.safeParse({
                      departments,
                    });
                    if (!parsed.success) {
                      for (const issue of parsed.error.issues)
                        ctx.addIssue({ ...issue, path: issue.path.slice(1) });
                      return z.NEVER;
                    }
                    return parsed.data.departments!;
                  }),
              })
              .optional(),
            expectedRevision: z.number().int().min(0),
          }),
        ]),
      ),
      async (c) => {
        const { workflowId } = c.req.valid('param');
        const { workflow } = await service.definition(workflowId);
        const input = c.req.valid('json');
        if (input.kind !== workflow.source)
          throw new ApiError({
            status: 'INVALID_ARGUMENT',
            domain: 'examples',
            reason: 'INVALID_WORKFLOW_PARAMETERS',
            message: 'The parameters do not belong to this workflow.',
          });
        return c.json({
          data:
            input.kind === 'office'
              ? await officeParameters.save(
                  workflow.name,
                  input.values,
                  input.expectedRevision,
                  input.organization,
                )
              : await parameters.saveWorkflow(
                  input.values as import('@nocobase/lifecycle').JsonObject,
                  input.expectedRevision,
                  input.requestId,
                  'zhao',
                  workflow.name,
                ),
        });
      },
    );
    router.get(
      '/executions',
      describeRoute({
        tags,
        summary: 'List example workflow executions',
        operationId: 'examplesListWorkflowExecutions',
        description:
          'An execution is one lifecycle-managed business record. Workflow managers may inspect demonstration records. Results default to newest first, with chronological sorting, workflow filtering and pagination. The q keyword matches workflow identifiers and English or Chinese display names, ignoring case, before pagination.',
        responses: {
          200: listResponse(WorkflowExecutionSchema, WorkflowPageMeta),
          ...failures,
        },
      }),
      apiValidator('query', WorkflowPageQuery),
      async (context) => {
        const { page, pageSize, workflowId, q, order } =
          context.req.valid('query');
        return context.json(
          await service.executions(page, pageSize, workflowId, order, q),
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

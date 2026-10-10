import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  describeRoute,
  listResponse,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import { workflowErrorHandler } from './errors.js';
import { paginate, parseBoolean, toPageResponse } from './helpers.js';
import {
  PageQuery,
  WORKFLOW_API_TAG,
  WorkflowDefinitionSchema,
  WorkflowListItemSchema,
  WorkflowListQuery,
  WorkflowPageMeta,
  WorkflowParameterSettingsSchema,
  WorkflowParametersInput,
  WorkflowParams,
  WorkflowSourceParams,
} from './schemas.js';
import type { WorkflowRepository } from '../repositories/workflow-repository.js';

const workflowNotFound = apiErrorResponse(
  404,
  'No workflow revision has this id, and no deployed Artifact has this hash (`WORKFLOW_NOT_FOUND`).',
);

export function createWorkflowDefinitionRoutes(
  workflows: Pick<
    WorkflowRepository,
    | 'list'
    | 'enable'
    | 'disable'
    | 'getParameters'
    | 'updateParameters'
    | 'getSource'
    | 'sourceRevisions'
    | 'get'
    | 'revisions'
  >,
): Hono {
  const routes = new Hono();
  routes.onError(workflowErrorHandler);

  routes.get(
    '/workflows',
    describeRoute({
      tags: [WORKFLOW_API_TAG],
      summary: 'List workflows',
      description:
        'Lists the current revision of every workflow key, newest first, followed by deployed Artifacts whose key has no revision yet. Those have a `null` id and are addressed by their hash.',
      operationId: 'workflowsListWorkflows',
      responses: {
        200: listResponse(WorkflowListItemSchema, WorkflowPageMeta),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', WorkflowListQuery),
    async (c) => {
      const { q, enabled, page, pageSize } = c.req.valid('query');
      const enabledFilter = parseBoolean(enabled);
      const result = await workflows.list({
        ...(q === undefined ? {} : { query: q }),
        ...(enabledFilter === undefined ? {} : { enabled: enabledFilter }),
        ...(page === undefined ? {} : { page }),
        ...(pageSize === undefined ? {} : { pageSize }),
      });
      return c.json(toPageResponse(result));
    },
  );

  // Fixed segments are registered before `/workflows/:workflowId`, which a numeric id or an Artifact hash can never
  // shadow: neither form can spell `sources`.
  routes.get(
    '/workflows/sources/:key',
    describeRoute({
      tags: [WORKFLOW_API_TAG],
      summary: 'Get the latest source of a workflow key',
      description:
        'Reads the definition of the Artifact currently deployed for a workflow key, without materializing it. When that Artifact already has a revision, the revision is returned.',
      operationId: 'workflowsGetWorkflowSource',
      responses: {
        200: dataResponse(WorkflowDefinitionSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(
          404,
          'No Artifact is deployed for this key (`WORKFLOW_SOURCE_NOT_FOUND`).',
        ),
      },
    }),
    apiValidator('param', WorkflowSourceParams),
    async (c) =>
      c.json({ data: await workflows.getSource(c.req.valid('param').key) }),
  );
  routes.get(
    '/workflows/sources/:key/revisions',
    describeRoute({
      tags: [WORKFLOW_API_TAG],
      summary: 'List the revisions of a workflow key',
      description:
        'Lists every revision of a workflow key, newest first, starting with a deployed Artifact that has no revision yet.',
      operationId: 'workflowsListWorkflowSourceRevisions',
      responses: {
        200: listResponse(WorkflowDefinitionSchema, WorkflowPageMeta),
        ...apiErrorResponses,
        404: apiErrorResponse(
          404,
          'No Artifact is deployed for this key (`WORKFLOW_SOURCE_NOT_FOUND`).',
        ),
      },
    }),
    apiValidator('param', WorkflowSourceParams),
    apiValidator('query', PageQuery),
    async (c) =>
      c.json(
        paginate(
          await workflows.sourceRevisions(c.req.valid('param').key),
          c.req.valid('query'),
        ),
      ),
  );

  routes.get(
    '/workflows/:workflowId',
    describeRoute({
      tags: [WORKFLOW_API_TAG],
      summary: 'Get a workflow revision',
      description:
        'Reads a revision by its id, or a deployed Artifact by its hash without materializing it.',
      operationId: 'workflowsGetWorkflow',
      responses: {
        200: dataResponse(WorkflowDefinitionSchema),
        ...apiErrorResponses,
        404: workflowNotFound,
      },
    }),
    apiValidator('param', WorkflowParams),
    async (c) =>
      c.json({ data: await workflows.get(c.req.valid('param').workflowId) }),
  );
  routes.get(
    '/workflows/:workflowId/revisions',
    describeRoute({
      tags: [WORKFLOW_API_TAG],
      summary: 'List the revisions of a workflow',
      description:
        "Lists every revision of the addressed workflow's key, newest first, starting with a deployed Artifact that has no revision yet.",
      operationId: 'workflowsListWorkflowRevisions',
      responses: {
        200: listResponse(WorkflowDefinitionSchema, WorkflowPageMeta),
        ...apiErrorResponses,
        404: workflowNotFound,
      },
    }),
    apiValidator('param', WorkflowParams),
    apiValidator('query', PageQuery),
    async (c) =>
      c.json(
        paginate(
          await workflows.revisions(c.req.valid('param').workflowId),
          c.req.valid('query'),
        ),
      ),
  );
  routes.get(
    '/workflows/:workflowId/parameters',
    describeRoute({
      tags: [WORKFLOW_API_TAG],
      summary: 'Get the parameters of a workflow revision',
      description:
        'Reads the parameter declarations and saved values of a revision. Addressing a deployed Artifact by its hash materializes it as a revision.',
      operationId: 'workflowsGetWorkflowParameters',
      responses: {
        200: dataResponse(WorkflowParameterSettingsSchema),
        ...apiErrorResponses,
        404: workflowNotFound,
      },
    }),
    apiValidator('param', WorkflowParams),
    async (c) =>
      c.json({
        data: await workflows.getParameters(c.req.valid('param').workflowId),
      }),
  );
  routes.put(
    '/workflows/:workflowId/parameters',
    describeRoute({
      tags: [WORKFLOW_API_TAG],
      summary: 'Replace the parameter values of a workflow revision',
      description:
        'Replaces the saved parameter values of a revision. The first save for a key without a current revision makes this revision current. Values that do not match the declarations are rejected with `INVALID_PARAMETER_VALUES`.',
      operationId: 'workflowsReplaceWorkflowParameters',
      responses: {
        200: dataResponse(WorkflowParameterSettingsSchema),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The values do not match the parameter declarations of the revision (`INVALID_PARAMETER_VALUES`).',
        ),
        404: workflowNotFound,
      },
    }),
    apiValidator('param', WorkflowParams),
    apiValidator('json', WorkflowParametersInput),
    async (c) => {
      const data = await workflows.updateParameters(
        c.req.valid('param').workflowId,
        c.req.valid('json').parameterValues,
      );
      return c.json({ data });
    },
  );
  routes.post(
    '/workflows/:workflowId/enable',
    describeRoute({
      tags: [WORKFLOW_API_TAG],
      summary: 'Enable a workflow revision',
      description:
        'Makes the addressed revision the current one of its key and enables it. Addressing a deployed Artifact by its hash materializes it first.',
      operationId: 'workflowsEnableWorkflow',
      responses: {
        200: dataResponse(WorkflowListItemSchema),
        ...apiErrorResponses,
        404: workflowNotFound,
      },
    }),
    apiValidator('param', WorkflowParams),
    async (c) =>
      c.json({ data: await workflows.enable(c.req.valid('param').workflowId) }),
  );
  routes.post(
    '/workflows/:workflowId/disable',
    describeRoute({
      tags: [WORKFLOW_API_TAG],
      summary: 'Disable a workflow',
      description:
        'Disables every revision of the key whose current revision has this id. Only a materialized id is accepted; an Artifact hash is rejected with `INVALID_WORKFLOW_ID`.',
      operationId: 'workflowsDisableWorkflow',
      responses: {
        200: dataResponse(WorkflowListItemSchema),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The path names an Artifact hash rather than a materialized id (`INVALID_WORKFLOW_ID`).',
        ),
        404: apiErrorResponse(
          404,
          'No current revision has this id (`WORKFLOW_NOT_FOUND`).',
        ),
      },
    }),
    apiValidator('param', WorkflowParams),
    async (c) =>
      c.json({
        data: await workflows.disable(c.req.valid('param').workflowId),
      }),
  );

  return routes;
}

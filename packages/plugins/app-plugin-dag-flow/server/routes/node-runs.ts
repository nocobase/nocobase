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
import { paginate } from './helpers.js';
import {
  NodeRunListQuery,
  NodeRunParams,
  WORKFLOW_API_TAG,
  WorkflowNodeRunPayloadSchema,
  WorkflowNodeRunSchema,
  WorkflowPageMeta,
  WorkflowRunParams,
} from './schemas.js';
import type { WorkflowRunRepository } from '../repositories/workflow-run-repository.js';

export function createNodeRunRoutes(
  workflowRuns: Pick<WorkflowRunRepository, 'nodeRuns' | 'nodeRunPayload'>,
): Hono {
  const routes = new Hono();
  routes.onError(workflowErrorHandler);

  routes.get(
    '/workflows/runs/:runId/nodeRuns',
    describeRoute({
      tags: [WORKFLOW_API_TAG],
      summary: 'List the node runs of a workflow run',
      description:
        'Lists every node run of a run in execution order, including repeated runs of the same node. A run id that names no run yields an empty list.',
      operationId: 'workflowsListNodeRuns',
      responses: {
        200: listResponse(WorkflowNodeRunSchema, WorkflowPageMeta),
        ...apiErrorResponses,
      },
    }),
    apiValidator('param', WorkflowRunParams),
    apiValidator('query', NodeRunListQuery),
    async (c) => {
      const { nodeKey, page, pageSize } = c.req.valid('query');
      const nodeRuns = await workflowRuns.nodeRuns(
        c.req.valid('param').runId,
        nodeKey,
      );
      return c.json(paginate(nodeRuns, { page, pageSize }));
    },
  );

  routes.get(
    '/workflows/runs/:runId/nodeRuns/:nodeRunId/payload',
    describeRoute({
      tags: [WORKFLOW_API_TAG],
      summary: 'Get the payload of a node run',
      description:
        'Reads the result, error and log of a node run. Keys that look like secrets are redacted, and each part is cut at 64 KiB.',
      operationId: 'workflowsGetNodeRunPayload',
      responses: {
        200: dataResponse(WorkflowNodeRunPayloadSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(
          404,
          'The run has no node run with this id (`NODE_RUN_NOT_FOUND`).',
        ),
      },
    }),
    apiValidator('param', NodeRunParams),
    async (c) => {
      const { runId, nodeRunId } = c.req.valid('param');
      return c.json({
        data: await workflowRuns.nodeRunPayload(runId, nodeRunId),
      });
    },
  );

  return routes;
}

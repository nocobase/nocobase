import { parseApiInput } from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { validator } from 'hono/validator';

import { workflowErrorHandler } from './errors.js';
import { paginate } from './helpers.js';
import {
  NodeRunListQuery,
  NodeRunParams,
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
    validator('param', (value) => parseApiInput(WorkflowRunParams, value)),
    validator('query', (value) => parseApiInput(NodeRunListQuery, value)),
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
    validator('param', (value) => parseApiInput(NodeRunParams, value)),
    async (c) => {
      const { runId, nodeRunId } = c.req.valid('param');
      return c.json({
        data: await workflowRuns.nodeRunPayload(runId, nodeRunId),
      });
    },
  );

  return routes;
}

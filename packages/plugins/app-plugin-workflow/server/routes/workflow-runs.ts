import { parseApiInput } from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { validator } from 'hono/validator';

import { workflowErrorHandler } from './errors.js';
import { parseStatus, toPageResponse } from './helpers.js';
import {
  RunWorkflowHeaders,
  RunWorkflowInput,
  WorkflowParams,
  WorkflowRunListQuery,
  WorkflowRunParams,
} from './schemas.js';
import type { WorkflowRunRepository } from '../repositories/workflow-run-repository.js';

/**
 * Run routes. `/workflows/runs` shares its first segment with `/workflows/:workflowId`, so the application mounts these
 * before the definition routes; a workflow id is a number or a 64-character hash and can never be `runs` either way.
 */
export function createWorkflowRunRoutes(
  workflowRuns: Pick<WorkflowRunRepository, 'list' | 'get' | 'run'>,
): Hono {
  const routes = new Hono();
  routes.onError(workflowErrorHandler);

  routes.get(
    '/workflows/runs',
    validator('query', (value) => parseApiInput(WorkflowRunListQuery, value)),
    async (c) => {
      const query = c.req.valid('query');
      const status = parseStatus(query.status);
      const page = await workflowRuns.list({
        ...(query.workflowId === undefined
          ? {}
          : { workflowId: query.workflowId }),
        ...(query.workflowKey === undefined
          ? {}
          : { workflowKey: query.workflowKey }),
        ...(query.workflowTitle === undefined
          ? {}
          : { workflowTitle: query.workflowTitle }),
        ...(status === undefined ? {} : { status }),
        ...(query.page === undefined ? {} : { page: query.page }),
        ...(query.pageSize === undefined ? {} : { pageSize: query.pageSize }),
      });
      return c.json(toPageResponse(page));
    },
  );

  routes.get(
    '/workflows/runs/:runId',
    validator('param', (value) => parseApiInput(WorkflowRunParams, value)),
    async (c) =>
      c.json({ data: await workflowRuns.get(c.req.valid('param').runId) }),
  );

  routes.post(
    '/workflows/:workflowId/run',
    validator('param', (value) => parseApiInput(WorkflowParams, value)),
    validator('header', (value) => parseApiInput(RunWorkflowHeaders, value)),
    validator('json', (value) => parseApiInput(RunWorkflowInput, value)),
    async (c) => {
      const eventKey = c.req.valid('header')['event-key'];
      const data = await workflowRuns.run(
        c.req.valid('param').workflowId,
        c.req.valid('json').input,
        { eventKey },
      );
      return c.json({ data });
    },
  );

  return routes;
}

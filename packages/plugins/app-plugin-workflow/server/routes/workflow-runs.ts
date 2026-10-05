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
import { parseStatus, toPageResponse } from './helpers.js';
import {
  RunWorkflowHeaders,
  RunWorkflowInput,
  WORKFLOW_API_TAG,
  WorkflowPageMeta,
  WorkflowParams,
  WorkflowRunDetailSchema,
  WorkflowRunListQuery,
  WorkflowRunParams,
  WorkflowRunSchema,
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
    describeRoute({
      tags: [WORKFLOW_API_TAG],
      summary: 'List workflow runs',
      description:
        'Lists runs, newest first. `workflowId` narrows the list to the runs of that workflow key across all its revisions; a `workflowId` that names no workflow is rejected with `WORKFLOW_NOT_FOUND`.',
      operationId: 'workflowsListWorkflowRuns',
      responses: {
        200: listResponse(WorkflowRunSchema, WorkflowPageMeta),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The `workflowId` filter names no workflow (`WORKFLOW_NOT_FOUND`, `INVALID_WORKFLOW_ID`).',
        ),
      },
    }),
    apiValidator('query', WorkflowRunListQuery),
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
    describeRoute({
      tags: [WORKFLOW_API_TAG],
      summary: 'Get a workflow run',
      description:
        'Reads a run with its input and the latest node run of each node it reached.',
      operationId: 'workflowsGetWorkflowRun',
      responses: {
        200: dataResponse(WorkflowRunDetailSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(
          404,
          'No run has this id (`WORKFLOW_RUN_NOT_FOUND`).',
        ),
      },
    }),
    apiValidator('param', WorkflowRunParams),
    async (c) =>
      c.json({ data: await workflowRuns.get(c.req.valid('param').runId) }),
  );

  routes.post(
    '/workflows/:workflowId/run',
    describeRoute({
      tags: [WORKFLOW_API_TAG],
      summary: 'Run a workflow',
      description:
        "Starts a manual run of a revision, enabled or not, and answers once the run is recorded without waiting for it to finish; read the run for its outcome. Addressing a deployed Artifact by its hash materializes it first. The input is validated against the workflow's input schema and rejected with `INVALID_INPUT` and a field violation per issue.",
      operationId: 'workflowsRunWorkflow',
      responses: {
        200: dataResponse(
          WorkflowRunSchema,
          'The run that was started, or the run an earlier request with the same `Event-Key` started.',
        ),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          "The input does not match the workflow's input schema (`INVALID_INPUT`, with a field violation per issue).",
        ),
        404: apiErrorResponse(
          404,
          'No workflow revision has this id, and no deployed Artifact has this hash (`WORKFLOW_NOT_FOUND`).',
        ),
        413: apiErrorResponse(
          413,
          'The input exceeds the size a run accepts (`INPUT_TOO_LARGE`).',
        ),
      },
    }),
    apiValidator('param', WorkflowParams),
    apiValidator('header', RunWorkflowHeaders),
    apiValidator('json', RunWorkflowInput),
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

import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  cliRoute,
  dataResponse,
  describeRoute,
  emptyResponse,
  listResponse,
} from '@nocobase/app-server/router';
import type { Hono } from 'hono';

import { viewerOf, type ViewerEnv } from '../../access/request.js';
import { boundedList, domainRouter, tags } from '../../kernel/http.js';
import {
  BoundedListMeta,
  CreateWorkflowBody,
  PreviewWorkflowBody,
  UpdateWorkflowBody,
  WorkflowParams,
  WorkflowPreviewSchema,
  WorkflowSchema,
} from '../../routes/schemas.js';
import type { WorkflowService } from './workflow.service.js';

const manage = 'Needs `update` on the `pm.workflows` settings item.';
const statusConflict =
  'When issues are still in a status the change would drop (`WORKFLOW_STATUS_CONFLICT`, `metadata.conflicts` per status and project).';

/** `/api/projects/workflows`. */
export function createWorkflowRoutes(
  workflows: WorkflowService,
): Hono<ViewerEnv> {
  const routes = domainRouter<ViewerEnv>();
  routes.get(
    '/',
    describeRoute({
      tags,
      summary: 'List workflows',
      operationId: 'projectsListWorkflows',
      ...cliRoute({
        command: 'workflow list',
        columns: ['id', 'name', 'isDefault', 'projectCount', 'revision'],
      }),
      responses: {
        200: listResponse(WorkflowSchema, BoundedListMeta),
        ...apiErrorResponses,
      },
    }),
    async (context) =>
      context.json(boundedList(await workflows.list(viewerOf(context)))),
  );
  routes.post(
    '/',
    describeRoute({
      tags,
      summary: 'Create a workflow',
      operationId: 'projectsCreateWorkflow',
      ...cliRoute({
        command: 'workflow create',
        args: ['name'],
        flags: {
          copyFrom: {
            name: 'copy-from',
            description:
              'The workflow to copy; `null` for the built-in statuses.',
          },
        },
        examples: ['workflow create "Design review" --copy-from <workflow>'],
      }),
      description: `${manage} The new workflow copies \`copyFrom\`, or the built-in statuses when it is null.`,
      responses: {
        201: dataResponse(WorkflowSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(404, 'When `copyFrom` names no workflow.'),
        409: apiErrorResponse(
          409,
          'When a workflow has that name (`WORKFLOW_EXISTS`).',
        ),
      },
    }),
    apiValidator('json', CreateWorkflowBody),
    async (context) =>
      context.json(
        {
          data: await workflows.create(
            viewerOf(context),
            context.req.valid('json'),
          ),
        },
        201,
      ),
  );
  routes.get(
    '/:workflowId',
    describeRoute({
      tags,
      summary: 'Get a workflow',
      operationId: 'projectsGetWorkflow',
      ...cliRoute({
        command: 'workflow get',
        flags: { workflowId: { name: 'workflow' } },
      }),
      responses: {
        200: dataResponse(WorkflowSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', WorkflowParams),
    async (context) =>
      context.json({
        data: await workflows.get(
          viewerOf(context),
          context.req.valid('param').workflowId,
        ),
      }),
  );
  routes.patch(
    '/:workflowId',
    describeRoute({
      tags,
      summary: 'Update a workflow',
      operationId: 'projectsUpdateWorkflow',
      ...cliRoute({
        command: 'workflow update',
        bodyFile: 'file',
        flags: { workflowId: { name: 'workflow' } },
        examples: [
          'workflow get <workflow> --json > workflow.json',
          'workflow update <workflow> --file change.json',
        ],
      }),
      description: `${manage} \`definition\` is a \`ProjectsWorkflowDefinition\`; its problems are answered as 400 \`INVALID_WORKFLOW\` with \`metadata.issues\` at their paths.`,
      responses: {
        200: dataResponse(WorkflowSchema),
        ...apiErrorResponses,
        400: apiErrorResponse(400, statusConflict),
        404: apiErrorResponse(404),
        409: apiErrorResponse(
          409,
          'When the workflow changed since `revision` (`REVISION_CONFLICT`), or another workflow has that name (`WORKFLOW_EXISTS`).',
        ),
      },
    }),
    apiValidator('param', WorkflowParams),
    apiValidator('json', UpdateWorkflowBody),
    async (context) =>
      context.json({
        data: await workflows.update(
          viewerOf(context),
          context.req.valid('param').workflowId,
          context.req.valid('json'),
        ),
      }),
  );
  // What saving a definition would change; nothing is written.
  routes.post(
    '/:workflowId/preview',
    describeRoute({
      tags,
      summary: 'Preview the rule changes of a workflow definition',
      operationId: 'projectsPreviewWorkflow',
      ...cliRoute({
        command: 'workflow preview',
        bodyFile: 'file',
        flags: { workflowId: { name: 'workflow' } },
        examples: ['workflow preview <workflow> --file change.json'],
      }),
      description:
        'What saving `definition` would change in the workflow’s status rules; nothing is written.',
      responses: {
        200: dataResponse(WorkflowPreviewSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', WorkflowParams),
    apiValidator('json', PreviewWorkflowBody),
    async (context) =>
      context.json({
        data: await workflows.preview(
          viewerOf(context),
          context.req.valid('param').workflowId,
          context.req.valid('json'),
        ),
      }),
  );
  routes.post(
    '/:workflowId/setDefault',
    describeRoute({
      tags,
      summary: 'Make a workflow the default',
      operationId: 'projectsSetDefaultWorkflow',
      ...cliRoute({
        command: 'workflow set-default',
        flags: { workflowId: { name: 'workflow' } },
      }),
      description: `${manage} Projects without a workflow, and issues without a project, use the default.`,
      responses: {
        200: dataResponse(WorkflowSchema),
        ...apiErrorResponses,
        400: apiErrorResponse(400, statusConflict),
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', WorkflowParams),
    async (context) =>
      context.json({
        data: await workflows.setDefault(
          viewerOf(context),
          context.req.valid('param').workflowId,
        ),
      }),
  );
  routes.delete(
    '/:workflowId',
    describeRoute({
      tags,
      summary: 'Delete a workflow',
      operationId: 'projectsDeleteWorkflow',
      ...cliRoute({
        command: 'workflow delete',
        flags: { workflowId: { name: 'workflow' } },
        confirm: 'Delete this workflow?',
      }),
      description: manage,
      responses: {
        204: emptyResponse(),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'When it is the default workflow or a project uses it (`WORKFLOW_IN_USE`).',
        ),
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', WorkflowParams),
    async (context) => {
      await workflows.remove(
        viewerOf(context),
        context.req.valid('param').workflowId,
      );
      return context.body(null, 204);
    },
  );
  return routes;
}

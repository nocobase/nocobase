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

import {
  refuseDelegated,
  viewerOf,
  type ViewerEnv,
} from '../../access/request.js';
import {
  boundedList,
  domainRouter,
  personOrRunSecurity,
  tags,
} from '../../kernel/http.js';
import {
  AddProjectMemberBody,
  BoundedListMeta,
  CreateProjectBody,
  CreateProjectResourceBody,
  ProjectDetailSchema,
  ProjectListItemSchema,
  ProjectMemberParams,
  ProjectMemberSchema,
  ProjectParams,
  ProjectResourceParams,
  ProjectResourceSchema,
  UpdateProjectBody,
  UpdateProjectResourceBody,
} from '../../routes/schemas.js';
import type { ProjectService } from './project.service.js';

const manage = 'Needs `manage` on the project: its lead, or a wider scope.';
const notFound = apiErrorResponse(
  404,
  'When the project does not exist or the caller cannot see it.',
);
const resourceNotFound = apiErrorResponse(
  404,
  'When the project or the working directory does not exist.',
);

/**
 * `/api/projects` and `/api/projects/{projectId}`, mounted after every fixed segment of the namespace. Project ids are
 * generated, so none can equal one. The list is bounded by what an organization runs and is answered whole.
 */
export function createProjectRoutes(projects: ProjectService): Hono<ViewerEnv> {
  const routes = domainRouter<ViewerEnv>();
  routes.get(
    '/',
    describeRoute({
      tags,
      summary: 'List projects',
      operationId: 'projectsListProjects',
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'project list',
        columns: [
          'id',
          'name',
          'lead.name',
          'issueCounts.total',
          'issueCounts.done',
        ],
        action: 'pm.projects/view',
      }),
      description: 'The projects the caller sees, answered whole.',
      responses: {
        200: listResponse(ProjectListItemSchema, BoundedListMeta),
        ...apiErrorResponses,
      },
    }),
    async (context) =>
      context.json(boundedList(await projects.list(viewerOf(context)))),
  );
  routes.post(
    '/',
    describeRoute({
      tags,
      summary: 'Create a project',
      operationId: 'projectsCreateProject',
      ...cliRoute({
        command: 'project create',
        args: ['name'],
        flags: {
          leadUserId: { name: 'lead' },
          workflowId: { name: 'workflow' },
          description: { contentFile: true },
        },
        action: 'pm.projects/create',
        examples: ['project create "Mobile app" --lead <user>'],
      }),
      description:
        'Needs `create` on `pm.projects`. The caller becomes a member and, unless `leadUserId` says otherwise, its lead.',
      responses: {
        201: dataResponse(ProjectDetailSchema),
        ...apiErrorResponses,
      },
    }),
    apiValidator('json', CreateProjectBody),
    async (context) =>
      context.json(
        {
          data: await projects.create(
            viewerOf(context),
            context.req.valid('json'),
          ),
        },
        201,
      ),
  );
  routes.get(
    '/:projectId',
    describeRoute({
      tags,
      summary: 'Get a project',
      operationId: 'projectsGetProject',
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'project get',
        flags: { projectId: { name: 'project' } },
        action: 'pm.projects/view',
      }),
      description: 'With its members and working directories.',
      responses: {
        200: dataResponse(ProjectDetailSchema),
        ...apiErrorResponses,
        404: notFound,
      },
    }),
    apiValidator('param', ProjectParams),
    async (context) =>
      context.json({
        data: await projects.get(
          viewerOf(context),
          context.req.valid('param').projectId,
        ),
      }),
  );
  routes.patch(
    '/:projectId',
    describeRoute({
      tags,
      summary: 'Update a project',
      operationId: 'projectsUpdateProject',
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'project update',
        action: 'pm.projects/manage',
        flags: {
          projectId: { name: 'project' },
          leadUserId: { name: 'lead' },
          workflowId: { name: 'workflow' },
          description: { contentFile: true },
        },
      }),
      description: `${manage} Switching \`workflowId\` is refused while an issue is in a status the new workflow lacks (400 \`WORKFLOW_STATUS_CONFLICT\`).`,
      responses: {
        200: dataResponse(ProjectDetailSchema),
        ...apiErrorResponses,
        404: notFound,
      },
    }),
    apiValidator('param', ProjectParams),
    apiValidator('json', UpdateProjectBody),
    async (context) => {
      refuseDelegated(context);
      return context.json({
        data: await projects.update(
          viewerOf(context),
          context.req.valid('param').projectId,
          context.req.valid('json'),
        ),
      });
    },
  );
  routes.delete(
    '/:projectId',
    describeRoute({
      tags,
      summary: 'Delete a project',
      operationId: 'projectsDeleteProject',
      ...cliRoute({
        command: 'project delete',
        flags: { projectId: { name: 'project' } },
        confirm: 'Delete this project? Its issues are kept, without a project.',
        action: 'pm.projects/delete',
      }),
      description:
        'Needs `delete` on `pm.projects`. Its issues are kept, without a project.',
      responses: {
        204: emptyResponse(),
        ...apiErrorResponses,
        404: notFound,
      },
    }),
    apiValidator('param', ProjectParams),
    async (context) => {
      await projects.remove(
        viewerOf(context),
        context.req.valid('param').projectId,
      );
      return context.body(null, 204);
    },
  );
  // Answers the member added.
  routes.post(
    '/:projectId/members',
    describeRoute({
      tags,
      summary: 'Add a project member',
      operationId: 'projectsAddProjectMember',
      ...cliRoute({
        command: 'project member add',
        args: ['projectId', 'userId'],
        flags: { projectId: { name: 'project' }, userId: { name: 'user' } },
        examples: [
          'project member candidates',
          'project member add <project> <user>',
        ],
      }),
      description: `${manage} Answers the member added.`,
      responses: {
        201: dataResponse(ProjectMemberSchema),
        ...apiErrorResponses,
        404: notFound,
      },
    }),
    apiValidator('param', ProjectParams),
    apiValidator('json', AddProjectMemberBody),
    async (context) => {
      const input = context.req.valid('json');
      const members = await projects.addMember(
        viewerOf(context),
        context.req.valid('param').projectId,
        input,
      );
      return context.json(
        { data: members.find((member) => member.id === input.userId) ?? null },
        201,
      );
    },
  );
  routes.delete(
    '/:projectId/members/:userId',
    describeRoute({
      tags,
      summary: 'Remove a project member',
      operationId: 'projectsRemoveProjectMember',
      ...cliRoute({
        command: 'project member remove',
        flags: { projectId: { name: 'project' }, userId: { name: 'user' } },
        confirm: 'Remove this member from the project?',
      }),
      description: manage,
      responses: {
        204: emptyResponse(),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'When the member is the project’s lead (`LEAD_MEMBER`).',
        ),
        404: notFound,
      },
    }),
    apiValidator('param', ProjectMemberParams),
    async (context) => {
      const { projectId, userId } = context.req.valid('param');
      await projects.removeMember(viewerOf(context), projectId, userId);
      return context.body(null, 204);
    },
  );
  routes.post(
    '/:projectId/resources',
    describeRoute({
      tags,
      summary: 'Add a working directory to a project',
      operationId: 'projectsCreateProjectResource',
      ...cliRoute({
        command: 'project resource add',
        flags: {
          projectId: { name: 'project' },
          runnerId: { name: 'runner' },
          initPrompt: { contentFile: true },
        },
        examples: [
          'project resource add <project> --type gitRepo --url https://github.com/acme/app.git',
          'project resource add <project> --type directory --runner <runner> --path /srv/app',
        ],
      }),
      description: `${manage} A \`gitRepo\` needs \`url\`; a \`directory\` needs \`runnerId\` and an absolute \`path\`.`,
      responses: {
        201: dataResponse(ProjectResourceSchema),
        ...apiErrorResponses,
        404: notFound,
      },
    }),
    apiValidator('param', ProjectParams),
    apiValidator('json', CreateProjectResourceBody),
    async (context) =>
      context.json(
        {
          data: await projects.addResource(
            viewerOf(context),
            context.req.valid('param').projectId,
            context.req.valid('json'),
          ),
        },
        201,
      ),
  );
  routes.patch(
    '/:projectId/resources/:resourceId',
    describeRoute({
      tags,
      summary: 'Update a project’s working directory',
      operationId: 'projectsUpdateProjectResource',
      ...cliRoute({
        command: 'project resource update',
        flags: {
          projectId: { name: 'project' },
          resourceId: { name: 'resource' },
          runnerId: { name: 'runner' },
          initPrompt: { contentFile: true },
        },
      }),
      description: `${manage} Its type does not change; fields of the other type are refused.`,
      responses: {
        200: dataResponse(ProjectResourceSchema),
        ...apiErrorResponses,
        404: resourceNotFound,
      },
    }),
    apiValidator('param', ProjectResourceParams),
    apiValidator('json', UpdateProjectResourceBody),
    async (context) => {
      const { projectId, resourceId } = context.req.valid('param');
      return context.json({
        data: await projects.updateResource(
          viewerOf(context),
          projectId,
          resourceId,
          context.req.valid('json'),
        ),
      });
    },
  );
  routes.delete(
    '/:projectId/resources/:resourceId',
    describeRoute({
      tags,
      summary: 'Remove a project’s working directory',
      operationId: 'projectsDeleteProjectResource',
      ...cliRoute({
        command: 'project resource remove',
        flags: {
          projectId: { name: 'project' },
          resourceId: { name: 'resource' },
        },
        confirm: 'Remove this working directory from the project?',
      }),
      description: manage,
      responses: {
        204: emptyResponse(),
        ...apiErrorResponses,
        404: resourceNotFound,
      },
    }),
    apiValidator('param', ProjectResourceParams),
    async (context) => {
      const { projectId, resourceId } = context.req.valid('param');
      await projects.removeResource(viewerOf(context), projectId, resourceId);
      return context.body(null, 204);
    },
  );
  return routes;
}

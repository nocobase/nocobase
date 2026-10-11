/**
 * New projects and their initialization (`service.ts`, `shared/project-init.ts`), signed in:
 *
 * - `POST /api/projectSetups` (`NewProjectRequest`): a new project from the wizard, for whoever may create projects;
 *   what it makes asks for its own permissions on the way (the project, linking its working directory). 201 with
 *   `NewProjectResult`.
 * - `GET /api/projectSetups/:projectId`: the project's initialization (`ProjectInitView`, or null), for whoever sees
 *   it. Reading changes nothing: the provider asks the host about running initializations on a timer.
 * - `POST /api/projectSetups/:projectId/retry`: runs the failed initialization workflow again, for whoever manages it.
 * - `POST /api/projects/:projectId/codeLocations` (`AddCodeLocationRequest`): a working directory added to a project,
 *   chosen as the wizard chooses one, for whoever manages the project. 201 with `CodeLocationResult`.
 *
 * An issue's page finds whether it is its project's init issue through the project's (`ProjectInitView.issueId`).
 * Template repositories and their workflows are listed by Studio's git routes
 * (`GET /api/git/connections/:connectionId/templateRepositories`, `…/repositories/:owner/:name/workflows`).
 */
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import {
  projectsAccessToken,
  type Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import type { Application } from '@nocobase/app-server/application';
import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  cliRoute,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';

import { studioError, studioErrorHandler } from '../http/errors.js';
import {
  AddCodeLocationInput,
  CodeLocationResultSchema,
  NewProjectInput,
  NewProjectResultSchema,
  ProjectInitSchema,
  ProjectParams,
} from './schemas.js';
import { studioProjectInitsToken } from './token.js';

const tags = ['Studio'];

const projectNotFound = apiErrorResponse(
  404,
  'The project does not exist or the caller may not see it.',
);

export const projectInitsRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes((app) => {
    const { container } = app;
    if (
      !container.has(studioProjectInitsToken) ||
      !container.has(authenticationToken) ||
      !container.has(authorizationToken) ||
      !container.has(projectsAccessToken)
    )
      return new Hono();
    const authentication = container.resolve(authenticationToken);
    const authorization = container.resolve(authorizationToken);
    const access = container.resolve(projectsAccessToken);
    const inits = container.resolve(studioProjectInitsToken);

    type Env = { Variables: { studioViewer: Viewer } };
    const viewerOf = createMiddleware<Env>(async (context, next) => {
      const auth = context.get('auth' as never) as { user: { id: string } };
      const authz = context.get('authz' as never) as {
        identity: Parameters<typeof access.permissionsOf>[0];
      };
      context.set('studioViewer', {
        userId: auth.user.id,
        actor: { type: 'user', id: auth.user.id },
        permissions: await access.permissionsOf(authz.identity),
      });
      await next();
    });

    const routes = new Hono<Env>();
    routes.onError(studioErrorHandler);
    routes.use('*', authentication.required());
    routes.use('*', authorization.middleware());
    routes.use('*', viewerOf);

    routes.post(
      '/',
      async (c, next) => {
        if (
          c.get('studioViewer').permissions.scopes['pm.projects/create'] ===
          'none'
        )
          throw studioError(
            'PERMISSION_DENIED',
            'FORBIDDEN',
            'You may not create projects.',
          );
        await next();
      },
      describeRoute({
        tags,
        summary: 'Create a project with its working directory',
        operationId: 'projectSetupsCreateProject',
        ...cliRoute({
          command: 'project setup create',
          flags: {
            workflowId: { name: 'workflow' },
            initAgentId: { name: 'init-agent' },
          },
          bodyFile: 'file',
          examples: [
            'project setup create --name Web --code-location none',
            'project setup create --file project.json',
          ],
        }),
        description:
          'For whoever may create projects. Creates the project with its workflow and working directory (a new repository, an existing one, a directory on a runner, or none), and the "Initialize project" issue when the directory is initialized. Everything is checked before anything is made; linking a repository asks for its own permission.',
        responses: {
          201: dataResponse(NewProjectResultSchema, 'Created.'),
          400: apiErrorResponse(
            400,
            'A value is refused by the service (a repository name, a template’s workflow, an agent), or the code host refused the request.',
          ),
          ...apiErrorResponses,
          503: apiErrorResponse(
            503,
            'The code host could not be reached (`GITHUB_UNAVAILABLE`).',
          ),
        },
      }),
      apiValidator('json', NewProjectInput),
      async (c) =>
        c.json(
          {
            data: await inits.newProject(
              c.get('studioViewer'),
              c.req.valid('json'),
            ),
          },
          201,
        ),
    );
    routes.get(
      '/:projectId',
      describeRoute({
        tags,
        summary: 'Read a project’s initialization',
        operationId: 'projectSetupsGetProjectSetup',
        ...cliRoute({
          command: 'project setup get',
          flags: { projectId: { name: 'project' } },
        }),
        description:
          'For whoever sees the project. `data` is null for a project without an initialization. Reading changes nothing.',
        responses: {
          200: dataResponse(ProjectInitSchema.nullable()),
          401: apiErrorResponse(401),
          404: projectNotFound,
          500: apiErrorResponse(500),
        },
      }),
      apiValidator('param', ProjectParams),
      async (c) =>
        c.json({
          data: await inits.view(
            c.get('studioViewer'),
            c.req.valid('param').projectId,
          ),
        }),
    );
    routes.post(
      '/:projectId/retry',
      describeRoute({
        tags,
        summary: 'Run a failed initialization workflow again',
        operationId: 'projectSetupsRetry',
        ...cliRoute({
          command: 'project setup retry',
          flags: { projectId: { name: 'project' } },
        }),
        description: 'For whoever manages the project.',
        responses: {
          200: dataResponse(ProjectInitSchema),
          400: apiErrorResponse(
            400,
            'Only a failed initialization workflow that has run runs again (`INIT_NOT_FAILED`, `INIT_NO_RUN`).',
          ),
          ...apiErrorResponses,
          404: apiErrorResponse(
            404,
            'The project does not exist or the caller may not see it, or it has no initialization (`PROJECT_INIT_NOT_FOUND`).',
          ),
        },
      }),
      apiValidator('param', ProjectParams),
      async (c) =>
        c.json({
          data: await inits.retry(
            c.get('studioViewer'),
            c.req.valid('param').projectId,
          ),
        }),
    );

    // Only this path: the rest of `/projects` is the projects plugin's.
    const LOCATIONS = '/projects/:projectId/codeLocations';
    const locations = new Hono<Env>();
    locations.onError(studioErrorHandler);
    locations.post(
      LOCATIONS,
      authentication.required(),
      authorization.middleware(),
      viewerOf,
      describeRoute({
        tags,
        summary: 'Add a working directory to a project',
        operationId: 'projectSetupsAddCodeLocation',
        ...cliRoute({
          command: 'project location add',
          flags: {
            projectId: { name: 'project' },
            initAgentId: { name: 'init-agent' },
          },
          bodyFile: 'file',
          examples: ['project location add <project> --file location.json'],
        }),
        description:
          'For whoever manages the project. Adds a working directory as the New project wizard does (a new repository, an existing one or a directory on a runner), with its own "Initialize" issue when a prompt or a template’s workflow initializes it, and, for a repository, its "Deploy & previews" choices. Everything is checked before anything is made: a new repository is created only then.',
        responses: {
          201: dataResponse(CodeLocationResultSchema, 'Created.'),
          400: apiErrorResponse(
            400,
            'A value is refused by the service (a repository name, a template’s workflow, an agent, an environment), or the code host refused the request.',
          ),
          ...apiErrorResponses,
          404: projectNotFound,
          503: apiErrorResponse(
            503,
            'The code host could not be reached (`GITHUB_UNAVAILABLE`).',
          ),
        },
      }),
      apiValidator('param', ProjectParams),
      apiValidator('json', AddCodeLocationInput),
      async (c) =>
        c.json(
          {
            data: await inits.createCodeLocation(
              c.get('studioViewer'),
              c.req.valid('param').projectId,
              c.req.valid('json'),
            ),
          },
          201,
        ),
    );

    const router = new Hono();
    router.route('/projectSetups', routes);
    router.route('/', locations);
    return router;
  });

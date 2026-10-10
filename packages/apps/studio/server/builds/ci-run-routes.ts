/**
 * `/api/repositoryDeployments`, configuring a repository's CI and where it stands (`ci-setup.ts`, `shared/ci-modes.ts`):
 *
 * - `GET /repositoryDeployments/:resourceId/ci/connection`: the setup with what CI reported for each App and the last
 *   run's outcome, for anyone who can see the project;
 * - `POST /repositoryDeployments/:resourceId/ci/configure`: a "Configure CI" run (`CiRunRequest`), carried out at once,
 *   for someone who manages the project; what fails after the run is checked is answered in the connection
 *   (`lastError`);
 * - `DELETE /repositoryDeployments/:resourceId/ci/apps/:appId?environmentId=`: takes an App off the list (its link to
 *   the repository goes; CI's next report brings it back), for someone who manages the project;
 * - `POST /repositoryDeployments/ciWorkflows/generate`: the standard workflow file of an application and a target,
 *   for a repository not added yet (the New project wizard) or to copy, for whoever is signed in;
 * - `GET /repositoryDeployments/ciWorkflows/environments`: the environments a run may deploy to, for whoever is signed in.
 *
 * Behind authentication and the authorization context, like the rest of `/repositoryDeployments`
 * (`../releases/routes.ts`).
 */
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import type { AgentsConfig } from '@nocobase/app-plugin-agents/server/tokens';
import type { Application } from '@nocobase/app-server/application';
import {
  ApiError,
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  cliRoute,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  emptyResponse,
  listResponse,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { releasesToken } from '@nocobase/app-plugin-releases/server/tokens';
import { Hono } from 'hono';

import { forbidden } from '../access/errors.js';
import { studioAccessToken } from '../access/token.js';
import { studioErrorHandler } from '../http/errors.js';
import type { LinkViewer } from '../releases/links.js';
import { studioRepositoryLinksToken } from '../releases/provider.js';
import { RepositoryParams } from '../releases/schemas.js';
import {
  CiRunInput,
  CiConnectionSchema,
  CiEnvironmentSchema,
  CiEnvironmentsMeta,
  CiWorkflowFileSchema,
  CiWorkflowFilesMeta,
  GenerateCiWorkflowInput,
  RemoveCiAppParams,
  RemoveCiAppQuery,
} from './ci-run-schemas.js';
import { parseCiApp, parseCiTarget, standardCiWorkflow } from './ci-modes.js';
import { releasesForCi } from './ci-provider.js';
import { studioCiSetupToken } from './token.js';

const tags = ['Studio'];

const repositoryNotFound = apiErrorResponse(
  404,
  'The working directory does not exist or the caller may not see its project (`REPOSITORY_NOT_FOUND`).',
);

export const ciRunRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes((app) => {
    const { container } = app;
    if (
      !container.has(studioRepositoryLinksToken) ||
      !container.has(authenticationToken) ||
      !container.has(authorizationToken)
    )
      return new Hono();
    const authentication = container.resolve(authenticationToken);
    const authorization = container.resolve(authorizationToken);
    const access = container.resolve(studioAccessToken);
    const links = container.resolve(studioRepositoryLinksToken);

    const ci = () => {
      if (!container.has(studioCiSetupToken))
        throw new ApiError({
          status: 'NOT_FOUND',
          reason: 'CI_SETUP_UNAVAILABLE',
          domain: 'studio',
          message: 'Studio cannot set CI up in this workspace.',
        });
      return container.resolve(studioCiSetupToken);
    };
    /** Studio's address as CI reaches it: `app.publicOrigin`, else the request's. */
    const studioUrl = (requestUrl: string): string => {
      const configured = app.config.get<string>('app.publicOrigin');
      const origin = URL.canParse(configured ?? '')
        ? new URL(configured!).origin
        : new URL(requestUrl).origin;
      return `${origin}${app.publicBasePath.replace(/\/+$/u, '')}`;
    };

    const routes = new Hono<{ Variables: { studioViewer: LinkViewer } }>();
    routes.onError(studioErrorHandler);
    routes.use('*', authentication.required());
    routes.use('*', authorization.middleware());
    routes.use('*', async (context, next) => {
      const auth = context.get('auth' as never) as { user: { id: string } };
      const authz = context.get('authz' as never) as {
        identity: Parameters<typeof access.permissionsOf>[0];
      };
      context.set('studioViewer', {
        userId: auth.user.id,
        permissions: await access.permissionsOf(authz.identity),
      });
      await next();
    });

    // Fixed before `/:resourceId`.
    routes.post(
      '/ciWorkflows/generate',
      describeRoute({
        tags,
        summary: 'Generate the standard CI workflow of an application',
        operationId: 'repositoryDeploymentsGenerateCiWorkflows',
        ...cliRoute({
          command: 'build ci workflows',
          bodyFile: 'file',
          columns: ['path'],
          examples: ['build ci workflows --file run.json --json'],
        }),
        description:
          'For whoever is signed in: the workflow file of one application and target (`nb-studio-<app>-<purpose>.yml`: the App ID without its environment, then `preview` for pull requests or the environment’s name, such as `nb-studio-crm-preview.yml` or `nb-studio-crm-staging.yml`): pull requests that change the application’s directory each deployed to their own App, every push to a branch, or every tag matching a pattern, deployed in the target’s environment. It names no repository or commit: the CLI reads them from the CI run. Nothing is written.',
        responses: {
          200: listResponse(CiWorkflowFileSchema, CiWorkflowFilesMeta),
          400: apiErrorResponse(
            400,
            'An invalid directory or App ID (`INVALID_CI_APP`), or an invalid trigger, branch, tag pattern or environment (`INVALID_CI_TARGET`).',
          ),
          401: apiErrorResponse(401),
          500: apiErrorResponse(500),
        },
      }),
      apiValidator('json', GenerateCiWorkflowInput),
      async (c) => {
        const input = c.req.valid('json');
        const defaultBranch = input.defaultBranch ?? 'main';
        const target = parseCiTarget(input.target, defaultBranch);
        // The environment's name names the file of a branch or tag.
        const environmentName =
          target.trigger !== 'pullRequest' && container.has(releasesToken)
            ? ((
                await releasesForCi(() => container.resolve(releasesToken))
                  .environments()
                  .catch(() => [])
              ).find((environment) => environment.id === target.environmentId)
                ?.name ?? null)
            : null;
        const files = [
          standardCiWorkflow({
            studioUrl: studioUrl(c.req.url),
            defaultBranch,
            app: parseCiApp(input.app, 'app'),
            target,
            environmentName,
            managed: input.managed ?? false,
            cli:
              app.config.get<AgentsConfig>('agents')?.cli?.name ?? 'nb-studio',
          }),
        ];
        return c.json({ data: files, meta: { total: files.length } });
      },
    );

    routes.get(
      '/ciWorkflows/environments',
      describeRoute({
        tags,
        summary: 'List the environments CI may deploy to',
        operationId: 'repositoryDeploymentsListCiEnvironments',
        ...cliRoute({
          command: 'build ci environments',
          columns: ['id', 'name', 'protected'],
        }),
        description:
          'For whoever is signed in: every environment of release management, in its order, with whether it is protected (every deployment there, CI’s included, waits for an approver to approve its request). "Configure CI" offers them as the target’s environment. A bounded list, not paged.',
        responses: {
          200: listResponse(CiEnvironmentSchema, CiEnvironmentsMeta),
          401: apiErrorResponse(401),
          500: apiErrorResponse(500),
        },
      }),
      async (c) => {
        const data = container.has(releasesToken)
          ? await releasesForCi(() =>
              container.resolve(releasesToken),
            ).environments()
          : [];
        return c.json({ data, meta: { total: data.length } });
      },
    );

    routes.get(
      '/:resourceId/ci/connection',
      describeRoute({
        tags,
        summary: 'Read where a repository’s CI stands',
        operationId: 'repositoryDeploymentsGetCiConnection',
        ...cliRoute({
          command: 'build ci connection',
          flags: { resourceId: { name: 'repo' } },
          columns: ['connection', 'repo', 'reported', 'lastError'],
        }),
        description:
          'For whoever sees the project: each App CI reported for the repository with its last build and upload (`apps`, connected only by its own reports), the outcome the last "Configure CI" run awaits (its pull request or agent’s issue), and the API key Studio keeps. A pull request merged or closed since, and an issue finished since, are noticed here.',
        responses: {
          200: dataResponse(CiConnectionSchema),
          401: apiErrorResponse(401),
          404: repositoryNotFound,
          500: apiErrorResponse(500),
        },
      }),
      apiValidator('param', RepositoryParams),
      async (c) => {
        const resourceId = await links.resolve(
          c.get('studioViewer'),
          c.req.valid('param').resourceId,
        );
        const canManage = (await links.read(c.get('studioViewer'), resourceId))
          .canEdit;
        return c.json({ data: await ci().connection(resourceId, canManage) });
      },
    );

    routes.post(
      '/:resourceId/ci/configure',
      describeRoute({
        tags,
        summary: 'Configure a repository’s CI',
        operationId: 'repositoryDeploymentsConfigureCi',
        ...cliRoute({
          command: 'build ci configure',
          flags: { resourceId: { name: 'repo' } },
          bodyFile: 'file',
          columns: ['connection', 'state', 'lastError'],
          examples: ['build ci configure acme/shop --file run.json'],
        }),
        description:
          'For whoever manages the project; may run again at any time, each run connecting one application to one target (pull requests, a branch or a tag, deployed in an environment). Each way makes the repository’s API key (the `CI deploy` preset limited to its Apps, as the caller) or gives it a fresh secret, and writes it as the repository secret; a branch or tag’s App that exists and is not the repository’s yet is recorded for it, so the key reaches it. `direct` and `template` then commit the workflow file (a repository Studio created, once initialized) or propose it in a pull request (added to the one still open); `agent` gives the agent an issue to set the CI up, whose brief never holds the key. Neither the way nor the application is stored: only the pull request or the issue, until it is merged or finished. A failure after the run is checked is answered in the connection (`lastError`), not as an error.',
        responses: {
          200: dataResponse(CiConnectionSchema),
          400: apiErrorResponse(
            400,
            'The run is refused: an invalid directory or App ID (`INVALID_CI_APP`), an invalid trigger, branch, tag pattern or environment (`INVALID_CI_TARGET`), an environment that does not exist (`UNKNOWN_ENVIRONMENT`), a workflow file that is not valid YAML (`INVALID_CI_WORKFLOW`), no agent for `agent` (`AGENT_REQUIRED`), a way Studio does not carry out (`INVALID_CI_METHOD`) or no Git connection (`CI_NEEDS_CONNECTION`).',
          ),
          ...apiErrorResponses,
          403: apiErrorResponse(
            403,
            'The caller does not manage the project, may not configure the App the target names (`APP_NOT_CONFIGURABLE`), or may not have Apps set up when the target’s Apps are to be made (`APPS_NOT_CREATABLE`).',
          ),
          404: repositoryNotFound,
          409: apiErrorResponse(
            409,
            'The App the target names runs in another environment (`APP_IN_OTHER_ENVIRONMENT`).',
          ),
        },
      }),
      apiValidator('param', RepositoryParams),
      apiValidator('json', CiRunInput),
      async (c) => {
        const viewer = c.get('studioViewer');
        const resourceId = await links.resolve(
          c.get('studioViewer'),
          c.req.valid('param').resourceId,
        );
        if (!(await links.read(viewer, resourceId)).canEdit)
          throw forbidden(
            'Only someone who manages the project configures its repository’s CI.',
          );
        await ci().configure(viewer.userId, resourceId, c.req.valid('json'));
        return c.json({ data: await ci().connection(resourceId, true) });
      },
    );

    routes.delete(
      '/:resourceId/ci/apps/:appId',
      describeRoute({
        tags,
        summary: 'Remove an App from a repository’s CI list',
        operationId: 'repositoryDeploymentsRemoveCiApp',
        ...cliRoute({
          command: 'build ci remove',
          args: ['resourceId', 'appId'],
          flags: {
            resourceId: { name: 'repo' },
            appId: { name: 'app' },
            environmentId: { name: 'environment' },
          },
          confirm:
            'Remove this App from the repository’s CI list? CI reporting it again brings it back.',
        }),
        description:
          'For whoever manages the project: takes an App (or, with `pullRequests=true`, an application’s pull request Apps) off the repository’s list in an environment. Its link to the repository goes and the CI key narrows to the Apps left; the builds reported until now stop counting for it, so CI’s next report brings it back. The App itself stays: deleting it is release management’s.',
        responses: {
          204: emptyResponse(),
          ...apiErrorResponses,
          404: apiErrorResponse(
            404,
            'The repository does not exist or the caller may not see it, or the App is not listed in that environment (`CI_APP_NOT_FOUND`).',
          ),
        },
      }),
      apiValidator('param', RemoveCiAppParams),
      apiValidator('query', RemoveCiAppQuery),
      async (c) => {
        const viewer = c.get('studioViewer');
        const { resourceId: named, appId } = c.req.valid('param');
        const resourceId = await links.resolve(viewer, named);
        const { environmentId, pullRequests } = c.req.valid('query');
        if (!(await links.read(viewer, resourceId)).canEdit)
          throw forbidden(
            'Only someone who manages the project changes its repository’s CI.',
          );
        if (
          !(await ci().removeApp(viewer.userId, resourceId, {
            environmentId,
            appId,
            pullRequests: pullRequests === 'true',
          }))
        )
          throw new ApiError({
            status: 'NOT_FOUND',
            reason: 'CI_APP_NOT_FOUND',
            domain: 'studio',
            message: `${appId} is not listed in ${environmentId}.`,
          });
        return c.body(null, 204);
      },
    );

    const router = new Hono();
    router.route('/repositoryDeployments', routes);
    return router;
  });

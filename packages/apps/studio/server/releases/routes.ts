/**
 * `/api/repositoryDeployments`: the Apps a project's repository builds (`shared/releases.ts`).
 *
 * - `GET /repositoryDeployments?appId=`: the repositories that build an App, in the projects the caller may see
 *   (an App's overview in release management);
 * - `GET /repositoryDeployments/:resourceId`: its linked Apps, for anyone who can see the project;
 * - `PUT /repositoryDeployments/:resourceId` (`{ apps, plan? }`): the complete set, for someone who manages the
 *   project; linking an App asks for configuring it, and the "Deploy & previews" choices may create Apps (`links.ts`);
 * - `GET /repositoryDeployments/apps/:appId/usage`: what deleting the App stops, for its Delete App confirmation
 *   (`app-removal.ts`); nothing recreates a deleted App here: CI's next deploy naming it does;
 * - `GET /repositoryDeployments/:resourceId/ciWorkflow`: the GitHub Actions workflow building them
 *   (`../builds/ci-workflow.ts`), for anyone who can see the project;
 * - `GET /repositoryDeployments/:resourceId/builds`: the builds CI reported for its Apps, the newest first, for anyone
 *   who can see the project (a repository's CI settings show the last few);
 * - `GET /repositoryDeployments/:resourceId/ci`: where Studio's setup of the repository's CI stands
 *   (`../builds/ci-setup.ts`), for anyone who can see the project; `POST …/ci/setup` makes its key again (or gives
 *   it a fresh secret) and `POST …/ci/rotate` gives its key a new secret, for someone who manages the project (who gives the key only what
 *   they hold); either writes the secret to the repository or, with `reveal`, answers it once instead.
 *
 * Behind authentication and the authorization context; what the caller may do is read once per request.
 */
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
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
  listResponse,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import type { AgentsConfig } from '@nocobase/app-plugin-agents/server/tokens';

import { forbidden } from '../access/errors.js';
import { studioAccessToken } from '../access/token.js';
import { ciWorkflow } from '../builds/ci-workflow.js';
import { BuildSchema } from '../builds/schemas.js';
import { studioBuildsToken, studioCiSetupToken } from '../builds/token.js';
import { studioErrorHandler } from '../http/errors.js';
import { studioAppRemovalToken } from './app-removal.js';
import type { LinkViewer } from './links.js';
import { studioRepositoryLinksToken } from './provider.js';
import {
  AppParams,
  AppUsageSchema,
  CiKeyDeliveryInput,
  CiSetupAnswerSchema,
  CiSetupSchema,
  CiWorkflowSchema,
  RepositoryBuildsMeta,
  RepositoryBuildsQuery,
  AppRepositoriesMeta,
  AppRepositoriesQuery,
  AppRepositorySchema,
  RepositoryDeploymentSchema,
  RepositoryParams,
  SaveRepositoryDeploymentInput,
} from './schemas.js';

const tags = ['Studio'];

const repositoryNotFound = apiErrorResponse(
  404,
  'The working directory does not exist or the caller may not see its project (`REPOSITORY_NOT_FOUND`).',
);

export const releasesRoutes: AppApiRouteContribution<Application> =
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
    const removal = () => container.resolve(studioAppRemovalToken);

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

    routes.get(
      '/',
      describeRoute({
        tags,
        summary: 'List the repositories that build an App',
        operationId: 'repositoryDeploymentsListAppRepositories',
        ...cliRoute({
          command: 'build repo list',
          columns: ['repo', 'projectName', 'url'],
        }),
        description:
          'For whoever is signed in: the working directories that link the App `appId`, in the projects the caller may see; for a preview App, first the repository whose pull request it previews (`pullRequest`). An App no repository builds, or one the caller may see none of, lists nothing.',
        responses: {
          200: listResponse(AppRepositorySchema, AppRepositoriesMeta),
          401: apiErrorResponse(401),
          500: apiErrorResponse(500),
        },
      }),
      apiValidator('query', AppRepositoriesQuery),
      async (c) => {
        const items = await links.appRepositories(
          c.get('studioViewer'),
          c.req.valid('query').appId,
        );
        return c.json({ data: items, meta: { total: items.length } });
      },
    );
    // Fixed before `/:resourceId`.
    routes.get(
      '/apps/:appId/usage',
      describeRoute({
        tags,
        summary: 'Read what deleting an App stops',
        operationId: 'repositoryDeploymentsGetAppUsage',
        ...cliRoute(false),
        description:
          'For whoever is signed in, for the Delete App confirmation: the repositories the App is linked to among the projects the caller can see, with its role and whether it is previewed, and how many issue previews of it exist (counted only when a repository is listed). Deleting the App unlinks it, turns those roles off and removes the previews.',
        responses: {
          200: dataResponse(AppUsageSchema),
          401: apiErrorResponse(401),
          500: apiErrorResponse(500),
        },
      }),
      apiValidator('param', AppParams),
      async (c) =>
        c.json({
          data: await removal().usage(
            c.get('studioViewer'),
            c.req.valid('param').appId,
          ),
        }),
    );
    routes.get(
      '/:resourceId',
      describeRoute({
        tags,
        summary: 'Read the Apps a repository builds',
        operationId: 'repositoryDeploymentsGetRepositoryDeployment',
        ...cliRoute({
          command: 'build repo get',
          flags: { resourceId: { name: 'repo' } },
        }),
        description: 'For whoever sees the project.',
        responses: {
          200: dataResponse(RepositoryDeploymentSchema),
          401: apiErrorResponse(401),
          404: repositoryNotFound,
          500: apiErrorResponse(500),
        },
      }),
      apiValidator('param', RepositoryParams),
      async (c) =>
        c.json({
          data: await links.read(
            c.get('studioViewer'),
            await links.resolve(
              c.get('studioViewer'),
              c.req.valid('param').resourceId,
            ),
          ),
        }),
    );
    routes.put(
      '/:resourceId',
      describeRoute({
        tags,
        summary: 'Replace the Apps a repository builds',
        operationId: 'repositoryDeploymentsReplaceRepositoryDeployment',
        ...cliRoute({
          command: 'build repo set',
          flags: { resourceId: { name: 'repo' } },
          bodyFile: 'file',
          examples: ['build repo set acme/shop --file apps.json'],
        }),
        description:
          'For whoever manages the project. `apps` is the complete set: an App left out is unlinked. Linking an App also asks for configuring it in release management. `plan`, the "Deploy & previews" choices, is applied on top of `apps`: Studio creates the Apps a staging or production environment needs, named after the repository (`<repo>`, `<repo>-staging`), as the caller, who must be allowed to create Apps or deploy to every App, and unlinks the role an environment left out. The preview choice changes nothing: previews are the repository’s CI’s, one App per pull request it deploys. CI also records the Apps it builds without this.',
        responses: {
          200: dataResponse(RepositoryDeploymentSchema),
          400: apiErrorResponse(
            400,
            'A link is refused: an App linked twice, an unknown App (`UNKNOWN_APP`), an unknown environment (`UNKNOWN_ENVIRONMENT`), a preview environment that does not run archives or is protected (`PREVIEW_ENVIRONMENT_UNSUITABLE`) (`INVALID_LINKS`, `INVALID_PLAN` and similar).',
          ),
          ...apiErrorResponses,
          404: repositoryNotFound,
        },
      }),
      apiValidator('param', RepositoryParams),
      apiValidator('json', SaveRepositoryDeploymentInput),
      async (c) =>
        c.json({
          data: await links.save(
            c.get('studioViewer'),
            await links.resolve(
              c.get('studioViewer'),
              c.req.valid('param').resourceId,
            ),
            c.req.valid('json'),
          ),
        }),
    );
    routes.get(
      '/:resourceId/ciWorkflow',
      describeRoute({
        tags,
        summary: 'Generate the CI workflow building a repository’s Apps',
        operationId: 'repositoryDeploymentsGetCiWorkflow',
        ...cliRoute({
          command: 'build workflow',
          flags: { resourceId: { name: 'repo' } },
          examples: ['build workflow acme/shop --json'],
        }),
        description:
          'For whoever sees the project: the GitHub Actions workflow CI starts from, building each pull request that touches the repository’s application into its own App in the `preview` environment and uploading each build to Studio. Other targets (a branch, a tag, another environment) come from "Configure CI" (`POST …/ci/configure`, `POST /api/repositoryDeployments/ciWorkflows/generate`).',
        responses: {
          200: dataResponse(CiWorkflowSchema),
          401: apiErrorResponse(401),
          404: repositoryNotFound,
          500: apiErrorResponse(500),
        },
      }),
      apiValidator('param', RepositoryParams),
      async (c) => {
        const deployment = await links.read(
          c.get('studioViewer'),
          await links.resolve(
            c.get('studioViewer'),
            c.req.valid('param').resourceId,
          ),
        );
        const configured = app.config.get<string>('app.publicOrigin');
        const origin = URL.canParse(configured ?? '')
          ? new URL(configured!).origin
          : new URL(c.req.url).origin;
        return c.json({
          data: ciWorkflow({
            studioUrl: `${origin}${app.publicBasePath.replace(/\/+$/u, '')}`,
            defaultBranch: deployment.defaultBranch,
            repositoryName:
              deployment.repo?.split('/').pop() ?? deployment.resourceId,
            cli:
              app.config.get<AgentsConfig>('agents')?.cli?.name ?? 'nb-studio',
          }),
        });
      },
    );

    routes.get(
      '/:resourceId/builds',
      describeRoute({
        tags,
        summary: 'List the builds CI reported for a repository',
        operationId: 'repositoryDeploymentsListBuilds',
        ...cliRoute({
          command: 'build list',
          flags: { resourceId: { name: 'repo' } },
          columns: [
            'reportedAt',
            'appId',
            'purpose',
            'sha',
            'state',
            'logsUrl',
          ],
          examples: ['build list acme/shop --page-size 5'],
        }),
        description:
          'For whoever sees the project: the builds of the repository’s Apps as CI reported them (`nb-studio build status`), the most recently reported first, `pageSize` (5 by default) a page. An empty list means CI has reported nothing yet.',
        responses: {
          200: listResponse(BuildSchema, RepositoryBuildsMeta),
          401: apiErrorResponse(401),
          404: repositoryNotFound,
          500: apiErrorResponse(500),
        },
      }),
      apiValidator('param', RepositoryParams),
      apiValidator('query', RepositoryBuildsQuery),
      async (c) => {
        const resourceId = await links.resolve(
          c.get('studioViewer'),
          c.req.valid('param').resourceId,
        );
        const { page = 1, pageSize = 5 } = c.req.valid('query');
        // 404 for a repository the caller does not see.
        await links.read(c.get('studioViewer'), resourceId);
        if (!container.has(studioBuildsToken))
          return c.json({ data: [], meta: { page, pageSize, total: 0 } });
        const found = await container
          .resolve(studioBuildsToken)
          .recent(resourceId, { page, pageSize });
        return c.json({
          data: found.items,
          meta: { page, pageSize, total: found.total },
        });
      },
    );

    const ciUnavailable = () =>
      new ApiError({
        status: 'NOT_FOUND',
        reason: 'CI_SETUP_UNAVAILABLE',
        domain: 'studio',
        message: 'Studio cannot set CI up in this workspace.',
      });
    const ci = () => {
      if (!container.has(studioCiSetupToken)) throw ciUnavailable();
      return container.resolve(studioCiSetupToken);
    };
    /** The repository the caller sees, and whether they manage its project; 404 otherwise. */
    const repository = async (viewer: LinkViewer, resourceId: string) =>
      (await links.read(viewer, resourceId)).canEdit;
    const manageOnly = async (viewer: LinkViewer, resourceId: string) => {
      if (!(await repository(viewer, resourceId)))
        throw forbidden(
          'Only someone who manages the project sets its repository’s CI up.',
        );
    };

    routes.get(
      '/:resourceId/ci',
      describeRoute({
        tags,
        summary: 'Read how a repository’s CI is set up',
        operationId: 'repositoryDeploymentsGetCiSetup',
        ...cliRoute({
          command: 'build ci get',
          flags: { resourceId: { name: 'repo' } },
          columns: ['state', 'repo', 'secretName', 'lastError'],
        }),
        description:
          'For whoever sees the project: whether Studio set the repository’s CI up, with its API key, the pull request adding the workflow and the last failure. A pull request merged since is noticed here.',
        responses: {
          200: dataResponse(CiSetupSchema),
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
        const canManage = await repository(c.get('studioViewer'), resourceId);
        return c.json({ data: await ci().view(resourceId, canManage) });
      },
    );
    const revealRefused = apiErrorResponse(
      400,
      'Only with `reveal`: Studio holds no usable key to rotate (`KEY_MISSING`), or API keys are not available (`API_KEYS_UNAVAILABLE`).',
    );
    const revealNote =
      ' With `reveal: true` (`--reveal`) the secret is answered once in `secret` instead, for a CI Studio cannot write to (another host, or CI that runs elsewhere): store it as `NB_STUDIO_API_KEY` yourself, such as `… --reveal --json | jq -er .result.data.secret | gh secret set NB_STUDIO_API_KEY -R owner/repo`. It needs no Git connection, is never shown again, and leaves the setup `manual`, which Studio does not rotate by itself; a failure is then an error.';
    routes.post(
      '/:resourceId/ci/setup',
      describeRoute({
        tags,
        summary: 'Set a repository’s CI key up again',
        operationId: 'repositoryDeploymentsSetUpCi',
        ...cliRoute({
          command: 'build ci setup',
          flags: { resourceId: { name: 'repo' } },
          columns: ['state', 'repo', 'pullRequest', 'lastError'],
          examples: [
            'build ci setup acme/shop',
            'build ci setup acme/shop --reveal --json | jq -er .result.data.secret | gh secret set NB_STUDIO_API_KEY -R acme/shop-ci',
          ],
        }),
        description: `For whoever manages the project. Makes the repository’s API key (the \`CI deploy\` preset limited to its Apps, as the caller, who gives only what they hold; it may create the repository’s Apps, such as its pull requests’) again, or gives the existing one a new secret, and writes it as the repository secret; the workflows are left as the repository has them (\`POST …/ci/configure\` writes them). A failure is answered in the setup (\`state: manual\`, \`lastError\`), not as an error.${revealNote}`,
        responses: {
          200: dataResponse(CiSetupAnswerSchema),
          400: revealRefused,
          ...apiErrorResponses,
          404: repositoryNotFound,
        },
      }),
      apiValidator('param', RepositoryParams),
      apiValidator('json', CiKeyDeliveryInput),
      async (c) => {
        const viewer = c.get('studioViewer');
        const resourceId = await links.resolve(
          c.get('studioViewer'),
          c.req.valid('param').resourceId,
        );
        await manageOnly(viewer, resourceId);
        const secret = await ci().setup(viewer.userId, resourceId, {
          reveal: c.req.valid('json').reveal === true,
        });
        return c.json({
          data: {
            ...(await ci().view(resourceId, true)),
            ...(secret ? { secret } : {}),
          },
        });
      },
    );
    routes.post(
      '/:resourceId/ci/rotate',
      describeRoute({
        tags,
        summary: 'Rotate a repository’s CI key',
        operationId: 'repositoryDeploymentsRotateCiKey',
        ...cliRoute({
          command: 'build ci rotate',
          flags: { resourceId: { name: 'repo' } },
          columns: ['state', 'repo', 'lastRotatedAt', 'lastError'],
        }),
        description: `For whoever manages the project: gives the API key Studio keeps for the repository’s CI a new secret and writes it as the repository secret at once. A failure is answered in the setup (\`lastError\`).${revealNote}`,
        responses: {
          200: dataResponse(CiSetupAnswerSchema),
          400: revealRefused,
          ...apiErrorResponses,
          404: repositoryNotFound,
        },
      }),
      apiValidator('param', RepositoryParams),
      apiValidator('json', CiKeyDeliveryInput),
      async (c) => {
        const viewer = c.get('studioViewer');
        const resourceId = await links.resolve(
          c.get('studioViewer'),
          c.req.valid('param').resourceId,
        );
        await manageOnly(viewer, resourceId);
        const secret = await ci().rotate(viewer.userId, resourceId, {
          reveal: c.req.valid('json').reveal === true,
        });
        return c.json({
          data: {
            ...(await ci().view(resourceId, true)),
            ...(secret ? { secret } : {}),
          },
        });
      },
    );

    const router = new Hono();
    router.route('/repositoryDeployments', routes);
    return router;
  });

/**
 * `/api/builds`: CI's builds (`service.ts`), with CI's scoped API key (a person's session or key works too):
 *
 * - `POST /builds/report` (`nb-studio build status`): where CI stands with a build of an App at a commit; answers the build;
 * - `POST /builds/apps/:appId/ensure` (`nb-studio app ensure`): makes the App in the environment when it is missing;
 * - `POST /builds/deploy` (`nb-studio deploy`): with `--sha` and `--file`, a one-time upload ticket for the archive, after
 *   Studio verified the commit with the git platform; the CLI streams the file to it (`x-cli` `ticketUpload`, optional)
 *   and the release it becomes is deployed. With `--release`, that release is deployed (a rollback, or another App's
 *   promoted);
 * - `POST /builds/uploadTickets` (`nb-studio release upload`): the same ticket, for an upload alone;
 * - `POST /builds/:buildId/uploadArtifact`: where the archive goes, with that ticket (`Authorization: Bearer fgb_…`) and
 *   nothing of a session; answers `{ data: ReceivedUpload, meta: { message } }`, the message naming the release and
 *   what deploying it did.
 *
 * `--repository` (`owner/repo`) and `--sha` default to what CI's environment says (`CI_REPOSITORY`, `CI_SHA`), so a
 * workflow names neither.
 *
 * The caller is release management's (`Releases.callerOf`): a person with their release permissions, kept to their
 * key's scope; a scoped key acts as a `key`. A run's token is not accepted: these are CI's.
 */
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import type { Caller, Releases } from '@nocobase/app-plugin-releases/server';
import { releasesToken } from '@nocobase/app-plugin-releases/server/tokens';
import type { AppAction } from '@nocobase/app-plugin-releases/shared/access';
import type { Application } from '@nocobase/app-server/application';
import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  cliRoute,
  defineApiRoutes,
  type CliFlagOptions,
  describeRoute,
  resolver,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono, type Context, type MiddlewareHandler } from 'hono';
import { z } from 'zod';

import { studioErrorHandler } from '../http/errors.js';
import {
  BuildParams,
  BuildSchema,
  CreateUploadTicketInput,
  DeployInput,
  DeployOutcomeSchema,
  EnsureAppInput,
  EnsuredAppSchema,
  EnsureParams,
  ReceivedUploadSchema,
  ReportBuildInput,
  UploadMetaSchema,
  UploadTicketSchema,
} from './schemas.js';
import {
  buildMessage,
  deployMessage,
  ensureMessage,
  uploadMessage,
  type Builds,
} from './service.js';
import { studioBuildsToken } from './token.js';

const tags = ['Studio'];

/** Largest release archive the CLI sends (release management's own default). */
export const RELEASE_MAX_BYTES: number = 256 * 1024 * 1024;

/** The request body as chunks, read as they arrive. */
async function* chunksOf(
  body: ReadableStream<Uint8Array> | null,
): AsyncIterable<Uint8Array> {
  if (!body) return;
  const reader = body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

/** `{ data, meta: { message } }`: the line the CLI prints. */
function withMessage(data: z.ZodType) {
  return {
    description: 'Success.',
    content: {
      'application/json': {
        schema: resolver(z.object({ data, meta: UploadMetaSchema })),
      },
    },
  };
}

/**
 * What CI already knows, read by the CLI when the flag is left out (`x-cli` `env`), so a workflow names neither: the
 * repository as `owner/repo` (GitHub Actions, then GitLab CI), and the commit being built — a pull request's head
 * rather than GitHub's merge commit (from the event's payload), and a GitLab merged-results pipeline's source commit.
 */
const CI_REPOSITORY = {
  env: ['GITHUB_REPOSITORY', 'CI_PROJECT_PATH'],
} as const satisfies CliFlagOptions;
const CI_SHA = {
  env: [
    { file: 'GITHUB_EVENT_PATH', path: 'pull_request.head.sha' },
    'GITHUB_SHA',
    'CI_MERGE_REQUEST_SOURCE_BRANCH_SHA',
    'CI_COMMIT_SHA',
  ],
} as const satisfies CliFlagOptions;

const buildRefused = apiErrorResponse(
  400,
  'The commit does not belong to the repository (`COMMIT_NOT_VERIFIED`), or the repository cannot be told (`REPOSITORY_REQUIRED`, `REPOSITORY_AMBIGUOUS` when several projects work in it).',
);
const repositoryMismatch = apiErrorResponse(
  403,
  'The caller may not act on the App, or is the CI key of another repository than the one named (`REPOSITORY_MISMATCH`).',
);
const appNotFound = apiErrorResponse(
  404,
  'The App does not exist or the caller may not see it (`APP_NOT_FOUND`), or no project works in the named repository (`REPOSITORY_NOT_FOUND`).',
);

export interface BuildRoutesOptions {
  /** The application's authentication (scoped keys welcome) and authorization; answers 401 itself. */
  readonly authenticate: MiddlewareHandler;
  readonly releases: () => Pick<Releases, 'callerOf' | 'guard'>;
  /** Studio's public base path (`/main`, or empty), for the upload ticket's URL. */
  readonly basePath: string;
}

interface BuildsEnv {
  Variables: { buildsCaller: Caller };
}

/** The build routes over the builds service, mounted at `/builds`. */
export function createBuildRoutes(
  builds: Builds,
  options: BuildRoutesOptions,
): Hono<BuildsEnv> {
  const routes = new Hono<BuildsEnv>();
  routes.onError(studioErrorHandler);

  /** Signed in, as release management's caller, holding `action` on some App; the App itself is checked later. */
  const callerWith =
    (action: AppAction): MiddlewareHandler<BuildsEnv> =>
    async (context, next) =>
      await options.authenticate(context, async () => {
        const services = options.releases();
        const caller = await services.callerOf(
          (context as unknown as Context<AuthorizationEnv>).get('authz')
            .identity,
        );
        services.guard.requireAnyApp(caller, action);
        context.set('buildsCaller', caller);
        await next();
      });

  routes.post(
    '/report',
    callerWith('upload'),
    describeRoute({
      tags,
      summary: 'Report where CI stands with a build',
      operationId: 'buildsReportBuild',
      description:
        'Optional, for showing a build’s progress: CI names the App, the commit and the repository (`owner/repo`; else the App’s, else its key’s), the CLI reading the last two from CI’s environment. A repository’s CI key naming another repository is refused (`REPOSITORY_MISMATCH`). It requires the `upload` action on the App, or the repository’s CI key for an App of the repository; an App not made yet (CI reports before `nb-studio app ensure`) takes the repository’s CI key or a credential that may create Apps. Studio verifies first that the commit belongs to the repository (an open pull request’s head, on the default branch, tagged, or another branch’s head) and shows the build on the App and, for a pull request’s head, on the issues it is linked to. CI’s scoped API key acts as a key.',
      ...cliRoute({
        command: 'build status',
        args: [],
        flags: {
          appId: { name: 'app' },
          repository: CI_REPOSITORY,
          sha: CI_SHA,
          logsUrl: { name: 'logs' },
        },
        examples: [
          'build status --app my-app-pr-12 --state building --logs <ci-run-url>',
          'build status --repository acme/my-app --app my-app-staging --sha <sha> --state failed',
        ],
        action: 'rel.apps/upload',
      }),
      responses: {
        200: withMessage(BuildSchema),
        ...apiErrorResponses,
        403: repositoryMismatch,
        400: buildRefused,
        404: appNotFound,
      },
    }),
    apiValidator('json', ReportBuildInput),
    async (c) => {
      const build = await builds.report(
        c.get('buildsCaller'),
        c.req.valid('json'),
      );
      return c.json({ data: build, meta: { message: buildMessage(build) } });
    },
  );

  routes.post(
    '/apps/:appId/ensure',
    callerWith('upload'),
    describeRoute({
      tags,
      summary: 'Make sure of an App in an environment',
      operationId: 'buildsEnsureApp',
      description:
        'Idempotent: makes the App in the environment when it is missing, and does nothing when it runs there; one running in another environment is refused (`APP_IN_OTHER_ENVIRONMENT`). Making it takes a credential that may create Apps, or the repository’s CI key, for which Studio makes it as whoever set the CI up; an existing App takes the `upload` action on it, or the repository’s CI key for an App of the repository. An App made here whose first deployment is an open pull request’s head becomes that pull request’s preview, deleted once it is merged or closed.',
      ...cliRoute({
        command: 'app ensure',
        args: ['appId'],
        flags: {
          appId: { name: 'app' },
          environmentId: { name: 'environment' },
          repository: CI_REPOSITORY,
        },
        examples: [
          'app ensure my-app-pr-12 --environment preview',
          'app ensure my-app-staging --environment staging --repository acme/my-app',
        ],
        action: 'rel.apps/upload',
      }),
      responses: {
        200: withMessage(EnsuredAppSchema),
        ...apiErrorResponses,
        403: repositoryMismatch,
        400: apiErrorResponse(
          400,
          'The App runs in another environment (`APP_IN_OTHER_ENVIRONMENT`), or the repository cannot be told (`REPOSITORY_REQUIRED`, `REPOSITORY_AMBIGUOUS`).',
        ),
        404: apiErrorResponse(
          404,
          'The environment or the named repository does not exist, or the App exists and the caller may not see it.',
        ),
      },
    }),
    apiValidator('param', EnsureParams),
    apiValidator('json', EnsureAppInput),
    async (c) => {
      const ensured = await builds.ensure(
        c.get('buildsCaller'),
        c.req.valid('param').appId,
        c.req.valid('json'),
      );
      return c.json({
        data: ensured,
        meta: { message: ensureMessage(ensured) },
      });
    },
  );

  routes.post(
    '/uploadTickets',
    callerWith('upload'),
    describeRoute({
      tags,
      summary: 'Create an upload ticket for a build’s archive',
      operationId: 'buildsCreateUploadTicket',
      description:
        'Uploads alone: admits the build as `POST /api/builds/report` does (the same credential and commit checks, the App made already) and answers a one-time ticket: send the archive (`dist.tar.gz`) as the body of `method` `url` with exactly `headers`, and nothing of the session. The upload answers the release, which `nb-studio deploy --release` deploys later; nothing is deployed. To upload and deploy in one, use `nb-studio deploy --file`.',
      ...cliRoute({
        command: 'release upload',
        args: [],
        flags: {
          appId: { name: 'app' },
          repository: CI_REPOSITORY,
          sha: CI_SHA,
        },
        ticketUpload: {
          flag: 'file',
          maxBytes: RELEASE_MAX_BYTES,
          accept: ['.tar.gz', '.tgz'],
          description: 'The archive CI built (`dist.tar.gz`).',
        },
        examples: [
          'release upload --app my-app-staging --file storage/exports/dist.tar.gz',
        ],
        action: 'rel.apps/upload',
      }),
      responses: {
        201: {
          description: 'The ticket.',
          content: {
            'application/json': {
              schema: resolver(z.object({ data: UploadTicketSchema })),
            },
          },
        },
        ...apiErrorResponses,
        403: repositoryMismatch,
        400: buildRefused,
        404: appNotFound,
      },
    }),
    apiValidator('json', CreateUploadTicketInput),
    async (c) => {
      const { ticket } = await builds.ticket(
        c.get('buildsCaller'),
        c.req.valid('json'),
        options.basePath,
      );
      return c.json({ data: ticket }, 201);
    },
  );

  routes.post(
    '/deploy',
    callerWith('deploy'),
    describeRoute({
      tags,
      summary: 'Deploy an archive or a release to an App',
      operationId: 'buildsDeploy',
      description:
        'With `sha` and `file` (`nb-studio deploy --app <app> --file dist.tar.gz`, the CLI reading the commit and the repository from CI’s environment): admits the build as `POST /api/builds/report` does (the App made already, `upload` and `deploy` on it or the repository’s CI key) and answers a one-time ticket the CLI streams the archive to; the release it becomes, or the release another App of the repository holds of the same bytes, is deployed, and the upload answers both. With `releaseId` (`nb-studio deploy --app --release <id>`, where a commit without `file` is ignored): deploys that release, the App’s own (a rollback) or one the repository uploaded to another App (promoted into it). An unprotected environment deploys at once. A protected one takes no direct deployment, from a person or from CI: it gets a deployment request for exactly that release, and the answer is still a success, with `deployment` null and `request` the pending request (`status: pending`) and its page (`url`), where an approver approves it. An App `nb-studio app ensure` made whose first deployment is an open pull request’s head becomes that pull request’s preview (`preview` in the answer).',
      ...cliRoute({
        command: 'deploy',
        args: [],
        flags: {
          appId: { name: 'app' },
          releaseId: { name: 'release' },
          repository: CI_REPOSITORY,
          sha: CI_SHA,
        },
        ticketUpload: {
          flag: 'file',
          optional: true,
          maxBytes: RELEASE_MAX_BYTES,
          accept: ['.tar.gz', '.tgz'],
          description:
            'The archive CI built (`dist.tar.gz`), uploaded and deployed; of the commit --sha names.',
        },
        examples: [
          'deploy --app my-app-pr-12 --file storage/exports/dist.tar.gz',
          'deploy --app my-app-staging --repository acme/my-app --sha <sha> --file dist.tar.gz',
          'deploy --app my-app --release <release>',
        ],
        action: 'rel.apps/deploy',
      }),
      responses: {
        200: {
          description:
            'With `file`, the upload ticket; otherwise what deploying the release did.',
          content: {
            'application/json': {
              schema: resolver(
                z.object({
                  data: z.union([UploadTicketSchema, DeployOutcomeSchema]),
                  meta: UploadMetaSchema.optional(),
                }),
              ),
            },
          },
        },
        ...apiErrorResponses,
        403: repositoryMismatch,
        400: apiErrorResponse(
          400,
          'Neither an archive of a commit nor a release (`INVALID_DEPLOY`), the commit does not belong to the repository (`COMMIT_NOT_VERIFIED`), a pending deployment request already waiting (`REQUEST_PENDING`), a deployment in progress, or a required variable not set (`VARIABLES_MISSING`: `metadata.variables` names them, and `metadata.environmentUrl` and `metadata.url` are the environment’s and the App’s Variables pages where they are set; the release stays and deploys once they are).',
        ),
        404: apiErrorResponse(
          404,
          'The App or the release does not exist, or the caller may not see it.',
        ),
      },
    }),
    apiValidator('json', DeployInput),
    async (c) => {
      const answer = await builds.deploy(
        c.get('buildsCaller'),
        c.req.valid('json'),
        options.basePath,
      );
      if ('ticket' in answer) return c.json({ data: answer.ticket });
      return c.json({
        data: answer.outcome,
        meta: { message: deployMessage(answer.outcome) },
      });
    },
  );

  // The ticket is checked first; the archive is the releases plugin's to check as it streams (`uploadRelease`).
  routes.post(
    '/:buildId/uploadArtifact',
    describeRoute({
      tags,
      summary: 'Upload a build’s archive',
      operationId: 'buildsUploadArtifact',
      description:
        'Where the CLI streams a build’s archive (`nb-studio deploy --file`, `nb-studio release upload`). No session or API key is read: the credential is the one-time upload ticket `POST /api/builds/deploy` or `POST /api/builds/uploadTickets` answered for this build, sent as `Authorization: Bearer fgb_…`. The archive becomes a release of the build’s App, deployed when the ticket came from `deploy` (`deployed`); an archive uploaded before answers the same release, and a superseded build of a pull request is dropped (`release: null`).',
      security: [],
      // The ticket's upload target, which the CLI reaches through `deploy --file` and `release upload`.
      ...cliRoute(false),
      requestBody: {
        description: 'The build archive (`dist.tar.gz`), streamed.',
        required: true,
        content: {
          'application/octet-stream': {
            schema: { type: 'string', format: 'binary' },
          },
        },
      },
      responses: {
        200: withMessage(ReceivedUploadSchema),
        400: apiErrorResponse(
          400,
          'The archive is refused, or deploying it was (`VARIABLES_MISSING`, `REQUEST_PENDING`, a deployment in progress); the release stays.',
        ),
        401: apiErrorResponse(
          401,
          'The upload ticket is missing, invalid or expired (`UPLOAD_TICKET_INVALID`).',
        ),
        404: apiErrorResponse(
          404,
          'The build does not exist (`BUILD_NOT_FOUND`).',
        ),
        413: apiErrorResponse(
          413,
          'The archive exceeds release management’s size limit.',
        ),
        500: apiErrorResponse(500),
      },
    }),
    apiValidator('param', BuildParams),
    async (c) => {
      const header = c.req.header('authorization') ?? '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;
      const received = await builds.receive(
        c.req.valid('param').buildId,
        token,
        chunksOf(c.req.raw.body),
      );
      return c.json({
        data: received,
        meta: { message: uploadMessage(received) },
      });
    },
  );
  return routes;
}

export const buildsRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes((app) => {
    const { container } = app;
    if (
      !container.has(studioBuildsToken) ||
      !container.has(releasesToken) ||
      !container.has(authenticationToken) ||
      !container.has(authorizationToken)
    )
      return new Hono();
    const required = container
      .resolve(authenticationToken)
      .required({ scopedKeys: true }) as unknown as MiddlewareHandler;
    const authorize = container
      .resolve(authorizationToken)
      .middleware() as unknown as MiddlewareHandler;
    const router = new Hono();
    router.route(
      '/builds',
      createBuildRoutes(container.resolve(studioBuildsToken), {
        authenticate: async (context, next) => {
          let answer: Response | void = undefined;
          const result = await required(context, async () => {
            answer = await authorize(context, next);
          });
          return result ?? answer;
        },
        releases: () => container.resolve(releasesToken),
        basePath: app.publicBasePath,
      }),
    );
    return router;
  });

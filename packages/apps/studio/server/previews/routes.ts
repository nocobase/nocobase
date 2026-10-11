/**
 * Pull request previews (`/previews`, `shared/previews.ts`) and deployment marks (`/deploys`, `../deploys`), signed in.
 *
 * - `/previews` (`previewRouter`): the live previews (`GET /previews?projectId=`), and those of one issue's pull
 *   requests by the issue's permissions (`api.ts`), the issue in the query or the body so a run on an issue names
 *   none: `GET /previews/status`, `GET
 *   /previews/logs`, `POST /previews/down`, `POST /previews/retry`, `POST /previews/variables`. A person's session or
 *   key, and, but for `retry` and `variables`, scoped keys and agents' runs; never a first administrator's password but
 *   to a person asking for it;
 * - `GET /deploys/marks?issueIds=a,b`: the deployment marks of the issues the caller may see;
 * - `GET /deploys/projects/:projectId/unreleasedIssues`: the project's finished issues not in production yet;
 * - `GET /deploys/projects/:projectId/environments`: what runs on the project's staging and production Apps;
 * - `POST /deploys/reopenSuggestions/:appId/decide` (`{ action: 'reopen' | 'dismiss' }`): answers the card suggesting
 *   to reopen what a deployment of the App no longer runs (only its recipient).
 */
import type { CallerIdentity } from '@nocobase/app-plugin-agents/server/tokens';
import {
  authenticationToken,
  type Auth,
} from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import {
  projectsAccessToken,
  type Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import type { Releases } from '@nocobase/app-plugin-releases/server';
import { allPermissions } from '@nocobase/app-plugin-releases/shared/access';
import { releasesToken } from '@nocobase/app-plugin-releases/server/tokens';
import type { Application } from '@nocobase/app-server/application';
import {
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
import { Hono, type Context, type MiddlewareHandler } from 'hono';

import type { IssuePreviews } from '../../shared/previews.js';
import { ISSUE_SUBJECT } from '../agents/catalog/triggers.js';
import {
  createPermissionSource,
  type PermissionSource,
} from '../agents/commands/permissions.js';
import { callerOfRequest, runSubjectOf } from '../agents/run-principal.js';
import { studioDeploysToken } from '../deploys/token.js';
import { studioError, studioErrorHandler } from '../http/errors.js';
import { boundedList } from '../http/input.js';
import {
  AppParams,
  DecideReopenInput,
  DeployMarksSchema,
  IssueIdsQuery,
  IssuePreviewsSchema,
  PreviewDownInput,
  PreviewListItemSchema,
  PreviewListQuery,
  PreviewLogEntrySchema,
  PreviewLogMeta,
  PreviewLogsQuery,
  PreviewRetryInput,
  PreviewStatusQuery,
  PreviewVariablesInput,
  ProjectEnvironmentsSchema,
  ProjectParams,
  ReopenDecisionSchema,
  UnreleasedIssuesSchema,
} from './schemas.js';
import { previewsNamed, type PreviewApi } from './api.js';
import { studioPreviewApiToken } from './token.js';

const tags = ['Studio'];

const signedIn = {
  401: apiErrorResponse(401),
  500: apiErrorResponse(500),
} as const;
const issueNotFound = apiErrorResponse(
  404,
  'The issue does not exist or the caller may not see it (`ISSUE_NOT_FOUND`).',
);
const projectNotFound = apiErrorResponse(
  404,
  'The project does not exist or the caller may not see it (`PROJECT_NOT_FOUND`).',
);

export const previewsRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes(({ container }) => {
    if (
      !container.has(studioPreviewApiToken) ||
      !container.has(authenticationToken) ||
      !container.has(authorizationToken) ||
      !container.has(projectsAccessToken)
    )
      return new Hono();
    const authentication = container.resolve(authenticationToken);
    const authorization = container.resolve(authorizationToken);
    const access = container.resolve(projectsAccessToken);
    const previews = container.resolve(studioPreviewApiToken);
    const deploys = container.has(studioDeploysToken)
      ? container.resolve(studioDeploysToken)
      : null;

    /** A sub-router with the caller's viewer, mounted under its own prefix so its middleware stays there. */
    const scoped = () => {
      const routes = new Hono<{ Variables: { studioViewer: Viewer } }>();
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
          actor: { type: 'user', id: auth.user.id },
          permissions: await access.permissionsOf(authz.identity),
        });
        await next();
      });
      return routes;
    };

    const router = new Hono();
    router.route(
      '/previews',
      previewRouter({
        authentication,
        authorization,
        permissions: createPermissionSource(() => access),
        previews,
        releases: () =>
          container.has(releasesToken)
            ? container.resolve(releasesToken)
            : undefined,
      }),
    );
    if (deploys) {
      const marks = scoped();
      marks.get(
        '/marks',
        describeRoute({
          tags,
          summary: 'Read the deployment marks of issues',
          operationId: 'deploysListMarks',
          // UI-only: the badges the board shows on the issues on screen.
          ...cliRoute(false),
          description:
            '`issueIds` is a comma-separated list of at most 200 issue IDs; issues the caller may not see are left out.',
          responses: { 200: dataResponse(DeployMarksSchema), ...signedIn },
        }),
        apiValidator('query', IssueIdsQuery),
        async (c) =>
          c.json({
            data: await deploys.marksFor(
              c.get('studioViewer'),
              c.req.valid('query').issueIds,
            ),
          }),
      );
      // The suggestion card to reopen what a deployment no longer runs: its recipient answers it.
      marks.post(
        '/reopenSuggestions/:appId/decide',
        describeRoute({
          tags,
          summary: 'Answer a suggestion to reopen issues',
          operationId: 'deploysDecideReopenSuggestion',
          ...cliRoute({
            command: 'deploy reopen-suggestion decide',
            flags: { appId: { name: 'app' } },
            examples: [
              'deploy reopen-suggestion decide my-app --action reopen',
            ],
          }),
          description:
            'Only for the person the suggestion was sent to, after a deployment of the App no longer runs what finished issues shipped. `reopen` moves each listed issue still done back, as the caller; `dismiss` leaves them done. Either settles the suggestion.',
          responses: {
            200: dataResponse(ReopenDecisionSchema),
            ...signedIn,
            404: apiErrorResponse(
              404,
              'No suggestion for the App waits for the caller (`REOPEN_SUGGESTION_NOT_FOUND`).',
            ),
          },
        }),
        apiValidator('param', AppParams),
        apiValidator('json', DecideReopenInput),
        async (c) =>
          c.json({
            data: await deploys.decideReopen(
              c.get('studioViewer'),
              c.req.valid('param').appId,
              c.req.valid('json').action,
            ),
          }),
      );
      marks.get(
        '/projects/:projectId/environments',
        describeRoute({
          tags,
          summary: 'Read what runs on a project’s environments',
          operationId: 'deploysGetProjectEnvironments',
          ...cliRoute({
            command: 'deploy status',
            flags: { projectId: { name: 'project' } },
            examples: ['deploy status <project>'],
          }),
          description:
            'For whoever sees the project: what runs on each staging and production App of its repositories, and who approved it.',
          responses: {
            200: dataResponse(ProjectEnvironmentsSchema),
            ...signedIn,
            404: projectNotFound,
          },
        }),
        apiValidator('param', ProjectParams),
        async (c) =>
          c.json({
            data: await deploys.environments(
              c.get('studioViewer'),
              c.req.valid('param').projectId,
            ),
          }),
      );
      marks.get(
        '/projects/:projectId/unreleasedIssues',
        describeRoute({
          tags,
          summary: 'List a project’s unreleased issues',
          operationId: 'deploysListUnreleasedIssues',
          ...cliRoute({
            command: 'release pending',
            flags: { projectId: { name: 'project' } },
          }),
          description:
            'For whoever sees the project: its finished issues not in production yet.',
          responses: {
            200: dataResponse(UnreleasedIssuesSchema),
            ...signedIn,
            404: projectNotFound,
          },
        }),
        apiValidator('param', ProjectParams),
        async (c) =>
          c.json({
            data: await deploys.unreleased(
              c.get('studioViewer'),
              c.req.valid('param').projectId,
            ),
          }),
      );
      router.route('/deploys', marks);
    }
    return router;
  });

/** A session, an API key, or an agent's run token. */
const personOrRunSecurity: Record<string, string[]>[] = [
  { cookieAuth: [] },
  { apiKeyAuth: [] },
  { runToken: [] },
];

const ISSUE_DEFAULT =
  'An agent’s run on an issue may leave `issueId` out for its own issue.';

const issueFlag = {
  name: 'issue',
  description:
    'The issue, by identifier (PM-12) or id; in a run on an issue, that issue by default.',
};

const appFlag = {
  name: 'app',
  description:
    'The preview’s own App, or the App it previews, when the issue has several previews.',
};

function callerOf(context: Context): CallerIdentity {
  const caller = callerOfRequest(context);
  if (!caller) throw new Error('The request is not authenticated.');
  return caller;
}

/** The issue a request names, else the one its run works on. */
function issueOf(context: Context, named: string | undefined): string {
  const issue = named ?? runSubjectOf(callerOfRequest(context), ISSUE_SUBJECT);
  if (!issue)
    throw studioError(
      'INVALID_ARGUMENT',
      'ISSUE_REQUIRED',
      'Name the issue (`issueId`, `--issue` on the command line); this is not a run on an issue.',
    );
  return issue;
}

/** An issue's previews without the first administrator's password. */
function withoutPassword(previews: IssuePreviews): IssuePreviews {
  return {
    ...previews,
    previews: previews.previews.map((preview) => ({
      ...preview,
      admin: preview.admin ? { ...preview.admin, password: '' } : null,
    })),
  };
}

/**
 * `/previews`: what the issue page and the `preview` commands share. The run-capable routes act as the caller's
 * `Viewer` (`permissions`): a person narrowed by their key's scope, a run by its agent's actions.
 */
function previewRouter(deps: {
  readonly authentication: Pick<Auth, 'required'>;
  readonly authorization: { middleware(): MiddlewareHandler };
  readonly permissions: Pick<PermissionSource, 'viewerOf'>;
  readonly previews: PreviewApi;
  readonly releases: () => Releases | undefined;
}): Hono {
  const { previews } = deps;
  const routes = new Hono();
  routes.onError(studioErrorHandler);
  const person = [
    deps.authentication.required(),
    deps.authorization.middleware(),
  ] as const;
  const personOrRun = [
    deps.authentication.required({ scopedKeys: true }),
    deps.authorization.middleware(),
  ] as const;
  const viewer = (context: Context) =>
    deps.permissions.viewerOf(callerOf(context));

  // Live previews only: bounded by the Apps that run them.
  routes.get(
    '/',
    ...personOrRun,
    describeRoute({
      tags,
      summary: 'List live previews',
      operationId: 'previewsListPreviews',
      description:
        'The live previews of the pull requests linked to issues the caller may see, each with the first such issue, of one project when `projectId` is given. A bounded list; never a first administrator.',
      security: personOrRunSecurity,
      responses: {
        200: listResponse(PreviewListItemSchema),
        ...apiErrorResponses,
      },
      ...cliRoute({
        command: 'preview list',
        flags: { projectId: { name: 'project' } },
        columns: [
          'identifier',
          'appId',
          'status',
          'runtime.state',
          'url',
          'deployedSha',
        ],
        action: 'pm.issues/view',
      }),
    }),
    apiValidator('query', PreviewListQuery),
    async (c) => {
      const { projectId } = c.req.valid('query');
      return c.json(
        boundedList(
          await previews.list(await viewer(c), projectId ? { projectId } : {}),
        ),
      );
    },
  );
  routes.get(
    '/status',
    ...personOrRun,
    describeRoute({
      tags,
      summary: 'Read an issue’s previews',
      operationId: 'previewsGetIssuePreviews',
      description: `For whoever sees the issue: the previews of its linked pull requests, one per pull request and App previewed, each with its address, state, the head it follows and the one it runs, and the head’s build as CI reported it. The first administrator only for whoever may edit the issue, and its password only to a person asking with \`adminPassword=true\`. ${ISSUE_DEFAULT}`,
      security: personOrRunSecurity,
      responses: {
        200: dataResponse(IssuePreviewsSchema),
        ...apiErrorResponses,
        404: issueNotFound,
      },
      ...cliRoute({
        command: 'preview status',
        flags: {
          issueId: issueFlag,
          // The issue page's: a command never answers a password.
          adminPassword: { hidden: true },
        },
        action: 'pm.issues/view',
        examples: ['preview status', 'preview status --issue PM-12'],
      }),
    }),
    apiValidator('query', PreviewStatusQuery),
    async (c) => {
      const { issueId, adminPassword } = c.req.valid('query');
      const caller = callerOf(c);
      const read = await previews.read(
        await deps.permissions.viewerOf(caller),
        issueOf(c, issueId),
      );
      return c.json({
        data:
          adminPassword === 'true' && caller.kind === 'user'
            ? read
            : withoutPassword(read),
      });
    },
  );
  routes.get(
    '/logs',
    ...personOrRun,
    describeRoute({
      tags,
      summary: 'Read a preview App’s log',
      operationId: 'previewsReadPreviewLogs',
      description: `For whoever sees the issue: one bounded chunk of the log of a live preview of its pull requests (\`appId\` names the preview’s App, or the App it previews, when there are several). Read on with \`pageToken\` set to the previous \`meta.nextPageToken\`. ${ISSUE_DEFAULT}`,
      security: personOrRunSecurity,
      responses: {
        200: listResponse(PreviewLogEntrySchema, PreviewLogMeta),
        400: apiErrorResponse(
          400,
          'The issue has several live previews and `appId` names none of them alone (`PREVIEW_APP_REQUIRED`), or no issue is named outside a run on one (`ISSUE_REQUIRED`).',
        ),
        ...apiErrorResponses,
        404: apiErrorResponse(
          404,
          'The issue does not exist or the caller may not see it, or it has no such live preview (`PREVIEW_NOT_FOUND`).',
        ),
      },
      ...cliRoute({
        command: 'preview logs',
        flags: { issueId: issueFlag, appId: appFlag },
        columns: ['time', 'level', 'msg'],
        action: 'studio.previews/manage',
        examples: ['preview logs', 'preview logs --issue PM-12 --app web'],
      }),
    }),
    apiValidator('query', PreviewLogsQuery),
    async (c) => {
      const { issueId, appId, pageToken } = c.req.valid('query');
      const asker = await viewer(c);
      const read = await previews.read(asker, issueOf(c, issueId));
      const live = (
        appId ? previewsNamed(read.previews, appId) : read.previews
      ).filter((preview) => preview.status !== 'destroyed');
      if (live.length === 0)
        throw studioError(
          'NOT_FOUND',
          'PREVIEW_NOT_FOUND',
          'The issue has no such preview.',
        );
      if (live.length > 1)
        throw studioError(
          'INVALID_ARGUMENT',
          'PREVIEW_APP_REQUIRED',
          `Name the preview’s App (\`appId\`, \`--app\`): ${live.map((preview) => preview.appId).join(', ')}.`,
        );
      const releases = deps.releases();
      if (!releases)
        throw studioError(
          'NOT_FOUND',
          'PREVIEW_NOT_FOUND',
          'Release management is not assembled.',
        );
      // The issue's permissions were checked: Studio reads the App's log for the caller.
      const { entries, cursor, ...state } = await releases.releases.readLogs(
        { userId: asker.userId, kind: 'rule', permissions: allPermissions() },
        live[0].appId,
        pageToken ? { cursor: pageToken } : {},
      );
      return c.json({
        data: entries,
        meta: {
          hasMore: state.hasMore,
          available: state.available,
          reset: state.reset,
          enabled: state.enabled,
          nextPageToken: cursor,
        },
      });
    },
  );
  routes.post(
    '/down',
    ...personOrRun,
    describeRoute({
      tags,
      summary: 'Destroy an issue’s previews',
      operationId: 'previewsDestroyIssuePreviews',
      description: `For whoever may edit the issue. Destroys every preview App of the issue’s pull requests with its data, or the ones \`appId\` names (a preview’s App, or the App previewed); a pull request linked to other issues loses them there too, until its next head. Answers the issue’s previews, \`meta.message\` saying what went. ${ISSUE_DEFAULT}`,
      security: personOrRunSecurity,
      responses: {
        200: dataResponse(IssuePreviewsSchema),
        ...apiErrorResponses,
        404: issueNotFound,
      },
      ...cliRoute({
        command: 'preview down',
        flags: { issueId: issueFlag, appId: appFlag },
        confirm: 'Destroy these previews and their data?',
        action: 'studio.previews/manage',
        examples: [
          'preview down --yes',
          'preview down --issue PM-12 --app web',
        ],
      }),
    }),
    apiValidator('json', PreviewDownInput),
    async (c) => {
      const { issueId, appId } = c.req.valid('json');
      const result = withoutPassword(
        await previews.down(await viewer(c), issueOf(c, issueId), appId),
      );
      return c.json({
        data: result,
        meta: {
          message: `The previews of ${result.identifier}${appId ? ` (${appId})` : ''} are destroyed.`,
        },
      });
    },
  );
  routes.post(
    '/retry',
    ...person,
    describeRoute({
      tags,
      summary: 'Deploy a preview again',
      operationId: 'previewsRetryPreview',
      description:
        'For whoever may edit the issue. Deploys the build of the preview’s head again (`appId` is the preview’s App, or the App previewed when the issue has one preview of it); answers the issue’s previews.',
      responses: {
        200: dataResponse(IssuePreviewsSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(
          404,
          'The issue does not exist or the caller may not see it, or it has no preview of that App (`PREVIEW_NOT_FOUND`).',
        ),
      },
      ...cliRoute({
        command: 'preview retry',
        args: ['issueId', 'appId'],
        flags: { issueId: { name: 'issue' }, appId: { name: 'app' } },
        examples: ['preview retry PM-12 web'],
      }),
    }),
    apiValidator('json', PreviewRetryInput),
    async (c) => {
      const { issueId, appId } = c.req.valid('json');
      return c.json({
        data: withoutPassword(
          await previews.retry(await viewer(c), issueId, appId),
        ),
      });
    },
  );
  routes.post(
    '/variables',
    ...person,
    describeRoute({
      tags,
      summary: 'Save what a blocked preview misses',
      operationId: 'previewsSetPreviewVariables',
      description:
        'For whoever may edit the issue. Saves values for the variables a blocked preview’s build requires — to this preview only (`scope: preview`), or to the Preview environment for every preview there (`scope: environment`, which needs the `rel.environments` `manage` setting) — and deploys the preview again; answers the issue’s previews.',
      responses: {
        200: dataResponse(IssuePreviewsSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(
          404,
          'The issue does not exist or the caller may not see it, or it has no preview of that App (`PREVIEW_NOT_FOUND`).',
        ),
      },
      // The issue page's form: values that may be secrets stay off the command line, which sets them with
      // `app env set` and `env var set`.
      ...cliRoute(false),
    }),
    apiValidator('json', PreviewVariablesInput),
    async (c) => {
      const { issueId, appId, scope, values } = c.req.valid('json');
      return c.json({
        data: withoutPassword(
          await previews.setVariables(
            await viewer(c),
            issueId,
            appId,
            scope,
            values,
          ),
        ),
      });
    },
  );
  return routes;
}

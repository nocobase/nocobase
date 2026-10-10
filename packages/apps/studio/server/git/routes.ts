/**
 * `/api/git`, signed in:
 *
 * | route                                                        | what                                            |
 * | ------------------------------------------------------------ | ----------------------------------------------- |
 * | `GET    /status`                                             | whether git shows at all (`GitStatus`)          |
 * | `GET    /connections`                                        | the connections (`studio.git` `read`)            |
 * | `POST   /connections` `SaveGitConnectionRequest`             | adds one, or another installation of an app (`sameAppAs`); `manage` |
 * | `PATCH  /connections/:connectionId` `SaveGitConnectionRequest` | changes one; credentials are write-only       |
 * | `DELETE /connections/:connectionId`                          | removes one                                     |
 * | `POST   /connections/startAppManifest` `StartGitAppManifestRequest` | the form that creates an app on the host (`GitAppManifestForm`); `manage` |
 * | `GET    /connections/:connectionId/reach`                    | how many repositories it reaches, live          |
 * | `GET    /connections/:connectionId/repositories?q=&pageToken=` | the repositories it reaches, live (`GitRepoChoice[]`, `meta.nextPageToken`) |
 * | `POST   /connections/:connectionId/repositories` `CreateGitRepoRequest` | creates a repository (`CreatedGitRepo`) |
 * | `GET    /connections/:connectionId/templateRepositories?q=&pageToken=` | the template repositories among one page of those it reaches |
 * | `GET    /connections/:connectionId/templateRepositories/:owner/:name` | a template repository it can read, public ones included (`GitRepoChoice`) |
 * | `GET    /connections/:connectionId/repositories/:owner/:name/workflows` | a repository's workflows (`GitWorkflow[]`) |
 * | `GET    /authorizations`                                     | the viewer's own authorizations                 |
 * | `POST   /authorizations/:connectionId/authorize`             | `{ url }` of the host's authorization page (OAuth web flow) |
 * | `POST   /authorizations/:connectionId/startDeviceFlow`       | a device flow's code to enter on the host (`GitDeviceAuthorization`) |
 * | `POST   /authorizations/:connectionId/pollDeviceFlow` `{ handle }` | whether the person entered it (`GitDevicePoll`) |
 * | `POST   /authorizations/:connectionId/useToken` `{ token }`  | checks and stores a personal access token (`GitPersonalAuthorization`) |
 * | `DELETE /authorizations/:connectionId`                       | forgets the viewer's authorization              |
 * | `GET`/`PUT /projects/:projectId` `GitProjectSettings`        | a project's commit attribution default          |
 * | `GET    /pullRequests?issueId=`                              | the issue's pull requests; `meta` has the suggestions and what the viewer may do |
 * | `POST   /pullRequests` `{ issueId, url }`                    | links one (201, or 200 when it was linked)      |
 * | `POST   /pullRequests/open` `{ issueId, title, … }`          | opens one on the host and links it (201)        |
 * | `POST   /pullRequests/:pullRequestId/edit?issueId=` `{ title, body, base, draft, ready }` | edits it on the host |
 * | `POST   /pullRequests/:pullRequestId/close?issueId=` `{ reason, unlink }` | comments the reason and closes it on the host |
 * | `POST   /pullRequests/:pullRequestId/reopen?issueId=`        | reopens it on the host                          |
 * | `PATCH  /pullRequests/:pullRequestId?issueId=` `{ autoCompleteDisabled }` | whether it counts for moving the issue on |
 * | `DELETE /pullRequests/:pullRequestId?issueId=`               | unlinks it                                      |
 * | `DELETE /pullRequests/:pullRequestId/suggestion?issueId=`    | dismisses a suggested pull request              |
 * | `POST   /pullRequests/:pullRequestId/refresh?issueId=`       | reads it from the host now                      |
 * | `POST   /pullRequests/:pullRequestId/checkMerge?issueId=`    | reads it from the host and answers the merge preflight (`PullRequestMergePreflight`) |
 * | `POST   /pullRequests/:pullRequestId/merge?issueId=` `{ expectedHeadSha }` | merges that head (squash) |
 * | `POST   /pullRequests/:pullRequestId/markMerged?issueId=`    | records it merged without the host              |
 * | `GET    /marks?issueIds=a,b`                                 | the pull request marks of those issues          |
 * | `GET`/`PATCH /resources/:resourceId` `UpdateGitRepoRequest`  | a working directory's repository settings       |
 *
 * A pull request may be linked to several issues, so each route about one names the issue it acts through (`issueId`),
 * whose permissions decide. The three collection routes (`nb-studio pr list|link|open`) and changing a pull request on
 * the host (`pr edit|close|reopen`) also take scoped keys and agents' runs, as the caller's narrowed `Viewer`; a run on
 * an issue may leave `issueId` out of the collection routes for its own. The rest is for a person's session or key.
 *
 * Listing and creating repositories is for whoever manages a project (or the connections); template repositories and
 * their workflows also for whoever may create projects (the new-project wizard). Errors are the standard body: Studio's
 * reasons with domain `nb-studio`, such as `PR_NOT_MERGEABLE` (`metadata.blocker`), `PR_CHANGED`, `GITHUB_MERGE_FORBIDDEN`,
 * `INVALID_EXPECTED_HEAD`, `INVALID_WEBHOOK_SECRET`, `INVALID_BRANCH_RULE`, `INVALID_GIT_CONNECTION`; the projects
 * plugin's keep its domain.
 *
 * The host's redirects (`gitOAuthRoutes`) are root routes, `GET /oauth/git/callback` (a person authorized the app),
 * `/oauth/git/manifest` (an app was created from the manifest) and `/oauth/git/setup` (it was installed): the protocol
 * sends the browser back with a `GET` that completes something, which an `/api` `GET` may not do.
 *
 * The webhook endpoints (`gitWebhookRoutes`) are deliberately public: the host cannot present a session or a key.
 * `POST /api/webhooks/github/repositories/:repositoryId` takes a repository's own webhook, `POST
 * /api/webhooks/github/connections/:connectionId` a connection's (an app's). Their boundary is the signature over the
 * raw body with the endpoint's webhook secret and the delivery id (`webhooks.ts`): 401 `INVALID_SIGNATURE` without a
 * valid signature, 400 `MISSING_DELIVERY` without `X-GitHub-Delivery`, 404 `WEBHOOK_NOT_FOUND` for an unknown
 * endpoint, 200 `{ data: { duplicate: true } }` for a delivery taken already, else 200
 * `{ data: { ok, event, ignored, reason } }`. They sit outside `/git`, whose routes ask for a session.
 */
import type { CallerIdentity } from '@nocobase/app-plugin-agents/server/tokens';
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import type { Application } from '@nocobase/app-server/application';
import { loggingToken } from '@nocobase/app-server/logging';
import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  cliRoute,
  dataResponse,
  defineApiRoutes,
  defineRootRoutes,
  describeRoute,
  emptyResponse,
  listResponse,
  type AppApiRouteContribution,
  type AppRootRouteContribution,
} from '@nocobase/app-server/router';
import { Hono, type Context, type MiddlewareHandler } from 'hono';

import { ISSUE_SUBJECT } from '../agents/catalog/triggers.js';
import { callerOfRequest, runSubjectOf } from '../agents/run-principal.js';
import { studioError, studioErrorHandler } from '../http/errors.js';
import { boundedList, query } from '../http/input.js';
import { MARKS_MAX } from '../../shared/git.js';
import {
  AuthorizeUrlSchema,
  ConnectionParams,
  CreatedGitRepoSchema,
  GitAppManifestFormSchema,
  GitConnectionReachSchema,
  GitConnectionUseSchema,
  GitConnectionSchema,
  GitDeviceAuthorizationSchema,
  GitDevicePollSchema,
  GitPersonalAuthorizationSchema,
  GitPersonalAuthorizationsSchema,
  GitProjectSettingsSchema,
  GitRepoChoiceSchema,
  GitRepoSettingsSchema,
  GitStatusSchema,
  GitWorkflowSchema,
  IssuePullRequestSchema,
  IssuePullRequestsMeta,
  PullRequestMarksSchema,
  PullRequestMergePreflightSchema,
  RepositoryPageMeta,
  WebhookResultSchema,
  ClosePullRequestInput,
  CreateRepositoryInput,
  EditPullRequestInput,
  LinkPullRequestInput,
  MarksQuery,
  MergeInput,
  OAuthCallbackQuery,
  OpenPullRequestInput,
  PersonalTokenInput,
  PollDeviceFlowInput,
  ProjectParams,
  ProjectSettingsInput,
  PullRequestListQuery,
  PullRequestIssueQuery,
  PullRequestParams,
  RepositoryListQuery,
  RepositoryParams,
  RepositoryWebhookParams,
  ResourceParams,
  SaveConnectionInput,
  AppManifestCallbackQuery,
  AppSetupQuery,
  StartAppManifestInput,
  TemplateRepositoryListQuery,
  UpdatePullRequestInput,
  UpdateRepositoryInput,
} from './schemas.js';
import { studioGitToken, type StudioGitBinding } from './token.js';
import type { WebhookRequest, WebhookResult } from './webhooks.js';

const userIdOf = (context: Context) =>
  (context.get('auth' as never) as { user: { id: string } }).user.id;

/** The callback as the host must see it: absolute, from the request's origin without `app.publicOrigin`. */
function callbackOf(binding: StudioGitBinding, context: Context): string {
  const url = binding.callbackUrl();
  return url.startsWith('/') ? `${new URL(context.req.url).origin}${url}` : url;
}

/** A path on Studio as the host must see it: absolute, from the request's origin without `app.publicOrigin`. */
function absoluteOf(
  binding: StudioGitBinding,
  context: Context,
  path: string,
): string {
  const url = binding.absoluteUrl(path);
  return url.startsWith('/') ? `${new URL(context.req.url).origin}${url}` : url;
}

/** A page of the host's repositories: the next page's number is the token. */
function repositoryPage<T>(
  page: number,
  list: { readonly items: readonly T[]; readonly hasMore: boolean },
) {
  return {
    data: list.items,
    meta: list.hasMore ? { nextPageToken: String(page + 1) } : {},
  };
}

const tags = ['Studio'];

/** A session, an API key, or an agent's run token. */
const personOrRunSecurity: Record<string, string[]>[] = [
  { cookieAuth: [] },
  { apiKeyAuth: [] },
  { runToken: [] },
];

/** An issue's pull request link: the issue (id or PM-12) and the pull request's id in Studio. */
/** `pr merge PM-12 <pr>`: the issue, then the pull request. */
const PR_POSITIONAL = ['issueId', 'pullRequestId'];

const PR_ARGS = {
  issueId: {
    name: 'issue',
    description:
      'The issue the pull request is linked to (`PM-12`, or its id).',
  },
  pullRequestId: {
    name: 'pr',
    description: 'The pull request’s id in Studio (`pr list`).',
  },
};

const ISSUE_DEFAULT =
  'An agent’s run on an issue may leave `issueId` out for its own issue.';

const issueFlag = {
  name: 'issue',
  description:
    'The issue, such as PM-12; in a run on an issue, that issue by default.',
};

/** Who made the request, once authenticated. */
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

/** Who linked a pull request: the run's agent, or the person. */
function linkerOf(caller: CallerIdentity) {
  return {
    type: caller.agent ? ('agent' as const) : ('user' as const),
    id: caller.agent?.id ?? caller.userId,
  };
}

const connectionNotFound = apiErrorResponse(
  404,
  'The connection does not exist (`GIT_CONNECTION_NOT_FOUND`).',
);
const hostRefused = apiErrorResponse(
  400,
  'The input is not acceptable to the connection (`INVALID_GIT_CONNECTION` and similar), or the code host refused the request (`GITHUB_FORBIDDEN`, `GITHUB_NOT_FOUND`, `GITHUB_INVALID`, `GITHUB_REFUSED`).',
);
const deviceFlowRefused = apiErrorResponse(
  400,
  'The app does not allow the device flow (`GIT_DEVICE_FLOW_DISABLED`), or the code host refused to start it (`GIT_DEVICE_FLOW_REFUSED`, with its `status` and `hostError`); both name the app’s settings on the host in `appSettingsUrl` when Studio knows them. Otherwise as the other authorization routes (`GIT_PERSONAL_UNAVAILABLE`, `GITHUB_*`).',
);
const hostUnavailable = apiErrorResponse(
  503,
  'The code host could not be reached (`GITHUB_UNAVAILABLE`), or its rate limit was reached (`GITHUB_RATE_LIMITED`, with `retryAt`).',
);
const issueNotFound = apiErrorResponse(
  404,
  'The issue does not exist or the caller may not see it.',
);
const pullRequestNotFound = apiErrorResponse(
  404,
  'The issue, or its link to the pull request, does not exist (`PULL_REQUEST_LINK_NOT_FOUND`).',
);
const signedIn = {
  401: apiErrorResponse(401),
  500: apiErrorResponse(500),
} as const;

export const gitRoutes: AppApiRouteContribution<Application> = defineApiRoutes(
  ({ container }) => {
    // Without authentication, authorization or Studio's git service (an application's own tests) there is nothing to
    // serve.
    if (
      !container.has(authenticationToken) ||
      !container.has(authorizationToken) ||
      !container.has(studioGitToken)
    )
      return new Hono();
    const authentication = container.resolve(authenticationToken);
    const authorization = container.resolve(authorizationToken);
    const binding = container.resolve(studioGitToken);
    const { git, viewerOf, connections } = binding;

    const routes = new Hono();
    routes.onError(studioErrorHandler);
    // A person's session or unscoped key; the pull request commands also take scoped keys and runs.
    const person = authentication.required();
    const personOrRun = [
      authentication.required({ scopedKeys: true }),
      authorization.middleware(),
    ] as const;
    const viewer = (context: Context) => viewerOf(userIdOf(context));
    /** The caller as Studio's permissions see them: a key's scope or a run's agent narrows them. */
    const callerViewer = (context: Context) =>
      binding.callerViewerOf(callerOf(context));

    /** The connections' settings capability, before the input is read. */
    const requireSettings =
      (action: 'read' | 'manage'): MiddlewareHandler =>
      async (context, next) => {
        if (!(await binding.gitSettings(userIdOf(context)))[action])
          throw studioError(
            'PERMISSION_DENIED',
            'FORBIDDEN',
            action === 'read'
              ? 'You may not see the connections to code hosts.'
              : 'Only someone who manages the connections may do this.',
          );
        await next();
      };

    /** Whether the caller links repositories: whoever manages a project, or the connections. */
    async function linker(context: Context): Promise<boolean> {
      const who = await viewer(context);
      if (who.permissions.scopes['pm.projects/manage'] !== 'none') return true;
      return (await binding.gitSettings(who.userId)).manage;
    }

    const requireLinker: MiddlewareHandler = async (context, next) => {
      if (!(await linker(context)))
        throw studioError(
          'PERMISSION_DENIED',
          'FORBIDDEN',
          'Only a project’s managers link its repositories.',
        );
      await next();
    };

    /** The new-project wizard's reads: for whoever may create projects, or link repositories. */
    const requireCreator: MiddlewareHandler = async (context, next) => {
      const who = await viewer(context);
      if (
        who.permissions.scopes['pm.projects/create'] === 'none' &&
        !(await linker(context))
      )
        throw studioError(
          'PERMISSION_DENIED',
          'FORBIDDEN',
          'Only someone who may create projects or link repositories may do this.',
        );
      await next();
    };

    // --- Connections -------------------------------------------------------------------------------------------
    routes.get(
      '/status',
      person,
      describeRoute({
        tags,
        summary: 'Read whether git is set up',
        operationId: 'gitGetStatus',
        ...cliRoute({ command: 'git status' }),
        description:
          'For anyone signed in: whether any connection to a code host exists, the connections to pick from, and whether the caller manages them.',
        responses: { 200: dataResponse(GitStatusSchema), ...signedIn },
      }),
      async (context) => {
        const choices = await connections().choices();
        return context.json({
          data: {
            enabled: choices.length > 0,
            connections: choices,
            canManage: (await binding.gitSettings(userIdOf(context))).manage,
            publicOrigin: binding.publicOrigin(),
          },
        });
      },
    );
    routes.get(
      '/connections',
      person,
      requireSettings('read'),
      describeRoute({
        tags,
        summary: 'List the connections to code hosts',
        operationId: 'gitListConnections',
        ...cliRoute({
          command: 'git connection list',
          columns: ['id', 'name', 'kind', 'account', 'webUrl', 'usedBy'],
        }),
        description:
          'For whoever may read the git settings. A bounded list; credentials are write-only.',
        responses: {
          200: listResponse(GitConnectionSchema),
          ...apiErrorResponses,
        },
      }),
      async (context) => context.json(boundedList(await connections().list())),
    );
    routes.post(
      '/connections',
      person,
      requireSettings('manage'),
      describeRoute({
        tags,
        summary: 'Add a connection to a code host',
        operationId: 'gitCreateConnection',
        ...cliRoute({
          command: 'git connection create',
          flags: {
            sameAppAs: { name: 'same-app-as' },
            privateKey: { contentFile: true },
            token: { prompt: true },
          },
          examples: [
            'git connection create --kind token --name GitHub --account acme --token ghp_...',
          ],
        }),
        description:
          'For whoever manages the connections. `sameAppAs` adds another installation of an existing app connection, taking its credentials.',
        responses: {
          201: dataResponse(GitConnectionSchema, 'Created.'),
          400: hostRefused,
          ...apiErrorResponses,
          409: apiErrorResponse(
            409,
            'The installation has a connection already (`GIT_INSTALLATION_EXISTS`).',
          ),
          503: hostUnavailable,
        },
      }),
      apiValidator('json', SaveConnectionInput),
      async (context) =>
        context.json(
          {
            data: await connections().create(
              userIdOf(context),
              context.req.valid('json'),
            ),
          },
          201,
        ),
    );
    routes.post(
      '/connections/startAppManifest',
      person,
      requireSettings('manage'),
      describeRoute({
        tags,
        summary: 'Start creating an app on the code host from a manifest',
        operationId: 'gitStartAppManifest',
        // Browser-only: the answer is a form the browser posts to the host; add an app in Settings › Git.
        ...cliRoute(false),
        description:
          'For whoever manages the connections. Answers the form a browser posts to the host to create the app; the host then sends the browser back to Studio, which stores the app as a connection.',
        responses: {
          200: dataResponse(GitAppManifestFormSchema),
          400: hostRefused,
          ...apiErrorResponses,
        },
      }),
      apiValidator('json', StartAppManifestInput),
      async (context) =>
        context.json({
          data: await connections().startAppManifest(
            userIdOf(context),
            context.req.valid('json'),
            {
              homepage: absoluteOf(binding, context, '/'),
              redirect: absoluteOf(binding, context, '/oauth/git/manifest'),
              callback: callbackOf(binding, context),
              setup: absoluteOf(binding, context, '/oauth/git/setup'),
              webhook: (id) =>
                absoluteOf(
                  binding,
                  context,
                  `/api/webhooks/github/connections/${encodeURIComponent(id)}`,
                ),
              publicOrigin: binding.publicOrigin(),
            },
          ),
        }),
    );
    routes.patch(
      '/connections/:connectionId',
      person,
      requireSettings('manage'),
      describeRoute({
        tags,
        summary: 'Update a connection to a code host',
        operationId: 'gitUpdateConnection',
        ...cliRoute({
          command: 'git connection update',
          flags: {
            connectionId: { name: 'connection' },
            privateKey: { contentFile: true },
          },
        }),
        description:
          'For whoever manages the connections. A credential left out stays; null removes it.',
        responses: {
          200: dataResponse(GitConnectionSchema),
          400: hostRefused,
          ...apiErrorResponses,
          404: connectionNotFound,
          503: hostUnavailable,
        },
      }),
      apiValidator('param', ConnectionParams),
      apiValidator('json', SaveConnectionInput),
      async (context) =>
        context.json({
          data: await connections().update(
            context.req.valid('param').connectionId,
            context.req.valid('json'),
          ),
        }),
    );
    routes.delete(
      '/connections/:connectionId',
      person,
      requireSettings('manage'),
      describeRoute({
        tags,
        summary: 'Remove a connection to a code host',
        operationId: 'gitDeleteConnection',
        ...cliRoute({
          command: 'git connection delete',
          flags: { connectionId: { name: 'connection' } },
          confirm:
            'Remove this connection? Everyone’s authorization of it goes too.',
        }),
        description:
          'For whoever manages the connections. Everyone’s authorization of it goes too.',
        responses: {
          204: emptyResponse(),
          ...apiErrorResponses,
          404: connectionNotFound,
        },
      }),
      apiValidator('param', ConnectionParams),
      async (context) => {
        await connections().remove(context.req.valid('param').connectionId);
        return context.body(null, 204);
      },
    );
    routes.get(
      '/connections/:connectionId/reach',
      person,
      requireSettings('read'),
      describeRoute({
        tags,
        summary: 'Count the repositories a connection reaches',
        operationId: 'gitGetConnectionReach',
        ...cliRoute({
          command: 'git connection reach',
          flags: { connectionId: { name: 'connection' } },
        }),
        description:
          'For whoever may read the git settings; read live from the code host.',
        responses: {
          200: dataResponse(GitConnectionReachSchema),
          400: hostRefused,
          ...apiErrorResponses,
          404: connectionNotFound,
          503: hostUnavailable,
        },
      }),
      apiValidator('param', ConnectionParams),
      async (context) =>
        context.json({
          data: await connections().reach(
            context.req.valid('param').connectionId,
          ),
        }),
    );
    routes.get(
      '/connections/:connectionId/usage',
      person,
      requireSettings('read'),
      describeRoute({
        tags,
        summary: 'List the repositories linked through a connection',
        operationId: 'gitListConnectionUses',
        ...cliRoute({
          command: 'git connection usage',
          flags: { connectionId: { name: 'connection' } },
          columns: ['repo', 'projectName', 'resourceId'],
        }),
        description:
          'For whoever may read the git settings: the projects’ working directories that link a repository through the connection, which its `usedBy` counts by repository. A bounded list.',
        responses: {
          200: listResponse(GitConnectionUseSchema),
          ...apiErrorResponses,
          404: connectionNotFound,
        },
      }),
      apiValidator('param', ConnectionParams),
      async (context) =>
        context.json(
          boundedList(
            await connections().uses(context.req.valid('param').connectionId),
          ),
        ),
    );
    routes.get(
      '/connections/:connectionId/repositories',
      person,
      requireLinker,
      describeRoute({
        tags,
        summary: 'List the repositories a connection reaches',
        operationId: 'gitListRepositories',
        ...cliRoute({
          command: 'git repo list',
          flags: {
            connectionId: { name: 'connection' },
            q: { name: 'search' },
          },
          columns: ['fullName', 'private', 'defaultBranch', 'webUrl'],
        }),
        description:
          'For whoever manages a project or the connections; read live from the code host, searched by name with `q`. `meta.nextPageToken` is present while there are more.',
        responses: {
          200: listResponse(GitRepoChoiceSchema, RepositoryPageMeta),
          400: hostRefused,
          ...apiErrorResponses,
          404: connectionNotFound,
          503: hostUnavailable,
        },
      }),
      apiValidator('param', ConnectionParams),
      apiValidator('query', RepositoryListQuery),
      async (context) => {
        const { q, pageToken } = context.req.valid('query');
        const page = Number(pageToken ?? 1);
        return context.json(
          repositoryPage(
            page,
            await connections().listRepos(
              context.req.valid('param').connectionId,
              { query: q ?? '', page },
            ),
          ),
        );
      },
    );
    routes.post(
      '/connections/:connectionId/repositories',
      person,
      requireLinker,
      describeRoute({
        tags,
        summary: 'Create a repository on the code host',
        operationId: 'gitCreateRepository',
        ...cliRoute({
          command: 'git repo create',
          flags: { connectionId: { name: 'connection' } },
          examples: [
            'git repo create <connection> --owner acme --name web --private',
          ],
        }),
        description:
          'For whoever manages a project or the connections. `empty` creates it without an initial commit.',
        responses: {
          201: dataResponse(CreatedGitRepoSchema, 'Created.'),
          400: hostRefused,
          ...apiErrorResponses,
          404: connectionNotFound,
          503: hostUnavailable,
        },
      }),
      apiValidator('param', ConnectionParams),
      apiValidator('json', CreateRepositoryInput),
      async (context) =>
        context.json(
          {
            data: await connections().createRepo(
              context.req.valid('param').connectionId,
              context.req.valid('json'),
            ),
          },
          201,
        ),
    );
    routes.get(
      '/connections/:connectionId/templateRepositories',
      person,
      requireCreator,
      describeRoute({
        tags,
        summary: 'List the template repositories a connection reaches',
        operationId: 'gitListTemplateRepositories',
        ...cliRoute({
          command: 'git template list',
          flags: {
            connectionId: { name: 'connection' },
            q: { name: 'search' },
          },
          columns: ['fullName', 'private', 'defaultBranch', 'description'],
        }),
        description:
          'For whoever may create projects or link repositories; read live from the code host, one page of the repositories the connection reaches per request, keeping its template repositories (whose name holds `q`, when given). A page may hold none while `meta.nextPageToken` says there are more to read.',
        responses: {
          200: listResponse(GitRepoChoiceSchema, RepositoryPageMeta),
          400: hostRefused,
          ...apiErrorResponses,
          404: connectionNotFound,
          503: hostUnavailable,
        },
      }),
      apiValidator('param', ConnectionParams),
      apiValidator('query', TemplateRepositoryListQuery),
      async (context) => {
        const { q, pageToken } = context.req.valid('query');
        const page = Number(pageToken ?? 1);
        return context.json(
          repositoryPage(
            page,
            await connections().templateRepos(
              context.req.valid('param').connectionId,
              { page, query: q ?? '' },
            ),
          ),
        );
      },
    );
    routes.get(
      '/connections/:connectionId/templateRepositories/:owner/:name',
      person,
      requireCreator,
      describeRoute({
        tags,
        summary: 'Check a template repository',
        operationId: 'gitGetTemplateRepository',
        ...cliRoute({
          command: 'git template get',
          flags: { connectionId: { name: 'connection' } },
          columns: ['fullName', 'private', 'defaultBranch', 'description'],
        }),
        description:
          'For whoever may create projects or link repositories: the repository read through the connection, any it can read — a public template of another account included — when it is a template repository. 404 `TEMPLATE_REPO_NOT_FOUND` when the connection cannot read it, 400 `NOT_A_TEMPLATE_REPO` when it is not a template.',
        responses: {
          200: dataResponse(GitRepoChoiceSchema),
          400: apiErrorResponse(
            400,
            'Not a template repository (`NOT_A_TEMPLATE_REPO`), or the code host refused the request.',
          ),
          ...apiErrorResponses,
          404: apiErrorResponse(
            404,
            'The connection does not exist (`GIT_CONNECTION_NOT_FOUND`), or cannot read the repository (`TEMPLATE_REPO_NOT_FOUND`).',
          ),
          503: hostUnavailable,
        },
      }),
      apiValidator('param', RepositoryParams),
      async (context) => {
        const { connectionId, owner, name } = context.req.valid('param');
        return context.json({
          data: await connections().templateRepo(
            connectionId,
            `${owner}/${name}`,
            { asResource: true },
          ),
        });
      },
    );
    routes.get(
      '/connections/:connectionId/repositories/:owner/:name/workflows',
      person,
      requireCreator,
      describeRoute({
        tags,
        summary: 'List a repository’s workflows',
        operationId: 'gitListRepositoryWorkflows',
        ...cliRoute({
          command: 'git workflow list',
          flags: { connectionId: { name: 'connection' } },
          columns: ['id', 'name', 'path', 'state'],
        }),
        description:
          'For whoever may create projects or link repositories; read through the connection. A bounded list.',
        responses: {
          200: listResponse(GitWorkflowSchema),
          400: hostRefused,
          ...apiErrorResponses,
          404: connectionNotFound,
          503: hostUnavailable,
        },
      }),
      apiValidator('param', RepositoryParams),
      async (context) => {
        const { connectionId, owner, name } = context.req.valid('param');
        return context.json(
          boundedList(
            await connections().workflows(connectionId, `${owner}/${name}`),
          ),
        );
      },
    );

    // --- A person's own authorization --------------------------------------------------------------------------
    routes.get(
      '/authorizations',
      person,
      describeRoute({
        tags,
        summary: 'List the caller’s own authorizations on code hosts',
        operationId: 'gitListAuthorizations',
        ...cliRoute({ command: 'git authorization list' }),
        description:
          'The connections the caller can connect their own account through, oldest first, and those they already did (even once a connection stops allowing it, so they can disconnect). Demo connections are never listed.',
        responses: {
          200: dataResponse(GitPersonalAuthorizationsSchema),
          ...signedIn,
        },
      }),
      async (context) =>
        context.json({ data: await connections().personal(userIdOf(context)) }),
    );
    routes.post(
      '/authorizations/:connectionId/authorize',
      person,
      describeRoute({
        tags,
        summary: 'Start authorizing a connection’s app (OAuth)',
        operationId: 'gitAuthorizeConnection',
        // Browser-only OAuth web flow; on the command line, `git authorization start` (device flow) or `use-token`.
        ...cliRoute(false),
        description:
          'Answers the host’s authorization page; the host sends the browser back to Studio, which stores the caller’s authorization.',
        responses: {
          200: dataResponse(AuthorizeUrlSchema),
          400: hostRefused,
          ...signedIn,
          404: connectionNotFound,
        },
      }),
      apiValidator('param', ConnectionParams),
      async (context) =>
        context.json({
          data: {
            url: await connections().authorizeUrl(
              userIdOf(context),
              context.req.valid('param').connectionId,
              callbackOf(binding, context),
            ),
          },
        }),
    );
    routes.post(
      '/authorizations/:connectionId/startDeviceFlow',
      person,
      describeRoute({
        tags,
        summary: 'Start a device flow authorization',
        operationId: 'gitStartDeviceFlow',
        ...cliRoute({
          command: 'git authorization start',
          flags: { connectionId: { name: 'connection' } },
          examples: ['git authorization start <connection>'],
        }),
        description:
          'Answers the code the caller enters on the host; poll `pollDeviceFlow` with `handle` until it is connected.',
        responses: {
          200: dataResponse(GitDeviceAuthorizationSchema),
          400: deviceFlowRefused,
          ...signedIn,
          404: connectionNotFound,
          503: hostUnavailable,
        },
      }),
      apiValidator('param', ConnectionParams),
      async (context) =>
        context.json({
          data: await connections().startDeviceFlow(
            userIdOf(context),
            context.req.valid('param').connectionId,
          ),
        }),
    );
    routes.post(
      '/authorizations/:connectionId/pollDeviceFlow',
      person,
      describeRoute({
        tags,
        summary: 'Poll a device flow authorization',
        operationId: 'gitPollDeviceFlow',
        ...cliRoute({
          command: 'git authorization poll',
          flags: { connectionId: { name: 'connection' } },
        }),
        description:
          'Asks the host once whether the caller entered the code, and stores the authorization once they did.',
        responses: {
          200: dataResponse(GitDevicePollSchema),
          400: hostRefused,
          ...signedIn,
          404: connectionNotFound,
          503: hostUnavailable,
        },
      }),
      apiValidator('param', ConnectionParams),
      apiValidator('json', PollDeviceFlowInput),
      async (context) =>
        context.json({
          data: await connections().pollDeviceFlow(
            userIdOf(context),
            context.req.valid('param').connectionId,
            context.req.valid('json').handle,
          ),
        }),
    );
    routes.post(
      '/authorizations/:connectionId/useToken',
      person,
      describeRoute({
        tags,
        summary: 'Authorize with a personal access token',
        operationId: 'gitUsePersonalToken',
        ...cliRoute({
          command: 'git authorization use-token',
          flags: {
            connectionId: { name: 'connection' },
            token: { prompt: true },
          },
        }),
        description:
          'Checks the token by calling the host as it, then stores it as the caller’s authorization. The token is never sent back.',
        responses: {
          200: dataResponse(GitPersonalAuthorizationSchema),
          400: hostRefused,
          ...signedIn,
          404: connectionNotFound,
          503: hostUnavailable,
        },
      }),
      apiValidator('param', ConnectionParams),
      apiValidator('json', PersonalTokenInput),
      async (context) =>
        context.json({
          data: await connections().usePersonalToken(
            userIdOf(context),
            context.req.valid('param').connectionId,
            context.req.valid('json').token,
          ),
        }),
    );
    routes.delete(
      '/authorizations/:connectionId',
      person,
      describeRoute({
        tags,
        summary: 'Forget the caller’s authorization',
        operationId: 'gitDeleteAuthorization',
        ...cliRoute({
          command: 'git authorization delete',
          flags: { connectionId: { name: 'connection' } },
          confirm: 'Forget your authorization of this connection?',
        }),
        responses: {
          204: emptyResponse(),
          ...signedIn,
          404: connectionNotFound,
        },
      }),
      apiValidator('param', ConnectionParams),
      async (context) => {
        await connections().disconnect(
          userIdOf(context),
          context.req.valid('param').connectionId,
        );
        return context.body(null, 204);
      },
    );

    // --- A project's git settings ------------------------------------------------------------------------------
    routes.get(
      '/projects/:projectId',
      person,
      describeRoute({
        tags,
        summary: 'Read a project’s git settings',
        operationId: 'gitGetProjectSettings',
        ...cliRoute({
          command: 'git project get',
          flags: { projectId: { name: 'project' } },
        }),
        description: 'For whoever sees the project.',
        responses: {
          200: dataResponse(GitProjectSettingsSchema),
          ...signedIn,
          404: apiErrorResponse(
            404,
            'The project does not exist or the caller may not see it.',
          ),
        },
      }),
      apiValidator('param', ProjectParams),
      async (context) =>
        context.json({
          data: await git().projectSettings(
            await viewer(context),
            context.req.valid('param').projectId,
          ),
        }),
    );
    routes.put(
      '/projects/:projectId',
      person,
      describeRoute({
        tags,
        summary: 'Replace a project’s git settings',
        operationId: 'gitReplaceProjectSettings',
        ...cliRoute({
          command: 'git project set',
          flags: { projectId: { name: 'project' } },
        }),
        description: 'For the project’s managers.',
        responses: {
          200: dataResponse(GitProjectSettingsSchema),
          ...apiErrorResponses,
          404: apiErrorResponse(
            404,
            'The project does not exist or the caller may not see it.',
          ),
        },
      }),
      apiValidator('param', ProjectParams),
      apiValidator('json', ProjectSettingsInput),
      async (context) =>
        context.json({
          data: await git().setProjectSettings(
            await viewer(context),
            context.req.valid('param').projectId,
            context.req.valid('json'),
          ),
        }),
    );

    // --- Pull requests -----------------------------------------------------------------------------------------
    // The issue's pull requests as a collection, the issue in the query or the body: a run names none and gets its
    // own issue.
    routes.get(
      '/pullRequests',
      ...personOrRun,
      describeRoute({
        tags,
        summary: 'List an issue’s pull requests',
        operationId: 'gitListPullRequests',
        description: `For whoever sees the issue. \`meta\` carries the suggested pull requests and what the caller may do. ${ISSUE_DEFAULT}`,
        security: personOrRunSecurity,
        responses: {
          200: listResponse(IssuePullRequestSchema, IssuePullRequestsMeta),
          ...apiErrorResponses,
          404: issueNotFound,
        },
        ...cliRoute({
          command: 'pr list',
          flags: { issueId: issueFlag },
          columns: ['id', 'repo', 'number', 'state', 'ciState', 'title'],
          action: 'pm.issues/view',
          examples: ['pr list', 'pr list --issue PM-12'],
        }),
      }),
      apiValidator('query', PullRequestListQuery),
      async (context) => {
        const { data, ...about } = await git().list(
          await callerViewer(context),
          issueOf(context, context.req.valid('query').issueId),
        );
        return context.json({ data, meta: { ...about, total: data.length } });
      },
    );
    routes.post(
      '/pullRequests',
      ...personOrRun,
      describeRoute({
        tags,
        summary: 'Link a pull request to an issue',
        operationId: 'gitLinkPullRequest',
        description: `For whoever may edit the issue: a pull request opened elsewhere, which Studio then reads from the code host and follows. Once every linked pull request is merged, the issue moves on. Branches a repository’s branch rules name (\`agent/<issue key>\` by default) are linked automatically. Answers 201 when it was linked now, 200 when it was linked already; \`meta.message\` says which. ${ISSUE_DEFAULT}`,
        security: personOrRunSecurity,
        responses: {
          200: dataResponse(IssuePullRequestSchema, 'Linked already.'),
          201: dataResponse(IssuePullRequestSchema, 'Linked.'),
          400: apiErrorResponse(
            400,
            'The URL is not a pull request of a reachable repository (`INVALID_PR_URL`), the code host refused to read it, or no issue is named outside a run on one (`ISSUE_REQUIRED`).',
          ),
          ...apiErrorResponses,
          404: issueNotFound,
          503: hostUnavailable,
        },
        ...cliRoute({
          command: 'pr link',
          args: ['url'],
          flags: {
            issueId: issueFlag,
            url: {
              description:
                'The pull request URL, such as https://github.com/owner/repo/pull/12.',
            },
          },
          action: 'studio.git/open-pr',
          examples: [
            'pr link https://github.com/acme/web/pull/12 --issue PM-12',
          ],
        }),
      }),
      apiValidator('json', LinkPullRequestInput),
      async (context) => {
        const caller = callerOf(context);
        const { issueId, url } = context.req.valid('json');
        const { pullRequest, created } = await git().link(
          await binding.callerViewerOf(caller),
          issueOf(context, issueId),
          url,
          linkerOf(caller),
        );
        return context.json(
          {
            data: pullRequest,
            meta: {
              message: `${created ? 'Linked' : 'Already linked'}: ${pullRequest.repo}#${pullRequest.number} (${pullRequest.state}).`,
            },
          },
          created ? 201 : 200,
        );
      },
    );
    routes.post(
      '/pullRequests/open',
      ...personOrRun,
      describeRoute({
        tags,
        summary: 'Open a pull request for an issue',
        operationId: 'gitOpenPullRequest',
        description: `For whoever may edit the issue; push the branch first. Opens the pull request on the code host and links it to the issue at once: on the repository of the issue’s project (its first linked one unless \`repo\` names another), from the run’s branch (the repository’s first branch rule, \`agent/PM-12\` by default) unless \`head\` names another, as the person who asked for the work (the caller, or whoever woke the agent) when they authorized the app, else as the repository’s connection. Once every linked pull request is merged, the issue moves on. ${ISSUE_DEFAULT}`,
        security: personOrRunSecurity,
        responses: {
          201: dataResponse(IssuePullRequestSchema, 'Opened and linked.'),
          400: apiErrorResponse(
            400,
            'The issue’s project links no repository (`NO_REPOSITORY`), a value is refused (`INVALID_PR_TITLE`, `INVALID_PR_BODY`), the code host refused the request, or no issue is named outside a run on one (`ISSUE_REQUIRED`).',
          ),
          ...apiErrorResponses,
          404: issueNotFound,
          503: hostUnavailable,
        },
        ...cliRoute({
          command: 'pr open',
          flags: {
            issueId: issueFlag,
            title: {
              description:
                'The title, following the repository’s commit convention, such as "fix(export): keep column order". Studio links the pull request to the issue, so the title needs no issue key.',
            },
            body: {
              contentFile: true,
              description:
                'The description, in Markdown. Write anything longer than a line to a file and pass it with --body-file.',
            },
            repo: {
              description:
                'The repository, as owner/name, when the project has several.',
            },
            head: {
              description:
                'The branch with the change; your run’s branch by default.',
            },
            base: {
              description:
                'The branch to merge into; the working directory’s default branch by default.',
            },
            draft: { description: 'Open it as a draft.' },
          },
          action: 'studio.git/open-pr',
          examples: [
            'pr open --title "fix(export): keep column order" --body-file pr.md',
            'pr open --issue PM-12 --title "fix(export): keep column order" --head fix/export --draft',
          ],
        }),
      }),
      apiValidator('json', OpenPullRequestInput),
      async (context) => {
        const caller = callerOf(context);
        const { issueId, ...input } = context.req.valid('json');
        const pullRequest = await git().open(
          await binding.callerViewerOf(caller),
          issueOf(context, issueId),
          input,
          linkerOf(caller),
          // The person who woke the agent, or the caller: Studio acts as them when they authorized the app.
          caller.userId,
        );
        return context.json(
          {
            data: pullRequest,
            meta: {
              message: `Opened ${pullRequest.repo}#${pullRequest.number} (${pullRequest.url}), linked to the issue.`,
            },
          },
          201,
        );
      },
    );
    // Changing a linked pull request on the host: for whoever may open one, as the person who asked for the work.
    routes.post(
      '/pullRequests/:pullRequestId/edit',
      ...personOrRun,
      describeRoute({
        tags,
        summary: 'Edit a pull request',
        operationId: 'gitEditPullRequest',
        description:
          'For whoever may edit the issue, as for opening a pull request. Changes what is given on the code host — the title, the description, the branch to merge into, draft or ready for review — as the person who asked for the work (the caller, or whoever woke the agent) when they authorized the app, else as the repository’s connection. The issue’s activity records what changed.',
        security: personOrRunSecurity,
        responses: {
          200: dataResponse(IssuePullRequestSchema),
          400: apiErrorResponse(
            400,
            'Nothing to change or a value is refused (`INVALID_PR_EDIT`, `INVALID_PR_TITLE`, `INVALID_PR_BODY`, `INVALID_PR_BASE`), or the code host refused the change.',
          ),
          ...apiErrorResponses,
          404: pullRequestNotFound,
          503: hostUnavailable,
        },
        ...cliRoute({
          command: 'pr edit',
          args: PR_POSITIONAL,
          flags: {
            ...PR_ARGS,
            title: {
              description:
                'The new title, such as "fix(export): keep the column order".',
            },
            body: {
              contentFile: true,
              description:
                'The new description, in Markdown; it replaces the old one. Write anything longer than a line to a file and pass it with --body-file.',
            },
            base: { description: 'The branch to merge into.' },
            draft: { description: 'Turn it into a draft.' },
            ready: { description: 'Mark it ready for review.' },
          },
          action: 'studio.git/open-pr',
          examples: [
            'pr edit PM-12 <pr> --title "fix(export): keep the column order"',
            'pr edit PM-12 <pr> --body-file pr.md --ready',
          ],
        }),
      }),
      apiValidator('param', PullRequestParams),
      apiValidator('query', PullRequestIssueQuery),
      apiValidator('json', EditPullRequestInput),
      async (context) => {
        const caller = callerOf(context);
        const { pullRequestId } = context.req.valid('param');
        const { issueId } = context.req.valid('query');
        const { ready, draft, ...input } = context.req.valid('json');
        if (ready === true && draft === true)
          throw studioError(
            'INVALID_ARGUMENT',
            'INVALID_PR_EDIT',
            'Give draft or ready, not both.',
          );
        const pullRequest = await git().edit(
          await binding.callerViewerOf(caller),
          issueId,
          pullRequestId,
          { ...input, draft: ready === true ? false : draft },
          caller.userId,
        );
        return context.json({
          data: pullRequest,
          meta: {
            message: `Edited ${pullRequest.repo}#${pullRequest.number} (${pullRequest.url}).`,
          },
        });
      },
    );
    routes.post(
      '/pullRequests/:pullRequestId/close',
      ...personOrRun,
      describeRoute({
        tags,
        summary: 'Close a pull request',
        operationId: 'gitClosePullRequest',
        description:
          'For whoever may edit the issue, as for opening a pull request. Comments the reason on the pull request and closes it on the code host, as the person who asked for the work when they authorized the app, else as the repository’s connection; the issue’s activity records it with the reason. A closed pull request no longer counts for moving the issue on once the others are merged. `unlink` also unlinks it from the issue.',
        security: personOrRunSecurity,
        responses: {
          200: dataResponse(IssuePullRequestSchema),
          400: apiErrorResponse(
            400,
            'No reason is given (`INVALID_CLOSE_REASON`), or the code host refused the change.',
          ),
          ...apiErrorResponses,
          404: pullRequestNotFound,
          409: apiErrorResponse(
            409,
            'The pull request is not open (`PR_NOT_OPEN`).',
          ),
          503: hostUnavailable,
        },
        ...cliRoute({
          command: 'pr close',
          args: PR_POSITIONAL,
          flags: {
            ...PR_ARGS,
            reason: {
              description:
                'Why it is closed, such as "Superseded by #15"; commented on the pull request and kept in the issue’s activity.',
            },
            unlink: { description: 'Also unlink it from the issue.' },
          },
          action: 'studio.git/open-pr',
          examples: [
            'pr close PM-12 <pr> --reason "Superseded by #15"',
            'pr close PM-12 <pr> --reason "No longer needed" --unlink',
          ],
        }),
      }),
      apiValidator('param', PullRequestParams),
      apiValidator('query', PullRequestIssueQuery),
      apiValidator('json', ClosePullRequestInput),
      async (context) => {
        const caller = callerOf(context);
        const { pullRequestId } = context.req.valid('param');
        const { issueId } = context.req.valid('query');
        const input = context.req.valid('json');
        const pullRequest = await git().close(
          await binding.callerViewerOf(caller),
          issueId,
          pullRequestId,
          input,
          caller.userId,
        );
        return context.json({
          data: pullRequest,
          meta: {
            message: `Closed ${pullRequest.repo}#${pullRequest.number}${input.unlink ? ' and unlinked it from the issue' : ''}.`,
          },
        });
      },
    );
    routes.post(
      '/pullRequests/:pullRequestId/reopen',
      ...personOrRun,
      describeRoute({
        tags,
        summary: 'Reopen a pull request',
        operationId: 'gitReopenPullRequest',
        description:
          'For whoever may edit the issue, as for opening a pull request. Reopens a closed (not merged) pull request on the code host, as the person who asked for the work when they authorized the app, else as the repository’s connection; the issue’s activity records it.',
        security: personOrRunSecurity,
        responses: {
          200: dataResponse(IssuePullRequestSchema),
          400: hostRefused,
          ...apiErrorResponses,
          404: pullRequestNotFound,
          409: apiErrorResponse(
            409,
            'The pull request is not closed (`PR_NOT_CLOSED`).',
          ),
          503: hostUnavailable,
        },
        ...cliRoute({
          command: 'pr reopen',
          args: PR_POSITIONAL,
          flags: PR_ARGS,
          action: 'studio.git/open-pr',
          examples: ['pr reopen PM-12 <pr>'],
        }),
      }),
      apiValidator('param', PullRequestParams),
      apiValidator('query', PullRequestIssueQuery),
      async (context) => {
        const caller = callerOf(context);
        const { pullRequestId } = context.req.valid('param');
        const { issueId } = context.req.valid('query');
        const pullRequest = await git().reopen(
          await binding.callerViewerOf(caller),
          issueId,
          pullRequestId,
          caller.userId,
        );
        return context.json({
          data: pullRequest,
          meta: {
            message: `Reopened ${pullRequest.repo}#${pullRequest.number} (${pullRequest.url}).`,
          },
        });
      },
    );
    routes.patch(
      '/pullRequests/:pullRequestId',
      person,
      describeRoute({
        tags,
        summary: 'Update an issue’s pull request link',
        operationId: 'gitUpdatePullRequest',
        ...cliRoute({
          command: 'pr update',
          args: PR_POSITIONAL,
          flags: PR_ARGS,
          action: 'pm.issues/edit',
        }),
        description:
          'For whoever may edit the issue. `autoCompleteDisabled` says whether the pull request counts for moving the issue on when merged.',
        responses: {
          200: dataResponse(IssuePullRequestSchema),
          ...apiErrorResponses,
          404: pullRequestNotFound,
        },
      }),
      apiValidator('param', PullRequestParams),
      apiValidator('query', PullRequestIssueQuery),
      apiValidator('json', UpdatePullRequestInput),
      async (context) => {
        const { pullRequestId } = context.req.valid('param');
        const { issueId } = context.req.valid('query');
        return context.json({
          data: await git().setAutoComplete(
            await viewer(context),
            issueId,
            pullRequestId,
            context.req.valid('json').autoCompleteDisabled,
          ),
        });
      },
    );
    routes.delete(
      '/pullRequests/:pullRequestId',
      person,
      describeRoute({
        tags,
        summary: 'Unlink a pull request from an issue',
        operationId: 'gitUnlinkPullRequest',
        ...cliRoute({
          command: 'pr unlink',
          args: PR_POSITIONAL,
          flags: PR_ARGS,
          confirm: 'Unlink this pull request from the issue?',
          action: 'pm.issues/edit',
        }),
        description: 'For whoever may edit the issue.',
        responses: {
          204: emptyResponse(),
          ...apiErrorResponses,
          404: pullRequestNotFound,
        },
      }),
      apiValidator('param', PullRequestParams),
      apiValidator('query', PullRequestIssueQuery),
      async (context) => {
        const { pullRequestId } = context.req.valid('param');
        const { issueId } = context.req.valid('query');
        await git().unlink(await viewer(context), issueId, pullRequestId);
        return context.body(null, 204);
      },
    );
    routes.delete(
      '/pullRequests/:pullRequestId/suggestion',
      person,
      describeRoute({
        tags,
        summary: 'Dismiss a suggested pull request',
        operationId: 'gitDismissPullRequestSuggestion',
        ...cliRoute({
          command: 'pr suggestion dismiss',
          args: PR_POSITIONAL,
          flags: PR_ARGS,
          confirm: 'Dismiss this suggested pull request?',
          action: 'pm.issues/edit',
        }),
        description: 'For whoever may edit the issue.',
        responses: {
          204: emptyResponse(),
          ...apiErrorResponses,
          404: apiErrorResponse(
            404,
            'The issue, or the suggestion, does not exist (`SUGGESTION_NOT_FOUND`).',
          ),
        },
      }),
      apiValidator('param', PullRequestParams),
      apiValidator('query', PullRequestIssueQuery),
      async (context) => {
        const { pullRequestId } = context.req.valid('param');
        const { issueId } = context.req.valid('query');
        await git().dismissSuggestion(
          await viewer(context),
          issueId,
          pullRequestId,
        );
        return context.body(null, 204);
      },
    );
    // Reads the pull request from the host and stores what it read, so a `POST`.
    routes.post(
      '/pullRequests/:pullRequestId/checkMerge',
      person,
      describeRoute({
        tags,
        summary: 'Check whether a pull request can be merged',
        operationId: 'gitCheckPullRequestMerge',
        ...cliRoute({
          command: 'pr check-merge',
          args: PR_POSITIONAL,
          flags: PR_ARGS,
          examples: ['pr check-merge PM-12 <pr>'],
        }),
        description:
          'For whoever may merge (the issue’s owner, or a manager of its project). Reads the pull request from the code host now and stores what it read; `headSha` is what `merge` expects back.',
        responses: {
          200: dataResponse(PullRequestMergePreflightSchema),
          400: hostRefused,
          ...apiErrorResponses,
          404: pullRequestNotFound,
          503: hostUnavailable,
        },
      }),
      apiValidator('param', PullRequestParams),
      apiValidator('query', PullRequestIssueQuery),
      async (context) => {
        const { pullRequestId } = context.req.valid('param');
        const { issueId } = context.req.valid('query');
        return context.json({
          data: await git().preflight(
            await viewer(context),
            issueId,
            pullRequestId,
          ),
        });
      },
    );
    routes.post(
      '/pullRequests/:pullRequestId/merge',
      person,
      describeRoute({
        tags,
        summary: 'Merge a pull request',
        operationId: 'gitMergePullRequest',
        ...cliRoute({
          command: 'pr merge',
          args: PR_POSITIONAL,
          flags: { ...PR_ARGS, expectedHeadSha: { name: 'expected-head' } },
          confirm: 'Squash-merge this pull request?',
          examples: [
            'pr merge PM-12 <pr> --expected-head <sha from pr check-merge>',
          ],
        }),
        description:
          'For whoever may merge (the issue’s owner, or a manager of its project). Squash-merges the head `expectedHeadSha` names, as the caller when they authorized the app, else as the repository’s connection.',
        responses: {
          200: dataResponse(IssuePullRequestSchema),
          400: apiErrorResponse(
            400,
            'It cannot be merged (`PR_NOT_MERGEABLE`, `metadata.blocker`), `expectedHeadSha` is not its head (`INVALID_EXPECTED_HEAD`), or the credential may not merge (`GITHUB_MERGE_FORBIDDEN`).',
          ),
          ...apiErrorResponses,
          404: pullRequestNotFound,
          409: apiErrorResponse(
            409,
            'The pull request has new commits since the check (`PR_CHANGED`).',
          ),
          503: hostUnavailable,
        },
      }),
      apiValidator('param', PullRequestParams),
      apiValidator('query', PullRequestIssueQuery),
      apiValidator('json', MergeInput),
      async (context) => {
        const { pullRequestId } = context.req.valid('param');
        const { issueId } = context.req.valid('query');
        return context.json({
          data: await git().merge(
            await viewer(context),
            issueId,
            pullRequestId,
            context.req.valid('json').expectedHeadSha,
          ),
        });
      },
    );
    routes.post(
      '/pullRequests/:pullRequestId/refresh',
      person,
      describeRoute({
        tags,
        summary: 'Read a pull request from the code host now',
        operationId: 'gitRefreshPullRequest',
        ...cliRoute({
          command: 'pr refresh',
          args: PR_POSITIONAL,
          flags: PR_ARGS,
          action: 'pm.issues/view',
        }),
        description: 'For whoever sees the issue.',
        responses: {
          200: dataResponse(IssuePullRequestSchema),
          400: hostRefused,
          ...signedIn,
          404: pullRequestNotFound,
          503: hostUnavailable,
        },
      }),
      apiValidator('param', PullRequestParams),
      apiValidator('query', PullRequestIssueQuery),
      async (context) => {
        const { pullRequestId } = context.req.valid('param');
        const { issueId } = context.req.valid('query');
        return context.json({
          data: await git().refresh(
            await viewer(context),
            issueId,
            pullRequestId,
          ),
        });
      },
    );
    routes.post(
      '/pullRequests/:pullRequestId/markMerged',
      person,
      describeRoute({
        tags,
        summary: 'Record a pull request as merged',
        operationId: 'gitMarkPullRequestMerged',
        ...cliRoute({
          command: 'pr mark-merged',
          args: PR_POSITIONAL,
          flags: PR_ARGS,
          confirm: 'Record this pull request as merged without the code host?',
        }),
        description:
          'For whoever may merge (the issue’s owner, or a manager of its project). Records it merged without the code host.',
        responses: {
          200: dataResponse(IssuePullRequestSchema),
          400: apiErrorResponse(
            400,
            'The pull request is merged already (`PR_NOT_OPEN`).',
          ),
          ...apiErrorResponses,
          404: pullRequestNotFound,
        },
      }),
      apiValidator('param', PullRequestParams),
      apiValidator('query', PullRequestIssueQuery),
      async (context) => {
        const { pullRequestId } = context.req.valid('param');
        const { issueId } = context.req.valid('query');
        return context.json({
          data: await git().markMerged(
            await viewer(context),
            issueId,
            pullRequestId,
          ),
        });
      },
    );

    routes.get(
      '/marks',
      person,
      describeRoute({
        tags,
        summary: 'Read the pull request marks of issues',
        operationId: 'gitListMarks',
        // The issue list's badges; `pr list` reads one issue's pull requests.
        ...cliRoute(false),
        description: `\`issueIds\` is a comma-separated list of at most ${MARKS_MAX} issue IDs; issues the caller may not see, or without pull requests, are left out.`,
        responses: {
          200: dataResponse(PullRequestMarksSchema),
          ...signedIn,
        },
      }),
      apiValidator('query', MarksQuery),
      async (context) =>
        context.json({
          data: await git().marks(
            await viewer(context),
            context.req.valid('query').issueIds,
          ),
        }),
    );

    routes.get(
      '/resources/:resourceId',
      person,
      describeRoute({
        tags,
        summary: 'Read a working directory’s repository settings',
        operationId: 'gitGetRepositorySettings',
        ...cliRoute({
          command: 'git resource get',
          flags: { resourceId: { name: 'resource' } },
        }),
        description:
          'For whoever sees the project. The webhook secret is never sent back.',
        responses: {
          200: dataResponse(GitRepoSettingsSchema),
          ...apiErrorResponses,
          404: apiErrorResponse(
            404,
            'The working directory does not exist or the caller may not see it (`WORKING_DIRECTORY_NOT_FOUND`).',
          ),
        },
      }),
      apiValidator('param', ResourceParams),
      async (context) =>
        context.json({
          data: await git().repoSettings(
            await viewer(context),
            context.req.valid('param').resourceId,
          ),
        }),
    );
    routes.patch(
      '/resources/:resourceId',
      person,
      describeRoute({
        tags,
        summary: 'Update a working directory’s repository settings',
        operationId: 'gitUpdateRepositorySettings',
        ...cliRoute({
          command: 'git resource update',
          flags: { resourceId: { name: 'resource' } },
        }),
        description:
          'For the project’s managers. `webhookSecret: null` removes the secret; left out keeps it.',
        responses: {
          200: dataResponse(GitRepoSettingsSchema),
          400: apiErrorResponse(
            400,
            'The working directory links no repository of a connection (`NOT_LINKED`), or a value is refused (`INVALID_WEBHOOK_SECRET`, `INVALID_BRANCH_RULE`).',
          ),
          ...apiErrorResponses,
          404: apiErrorResponse(
            404,
            'The working directory does not exist or the caller may not see it (`WORKING_DIRECTORY_NOT_FOUND`).',
          ),
        },
      }),
      apiValidator('param', ResourceParams),
      apiValidator('json', UpdateRepositoryInput),
      async (context) =>
        context.json({
          data: await git().updateRepoSettings(
            await viewer(context),
            context.req.valid('param').resourceId,
            context.req.valid('json'),
          ),
        }),
    );

    const router = new Hono();
    router.route('/git', routes);
    return router;
  },
);

/** The reason code of a refusal, for the page the browser lands on. */
function reasonOf(error: unknown, fallback: string): string {
  const reason = (error as { readonly details?: { readonly code?: unknown } })
    .details?.code;
  return encodeURIComponent(typeof reason === 'string' ? reason : fallback);
}

/** Where the host's redirects write what went wrong: the server log, as these routes have no request log of their own. */
export interface GitOAuthLogger {
  info(fields: Record<string, unknown>, message: string): void;
  warn(fields: Record<string, unknown>, message: string): void;
}

/**
 * What a failed redirect is logged with: the reason the page shows, what the host answered, and the cause of a defect.
 * Never the request's code or state, nor an error object whole: an Octokit error carries the request it sent.
 */
function failureFields(
  error: unknown,
  fallback: string,
): Record<string, unknown> {
  const details =
    (error as { readonly details?: Readonly<Record<string, unknown>> })
      .details ?? {};
  const cause = error instanceof Error ? (error.cause ?? error) : error;
  return {
    reason: typeof details.code === 'string' ? details.code : fallback,
    ...(typeof details.hostError === 'string'
      ? { hostError: details.hostError }
      : {}),
    ...(typeof details.status === 'number'
      ? { hostStatus: details.status }
      : {}),
    error:
      cause instanceof Error
        ? `${cause.name}: ${cause.message}`
        : String(cause),
  };
}

/**
 * Where the host sends the browser back, as root routes: a `GET` that completes something, which an `/api` `GET` may
 * not do. `/oauth/git/callback`: a person authorized the app, back to their settings (`connected=1`, or `error=<code>`
 * and the host's `hostError` when it gave one). `/oauth/git/manifest`: an app was created from Studio's manifest,
 * stored, then on to installing it. `/oauth/git/setup`: the app was installed, recorded, back to Settings › Git
 * (`installed=1`). Every failure is logged.
 */
export const gitOAuthRoutes: AppRootRouteContribution<Application> =
  defineRootRoutes(({ container }) => {
    if (!container.has(authenticationToken) || !container.has(studioGitToken))
      return new Hono();
    return createGitOAuthRouter({
      required: container.resolve(authenticationToken).required(),
      binding: container.resolve(studioGitToken),
      logger: container.has(loggingToken)
        ? container
            .resolve(loggingToken)
            .getLogger('app')
            .child({ module: 'studio-git' })
        : null,
    });
  });

/** The host's redirects, given the session check, Studio's git and where failures are logged. */
export function createGitOAuthRouter(deps: {
  readonly required: MiddlewareHandler;
  readonly binding: StudioGitBinding;
  readonly logger: GitOAuthLogger | null;
}): Hono {
  const { binding, logger } = deps;
  const back = binding.appPath('/account/git');
  const settings = binding.appPath('/config/git');
  const router = new Hono();
  const fail = (
    context: Context,
    error: unknown,
    fallback: string,
    message: string,
  ): void => {
    // A failure before the session check passed has no person to name.
    const userId = (
      context.get('auth' as never) as { user?: { id?: string } } | undefined
    )?.user?.id;
    logger?.warn(
      {
        path: context.req.path,
        ...(userId === undefined ? {} : { userId: String(userId) }),
        ...failureFields(error, fallback),
      },
      message,
    );
  };
  // Nothing here answers JSON: the person is in their browser, sent back to their settings either way.
  router.onError((error, context) => {
    if (context.req.path.endsWith('/oauth/git/callback')) {
      fail(
        context,
        error,
        'GIT_AUTHORIZATION_FAILED',
        'Personal git authorization failed',
      );
      return context.redirect(`${back}?error=GIT_AUTHORIZATION_FAILED`);
    }
    fail(
      context,
      error,
      'GIT_APP_MANIFEST_FAILED',
      'Git app setup from the host failed',
    );
    return context.redirect(`${settings}?error=GIT_APP_MANIFEST_FAILED`);
  });
  /**
   * The session check, for a browser: it answers a missing or refused session itself (401 JSON) without throwing, so
   * neither `onError` nor a route's `catch` would see it. That answer becomes a log line and a redirect to sign-in,
   * which then opens `page` (an application path) with `GIT_SESSION_EXPIRED`: a signed-out person reaching `page`
   * directly would be sent to sign-in and on to home, losing the reason.
   */
  const signedIn =
    (page: string, message: string): MiddlewareHandler =>
    async (context, next) => {
      let passed = false;
      const answer = await deps.required(context, async () => {
        passed = true;
        await next();
      });
      if (passed) return answer;
      const status = answer instanceof Response ? answer.status : null;
      logger?.warn(
        {
          path: context.req.path,
          reason: 'GIT_SESSION_EXPIRED',
          ...(status === null ? {} : { status }),
        },
        message,
      );
      return context.redirect(
        `${binding.appPath('/login')}?redirect=${encodeURIComponent(
          `${page}?error=GIT_SESSION_EXPIRED`,
        )}`,
      );
    };
  /** Whoever completes an app's creation or installation manages the connections. */
  const manager: MiddlewareHandler = async (context, next) => {
    if (!(await binding.gitSettings(userIdOf(context))).manage)
      return context.redirect(`${settings}?error=FORBIDDEN`);
    await next();
  };
  router.get(
    '/oauth/git/manifest',
    signedIn('/config/git', 'Git app creation failed: no session'),
    manager,
    query(AppManifestCallbackQuery),
    async (context) => {
      const { code, state } = context.req.valid('query');
      try {
        const created = await binding
          .connections()
          .completeAppManifest(userIdOf(context), { code, state });
        return context.redirect(created.installUrl);
      } catch (error) {
        fail(
          context,
          error,
          'GIT_APP_MANIFEST_FAILED',
          'Git app creation failed on its way back from the host',
        );
        return context.redirect(
          `${settings}?error=${reasonOf(error, 'GIT_APP_MANIFEST_FAILED')}`,
        );
      }
    },
  );
  router.get(
    '/oauth/git/setup',
    signedIn('/config/git', 'Git app installation failed: no session'),
    manager,
    query(AppSetupQuery),
    async (context) => {
      const { installation_id: installationId, state } =
        context.req.valid('query');
      try {
        await binding
          .connections()
          .completeInstallation(userIdOf(context), { installationId, state });
        return context.redirect(`${settings}?installed=1`);
      } catch (error) {
        fail(
          context,
          error,
          'GIT_INSTALLATION_NOT_FOUND',
          'Git app installation failed on its way back from the host',
        );
        return context.redirect(
          `${settings}?error=${reasonOf(error, 'GIT_INSTALLATION_NOT_FOUND')}`,
        );
      }
    },
  );
  router.get(
    '/oauth/git/callback',
    signedIn('/account/git', 'Personal git authorization failed: no session'),
    query(OAuthCallbackQuery),
    async (context) => {
      const { code, state, error: hostError } = context.req.valid('query');
      try {
        await binding.connections().completeAuthorization(userIdOf(context), {
          code,
          state,
          error: hostError,
          redirectUri: callbackOf(binding, context),
        });
        logger?.info(
          { path: context.req.path, userId: userIdOf(context) },
          'Personal git authorization completed',
        );
        return context.redirect(`${back}?connected=1`);
      } catch (error) {
        fail(
          context,
          error,
          'GIT_AUTHORIZATION_FAILED',
          'Personal git authorization failed',
        );
        const refusal = (
          error as { readonly details?: { readonly hostError?: unknown } }
        ).details?.hostError;
        return context.redirect(
          `${back}?error=${reasonOf(error, 'GIT_AUTHORIZATION_FAILED')}${
            typeof refusal === 'string'
              ? `&hostError=${encodeURIComponent(refusal)}`
              : ''
          }`,
        );
      }
    },
  );
  return router;
}

const WEBHOOK_DESCRIPTION =
  'Called by GitHub, not by a person: no session or API key. The credential is the signature: `X-Hub-Signature-256` must be the HMAC-SHA256 of the raw body with the endpoint’s webhook secret, `X-GitHub-Delivery` names the delivery (a delivery taken already is acknowledged and not acted on again), and `X-GitHub-Event` the event.';

const webhookRequestBody = {
  description: 'The event payload exactly as GitHub sent it.',
  required: true,
  content: {
    'application/json': {
      schema: { type: 'object' as const, additionalProperties: true },
    },
  },
};

const webhookResponses = {
  200: dataResponse(WebhookResultSchema),
  400: apiErrorResponse(
    400,
    'The `X-GitHub-Delivery` header is missing (`MISSING_DELIVERY`).',
  ),
  401: apiErrorResponse(
    401,
    'The signature is missing or not valid, or no secret is set (`INVALID_SIGNATURE`).',
  ),
  404: apiErrorResponse(404, 'No such webhook endpoint (`WEBHOOK_NOT_FOUND`).'),
  500: apiErrorResponse(500),
};

/** The webhook endpoints' answer to each outcome of a delivery. */
export function createWebhookRouter(receive: {
  readonly repository: (request: WebhookRequest) => Promise<WebhookResult>;
  readonly connection: (request: WebhookRequest) => Promise<WebhookResult>;
}): Hono {
  const routes = new Hono();
  routes.onError(studioErrorHandler);
  async function answer(
    context: Context,
    take: (request: WebhookRequest) => Promise<WebhookResult>,
    target: string,
  ) {
    // The raw bytes, before any parsing: the signature covers exactly what the host sent.
    const result = await take({
      target,
      headers: (name) => context.req.header(name) ?? null,
      body: new Uint8Array(await context.req.arrayBuffer()),
    });
    switch (result.status) {
      case 'notFound':
        throw studioError('NOT_FOUND', 'WEBHOOK_NOT_FOUND', 'No such webhook.');
      case 'invalidSignature':
        throw studioError(
          'UNAUTHENTICATED',
          'INVALID_SIGNATURE',
          'The webhook signature is not valid.',
        );
      case 'missingDelivery':
        throw studioError(
          'INVALID_ARGUMENT',
          'MISSING_DELIVERY',
          'X-GitHub-Delivery is required.',
        );
      case 'duplicate':
        return context.json({ data: { duplicate: true } });
      default:
        return context.json({
          data: {
            ok: true,
            event: result.event,
            ignored: result.status === 'ignored',
            reason: result.reason,
          },
        });
    }
  }
  routes.post(
    '/connections/:connectionId',
    describeRoute({
      tags,
      summary: 'Receive a GitHub App webhook delivery',
      operationId: 'webhooksReceiveGithubConnectionEvent',
      // Called by GitHub, signed; not for people.
      ...cliRoute(false),
      description: `${WEBHOOK_DESCRIPTION} Verified with the connection’s webhook secret: the endpoint of a GitHub App, for every repository of every installation of the app.`,
      security: [],
      requestBody: webhookRequestBody,
      responses: webhookResponses,
    }),
    apiValidator('param', ConnectionParams),
    (context) =>
      answer(
        context,
        receive.connection,
        context.req.valid('param').connectionId,
      ),
  );
  routes.post(
    '/repositories/:repositoryId',
    describeRoute({
      tags,
      summary: 'Receive a repository webhook delivery',
      operationId: 'webhooksReceiveGithubRepositoryEvent',
      // Called by GitHub, signed; not for people.
      ...cliRoute(false),
      description: `${WEBHOOK_DESCRIPTION} Verified with the repository’s own webhook secret, set in its settings.`,
      security: [],
      requestBody: webhookRequestBody,
      responses: webhookResponses,
    }),
    apiValidator('param', RepositoryWebhookParams),
    (context) =>
      answer(
        context,
        receive.repository,
        context.req.valid('param').repositoryId,
      ),
  );
  const router = new Hono();
  router.route('/webhooks/github', routes);
  return router;
}

export const gitWebhookRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes(({ container }) => {
    if (!container.has(studioGitToken)) return new Hono();
    const { git } = container.resolve(studioGitToken);
    return createWebhookRouter({
      repository: (request) => git().receiveWebhook.repository(request),
      connection: (request) => git().receiveWebhook.connection(request),
    });
  });

/**
 * What a run's checkouts get from Studio's git (`RepoAccessProvider` of the agents plugin): who its commits name, and a
 * short-lived credential to push with.
 *
 * - **Author**: the person who asked for the work (the run's actor): the account of their own authorization on the
 *   repository's host (its login's name and the address it commits with), else their Studio profile's name and email.
 * - **Attribution**: with `withAgent`, every commit also carries `Co-authored-by: <agent name> <agent+<id>@studio.noreply>`;
 *   with `meOnly`, the person alone. The person's own preference (`git.attribution`, Account settings › Preferences)
 *   wins, else their project's default (`studioGitProjectSettings`, the project's Settings tab), else `withAgent`.
 * - **Push credential**: for each repository reached through an app connection, an installation token limited to the
 *   run's repositories of that connection and `contents: write`, reused from the sealed connection cache only while it
 *   has at least 30 minutes left. A runner that asks for credentials on demand (the `gitCredentials` feature) is given
 *   none at the claim: those repositories are listed in `onDemand`, and `issue` mints (or reuses) the token whenever
 *   git needs one, so a run outlasting one token still pushes; a forced refresh always mints a new one. An older
 *   runner gets one token at the claim, prepared before the claim's transaction (`prepare`), where a signing failure
 *   prevents the claim. A token connection gives none: the runner pushes with the host's own credentials.
 * - The token reaches every branch of the run's repositories that the host's branch protection leaves writable;
 *   nothing on the runner limits which branch a run pushes.
 */
import type { Projects } from '@nocobase/app-plugin-projects/server/tokens';
import type { DatabaseConnection } from '@nocobase/db';

import type { RepoCredential, RepoDir, RunGit } from '@nocobase/agent-protocol';
import {
  RepoAccessError,
  type RepoAccessProvider,
  type RepoCredentialGrant,
  type RepoCredentialRequest,
} from '@nocobase/app-plugin-agents/server/tokens';
import type { Run } from '@nocobase/app-plugin-agents/shared/runs';

import type { ProjectResourceBinding } from '@nocobase/app-plugin-projects/shared/projects';

import {
  agentCoAuthor,
  ATTRIBUTION_PREFERENCE,
  branchOf,
  COMMIT_ATTRIBUTIONS,
  DEFAULT_ATTRIBUTION,
  DEFAULT_BRANCH_RULE,
  type CommitAttribution,
} from '../../shared/git.js';
import { ISSUE_SUBJECT } from '../agents/catalog/triggers.js';
import {
  findConnection,
  USER_AUTHS,
  type GitConnections,
} from './connections.js';
import type { StudioGit } from './service.js';
import { GitApiError } from './platform.js';
import { bindingOfRow, findRepo, pullRequestsOfIssue } from './store.js';

export const PROJECT_SETTINGS = 'studioGitProjectSettings';

const isAttribution = (value: unknown): value is CommitAttribution =>
  (COMMIT_ATTRIBUTIONS as readonly unknown[]).includes(value);

/** A project's default attribution; `withAgent` when it set none. */
export async function projectAttribution(
  conn: DatabaseConnection,
  projectId: string,
): Promise<CommitAttribution> {
  const row = await conn.query
    .selectFrom(PROJECT_SETTINGS)
    .select('attribution')
    .where('projectId', '=', projectId)
    .executeTakeFirst();
  return isAttribution(row?.attribution)
    ? row.attribution
    : DEFAULT_ATTRIBUTION;
}

export async function setProjectAttribution(
  conn: DatabaseConnection,
  projectId: string,
  attribution: CommitAttribution,
  userId: string,
): Promise<void> {
  const values = { attribution, updatedById: userId, updatedAt: new Date() };
  const exists = await conn.query
    .selectFrom(PROJECT_SETTINGS)
    .select('projectId')
    .where('projectId', '=', projectId)
    .executeTakeFirst();
  if (exists)
    await conn.query
      .updateTable(PROJECT_SETTINGS)
      .set(values)
      .where('projectId', '=', projectId)
      .execute();
  else
    await conn.query
      .insertInto(PROJECT_SETTINGS)
      .values({ projectId, ...values })
      .execute();
}

/** A person's preference by key (the users plugin's preferences); undefined when they set none. */
export type PreferenceOf = (userId: string, key: string) => Promise<unknown>;

/** The person's own choice, a user preference; null when they made none. */
async function personalAttribution(
  preferenceOf: PreferenceOf | undefined,
  userId: string,
): Promise<CommitAttribution | null> {
  const value = await preferenceOf?.(userId, ATTRIBUTION_PREFERENCE);
  return isAttribution(value) ? value : null;
}

/** Who the person is in commits: their authorization's account on a host, else their profile. */
export async function commitIdentity(
  conn: DatabaseConnection,
  userId: string,
  apiBaseUrls: readonly string[],
): Promise<{ name: string; email: string }> {
  const auths = await conn.query
    .selectFrom(USER_AUTHS)
    .select(['connectionId', 'login', 'name', 'email'])
    .where('userId', '=', userId)
    .orderBy('createdAt', 'asc')
    .execute();
  for (const auth of auths) {
    const connection = await findConnection(conn, String(auth.connectionId));
    if (connection && apiBaseUrls.includes(connection.apiBaseUrl))
      return {
        name:
          (typeof auth.name === 'string' && auth.name) ||
          (typeof auth.login === 'string' ? auth.login : userId),
        email: typeof auth.email === 'string' ? auth.email : '',
      };
  }
  const user = await conn.query
    .selectFrom('user')
    .select(['name', 'username', 'email'])
    .where('id', '=', userId)
    .executeTakeFirst();
  const name =
    (typeof user?.name === 'string' && user.name) ||
    (typeof user?.username === 'string' && user.username) ||
    userId;
  const email =
    typeof user?.email === 'string' && user.email
      ? user.email
      : `user+${userId}@studio.noreply`;
  return { name, email };
}

/**
 * Per-directory branch selection: earliest linked eligible PR, ties by ascending PR number, otherwise the first
 * branch rule. Database reads only, for the claim's transaction; never fetch from the host here.
 */
export type RunBranch = Pick<
  RepoDir,
  'branch' | 'pullRequest' | 'excludedPullRequests'
> & { readonly base?: string };

export async function runBranches(
  conn: DatabaseConnection,
  repos: readonly {
    readonly id: string;
    readonly binding: ProjectResourceBinding | null;
    readonly defaultRef?: string | null;
  }[],
  key: string,
  issueId?: string,
): Promise<Map<string, RunBranch>> {
  const branches = new Map<string, RunBranch>();
  const linked = issueId ? await pullRequestsOfIssue(conn, issueId) : [];
  linked.sort(
    (a, b) =>
      a.link.createdAt.localeCompare(b.link.createdAt) ||
      a.pr.number - b.pr.number,
  );
  for (const repo of repos) {
    const connection = repo.binding
      ? await findConnection(conn, repo.binding.connectionId)
      : null;
    const row =
      connection && repo.binding
        ? await findRepo(conn, connection.apiBaseUrl, repo.binding.fullName)
        : null;
    const open = linked.filter(
      ({ pr }) => pr.repoId === row?.id && pr.state === 'open',
    );
    const excludedPullRequests = open.flatMap(({ pr }) =>
      !pr.headRepo || pr.headRepo.toLowerCase() !== row?.repo.toLowerCase()
        ? [
            {
              number: pr.number,
              url: pr.url,
              reason: pr.headRepo ? ('fork' as const) : ('unknown' as const),
            },
          ]
        : [],
    );
    const chosen = open.find(
      ({ pr }) =>
        pr.headRepo?.toLowerCase() === row?.repo.toLowerCase() &&
        pr.headRef &&
        pr.baseRef &&
        pr.headRef !== pr.baseRef &&
        pr.headRef !== (repo.defaultRef ?? 'main'),
    )?.pr;
    branches.set(repo.id, {
      branch:
        chosen?.headRef ??
        branchOf(row?.branchRules[0] ?? DEFAULT_BRANCH_RULE, key),
      ...(chosen
        ? {
            base: chosen.baseRef,
            pullRequest: { number: chosen.number, url: chosen.url },
          }
        : {}),
      ...(excludedPullRequests.length ? { excludedPullRequests } : {}),
    });
  }
  return branches;
}

/** The repositories of a run's project reached through one app connection. */
interface ConnectionRepos {
  readonly connectionId: string;
  /** By working directory URL, with the repository's `owner/name`. */
  readonly repos: readonly { readonly url: string; readonly repo: string }[];
}

/** The repositories of an issue run's project, by connection, and the hosts they are on. */
interface RunRepos {
  readonly projectId: string | null;
  /** App connections only: those that issue push credentials. */
  readonly apps: readonly ConnectionRepos[];
  readonly apiBaseUrls: readonly string[];
}

/** What `prepare` hands to `forRun`. */
interface PreparedAccess {
  readonly author: { readonly name: string; readonly email: string };
  readonly attribution: CommitAttribution;
  /** Minted at the claim, by repository URL: only for a runner that does not ask on demand. */
  readonly credentials: readonly RepoCredential[];
  /** The URLs `issue` gives credentials for, when the runner asks on demand. */
  readonly onDemand: readonly string[];
}

type Prepared = PreparedAccess | { readonly failure: string };

/** A failure of signing, in words safe to show the run's people and its agent. */
function signingReason(error: unknown): string {
  if (!(error instanceof GitApiError))
    return 'The Git connection could not issue a credential.';
  if (error.rateLimited)
    return `GitHub rate limited signing${error.retryAt ? ` until ${error.retryAt}` : ''}.`;
  if (error.status === 0)
    return 'GitHub could not be reached or the request timed out.';
  return `GitHub refused signing (HTTP ${error.status}).`;
}

/** Whether asking again later may work: GitHub down, slow or rate limiting, not a refusal. */
function isTransient(error: unknown): boolean {
  return (
    error instanceof GitApiError &&
    (error.rateLimited || error.status === 0 || error.status >= 500)
  );
}

export function runGitProvider(deps: {
  readonly projects: () => Pick<Projects, 'tx'>;
  readonly git: () => Pick<StudioGit, 'repoOfResource'>;
  readonly connections: GitConnections;
  readonly preferenceOf?: PreferenceOf;
  readonly onError: (message: string, error: unknown) => void;
}): RepoAccessProvider {
  const conn = () => deps.projects().tx.read();

  /** Null when the run is not on an issue. */
  async function runRepos(
    connection: DatabaseConnection,
    run: Run,
  ): Promise<RunRepos | null> {
    if (run.subject.kind !== ISSUE_SUBJECT) return null;
    const issue = await connection.query
      .selectFrom('pmIssues')
      .select('projectId')
      .where('id', '=', run.subject.id)
      .executeTakeFirst();
    const projectId =
      typeof issue?.projectId === 'string' ? issue.projectId : null;
    const resources = projectId
      ? await connection.query
          .selectFrom('pmProjectResources')
          .select([
            'url',
            'bindingProvider',
            'bindingConnectionId',
            'bindingRepoId',
            'bindingFullName',
          ])
          .where('projectId', '=', projectId)
          .where('type', '=', 'gitRepo')
          .execute()
      : [];
    const byConnection = new Map<string, { url: string; repo: string }[]>();
    const apiBaseUrls: string[] = [];
    for (const resource of resources) {
      const binding = bindingOfRow(resource);
      if (!binding || typeof resource.url !== 'string') continue;
      const repo = await deps.git().repoOfResource(connection, { binding });
      if (!repo?.connectionId) continue;
      apiBaseUrls.push(repo.apiBaseUrl);
      const list = byConnection.get(repo.connectionId) ?? [];
      list.push({ url: resource.url, repo: repo.repo });
      byConnection.set(repo.connectionId, list);
    }
    const apps: ConnectionRepos[] = [];
    for (const [connectionId, repos] of byConnection) {
      const row = await findConnection(connection, connectionId);
      if (row?.kind === 'app') apps.push({ connectionId, repos });
    }
    return { projectId, apps, apiBaseUrls };
  }

  async function prepare(
    run: Run,
    options: { readonly onDemand: boolean },
  ): Promise<Prepared | null> {
    const connection = conn();
    const found = await runRepos(connection, run);
    if (!found) return null;
    const credentials: RepoCredential[] = [];
    // A runner that asks on demand is given nothing now: `issue` mints when git needs a credential.
    if (!options.onDemand)
      for (const { connectionId, repos } of found.apps) {
        try {
          const credential = await deps.connections.pushCredential(
            connectionId,
            repos.map((item) => item.repo),
          );
          if (credential)
            for (const item of repos)
              credentials.push({ url: item.url, ...credential });
        } catch (error) {
          deps.onError(
            'Studio could not mint a push credential for a run.',
            error,
          );
          // prepareExtensions tolerates thrown prepare errors. Carry the safe failure into forRun instead.
          return {
            failure: `Studio could not prepare push access for connection ${connectionId}. ${signingReason(error)} Check Settings > Git and retry the run after the connection or GitHub recovers.`,
          };
        }
      }
    const attribution =
      (await personalAttribution(deps.preferenceOf, run.actorUserId)) ??
      (found.projectId
        ? await projectAttribution(connection, found.projectId)
        : DEFAULT_ATTRIBUTION);
    return {
      author: await commitIdentity(
        connection,
        run.actorUserId,
        found.apiBaseUrls,
      ),
      attribution,
      credentials,
      onDemand: options.onDemand
        ? found.apps.flatMap(({ repos }) => repos.map((item) => item.url))
        : [],
    };
  }

  /**
   * The run's repositories of the connection that reaches `request.url`, read again now: a repository unlinked or a
   * connection changed since the claim gets nothing. The framework has checked that the asking runner still holds this
   * attempt of the run under a live lease, and that the claim listed the URL.
   */
  async function issue(
    request: RepoCredentialRequest,
  ): Promise<RepoCredentialGrant | null> {
    let target: ConnectionRepos | undefined;
    try {
      const found = await runRepos(conn(), request.run);
      target = found?.apps.find(({ repos }) =>
        repos.some((item) => item.url === request.url),
      );
    } catch (error) {
      deps.onError(
        'Studio could not read the repositories of a run for a push credential.',
        error,
      );
      throw new RepoAccessError(
        'unavailable',
        'Studio could not read the run’s repositories. Try again later.',
      );
    }
    if (!target) return null;
    try {
      const credential = await deps.connections.pushCredential(
        target.connectionId,
        target.repos.map((item) => item.repo),
        { refresh: request.refresh },
      );
      return credential;
    } catch (error) {
      deps.onError('Studio could not mint a push credential for a run.', error);
      const reason = signingReason(error);
      throw isTransient(error)
        ? new RepoAccessError(
            'unavailable',
            `${reason} Try again once GitHub recovers.`,
          )
        : new RepoAccessError(
            'denied',
            `${reason} Check the connection in Settings > Git.`,
          );
    }
  }

  return {
    key: 'studio.git',
    prepare,
    issue,
    forRun(_conn, context, prepared): Promise<RunGit | null> {
      const given = prepared as Prepared | null | undefined;
      if (
        given === undefined &&
        context.claim.run.subject.kind === ISSUE_SUBJECT
      )
        throw new Error(
          'Studio could not prepare repository access. Check the server claim failure log and retry the run.',
        );
      if (!given) return Promise.resolve(null);
      if ('failure' in given) throw new Error(given.failure);
      const urls = new Set(context.repos.map((repo) => repo.url));
      const credentials = given.credentials.filter((item) =>
        urls.has(item.url),
      );
      const onDemand = context.onDemand
        ? given.onDemand.filter((url) => urls.has(url))
        : [];
      return Promise.resolve({
        author: given.author,
        ...(given.attribution === 'withAgent'
          ? { trailers: [agentCoAuthor(context.claim.agent)] }
          : {}),
        ...(credentials.length > 0 ? { credentials } : {}),
        ...(onDemand.length > 0 ? { onDemand } : {}),
      });
    },
  };
}

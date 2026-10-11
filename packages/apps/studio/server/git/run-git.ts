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
 *   run's repositories of that connection and `contents: write`, prepared before the claim's transaction (`prepare`),
 *   reused from the sealed connection cache only with sufficient validity and handed to the runner's credential helper.
 *   Signing failure prevents the claim; a token connection gives none: the runner
 *   pushes with the host's own credentials. The runner's push guard still allows only the run's branch.
 */
import type { Projects } from '@nocobase/app-plugin-projects/server/tokens';
import type { DatabaseConnection } from '@nocobase/db';

import type { RepoCredential, RunGit } from '@nocobase/agent-protocol';
import type { RepoAccessProvider } from '@nocobase/app-plugin-agents/server/tokens';
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
import { bindingOfRow, findRepo } from './store.js';

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
 * The branch a run on issue `key` works on in each linked repository, by working directory id: the repository's first
 * branch rule (`agent/{key}` until someone changes it). Database reads only, for the claim's transaction.
 */
export async function runBranches(
  conn: DatabaseConnection,
  repos: readonly {
    readonly id: string;
    readonly binding: ProjectResourceBinding | null;
  }[],
  key: string,
): Promise<Map<string, string>> {
  const branches = new Map<string, string>();
  for (const repo of repos) {
    const connection = repo.binding
      ? await findConnection(conn, repo.binding.connectionId)
      : null;
    const row =
      connection && repo.binding
        ? await findRepo(conn, connection.apiBaseUrl, repo.binding.fullName)
        : null;
    branches.set(
      repo.id,
      branchOf(row?.branchRules[0] ?? DEFAULT_BRANCH_RULE, key),
    );
  }
  return branches;
}

/** What `prepare` hands to `forRun`. */
interface PreparedAccess {
  readonly author: { readonly name: string; readonly email: string };
  readonly attribution: CommitAttribution;
  /** By repository URL. */
  readonly credentials: readonly RepoCredential[];
}

type Prepared = PreparedAccess | { readonly failure: string };

export function runGitProvider(deps: {
  readonly projects: () => Pick<Projects, 'tx'>;
  readonly git: () => Pick<StudioGit, 'repoOfResource'>;
  readonly connections: GitConnections;
  readonly preferenceOf?: PreferenceOf;
  readonly onError: (message: string, error: unknown) => void;
}): RepoAccessProvider {
  const conn = () => deps.projects().tx.read();

  async function prepare(run: Run): Promise<Prepared | null> {
    if (run.subject.kind !== ISSUE_SUBJECT) return null;
    const connection = conn();
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
    // The repositories each app connection reaches for this run, by URL.
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
    const credentials: RepoCredential[] = [];
    for (const [connectionId, repos] of byConnection) {
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
        const reason =
          error instanceof GitApiError
            ? error.rateLimited
              ? `GitHub rate limited signing${error.retryAt ? ` until ${error.retryAt}` : ''}.`
              : error.status === 0
                ? 'GitHub could not be reached or the request timed out.'
                : `GitHub refused signing (HTTP ${error.status}).`
            : 'The Git connection could not issue a credential.';
        // prepareExtensions tolerates thrown prepare errors. Carry the safe failure into forRun instead.
        return {
          failure: `Studio could not prepare push access for connection ${connectionId}. ${reason} Check Settings > Git and retry the run after the connection or GitHub recovers.`,
        };
      }
    }
    const attribution =
      (await personalAttribution(deps.preferenceOf, run.actorUserId)) ??
      (projectId
        ? await projectAttribution(connection, projectId)
        : DEFAULT_ATTRIBUTION);
    return {
      author: await commitIdentity(connection, run.actorUserId, apiBaseUrls),
      attribution,
      credentials,
    };
  }

  return {
    key: 'studio.git',
    prepare,
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
      return Promise.resolve({
        author: given.author,
        ...(given.attribution === 'withAgent'
          ? { trailers: [agentCoAuthor(context.claim.agent)] }
          : {}),
        ...(credentials.length > 0 ? { credentials } : {}),
      });
    },
  };
}

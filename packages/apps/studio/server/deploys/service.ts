/**
 * Deployment marks: which issues a version that reached an App of a repository contains, as marks on the issues named
 * after the App's environment ("Staging ✓ a1b2c3d", "Production ✓ 1.4.0"), with the issues finished but not yet
 * released listed per project and their release owner reminded. An App is recorded for its repository by the
 * deployments CI makes to it (`../builds`), in the role its environment gives it (`roleOfEnvironment`): `production` for
 * a release target (a protected environment, or one named `production`), whose marks the "done, not released"
 * reminder waits for, and `staging` for any other. A pull request's preview App is never recorded. Statuses never
 * follow deployments: an issue stays Done; the marks say where its change runs.
 *
 * - `deployment.succeeded` or `deployment.rolledBack` of an App recorded for a repository: the deployed commit is the
 *   release's `sha` label (Studio's own builds set it; a CI upload passes `--label sha=<commit>`).
 *   Every issue marked on the App, and every finished issue of the project, is checked again against that commit by
 *   Studio itself, with the code host's compare API through the repository's connection (`StudioGit.commitsContained`,
 *   one call per commit, at most `MAX_SHAS`), looking for any commit that may carry its change: the newest head an
 *   agent pushed (`agRunRepos`) and the merge commit of each merged pull request (a squash merge never contains the
 *   head). The check's rows wait as `checking` while the host is asked, outside any transaction; then, in one
 *   transaction, a contained issue's mark is renewed with this release (or added), and a marked issue no longer
 *   contained is withdrawn ("withdrawn with 1.3.0"), whether by a rollback or by deploying an older release. A check a
 *   newer deployment overtook decides nothing, and neither does one the host could not answer.
 * - Once that transaction commits, whoever deployed gets a suggestion card in their inbox (`reopen_suggested`) listing
 *   the withdrawn issues still done (every withdrawn mark for a rollback, production ones for a deployment): "Reopen"
 *   moves them back to In progress as that person in one click (`reopen`), "Keep done" dismisses it. A newer
 *   suggestion for the same App replaces the one still waiting.
 * - An issue entering a done status in a project that deploys to production: its release owner (the project's lead,
 *   else the issue's owner) is told, in one inbox item per project that counts up.
 * - A pull request unlinked from an issue (`pullRequestUnlinked`): the issue's marks of its head or merge commit are
 *   removed, unless another pull request still linked, or the agent's newest push to the same repository, names it.
 */
import type {
  Projects,
  Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import {
  SYSTEM_CALLER,
  type Releases,
} from '@nocobase/app-plugin-releases/server';
import type { ReleasesEvent } from '@nocobase/app-plugin-releases/server/tokens';
import type { DatabaseConnection, DatabaseManager, Row } from '@nocobase/db';

import {
  RELEASE_LABELS,
  type DeployMark,
  type DeployMarkRole,
  type DeployMarks,
  type EnvironmentRelease,
  type ProjectEnvironments,
  type UnreleasedIssues,
} from '../../shared/previews.js';
import { notFound } from '../access/errors.js';
import { repoOfRemote } from '../git/links.js';
import { findPullRequestById, pullRequestsOfIssues } from '../git/store.js';
import type { InboxNotice } from '../../shared/inbox.js';
import type { StudioInboxPort, InboxDecisionRef } from '../inbox/port.js';
import { issuePath } from '../previews/notices.js';
import {
  categoriesOf,
  findIssue,
  findIssues,
  latestPushes,
  systemViewer,
} from '../previews/sources.js';

export const DEPLOYS_SOURCE = 'deploys';
export const UNRELEASED_NOTICE = 'unreleased';
/** The decision card suggesting to reopen the issues a deployment no longer runs. */
export const REOPEN_SUGGESTED = 'reopen_suggested';

/** The card's decision: one per App, a newer one replacing the one still waiting. */
export function reopenDecisionKey(appId: string): string {
  return `reopen:${appId}`;
}

/** An issue the card suggests reopening, as its data lists it. */
export interface ReopenIssue {
  readonly id: string;
  readonly identifier: string;
  readonly title: string;
  readonly statusKey: string;
}

export type ReopenAction = 'reopen' | 'dismiss';

const TABLE = 'studioDeployMarks';
/** At most this many commits per check: one compare call each. */
const MAX_SHAS = 500;
const SHA = /^[0-9a-f]{7,64}$/u;

/** One commit named by two shas of any length: either is a prefix of the other. */
const sameCommit = (a: string, b: string): boolean => {
  const left = a.toLowerCase();
  const right = b.toLowerCase();
  return left.startsWith(right) || right.startsWith(left);
};

/** The newest head an agent pushed for the issue to each repository (`owner/name`, lower case). */
async function pushedHeads(
  conn: DatabaseConnection,
  issueId: string,
): Promise<Map<string, string>> {
  const rows = await conn.query
    .selectFrom('agRunRepos as repo')
    .innerJoin('agRuns as run', 'run.id', 'repo.runId')
    .select(['repo.url as url', 'repo.headSha as headSha'])
    .where('run.subjectKind', '=', 'issue')
    .where('run.subjectId', '=', issueId)
    .where('repo.pushed', '=', true)
    .where('repo.headSha', 'is not', null)
    .orderBy('repo.updatedAt', 'desc')
    .execute<Row>();
  const heads = new Map<string, string>();
  for (const row of rows) {
    const repo = repoOfRemote(text(row.url))?.repo.toLowerCase();
    const sha = text(row.headSha);
    if (repo && sha && !heads.has(repo)) heads.set(repo, sha);
  }
  return heads;
}

export interface DeployMarksService {
  /**
   * A deployment or a rollback finished: starts checking what it carries in the background (the code host is asked),
   * so release management's events never wait for a code host.
   */
  releasesEvent(event: ReleasesEvent): Promise<void>;
  /** Resolves once every check started so far has decided (shutdown, tests). */
  settled(): Promise<void>;
  /**
   * The person the card was sent to answers it: `reopen` moves each listed issue still done back to its reopen status
   * as them (their own rights and the workflow's rules hold), `dismiss` leaves them done. Either settles the card.
   * 404 unless the card waits on them.
   */
  decideReopen(
    viewer: Viewer,
    appId: string,
    action: ReopenAction,
  ): Promise<{
    readonly reopened: readonly string[];
    /** Issues the person could not move; they stay done. */
    readonly failed: readonly string[];
  }>;
  /** A status change committed: remind the release owner of a newly finished issue. */
  issueMoved(issueId: string, to: string): Promise<void>;
  /**
   * A pull request was unlinked from an issue: the issue's marks of its head or merge commit go, unless another pull
   * request still linked to the issue, or the newest head an agent pushed for it to the same repository, carries that
   * commit too.
   */
  pullRequestUnlinked(issueId: string, pullRequestId: string): Promise<void>;
  marksFor(viewer: Viewer, issueIds: readonly string[]): Promise<DeployMarks>;
  unreleased(
    viewer: Viewer,
    projectId: string,
    allowUnlinked?: boolean,
  ): Promise<UnreleasedIssues>;
  /** What runs on each staging and production App of the project's repositories (404 for a project not visible). */
  environments(viewer: Viewer, projectId: string): Promise<ProjectEnvironments>;
}

export interface DeployMarksDeps {
  readonly hasProjectPreviews: (
    viewer: Viewer,
    projectId: string,
    allowUnlinked: boolean,
  ) => Promise<boolean>;
  readonly database: Pick<DatabaseManager, 'connection' | 'transaction'>;
  readonly projects: () => Pick<Projects, 'issueQueries' | 'issues'>;
  /**
   * Which of `shas` the commit `head` of a working directory's repository contains, asked of its code host
   * (`StudioGit.commitsContained`); null (or a throw) when it cannot say, which decides nothing.
   */
  readonly contains: (
    resourceId: string,
    head: string,
    shas: readonly string[],
  ) => Promise<ReadonlySet<string> | null>;
  readonly releases: () => Releases;
  readonly inbox: () => StudioInboxPort | undefined;
  /** The waiting card a person was sent, with its data; without it nobody can answer a card. */
  readonly decisionOf?: (
    userId: string,
    ref: InboxDecisionRef,
  ) => Promise<InboxNotice | null>;
  readonly newId: () => string;
  readonly now?: () => Date;
  readonly onError?: (message: string, error: unknown) => void;
}

const text = (value: unknown): string | null =>
  typeof value === 'string' && value !== ''
    ? value
    : typeof value === 'number' || typeof value === 'bigint'
      ? String(value)
      : null;

const iso = (value: unknown): string => {
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
};

function decodeMark(row: Row): DeployMark & {
  readonly issueId: string;
  readonly id: string;
} {
  return {
    id: String(row.id),
    issueId: String(row.issueId),
    role: String(row.role) as DeployMarkRole,
    status: String(row.status) as DeployMark['status'],
    appId: String(row.appId),
    environmentId: String(row.environmentId),
    // Named when it is answered (`marksFor`).
    environmentName: String(row.environmentId),
    sha: String(row.sha),
    version: text(row.version),
    deploymentId: String(row.deploymentId),
    withdrawnByDeploymentId: text(row.withdrawnByDeploymentId),
    withdrawnVersion: text(row.withdrawnVersion),
    deployedAt: iso(row.deployedAt),
  };
}

/** The newest decided mark of each issue and App. */
function currentMarks(
  rows: readonly ReturnType<typeof decodeMark>[],
): Map<string, ReturnType<typeof decodeMark>[]> {
  const newest = new Map<string, ReturnType<typeof decodeMark>>();
  for (const mark of rows) {
    if (mark.status === 'checking') continue;
    const key = `${mark.issueId}\u0000${mark.appId}`;
    const seen = newest.get(key);
    if (!seen || seen.deployedAt < mark.deployedAt) newest.set(key, mark);
  }
  const byIssue = new Map<string, ReturnType<typeof decodeMark>[]>();
  for (const mark of newest.values())
    byIssue.set(mark.issueId, [...(byIssue.get(mark.issueId) ?? []), mark]);
  return byIssue;
}

type DeploymentDone = Extract<
  ReleasesEvent,
  { type: 'deployment.succeeded' | 'deployment.rolledBack' }
>;

interface LongLivedLink {
  readonly resourceId: string;
  readonly projectId: string;
  readonly url: string;
  readonly role: DeployMarkRole;
  readonly environmentId: string;
}

export function createDeployMarks(deps: DeployMarksDeps): DeployMarksService {
  const now = deps.now ?? (() => new Date());
  const onError =
    deps.onError ?? ((message, error) => console.error(message, error));
  const conn = () => deps.database.connection();
  /** The checks under way. */
  const running = new Set<Promise<void>>();

  async function linksOfApp(appId: string): Promise<LongLivedLink[]> {
    const rows = await conn()
      .query.selectFrom('studioRepoApps as link')
      .innerJoin(
        'pmProjectResources as resource',
        'resource.id',
        'link.resourceId',
      )
      .select([
        'link.resourceId as resourceId',
        'link.role as role',
        'link.environmentId as environmentId',
        'resource.projectId as projectId',
        'resource.url as url',
      ])
      .where('link.appId', '=', appId)
      .where('link.role', 'in', ['staging', 'production'])
      .execute<Row>();
    return rows
      .filter((row) => text(row.url))
      .map((row) => ({
        resourceId: String(row.resourceId),
        projectId: String(row.projectId),
        url: String(row.url),
        role: String(row.role) as DeployMarkRole,
        environmentId: String(row.environmentId),
      }));
  }

  async function doneKeys(projectId: string | null): Promise<string[]> {
    const categories = await categoriesOf(deps.projects(), projectId);
    return [...categories]
      .filter(([, category]) => category === 'done')
      .map(([key]) => key);
  }

  /**
   * The commits that may carry each issue's change into `url`: the newest head an agent pushed, and the merge commit
   * (else the head) of each merged pull request of the same repository — a squash merge leaves the pushed head out of
   * the base branch, its single new commit is what a deployment contains.
   */
  async function candidatesOf(
    issueIds: readonly string[],
    url: string,
  ): Promise<Map<string, Set<string>>> {
    const found = new Map<string, Set<string>>();
    const add = (issueId: string, sha: string | null) => {
      if (!sha || !SHA.test(sha)) return;
      const set = found.get(issueId) ?? new Set<string>();
      set.add(sha);
      found.set(issueId, set);
    };
    for (const [issueId, push] of await latestPushes(conn(), issueIds, url))
      add(issueId, push.sha);
    const repo = repoOfRemote(url)?.repo.toLowerCase() ?? null;
    if (repo)
      for (const [issueId, list] of await pullRequestsOfIssues(
        conn(),
        issueIds,
      ))
        for (const { pr } of list)
          if (pr.state === 'merged' && pr.repo.toLowerCase() === repo) {
            add(issueId, pr.mergeCommitSha);
            add(issueId, pr.headSha);
          }
    return found;
  }

  /**
   * A deployment (or a rollback) finished on an App: every mark of the App is checked again against the commit it now
   * runs, with the finished issues that have none yet, in one check: the host says which commits it contains, then
   * `decide` renews, withdraws and adds, and whoever deployed is asked about reopening what it withdrew.
   */
  async function deployed(event: DeploymentDone): Promise<void> {
    const links = await linksOfApp(event.app.id);
    if (links.length === 0) return;
    const sha =
      event.release.labels[RELEASE_LABELS.sha] ?? event.release.labels.commit;
    // Without the deployed commit nothing can be decided; the marks stay as they were.
    if (!sha || !SHA.test(sha)) return;
    const pending: { issueId: string; sha: string; link: LongLivedLink }[] = [];
    const seen = new Set<string>();
    for (const link of links) {
      const keys = await doneKeys(link.projectId);
      const done =
        keys.length === 0
          ? []
          : await conn()
              .query.selectFrom('pmIssues')
              .select('id')
              .where('projectId', '=', link.projectId)
              .where('deletedAt', 'is', null)
              .where('statusKey', 'in', keys)
              .execute<Row>();
      const marks = currentMarks(
        (
          await conn()
            .query.selectFrom(TABLE)
            .selectAll()
            .where('appId', '=', event.app.id)
            .where('projectId', '=', link.projectId)
            .where('status', '=', 'deployed')
            .execute<Row>()
        ).map(decodeMark),
      );
      const ids = [
        ...new Set([...done.map((row) => String(row.id)), ...marks.keys()]),
      ].filter((id) => !seen.has(id));
      if (ids.length === 0) continue;
      const candidates = await candidatesOf(ids, link.url);
      for (const [issueId, list] of marks)
        for (const mark of list) {
          const set = candidates.get(issueId) ?? new Set<string>();
          set.add(mark.sha);
          candidates.set(issueId, set);
        }
      for (const id of ids)
        for (const candidate of candidates.get(id) ?? []) {
          seen.add(id);
          pending.push({ issueId: id, sha: candidate, link });
        }
    }
    const shas = [...new Set(pending.map((row) => row.sha))].slice(0, MAX_SHAS);
    const checked = new Set(shas);
    const rows = pending.filter((row) => checked.has(row.sha));
    if (rows.length === 0) return;
    const checkId = deps.newId();
    const at = new Date(event.deployment.createdAt);
    for (const row of rows)
      await conn()
        .query.insertInto(TABLE)
        .values({
          id: deps.newId(),
          issueId: row.issueId,
          projectId: row.link.projectId,
          appId: event.app.id,
          environmentId: row.link.environmentId,
          role: row.link.role,
          status: 'checking',
          sha: row.sha,
          deploymentId: event.deployment.id,
          releaseId: event.release.id,
          version: event.release.version.slice(0, 128),
          checkId,
          deployedAt: at,
          createdAt: now(),
          updatedAt: now(),
        })
        .execute();
    // The host is asked outside any transaction, per working directory the commits came from.
    let contained: Set<string> | null = new Set<string>();
    try {
      const byResource = new Map<string, Set<string>>();
      for (const row of rows) {
        const set = byResource.get(row.link.resourceId) ?? new Set<string>();
        set.add(row.sha);
        byResource.set(row.link.resourceId, set);
      }
      for (const [resourceId, candidates] of byResource) {
        const answer = await deps.contains(resourceId, sha, [...candidates]);
        if (!answer) {
          contained = null;
          break;
        }
        for (const found of answer) contained.add(found);
      }
    } catch (error) {
      onError('Could not check the commits a deployment contains.', error);
      contained = null;
    }
    await deps.database.transaction((connection) =>
      decide(connection, checkId, contained),
    );
    await proposeReopening(checkId);
  }

  /**
   * Decides the marks a check was checking: `contained` are the commits the deployed one contains, null when the host
   * could not say. In one transaction.
   */
  async function decide(
    connection: DatabaseConnection,
    checkId: string,
    contained: ReadonlySet<string> | null,
  ): Promise<void> {
    const rows = (
      await connection.query
        .selectFrom(TABLE)
        .selectAll()
        .where('checkId', '=', checkId)
        .where('status', '=', 'checking')
        .execute<Row>()
    ).map(decodeMark);
    if (rows.length === 0) return;
    const drop = (ids: readonly string[]) =>
      ids.length === 0
        ? Promise.resolve()
        : connection.query
            .deleteFrom(TABLE)
            .where('id', 'in', [...ids])
            .execute()
            .then(() => undefined);
    const first = rows[0];
    const app = await connection.query
      .selectFrom('relApps')
      .select('currentDeploymentId')
      .where('id', '=', first.appId)
      .executeTakeFirst<Row>();
    // An unanswered check decides nothing, and neither does one a newer deployment of the App overtook.
    if (!contained || text(app?.currentDeploymentId) !== first.deploymentId) {
      await drop(rows.map((row) => row.id));
      return;
    }
    const byIssue = new Map<string, typeof rows>();
    for (const row of rows)
      byIssue.set(row.issueId, [...(byIssue.get(row.issueId) ?? []), row]);
    const decided = (
      await connection.query
        .selectFrom(TABLE)
        .selectAll()
        .where('appId', '=', first.appId)
        .where('issueId', 'in', [...byIssue.keys()])
        .where('status', '!=', 'checking')
        .execute<Row>()
    ).map(decodeMark);
    for (const [issueId, checking] of byIssue) {
      const earlier = decided.filter((mark) => mark.issueId === issueId);
      const hit = checking.find((row) => contained.has(row.sha));
      if (hit) {
        // Renewed or new: this deployment's row becomes the mark.
        await connection.query
          .updateTable(TABLE)
          .set({ status: 'deployed', checkId: null, updatedAt: now() })
          .where('id', '=', hit.id)
          .execute();
        await drop([
          ...checking.filter((row) => row !== hit).map((row) => row.id),
          ...earlier.map((mark) => mark.id),
        ]);
        continue;
      }
      await drop(checking.map((row) => row.id));
      const current = [...earlier].sort((a, b) =>
        b.deployedAt.localeCompare(a.deployedAt),
      )[0];
      if (current?.status !== 'deployed') continue;
      // The App no longer runs the change: withdrawn with this release, kept for `proposeReopening`.
      await connection.query
        .updateTable(TABLE)
        .set({
          status: 'withdrawn',
          withdrawnByDeploymentId: first.deploymentId,
          withdrawnVersion: first.version,
          checkId,
          updatedAt: now(),
        })
        .where('id', '=', current.id)
        .execute();
      await drop(
        earlier.filter((mark) => mark !== current).map((mark) => mark.id),
      );
    }
  }

  async function reopenStatus(
    projectId: string | null,
  ): Promise<string | null> {
    const statuses = await deps
      .projects()
      .issueQueries.statuses(systemViewer(), projectId);
    const started = statuses.filter((status) => status.category === 'started');
    return (
      started.find((status) => status.key === 'in_progress')?.key ??
      started[0]?.key ??
      null
    );
  }

  /**
   * After a check committed: the marks it withdrew go to whoever deployed in an operation plan reopening those issues
   * (they remove the rows of the issues that should stay done, or void it) — every withdrawn mark for a rollback, the
   * production ones for a deployment of an older release.
   */
  async function proposeReopening(checkId: string): Promise<void> {
    const rows = (
      await conn()
        .query.selectFrom(TABLE)
        .selectAll()
        .where('checkId', '=', checkId)
        .where('status', '=', 'withdrawn')
        .execute<Row>()
    ).map(decodeMark);
    if (rows.length === 0) return;
    await conn()
      .query.updateTable(TABLE)
      .set({ checkId: null })
      .where(
        'id',
        'in',
        rows.map((row) => row.id),
      )
      .execute();
    const first = rows[0];
    const deploymentId = first.withdrawnByDeploymentId;
    if (!deploymentId) return;
    const deployment = await deps
      .releases()
      .releases.getDeployment(SYSTEM_CALLER, first.appId, deploymentId)
      .catch(() => null);
    if (!deployment?.actorId) return;
    const rollback = deployment.kind === 'rollback';
    const withdrawn = rows.filter(
      (row) => rollback || row.role === 'production',
    );
    if (withdrawn.length === 0) return;
    const app = await deps
      .releases()
      .releases.getApp(SYSTEM_CALLER, first.appId)
      .catch(() => null);
    const appName = app?.app.name ?? first.appId;
    const version = first.withdrawnVersion ?? '';
    const issues = (
      await findIssues(conn(), [
        ...new Set(withdrawn.map((row) => row.issueId)),
      ])
    ).filter((issue) => !issue.deleted);
    const reopen: { issue: string; statusKey: string }[] = [];
    for (const issue of issues) {
      const categories = await categoriesOf(deps.projects(), issue.projectId);
      if (categories.get(issue.statusKey) !== 'done') continue;
      const statusKey = await reopenStatus(issue.projectId);
      if (statusKey) reopen.push({ issue: issue.id, statusKey });
    }
    if (reopen.length === 0) return;
    const port = deps.inbox();
    if (!port) return;
    const listed: ReopenIssue[] = issues
      .filter((issue) => reopen.some((row) => row.issue === issue.id))
      .map((issue) => ({
        id: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        statusKey:
          reopen.find((row) => row.issue === issue.id)?.statusKey ?? '',
      }));
    const identifiers = listed.map((issue) => issue.identifier);
    const decisionKey = reopenDecisionKey(first.appId);
    try {
      // A newer suggestion for the App (a rollback after a deployment of an older release) replaces the waiting one.
      await port.resolve({
        source: DEPLOYS_SOURCE,
        decisionKey,
        outcome: 'superseded',
      });
      await port.send({
        key: `deploys:reopen:${first.appId}:${deploymentId}`,
        source: DEPLOYS_SOURCE,
        kind: 'decision',
        type: REOPEN_SUGGESTED,
        userIds: [deployment.actorId],
        title: rollback
          ? `Reopen what ${appName} rolled back?`
          : `Reopen what ${appName} no longer runs?`,
        body: `${rollback ? `${appName} was rolled back to ${version}` : `${appName} now runs ${version}`}; ${identifiers.join(', ')} ${identifiers.length === 1 ? 'is' : 'are'} no longer deployed there.`,
        path:
          listed.length === 1
            ? issuePath(listed[0].identifier)
            : `/releases/${encodeURIComponent(first.appId)}`,
        subject: { type: 'studio.app', id: first.appId, label: appName },
        decisionKey,
        actor: null,
        data: {
          appId: first.appId,
          appName,
          version,
          deploymentId,
          rollback,
          issues: listed.map((issue) => ({ ...issue })),
        },
      });
    } catch (error) {
      onError('Could not suggest reopening withdrawn issues.', error);
    }
  }

  async function visibleProjects(
    viewer: Viewer,
    projectIds: readonly (string | null)[],
  ): Promise<Set<string | null>> {
    const visible = new Set<string | null>();
    if (viewer.permissions.scopes['pm.issues/view'] === 'none') return visible;
    for (const projectId of new Set(projectIds)) {
      if (projectId === null) {
        visible.add(null);
        continue;
      }
      try {
        // Throws 404 for a project the viewer may not see.
        await deps.projects().issueQueries.statuses(viewer, projectId);
        visible.add(projectId);
      } catch {
        // Not visible.
      }
    }
    return visible;
  }

  const service: DeployMarksService = {
    async pullRequestUnlinked(issueId, pullRequestId) {
      await deps.database.transaction(async (connection) => {
        const pr = await findPullRequestById(connection, pullRequestId);
        if (!pr) return;
        const gone = [pr.headSha, pr.mergeCommitSha].filter(
          (sha): sha is string => Boolean(sha && SHA.test(sha)),
        );
        if (gone.length === 0) return;
        const kept: string[] = [];
        for (const { pr: other } of (
          await pullRequestsOfIssues(connection, [issueId])
        ).get(issueId) ?? [])
          if (other.id !== pr.id)
            kept.push(
              ...[other.headSha, other.mergeCommitSha].filter(
                (sha): sha is string => Boolean(sha),
              ),
            );
        const pushed = (await pushedHeads(connection, issueId)).get(
          pr.repo.toLowerCase(),
        );
        if (pushed) kept.push(pushed);
        // A check still under way decides its own rows; only decided marks go.
        const ids = (
          await connection.query
            .selectFrom(TABLE)
            .select(['id', 'sha'])
            .where('issueId', '=', issueId)
            .where('status', '!=', 'checking')
            .execute<Row>()
        )
          .filter((row) => {
            const sha = String(row.sha);
            return (
              gone.some((one) => sameCommit(one, sha)) &&
              !kept.some((one) => sameCommit(one, sha))
            );
          })
          .map((row) => String(row.id));
        if (ids.length > 0)
          await connection.query
            .deleteFrom(TABLE)
            .where('id', 'in', ids)
            .execute();
      });
    },

    releasesEvent(event) {
      if (
        event.type === 'deployment.succeeded' ||
        event.type === 'deployment.rolledBack'
      ) {
        const work = deployed(event).catch((error: unknown) =>
          onError('Could not mark the issues of a deployment.', error),
        );
        running.add(work);
        void work.finally(() => running.delete(work));
      }
      return Promise.resolve();
    },

    async settled() {
      while (running.size > 0) await Promise.all([...running]);
    },

    async decideReopen(viewer, appId, action) {
      const ref = {
        source: DEPLOYS_SOURCE,
        decisionKey: reopenDecisionKey(appId),
      };
      const notice = await deps.decisionOf?.(viewer.userId, ref);
      if (!notice || notice.type !== REOPEN_SUGGESTED)
        throw notFound(
          'A suggestion waiting for you',
          'REOPEN_SUGGESTION_NOT_FOUND',
        );
      const reopened: string[] = [];
      const failed: string[] = [];
      if (action === 'reopen') {
        const listed = Array.isArray(notice.data?.issues)
          ? (notice.data.issues as unknown as readonly ReopenIssue[])
          : [];
        for (const item of listed) {
          const issue = await deps
            .projects()
            .issueQueries.detail(viewer, item.id)
            .catch(() => null);
          if (!issue) continue;
          const categories = await categoriesOf(
            deps.projects(),
            issue.projectId,
          );
          // Only what is still done: someone may have reopened it meanwhile.
          if (categories.get(issue.statusKey) !== 'done') continue;
          // Each issue on its own: one the person may not move, or whose workflow refuses the move, stays done.
          try {
            await deps.projects().issues.update(viewer, issue.id, {
              revision: issue.revision,
              statusKey: item.statusKey,
            });
            reopened.push(issue.identifier);
          } catch {
            failed.push(issue.identifier);
          }
        }
      }
      await deps.inbox()?.resolve({
        ...ref,
        outcome: action === 'reopen' ? 'reopened' : 'dismissed',
      });
      return { reopened, failed };
    },

    async issueMoved(issueId, to) {
      const port = deps.inbox();
      if (!port) return;
      const issue = await findIssue(conn(), issueId);
      if (!issue || issue.deleted || !issue.projectId) return;
      const categories = await categoriesOf(deps.projects(), issue.projectId);
      if (categories.get(to) !== 'done') return;
      const production = await conn()
        .query.selectFrom('studioRepoApps as link')
        .innerJoin(
          'pmProjectResources as resource',
          'resource.id',
          'link.resourceId',
        )
        .select('link.id')
        .where('resource.projectId', '=', issue.projectId)
        .where('link.role', '=', 'production')
        .executeTakeFirst();
      if (!production) return;
      const project = await conn()
        .query.selectFrom('pmProjects')
        .select(['id', 'name', 'leadUserId'])
        .where('id', '=', issue.projectId)
        .executeTakeFirst<Row>();
      if (!project) return;
      const owner = text(project.leadUserId) ?? issue.ownerUserId;
      await port.send({
        key: `deploys:unreleased:${issue.id}:${now().getTime()}`,
        source: DEPLOYS_SOURCE,
        kind: 'info',
        type: UNRELEASED_NOTICE,
        userIds: [owner],
        title: `${issue.identifier} is done and waits for a release`,
        body: issue.title,
        path: `/projects/${encodeURIComponent(String(project.id))}`,
        subject: {
          type: 'project',
          id: String(project.id),
          label: String(project.name),
        },
        group: `unreleased:${String(project.id)}`,
        actor: null,
        data: {
          projectId: String(project.id),
          projectName: String(project.name),
          issueId: issue.id,
          identifier: issue.identifier,
          issueTitle: issue.title,
          issuePath: issuePath(issue.identifier),
        },
      });
    },

    async marksFor(viewer, issueIds) {
      if (issueIds.length === 0) return {};
      const issues = (await findIssues(conn(), issueIds)).filter(
        (issue) => !issue.deleted,
      );
      const visible = await visibleProjects(
        viewer,
        issues.map((issue) => issue.projectId),
      );
      const ids = issues
        .filter((issue) => visible.has(issue.projectId))
        .map((issue) => issue.id);
      if (ids.length === 0) return {};
      const marks = currentMarks(
        (
          await conn()
            .query.selectFrom(TABLE)
            .selectAll()
            .where('issueId', 'in', ids)
            .execute<Row>()
        ).map(decodeMark),
      );
      // Each mark is labelled with its environment's name.
      const names = new Map<string, string>();
      const nameOf = async (environmentId: string): Promise<string> => {
        if (!names.has(environmentId))
          names.set(
            environmentId,
            (await deps.releases().environments.find(environmentId))?.name ??
              environmentId,
          );
        return names.get(environmentId)!;
      };
      const answer: Record<string, DeployMark[]> = {};
      for (const [issueId, list] of marks) {
        const sorted = list.sort(
          (a, b) =>
            a.role.localeCompare(b.role) ||
            a.environmentId.localeCompare(b.environmentId),
        );
        const marked: DeployMark[] = [];
        for (const { id: _id, issueId: _issue, ...mark } of sorted)
          marked.push({
            ...mark,
            environmentName: await nameOf(mark.environmentId),
          });
        answer[issueId] = marked;
      }
      return answer;
    },

    async unreleased(viewer, projectId, allowUnlinked = false) {
      const visible = await visibleProjects(viewer, [projectId]);
      if (!visible.has(projectId)) throw notFound('Project');
      const links = await conn()
        .query.selectFrom('studioRepoApps as link')
        .innerJoin(
          'pmProjectResources as resource',
          'resource.id',
          'link.resourceId',
        )
        .select(['link.role as role'])
        .where('resource.projectId', '=', projectId)
        .execute<Row>();
      const hasPreview = await deps.hasProjectPreviews(
        viewer,
        projectId,
        allowUnlinked,
      );
      if (!links.some((row) => row.role === 'production'))
        return { projectId, hasProduction: false, hasPreview, items: [] };
      const keys = await doneKeys(projectId);
      if (keys.length === 0)
        return { projectId, hasProduction: true, hasPreview, items: [] };
      const issues = await conn()
        .query.selectFrom('pmIssues')
        .select(['id', 'identifier', 'title', 'statusKey', 'updatedAt'])
        .where('projectId', '=', projectId)
        .where('deletedAt', 'is', null)
        .where('statusKey', 'in', keys)
        .orderBy('updatedAt', 'desc')
        .limit(200)
        .execute<Row>();
      const ids = issues.map((row) => String(row.id));
      const marks = currentMarks(
        ids.length === 0
          ? []
          : (
              await conn()
                .query.selectFrom(TABLE)
                .selectAll()
                .where('issueId', 'in', ids)
                .execute<Row>()
            ).map(decodeMark),
      );
      return {
        projectId,
        hasProduction: true,
        hasPreview,
        items: issues
          .filter(
            (row) =>
              !(marks.get(String(row.id)) ?? []).some(
                (mark) =>
                  mark.role === 'production' && mark.status === 'deployed',
              ),
          )
          .map((row) => ({
            id: String(row.id),
            identifier: String(row.identifier),
            title: String(row.title),
            statusKey: String(row.statusKey),
            updatedAt: iso(row.updatedAt),
            staging: (marks.get(String(row.id)) ?? []).some(
              (mark) => mark.role === 'staging' && mark.status === 'deployed',
            ),
          })),
      };
    },

    async environments(viewer, projectId) {
      const visible = await visibleProjects(viewer, [projectId]);
      if (!visible.has(projectId)) throw notFound('Project');
      const links = await conn()
        .query.selectFrom('studioRepoApps as link')
        .innerJoin(
          'pmProjectResources as resource',
          'resource.id',
          'link.resourceId',
        )
        .select(['link.appId as appId', 'link.role as role'])
        .where('resource.projectId', '=', projectId)
        .where('link.role', 'in', ['staging', 'production'])
        .orderBy('resource.position')
        .orderBy('link.position')
        .execute<Row>();
      const services = deps.releases();
      const names = new Map<string, string | null>();
      const nameOf = async (userId: string | null): Promise<string | null> => {
        if (!userId) return null;
        if (!names.has(userId)) {
          const row = await conn()
            .query.selectFrom('user')
            .select(['name', 'username', 'email'])
            .where('id', '=', userId)
            .executeTakeFirst<Row>();
          names.set(
            userId,
            [row?.name, row?.username, row?.email].find(
              (value): value is string => typeof value === 'string' && !!value,
            ) ?? null,
          );
        }
        return names.get(userId) ?? null;
      };
      const items: EnvironmentRelease[] = [];
      const seen = new Set<string>();
      for (const link of links) {
        const appId = String(link.appId);
        if (seen.has(appId)) continue;
        seen.add(appId);
        const app = await services.releases.findApp(appId);
        if (!app) continue;
        const environment = await services.environments.find(app.environmentId);
        let current: EnvironmentRelease['current'] = null;
        if (app.currentDeploymentId) {
          const deployment = await services.releases
            .getDeployment(SYSTEM_CALLER, appId, app.currentDeploymentId)
            .catch(() => null);
          const release = deployment
            ? await services.releases
                .getRelease(SYSTEM_CALLER, appId, deployment.releaseId)
                .catch(() => null)
            : null;
          const request = deployment?.requestId
            ? await services.requests
                .get(SYSTEM_CALLER, deployment.requestId)
                .catch(() => null)
            : null;
          if (deployment)
            current = {
              deploymentId: deployment.id,
              releaseId: deployment.releaseId,
              version: release?.version ?? deployment.release?.version ?? null,
              sha:
                release?.labels[RELEASE_LABELS.sha] ??
                release?.sourceCommit ??
                null,
              deployedAt: deployment.finishedAt ?? deployment.createdAt,
              deployedBy: await nameOf(
                request?.requestedBy ?? deployment.actorId,
              ),
              approvedBy: await nameOf(request?.decidedBy ?? null),
              promoted: Boolean(release?.sourceReleaseId),
            };
        }
        const pending = (
          await services.requests.list(SYSTEM_CALLER, {
            appId,
            status: 'pending',
            pageSize: 1,
          })
        ).items[0];
        items.push({
          appId,
          appName: app.name,
          role: String(link.role) as DeployMarkRole,
          environmentId: app.environmentId,
          environmentName: environment?.name ?? app.environmentId,
          current,
          pending: pending
            ? {
                requestId: pending.id,
                version:
                  (
                    await services.releases
                      .getRelease(SYSTEM_CALLER, appId, pending.releaseId)
                      .catch(() => null)
                  )?.version ?? null,
              }
            : null,
        });
      }
      // Production first, as on the deployment marks.
      items.sort(
        (a, b) =>
          Number(b.role === 'production') - Number(a.role === 'production'),
      );
      return { projectId, items };
    },
  };
  return service;
}

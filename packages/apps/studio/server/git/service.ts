/**
 * Studio's pull requests: opening and linking them to issues, reading them from the code host, merging, the repository
 * settings, webhook deliveries and merge checks. Routes (`routes.ts`) and the agents' `nb-studio pr open`, `pr link` and
 * `pr list` (`commands.ts`) call it as a `Viewer`; the poller (`poller.ts`) calls `pollRepo` and `runMergeChecks`; the
 * webhook routes call `receiveWebhook` (`webhooks.ts`). What a read changes is the flow's (`flow.ts`), whoever read it.
 * Every call to the host goes through the platform of the repository's provider (`platform.ts`, `providers.ts`).
 *
 * - **Who may**: whoever sees an issue sees its pull requests; whoever may edit issues links, unlinks, opens, edits,
 *   closes and reopens them (each change on the host a line on the issue's activity, `PR_ACTIVITIES`) and dismisses
 *   suggestions; the issue's owner, a manager of its project or someone who closes any issue may merge or
 *   mark merged.
 * - **Repositories**: a project's working directory linked to a repository of a connection (its `binding`) is watched
 *   through that connection. A pull request on a branch matching one of the repository's branch rules (`agent/{key}`
 *   by default) is linked to that issue; one whose title or body names issue keys is only suggested on those issues,
 *   for a person to confirm. Studio keeps the linked pull requests, those CI builds a preview of, and every open one
 *   of a repository with a live preview (`../previews`), so a preview is removed once its pull request is merged or
 *   closed.
 * - **Acting as whom**: reading and polling use the repository's connection. Opening, editing, closing and reopening a pull
 *   request (`nb-studio pr open|edit|close|reopen`) and merging from Studio act as the person (who woke the agent, or who clicked Merge) when they authorized the app
 *   for themselves, else as the connection (`GitConnections.actingAuth`).
 * - **Merging**: the preflight reads the pull request and its checks
 *   from the host (never the stored snapshot), stores what it saw, and answers why it cannot be merged
 *   (`mergeBlockerOf`), the squash commit's title and what merging does to the issue (`statusAfter`). Merging runs the
 *   preflight again and squash-merges only the head the person confirmed (`expectedHeadSha`): 409 `PR_NOT_MERGEABLE`
 *   with the blocker, or `PR_CHANGED` when the head moved.
 * - **Merge checks**: the host works out mergeability after a push and sends no event when it changes, so a push to a
 *   pull request's base or a new head asks for a read `MERGE_CHECK_DELAY_SECONDS` later, again every
 *   `MERGE_CHECK_RETRY_SECONDS` while the host still computes, at most `MERGE_CHECK_ATTEMPTS` reads.
 */
import { randomUUID } from 'node:crypto';

import { ProtocolError } from '@nocobase/agent-protocol';
import type {
  Projects,
  Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import type { DatabaseConnection } from '@nocobase/db';

import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import type { ProjectResource } from '@nocobase/app-plugin-projects/shared/projects';

import {
  BRANCH_RULES_MAX,
  branchOf,
  branchRuleProblem,
  issueKeyOfBranch,
  MARKS_MAX,
  MERGED_EVENT,
  PR_ACTIVITIES,
  WEBHOOK_SECRET_MAX,
  WEBHOOK_SECRET_MIN,
  mergeBlockerOf,
  mergeCommitTitle,
  COMMIT_ATTRIBUTIONS,
  type CommitAttribution,
  type GitProjectSettings,
  type GitRepoSettings,
  type IssuePullRequest,
  type IssuePullRequests,
  type PullRequestCiState,
  type PullRequestEditField,
  type PullRequestLinkedBy,
  type PullRequestMark,
  type PullRequestMergeBlocker,
  type PullRequestMergeOutcome,
  type PullRequestMergePreflight,
  type UpdateGitRepoRequest,
} from '../../shared/git.js';
import { AGENT_KIND } from '../agents/tx.js';
import { choiceOf, rateLimited, type GitConnections } from './connections.js';
import type { GitFlow, StoreOptions } from './flow.js';
import {
  apiBaseUrlOf,
  mentionedIssueKeys,
  parsePullRequestUrl,
} from './links.js';
import {
  GitApiError,
  type GitAuth,
  type GitEvent,
  type PullRequestSnapshot,
} from './platform.js';
import type { GitProviders } from './providers.js';
import { projectAttribution, setProjectAttribution } from './run-git.js';
import { GIT_SECRET_PURPOSES, type GitSecrets } from './sealing.js';
import {
  bindingOfRow,
  deleteLink,
  dismissSuggestion,
  dueMergeChecks,
  ensureRepo,
  findLink,
  findPullRequest,
  findPullRequestById,
  findRepo,
  findRepoById,
  insertLink,
  insertSuggestion,
  linkedOpenAtHead,
  linkedOpenPullRequests,
  linksOfPullRequest,
  openPullRequestsOf,
  pullRequestsOfIssue,
  pullRequestsOfIssues,
  pullRequestView,
  scheduleMergeChecks,
  setAutoComplete,
  setMergeCheck,
  suggestionsOfIssue,
  updateRepo,
  webhookHealthy,
  type LinkRow,
  type PullRequestRow,
  type RepoRow,
} from './store.js';
import { hasLivePreviews } from '../previews/store.js';
import type { PullRequestEvents, RepoEvents } from './events.js';
import { createWebhookReceiver, type WebhookReceiver } from './webhooks.js';

/** The first merge check waits a little: the host starts working out mergeability only after the push. */
export const MERGE_CHECK_DELAY_SECONDS = 20;
export const MERGE_CHECK_RETRY_SECONDS = 30;
export const MERGE_CHECK_ATTEMPTS = 5;
/** Merge checks per run, the oldest first; the rest wait for the next. */
export const MERGE_CHECK_BATCH = 20;
export const PR_TITLE_MAX = 256;
export const PR_BODY_MAX = 65_000;
export const PR_CLOSE_REASON_MAX = 2_000;

/** The pull request actions after which the host works out mergeability again. */
const MERGE_CHECK_ACTIONS: ReadonlySet<string> = new Set([
  'opened',
  'reopened',
  'updated',
  'ready',
]);
/** The pull request actions that make a pull request ready to merge: its issues in review ask their owners again. */
const READY_ACTIONS: ReadonlySet<string> = new Set([
  'opened',
  'reopened',
  'ready',
]);

export interface StudioGitDeps {
  readonly projects: () => Pick<
    Projects,
    | 'tx'
    | 'issueQueries'
    | 'issueContext'
    | 'projects'
    | 'kinds'
    | 'workflowEvents'
  >;
  readonly providers: GitProviders;
  readonly connections: GitConnections;
  readonly secrets: GitSecrets;
  readonly flow: GitFlow;
  /** API base URLs by host (`studio.git.apiBaseUrls`), for GitHub Enterprise or a stand-in. */
  readonly apiBaseUrls?: Readonly<Record<string, string>>;
  /** Where GitHub posts a repository's events (`StudioGitProvider`); a path on Studio's origin when it cannot tell. */
  readonly webhookUrl?: (repoId: string) => string;
  /** How often a repository is read: without a working webhook, and with one (`poller.ts`). */
  readonly pollSeconds?: { readonly normal: number; readonly fallback: number };
  readonly now?: () => Date;
  /** Where links are announced (`events.ts`). */
  readonly events?: PullRequestEvents;
  /** Where pushes and workflow runs a webhook delivers are told (`events.ts`). */
  readonly repoEvents?: RepoEvents;
}

/** Who links: a person, or an agent on a run (named by its id). */
export interface Linker {
  readonly type: PullRequestLinkedBy;
  readonly id: string | null;
}

/** `nb-studio pr open`'s request. */
export interface OpenPullRequestInput {
  readonly title: unknown;
  readonly body?: unknown;
  /** `owner/name`, when the project has several repositories; its first otherwise. */
  readonly repo?: unknown;
  /** The branch; the repository's first branch rule for the issue by default. */
  readonly head?: unknown;
  /** The base branch; the working directory's default branch, else the repository's. */
  readonly base?: unknown;
  readonly draft?: unknown;
}

/** `nb-studio pr edit`'s request: what is given changes. */
export interface EditPullRequestInput {
  readonly title?: unknown;
  readonly body?: unknown;
  readonly base?: unknown;
  /** True turns it into a draft, false marks it ready for review. */
  readonly draft?: unknown;
}

/** `nb-studio pr close`'s request. */
export interface ClosePullRequestInput {
  /** Why: commented on the pull request and kept in the issue's activity. */
  readonly reason: unknown;
  /** Also unlink it from the issue. */
  readonly unlink?: unknown;
}

export interface StudioGit {
  list(viewer: Viewer, issue: string): Promise<IssuePullRequests>;
  link(
    viewer: Viewer,
    issue: string,
    url: unknown,
    by: Linker,
  ): Promise<{ pullRequest: IssuePullRequest; created: boolean }>;
  /** Opens a pull request on the host for the issue and links it (`nb-studio pr open`), acting as `actingUserId` when they authorized the app. */
  open(
    viewer: Viewer,
    issue: string,
    input: OpenPullRequestInput,
    by: Linker,
    actingUserId: string,
  ): Promise<IssuePullRequest>;
  /** Edits a linked pull request on the host (`nb-studio pr edit`), acting as `actingUserId` when they authorized the app. */
  edit(
    viewer: Viewer,
    issue: string,
    pullRequestId: string,
    input: EditPullRequestInput,
    actingUserId: string,
  ): Promise<IssuePullRequest>;
  /** Closes a linked open pull request on the host with a reason (`nb-studio pr close`); unlinks it when asked. */
  close(
    viewer: Viewer,
    issue: string,
    pullRequestId: string,
    input: ClosePullRequestInput,
    actingUserId: string,
  ): Promise<IssuePullRequest>;
  /** Reopens a linked closed pull request on the host (`nb-studio pr reopen`). */
  reopen(
    viewer: Viewer,
    issue: string,
    pullRequestId: string,
    actingUserId: string,
  ): Promise<IssuePullRequest>;
  unlink(viewer: Viewer, issue: string, pullRequestId: string): Promise<void>;
  dismissSuggestion(
    viewer: Viewer,
    issue: string,
    pullRequestId: string,
  ): Promise<void>;
  setAutoComplete(
    viewer: Viewer,
    issue: string,
    pullRequestId: string,
    disabled: unknown,
  ): Promise<IssuePullRequest>;
  refresh(
    viewer: Viewer,
    issue: string,
    pullRequestId: string,
  ): Promise<IssuePullRequest>;
  /** Merges from Studio as the viewer when they authorized the app, else as the repository's connection. */
  merge(
    viewer: Viewer,
    issue: string,
    pullRequestId: string,
    expectedHeadSha: unknown,
  ): Promise<IssuePullRequest>;
  markMerged(
    viewer: Viewer,
    issue: string,
    pullRequestId: string,
  ): Promise<IssuePullRequest>;
  /** Whether and how it may be merged, read from the host now; for whoever may merge. */
  preflight(
    viewer: Viewer,
    issue: string,
    pullRequestId: string,
  ): Promise<PullRequestMergePreflight>;
  repoSettings(viewer: Viewer, resourceId: string): Promise<GitRepoSettings>;
  updateRepoSettings(
    viewer: Viewer,
    resourceId: string,
    input: UpdateGitRepoRequest,
  ): Promise<GitRepoSettings>;
  /** The marks of the issues among `issueIds` that have pull requests and that the viewer sees. */
  marks(
    viewer: Viewer,
    issueIds: readonly string[],
  ): Promise<Record<string, PullRequestMark>>;
  /** A project's git settings, for whoever sees it. */
  projectSettings(
    viewer: Viewer,
    projectId: string,
  ): Promise<GitProjectSettings>;
  /** Changes them, for its managers. */
  setProjectSettings(
    viewer: Viewer,
    projectId: string,
    input: Readonly<Record<string, unknown>>,
  ): Promise<GitProjectSettings>;
  /** The repository row a working directory links, created on first use; null when it links none. */
  repoOfResource(
    conn: DatabaseConnection,
    resource: Pick<ProjectResource, 'binding'>,
  ): Promise<RepoRow | null>;
  /** The rows of every repository a working directory links, reached through its connection (before a poll). */
  syncRepos(): Promise<void>;
  /** One poll of a repository: its pull request list for new links, then each linked open pull request. */
  /**
   * Reads one repository: its pull requests and their checks. A failure is recorded on it; `retryAt` says when the
   * host's rate limit lifts when that was the failure.
   */
  pollRepo(repo: RepoRow): Promise<{ readonly retryAt: string | null }>;
  /** The merge checks due at `at`; answers how many pull requests were read. */
  runMergeChecks(at?: Date): Promise<number>;
  /** Webhook deliveries (`webhooks.ts`). */
  readonly receiveWebhook: WebhookReceiver;
  /**
   * Whether a pinned commit belongs to a working directory's repository, read now through its connection, for a CI
   * build (`../builds`): the head of an open pull request (those pull requests are stored and linked as a read would,
   * and answered), on the default branch, tagged, or the head of another branch.
   */
  verifyCommit(resourceId: string, sha: string): Promise<CommitVerification>;
  /**
   * Which of `shas` the commit `head` of a working directory's repository contains (itself or an ancestor), read now
   * through its connection with the host's compare API, one call per commit (`../deploys`). Null when the working
   * directory links no repository of a connection.
   */
  commitsContained(
    resourceId: string,
    head: string,
    shas: readonly string[],
  ): Promise<ReadonlySet<string> | null>;
  /**
   * Writes Studio's section of a pull request's body, between `<!-- studio:<marker> -->` and `<!-- /studio:<marker> -->`
   * at its end (`text` null removes it), through its repository's connection. Answers whether the body changed.
   */
  updatePullRequestSection(
    pullRequestId: string,
    marker: string,
    text: string | null,
  ): Promise<boolean>;
}

/** `body` with Studio's section `marker` replaced by `text`, appended when missing, removed when `text` is null. */
export function withPullRequestSection(
  body: string,
  marker: string,
  text: string | null,
): string {
  const open = `<!-- studio:${marker} -->`;
  const close = `<!-- /studio:${marker} -->`;
  const start = body.indexOf(open);
  if (start === -1 && text === null) return body;
  const end = start === -1 ? -1 : body.indexOf(close, start);
  const before =
    start === -1 ? body : body.slice(0, start).replace(/\s+$/u, '');
  const after =
    start === -1 || end === -1 ? '' : body.slice(end + close.length).trim();
  const kept = [before.replace(/\s+$/u, ''), after]
    .filter((part) => part !== '')
    .join('\n\n');
  if (text === null) return kept;
  return [kept, `${open}\n${text.trim()}\n${close}`]
    .filter((part) => part !== '')
    .join('\n\n');
}

export type CommitVerification =
  | {
      readonly ok: true;
      /** The default branch, tag or branch it is on; null for an open pull request's head. */
      readonly ref: string | null;
      /** Studio's pull requests (stored) whose head it is, open ones only. */
      readonly pullRequestIds: readonly string[];
    }
  | {
      readonly ok: false;
      readonly reason: 'noRepository' | 'notInRepository';
    };

/** `The pull request link` is `PULL_REQUEST_LINK_NOT_FOUND`. */
const notFound = (what: string) =>
  new ProtocolError('NOT_FOUND', `${what} was not found.`, {
    code: `${what
      .replace(/^The /u, '')
      .trim()
      .replace(/\W+/gu, '_')
      .toUpperCase()}_NOT_FOUND`,
  });
const forbidden = (message: string) =>
  new ProtocolError('FORBIDDEN', message, { code: 'FORBIDDEN' });

function hostFailure(error: unknown): ProtocolError {
  if (error instanceof GitApiError && error.rateLimited)
    return rateLimited(error);
  if (error instanceof GitApiError) {
    const code =
      error.status === 401 || error.status === 403
        ? 'GITHUB_FORBIDDEN'
        : error.status === 404
          ? 'GITHUB_NOT_FOUND'
          : error.status === 405 || error.status === 409
            ? 'GITHUB_NOT_MERGEABLE'
            : error.status === 422
              ? 'GITHUB_INVALID'
              : 'GITHUB_UNAVAILABLE';
    return new ProtocolError('CONFLICT', error.message, {
      code,
      status: error.status,
    });
  }
  return error instanceof ProtocolError
    ? error
    : new ProtocolError('INTERNAL_ERROR', 'The code host could not be read.');
}

function notMergeable(blocker: PullRequestMergeBlocker): ProtocolError {
  return new ProtocolError(
    'CONFLICT',
    `The pull request cannot be merged (${blocker}).`,
    { code: 'PR_NOT_MERGEABLE', blocker },
  );
}

const prChanged = () =>
  new ProtocolError(
    'CONFLICT',
    'The pull request has new commits; check it again before merging.',
    { code: 'PR_CHANGED' },
  );

/** The host's answer to the merge itself; its text is never passed on. */
function mergeFailure(error: unknown): ProtocolError {
  if (error instanceof GitApiError && !error.rateLimited) {
    // The preflight just read it, so a 404 here is a credential that may read but not write.
    if (error.status === 403 || error.status === 404)
      return new ProtocolError(
        'CONFLICT',
        'The GitHub credential cannot merge: it needs write access to Contents and Pull requests.',
        { code: 'GITHUB_MERGE_FORBIDDEN', status: error.status },
      );
    if (error.status === 405) return notMergeable('protected');
    if (error.status === 409) return prChanged();
  }
  return hostFailure(error);
}

/** A stored row as a snapshot, for a write that changes only what Studio decides (a mark, a merge the host lags on). */
function snapshotOfRow(pr: PullRequestRow): PullRequestSnapshot {
  return {
    repo: pr.repo,
    number: pr.number,
    url: pr.url,
    title: pr.title,
    body: null,
    state: pr.state,
    draft: pr.draft,
    headRef: pr.headRef,
    baseRef: pr.baseRef,
    headSha: pr.headSha,
    authorLogin: pr.authorLogin,
    mergeableState: pr.mergeableState,
    mergedAt: pr.mergedAt,
    mergedByLogin: pr.mergedByLogin,
    mergeCommitSha: pr.mergeCommitSha,
    closedAt: pr.closedAt,
  };
}

type Ci = NonNullable<StoreOptions['ci']>;

const text = (value: unknown, max: number): string | null =>
  typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null;

export function createStudioGit(deps: StudioGitDeps): StudioGit {
  const { providers, connections, secrets, flow } = deps;
  /** The platform of the repository's host. */
  const platformOf = (repo: { readonly provider: string }) =>
    providers.platformOf(repo.provider);
  const projects = () => deps.projects();
  const conn = (): DatabaseConnection => projects().tx.read();
  const now = deps.now ?? (() => new Date());

  const readAuth = async (repo: RepoRow): Promise<GitAuth> =>
    (await connections.connectionAuth(repo)).auth;

  /** Whether Studio keeps every open pull request of the repository, linked or not: one of them has a live preview. */
  const tracks = (repo: RepoRow): Promise<boolean> =>
    hasLivePreviews(conn(), repo.repo);

  function webhookSecretOf(repo: RepoRow): string | null {
    return secrets.open(
      repo.webhookSecretSealed,
      GIT_SECRET_PURPOSES.repoWebhookSecret,
      [repo.id],
    );
  }

  /** The issue as the viewer may see it, else 404 (`DomainError` from the projects plugin, translated by callers). */
  async function visibleIssue(viewer: Viewer, idOrKey: string) {
    return projects().issueQueries.detail(viewer, idOrKey);
  }

  const canLink = (viewer: Viewer) =>
    viewer.permissions.scopes['pm.issues/edit'] !== 'none';

  async function canMerge(
    viewer: Viewer,
    issue: { ownerUserId: string; projectId: string | null },
  ): Promise<boolean> {
    if (viewer.actor.type === AGENT_KIND) return false;
    if (issue.ownerUserId === viewer.userId) return true;
    if (viewer.permissions.scopes['pm.issues/close'] === 'all') return true;
    if (!issue.projectId) return false;
    const access = await projects().projects.accessTo(viewer, {
      projectId: issue.projectId,
    });
    return access?.manage === true;
  }

  async function views(
    connection: DatabaseConnection,
    issueId: string,
  ): Promise<IssuePullRequest[]> {
    const rows = await pullRequestsOfIssue(connection, issueId);
    const kinds = projects().kinds;
    const userIds = [
      ...rows
        .filter(({ link }) => link.linkedByType === 'user')
        .map(({ link }) => link.linkedById),
      ...rows.map(({ pr }) => pr.mergedByUserId),
    ];
    const users = await kinds.names(connection, 'user', userIds);
    const agents = await kinds.names(
      connection,
      AGENT_KIND,
      rows
        .filter(({ link }) => link.linkedByType === 'agent')
        .map(({ link }) => link.linkedById),
    );
    const reachable = new Map<string, boolean>();
    for (const repoId of new Set(rows.map(({ pr }) => pr.repoId))) {
      const repo = await findRepoById(connection, repoId);
      reachable.set(
        repoId,
        !!repo?.connectionId && !!(await connections.find(repo.connectionId)),
      );
    }
    return rows.map(({ link, pr }) => ({
      ...pullRequestView(
        pr,
        pr.mergedByUserId ? (users.get(pr.mergedByUserId) ?? null) : null,
      ),
      linkedBy: {
        type: link.linkedByType,
        id: link.linkedById,
        name: !link.linkedById
          ? null
          : ((link.linkedByType === 'agent' ? agents : users).get(
              link.linkedById,
            ) ?? null),
      },
      autoCompleteDisabled: link.autoCompleteDisabled,
      linkedAt: link.createdAt,
      mergeBlocker:
        mergeBlockerOf(pr) ??
        (reachable.get(pr.repoId) ? null : ('notConfigured' as const)),
    }));
  }

  async function viewOf(
    issueId: string,
    pullRequestId: string,
  ): Promise<IssuePullRequest> {
    const found = (await views(conn(), issueId)).find(
      (item) => item.id === pullRequestId,
    );
    if (!found) throw notFound('The pull request link');
    return found;
  }

  /** The linked pull request and its repository; 404 when the issue does not link it. */
  async function linked(issueId: string, pullRequestId: string) {
    const connection = conn();
    const link = await findLink(connection, issueId, pullRequestId);
    const pr = link
      ? await findPullRequestById(connection, pullRequestId)
      : null;
    const repo = pr ? await findRepoById(connection, pr.repoId) : null;
    if (!link || !pr || !repo) throw notFound('The pull request link');
    return { link, pr, repo };
  }

  /**
   * A linked pull request the viewer may change on the host (whoever may change the issue's pull requests, as for
   * opening one), with the credential to change it as `actingUserId` when they authorized the app, else the connection.
   */
  async function changeable(
    viewer: Viewer,
    idOrKey: string,
    pullRequestId: string,
    actingUserId: string,
  ) {
    const issue = await visibleIssue(viewer, idOrKey);
    if (!canLink(viewer))
      throw forbidden('You may not change this issue’s pull requests.');
    const { link, pr, repo } = await linked(issue.id, pullRequestId);
    const acting = await connections
      .actingAuth(repo, actingUserId)
      .catch((error: unknown) => {
        throw hostFailure(error);
      });
    return { issue, link, pr, repo, auth: acting.auth };
  }

  /**
   * One line on the issue's activity, as the viewer (a person, through the CLI or an agent; the agent on a run), in
   * the activity log the projects plugin keeps and the issue timeline reads.
   */
  async function recordActivity(
    viewer: Viewer,
    issueId: string,
    action: string,
    pr: PullRequestRow,
    details: Readonly<Record<string, unknown>> = {},
  ): Promise<void> {
    const { actor } = viewer;
    await conn()
      .repository('pmActivities')
      .createOne({
        values: {
          id: randomUUID(),
          issueId,
          actorType: actor.type,
          actorId: actor.id,
          action,
          details: {
            pullRequestId: pr.id,
            repo: pr.repo,
            number: pr.number,
            url: pr.url,
            title: pr.title,
            ...details,
            ...(actor.via === undefined ? {} : { via: actor.via }),
            ...(actor.trace ? { trace: actor.trace } : {}),
          },
          createdAt: now(),
        },
      });
  }

  /** Ready to merge again (reopened, out of draft): checked soon, and the owners of its issues in review asked. */
  async function afterReady(pr: PullRequestRow): Promise<void> {
    if (pr.state !== 'open' || pr.draft) return;
    await scheduleMergeChecks(
      conn(),
      { pullRequestId: pr.id },
      new Date(now().getTime() + MERGE_CHECK_DELAY_SECONDS * 1000),
    );
    for (const link of await linksOfPullRequest(conn(), pr.id))
      await flow.requestMerges(link.issueId, pr.id);
  }

  async function readCi(
    auth: GitAuth,
    repo: RepoRow,
    sha: string,
    etags: { status: string | null; runs: string | null },
  ): Promise<Ci | null> {
    if (!sha)
      return { ciState: null, checks: [], statusEtag: null, runsEtag: null };
    const read = await platformOf(repo).getChecks(auth, repo.repo, sha, etags);
    if (read.notModified) return null;
    return {
      ciState: read.ciState,
      checks: read.checks,
      statusEtag: read.etags.status,
      runsEtag: read.etags.runs,
    };
  }

  /** The pull request and its checks, read in full. */
  async function readFull(
    repo: RepoRow,
    number: number,
    auth?: GitAuth,
  ): Promise<{
    snapshot: PullRequestSnapshot;
    pullEtag: string | null;
    /** The host's `mergeable`: false on a conflict, null while it computes. */
    mergeable: boolean | null;
    ci: Ci;
  }> {
    const credentials = auth ?? (await readAuth(repo));
    const pull = await platformOf(repo).getPullRequest(
      credentials,
      repo.repo,
      number,
      null,
    );
    if (pull.notModified) throw new GitApiError(500, 'GitHub answered 304.');
    const { snapshot, mergeable } = pull.body;
    return {
      snapshot,
      pullEtag: pull.etag,
      mergeable,
      ci: (await readCi(credentials, repo, snapshot.headSha, {
        status: null,
        runs: null,
      }))!,
    };
  }

  /** Reads one linked pull request with its validators; writes only when something changed. */
  async function pollPullRequest(
    repo: RepoRow,
    pr: PullRequestRow,
  ): Promise<void> {
    const auth = await readAuth(repo);
    const pull = await platformOf(repo).getPullRequest(
      auth,
      repo.repo,
      pr.number,
      pr.pullEtag,
    );
    const snapshot = pull.notModified ? snapshotOfRow(pr) : pull.body.snapshot;
    const headMoved = snapshot.headSha !== pr.headSha;
    const ci = await readCi(
      auth,
      repo,
      snapshot.headSha,
      headMoved
        ? { status: null, runs: null }
        : { status: pr.statusEtag, runs: pr.runsEtag },
    );
    if (pull.notModified && !ci) return;
    await flow.store(repo, snapshot, {
      ...(pull.notModified ? {} : { pullEtag: pull.etag }),
      ...(ci ? { ci } : {}),
    });
  }

  /** A new link: the owner is asked to merge it when the issue is in review, and the rest of Studio hears of it. */
  async function afterLink(issueId: string, pullRequestId: string) {
    await flow.requestMerges(issueId, pullRequestId);
    await deps.events?.emit({ type: 'linked', issueId, pullRequestId });
  }

  /**
   * Links the open pull requests on a branch a rule names to that issue, and suggests those whose title or body names
   * issue keys to those issues; answers how many links.
   */
  async function autoLink(
    repo: RepoRow,
    snapshots: readonly PullRequestSnapshot[],
  ): Promise<number> {
    let created = 0;
    for (const snapshot of snapshots) {
      if (snapshot.state !== 'open') continue;
      const connection = conn();
      const branchKey = issueKeyOfBranch(repo.branchRules, snapshot.headRef);
      const keys = branchKey ? [branchKey] : mentionedIssueKeys(snapshot);
      const issues: string[] = [];
      for (const key of keys) {
        const issue = await projects().issueContext.contextFor(connection, key);
        if (issue) issues.push(issue.id);
      }
      if (issues.length === 0) continue;
      const pr =
        (await findPullRequest(connection, repo.id, snapshot.number)) ??
        (await flow.store(repo, snapshot));
      for (const issueId of issues) {
        if (!branchKey) {
          // Only a suggestion: a key in a title is not proof the pull request does the issue's work.
          await insertSuggestion(connection, issueId, pr.id);
          continue;
        }
        if (
          await insertLink(connection, {
            issueId,
            pullRequestId: pr.id,
            linkedByType: 'system',
            linkedById: null,
          })
        ) {
          created += 1;
          await afterLink(issueId, pr.id);
        }
      }
    }
    return created;
  }

  /** What merging the pull request does to the issue, by the rule `flow.ts` moves it by. */
  async function outcomeOf(
    issue: IssueDetail,
    link: LinkRow,
  ): Promise<PullRequestMergeOutcome> {
    const keep = (
      keepReason: NonNullable<PullRequestMergeOutcome['keepReason']>,
    ): PullRequestMergeOutcome => ({
      statusKey: null,
      statusName: null,
      keepReason,
    });
    const category = issue.statuses.find(
      (status) => status.key === issue.statusKey,
    )?.category;
    if (category === 'done' || category === 'closed') return keep('terminal');
    if (link.autoCompleteDisabled) return keep('optedOut');
    const others = (await pullRequestsOfIssue(conn(), issue.id)).filter(
      (item) =>
        !item.link.autoCompleteDisabled &&
        item.pr.id !== link.pullRequestId &&
        item.pr.state === 'open',
    );
    if (others.length > 0) return keep('otherPrs');
    let target: string | null;
    try {
      target = (await projects().workflowEvents.target(MERGED_EVENT, issue.id))
        .to;
    } catch {
      // The event is not registered (an application without Studio's workflow binding): nothing moves it.
      target = null;
    }
    if (!target) return keep('noTransition');
    return {
      statusKey: target,
      statusName:
        issue.statuses.find((status) => status.key === target)?.name ?? target,
      keepReason: null,
    };
  }

  /**
   * The merge preflight: the issue the viewer may merge for, its link, and the pull request read from the host now
   * (stored like any read), with the credential the merge will use. Without one, `notConfigured` from what Studio has.
   */
  async function check(
    viewer: Viewer,
    idOrKey: string,
    pullRequestId: string,
  ): Promise<{
    preflight: PullRequestMergePreflight;
    issueId: string;
    repo: RepoRow;
    pr: PullRequestRow;
    auth: GitAuth;
  }> {
    const issue = await visibleIssue(viewer, idOrKey);
    if (!(await canMerge(viewer, issue)))
      throw forbidden(
        'Only the issue’s owner or a manager of its project may merge.',
      );
    const { link, pr, repo } = await linked(issue.id, pullRequestId);
    const statusAfter = await outcomeOf(issue, link);
    const acting = await connections
      .actingAuth(repo, viewer.userId)
      .catch((error: unknown) => {
        throw hostFailure(error);
      });
    if (acting.as === 'none')
      return {
        issueId: issue.id,
        repo,
        pr,
        auth: acting.auth,
        preflight: {
          blocker: mergeBlockerOf(pr) ?? 'notConfigured',
          method: 'squash',
          headSha: pr.headSha,
          baseRef: pr.baseRef,
          commitTitle: mergeCommitTitle(pr),
          statusAfter,
        },
      };
    let full;
    try {
      full = await readFull(repo, pr.number, acting.auth);
    } catch (error) {
      throw hostFailure(error);
    }
    const stored = await flow.store(repo, full.snapshot, {
      pullEtag: full.pullEtag,
      ci: full.ci,
    });
    return {
      issueId: issue.id,
      repo,
      pr: stored,
      auth: acting.auth,
      preflight: {
        blocker: mergeBlockerOf(
          { ...full.snapshot, ciState: full.ci.ciState },
          full.mergeable,
        ),
        method: 'squash',
        headSha: full.snapshot.headSha,
        baseRef: full.snapshot.baseRef,
        commitTitle: mergeCommitTitle(full.snapshot),
        statusAfter,
      },
    };
  }

  // --- Webhook deliveries ----------------------------------------------------------------------------------------

  async function receivePullRequest(
    repo: RepoRow,
    event: Extract<GitEvent, { type: 'pullRequest' }>,
  ) {
    const number = event.snapshot.number;
    const existing = await findPullRequest(conn(), repo.id, number);
    // Some deliveries leave mergeability out; keep what Studio knows rather than forget it.
    const snapshot: PullRequestSnapshot =
      !event.mergeableReported && existing
        ? { ...event.snapshot, mergeableState: existing.mergeableState }
        : event.snapshot;
    const links = existing ? await linksOfPullRequest(conn(), existing.id) : [];
    // Every pull request of a repository with live previews is kept: one closing removes its previews.
    const tracked = links.length === 0 && (await tracks(repo));
    if (links.length > 0 || tracked) await flow.store(repo, snapshot);
    const created = await autoLink(repo, [snapshot]);
    if (links.length === 0 && created === 0 && !tracked)
      return 'notLinked' as const;
    const pr = await findPullRequest(conn(), repo.id, number);
    if (pr?.state === 'open' && !pr.draft) {
      if (MERGE_CHECK_ACTIONS.has(event.action))
        await scheduleMergeChecks(
          conn(),
          { pullRequestId: pr.id },
          new Date(now().getTime() + MERGE_CHECK_DELAY_SECONDS * 1000),
        );
      // Ready again (opened, reopened, out of draft): the owners of its issues in review are asked to merge it.
      if (READY_ACTIONS.has(event.action))
        for (const link of links) await flow.requestMerges(link.issueId, pr.id);
    }
    return null;
  }

  async function receiveChecks(
    repo: RepoRow,
    sha: string,
    reported: PullRequestCiState | null,
  ) {
    const prs = await linkedOpenAtHead(conn(), repo.id, sha);
    if (prs.length === 0) return 'notLinked' as const;
    // Every check and status of the head together, as polling reads them; what the delivery says when the host cannot
    // be read (a private repository without a connection).
    const ci = await readAuth(repo)
      .then((auth) => readCi(auth, repo, sha, { status: null, runs: null }))
      .catch((): Ci | null =>
        reported === null
          ? null
          : { ciState: reported, checks: [], statusEtag: null, runsEtag: null },
      );
    if (ci)
      for (const pr of prs) await flow.store(repo, snapshotOfRow(pr), { ci });
    return null;
  }

  async function receivePush(
    repo: RepoRow,
    event: Extract<GitEvent, { type: 'push' }>,
  ) {
    await scheduleMergeChecks(
      conn(),
      { repoId: repo.id, baseRef: event.branch },
      new Date(now().getTime() + MERGE_CHECK_DELAY_SECONDS * 1000),
    );
    await deps.repoEvents?.emit({
      type: 'push',
      repoId: repo.id,
      repo: repo.repo,
      branch: event.branch,
      created: event.created,
      before: event.before,
      after: event.after,
    });
    return null;
  }

  async function receiveWorkflowRun(
    repo: RepoRow,
    event: Extract<GitEvent, { type: 'workflowRun' }>,
  ) {
    await deps.repoEvents?.emit({
      type: 'workflowRun',
      repoId: repo.id,
      repo: repo.repo,
      action: event.action,
      run: event.run,
    });
    return null;
  }

  const receiveWebhook = createWebhookReceiver({
    conn,
    providers,
    repoSecretOf: webhookSecretOf,
    connectionSecretOf: (row) => connections.webhookSecretOf(row),
    handlers: {
      pullRequest: receivePullRequest,
      checks: receiveChecks,
      push: receivePush,
      workflowRun: receiveWorkflowRun,
    },
    now,
  });

  // --- Repositories ------------------------------------------------------------------------------------------------

  async function repoOfResource(
    connection: DatabaseConnection,
    resource: Pick<ProjectResource, 'binding'>,
  ): Promise<RepoRow | null> {
    const binding = resource.binding;
    if (!binding) return null;
    const host = await connections.find(binding.connectionId);
    if (!host) return null;
    const row = await ensureRepo(connection, host.apiBaseUrl, binding.fullName);
    if (
      row.connectionId !== host.id ||
      row.externalId !== binding.repoId ||
      row.provider !== binding.provider
    ) {
      await updateRepo(connection, row.id, {
        connectionId: host.id,
        externalId: binding.repoId,
        provider: binding.provider,
        // What the old connection saw says nothing about the new one.
        listEtag: null,
      });
      return findRepoById(connection, row.id);
    }
    return row;
  }

  /** Whether the project has a working directory linked to a repository of a connection. */
  async function hasLinkedRepo(viewer: Viewer, projectId: string | null) {
    if (!projectId) return false;
    const access = await projects().projects.accessTo(viewer, { projectId });
    if (!access?.visible) return false;
    if ((await connections.choices()).length === 0) return false;
    const project = await projects().projects.get(viewer, projectId);
    return project.resources.some(
      (item) => item.type === 'gitRepo' && item.binding !== null,
    );
  }

  async function resourceRepo(viewer: Viewer, resourceId: string) {
    const access = await projects().projects.accessTo(viewer, { resourceId });
    if (!access?.visible) throw notFound('The working directory');
    const project = await projects().projects.get(viewer, access.projectId);
    const resource = project.resources.find((item) => item.id === resourceId);
    if (!resource) throw notFound('The working directory');
    return { access, resource, project };
  }

  async function settingsOf(
    row: RepoRow | null,
    manage: boolean,
  ): Promise<GitRepoSettings> {
    const healthy = !!row && webhookHealthy(row);
    const seconds = deps.pollSeconds ?? { normal: 60, fallback: 600 };
    const host = row?.connectionId
      ? await connections.find(row.connectionId)
      : null;
    return {
      repo: row?.repo ?? null,
      webUrl:
        row && host ? `${host.webUrl.replace(/\/+$/u, '')}/${row.repo}` : null,
      connection: host ? choiceOf(host) : null,
      branchRules: row?.branchRules ?? [],
      wakeOnChecks: row?.wakeOnChecks ?? true,
      wakeOnConflict: row?.wakeOnConflict ?? true,
      polledAt: row?.polledAt ?? null,
      pollError: row?.pollError ?? null,
      webhookUrl:
        manage && row
          ? (deps.webhookUrl?.(row.id) ??
            `/api/webhooks/github/repositories/${encodeURIComponent(row.id)}`)
          : null,
      hasWebhookSecret: Boolean(row?.webhookSecretSealed),
      lastDelivery: row?.lastDelivery ?? null,
      lastReceivedAt: row?.lastReceivedAt ?? null,
      webhookHealthy: healthy,
      pollSeconds: healthy ? seconds.fallback : seconds.normal,
    };
  }

  /** The repository `nb-studio pr open` opens on: the one named, else the project's first linked one. */
  async function openTarget(
    issue: IssueDetail,
    named: string | null,
  ): Promise<{
    repo: RepoRow;
    resource: { readonly defaultRef: string | null };
  }> {
    const refuse = (message: string, code: string) =>
      new ProtocolError('INVALID_REQUEST', message, { code });
    if (!issue.projectId)
      throw refuse(
        'The issue has no project, so no repository to open a pull request on.',
        'NO_REPOSITORY',
      );
    // The issue's context, not the project as the viewer sees it: an agent may open on its issue's repository without
    // seeing the project itself.
    const context = await projects().issueContext.contextFor(conn(), issue.id);
    const linkedRepos = (context?.project?.repos ?? []).filter(
      (resource) => resource.type === 'gitRepo' && resource.binding,
    );
    const resource = named
      ? linkedRepos.find(
          (item) =>
            item.binding?.fullName.toLowerCase() === named.toLowerCase(),
        )
      : linkedRepos[0];
    if (!resource)
      throw refuse(
        named
          ? `${named} is not a linked repository of the issue's project.`
          : "The issue's project has no repository linked to a connection.",
        'NO_REPOSITORY',
      );
    const repo = await repoOfResource(conn(), resource);
    if (!repo)
      throw refuse("The repository's connection was removed.", 'NO_REPOSITORY');
    return { repo, resource };
  }

  /** A working directory's repository, through its binding, with its default branch; null when it links none. */
  async function repoOfResourceId(
    resourceId: string,
  ): Promise<{ readonly repo: RepoRow; readonly defaultRef: string } | null> {
    const row = await conn()
      .query.selectFrom('pmProjectResources')
      .select([
        'defaultRef',
        'bindingProvider',
        'bindingConnectionId',
        'bindingRepoId',
        'bindingFullName',
      ])
      .where('id', '=', resourceId)
      .executeTakeFirst<Record<string, unknown>>();
    const column = (value: unknown): string | null =>
      typeof value === 'string' && value ? value : null;
    const connectionId = column(row?.bindingConnectionId);
    const fullName = column(row?.bindingFullName);
    const binding =
      connectionId && fullName
        ? {
            provider: column(row?.bindingProvider) ?? 'github',
            connectionId,
            repoId: column(row?.bindingRepoId) ?? '',
            fullName,
          }
        : null;
    const repo = binding ? await repoOfResource(conn(), { binding }) : null;
    return repo
      ? { repo, defaultRef: column(row?.defaultRef) ?? 'main' }
      : null;
  }

  async function verifyCommit(
    resourceId: string,
    sha: string,
  ): Promise<CommitVerification> {
    const found = await repoOfResourceId(resourceId);
    if (!found) return { ok: false, reason: 'noRepository' };
    const { repo } = found;
    try {
      const auth = await readAuth(repo);
      const platform = platformOf(repo);
      const heads = await platform.openPullRequestsAt(auth, repo.repo, sha);
      if (heads.length > 0) {
        // What the host just said is stored as any read is, and a branch a rule names links its issue; CI is
        // deploying it, so the pull request is kept, linked or not.
        for (const snapshot of heads) await flow.store(repo, snapshot);
        await autoLink(repo, heads);
        const ids: string[] = [];
        for (const snapshot of heads) {
          const stored = await findPullRequest(
            conn(),
            repo.id,
            snapshot.number,
          );
          if (stored) ids.push(stored.id);
        }
        return { ok: true, ref: null, pullRequestIds: ids };
      }
      const branch = found.defaultRef;
      if (await platform.branchContains(auth, repo.repo, branch, sha))
        return { ok: true, ref: branch, pullRequestIds: [] };
      const tags = await platform.tagsAt(auth, repo.repo, sha);
      if (tags[0]) return { ok: true, ref: tags[0], pullRequestIds: [] };
      const branches = await platform.branchesAt(auth, repo.repo, sha);
      if (branches[0])
        return { ok: true, ref: branches[0], pullRequestIds: [] };
      return { ok: false, reason: 'notInRepository' };
    } catch (error) {
      throw hostFailure(error);
    }
  }

  async function commitsContained(
    resourceId: string,
    head: string,
    shas: readonly string[],
  ): Promise<ReadonlySet<string> | null> {
    const found = await repoOfResourceId(resourceId);
    if (!found) return null;
    const contained = new Set<string>();
    try {
      const auth = await readAuth(found.repo);
      for (const sha of new Set(shas))
        if (
          await platformOf(found.repo).commitContains(
            auth,
            found.repo.repo,
            head,
            sha,
          )
        )
          contained.add(sha);
    } catch (error) {
      throw hostFailure(error);
    }
    return contained;
  }

  async function updatePullRequestSection(
    pullRequestId: string,
    marker: string,
    text: string | null,
  ): Promise<boolean> {
    const pr = await findPullRequestById(conn(), pullRequestId);
    const repo = pr ? await findRepoById(conn(), pr.repoId) : null;
    if (!pr || !repo) return false;
    try {
      const auth = await readAuth(repo);
      const read = await platformOf(repo).getPullRequest(
        auth,
        repo.repo,
        pr.number,
        null,
      );
      if (read.notModified) return false;
      const body = read.body.snapshot.body ?? '';
      const next = withPullRequestSection(body, marker, text);
      if (next === body) return false;
      await platformOf(repo).updatePullRequestBody(
        auth,
        repo.repo,
        pr.number,
        next,
      );
      return true;
    } catch (error) {
      throw hostFailure(error);
    }
  }

  return {
    verifyCommit,
    commitsContained,
    updatePullRequestSection,

    async list(viewer, idOrKey) {
      const issue = await visibleIssue(viewer, idOrKey);
      const data = await views(conn(), issue.id);
      if (data.length === 0 && !(await hasLinkedRepo(viewer, issue.projectId)))
        return {
          data,
          suggestions: [],
          canMerge: false,
          canLink: false,
          applicable: false,
        };
      const mayLink = canLink(viewer);
      return {
        data,
        suggestions: mayLink ? await suggestionsOfIssue(conn(), issue.id) : [],
        canMerge: await canMerge(viewer, issue),
        canLink: mayLink,
        applicable: true,
      };
    },

    async link(viewer, idOrKey, url, by) {
      const ref = parsePullRequestUrl(url);
      if (!ref)
        throw new ProtocolError(
          'INVALID_REQUEST',
          'url must be a pull request URL such as https://github.com/owner/repo/pull/12.',
          { code: 'INVALID_PR_URL' },
        );
      const issue = await visibleIssue(viewer, idOrKey);
      if (!canLink(viewer))
        throw forbidden('You may not change this issue’s pull requests.');
      // The issue's project may link the repository through a connection: Studio reads it that way.
      const context = await projects().issueContext.contextFor(
        conn(),
        issue.id,
      );
      for (const resource of context?.project?.repos ?? [])
        if (resource.binding?.fullName.toLowerCase() === ref.repo.toLowerCase())
          await repoOfResource(conn(), resource);
      const repo = await ensureRepo(
        conn(),
        apiBaseUrlOf(ref.origin, deps.apiBaseUrls),
        ref.repo,
      );
      // The host could not be read (no connection for a private repository, say): a minimal open row the poller fills
      // in.
      const full = await readFull(repo, ref.number).catch(() => null);
      const existing = await findPullRequest(conn(), repo.id, ref.number);
      const pr = full
        ? await flow.store(repo, full.snapshot, {
            pullEtag: full.pullEtag,
            ci: full.ci,
          })
        : (existing ??
          (await flow.store(repo, {
            repo: ref.repo,
            number: ref.number,
            url: ref.url,
            title: '',
            body: null,
            state: 'open',
            draft: false,
            headRef: '',
            baseRef: '',
            headSha: '',
            authorLogin: '',
            mergeableState: null,
            mergedAt: null,
            mergedByLogin: null,
            mergeCommitSha: null,
            closedAt: null,
          })));
      const created = await insertLink(conn(), {
        issueId: issue.id,
        pullRequestId: pr.id,
        linkedByType: by.type,
        linkedById: by.id,
      });
      if (created) await afterLink(issue.id, pr.id);
      return { pullRequest: await viewOf(issue.id, pr.id), created };
    },

    async open(viewer, idOrKey, input, by, actingUserId) {
      const issue = await visibleIssue(viewer, idOrKey);
      if (!canLink(viewer))
        throw forbidden('You may not change this issue’s pull requests.');
      const title = text(input.title, PR_TITLE_MAX);
      if (!title)
        throw new ProtocolError(
          'INVALID_REQUEST',
          'A pull request needs a title.',
          {
            code: 'INVALID_PR_TITLE',
          },
        );
      if (typeof input.body === 'string' && input.body.length > PR_BODY_MAX)
        throw new ProtocolError(
          'INVALID_REQUEST',
          `A pull request body is at most ${PR_BODY_MAX} characters.`,
          { code: 'INVALID_PR_BODY' },
        );
      const { repo, resource } = await openTarget(issue, text(input.repo, 255));
      const head =
        text(input.head, 255) ??
        branchOf(repo.branchRules[0], issue.identifier);
      const acting = await connections.actingAuth(repo, actingUserId);
      let read;
      try {
        // The working directory's base branch (the picker fills it with the repository's default branch).
        const base = text(input.base, 255) ?? resource.defaultRef ?? 'main';
        read = await platformOf(repo).openPullRequest(acting.auth, repo.repo, {
          title,
          body: typeof input.body === 'string' ? input.body : '',
          head,
          base,
          draft: input.draft === true,
        });
      } catch (error) {
        if (
          error instanceof GitApiError &&
          error.status === 422 &&
          !head.includes(':')
        ) {
          const sha = await platformOf(repo)
            .branchSha(acting.auth, repo.repo, head)
            .catch(() => undefined);
          if (sha === null)
            throw new ProtocolError(
              'CONFLICT',
              `The head branch ${head} is not on GitHub. Push the branch successfully, then retry opening the pull request. If push authentication fails, check Settings > Git and retry the run with renewed repository access.`,
              { code: 'GITHUB_INVALID', status: 422 },
            );
        }
        throw hostFailure(error);
      }
      const ci = await readCi(acting.auth, repo, read.snapshot.headSha, {
        status: null,
        runs: null,
      }).catch(() => null);
      const pr = await flow.store(repo, read.snapshot, ci ? { ci } : {});
      // Linked at creation, whatever its branch: the issue's pull request from the start.
      if (
        await insertLink(conn(), {
          issueId: issue.id,
          pullRequestId: pr.id,
          linkedByType: by.type,
          linkedById: by.id,
        })
      )
        await afterLink(issue.id, pr.id);
      if (pr.state === 'open' && !pr.draft)
        await scheduleMergeChecks(
          conn(),
          { pullRequestId: pr.id },
          new Date(now().getTime() + MERGE_CHECK_DELAY_SECONDS * 1000),
        );
      return viewOf(issue.id, pr.id);
    },

    async edit(viewer, idOrKey, pullRequestId, input, actingUserId) {
      const refuse = (message: string, code: string) =>
        new ProtocolError('INVALID_REQUEST', message, { code });
      const title =
        input.title === undefined ? undefined : text(input.title, PR_TITLE_MAX);
      if (title === null)
        throw refuse('A pull request needs a title.', 'INVALID_PR_TITLE');
      if (
        input.body !== undefined &&
        (typeof input.body !== 'string' || input.body.length > PR_BODY_MAX)
      )
        throw refuse(
          `A pull request body is text of at most ${PR_BODY_MAX} characters.`,
          'INVALID_PR_BODY',
        );
      const base = input.base === undefined ? undefined : text(input.base, 255);
      if (base === null)
        throw refuse('base names a branch.', 'INVALID_PR_BASE');
      if (input.draft !== undefined && typeof input.draft !== 'boolean')
        throw refuse('draft is true or false.', 'INVALID_PR_EDIT');
      const { body, draft } = input;
      if (
        title === undefined &&
        body === undefined &&
        base === undefined &&
        draft === undefined
      )
        throw refuse(
          'Say what to change: title, body, base or draft.',
          'INVALID_PR_EDIT',
        );
      const { issue, pr, repo, auth } = await changeable(
        viewer,
        idOrKey,
        pullRequestId,
        actingUserId,
      );
      const fields: PullRequestEditField[] = [];
      if (title !== undefined && title !== pr.title) fields.push('title');
      if (body !== undefined) fields.push('body');
      if (base !== undefined && base !== pr.baseRef) fields.push('base');
      if (draft !== undefined && draft !== pr.draft)
        fields.push(draft ? 'draft' : 'ready');
      let snapshot: PullRequestSnapshot | null = null;
      try {
        const platform = platformOf(repo);
        if (title !== undefined || body !== undefined || base !== undefined)
          snapshot = await platform.updatePullRequest(
            auth,
            repo.repo,
            pr.number,
            {
              ...(title === undefined ? {} : { title }),
              ...(body === undefined ? {} : { body }),
              ...(base === undefined ? {} : { base }),
            },
          );
        if (draft !== undefined)
          snapshot = await platform.setPullRequestDraft(
            auth,
            repo.repo,
            pr.number,
            draft,
          );
      } catch (error) {
        throw hostFailure(error);
      }
      const stored = snapshot ? await flow.store(repo, snapshot) : pr;
      if (fields.length > 0)
        await recordActivity(viewer, issue.id, PR_ACTIVITIES.edited, stored, {
          fields,
          ...(fields.includes('title') ? { previousTitle: pr.title } : {}),
        });
      if (fields.includes('ready') || fields.includes('base'))
        await afterReady(stored);
      return viewOf(issue.id, pullRequestId);
    },

    async close(viewer, idOrKey, pullRequestId, input, actingUserId) {
      const reason = text(input.reason, PR_CLOSE_REASON_MAX);
      if (!reason)
        throw new ProtocolError(
          'INVALID_REQUEST',
          'Say why the pull request is closed (`reason`).',
          { code: 'INVALID_CLOSE_REASON' },
        );
      const { issue, pr, repo, auth } = await changeable(
        viewer,
        idOrKey,
        pullRequestId,
        actingUserId,
      );
      if (pr.state !== 'open')
        throw new ProtocolError(
          'CONFLICT',
          `The pull request is ${pr.state} already.`,
          { code: 'PR_NOT_OPEN' },
        );
      let snapshot: PullRequestSnapshot;
      try {
        // The reason first, so it stands above the close on the pull request's conversation.
        await platformOf(repo).commentOnPullRequest(
          auth,
          repo.repo,
          pr.number,
          `Closed for ${issue.identifier}: ${reason}`,
        );
        snapshot = await platformOf(repo).updatePullRequest(
          auth,
          repo.repo,
          pr.number,
          { state: 'closed' },
        );
      } catch (error) {
        throw hostFailure(error);
      }
      const stored = await flow.store(repo, snapshot);
      const unlink = input.unlink === true;
      await recordActivity(viewer, issue.id, PR_ACTIVITIES.closed, stored, {
        reason,
        ...(unlink ? { unlinked: true } : {}),
      });
      const view = await viewOf(issue.id, pullRequestId);
      if (unlink && (await deleteLink(conn(), issue.id, pullRequestId)))
        await deps.events?.emit({
          type: 'unlinked',
          issueId: issue.id,
          pullRequestId,
        });
      return view;
    },

    async reopen(viewer, idOrKey, pullRequestId, actingUserId) {
      const { issue, pr, repo, auth } = await changeable(
        viewer,
        idOrKey,
        pullRequestId,
        actingUserId,
      );
      if (pr.state !== 'closed')
        throw new ProtocolError(
          'CONFLICT',
          `Only a closed pull request is reopened; this one is ${pr.state}.`,
          { code: 'PR_NOT_CLOSED' },
        );
      let snapshot: PullRequestSnapshot;
      try {
        snapshot = await platformOf(repo).updatePullRequest(
          auth,
          repo.repo,
          pr.number,
          { state: 'open' },
        );
      } catch (error) {
        throw hostFailure(error);
      }
      const stored = await flow.store(repo, snapshot);
      await recordActivity(viewer, issue.id, PR_ACTIVITIES.reopened, stored);
      await afterReady(stored);
      return viewOf(issue.id, pullRequestId);
    },

    async unlink(viewer, idOrKey, pullRequestId) {
      const issue = await visibleIssue(viewer, idOrKey);
      if (!canLink(viewer))
        throw forbidden('You may not change this issue’s pull requests.');
      if (!(await deleteLink(conn(), issue.id, pullRequestId)))
        throw notFound('The pull request link');
      await deps.events?.emit({
        type: 'unlinked',
        issueId: issue.id,
        pullRequestId,
      });
    },

    async dismissSuggestion(viewer, idOrKey, pullRequestId) {
      const issue = await visibleIssue(viewer, idOrKey);
      if (!canLink(viewer))
        throw forbidden('You may not change this issue’s pull requests.');
      if (!(await dismissSuggestion(conn(), issue.id, pullRequestId)))
        throw notFound('The suggestion');
    },

    async setAutoComplete(viewer, idOrKey, pullRequestId, disabled) {
      if (typeof disabled !== 'boolean')
        throw new ProtocolError(
          'INVALID_REQUEST',
          'autoCompleteDisabled is true or false.',
        );
      const issue = await visibleIssue(viewer, idOrKey);
      if (!canLink(viewer))
        throw forbidden('You may not change this issue’s pull requests.');
      const { link } = await linked(issue.id, pullRequestId);
      await setAutoComplete(conn(), link.id, disabled);
      return viewOf(issue.id, pullRequestId);
    },

    async refresh(viewer, idOrKey, pullRequestId) {
      const issue = await visibleIssue(viewer, idOrKey);
      const { repo } = await linked(issue.id, pullRequestId);
      const pr = await findPullRequestById(conn(), pullRequestId);
      if (!pr) throw notFound('The pull request');
      let full;
      try {
        full = await readFull(repo, pr.number);
      } catch (error) {
        throw hostFailure(error);
      }
      await flow.store(repo, full.snapshot, {
        pullEtag: full.pullEtag,
        ci: full.ci,
      });
      return viewOf(issue.id, pullRequestId);
    },

    async preflight(viewer, idOrKey, pullRequestId) {
      return (await check(viewer, idOrKey, pullRequestId)).preflight;
    },

    async merge(viewer, idOrKey, pullRequestId, expectedHeadSha) {
      if (typeof expectedHeadSha !== 'string' || expectedHeadSha.trim() === '')
        throw new ProtocolError(
          'INVALID_REQUEST',
          'expectedHeadSha must be the head commit shown when confirming.',
          { code: 'INVALID_EXPECTED_HEAD' },
        );
      const { preflight, repo, pr, issueId, auth } = await check(
        viewer,
        idOrKey,
        pullRequestId,
      );
      if (preflight.blocker) throw notMergeable(preflight.blocker);
      if (preflight.headSha !== expectedHeadSha.trim()) throw prChanged();
      let merged: { sha: string };
      try {
        merged = await platformOf(repo).mergePullRequest(
          auth,
          repo.repo,
          pr.number,
          {
            sha: preflight.headSha,
            commitTitle: preflight.commitTitle,
          },
        );
      } catch (error) {
        throw mergeFailure(error);
      }
      // The squash commit the host made: deployment marks look for it, as the squashed head never reaches the base.
      const mergeCommitSha = /^[0-9a-f]{7,64}$/u.test(merged.sha)
        ? merged.sha
        : null;
      const full = await readFull(repo, pr.number).catch(() => null);
      const snapshot: PullRequestSnapshot =
        full?.snapshot.state === 'merged'
          ? {
              ...full.snapshot,
              mergeCommitSha: full.snapshot.mergeCommitSha ?? mergeCommitSha,
            }
          : {
              ...(full?.snapshot ?? snapshotOfRow(pr)),
              state: 'merged',
              mergedAt: now().toISOString(),
              mergeCommitSha,
            };
      await flow.store(repo, snapshot, {
        mergedByUserId: viewer.userId,
        ...(full ? { pullEtag: full.pullEtag } : {}),
      });
      return viewOf(issueId, pullRequestId);
    },

    async markMerged(viewer, idOrKey, pullRequestId) {
      const issue = await visibleIssue(viewer, idOrKey);
      if (!(await canMerge(viewer, issue)))
        throw forbidden(
          'Only the issue’s owner or a manager of its project may mark it merged.',
        );
      const { repo, pr } = await linked(issue.id, pullRequestId);
      if (pr.state === 'merged')
        throw new ProtocolError(
          'CONFLICT',
          'The pull request is merged already.',
          {
            code: 'PR_NOT_OPEN',
          },
        );
      await flow.store(
        repo,
        {
          ...snapshotOfRow(pr),
          state: 'merged',
          mergedAt: new Date().toISOString(),
          // Unknown: merged outside Studio. Deployment marks fall back to the pull request's head.
          mergeCommitSha: null,
        },
        { mergedByUserId: viewer.userId, mergedManually: true },
      );
      return viewOf(issue.id, pullRequestId);
    },

    async repoSettings(viewer, resourceId) {
      const { access, resource } = await resourceRepo(viewer, resourceId);
      // A manager sets up the webhook, whose address names the repository's row: it exists from then on.
      const row = access.manage
        ? await repoOfResource(conn(), resource)
        : resource.binding
          ? await findRepo(
              conn(),
              (await connections.find(resource.binding.connectionId))
                ?.apiBaseUrl ?? '',
              resource.binding.fullName,
            )
          : null;
      return settingsOf(row, access.manage);
    },

    async updateRepoSettings(viewer, resourceId, input) {
      const { access, resource } = await resourceRepo(viewer, resourceId);
      if (!access.manage)
        throw forbidden('Only the project’s managers change its repositories.');
      const row = await repoOfResource(conn(), resource);
      if (!row)
        throw new ProtocolError(
          'INVALID_REQUEST',
          'This working directory is not linked to a repository of a connection.',
          { code: 'NOT_LINKED' },
        );
      const values: Record<string, unknown> = { updatedById: viewer.userId };
      if (input.webhookSecret !== undefined) {
        const secret = input.webhookSecret?.trim() ?? '';
        if (secret === '') {
          values.webhookSecretSealed = null;
        } else {
          if (
            secret.length < WEBHOOK_SECRET_MIN ||
            secret.length > WEBHOOK_SECRET_MAX
          )
            throw new ProtocolError(
              'INVALID_REQUEST',
              `A webhook secret is ${WEBHOOK_SECRET_MIN} to ${WEBHOOK_SECRET_MAX} characters.`,
              { code: 'INVALID_WEBHOOK_SECRET' },
            );
          values.webhookSecretSealed = secrets.seal(
            secret,
            GIT_SECRET_PURPOSES.repoWebhookSecret,
            [row.id],
          );
        }
        // Deliveries signed with the old secret say nothing about the new one.
        values.webhookAt = null;
        values.webhookEvent = null;
        values.webhookStatus = null;
        values.webhookReason = null;
      }
      if (input.branchRules !== undefined) {
        const rules = Array.isArray(input.branchRules)
          ? input.branchRules.map((rule) =>
              typeof rule === 'string' ? rule.trim() : '',
            )
          : null;
        const problem =
          !rules || rules.length === 0 || rules.length > BRANCH_RULES_MAX
            ? `A repository has 1 to ${BRANCH_RULES_MAX} branch rules.`
            : (rules.map(branchRuleProblem).find(Boolean) ?? null);
        if (problem || !rules)
          throw new ProtocolError('INVALID_REQUEST', problem ?? '', {
            code: 'INVALID_BRANCH_RULE',
          });
        values.branchRules = [...new Set(rules)];
      }
      if (typeof input.wakeOnChecks === 'boolean')
        values.wakeOnChecks = input.wakeOnChecks;
      if (typeof input.wakeOnConflict === 'boolean')
        values.wakeOnConflict = input.wakeOnConflict;
      await updateRepo(conn(), row.id, values);
      return settingsOf(await findRepoById(conn(), row.id), true);
    },

    async marks(viewer, issueIds) {
      const ids = [...new Set(issueIds)].slice(0, MARKS_MAX);
      const all = await pullRequestsOfIssues(conn(), ids);
      const result: Record<string, PullRequestMark> = {};
      // Whoever sees every issue needs no check per issue.
      const everything = viewer.permissions.scopes['pm.issues/view'] === 'all';
      for (const [issueId, rows] of all) {
        if (rows.length === 0) continue;
        if (!everything)
          try {
            await visibleIssue(viewer, issueId);
          } catch {
            continue;
          }
        const prs = rows.map(({ pr }) => pr);
        const open = prs.filter((pr) => pr.state === 'open');
        const merged = prs.filter((pr) => pr.state === 'merged').length;
        const first = open[0] ?? prs[0];
        const ci = open.map((pr) => pr.ciState);
        result[issueId] = {
          count: prs.length,
          merged,
          state:
            merged === prs.length
              ? 'merged'
              : open.length > 0
                ? 'open'
                : 'closed',
          ciState: ci.includes('failure')
            ? 'failure'
            : ci.includes('pending')
              ? 'pending'
              : ci.length > 0 && ci.every((state) => state === 'success')
                ? 'success'
                : null,
          conflict: open.some((pr) => pr.mergeableState === 'dirty'),
          url: first.url,
          label: `${first.repo}#${first.number}`,
        };
      }
      return result;
    },

    async projectSettings(viewer, projectId) {
      const access = await projects().projects.accessTo(viewer, { projectId });
      if (!access?.visible) throw notFound('The project');
      return { attribution: await projectAttribution(conn(), projectId) };
    },

    async setProjectSettings(viewer, projectId, input) {
      const access = await projects().projects.accessTo(viewer, { projectId });
      if (!access?.visible) throw notFound('The project');
      if (!access.manage)
        throw forbidden('Only the project’s managers change its git settings.');
      if (
        !(COMMIT_ATTRIBUTIONS as readonly unknown[]).includes(input.attribution)
      )
        throw new ProtocolError(
          'INVALID_REQUEST',
          'attribution is withAgent or meOnly.',
        );
      const attribution = input.attribution as CommitAttribution;
      await setProjectAttribution(
        conn(),
        projectId,
        attribution,
        viewer.userId,
      );
      return { attribution };
    },

    repoOfResource,

    async syncRepos() {
      const rows = await conn()
        .query.selectFrom('pmProjectResources')
        .select([
          'bindingProvider',
          'bindingConnectionId',
          'bindingRepoId',
          'bindingFullName',
        ])
        .where('bindingConnectionId', 'is not', null)
        .execute();
      for (const row of rows) {
        const binding = bindingOfRow(row);
        if (binding) await repoOfResource(conn(), { binding });
      }
    },

    async pollRepo(repo) {
      try {
        const acting = await connections.connectionAuth(repo);
        // Without a connection only the linked pull requests are read: a public repository, linked by hand.
        if (acting.as === 'connection') {
          const list = await platformOf(repo).listPullRequests(
            acting.auth,
            repo.repo,
            repo.listEtag,
          );
          if (!list.notModified) {
            // A repository with live previews keeps every open pull request, so one closing removes its previews.
            if (await tracks(repo))
              for (const snapshot of list.body)
                if (
                  snapshot.state === 'open' &&
                  !(await findPullRequest(conn(), repo.id, snapshot.number))
                )
                  await flow.store(repo, snapshot);
            await autoLink(repo, list.body);
            await updateRepo(conn(), repo.id, { listEtag: list.etag });
          }
        }
        const open = (await tracks(repo))
          ? await openPullRequestsOf(conn(), repo.id)
          : await linkedOpenPullRequests(conn(), repo.id);
        for (const pr of open) await pollPullRequest(repo, pr);
        await updateRepo(conn(), repo.id, {
          polledAt: new Date(),
          pollError: null,
        });
        return { retryAt: null };
      } catch (error) {
        await updateRepo(conn(), repo.id, {
          polledAt: new Date(),
          pollError: (error instanceof Error
            ? error.message
            : String(error)
          ).slice(0, 500),
        });
        return {
          retryAt: error instanceof GitApiError ? error.retryAt : null,
        };
      }
    },

    async runMergeChecks(at = now()) {
      let read = 0;
      for (const { pr, attempts } of await dueMergeChecks(
        conn(),
        at,
        MERGE_CHECK_BATCH,
      )) {
        const next = attempts + 1;
        const again = (retry: boolean) =>
          retry && next < MERGE_CHECK_ATTEMPTS
            ? setMergeCheck(
                conn(),
                pr.id,
                new Date(at.getTime() + MERGE_CHECK_RETRY_SECONDS * 1000),
                next,
              )
            : setMergeCheck(conn(), pr.id, null, 0);
        try {
          const repo = await findRepoById(conn(), pr.repoId);
          if (pr.state !== 'open' || !repo) {
            await again(false);
            continue;
          }
          const full = await readFull(repo, pr.number);
          read += 1;
          await flow.store(repo, full.snapshot, {
            pullEtag: full.pullEtag,
            ci: full.ci,
          });
          // Still computing: read it again later.
          await again(full.mergeable === null);
        } catch {
          // No connection for a private repository, the host unreachable: try again later, then give up quietly.
          await again(true).catch(() => undefined);
        }
      }
      return read;
    },

    receiveWebhook,
  };
}

import {
  commentGuards,
  commentGuardId,
  recentCommentRunCount,
} from '../agents/comment-guard.js';
import { readManagerSettings } from '../agents/manager/settings.js';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
/**
 * What a pull request's state does to its issues. Every read of the code host ends here (`store`): a webhook delivery, the poller, a merge check, a link,
 * a refresh, a merge preflight, a merge or a person marking it merged.
 *
 * - **Merged**: for each linked issue whose counted pull requests (links without `autoCompleteDisabled`, closed ones left out) are now all
 *   merged, Studio fires the status event `studio.merged` (`projects.statusEvents.fire`); the issue moves to Done from
 *   In progress, Blocked or In review (`workflow.ts`). The move is the
 *   system's; the activity names the merging person when Studio knows them (Studio merged it, a person marked it, or
 *   GitHub's `merged_by` login is a Studio username) and notes `owner/name#12 merged`. Merge cards settle `merged`, and
 *   the followers of every linked issue hear it (`pr_merged`, `notices.ts`).
 * - **Closed** without a merge: merge cards settle `closed`.
 * - **Signals**, while it is open: failed required checks and a conflict (`mergeableState = dirty`) wake the agent
 *   executing each linked issue (an issue run input, trigger `prChecksFailed` / `prConflict`), once per effective round and issue, at
 *   most `SIGNAL_WAKE_LIMIT` consecutive delivered failures; after that the owner is told instead. Passing checks or a known mergeable
 *   state clear the count. A repository can turn each signal off. Checks wake the agent only once every required check of
 *   the head has finished, and a failed reference check (`RepoRow.referenceChecks`) never does (`checkSummaryOf`). The
 *   input names every failed check and carries why it failed (`GitFlowDeps.explain`, read before the transaction):
 *   annotations and the failing part of each log, or where another CI keeps it.
 *   Required checks that all finished without failure wake it once per effective round and issue (`prChecksPassed`).
 *
 * Writes run in one projects transaction, so the issue moves and the stored state commit together; inbox items go out
 * after the commit.
 */
import type {
  Actor,
  Projects,
  ProjectsTx,
} from '@nocobase/app-plugin-projects/server/tokens';
import type { DatabaseConnection } from '@nocobase/db';

import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';

import {
  MERGED_EVENT,
  SIGNAL_WAKE_LIMIT,
  checkSummaryOf,
  isReferenceCheck,
  type CheckSummary,
  type GitCheck,
  type PullRequestCiState,
  type PullRequestTrigger,
} from '../../shared/git.js';
import { ISSUE_SUBJECT } from '../agents/catalog/triggers.js';
import { AGENT_KIND, agentsTx } from '../agents/tx.js';
import { validIssueOwner } from '../agents/execution-identity.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import { readOwnerHandoff } from '../issues/owner-handoff.js';
import type { StudioInboxPort } from '../inbox/port.js';
import {
  IN_REVIEW,
  sendMergeCard,
  sendSignalStopped,
  settleMergeCards,
  type CardIssue,
} from './cards.js';
import type { FailedCheck, PullRequestSnapshot } from './platform.js';
import { GIT_NOTICE, type MergedAnnouncement } from './notices.js';
import {
  findPullRequest,
  linksOfPullRequest,
  pullRequestsOfIssue,
  updatePullRequest,
  upsertPullRequest,
  type PullRequestRow,
  type RepoRow,
} from './store.js';

export interface GitFlowDeps {
  readonly projects: () => Pick<
    Projects,
    'tx' | 'statusEvents' | 'issueContext' | 'activity' | 'subtasks'
  >;
  readonly agents: () => Pick<Agents, 'agents' | 'runs'> | undefined;
  readonly inbox: () => StudioInboxPort | undefined;
  readonly onError: (message: string, error: unknown) => void;
  /** After every store has committed: open pages read their pull requests again (`STUDIO_GIT_TOPIC`). */
  /** Something about the pull request was stored. */
  readonly onChanged?: (pullRequestId: string) => void;
  /** After a store has committed, with the stored pull request (`events.ts`). */
  readonly onStored?: (pr: PullRequestRow) => Promise<void>;
  /** Why the checks of a commit failed, read from the host (`StudioGit.explainFailures`); left out, only their names. */
  readonly explain?: (repo: RepoRow, sha: string) => Promise<FailedCheck[]>;
}

/** What else a read learned besides the pull request itself. */
export interface StoreOptions {
  readonly ci?: {
    readonly ciState: PullRequestCiState | null;
    /** The head's checks one by one. */
    readonly checks: readonly GitCheck[];
    readonly statusEtag: string | null;
    readonly runsEtag: string | null;
  };
  readonly pullEtag?: string | null;
  /** The Studio user who merged it (Studio merged it, or they marked it merged). */
  readonly mergedByUserId?: string;
  readonly mergedManually?: boolean;
}

export interface GitFlow {
  /** Stores what was read and runs the flow of what changed; answers the stored pull request. */
  store(
    repo: RepoRow,
    snapshot: PullRequestSnapshot,
    options?: StoreOptions,
  ): Promise<PullRequestRow>;
  /** Applies checks only while the locked PR is still open at the head that was read. */
  storeChecks(
    repo: RepoRow,
    pr: PullRequestRow,
    expectedSha: string,
    ci: NonNullable<StoreOptions['ci']>,
  ): Promise<void>;
  /** Retry undelivered signals on an unchanged authoritative snapshot, without recording fresh PR activity. */
  retrySignals(repo: RepoRow, pr: PullRequestRow): Promise<void>;
  /** An issue entered In review, or a pull request was linked while it was there: cards for its ready pull requests. */
  requestMerges(issueId: string, onlyPullRequestId?: string): Promise<void>;
  /** An issue left In review for anything but a merge: its cards are withdrawn. */
  withdrawMerges(issueId: string): Promise<void>;
}

function signalReports(
  repo: RepoRow,
  pr: PullRequestRow,
): [Signal, boolean | null][] {
  const summary = checkSummaryOf(pr, repo.referenceChecks);
  return [
    ['checks', checksFailing(summary)],
    [
      'conflict',
      pr.mergeableState === 'dirty'
        ? true
        : mergeableKnown(pr.mergeableState)
          ? false
          : null,
    ],
    ['passed', summary.ciState === 'success'],
  ];
}
function signalEnabled(repo: RepoRow, signal: Signal): boolean {
  return signal === 'checks'
    ? repo.wakeOnChecks
    : signal === 'passed'
      ? repo.wakeOnChecksPassed
      : repo.wakeOnConflict;
}

type After = (() => Promise<void>)[];

/** Only effective check results define a round; polling times, links and reference checks do not. */
export function checksFingerprint(
  pr: Pick<PullRequestRow, 'headSha' | 'checks' | 'ciState'>,
  references: readonly string[],
): string {
  const checks = pr.checks
    .filter((c) => !isReferenceCheck(c.name, references))
    .map((c) => [
      c.kind,
      c.name.trim(),
      c.executionId ?? null,
      c.status,
      c.conclusion,
    ])
    .sort((a, b) => {
      const left = JSON.stringify(a);
      const right = JSON.stringify(b);
      return left < right ? -1 : left > right ? 1 : 0;
    });
  return createHash('sha256')
    .update(JSON.stringify([pr.headSha, checks.length ? checks : pr.ciState]))
    .digest('hex');
}

type Signal = 'checks' | 'conflict' | 'passed';

const TRIGGERS: Readonly<Record<Signal, PullRequestTrigger>> = {
  checks: 'prChecksFailed',
  conflict: 'prConflict',
  passed: 'prChecksPassed',
};

/** Known and not a conflict: GitHub's `clean`, `unstable`, `blocked`, `behind`, `has_hooks`, `draft`. */
function mergeableKnown(state: string | null): boolean {
  return !!state && state !== 'unknown' && state !== 'dirty';
}

/** Whether every counted pull request of the issue is merged (false when none counts); a closed one does not count. */
async function allMerged(
  conn: DatabaseConnection,
  issueId: string,
): Promise<boolean> {
  const counted = (await pullRequestsOfIssue(conn, issueId)).filter(
    ({ link, pr }) => !link.autoCompleteDisabled && pr.state !== 'closed',
  );
  return counted.length > 0 && counted.every(({ pr }) => pr.state === 'merged');
}

/** The Studio user GitHub's login names, by username; null when none does. */
async function userOfLogin(
  conn: DatabaseConnection,
  login: string,
): Promise<string | null> {
  const row = await conn.query
    .selectFrom('user')
    .select('id')
    .where('username', '=', login)
    .executeTakeFirst();
  return row ? String((row as { id: unknown }).id) : null;
}

/** At most this many annotations of a check go into an input, and this many characters of the explanations in all. */
const ANNOTATIONS_SHOWN = 20;
const EXPLANATION_MAX = 40_000;

/** Why one check failed, as an agent reads it in its input. */
function explanationOf(check: FailedCheck): string {
  const lines = [
    `### ${check.name} (${check.conclusion})${check.url ? ` ${check.url}` : ''}`,
  ];
  if (check.summary) lines.push('', check.summary);
  if (check.annotations.length > 0) {
    lines.push('', 'Annotations:');
    for (const note of check.annotations.slice(0, ANNOTATIONS_SHOWN)) {
      const where =
        note.startLine === null ? note.path : `${note.path}:${note.startLine}`;
      lines.push(
        `- ${where} ${note.level}: ${note.title ? `${note.title}: ` : ''}${note.message}`,
      );
    }
    if (check.annotations.length > ANNOTATIONS_SHOWN)
      lines.push(`- … ${check.annotations.length - ANNOTATIONS_SHOWN} more`);
  }
  if (check.log)
    lines.push('', 'The failing part of its log:', '```', check.log, '```');
  else if (check.logUnavailable === 'notActions')
    lines.push(
      '',
      `Its log is not on GitHub: another CI reported this check. Read it there${check.url ? `: ${check.url}` : ' (no link was reported)'}.`,
    );
  else if (check.logUnavailable)
    lines.push('', `Its log could not be read (${check.logUnavailable}).`);
  return lines.join('\n');
}

/** What an agent woken by the checks reads: every failed required check, why it failed, and how to read it again. */
function checksText(
  ref: string,
  pr: PullRequestRow,
  issueKey: string,
  summary: CheckSummary,
  explained: readonly FailedCheck[] | null,
  referenceChecks: readonly string[],
): string {
  const names = summary.failed.map(({ name }) => name).join(', ');
  const lines = [
    `The required checks of pull request ${ref} failed${names ? `: ${names}` : ''}. Find out why, fix it on the same branch and push.`,
  ];
  if (summary.referenceFailed.length > 0)
    lines.push(
      `Reference checks failed too (${summary.referenceFailed.map(({ name }) => name).join(', ')}): they are only for information, so leave them unless your change caused them.`,
    );
  const required = (explained ?? []).filter(
    (check) => !isReferenceCheck(check.name, referenceChecks),
  );
  // Commit statuses, and checks the read missed, only have their names and links.
  const unexplained = summary.failed.filter(
    ({ name }) => !required.some((check) => check.name === name),
  );
  if (unexplained.length > 0)
    lines.push(
      '',
      ...unexplained.map(
        ({ name, url }) => `- ${name}${url ? `: ${url}` : ''}`,
      ),
    );
  if (required.length > 0) {
    let text = required.map(explanationOf).join('\n\n');
    if (text.length > EXPLANATION_MAX)
      text = `${text.slice(0, EXPLANATION_MAX)}\n…`;
    lines.push('', text);
  }
  lines.push(
    '',
    `\`nb-studio pr checks ${issueKey} ${pr.id}\` reads why they failed again: annotations and the failing part of each log, or where another CI keeps it.`,
  );
  return lines.join('\n');
}

function signalText(
  pr: PullRequestRow,
  signal: Signal,
  issueKey: string,
  checks: {
    readonly summary: CheckSummary;
    readonly explained: readonly FailedCheck[] | null;
    readonly referenceChecks: readonly string[];
  },
): string {
  const ref = `${pr.repo}#${pr.number} (${pr.url}, branch \`${pr.headRef}\`, head ${pr.headSha.slice(0, 12)})`;
  if (signal === 'passed')
    return `Currently reported required checks of pull request ${ref} passed. Verify the complete expected check set, then decide whether the change is ready for acceptance.`;
  return signal === 'checks'
    ? checksText(
        ref,
        pr,
        issueKey,
        checks.summary,
        checks.explained,
        checks.referenceChecks,
      )
    : `Pull request ${ref} conflicts with \`${pr.baseRef}\`. Bring the branch up to date with \`${pr.baseRef}\`, resolve the conflicts and push.`;
}

/** Whether the checks of what was read wake the agent: every required check finished and one failed. */
function checksFailing(summary: CheckSummary): boolean | null {
  if (summary.ciState === 'success') return false;
  return summary.ciState === 'failure' && summary.settled ? true : null;
}

export function createGitFlow(deps: GitFlowDeps): GitFlow {
  async function cardIssue(
    conn: DatabaseConnection,
    issueId: string,
  ): Promise<(CardIssue & { statusKey: string; category: string }) | null> {
    const context = await deps
      .projects()
      .issueContext.contextFor(conn, issueId);
    if (!context) return null;
    const revision = await conn.query
      .selectFrom('pmIssues')
      .select('revision')
      .where('id', '=', context.id)
      .executeTakeFirst();
    return {
      id: context.id,
      identifier: context.identifier,
      title: context.title,
      ownerUserId: context.owner.id,
      revision: Number(
        (revision as { revision?: unknown } | undefined)?.revision ?? 0,
      ),
      statusKey: context.status.key,
      category: context.status.category,
    };
  }

  async function onMerged(
    tx: ProjectsTx,
    pr: PullRequestRow,
    after: After,
  ): Promise<void> {
    const links = await linksOfPullRequest(tx.conn, pr.id);
    const complete: string[] = [];
    for (const link of links)
      if (await allMerged(tx.conn, link.issueId)) complete.push(link.issueId);
    const userId =
      pr.mergedByUserId ??
      (pr.mergedByLogin ? await userOfLogin(tx.conn, pr.mergedByLogin) : null);
    const actor: Actor | undefined = userId
      ? { type: 'user', id: userId }
      : undefined;
    // GitHub's login named a Studio user: the pull request shows them as who merged it.
    if (userId && !pr.mergedByUserId)
      await updatePullRequest(tx.conn, pr.id, { mergedByUserId: userId });
    if (complete.length > 0)
      await deps.projects().statusEvents.fire(
        {
          event: MERGED_EVENT,
          issueIds: complete,
          ...(actor ? { actor } : {}),
          note: `${pr.repo}#${pr.number} merged${!userId && pr.mergedByLogin ? ` by @${pr.mergedByLogin}` : ''}`.slice(
            0,
            200,
          ),
          details: {
            pullRequestId: pr.id,
            repo: pr.repo,
            number: pr.number,
            url: pr.url,
            mergedByLogin: pr.mergedByLogin,
          },
        },
        tx,
      );
    // The followers hear it once this commits, worded by the projects plugin's notices (`notices.ts`).
    tx.emit({
      type: 'work.announced',
      kind: GIT_NOTICE,
      payload: {
        type: 'prMerged',
        issueIds: links.map((link) => link.issueId),
        mergedByUserId: userId,
        pullRequest: {
          id: pr.id,
          repo: pr.repo,
          number: pr.number,
          url: pr.url,
          title: pr.title,
        },
      } satisfies MergedAnnouncement,
    });
    const port = deps.inbox();
    if (port)
      after.push(() =>
        settleMergeCards(
          port,
          pr.id,
          links.map((link) => link.issueId),
          'merged',
        ),
      );
  }

  async function hasRetryCandidate(
    conn: DatabaseConnection,
    repo: RepoRow,
    pr: PullRequestRow,
  ): Promise<boolean> {
    if (pr.state !== 'open' || !pr.headSha || !deps.agents()) return false;
    const fingerprint = checksFingerprint(pr, repo.referenceChecks);
    const round =
      pr.signals.observed?.fingerprint === fingerprint
        ? pr.signals.observed.round
        : (pr.signals.observed?.round ?? 0) + 1;
    const pending = signalReports(repo, pr).filter(
      ([signal, present]) => present === true && signalEnabled(repo, signal),
    );
    if (!pending.length) return false;
    for (const link of await linksOfPullRequest(conn, pr.id)) {
      const signals = pending.filter(([signal]) => {
        const key = `${signal}@${pr.headSha}${signal === 'conflict' ? '' : `:${round}`}`;
        const state = pr.signals[signal];
        return (
          state?.delivered?.[link.issueId] !== key &&
          (signal === 'passed' ||
            (state?.counts
              ? (state.counts[link.issueId] ?? 0)
              : (state?.count ?? 0)) < SIGNAL_WAKE_LIMIT)
        );
      });
      if (!signals.length) continue;
      const issue = await deps
        .projects()
        .issueContext.contextFor(conn, link.issueId);
      if (
        !issue ||
        issue.status.category === 'done' ||
        issue.status.category === 'closed' ||
        issue.status.key === 'backlog' ||
        issue.executor?.type !== AGENT_KIND
      )
        continue;
      if ((await readOwnerHandoff(conn, issue.id))?.waiting) continue;
      const held = await commentGuards(conn).findOne({
        filter: { id: commentGuardId(issue.id) },
      });
      if (
        held?.pendingToken ||
        (await recentCommentRunCount(conn, issue.id, 24)) >=
          (await readManagerSettings(conn)).commentRunLimit
      )
        continue;
      const businessIssue = await conn
        .repository<
          import('@nocobase/app-plugin-projects/shared/issues').Issue
        >('pmIssues')
        .findOne({ filter: { id: issue.id } });
      if (
        businessIssue &&
        (await deps.projects().subtasks.blockersOf(conn, businessIssue)).length
      )
        continue;
      const agents = deps.agents();
      if (!agents) return false;
      const agent = await agents.agents.findWorkable(conn, issue.executor.id);
      if (!agent || !agents.agents.mayInvoke(agent, issue.owner.id)) continue;
      if (
        agent.id === PROJECT_MANAGER_ID &&
        !(await validIssueOwner(conn, issue.owner.id))
      )
        continue;
      return true;
    }
    return false;
  }

  async function wake(
    tx: ProjectsTx,
    repo: RepoRow,
    pr: PullRequestRow,
    signal: Signal,
    _count: number,
    after: After,
    explained: readonly FailedCheck[] | null,
  ): Promise<string[]> {
    const delivered: string[] = [];
    const summary = checkSummaryOf(pr, repo.referenceChecks);
    const agents = deps.agents();
    for (const link of await linksOfPullRequest(tx.conn, pr.id)) {
      // Delivered issues need no row lock, including when another linked issue is still pending.
      if (
        pr.signals[signal]?.delivered?.[link.issueId] ===
        pr.signals[signal]?.key
      )
        continue;
      await tx.conn.query
        .updateTable('pmIssues')
        .set({ id: link.issueId })
        .where('id', '=', link.issueId)
        .execute();
      const issue = await deps
        .projects()
        .issueContext.contextFor(tx.conn, link.issueId);
      if (
        !issue ||
        issue.status.category === 'done' ||
        issue.status.category === 'closed'
      )
        continue;
      if ((await readOwnerHandoff(tx.conn, issue.id))?.waiting) {
        await deps.projects().activity.record(tx.conn, {
          issueId: issue.id,
          actor: { type: 'system', id: null },
          action: 'work_skipped',
          details: { reason: 'waitingOwner', trigger: signal },
        });
        tx.emit({ type: 'issue.changed', issueId: issue.id });
        continue;
      }
      if (issue.executor?.type !== AGENT_KIND || issue.status.key === 'backlog')
        continue;
      const held = await commentGuards(tx.conn).findOne({
        filter: { id: commentGuardId(issue.id) },
      });
      const businessIssue = await tx.conn
        .repository<
          import('@nocobase/app-plugin-projects/shared/issues').Issue
        >('pmIssues')
        .findOne({ filter: { id: issue.id } });
      if (
        businessIssue &&
        (await deps.projects().subtasks.blockersOf(tx.conn, businessIssue))
          .length
      )
        continue;
      if (
        held?.pendingToken ||
        (await recentCommentRunCount(tx.conn, issue.id, 24)) >=
          (await readManagerSettings(tx.conn)).commentRunLimit
      )
        continue;
      const issueCount =
        signal === 'passed'
          ? 1
          : (pr.signals[signal]?.counts?.[issue.id] ?? 0) + 1;
      if (signal !== 'passed' && issueCount > SIGNAL_WAKE_LIMIT) {
        const port = deps.inbox();
        const card = await cardIssue(tx.conn, issue.id);
        if (port && card && issueCount === SIGNAL_WAKE_LIMIT + 1)
          after.push(() => sendSignalStopped(port, card, pr, signal));
        continue;
      }
      if (!agents) continue;
      const agent = await agents.agents.findWorkable(
        tx.conn,
        issue.executor.id,
      );
      if (!agent) continue;
      const allowed = agents.agents.mayInvoke(agent, issue.owner.id);
      if (agent.id === PROJECT_MANAGER_ID) {
        const validOwner = await validIssueOwner(tx.conn, issue.owner.id);
        if (!validOwner || !allowed) {
          await deps.projects().activity.record(tx.conn, {
            issueId: issue.id,
            actor: { type: 'system', id: null },
            action: 'studio_execution_wait',
            details: {
              reason: validOwner ? 'notAllowed' : 'noOwner',
              trigger: signal,
              agentId: agent.id,
              agent: agent.name,
              ownerUserId: issue.owner.id,
              owner: issue.owner.name,
            },
          });
          tx.emit({ type: 'issue.changed', issueId: issue.id });
          continue;
        }
      }
      if (!allowed) continue;
      const queued = await agents.runs.enqueue(
        {
          agentId: agent.id,
          subject: { kind: ISSUE_SUBJECT, id: issue.id },
          actorUserId: issue.owner.id,
          ownerUserId: issue.owner.id,
          input: {
            type: 'signal',
            actor: { kind: 'system', id: 'system', name: 'Studio' },
            text: signalText(pr, signal, issue.identifier, {
              summary,
              explained,
              referenceChecks: repo.referenceChecks,
            }),
            payload: {
              trigger: TRIGGERS[signal],
              ...(signal === 'checks'
                ? {
                    failedChecks: summary.failed.map(({ name }) => name),
                    referenceFailures: summary.referenceFailed.map(
                      ({ name }) => name,
                    ),
                  }
                : {}),
              pullRequestId: pr.id,
              repo: pr.repo,
              number: pr.number,
              url: pr.url,
              headRef: pr.headRef,
              headSha: pr.headSha,
              attempt: issueCount,
            },
          },
        },
        agentsTx(tx),
      );
      if (queued.outcome !== 'pending') delivered.push(issue.id);
    }
    return delivered;
  }

  async function signals(
    tx: ProjectsTx,
    repo: RepoRow,
    pr: PullRequestRow,
    after: After,
    explained: readonly FailedCheck[] | null,
  ): Promise<void> {
    if (pr.state !== 'open' || !pr.headSha) return;
    // upsert acquired the PR row lock; reread signals after any competing store committed.
    pr = (await findPullRequest(tx.conn, repo.id, pr.number)) ?? pr;
    const fingerprint = checksFingerprint(pr, repo.referenceChecks);
    const observed = pr.signals.observed;
    const round =
      observed?.fingerprint === fingerprint
        ? observed.round
        : (observed?.round ?? 0) + 1;
    const next = { ...pr.signals, observed: { fingerprint, round } };
    const summary = checkSummaryOf(pr, repo.referenceChecks);
    const reports = signalReports(repo, pr);
    for (const [signal, present] of reports) {
      const stored = next[signal];
      if (present !== true) {
        if (present === false && signal !== 'checks') delete next[signal];
        // Keep failure count through pending reruns; only success resets the failure budget.
        if (signal === 'checks' && summary.ciState === 'success')
          delete next.checks;
        continue;
      }
      const key = `${signal}@${pr.headSha}${signal === 'conflict' ? '' : `:${round}`}`;
      const count =
        signal === 'passed'
          ? 1
          : stored?.key === key
            ? stored.count
            : (stored?.count ?? 0) + 1;
      const counts =
        stored?.counts ??
        Object.fromEntries(
          (stored && signal !== 'passed'
            ? await linksOfPullRequest(tx.conn, pr.id)
            : []
          ).map((link) => [link.issueId, stored!.count]),
        );
      const state = {
        key,
        count,
        counts: { ...counts },
        delivered: stored?.key === key ? { ...stored.delivered } : {},
      };
      next[signal] = state;
      if (signalEnabled(repo, signal)) {
        const delivered = await wake(
          tx,
          repo,
          { ...pr, signals: next },
          signal,
          count,
          after,
          explained,
        );
        for (const issueId of delivered) {
          state.delivered[issueId] = key;
          state.counts[issueId] = (state.counts[issueId] ?? 0) + 1;
        }
      }
    }
    if (!isDeepStrictEqual(next, pr.signals))
      await updatePullRequest(tx.conn, pr.id, { signals: next });
  }

  async function runAfter(after: After): Promise<void> {
    for (const task of after)
      await task().catch((error: unknown) =>
        deps.onError('Studio could not update a pull request item.', error),
      );
  }

  /**
   * Why the head's checks failed, read before the transaction when this read will likely wake an agent for them; null
   * when it will not, or the host could not say (the input then names the checks and how to read them).
   */
  async function explainFirst(
    repo: RepoRow,
    snapshot: Pick<PullRequestSnapshot, 'number' | 'state' | 'headSha'>,
    options: StoreOptions,
  ): Promise<FailedCheck[] | null> {
    if (!deps.explain || !repo.wakeOnChecks || !options.ci) return null;
    if (snapshot.state !== 'open' || !snapshot.headSha) return null;
    if (
      checksFailing(checkSummaryOf(options.ci, repo.referenceChecks)) !== true
    )
      return null;
    try {
      const stored = await findPullRequest(
        deps.projects().tx.read(),
        repo.id,
        snapshot.number,
      );
      if (
        stored?.signals.observed?.fingerprint ===
          checksFingerprint(
            { ...stored, ...options.ci, headSha: snapshot.headSha },
            repo.referenceChecks,
          ) &&
        stored?.signals.checks?.key
      )
        return null;
      if (
        (stored?.signals.checks?.count ?? 0) >= SIGNAL_WAKE_LIMIT ||
        !stored ||
        (await linksOfPullRequest(deps.projects().tx.read(), stored.id))
          .length === 0
      )
        return null;
      return await deps.explain(repo, snapshot.headSha);
    } catch (error) {
      deps.onError('Studio could not read why the checks failed.', error);
      return null;
    }
  }

  return {
    async storeChecks(repo, pr, expectedSha, ci) {
      const after: After = [];
      const explained = await explainFirst(repo, pr, { ci });
      const stored = await deps.projects().tx.run(async (tx) => {
        // Acquire the same write lock used by signal retries before reading the current head.
        await tx.conn
          .repository('studioPullRequests')
          .updateMany({ filter: { id: pr.id }, values: { id: pr.id } });
        const current = await findPullRequest(tx.conn, repo.id, pr.number);
        if (
          !current ||
          current.state !== 'open' ||
          current.headSha !== expectedSha
        )
          return null;
        await updatePullRequest(tx.conn, current.id, {
          ...ci,
          snapshotAt: new Date(),
        });
        const updated = { ...current, ...ci };
        await signals(tx, repo, updated, after, explained);
        return updated;
      });
      if (!stored) return;
      await runAfter(after);
      deps.onChanged?.(stored.id);
      await deps.onStored?.(stored);
    },
    async retrySignals(repo, pr) {
      // A 304 is the hot path: read current delivery markers before opening any write transaction.
      const observed = await findPullRequest(
        deps.projects().tx.read(),
        repo.id,
        pr.number,
      );
      if (
        !observed ||
        observed.headSha !== pr.headSha ||
        !(await hasRetryCandidate(deps.projects().tx.read(), repo, observed))
      )
        return;
      const after: After = [];
      await deps.projects().tx.run(async (tx) => {
        await tx.conn
          .repository('studioPullRequests')
          .updateMany({ filter: { id: pr.id }, values: { id: pr.id } });
        const current = await findPullRequest(tx.conn, repo.id, pr.number);
        // A competing refresh or retry may have consumed this observation while we waited for the lock.
        if (
          !current ||
          current.state !== 'open' ||
          current.headSha !== observed.headSha ||
          checksFingerprint(current, repo.referenceChecks) !==
            checksFingerprint(observed, repo.referenceChecks) ||
          !isDeepStrictEqual(
            current.signals.observed,
            observed.signals.observed,
          ) ||
          !(await hasRetryCandidate(tx.conn, repo, current))
        )
          return;
        await signals(tx, repo, current, after, null);
      });
      await runAfter(after);
    },
    async store(repo, snapshot, options = {}) {
      const after: After = [];
      const explained = await explainFirst(repo, snapshot, options);
      const pr = await deps.projects().tx.run(async (tx) => {
        const { pr: stored, previous } = await upsertPullRequest(
          tx.conn,
          repo.id,
          snapshot,
          {
            ...(options.ci ?? {}),
            ...(options.pullEtag !== undefined
              ? { pullEtag: options.pullEtag }
              : {}),
            ...(options.mergedByUserId
              ? { mergedByUserId: options.mergedByUserId }
              : {}),
            ...(options.mergedManually ? { mergedManually: true } : {}),
          },
        );
        if (stored.state !== previous?.state && previous) {
          if (stored.state === 'merged') await onMerged(tx, stored, after);
          else if (stored.state === 'closed') {
            const port = deps.inbox();
            const links = await linksOfPullRequest(tx.conn, stored.id);
            if (port)
              after.push(() =>
                settleMergeCards(
                  port,
                  stored.id,
                  links.map((link) => link.issueId),
                  'closed',
                ),
              );
          }
        }
        await signals(tx, repo, stored, after, explained);
        return stored;
      });
      await runAfter(after);
      deps.onChanged?.(pr.id);
      await deps.onStored?.(pr);
      return pr;
    },

    async requestMerges(issueId, onlyPullRequestId) {
      const port = deps.inbox();
      if (!port) return;
      const conn = deps.projects().tx.read();
      const issue = await cardIssue(conn, issueId);
      if (!issue || issue.statusKey !== IN_REVIEW) return;
      for (const { pr } of await pullRequestsOfIssue(conn, issueId))
        if (!onlyPullRequestId || pr.id === onlyPullRequestId)
          await sendMergeCard(port, issue, pr);
    },

    async withdrawMerges(issueId) {
      const port = deps.inbox();
      if (!port) return;
      const conn = deps.projects().tx.read();
      for (const { pr } of await pullRequestsOfIssue(conn, issueId))
        if (pr.state === 'open')
          await settleMergeCards(port, pr.id, [issueId], 'withdrawn');
    },
  };
}

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
 *   executing each linked issue (an issue run input, trigger `prChecksFailed` / `prConflict`), once per head commit, at
 *   most `SIGNAL_WAKE_LIMIT` heads in a row; after that the owner is told instead. Passing checks or a known mergeable
 *   state clear the count. A repository can turn each signal off. Checks wake the agent only once every required check of
 *   the head has finished, and a failed reference check (`RepoRow.referenceChecks`) never does (`checkSummaryOf`). The
 *   input names every failed check and carries why it failed (`GitFlowDeps.explain`, read before the transaction):
 *   annotations and the failing part of each log, or where another CI keeps it.
 *   Required checks that all finished without failure wake it once per head (`prChecksPassed`).
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
    'tx' | 'statusEvents' | 'issueContext' | 'activity'
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
  /** An issue entered In review, or a pull request was linked while it was there: cards for its ready pull requests. */
  requestMerges(issueId: string, onlyPullRequestId?: string): Promise<void>;
  /** An issue left In review for anything but a merge: its cards are withdrawn. */
  withdrawMerges(issueId: string): Promise<void>;
}

type After = (() => Promise<void>)[];

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
    return `All checks of pull request ${ref} passed. Decide whether the change is ready for acceptance.`;
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

  async function wake(
    tx: ProjectsTx,
    repo: RepoRow,
    pr: PullRequestRow,
    signal: Signal,
    count: number,
    after: After,
    explained: readonly FailedCheck[] | null,
  ): Promise<void> {
    const summary = checkSummaryOf(pr, repo.referenceChecks);
    const agents = deps.agents();
    for (const link of await linksOfPullRequest(tx.conn, pr.id)) {
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
      if (issue.executor?.type !== AGENT_KIND) continue;
      if (signal !== 'passed' && count > SIGNAL_WAKE_LIMIT) {
        const port = deps.inbox();
        const card = await cardIssue(tx.conn, issue.id);
        if (port && card && count === SIGNAL_WAKE_LIMIT + 1)
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
      await agents.runs.enqueue(
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
              attempt: count,
            },
          },
        },
        agentsTx(tx),
      );
    }
  }

  async function signals(
    tx: ProjectsTx,
    repo: RepoRow,
    pr: PullRequestRow,
    after: After,
    explained: readonly FailedCheck[] | null,
  ): Promise<void> {
    if (pr.state !== 'open' || !pr.headSha) return;
    const reports: ['checks' | 'conflict', boolean | null][] = [
      ['checks', checksFailing(checkSummaryOf(pr, repo.referenceChecks))],
      [
        'conflict',
        pr.mergeableState === 'dirty'
          ? true
          : mergeableKnown(pr.mergeableState)
            ? false
            : null,
      ],
    ];
    const next: Record<string, unknown> = { ...pr.signals };
    let changed = false;
    for (const [signal, failing] of reports) {
      if (failing === null) continue;
      const stored = pr.signals[signal];
      if (!failing) {
        if (stored) {
          delete next[signal];
          changed = true;
        }
        continue;
      }
      const key = `${signal}@${pr.headSha}`;
      if (stored?.key === key) continue;
      const count = (stored?.count ?? 0) + 1;
      next[signal] = { key, count };
      changed = true;
      if (signal === 'checks' ? repo.wakeOnChecks : repo.wakeOnConflict)
        await wake(tx, repo, pr, signal, count, after, explained);
    }
    // All checks of this head finished without a failure: once per head.
    if (checkSummaryOf(pr, repo.referenceChecks).ciState === 'success') {
      const key = `passed@${pr.headSha}`;
      if (pr.signals.passed?.key !== key) {
        next.passed = { key, count: 1 };
        changed = true;
        if (repo.wakeOnChecksPassed)
          await wake(tx, repo, pr, 'passed', 1, after, explained);
      }
    }
    if (changed) await updatePullRequest(tx.conn, pr.id, { signals: next });
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
    snapshot: PullRequestSnapshot,
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
      if (stored?.signals.checks?.key === `checks@${snapshot.headSha}`)
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

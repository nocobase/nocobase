/**
 * What a pull request's state does to its issues. Every read of the code host ends here (`store`): a webhook delivery, the poller, a merge check, a link,
 * a refresh, a merge preflight, a merge or a person marking it merged.
 *
 * - **Merged**: for each linked issue whose counted pull requests (links without `autoCompleteDisabled`, closed ones left out) are now all
 *   merged, Studio fires the workflow event `studio.merged` (`projects.workflowEvents.fire`); the issue moves along its
 *   workflow's transition on it (the "Software development" template: In review or In progress → Done). The move is the
 *   system's; the activity names the merging person when Studio knows them (Studio merged it, a person marked it, or
 *   GitHub's `merged_by` login is a Studio username) and notes `owner/name#12 merged`. Merge cards settle `merged`, and
 *   the followers of every linked issue hear it (`pr_merged`, `notices.ts`).
 * - **Closed** without a merge: merge cards settle `closed`.
 * - **Signals**, while it is open: failing checks (`ciState = failure`) and a conflict (`mergeableState = dirty`) wake the
 *   agent executing each linked issue (an issue run input, trigger `prChecksFailed` / `prConflict`), once per head
 *   commit, at most `SIGNAL_WAKE_LIMIT` heads in a row; after that the owner is told instead. Passing checks or a known
 *   mergeable state clear the count. A repository can turn either off.
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

import { IN_PROGRESS_STATUS } from '../../shared/design.js';
import { jsonObject } from '../agents/values.js';
import { canImplement } from '../agents/executor.js';
import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';

import {
  MERGED_EVENT,
  SIGNAL_WAKE_LIMIT,
  type GitCheck,
  type PullRequestCiState,
  type PullRequestTrigger,
} from '../../shared/git.js';
import { ISSUE_SUBJECT } from '../agents/catalog/triggers.js';
import { AGENT_KIND, agentsTx } from '../agents/tx.js';
import type { StudioInboxPort } from '../inbox/port.js';
import {
  IN_REVIEW,
  sendMergeCard,
  sendSignalStopped,
  settleMergeCards,
  type CardIssue,
} from './cards.js';
import type { PullRequestSnapshot } from './platform.js';
import { GIT_NOTICE, type MergedAnnouncement } from './notices.js';
import {
  linksOfPullRequest,
  findRepoById,
  pullRequestsOfIssue,
  updatePullRequest,
  upsertPullRequest,
  type PullRequestRow,
  type RepoRow,
} from './store.js';

export interface GitFlowDeps {
  readonly projects: () => Pick<
    Projects,
    'tx' | 'workflowEvents' | 'issueContext'
  >;
  readonly agents: () => Pick<Agents, 'agents' | 'runs'> | undefined;
  readonly inbox: () => StudioInboxPort | undefined;
  readonly onError: (message: string, error: unknown) => void;
  /** After every store has committed: open pages read their pull requests again (`STUDIO_GIT_TOPIC`). */
  readonly onChanged?: () => void;
  /** After a store has committed, with the stored pull request (`events.ts`). */
  readonly onStored?: (pr: PullRequestRow) => Promise<void>;
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
  resumeSignals(issueId: string): Promise<void>;
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

const TRIGGERS: Readonly<Record<'checks' | 'conflict', PullRequestTrigger>> = {
  checks: 'prChecksFailed',
  conflict: 'prConflict',
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

function signalText(pr: PullRequestRow, signal: 'checks' | 'conflict'): string {
  const ref = `${pr.repo}#${pr.number} (${pr.url}, branch \`${pr.headRef}\`, head ${pr.headSha.slice(0, 12)})`;
  return signal === 'checks'
    ? `The checks of pull request ${ref} failed. Find out why, fix it on the same branch and push.`
    : `Pull request ${ref} conflicts with \`${pr.baseRef}\`. Bring the branch up to date with \`${pr.baseRef}\`, resolve the conflicts and push.`;
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
      await deps.projects().workflowEvents.fire(
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
    pr: PullRequestRow,
    signal: 'checks' | 'conflict',
    count: number,
    after: After,
    onlyIssueId?: string,
  ): Promise<string[]> {
    const agents = deps.agents();
    const woken: string[] = [];
    for (const link of await linksOfPullRequest(tx.conn, pr.id)) {
      if (onlyIssueId && link.issueId !== onlyIssueId) continue;
      const issue = await deps
        .projects()
        .issueContext.contextFor(tx.conn, link.issueId);
      if (
        !issue ||
        issue.status.key !== IN_PROGRESS_STATUS ||
        issue.status.category === 'done' ||
        issue.status.category === 'closed' ||
        issue.executor?.type !== AGENT_KIND
      )
        continue;
      if (!agents) continue;
      const agent = await agents.agents.findWorkable(
        tx.conn,
        issue.executor.id,
      );
      if (
        !agent ||
        !canImplement(agent) ||
        !agents.agents.mayInvoke(agent, issue.owner.id)
      )
        continue;
      // Eligible delivery, including a loop-limit notice, consumes this head once.
      woken.push(issue.id);
      if (count > SIGNAL_WAKE_LIMIT) {
        const port = deps.inbox();
        const card = await cardIssue(tx.conn, issue.id);
        if (port && card && count === SIGNAL_WAKE_LIMIT + 1)
          after.push(() => sendSignalStopped(port, card, pr, signal));
        continue;
      }
      const input = {
        type: 'signal' as const,
        actor: { kind: 'system' as const, id: 'system', name: 'Studio' },
        text: signalText(pr, signal),
        payload: {
          trigger: TRIGGERS[signal],
          pullRequestId: pr.id,
          repo: pr.repo,
          number: pr.number,
          url: pr.url,
          headRef: pr.headRef,
          headSha: pr.headSha,
          attempt: count,
        },
      };
      if (onlyIssueId) {
        const current = await cardIssue(tx.conn, issue.id);
        const open = await agents.runs.openOn(
          tx.conn,
          { kind: ISSUE_SUBJECT, id: issue.id },
          agent.id,
        );
        let target: string | null = null;
        for (const run of open) {
          if (run.status !== 'queued') continue;
          const pending = await agents.runs.pendingInputs(tx.conn, run.id);
          if (
            current &&
            pending.some((item) => {
              const payload = jsonObject(item.payload);
              return (
                payload.trigger === 'stageEntered' &&
                payload.to === IN_PROGRESS_STATUS &&
                jsonObject(payload.stageInputVersion).revision ===
                  current.revision
              );
            })
          ) {
            target = run.id;
            break;
          }
        }
        if (target) {
          await agents.runs.addInput(target, input, agentsTx(tx));
          continue;
        }
      }
      await agents.runs.enqueue(
        {
          agentId: agent.id,
          subject: { kind: ISSUE_SUBJECT, id: issue.id },
          actorUserId: issue.owner.id,
          ownerUserId: issue.owner.id,
          input,
        },
        agentsTx(tx),
      );
    }
    return woken;
  }

  async function signals(
    tx: ProjectsTx,
    repo: RepoRow,
    pr: PullRequestRow,
    after: After,
  ): Promise<void> {
    if (pr.state !== 'open' || !pr.headSha) return;
    const reports: ['checks' | 'conflict', boolean | null][] = [
      [
        'checks',
        pr.ciState === 'failure'
          ? true
          : pr.ciState === 'success'
            ? false
            : null,
      ],
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
      const enabled =
        signal === 'checks' ? repo.wakeOnChecks : repo.wakeOnConflict;
      const woken = enabled ? await wake(tx, pr, signal, count, after) : [];
      const pendingIssueIds = enabled
        ? (await linksOfPullRequest(tx.conn, pr.id))
            .map((link) => link.issueId)
            .filter((id) => !woken.includes(id))
        : [];
      next[signal] = {
        key,
        count: woken.length ? count : (stored?.count ?? 0),
        pendingIssueIds,
      };
      changed = true;
    }
    if (changed) await updatePullRequest(tx.conn, pr.id, { signals: next });
  }

  async function runAfter(after: After): Promise<void> {
    for (const task of after)
      await task().catch((error: unknown) =>
        deps.onError('Studio could not update a pull request item.', error),
      );
  }

  return {
    async resumeSignals(issueId) {
      const after: After = [];
      await deps.projects().tx.run(async (tx) => {
        for (const { pr } of await pullRequestsOfIssue(tx.conn, issueId)) {
          if (pr.state !== 'open') continue;
          const repo = await findRepoById(tx.conn, pr.repoId);
          if (!repo) continue;
          const next = { ...pr.signals };
          let changed = false;
          for (const signal of ['checks', 'conflict'] as const) {
            const stored = pr.signals[signal];
            if (!stored?.pendingIssueIds?.includes(issueId)) continue;
            const stillFailing =
              signal === 'checks'
                ? repo.wakeOnChecks && pr.ciState === 'failure'
                : repo.wakeOnConflict && pr.mergeableState === 'dirty';
            const valid =
              stillFailing && stored.key === `${signal}@${pr.headSha}`;
            const count = stored.count + 1;
            const woken = valid
              ? await wake(tx, pr, signal, count, after, issueId)
              : [];
            if (valid && woken.length === 0) continue;
            next[signal] = {
              ...stored,
              count: woken.length ? count : stored.count,
              pendingIssueIds: stored.pendingIssueIds.filter(
                (id) => id !== issueId,
              ),
            };
            changed = true;
          }
          if (changed)
            await updatePullRequest(tx.conn, pr.id, { signals: next });
        }
      });
      await runAfter(after);
    },
    async store(repo, snapshot, options = {}) {
      const after: After = [];
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
        await signals(tx, repo, stored, after);
        return stored;
      });
      await runAfter(after);
      deps.onChanged?.();
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

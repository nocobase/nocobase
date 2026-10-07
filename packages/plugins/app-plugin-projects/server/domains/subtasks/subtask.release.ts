/**
 * What finishing an issue (or deleting it, or removing what held another) sets off, in the transaction of the change:
 *
 * 1. Release: each issue that waited for it, or a later-stage sibling, that is unfinished and held by nothing now gets
 *    one `issue.dependencyReleased` (and the `onUnblocked` hook).
 * 2. Join: when it has a parent, the parent's row is written first (`lastActivityAt`), which locks it, so two siblings
 *    finishing at once take turns here and the second reads what the first committed. Then, if every live sub-issue
 *    is finished, one `issue.batchDone` for all of them and the workflow event `subtasks.done` on the parent; else, if
 *    its stage is finished, one `issue.batchDone` for the stage.
 *
 * A parent the event moves to a finished status goes through the same steps, up the tree, in the same transaction.
 */
import type { Issue } from '../../../shared/issues.js';
import type { Actor } from '../../kernel/actor.js';
import type { Tx } from '../../kernel/tx.js';
import {
  findIssue,
  findIssues,
  liveChildren,
  updateIssue,
  type IssueService,
  type IssueTriggers,
} from '../issues/index.js';
import type { StatusCatalogs } from '../issues/index.js';
import { blockersOf, catalogsFor, type Catalogs } from './subtask.blocking.js';
import { incoming } from './subtask.store.js';
import './subtask.events.js';

export interface ReleaseDeps {
  readonly statuses: StatusCatalogs;
  readonly triggers: () => IssueTriggers;
  readonly issues: () => Pick<IssueService, 'fireEvent'>;
}

const eventActor = (actor: Actor) => ({ type: actor.type, id: actor.id });

/** Tells the issue nothing holds it any more, when that is so. */
export async function releaseIfFree(
  deps: ReleaseDeps,
  tx: Tx,
  catalogs: Catalogs,
  issue: Issue,
  releasedBy: Issue,
  actor: Actor,
): Promise<void> {
  if (issue.deletedAt || (await catalogs.terminal(issue))) return;
  if ((await blockersOf(tx.conn, catalogs, issue)).length > 0) return;
  await deps.triggers().onUnblocked?.(tx, { issue, releasedBy });
  tx.emit({ type: 'issue.changed', issueId: issue.id });
  tx.emit({
    type: 'issue.dependencyReleased',
    issueId: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    ownerUserId: issue.ownerUserId,
    executor: issue.executor,
    releasedBy: {
      issueId: releasedBy.id,
      identifier: releasedBy.identifier,
      revision: releasedBy.revision,
    },
    actor: eventActor(actor),
  });
}

async function join(
  deps: ReleaseDeps,
  tx: Tx,
  catalogs: Catalogs,
  finished: Issue,
  actor: Actor,
): Promise<void> {
  const parentId = finished.parentIssueId;
  if (!parentId) return;
  const before = await findIssue(tx.conn, parentId);
  if (!before || before.deletedAt) return;
  // Writing the parent's row locks it until the transaction ends: siblings finishing at once take turns here.
  await updateIssue(tx.conn, parentId, {
    lastActivityAt: new Date().toISOString(),
  });
  const parent = (await findIssue(tx.conn, parentId)) as Issue;
  if (await catalogs.terminal(parent)) return;
  const children = await liveChildren(tx.conn, [parentId]);
  if (children.length === 0) return;
  const done = new Map<string, boolean>();
  for (const child of children)
    done.set(child.id, await catalogs.terminal(child));
  const batch = (stage: number | null, members: readonly Issue[]) => {
    tx.emit({
      type: 'issue.batchDone',
      parentIssueId: parent.id,
      identifier: parent.identifier,
      title: parent.title,
      ownerUserId: parent.ownerUserId,
      stage,
      all: stage === null,
      childIssueIds: members.map((child) => child.id),
      finishedBy: { issueId: finished.id, revision: finished.revision },
      actor: eventActor(actor),
    });
    tx.emit({ type: 'issue.changed', issueId: parent.id });
  };
  if (children.every((child) => done.get(child.id))) {
    batch(null, children);
    await deps.triggers().onSubtasksFinished?.(tx, {
      parent,
      stage: null,
      childIssueIds: children.map((child) => child.id),
    });
    await deps
      .issues()
      .fireEvent(tx, parent.id, 'subtasks.done', { issueId: finished.id });
    return;
  }
  if (finished.stage === null || finished.deletedAt) return;
  const stage = children.filter((child) => child.stage === finished.stage);
  if (stage.length > 0 && stage.every((child) => done.get(child.id))) {
    batch(finished.stage, stage);
    await deps.triggers().onSubtasksFinished?.(tx, {
      parent,
      stage: finished.stage,
      childIssueIds: stage.map((child) => child.id),
    });
  }
}

/** `finished` entered a finished status, or was deleted: release what waited for it, then join at its parent. */
export async function onTerminal(
  deps: ReleaseDeps,
  tx: Tx,
  finished: Issue,
  actor: Actor,
): Promise<void> {
  const catalogs = catalogsFor(deps.statuses, tx.conn);
  const waiting = (await incoming(tx.conn, [finished.id], 'blockedBy')).map(
    (dependency) => dependency.issueId,
  );
  const candidates = await findIssues(tx.conn, waiting);
  if (finished.parentIssueId && finished.stage !== null) {
    const own = finished.stage;
    for (const sibling of await liveChildren(tx.conn, [finished.parentIssueId]))
      if (sibling.stage !== null && sibling.stage > own)
        candidates.push(sibling);
  }
  const seen = new Set<string>([finished.id]);
  for (const candidate of candidates.sort((a, b) => a.number - b.number)) {
    if (seen.has(candidate.id)) continue;
    seen.add(candidate.id);
    await releaseIfFree(deps, tx, catalogs, candidate, finished, actor);
  }
  await join(deps, tx, catalogs, finished, actor);
}

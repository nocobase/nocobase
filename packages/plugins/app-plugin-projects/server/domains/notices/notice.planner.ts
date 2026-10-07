/**
 * Plans notices in the transaction of the change (`TxRunner.beforeCommit`): first it follows issues for the people a
 * change concerns (whoever creates, owns, executes, comments on or is mentioned in an issue), so a new commenter is a
 * follower before followers are read; then it runs the rules and emits what remains as `notice.planned`.
 *
 * Within one transaction and issue: the actor (a person) is never told of their own action; a person mentioned in a
 * comment is not told of the comment too; a person who got a decision or the workflow's owner notice is not told of
 * the status change too. Kinds other than `user` have no inbox.
 */
import type { DomainEvent } from '../../kernel/events.js';
import type { KindRegistry } from '../../kernel/kinds.js';
import type { Tx } from '../../kernel/tx.js';
import { findIssue } from '../issues/index.js';
import type { SubscriptionService } from '../subscriptions/index.js';
import './notice.events.js';
import type {
  NoticeRule,
  NoticeRuleContext,
  NoticeRules,
  PlannedNotice,
} from './ports.js';

export interface NoticePlanner extends NoticeRules {
  /** The `beforeCommit` hook. */
  plan(tx: Tx, events: readonly DomainEvent[]): Promise<void>;
}

const RELEVANT = new Set<string>([
  'issue.created',
  'issue.updated',
  'comment.created',
  'comment.updated',
]);

const users = (
  refs: readonly { readonly kind: string; readonly id: string }[],
) => refs.filter((ref) => ref.kind === 'user').map((ref) => ref.id);

async function follow(
  tx: Tx,
  subscriptions: SubscriptionService,
  events: readonly DomainEvent[],
): Promise<void> {
  for (const event of events) {
    if (event.type === 'issue.created') {
      const issue = await findIssue(tx.conn, event.issueId);
      if (!issue) continue;
      if (event.actor.type === 'user' && event.actor.id)
        await subscriptions.follow(
          tx.conn,
          issue.id,
          [event.actor.id],
          'creator',
        );
      await subscriptions.follow(
        tx.conn,
        issue.id,
        [issue.ownerUserId],
        'owner',
      );
      if (issue.executor?.type === 'user')
        await subscriptions.follow(
          tx.conn,
          issue.id,
          [issue.executor.id],
          'executor',
        );
      await subscriptions.follow(
        tx.conn,
        issue.id,
        users(event.mentions),
        'mentioned',
      );
    }
    if (event.type === 'issue.updated') {
      const { changes } = event;
      if (changes.owner)
        await subscriptions.follow(
          tx.conn,
          event.issueId,
          [changes.owner.to],
          'owner',
        );
      if (changes.executor?.to?.type === 'user')
        await subscriptions.follow(
          tx.conn,
          event.issueId,
          [changes.executor.to.id],
          'executor',
        );
      await subscriptions.follow(
        tx.conn,
        event.issueId,
        users(changes.mentions ?? []),
        'mentioned',
      );
    }
    if (event.type === 'comment.created') {
      if (event.actor.type === 'user' && event.actor.id)
        await subscriptions.follow(
          tx.conn,
          event.issueId,
          [event.actor.id],
          'commenter',
        );
      if (event.actor.type === 'user' || !event.note)
        await subscriptions.follow(
          tx.conn,
          event.issueId,
          users(event.mentions),
          'mentioned',
        );
    }
    if (event.type === 'comment.updated')
      await subscriptions.follow(
        tx.conn,
        event.issueId,
        users(event.mentions),
        'mentioned',
      );
  }
}

/** Removes the actor and the weaker notice of a slot; drops notices nobody is left to receive. */
export function dedupe(
  notices: readonly PlannedNotice[],
  events: readonly DomainEvent[],
): PlannedNotice[] {
  const taken = new Map<string, Set<string>>();
  const take = (slot: string, issueId: string, userIds: Iterable<string>) => {
    const key = `${slot}:${issueId}`;
    const set = taken.get(key) ?? new Set<string>();
    for (const id of userIds) set.add(id);
    taken.set(key, set);
  };
  const isTaken = (slot: string, issueId: string, userId: string) =>
    taken.get(`${slot}:${issueId}`)?.has(userId) ?? false;

  for (const event of events)
    if (event.type === 'workflow.ownerNotified')
      take('change', event.issueId, [event.ownerUserId]);
  for (const notice of notices) {
    if (notice.slot === 'change' && notice.kind === 'decision')
      take('change', notice.issue.id, notice.userIds);
    if (notice.slot === 'comment' && notice.type === 'mentioned')
      take('comment', notice.issue.id, notice.userIds);
  }

  const result: PlannedNotice[] = [];
  for (const notice of notices) {
    const weaker =
      (notice.slot === 'change' && notice.kind !== 'decision') ||
      (notice.slot === 'comment' && notice.type !== 'mentioned');
    const userIds = [...new Set(notice.userIds)].filter(
      (userId) =>
        !(notice.actor.type === 'user' && notice.actor.id === userId) &&
        !(weaker && isTaken(notice.slot, notice.issue.id, userId)),
    );
    if (userIds.length > 0) result.push({ ...notice, userIds });
  }
  return result;
}

export function createNoticePlanner(deps: {
  readonly subscriptions: SubscriptionService;
  readonly kinds: KindRegistry;
  readonly rules: readonly NoticeRule[];
}): NoticePlanner {
  const added = new Set<NoticeRule>();
  return {
    add(rule) {
      added.add(rule);
      return () => {
        added.delete(rule);
      };
    },
    async plan(tx, events) {
      const batch = events.filter((event) => !event.type.startsWith('notice.'));
      const pluginRules = [...added];
      if (
        pluginRules.length === 0 &&
        !batch.some((event) => RELEVANT.has(event.type))
      )
        return;
      await follow(tx, deps.subscriptions, batch);
      const followers = new Map<string, Promise<readonly string[]>>();
      const context: NoticeRuleContext = {
        tx,
        events: batch,
        subscribers: (issueId) => {
          let ids = followers.get(issueId);
          if (!ids) {
            ids = deps.subscriptions.subscriberIds(tx.conn, issueId);
            followers.set(issueId, ids);
          }
          return ids;
        },
        async nameOf(type, id) {
          if (!id) return null;
          return (await deps.kinds.nameAll(tx.conn, [{ type, id }]))(type, id);
        },
      };
      const planned: PlannedNotice[] = [];
      for (const rule of [...deps.rules, ...pluginRules])
        planned.push(...(await rule(context)));
      for (const notice of dedupe(planned, batch))
        tx.emit({ type: 'notice.planned', notice });
    },
  };
}

/**
 * Following issues. People follow an issue by hand here (anyone who may see it); the notice planner follows it for
 * them when they create it, own it, execute it, comment on it or are mentioned in it (`domains/notices`).
 */
import type { DatabaseConnection } from '@nocobase/db';

import type {
  IssueSubscriber,
  SubscriptionReason,
  SubscriptionState,
} from '../../../shared/subscriptions.js';
import type { Viewer } from '../../access/viewer.js';
import type { IdSource } from '../../kernel/ids.js';
import type { TxRunner } from '../../kernel/tx.js';
import type { UserDirectory } from '../../kernel/users.js';
import { requireVisibleIssue } from '../issues/index.js';
import './subscription.events.js';
import {
  activeSubscriptions,
  followedAmong,
  subscribe,
  unsubscribe,
} from './subscription.store.js';

export interface SubscriptionService {
  set(
    viewer: Viewer,
    issueIdOrKey: string,
    subscribed: boolean,
  ): Promise<SubscriptionState>;
  /** The people following the issue, named, in the order they started. */
  subscribers(
    conn: DatabaseConnection,
    issueId: string,
  ): Promise<IssueSubscriber[]>;
  /** The ids of the people following the issue. */
  subscriberIds(conn: DatabaseConnection, issueId: string): Promise<string[]>;
  /** Of `issueIds`, those the person follows, in one read. */
  followedBy(
    conn: DatabaseConnection,
    userId: string,
    issueIds: readonly string[],
  ): Promise<Set<string>>;
  /** Follows the issue for active users among `userIds`, in the caller's transaction. */
  follow(
    conn: DatabaseConnection,
    issueId: string,
    userIds: Iterable<string>,
    reason: SubscriptionReason,
  ): Promise<void>;
}

export function createSubscriptionService(deps: {
  readonly tx: TxRunner;
  readonly ids: IdSource;
  readonly users: UserDirectory;
}): SubscriptionService {
  const nextId = () => deps.ids.next();
  return {
    set(viewer, issueIdOrKey, subscribed) {
      return deps.tx.run(async (tx) => {
        const issue = await requireVisibleIssue(tx.conn, viewer, issueIdOrKey);
        const before = (await activeSubscriptions(tx.conn, issue.id)).some(
          (row) => row.userId === viewer.userId,
        );
        if (subscribed)
          await subscribe(tx.conn, nextId, issue.id, viewer.userId, 'manual');
        else await unsubscribe(tx.conn, nextId, issue.id, viewer.userId);
        if (before !== subscribed) {
          tx.emit({ type: 'issue.changed', issueId: issue.id });
          tx.emit({
            type: 'subscription.changed',
            issueId: issue.id,
            userId: viewer.userId,
            subscribed,
          });
        }
        return { subscribed };
      });
    },

    async subscribers(conn, issueId) {
      const rows = await activeSubscriptions(conn, issueId);
      const names = await deps.users.names(
        conn,
        rows.map((row) => row.userId),
      );
      return rows.map((row) => ({
        userId: row.userId,
        name: names.get(row.userId) ?? row.userId,
        reason: row.reason,
      }));
    },

    async subscriberIds(conn, issueId) {
      return (await activeSubscriptions(conn, issueId)).map(
        (row) => row.userId,
      );
    },

    followedBy(conn, userId, issueIds) {
      return followedAmong(conn, userId, issueIds);
    },

    async follow(conn, issueId, userIds, reason) {
      for (const userId of new Set(userIds))
        // API key identities act on issues but are never told about them.
        if (await deps.users.isPerson(conn, userId))
          await subscribe(conn, nextId, issueId, userId, reason);
    },
  };
}

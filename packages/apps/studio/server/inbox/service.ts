/**
 * Studio's inbox on the server, behind its port (`port.ts`). Notices are sent through the notification plugin's in-app
 * channel, which keeps each item's text and read state; Studio records, per notification and recipient, who sent it,
 * what the item is about, the sender's values and whether the decision it asks for still waits (`studioInboxNotices`).
 *
 * Information of one group (`notice.group`, such as new comments on an issue) merges into one item per user: the new
 * item replaces the user's previous one of the group, whether read or not, and counts on from it. A user who deleted
 * the previous item starts again from one. Groups are the source's own; decisions never merge.
 *
 * A contributor settles what it no longer needs: a decision by its key (`resolve`, `withdraw`), or everything about a
 * subject (`settle`), information included, which then reads as settled like a decided card. The inbox lists the
 * decisions still waiting first, from here (`waitingFor`), and the rest page by page from the in-app plugin.
 */
import type { NotificationService } from '@nocobase/app-plugin-notification/server';
import type { InAppStore } from '@nocobase/app-plugin-notification-in-app/server';
import type { DatabaseManager, DatabaseConnection } from '@nocobase/db';

import {
  INBOX_WAITING_MAX,
  INBOX_WITHDRAWN,
  type InboxData,
  type InboxKind,
  type InboxNotice,
  type InboxSubject,
  type InboxWaiting,
} from '../../shared/inbox.js';
import {
  findInAppItemId,
  inAppItemsOf,
  unreadNotifications,
} from './in-app-items.js';
import {
  checkDecisionRef,
  checkInboxSend,
  checkSettleRef,
  type StudioInboxPort,
  type InboxDecisionRef,
  type InboxSend,
} from './port.js';

const TABLE = 'studioInboxNotices';
/** At most this many ids per `notices` lookup: one page of the inbox. */
export const MAX_NOTICE_IDS = 100;

export interface NoticeRow {
  readonly actorType: string | null;
  readonly actorId: string | null;
  readonly notificationId: string;
  readonly source: string;
  readonly kind: string;
  readonly type: string;
  readonly subjectType: string | null;
  readonly subjectId: string | null;
  readonly subjectLabel: string | null;
  readonly decisionKey: string | null;
  readonly data: string | Record<string, unknown> | null;
  readonly resolvedAt: string | Date | null;
  readonly outcome: string | null;
  readonly count: number | string;
}

const COLUMNS = [
  'actorType',
  'actorId',
  'notificationId',
  'source',
  'kind',
  'type',
  'subjectType',
  'subjectId',
  'subjectLabel',
  'decisionKey',
  'data',
  'resolvedAt',
  'outcome',
  'count',
] as const;

export interface StudioInbox extends StudioInboxPort {
  /** Uncapped safe decision summaries for already authorized issue IDs; never includes notice data or recipients. */
  taskDecisions(
    issueIds: readonly string[],
    viewerUserId: string,
    connection?: DatabaseConnection,
  ): Promise<TaskDecisionSummary[]>;
  /** What Studio knows about the caller's items among `notificationIds`; unknown ids are left out. */
  notices(
    userId: string,
    notificationIds: readonly string[],
  ): Promise<InboxNotice[]>;
  /** How many decisions still wait on `userId`. */
  pending(userId: string): Promise<number>;
  unreadNotifications(userId: string): Promise<number>;
  /**
   * The decisions still waiting on `userId`, newest first, each with its in-app item (one the user deleted is left
   * out), at most `INBOX_WAITING_MAX`; only those about `subject` when given. The inbox lists them before everything
   * else, so a waiting decision never falls past the first page.
   */
  waitingFor(
    userId: string,
    subject?: { readonly type: string; readonly id: string },
  ): Promise<InboxWaiting[]>;
  /** Whether the decision still waits on someone: false once settled, or when it was never sent. */
  waiting(ref: InboxDecisionRef): Promise<boolean>;
  /** `userId`'s newest card of the decision while it still waits on them, with its data; null otherwise. */
  decision(userId: string, ref: InboxDecisionRef): Promise<InboxNotice | null>;
  /**
   * The decisions of `source` and `type` that still wait, one per decision key with everyone it waits on, oldest
   * first, at most `OPEN_DECISIONS_MAX`; for a board that shows who is waited on, not for any one person's inbox.
   * With `afterKey` (empty for the first page), reads in decision-key order for reconciliation, optionally scoped to a subject.
   */
  openDecisions(
    source: string,
    type: string,
    afterKey?: string,
    subject?: { readonly type: string; readonly id: string },
  ): Promise<OpenDecision[]>;
}

export interface TaskDecisionSummary {
  readonly issueId: string;
  readonly type: 'agent_blocked' | 'run_failed_final';
  readonly waitingForViewer: boolean;
}

/** A decision that still waits (`StudioInbox.openDecisions`). */
export interface OpenDecision {
  readonly decisionKey: string;
  readonly subject: InboxSubject | null;
  readonly data: InboxData | null;
  /** Everyone it waits on. */
  readonly userIds: readonly string[];
  readonly createdAt: string;
}

/** At most this many decisions per `openDecisions` read. */
export const OPEN_DECISIONS_MAX = 500;

export interface StudioInboxDependencies {
  /** Read-only identity projection of notices already scoped to their recipient. */
  readonly identities?: (
    userId: string,
    rows: readonly NoticeRow[],
    notices: InboxNotice[],
  ) => Promise<InboxNotice[]>;
  readonly database: Pick<DatabaseManager, 'connection'>;
  /** The notification service, or null when the application has none (nothing is sent then). */
  readonly notifications: () => NotificationService | null;
  /** The in-app items, to replace a user's previous item of a group; without it notices do not merge. */
  readonly inApp?: () => InAppStore | null;
  /** The in-app channel's name in the notification configuration. */
  readonly channel: string;
  /** Tells a user's open pages that their notices changed. */
  readonly announce: (userId: string) => void;
  readonly now?: () => Date;
}

const iso = (value: string | Date | null): string | null =>
  value === null ? null : new Date(value).toISOString();

function dataOf(value: unknown): InboxData | null {
  if (value === null) return null;
  const parsed: unknown = typeof value === 'string' ? JSON.parse(value) : value;
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? (parsed as InboxData)
    : null;
}

function noticeOf(row: NoticeRow): InboxNotice {
  return {
    notificationId: row.notificationId,
    source: row.source,
    kind: row.kind as InboxKind,
    type: row.type,
    subject:
      row.subjectType && row.subjectId
        ? { type: row.subjectType, id: row.subjectId, label: row.subjectLabel }
        : null,
    decisionKey: row.decisionKey,
    data: dataOf(row.data),
    count: Number(row.count),
    resolvedAt: iso(row.resolvedAt),
    outcome: row.outcome,
  };
}

export function createStudioInbox(deps: StudioInboxDependencies): StudioInbox {
  const now = deps.now ?? (() => new Date());
  const table = () => deps.database.connection().query;
  const views = (userId: string, rows: readonly NoticeRow[]) => {
    const notices = rows.map(noticeOf);
    return deps.identities
      ? deps.identities(userId, rows, notices)
      : Promise.resolve(notices);
  };

  /**
   * How many notices `userId`'s new item of `group` stands for: one more than their previous item's, whose in-app item
   * is deleted and row marked superseded; one when they deleted it.
   */
  async function merge(
    userId: string,
    group: string,
    notificationId: string,
  ): Promise<number> {
    const store = deps.inApp?.() ?? null;
    if (!store) return 1;
    const conn = deps.database.connection();
    const previous = await conn.query
      .selectFrom(TABLE)
      .select(['id', 'notificationId', 'count'])
      .where('userId', '=', userId)
      .where('groupKey', '=', group)
      .where('supersededAt', 'is', null)
      .where('notificationId', '!=', notificationId)
      .orderBy('createdAt', 'desc')
      .executeTakeFirst();
    if (!previous) return 1;
    await conn.query
      .updateTable(TABLE)
      .set({ supersededAt: now() })
      .where('id', '=', String(previous.id))
      .execute();
    const itemId = await findInAppItemId(
      conn,
      String(previous.notificationId),
      userId,
    );
    if (!itemId) return 1;
    await store.update({ id: itemId, userId, action: 'delete' });
    return Number(previous.count) + 1;
  }

  async function record(
    notice: InboxSend,
    notificationId: string,
  ): Promise<void> {
    const existing = new Set(
      (
        await table()
          .selectFrom(TABLE)
          .select('userId')
          .where('notificationId', '=', notificationId)
          .execute()
      ).map((row) => String(row.userId)),
    );
    const createdAt = now();
    const group =
      notice.kind === 'info' && notice.group
        ? `${notice.source}:${notice.group}`
        : null;
    const rows = [];
    for (const userId of new Set(notice.userIds)) {
      if (existing.has(userId)) continue;
      rows.push({
        id: `${notificationId}:${userId}`,
        notificationId,
        userId,
        source: notice.source,
        kind: notice.kind,
        type: notice.type,
        subjectType: notice.subject?.type ?? null,
        subjectId: notice.subject?.id ?? null,
        subjectLabel: notice.subject?.label ?? null,
        decisionKey:
          notice.kind === 'decision' ? (notice.decisionKey ?? null) : null,
        data: notice.data ? JSON.stringify(notice.data) : null,
        resolvedAt: null,
        outcome: null,
        groupKey: group,
        count: group ? await merge(userId, group, notificationId) : 1,
        supersededAt: null,
        actorType: notice.actor?.type ?? null,
        actorId: notice.actor?.id ?? null,
        createdAt,
      });
    }
    if (rows.length > 0) await table().insertInto(TABLE).values(rows).execute();
  }

  async function settle(
    source: string,
    decisionKey: string,
    outcome: string,
    data?: InboxData,
  ): Promise<void> {
    const waiting = await table()
      .selectFrom(TABLE)
      .select(['userId', 'data'])
      .where('source', '=', source)
      .where('decisionKey', '=', decisionKey)
      .where('kind', '=', 'decision')
      .where('resolvedAt', 'is', null)
      .execute();
    if (waiting.length === 0) return;
    await table()
      .updateTable(TABLE)
      .set({
        resolvedAt: now(),
        outcome,
        ...(data
          ? { data: JSON.stringify({ ...dataOf(waiting[0].data), ...data }) }
          : {}),
      })
      .where('source', '=', source)
      .where('decisionKey', '=', decisionKey)
      .where('kind', '=', 'decision')
      .where('resolvedAt', 'is', null)
      .execute();
    for (const userId of new Set(waiting.map((row) => String(row.userId))))
      deps.announce(userId);
  }

  return {
    async taskDecisions(issueIds, viewerUserId, connection) {
      const summaries = new Map<string, TaskDecisionSummary>();
      if (issueIds.length === 0) return [];
      const wanted = new Set(issueIds);
      // The open decisions on issues are few, so they are read once and narrowed here rather than in chunks of ids.
      const rows = await (connection?.query ?? table())
        .selectFrom(TABLE)
        .select(['subjectId', 'type', 'userId'])
        .distinct()
        .where('source', '=', 'projects')
        .where('subjectType', '=', 'issue')
        .where('kind', '=', 'decision')
        .where('resolvedAt', 'is', null)
        .where('type', 'in', ['agent_blocked', 'run_failed_final'])
        .execute();
      for (const row of rows) {
        const issueId = String(row.subjectId);
        if (!wanted.has(issueId)) continue;
        const type = row.type as TaskDecisionSummary['type'];
        const key = `${issueId}:${type}`;
        summaries.set(key, {
          issueId,
          type,
          waitingForViewer:
            summaries.get(key)?.waitingForViewer === true ||
            row.userId === viewerUserId,
        });
      }
      return [...summaries.values()];
    },
    async send(input) {
      const notice = checkInboxSend(input);
      const service = deps.notifications();
      const [first, ...rest] = notice.userIds;
      if (!service || !first) return;
      const result = await service.send({
        idempotencyKey: notice.key,
        source: { type: 'studio.inbox', referenceId: notice.type },
        messages: {
          [deps.channel]: {
            to: [first, ...rest],
            title: notice.title,
            // The in-app plugin requires a body; a notice without one repeats its title.
            body: notice.body || notice.title,
            ...(notice.path
              ? { target: { type: 'route', path: notice.path } }
              : {}),
          },
        },
      });
      await record(notice, result.notificationId);
      for (const userId of new Set(notice.userIds)) deps.announce(userId);
    },

    async resolve(ref) {
      checkDecisionRef(ref);
      await settle(ref.source, ref.decisionKey, ref.outcome, ref.data);
    },

    async withdraw(ref) {
      checkDecisionRef(ref);
      await settle(ref.source, ref.decisionKey, INBOX_WITHDRAWN);
    },

    async settle(ref) {
      checkSettleRef(ref);
      let select = table()
        .selectFrom(TABLE)
        .select('id')
        .select('userId')
        .where('source', '=', ref.source)
        .where('subjectType', '=', ref.subject.type)
        .where('subjectId', '=', ref.subject.id)
        .where('resolvedAt', 'is', null);
      if (ref.kind) select = select.where('kind', '=', ref.kind);
      if (ref.decisionKeys) {
        if (!ref.decisionKeys.length) return;
        select = select.where('decisionKey', 'in', [...ref.decisionKeys]);
      }
      if (ref.types?.length)
        select = select.where('type', 'in', [...ref.types]);
      if (ref.userIds) {
        if (ref.userIds.length === 0) return;
        select = select.where('userId', 'in', [...ref.userIds]);
      }
      const rows = await select.execute();
      if (rows.length === 0) return;
      await table()
        .updateTable(TABLE)
        .set({ resolvedAt: now(), outcome: ref.outcome })
        .where('resolvedAt', 'is', null)
        .where(
          'id',
          'in',
          rows.map((row) => String(row.id)),
        )
        .execute();
      for (const userId of new Set(rows.map((row) => String(row.userId))))
        deps.announce(userId);
    },

    async waitingFor(userId, subject) {
      let select = table()
        .selectFrom(TABLE)
        .select([...COLUMNS])
        .where('userId', '=', userId)
        .where('kind', '=', 'decision')
        .where('resolvedAt', 'is', null);
      if (subject)
        select = select
          .where('subjectType', '=', subject.type)
          .where('subjectId', '=', subject.id);
      const rows: NoticeRow[] = await select
        .orderBy('createdAt', 'desc')
        .limit(INBOX_WAITING_MAX)
        .execute();
      if (rows.length === 0) return [];
      const items = await inAppItemsOf(
        deps.database.connection(),
        userId,
        rows.map((row) => row.notificationId),
      );
      const notices = await views(userId, rows);
      return rows.flatMap((row, index) => {
        const item = items.get(row.notificationId);
        return item ? [{ item, notice: notices[index] }] : [];
      });
    },

    async notices(userId, notificationIds) {
      const ids = [...new Set(notificationIds)].slice(0, MAX_NOTICE_IDS);
      if (ids.length === 0) return [];
      const rows: NoticeRow[] = await table()
        .selectFrom(TABLE)
        .select([...COLUMNS])
        .where('userId', '=', userId)
        .where('notificationId', 'in', ids)
        .execute();
      return views(userId, rows);
    },

    async waiting(ref) {
      checkDecisionRef(ref);
      const row = await table()
        .selectFrom(TABLE)
        .select('id')
        .where('source', '=', ref.source)
        .where('decisionKey', '=', ref.decisionKey)
        .where('kind', '=', 'decision')
        .where('resolvedAt', 'is', null)
        .executeTakeFirst();
      return row !== undefined;
    },

    async decision(userId, ref) {
      checkDecisionRef(ref);
      const row: NoticeRow | undefined = await table()
        .selectFrom(TABLE)
        .select([...COLUMNS])
        .where('userId', '=', userId)
        .where('source', '=', ref.source)
        .where('decisionKey', '=', ref.decisionKey)
        .where('kind', '=', 'decision')
        .where('resolvedAt', 'is', null)
        .orderBy('createdAt', 'desc')
        .executeTakeFirst();
      return row ? (await views(userId, [row]))[0] : null;
    },

    async openDecisions(source, type, afterKey, subject) {
      let select = table()
        .selectFrom(TABLE)
        .select([
          'decisionKey',
          'userId',
          'subjectType',
          'subjectId',
          'subjectLabel',
          'data',
          'createdAt',
        ])
        .where('source', '=', source)
        .where('type', '=', type)
        .where('kind', '=', 'decision')
        .where('resolvedAt', 'is', null);
      if (afterKey !== undefined)
        select = select.where('decisionKey', '>', afterKey);
      if (subject)
        select = select
          .where('subjectType', '=', subject.type)
          .where('subjectId', '=', subject.id);
      const rows = await select
        .orderBy(afterKey === undefined ? 'createdAt' : 'decisionKey', 'asc')
        .limit(OPEN_DECISIONS_MAX * 4)
        .execute();
      const byKey = new Map<string, OpenDecision & { userIds: string[] }>();
      for (const row of rows) {
        const key = String(row.decisionKey);
        const known = byKey.get(key);
        if (known) {
          if (!known.userIds.includes(String(row.userId)))
            known.userIds.push(String(row.userId));
          continue;
        }
        if (byKey.size >= OPEN_DECISIONS_MAX) continue;
        byKey.set(key, {
          decisionKey: key,
          subject:
            row.subjectType && row.subjectId
              ? {
                  type: row.subjectType as string,
                  id: row.subjectId as string,
                  label: (row.subjectLabel as string | null) ?? null,
                }
              : null,
          data: dataOf(row.data),
          userIds: [String(row.userId)],
          createdAt: iso(row.createdAt as string | Date) ?? '',
        });
      }
      return [...byKey.values()];
    },

    unreadNotifications: (userId) =>
      unreadNotifications(deps.database.connection(), userId),

    async pending(userId) {
      // A handful per person: decisions stop counting once resolved.
      const rows = await table()
        .selectFrom(TABLE)
        .select('id')
        .where('userId', '=', userId)
        .where('kind', '=', 'decision')
        .where('resolvedAt', 'is', null)
        .execute();
      return rows.length;
    },
  };
}

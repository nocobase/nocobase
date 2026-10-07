/**
 * Notices for the plugin's events: who is told what, worded once in the application's default language.
 *
 * - A status that notifies its owner: an `owner_notified` notice to the owner.
 * - A status change waiting for approval: an `approval_requested` decision to its approvers.
 * - A decided request: the decision is resolved, and whoever asked hears an approval or a rejection
 *   (`approval_decided`) unless they decided it themselves; when another kind (an agent) asked, the issue's owner
 *   hears it instead.
 * - An approved request that no longer applies (its conditions failed when it was approved): an `approval_stale` notice
 *   to the approvers and whoever asked (the owner when another kind asked), except the approver who approved it. A
 *   request that went stale because the issue left the status tells nobody.
 * - Notices planned in a transaction (`notice.planned`, `domains/notices`): comments, mentions, status changes and
 *   assignments.
 * - Sub-issues and dependencies: the rules of `domains/subtasks/subtask.notices.ts` (`dependency_released`,
 *   `batch_done`).
 *
 * Every notice goes only to those who may see its issue, when the application tells (`visibleTo`).
 *
 * Where notices go is `projectsNoticesToken` when the application binds it (the assembling application keeps an inbox); otherwise they go
 * straight to the notification plugin's in-app channel `projects.inboxChannel` (`inbox` by default). Without either,
 * nothing is sent: the activity log still records what happened.
 */
import {
  notificationServiceToken,
  type NotificationConfig,
} from '@nocobase/app-plugin-notification/server';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { i18nToken } from '@nocobase/app-server/i18n';

import {
  hasDefaultName,
  isLocalizedMessage,
  messageText,
} from '../../shared/workflows.js';
import type { DatabaseConnection } from '@nocobase/db';

import { findIssue, issueVisibleTo } from '../domains/issues/index.js';
import { createUserDirectory } from '../kernel/users.js';
import type { PlannedNotice } from '../domains/notices/index.js';
import '../domains/notices/notice.events.js';
import {
  batchDoneNotice,
  dependencyReleasedNotice,
} from '../domains/subtasks/index.js';
import type { DomainEventBus } from '../kernel/events.js';
import {
  projectsNoticesToken,
  type ProjectNotice,
  type ProjectsAccess,
  type ProjectsNotices,
} from '../tokens.js';
import { NAMESPACE } from './authorization.js';

const DEFAULT_CHANNEL = 'inbox';

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** The notification plugin's in-app channel, or null when the application does not configure one. */
function directNotices(app: AppPluginApplication): ProjectsNotices | null {
  const channel =
    app.config.get<{ inboxChannel?: string }>('projects')?.inboxChannel ??
    DEFAULT_CHANNEL;
  const config =
    app.config.get<NotificationConfig>('notification')?.channels[channel];
  const { container } = app;
  if (
    !config ||
    config.enabled === false ||
    config.provider !== 'in-app' ||
    !container.has(notificationServiceToken)
  )
    return null;
  return {
    async send(notice) {
      const [first, ...rest] = notice.userIds;
      if (!first) return;
      await container.resolve(notificationServiceToken).send({
        idempotencyKey: notice.key,
        source: { type: 'pm', referenceId: notice.type },
        messages: {
          [channel]: {
            to: [first, ...rest],
            title: notice.title,
            body: notice.body,
            target: { type: 'route', path: notice.path },
          },
        },
      });
    },
    resolve: () => Promise.resolve(),
  };
}

/** Those among `userIds` who may see the issue. */
export type VisibilityFilter = (
  issueId: string,
  userIds: readonly string[],
) => Promise<string[]>;

/**
 * Those of the recipients who are people and may see the issue, by the application's own reading of each person's
 * roles; everyone when the application cannot tell (`ProjectsAccess.permissionsOfUser`). Run after commit: on SQLite a permission check
 * inside a transaction waits for the connection the transaction holds.
 */
export function createVisibilityFilter(
  access: Pick<ProjectsAccess, 'permissionsOfUser'>,
  read: () => DatabaseConnection,
): VisibilityFilter | undefined {
  const permissionsOf = access.permissionsOfUser?.bind(access);
  if (!permissionsOf) return undefined;
  const users = createUserDirectory();
  return async (issueId, userIds) => {
    const conn = read();
    const issue = await findIssue(conn, issueId);
    if (!issue || issue.deletedAt) return [];
    // API key identities (service accounts) act on issues but are never told anything: they have no inbox.
    const people = await users.people(conn, userIds);
    const result: string[] = [];
    for (const userId of new Set(userIds))
      if (
        people.has(userId) &&
        (await issueVisibleTo(
          conn,
          { userId, permissions: await permissionsOf(userId) },
          issue,
        ))
      )
        result.push(userId);
    return result;
  };
}

/** Starts sending; returns what stops it. */
export function startNotifications(
  app: AppPluginApplication,
  events: DomainEventBus,
  visibleTo?: VisibilityFilter,
): () => void {
  const { container } = app;
  if (!container.has(i18nToken)) return () => undefined;
  const direct = directNotices(app);
  // Resolved on each use: the application binds its own after the plugin's providers register.
  const sink = (): ProjectsNotices | null =>
    container.has(projectsNoticesToken)
      ? container.resolve(projectsNoticesToken)
      : direct;

  const i18n = container.resolve(i18nToken);
  const translator = async (): Promise<Translate> => {
    const locale = i18n.getDefaultLocale();
    await i18n.ensureLocaleLoaded(locale);
    return i18n.getFixedT(NAMESPACE, locale);
  };
  const statusName = (t: Translate, key: string, name: string): string =>
    hasDefaultName({ key, name })
      ? t(`status.${key}`, { defaultValue: name })
      : name;
  const send = async (notice: ProjectNotice): Promise<void> => {
    const userIds = visibleTo
      ? await visibleTo(notice.issue.id, notice.userIds)
      : notice.userIds;
    if (userIds.length > 0) await sink()?.send({ ...notice, userIds });
  };
  const issuePath = (identifier: string) =>
    `/issues/${encodeURIComponent(identifier)}`;

  const planned = async (
    t: Translate,
    notice: PlannedNotice,
  ): Promise<{ title: string; body: string }> => {
    const values = {
      identifier: notice.issue.identifier,
      actor: notice.actor.name ?? t('notifications.someone'),
    };
    const quote = notice.params.excerpt ?? notice.issue.title;
    switch (notice.type) {
      case 'commented':
        return { title: t('notifications.commented', values), body: quote };
      case 'mentioned':
        return notice.params.source === 'description'
          ? {
              title: t('notifications.mentioned.description', values),
              body: notice.issue.title,
            }
          : {
              title: t('notifications.mentioned.comment', values),
              body: quote,
            };
      case 'status_changed':
        return {
          title: t('notifications.statusChanged', {
            ...values,
            status: statusName(
              t,
              notice.params.status ?? '',
              notice.params.statusName ?? notice.params.status ?? '',
            ),
          }),
          body: notice.issue.title,
        };
      case 'owner_assigned':
        return {
          title: t('notifications.ownerAssigned', values),
          body: notice.issue.title,
        };
      case 'executor_assigned':
        return {
          title: t('notifications.executorAssigned', values),
          body: notice.issue.title,
        };
      default:
        // A plugin's type words its own title in `params.title`.
        return {
          title: notice.params.title ?? notice.issue.identifier,
          body: notice.params.body ?? notice.issue.title,
        };
    }
  };

  const stops = [
    events.on('notice.planned', async ({ notice }) => {
      if (!sink()) return;
      const text = await planned(await translator(), notice);
      await send({
        key: notice.key,
        kind: notice.kind,
        type: notice.type,
        userIds: notice.userIds,
        ...text,
        path: notice.path ?? issuePath(notice.issue.identifier),
        issue: { id: notice.issue.id, identifier: notice.issue.identifier },
        ...(notice.group ? { group: notice.group } : {}),
        actor: notice.actor,
        params: notice.params,
      });
    }),
    events.on('workflow.ownerNotified', async (event) => {
      if (!sink()) return;
      const t = await translator();
      await send({
        key: `pm:owner-notified:${event.issueId}:${event.statusKey}:${Date.now()}`,
        kind: 'info',
        type: 'owner_notified',
        userIds: [event.ownerUserId],
        title: t('notifications.ownerNotified', {
          identifier: event.identifier,
          status: statusName(t, event.statusKey, event.statusName),
        }),
        // A keyed message is worded here in the default language, and its key travels along so an inbox can word
        // it in each reader's.
        body: messageText(event.message, t) ?? event.title,
        path: issuePath(event.identifier),
        issue: { id: event.issueId, identifier: event.identifier },
        params: {
          identifier: event.identifier,
          status: event.statusKey,
          statusName: event.statusName,
          ...(isLocalizedMessage(event.message)
            ? {
                messageKey: event.message.key,
                ...(event.message.ns ? { messageNs: event.message.ns } : {}),
                ...(event.message.defaultValue
                  ? { messageDefault: event.message.defaultValue }
                  : {}),
              }
            : {}),
        },
      });
    }),
    events.on('approval.requested', async (event) => {
      if (!sink()) return;
      const t = await translator();
      await send({
        key: `pm:approval-requested:${event.requestId}`,
        kind: 'decision',
        type: 'approval_requested',
        userIds: event.approverUserIds,
        title: t('notifications.approvalRequested', {
          identifier: event.identifier,
          status: statusName(t, event.toStatus, event.toStatusName),
        }),
        body: event.title,
        path: issuePath(event.identifier),
        issue: { id: event.issueId, identifier: event.identifier },
        approvalRequestId: event.requestId,
        params: {
          identifier: event.identifier,
          status: event.toStatus,
          statusName: event.toStatusName,
        },
      });
    }),
    events.on('approval.decided', async (event) => {
      const target = sink();
      if (!target) return;
      await target.resolve({
        approvalRequestId: event.requestId,
        outcome: event.status,
      });
      const { requestedBy } = event;
      // Whoever asked hears the outcome; the owner does when another kind (an agent) asked.
      const asker =
        requestedBy.type === 'user' ? requestedBy.id : event.ownerUserId;
      const t = await translator();
      const status = statusName(t, event.toStatus, event.toStatusName);
      const common = {
        path: issuePath(event.identifier),
        issue: { id: event.issueId, identifier: event.identifier },
        approvalRequestId: event.requestId,
      };
      if (event.status === 'stale' && event.staleReason) {
        const userIds = [...event.approverUserIds, ...(asker ? [asker] : [])]
          .filter((userId) => userId !== event.staleReason?.attemptedById)
          .filter((userId, index, all) => all.indexOf(userId) === index);
        if (userIds.length > 0)
          await send({
            ...common,
            key: `pm:approval-stale:${event.requestId}`,
            kind: 'info',
            type: 'approval_stale',
            userIds,
            title: t('notifications.approval.stale', {
              identifier: event.identifier,
              status,
            }),
            body: event.staleReason.message ?? event.title,
            params: {
              identifier: event.identifier,
              status: event.toStatus,
              statusName: event.toStatusName,
              outcome: event.status,
              code: event.staleReason.code,
              ...(event.staleReason.message
                ? { message: event.staleReason.message }
                : {}),
            },
          });
        return;
      }
      if (event.status !== 'approved' && event.status !== 'rejected') return;
      if (!asker || asker === event.decidedById) return;
      await send({
        ...common,
        key: `pm:approval-decided:${event.requestId}`,
        kind: 'info',
        type: 'approval_decided',
        userIds: [asker],
        title: t(`notifications.approval.${event.status}`, {
          identifier: event.identifier,
          status,
        }),
        body: event.comment ?? event.title,
        params: {
          identifier: event.identifier,
          status: event.toStatus,
          statusName: event.toStatusName,
          outcome: event.status,
          ...(requestedBy.type === 'user'
            ? {}
            : { requestedByType: requestedBy.type }),
        },
      });
    }),
    events.on('issue.dependencyReleased', async (event) => {
      if (!sink()) return;
      const notice = dependencyReleasedNotice(event, await translator());
      if (notice) await send(notice);
    }),
    events.on('issue.batchDone', async (event) => {
      if (!sink()) return;
      const notice = batchDoneNotice(event, await translator());
      if (notice) await send(notice);
    }),
  ];
  return () => {
    for (const stop of stops) stop();
  };
}

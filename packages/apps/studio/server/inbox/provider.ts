/**
 * Studio's inbox: binds its port (`studioInboxPortToken`), through which any package Studio assembles sends notices and
 * settles decisions, to Studio's own inbox, which sends them through the in-app channel `studio.inboxChannel` (`inbox` by
 * default) and keeps what each item is about. The projects plugin's notices (`projectsNoticesToken`) come in through
 * the port as source `projects`, and the agents plugin's runner notices (a runtime that needs an upgrade) as source `runners`
 * (`runners.ts`). Agents read it through `studio/server/agents` (`conversation/inbox.ts`).
 */
import {
  notificationServiceToken,
  type NotificationConfig,
} from '@nocobase/app-plugin-notification/server';
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import { inAppNotificationStoreToken } from '@nocobase/app-plugin-notification-in-app/server';
import {
  projectsNoticesToken,
  projectsToken,
} from '@nocobase/app-plugin-projects/server/tokens';
import { loggingToken } from '@nocobase/app-server/logging';
import type { Application } from '@nocobase/app-server/application';
import {
  realtimeServiceToken,
  type DefinedRealtimeTopic,
} from '@nocobase/app-server/realtime';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';

import {
  STUDIO_INBOX_TOPIC,
  type StudioInboxEvent,
} from '../../shared/inbox.js';
import { bindRunnersNotices } from './runners.js';
import { studioInboxPortToken } from './port.js';
import { createProjectsNotices } from './projects.js';
import { bindDecisionCleanup, createDecisionReconciler } from './reconcile.js';
import { createStudioInbox } from './service.js';
import { noticeIdentities } from './identities.js';
import { createInboxSource } from '../agents/conversation/inbox.js';
import {
  decisionReconcilerToken,
  studioInboxSourceToken,
  studioInboxToken,
} from './token.js';
import {
  reconcileFailedRunCards,
  watchFailedRunCards,
} from '../agents/failed-run-cards.js';
import { RUN_FAILED_FINAL } from '../agents/notices.js';
import { PM_REALTIME_TOPIC } from '@nocobase/app-plugin-projects/shared/realtime';

const DEFAULT_CHANNEL = 'inbox';

export default class StudioInboxProvider extends ServiceProvider<Application> {
  public readonly name: string = 'studio/inbox';
  private topic?: DefinedRealtimeTopic<StudioInboxEvent, 'user'>;
  private releaseRunners?: () => void;
  private releaseFailedRuns?: () => Promise<void>;
  private reconciliation?: Promise<void>;
  private releaseIssueDecisions?: () => void;

  private reportDecisionError(error: unknown, decisionKey?: string): void {
    const { container } = this.app;
    if (container.has(loggingToken))
      container
        .resolve(loggingToken)
        .getLogger('inbox')
        .error(
          { err: error, decisionKey },
          'Studio could not reconcile an issue decision.',
        );
    else
      console.error(
        'Studio could not reconcile an issue decision.',
        decisionKey,
        error,
      );
  }

  private reconcileFailedRuns(issueId?: string): Promise<void> {
    const { container } = this.app;
    if (!container.has(agentsToken) || !container.has(projectsToken))
      return Promise.resolve();
    return reconcileFailedRunCards(
      container.resolve(agentsToken),
      container.resolve(projectsToken),
      container.resolve(studioInboxToken),
      issueId,
    );
  }

  /** The in-app channel, when the notification configuration has one by that name. */
  private channel(): string | null {
    const name =
      this.app.config.get<{ inboxChannel?: string }>('studio')?.inboxChannel ??
      DEFAULT_CHANNEL;
    const config =
      this.app.config.get<NotificationConfig>('notification')?.channels[name];
    return config && config.enabled !== false && config.provider === 'in-app'
      ? name
      : null;
  }

  public override register(): void {
    const channel = this.channel();
    this.app.container.singleton(studioInboxToken, (resolver) =>
      createStudioInbox({
        database: resolver.resolve(databaseManagerToken),
        identities: (_userId, rows, notices) =>
          resolver.has(agentsToken)
            ? noticeIdentities(
                resolver.resolve(databaseManagerToken).connection(),
                resolver.resolve(agentsToken),
                rows,
                notices,
              )
            : Promise.resolve(notices),
        notifications: () =>
          channel && resolver.has(notificationServiceToken)
            ? resolver.resolve(notificationServiceToken)
            : null,
        inApp: () =>
          resolver.has(inAppNotificationStoreToken)
            ? resolver.resolve(inAppNotificationStoreToken)
            : null,
        channel: channel ?? DEFAULT_CHANNEL,
        announce: (userId) => {
          void this.topic?.publishFor(userId, { kind: 'studio.inbox.changed' });
          // Public invalidation carries no issue, decision or recipient data; every subsequent read is authorized.
          if (resolver.has(realtimeServiceToken))
            resolver.resolve(realtimeServiceToken).publish(PM_REALTIME_TOPIC, {
              kind: 'pm.changed',
              domain: 'issues',
            });
        },
      }),
    );
    this.app.container.singleton(decisionReconcilerToken, (resolver) =>
      createDecisionReconciler(
        () => resolver.resolve(databaseManagerToken).connection(),
        () => resolver.resolve(studioInboxToken),
        (error, decisionKey) => this.reportDecisionError(error, decisionKey),
      ),
    );
    this.app.container.singleton(studioInboxSourceToken, (resolver) =>
      createInboxSource({
        inbox: resolver.resolve(studioInboxToken),
        inApp: () =>
          resolver.has(inAppNotificationStoreToken)
            ? resolver.resolve(inAppNotificationStoreToken)
            : null,
      }),
    );
    this.app.container.singleton(studioInboxPortToken, (resolver) =>
      resolver.resolve(studioInboxToken),
    );
    this.app.container.singleton(projectsNoticesToken, (resolver) =>
      createProjectsNotices(
        () => resolver.resolve(studioInboxPortToken),
        async (notice) => {
          if (notice.type === RUN_FAILED_FINAL)
            await this.reconcileFailedRuns(notice.issue.id);
          if (
            notice.kind === 'decision' &&
            ['agent_blocked', 'run_failed_final', 'owner_handoff'].includes(
              notice.type,
            )
          )
            await resolver
              .resolve(decisionReconcilerToken)
              .issue(notice.issue.id);
        },
      ),
    );
  }

  public override boot(): Promise<void> {
    const { container } = this.app;
    if (!this.topic && container.has(realtimeServiceToken))
      this.topic = container
        .resolve(realtimeServiceToken)
        .defineTopic<StudioInboxEvent, 'user'>(STUDIO_INBOX_TOPIC, {
          audience: 'user',
        });
    if (!this.releaseRunners && container.has(agentsToken))
      this.releaseRunners = bindRunnersNotices(
        container.resolve(agentsToken).events,
        () => container.resolve(studioInboxPortToken),
        (error) =>
          console.error('Studio could not deliver a runners notice.', error),
      );
    if (
      !this.releaseFailedRuns &&
      container.has(agentsToken) &&
      container.has(projectsToken)
    )
      this.releaseFailedRuns = watchFailedRunCards(
        container.resolve(agentsToken),
        container.resolve(projectsToken),
        container.resolve(studioInboxToken),
        (error) =>
          console.error('Studio could not settle failed-run cards.', error),
      );
    if (!this.releaseIssueDecisions && container.has(projectsToken))
      this.releaseIssueDecisions = bindDecisionCleanup(
        container.resolve(projectsToken),
        container.resolve(decisionReconcilerToken),
        (error) => this.reportDecisionError(error),
      );
    this.reconciliation ??= this.reconcileFailedRuns().catch((error) =>
      console.error(
        'Studio could not reconcile failed-run cards at startup.',
        error,
      ),
    );
    return Promise.resolve();
  }

  public override async shutdown(): Promise<void> {
    this.releaseIssueDecisions?.();
    this.releaseIssueDecisions = undefined;
    this.releaseRunners?.();
    this.releaseRunners = undefined;
    await this.releaseFailedRuns?.();
    this.releaseFailedRuns = undefined;
    await this.reconciliation;
    this.reconciliation = undefined;
    this.topic?.close();
    this.topic = undefined;
    return Promise.resolve();
  }
}

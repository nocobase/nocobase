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
import { projectsNoticesToken } from '@nocobase/app-plugin-projects/server/tokens';
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
import { createStudioInbox } from './service.js';
import { createInboxSource } from '../agents/conversation/inbox.js';
import { studioInboxSourceToken, studioInboxToken } from './token.js';

const DEFAULT_CHANNEL = 'inbox';

export default class StudioInboxProvider extends ServiceProvider<Application> {
  public readonly name: string = 'studio/inbox';
  private topic?: DefinedRealtimeTopic<StudioInboxEvent, 'user'>;
  private releaseRunners?: () => void;

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
        notifications: () =>
          channel && resolver.has(notificationServiceToken)
            ? resolver.resolve(notificationServiceToken)
            : null,
        inApp: () =>
          resolver.has(inAppNotificationStoreToken)
            ? resolver.resolve(inAppNotificationStoreToken)
            : null,
        channel: channel ?? DEFAULT_CHANNEL,
        announce: (userId) =>
          void this.topic?.publishFor(userId, { kind: 'studio.inbox.changed' }),
      }),
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
      createProjectsNotices(() => resolver.resolve(studioInboxPortToken)),
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
    return Promise.resolve();
  }

  public override shutdown(): Promise<void> {
    this.releaseRunners?.();
    this.releaseRunners = undefined;
    this.topic?.close();
    this.topic = undefined;
    return Promise.resolve();
  }
}

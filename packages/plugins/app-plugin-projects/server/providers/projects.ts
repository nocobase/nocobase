import { serverFileRepositoryManagerToken } from '@nocobase/app-plugin-file/server';
import { userManagementServiceToken } from '@nocobase/app-plugin-users/server/tokens';
import { driveManagerToken } from '@nocobase/app-server/drive';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { realtimeServiceToken } from '@nocobase/app-server/realtime';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';

import {
  PM_REALTIME_TOPIC,
  type PmChangeEvent,
} from '../../shared/realtime.js';
import { createProjects } from '../composition.js';
import { createChangeAnnouncer } from './change-announcer.js';
import { createAttachmentStorage } from '../domains/attachments/index.js';
import { createStatusEventTypes } from '../domains/statuses/index.js';
import { createKindRegistry } from '../kernel/kinds.js';
import { createUserDirectory } from '../kernel/users.js';
import {
  projectsAccessToken,
  projectsIntakeOrganizerToken,
  projectsKindsToken,
  projectsNoticeRulesToken,
  projectsPlanHooksToken,
  projectsStatusEventsToken,
  projectsToken,
  projectsTriggersToken,
} from '../tokens.js';
import { NAMESPACE } from './authorization.js';
import { createVisibilityFilter, startNotifications } from './notifications.js';

const PURGE_DELAY_MS = 60_000;
const PURGE_INTERVAL_MS = 60 * 60_000;

/**
 * Binds the plugin's services; they are created on first use. At boot, unused files start to be purged every hour,
 * accepting an invitation from the member settings starts to add the invitee to its projects, and changes are announced
 * on the realtime topic so open pages refresh.
 */
export class ProjectsProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = NAMESPACE;
  private readonly releases: (() => void)[] = [];

  public override register(): void {
    this.app.container.singleton(projectsKindsToken, () =>
      createKindRegistry(createUserDirectory()),
    );
    this.app.container.singleton(projectsStatusEventsToken, () =>
      createStatusEventTypes(),
    );
    this.app.container.singleton(projectsToken, (resolver) =>
      createProjects({
        database: resolver.resolve(databaseManagerToken),
        idGenerator: resolver.resolve(idGeneratorToken),
        access: resolver.resolve(projectsAccessToken),
        invitations: resolver.resolve(userManagementServiceToken),
        kinds: resolver.resolve(projectsKindsToken),
        statusEvents: resolver.resolve(projectsStatusEventsToken),
        // Resolved on each use: a plugin may bind its triggers after this one registers.
        triggers: () =>
          this.app.container.has(projectsTriggersToken)
            ? this.app.container.resolve(projectsTriggersToken)
            : undefined,
        planHooks: () =>
          this.app.container.has(projectsPlanHooksToken)
            ? this.app.container.resolve(projectsPlanHooksToken)
            : undefined,
        intakeOrganizer: () =>
          this.app.container.has(projectsIntakeOrganizerToken)
            ? this.app.container.resolve(projectsIntakeOrganizerToken)
            : undefined,
        // Asked on each use: the application's default Drive disk, through the file plugin when it is registered.
        storage: createAttachmentStorage({
          uploader: () =>
            this.app.container.has(serverFileRepositoryManagerToken)
              ? this.app.container.resolve(serverFileRepositoryManagerToken)
              : null,
          disks: () =>
            this.app.container.has(driveManagerToken)
              ? this.app.container.resolve(driveManagerToken)
              : null,
          disk: () =>
            this.app.config.get<{ readonly default?: string }>('drive')
              ?.default ?? 'local',
          onError: (error) =>
            console.error('Projects could not delete a stored file.', error),
        }),
        basePath: () => this.app.publicBasePath,
        onListenerError: (error) =>
          console.error('Projects event listener failed.', error),
      }),
    );
    this.app.container.singleton(
      projectsNoticeRulesToken,
      (resolver) => resolver.resolve(projectsToken).noticeRules,
    );
  }

  public override boot(): Promise<void> {
    if (this.releases.length > 0) return Promise.resolve();
    const { container } = this.app;
    const { invitations, events, tx } = container.resolve(projectsToken);
    this.releases.push(
      container
        .resolve(userManagementServiceToken)
        .onInvitationAccepted((context) => invitations.accepted(context)),
      startNotifications(
        this.app,
        events,
        createVisibilityFilter(container.resolve(projectsAccessToken), () =>
          tx.read(),
        ),
      ),
    );
    if (container.has(realtimeServiceToken)) {
      const topic = container
        .resolve(realtimeServiceToken)
        // Announcements name issues by id: signed-in connections only.
        .defineTopic<PmChangeEvent, 'public'>(PM_REALTIME_TOPIC, {
          audience: 'public',
          authenticated: true,
        });
      const announcer = createChangeAnnouncer((change) =>
        topic.publish(change),
      );
      this.releases.push(
        events.onAny((event) => {
          // Planned notices are delivered, not shown.
          if (event.type.startsWith('notice.')) return;
          announcer.add(event);
        }),
        () => announcer.close(),
        () => topic.close(),
      );
    }
    this.releases.push(this.schedulePurge());
    return Promise.resolve();
  }

  /**
   * Uploads attached to nothing for a day and deleted comments' files are purged every hour, the first time a minute
   * after boot. A pass is safe to run on several instances at once: a row is deleted only while still unattached.
   */
  private schedulePurge(): () => void {
    const purge = () => {
      this.app.container
        .resolve(projectsToken)
        .attachments.purge()
        .catch((error: unknown) =>
          console.error('Projects could not purge unused files.', error),
        );
    };
    const first = setTimeout(purge, PURGE_DELAY_MS);
    const every = setInterval(purge, PURGE_INTERVAL_MS);
    first.unref();
    every.unref();
    return () => {
      clearTimeout(first);
      clearInterval(every);
    };
  }

  public override shutdown(): Promise<void> {
    for (const release of this.releases.splice(0)) release();
    return Promise.resolve();
  }
}

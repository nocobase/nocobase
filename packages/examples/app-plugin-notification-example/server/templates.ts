import { ServiceProvider } from '@nocobase/service-provider';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  describeNotificationTemplateChannel,
  notificationTemplateRegistryToken,
  type NotificationConfigInput,
} from '@nocobase/app-plugin-notification/server';

/** The real sender and synthetic preview both use this English-only renderer. */
export function renderTaskNotification(
  task: {
    readonly title: string;
    readonly description: string;
    readonly status: string;
  },
  event: 'assigned' | 'updated',
): { title: string; body: string } {
  return {
    title:
      event === 'assigned'
        ? `New task: ${task.title}`
        : `Task updated: ${task.title}`,
    body: [
      `Task: ${task.title}`,
      `Description: ${task.description}`,
      `Status: ${task.status}`,
    ].join('\n'),
  };
}

export class TaskTemplateProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name = 'notification-example.templates';
  private readonly releases: (() => void)[] = [];
  public override boot(): Promise<void> {
    if (this.releases.length) return Promise.resolve();
    const registry = this.app.container.resolve(
      notificationTemplateRegistryToken,
    );
    for (const event of ['assigned', 'updated'] as const) {
      this.releases.push(
        registry.register({
          id: `notification-example.task-${event}`,
          contributor: '@nocobase/app-plugin-notification-example',
          category: 'Tasks',
          name: event === 'assigned' ? 'Task assigned' : 'Task updated',
          trigger:
            event === 'assigned'
              ? 'A task is created.'
              : 'A task is updated, including reassignment.',
          recipients:
            event === 'assigned'
              ? 'The assignee, including self-assignment.'
              : 'The creator, previous assignee and new assignee, deduplicated and excluding the acting user.',
          businessRule:
            'Triggered by task actions; there is no separate notification switch.',
          locales: ['en-US'],
          languagePolicy:
            'English only, independent of the recipient or interface language. Other preview locales fall back to en-US.',
          variables: [
            { name: 'title', description: 'Task title' },
            { name: 'description', description: 'Task description' },
            { name: 'status', description: 'Task status' },
          ],
          channels: () => [
            describeNotificationTemplateChannel(
              this.app.config.get<NotificationConfigInput>('notification'),
              'inbox',
            ),
          ],
          render: (_locale, example) =>
            renderTaskNotification(
              example === 'definition'
                ? {
                    title: '{{title}}',
                    description: '{{description}}',
                    status: '{{status}}',
                  }
                : {
                    title: 'Review the sample proposal',
                    description: 'Synthetic task for preview only.',
                    status: 'open',
                  },
              event,
            ),
        }),
      );
    }
    return Promise.resolve();
  }
  public override shutdown(): Promise<void> {
    this.releases.splice(0).forEach((release) => release());
    return Promise.resolve();
  }
}

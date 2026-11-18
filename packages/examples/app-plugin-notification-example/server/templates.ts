import { ServiceProvider } from '@nocobase/service-provider';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  describeNotificationTemplateChannel,
  notificationI18nText,
  notificationTemplateRegistryToken,
  type NotificationConfigInput,
  type NotificationI18nText,
} from '@nocobase/app-plugin-notification/server';

/** Administrator-facing text, translated in the browser from this plugin's client locales. */
function text(key: string, defaultValue: string): NotificationI18nText {
  return {
    ns: '@nocobase/app-plugin-notification-example',
    key: `notificationTemplates.${key}`,
    defaultValue,
  };
}

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
          contributorLabel: text('contributor', 'Notification examples'),
          category: text('category', 'Tasks'),
          name:
            event === 'assigned'
              ? text('assigned.name', 'Task assigned')
              : text('updated.name', 'Task updated'),
          trigger:
            event === 'assigned'
              ? text('assigned.trigger', 'A task is created.')
              : text(
                  'updated.trigger',
                  'A task is changed, including when it is reassigned.',
                ),
          recipients:
            event === 'assigned'
              ? text(
                  'assigned.recipients',
                  'The assignee, even when they assigned the task to themselves.',
                )
              : text(
                  'updated.recipients',
                  'The creator, the previous assignee and the new assignee, each once. The person who made the change is not notified.',
                ),
          businessRule: text(
            'businessRule',
            'Sent whenever the task action happens. There is no separate switch to turn it off.',
          ),
          locales: ['en-US'],
          languagePolicy: text(
            'languagePolicy',
            "Always in English, whatever the recipient's language.",
          ),
          variables: [
            {
              name: 'title',
              description: text('variables.title', 'Task title'),
            },
            {
              name: 'description',
              description: text('variables.description', 'Task description'),
            },
            {
              name: 'status',
              description: text('variables.status', 'Task status'),
            },
          ],
          channels: () => [
            describeNotificationTemplateChannel(
              this.app.config.get<NotificationConfigInput>('notification'),
              'inbox',
              {
                label: text('channel', 'Task inbox'),
                typeLabel: notificationI18nText(
                  'templates.channelTypes.inApp',
                  'In-app message',
                ),
              },
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

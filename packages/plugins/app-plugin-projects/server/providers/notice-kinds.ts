import type {
  NotificationChannelPolicy,
  NotificationI18nText,
  NotificationTemplateRegistry,
} from '@nocobase/app-plugin-notification/server';

import type { ProjectNoticeType } from '../tokens.js';
import { NAMESPACE } from './authorization.js';

/** The notification kinds project notices are sent as, by what they ask of the reader. */
export const PROJECT_NOTICE_KINDS = {
  mentioned: 'projects.mentioned',
  assigned: 'projects.assigned',
  attention: 'projects.attention',
  commented: 'projects.commented',
  statusChanged: 'projects.status-changed',
  progress: 'projects.progress',
} as const;
type NoticeKindName = keyof typeof PROJECT_NOTICE_KINDS;

/** The kind a notice is sent as; another plugin's notice types are progress. */
export function noticeKindOf(type: ProjectNoticeType): string {
  switch (type) {
    case 'mentioned':
      return PROJECT_NOTICE_KINDS.mentioned;
    case 'owner_assigned':
    case 'executor_assigned':
      return PROJECT_NOTICE_KINDS.assigned;
    case 'owner_notified':
      return PROJECT_NOTICE_KINDS.attention;
    case 'commented':
      return PROJECT_NOTICE_KINDS.commented;
    case 'status_changed':
      return PROJECT_NOTICE_KINDS.statusChanged;
    default:
      return PROJECT_NOTICE_KINDS.progress;
  }
}

/** Administrator-facing text, translated in the browser from this plugin's client locales. */
function text(key: string, defaultValue: string): NotificationI18nText {
  return { ns: NAMESPACE, key: `noticeKinds.${key}`, defaultValue };
}

const DEFINITIONS: Readonly<
  Record<
    NoticeKindName,
    {
      readonly name: string;
      readonly trigger: string;
      readonly channels: Readonly<Record<string, NotificationChannelPolicy>>;
    }
  >
> = {
  mentioned: {
    name: 'Mentioned',
    trigger: 'Someone mentions you in an issue or a comment.',
    channels: { 'in-app': 'required', 'web-push': 'on', email: 'off' },
  },
  assigned: {
    name: 'Assigned to you',
    trigger: 'Someone makes you the owner or the executor of an issue.',
    channels: { 'in-app': 'required', 'web-push': 'on', email: 'off' },
  },
  attention: {
    name: 'Needs you',
    trigger:
      'Someone else moves an issue you own to a status that asks for you, such as Blocked or In review.',
    channels: { 'in-app': 'required', 'web-push': 'on', email: 'on' },
  },
  commented: {
    name: 'New comment',
    trigger: 'Someone comments on an issue you follow.',
    channels: { 'in-app': 'required', 'web-push': 'off', email: 'off' },
  },
  statusChanged: {
    name: 'Status changed',
    trigger: 'An issue you follow moves to another status.',
    channels: { 'in-app': 'required', 'web-push': 'off', email: 'off' },
  },
  progress: {
    name: 'Progress',
    trigger:
      'A dependency of your issue is finished, the sub-issues of an issue are finished, or another plugin reports on an issue.',
    channels: { 'in-app': 'required', 'web-push': 'off', email: 'off' },
  },
};

/** Registers the kinds; returns what removes them. */
export function registerNoticeKinds(
  registry: NotificationTemplateRegistry,
): () => void {
  const releases = Object.entries(DEFINITIONS).map(([key, definition]) =>
    registry.register({
      id: PROJECT_NOTICE_KINDS[key as NoticeKindName],
      contributor: NAMESPACE,
      contributorLabel: text('contributor', 'Projects'),
      category: text('category', 'Projects'),
      categoryKey: 'projects',
      name: text(`${key}.name`, definition.name),
      trigger: text(`${key}.trigger`, definition.trigger),
      recipients: text(
        'recipients',
        'The people the notice is about who may see the issue; never the person who acted.',
      ),
      businessRule: text(
        'businessRule',
        'Sent once per notice. Members choose push and email for each kind in their notification settings.',
      ),
      locales: ['en-US'],
      languagePolicy: text(
        'languagePolicy',
        "Worded once in the application's default language.",
      ),
      variables: [
        {
          name: 'title',
          description: text('variables.title', 'What happened'),
        },
        {
          name: 'body',
          description: text(
            'variables.body',
            'The issue title or the comment excerpt',
          ),
        },
      ],
      channels: definition.channels,
      // Project notices arrive already worded: the kind carries them as they are.
      content: ({ data }) => ({
        title: typeof data.title === 'string' ? data.title : '',
        body: typeof data.body === 'string' ? data.body : '',
      }),
      sample: {
        title: 'Alice mentioned you on PM-12',
        body: 'Can you check the release notes before Friday?',
      },
    }),
  );
  return () => {
    for (const release of releases) release();
  };
}

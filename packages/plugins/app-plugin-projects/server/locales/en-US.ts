import type { LocaleResource } from '@nocobase/i18n';

import accessEnUS from '../../shared/locales/access.en-US.js';

const own = {
  /** In-app notifications, written in the application's default language. */
  notifications: {
    batchDone: 'All sub-issues of {{identifier}} are finished',
    batchDoneStage:
      'Stage {{stage}} of the sub-issues of {{identifier}} is finished',
    commented: '{{actor}} commented on {{identifier}}',
    dependencyReleased:
      '{{releasedBy}} is finished, so {{identifier}} can start',
    executorAssigned: '{{actor}} assigned {{identifier}} to you',
    mentioned: {
      comment: '{{actor}} mentioned you on {{identifier}}',
      description: '{{actor}} mentioned you in {{identifier}}',
    },
    ownerAssigned: '{{actor}} made you the owner of {{identifier}}',
    someone: 'Someone',
    statusChanged: '{{identifier}} moved to {{status}}',
    ownerNotified: '{{identifier}} is now {{status}}',
  },
  status: {
    backlog: 'Backlog',
    blocked: 'Blocked',
    cancelled: 'Cancelled',
    done: 'Done',
    in_progress: 'In progress',
    in_review: 'In review',
  },
};

const enUS: typeof accessEnUS & typeof own = { ...accessEnUS, ...own };

export type ProjectsResource = LocaleResource<typeof enUS>;

export default enUS;

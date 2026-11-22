import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  nav: { automation: 'Automation' },
  authorization: { title: 'Schedules', read: 'Read', manage: 'Manage' },
};

export type SchedulerResource = LocaleResource<typeof enUS>;

export default enUS;

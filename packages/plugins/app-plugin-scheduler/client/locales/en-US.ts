import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  // Titles the server registers with the authorization catalog, which resolve in this plugin's namespace.
  authorization: { title: 'Schedules', read: 'Read' },
  nav: { automation: 'Automation' },
};

/** English is the source of truth for this plugin's locale shape. */
export type SchedulerResource = LocaleResource<typeof enUS>;

export default enUS;

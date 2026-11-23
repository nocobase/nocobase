/**
 * The Schedules page as a System settings page in the built-in automation category: `/settings/automation/schedules`.
 * It stands behind the `scheduler.schedules` settings item's `read`; pausing and resuming also need its `manage`,
 * which the page checks before it offers the switch and the API checks again. An application replaces the page with
 * `routeComponentOverrides` under the route id `@nocobase/app-plugin-scheduler:schedules`.
 */
import {
  defineSystemSettingsRoutes,
  SYSTEM_SETTINGS_CATEGORIES,
  type AppClientSystemSettingsRoutesContribution,
} from '@nocobase/app-client/plugins';
import { CalendarClock } from 'lucide-react';

export const SCHEDULER_SETTINGS = 'scheduler.schedules';

export const schedulerSettingsRoutes: AppClientSystemSettingsRoutesContribution =
  defineSystemSettingsRoutes([
    {
      name: 'schedules',
      path: '/automation/schedules',
      parent: SYSTEM_SETTINGS_CATEGORIES.automation,
      auth: 'required',
      authz: {
        resource: { type: 'settings', id: SCHEDULER_SETTINGS },
        action: 'read',
      },
      navigation: { title: 'nav.schedules', icon: CalendarClock },
      breadcrumb: { title: 'nav.schedules' },
      componentLoader: () => import('./pages/schedules/index.js'),
    },
  ]);

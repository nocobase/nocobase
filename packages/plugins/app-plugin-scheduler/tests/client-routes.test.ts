import { describe, expect, it } from 'vitest';

import plugin from '../client/index.js';
import { schedulerSettingsRoutes } from '../client/routes.js';

describe('client routes', () => {
  it('registers Schedules as a System settings page in the automation category behind the read permission', () => {
    expect(plugin()).toMatchObject({
      packageName: '@nocobase/app-plugin-scheduler',
      routes: [schedulerSettingsRoutes],
    });
    expect(JSON.parse(JSON.stringify(schedulerSettingsRoutes))).toMatchObject({
      parent: 'systemSettings',
      routes: [
        {
          name: 'schedules',
          path: '/automation/schedules',
          parent: 'automation',
          authz: {
            resource: { type: 'settings', id: 'scheduler.schedules' },
            action: 'read',
          },
        },
      ],
    });
  });
});

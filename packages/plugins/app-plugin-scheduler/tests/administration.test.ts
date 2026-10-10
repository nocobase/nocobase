import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { createAppAuthorization } from '@nocobase/app-plugin-authorization/server';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceContainer } from '@nocobase/service-provider';
import { expect, it } from 'vitest';
import { SchedulerAuthorizationProvider } from '../server/authorization.js';

it.each([false, true])(
  'extends the Automation subsection (workflow booted first: %s)',
  async (workflowFirst) => {
    const authz = createAppAuthorization({});
    const workflow = {
      name: 'automation',
      title: { key: 'nav.automation', ns: '@nocobase/app-plugin-workflow' },
      parent: 'administration',
    };
    if (workflowFirst) authz.ui.sections.add(workflow);
    const automation = workflowFirst
      ? workflow
      : {
          ...workflow,
          title: {
            key: 'nav.automation',
            ns: '@nocobase/app-plugin-scheduler',
          },
        };
    const container = new ServiceContainer();
    container.instance(authorizationToken, authz);
    await new SchedulerAuthorizationProvider({
      container,
    } as AppPluginApplication).boot();
    expect(authz.ui.sections.get('automation')).toEqual(automation);
    expect(
      authz.resourceTypes.get('settings').items?.get('scheduler.schedules'),
    ).toMatchObject({
      actions: [expect.objectContaining({ name: 'read' })],
    });
    expect(
      authz.ui.placementOf({ type: 'settings', id: 'scheduler.schedules' }),
    ).toEqual({ section: 'automation' });
    expect(authz.settings.grant('scheduler.schedules', ['read'])).toEqual({
      resource: { type: 'settings', id: 'scheduler.schedules' },
      actions: [{ action: 'read' }],
    });
    expect(() =>
      authz.settings.grant('scheduler.schedules', ['configure']),
    ).toThrow();
  },
);

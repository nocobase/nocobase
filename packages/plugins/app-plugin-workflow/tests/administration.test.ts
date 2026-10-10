import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { createAppAuthorization } from '@nocobase/app-plugin-authorization/server';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceContainer } from '@nocobase/service-provider';
import { expect, it } from 'vitest';
import { WorkflowAuthorizationProvider } from '../server/authorization.js';

it('owns the Automation subsection', async () => {
  const authz = createAppAuthorization({});
  const automation = {
    name: 'automation',
    title: { key: 'nav.automation', ns: '@nocobase/app-plugin-workflow' },
    parent: 'administration',
  };
  const container = new ServiceContainer();
  container.instance(authorizationToken, authz);
  await new WorkflowAuthorizationProvider({
    container,
  } as AppPluginApplication).boot();
  expect(authz.ui.sections.get('automation')).toEqual(automation);
  expect(
    authz.resourceTypes.get('settings').items?.get('workflow'),
  ).toMatchObject({
    actions: [expect.objectContaining({ name: 'manage' })],
  });
  expect(authz.ui.placementOf({ type: 'settings', id: 'workflow' })).toEqual({
    section: 'automation',
  });
  expect(authz.settings.grant('workflow', ['manage'])).toEqual({
    resource: { type: 'settings', id: 'workflow' },
    actions: [{ action: 'manage' }],
  });
  expect(() => authz.settings.grant('workflow', ['configure'])).toThrow();
});

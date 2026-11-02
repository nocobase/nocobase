import type { Application } from '@nocobase/app-server/application';
import { AUTHORIZATION_NAMESPACE } from '@nocobase/app-plugin-authorization/server';
import { expect, it, vi } from 'vitest';
import appPackage from '../../package.json' with { type: 'json' };
import WorkflowManagementProvider from '../../server/providers/workflow-management.js';

it('registers workflow permissions in the current application namespace with stable grant identifiers', async () => {
  const authz = {
    ui: { sections: { add: vi.fn() }, place: vi.fn() },
    settings: { add: vi.fn() },
  };
  const app = {
    container: { has: () => true, resolve: () => authz },
  } as unknown as Application;
  await new WorkflowManagementProvider(app).boot();
  const title = { key: 'workflows.title', ns: appPackage.name };
  expect(authz.ui.sections.add).toHaveBeenCalledExactlyOnceWith({
    name: 'workflow-management',
    title,
    parent: 'administration',
  });
  expect(authz.settings.add).toHaveBeenCalledExactlyOnceWith({
    id: 'workflow-management',
    title,
    actions: ['read', 'update'].map((name) => ({
      name,
      title: { key: `options.actions.${name}`, ns: AUTHORIZATION_NAMESPACE },
    })),
  });
  expect(authz.ui.place).toHaveBeenCalledExactlyOnceWith(
    { type: 'settings', id: 'workflow-management' },
    { section: 'workflow-management' },
  );
});

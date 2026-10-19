import type { Application } from '@nocobase/app-server/application';
import { ServiceProvider } from '@nocobase/service-provider';
import {
  authorizationToken,
  AUTHORIZATION_NAMESPACE,
} from '@nocobase/app-plugin-authorization/server';

export default class WorkflowManagementProvider extends ServiceProvider<Application> {
  public readonly name = 'examples/workflow-management';
  public override async boot(): Promise<void> {
    if (!this.app.container.has(authorizationToken)) return;
    const authz = this.app.container.resolve(authorizationToken);
    authz.ui.sections.add({
      name: 'workflow-management',
      title: { key: 'workflows.title', ns: '@nocobase/app-template-examples' },
      parent: 'administration',
    });
    authz.settings.add({
      id: 'workflow-management',
      title: { key: 'workflows.title', ns: '@nocobase/app-template-examples' },
      actions: ['read', 'update'].map((name) => ({
        name,
        title: { key: `options.actions.${name}`, ns: AUTHORIZATION_NAMESPACE },
      })),
    });
    authz.ui.place(
      { type: 'settings', id: 'workflow-management' },
      { section: 'workflow-management' },
    );
  }
}

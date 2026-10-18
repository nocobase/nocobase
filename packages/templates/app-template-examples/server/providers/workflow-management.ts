import type { Application } from '@nocobase/app-server/application';
import { ServiceProvider } from '@nocobase/service-provider';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';

export default class WorkflowManagementProvider extends ServiceProvider<Application> {
  public readonly name = 'examples/workflow-management';
  public override async boot(): Promise<void> {
    if (!this.app.container.has(authorizationToken)) return;
    const authz = this.app.container.resolve(authorizationToken);
    authz.ui.sections.add({
      name: 'workflow-management',
      title: 'Workflow management',
      parent: 'administration',
    });
    authz.settings.add({
      id: 'workflow-management',
      title: 'Workflow management',
      actions: [{ name: 'read' }, { name: 'update' }],
    });
    authz.ui.place(
      { type: 'settings', id: 'workflow-management' },
      { section: 'workflow-management' },
    );
  }
}

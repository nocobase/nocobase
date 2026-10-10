import { authorizationToken } from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceProvider } from '@nocobase/service-provider';

export class WorkflowAuthorizationProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-dag-flow/authorization';

  public override async boot(): Promise<void> {
    const authz = this.app.container.resolve(authorizationToken);
    // Workflow owns the Automation subsection, as it owns the settings group.
    authz.ui.sections.add({
      name: 'automation',
      title: { key: 'nav.automation', ns: '@nocobase/app-plugin-dag-flow' },
      parent: 'administration',
    });
    authz.settings.add({
      id: 'workflow',
      title: {
        key: 'authorization.title',
        ns: '@nocobase/app-plugin-dag-flow',
      },
      actions: [
        {
          name: 'manage',
          title: {
            key: 'authorization.manage',
            ns: '@nocobase/app-plugin-dag-flow',
          },
        },
      ],
    });
    authz.ui.place(
      { type: 'settings', id: 'workflow' },
      { section: 'automation' },
    );
  }
}

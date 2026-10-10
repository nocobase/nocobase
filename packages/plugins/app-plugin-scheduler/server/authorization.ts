import { authorizationToken } from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceProvider } from '@nocobase/service-provider';

export class SchedulerAuthorizationProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-scheduler/authorization';

  public override async boot(): Promise<void> {
    const authz = this.app.container.resolve(authorizationToken);
    // Extends the Automation subsection, which another plugin may own, as its settings route extends the group.
    authz.ui.sections.add({
      name: 'automation',
      title: { key: 'nav.automation', ns: '@nocobase/app-plugin-scheduler' },
      parent: 'administration',
      extend: true,
    });
    authz.settings.add({
      id: 'scheduler.schedules',
      title: {
        key: 'authorization.title',
        ns: '@nocobase/app-plugin-scheduler',
      },
      actions: [
        {
          name: 'read',
          title: {
            key: 'authorization.read',
            ns: '@nocobase/app-plugin-scheduler',
          },
        },
      ],
    });
    authz.ui.place(
      { type: 'settings', id: 'scheduler.schedules' },
      { section: 'automation' },
    );
  }
}

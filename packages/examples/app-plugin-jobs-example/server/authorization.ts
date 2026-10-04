import { authorizationToken } from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceProvider } from '@nocobase/service-provider';

import { JOBS_EXAMPLE_SCOPE } from './scope.js';

/**
 * The settings item that gates switching the recurring rules. The rules are shared by the whole application, so
 * starting or stopping one is an administrative change rather than something every signed-in user may do.
 */
export const JOBS_EXAMPLE_SETTINGS = 'jobsExample.schedules';

/** Registers `settings:jobsExample.schedules`, with its one action `update`, in a subsection of Administration. */
export class JobsExampleAuthorizationProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = `${JOBS_EXAMPLE_SCOPE}/authorization`;

  public override async boot(): Promise<void> {
    const authz = this.app.container.resolve(authorizationToken);
    authz.ui.sections.add({
      name: 'jobsExample',
      title: { key: 'authorization.title', ns: JOBS_EXAMPLE_SCOPE },
      parent: 'administration',
    });
    authz.settings.add({
      id: JOBS_EXAMPLE_SETTINGS,
      title: { key: 'authorization.title', ns: JOBS_EXAMPLE_SCOPE },
      actions: [
        {
          name: 'update',
          title: { key: 'authorization.update', ns: JOBS_EXAMPLE_SCOPE },
        },
      ],
    });
    authz.ui.place(
      { type: 'settings', id: JOBS_EXAMPLE_SETTINGS },
      { section: 'jobsExample' },
    );
  }
}

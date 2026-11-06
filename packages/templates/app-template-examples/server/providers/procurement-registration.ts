import type { Application } from '@nocobase/app-server/application';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { lifecycleExampleServiceToken } from '@nocobase/app-plugin-lifecycle-example/server';
import { ServiceProvider } from '@nocobase/service-provider';
import { procurementLifecycle } from '../lifecycles/procurement.js';
import { PROCUREMENT_ACCESS } from '../../shared/procurement.js';
import metadata from '../../package.json' with { type: 'json' };

export default class ProcurementRegistration extends ServiceProvider<Application> {
  readonly name = 'examples/procurement';
  override async boot(): Promise<void> {
    this.app.container
      .resolve(lifecycleExampleServiceToken)
      .runtime.register(procurementLifecycle);
    const authz = this.app.container.resolve(authorizationToken);
    authz.settings.add({
      id: PROCUREMENT_ACCESS.id,
      title: { key: 'procurement.title', ns: metadata.name },
      actions: ['request', 'review'].map((name) => ({
        name,
        title: { key: `procurement.${name}`, ns: metadata.name },
      })),
    });
    authz.ui.place(PROCUREMENT_ACCESS, { section: 'workflow-management' });
    // The existing page permission registry contributes access; no wildcard role assignment.
  }
}

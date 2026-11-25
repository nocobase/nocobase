import { auditServiceToken } from '@nocobase/app-server/audit';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceProvider } from '@nocobase/service-provider';

import { fileAuditDriver } from '../file-transport.js';

export class AuditFileProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-audit';

  public override register(): void {
    this.app.container
      .resolve(auditServiceToken)
      .registerDriver(fileAuditDriver);
  }
}

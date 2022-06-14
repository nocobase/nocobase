import { InstallOptions, Plugin } from '@nocobase/server';
import { exportXlsx } from './actions';

export class ExportPlugin extends Plugin {
  getName(): string {
    return this.getPackageName(__dirname);
  }

  beforeLoad() {}

  async load() {
    this.app.resourcer.registerActionHandler('exportXlsx', exportXlsx);
    this.app.acl.setAvailableAction('exportXlsx', {
      displayName: '{{t("Export")}}',
      allowConfigureFields: true,
    });
  }

  async install(options: InstallOptions) {}
}

export default ExportPlugin;

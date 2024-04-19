import { InstallOptions, Plugin } from '@nocobase/server';
import { exportXlsx } from './actions';

export class PluginExportServer extends Plugin {
  beforeLoad() {}

  async load() {
    this.app.dataSourceManager.afterAddDataSource((dataSource) => {
      // @ts-ignore
      if (!dataSource.collectionManager?.db) {
        return;
      }

      dataSource.resourceManager.registerActionHandler('export', exportXlsx);
      dataSource.acl.setAvailableAction('export', {
        displayName: '{{t("Export")}}',
        allowConfigureFields: true,
      });
    });
  }

  async install(options: InstallOptions) {}
}

export default PluginExportServer;

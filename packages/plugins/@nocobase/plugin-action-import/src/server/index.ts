import { InstallOptions, Plugin } from '@nocobase/server';
import { namespace } from '..';
import { downloadXlsxTemplate, importXlsx } from './actions';
import { enUS, zhCN } from './locale';
import { importMiddleware } from './middleware';

export class PluginActionImportServer extends Plugin {
  beforeLoad() {
    this.app.i18n.addResources('zh-CN', namespace, zhCN);
    this.app.i18n.addResources('en-US', namespace, enUS);
  }

  async load() {
    this.app.dataSourceManager.afterAddDataSource((dataSource) => {
      // @ts-ignore
      if (!dataSource.collectionManager?.db) {
        return;
      }

      dataSource.resourceManager.use(importMiddleware);
      dataSource.resourceManager.registerActionHandler('downloadXlsxTemplate', downloadXlsxTemplate);
      dataSource.resourceManager.registerActionHandler('importXlsx', importXlsx);

      dataSource.acl.setAvailableAction('importXlsx', {
        displayName: '{{t("Import")}}',
        allowConfigureFields: true,
        type: 'new-data',
        onNewRecord: true,
      });

      dataSource.acl.allow('*', 'downloadXlsxTemplate', 'loggedIn');
    });
  }

  async install(options: InstallOptions) {
    // TODO
  }
}

export default PluginActionImportServer;

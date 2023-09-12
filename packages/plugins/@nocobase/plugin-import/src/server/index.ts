import { InstallOptions, Plugin } from '@nocobase/server';
import { namespace } from '..';
import { downloadXlsxTemplate, importXlsx } from './actions';
import { enUS, zhCN } from './locale';
import { importMiddleware } from './middleware';

export class ImportPlugin extends Plugin {
  beforeLoad() {
    this.app.i18n.addResources('zh-CN', namespace, zhCN);
    this.app.i18n.addResources('en-US', namespace, enUS);
  }

  async load() {
    this.app.resourcer.use(importMiddleware);
    this.app.resourcer.registerActionHandler('downloadXlsxTemplate', downloadXlsxTemplate);
    this.app.resourcer.registerActionHandler('importXlsx', importXlsx);

    this.app.acl.setAvailableAction('importXlsx', {
      displayName: '{{t("Import")}}',
      allowConfigureFields: true,
      type: 'new-data',
      onNewRecord: true,
    });

    this.app.acl.allow('*', 'downloadXlsxTemplate', 'loggedIn');
  }

  async install(options: InstallOptions) {
    // TODO
  }
}

export default ImportPlugin;

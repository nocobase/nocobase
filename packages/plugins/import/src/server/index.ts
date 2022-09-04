import { InstallOptions, Plugin } from '@nocobase/server';
import { downloadXlsxTemplate, importXlsx } from './actions';
import { importMiddleware } from './middleware';
export class ImportPlugin extends Plugin {
  getName(): string {
    return this.getPackageName(__dirname);
  }

  beforeLoad() {
    // TODO
  }

  async load() {
    // Visit: http://localhost:13000/api/import:importXlsx
    this.app.resourcer.use(importMiddleware);
    this.app.resourcer.registerActionHandler('downloadXlsxTemplate', downloadXlsxTemplate);
    this.app.resourcer.registerActionHandler('importXlsx', importXlsx);
    // this.app.resource({
    //   name: 'import',
    //   actions: {
    //     importXlsx,
    //   },
    // });
    this.app.acl.setAvailableAction('import', {
      displayName: '{{t("Import")}}',
      allowConfigureFields: true,
    });
    this.app.acl.allow('*', 'downloadXlsxTemplate');
    this.app.acl.allow('*', 'importXlsx');
  }

  async install(options: InstallOptions) {
    // TODO
  }
}

export default ImportPlugin;

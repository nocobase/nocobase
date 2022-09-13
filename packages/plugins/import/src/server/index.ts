import { InstallOptions, Plugin } from '@nocobase/server';
import { namespace } from '..';
import { enUS, zhCN } from '../locale';
import { downloadXlsxTemplate, importXlsx } from './actions';
import { importMiddleware } from './middleware';
export class ImportPlugin extends Plugin {
  getName(): string {
    return this.getPackageName(__dirname);
  }

  beforeLoad() {
    this.app.i18n.addResources('zh-CN', namespace, zhCN);
    this.app.i18n.addResources('en-US', namespace, enUS);
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
    this.app.acl.setAvailableAction('importXlsx', {
      displayName: '{{t("Import")}}',
      allowConfigureFields: true,
    });
    this.app.acl.use(async (ctx, next) => {
      const { actionName } = ctx.action;
      if (['downloadXlsxTemplate', 'importXlsx'].includes(actionName)) {
        ctx.permission = {
          skip: true,
        };
      }
      await next();
    });
  }

  async install(options: InstallOptions) {
    // TODO
  }
}

export default ImportPlugin;

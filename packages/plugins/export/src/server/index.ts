import { InstallOptions, Plugin } from '@nocobase/server';
import { exportXlsx } from './actions';

export class ExportPlugin extends Plugin {
  getName(): string {
    return this.getPackageName(__dirname);
  }

  beforeLoad() {}

  async load() {
    // Visit: http://localhost:13000/api/xxx:exportXlsx
    this.app.resourcer.registerActionHandler('exportXlsx', exportXlsx);
    // this.app.resource({
    //   name: 'export',
    //   actions: {
    //     xlsx: exportXlsx,
    //   },
    // });
    this.app.acl.allow('*', 'exportXlsx');
  }

  async install(options: InstallOptions) {}
}

export default ExportPlugin;

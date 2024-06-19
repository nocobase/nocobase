import { Plugin } from '@nocobase/client';
import { RecordSetFieldInterface } from './interface';

export class PluginFieldRecordSetClient extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() { }

  // You can get and modify the app instance here
  async load() {
    this.app.dataSourceManager.addFieldInterfaces([RecordSetFieldInterface]);
  }
}

export default PluginFieldRecordSetClient;

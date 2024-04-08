import { Plugin } from '@nocobase/client';
import { useChinaRegionDataSource, useChinaRegionLoadData } from './ChinaRegionProvider';

export class PluginChinaRegionClient extends Plugin {
  async load() {
    this.app.addScopes({
      useChinaRegionDataSource,
      useChinaRegionLoadData,
    });
  }
}

export default PluginChinaRegionClient;

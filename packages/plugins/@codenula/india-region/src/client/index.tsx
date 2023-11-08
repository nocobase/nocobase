import { Plugin } from '@nocobase/client';
import { useRegionDataSource, useRegionLoadData } from './RegionProvider';


export class IndiaRegionClient extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    this.app.addScopes({
      useRegionDataSource,
      useRegionLoadData,
    });
    // this.app.addComponents({})
    // this.app.addScopes({})
    // this.app.addProvider()
    // this.app.addProviders()
    // this.app.router.add()
  }
}

export default IndiaRegionClient;

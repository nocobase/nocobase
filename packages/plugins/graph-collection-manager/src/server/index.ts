import { InstallOptions, Plugin } from '@nocobase/server';
import path from 'path';
export class GraphCollectionManagerPlugin extends Plugin {
  getName(): string {
    return this.getPackageName(__dirname);
  }

  beforeLoad() {
  
  }

  async load() {
   await this.db.import({
    directory: path.resolve(__dirname,'collections')
   });  
   this.app.acl.allow('graphPositions', '*');
  }

  async install(options: InstallOptions) {
  }
}

export default GraphCollectionManagerPlugin;

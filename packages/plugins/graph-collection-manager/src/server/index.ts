import { InstallOptions, Plugin } from '@nocobase/server';
import path from 'path'
export class GraphCollectionManagerPlugin extends Plugin {
  getName(): string {
    return this.getPackageName(__dirname);
  }

  beforeLoad() {
    // TODO
  }

  async load() {
   await this.db.import({
    directory: path.resolve(__dirname,'collections')
   })  
  }

  async install(options: InstallOptions) {
    // TODO
  }
}

export default GraphCollectionManagerPlugin;

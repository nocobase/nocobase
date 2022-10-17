import { InstallOptions, Plugin } from '@nocobase/server';
import {zhCN,enUS,jaJP} from './locale'
import path from 'path'
export class GraphCollectionManagerPlugin extends Plugin {
  getName(): string {
    return this.getPackageName(__dirname);
  }

  beforeLoad() {
    console.log(zhCN)
    this.app.i18n.addResources('zh-CN', 'graphPositions', zhCN);
   this.app.i18n.addResources('en-US', 'graphPositions', enUS);
   this.app.i18n.addResources('ja-JP', 'graphPositions', jaJP);
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

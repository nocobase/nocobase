import { InstallOptions, Plugin } from '@nocobase/server';
import {resolve} from 'path';


export class PluginHelloServer extends Plugin {
  afterAdd() { }

  beforeLoad() { }

  async load() {
    
    this.db.collection({
      name: "hello",
      fields: [{ type: "string", name: "email" },{type:"password",name:"pasword"}]
    });
    this.app.db.import({directory:resolve(__dirname, "collections")})
    this.app.acl.allow('hello', '*');
  }

  async install(options?: InstallOptions) { }

  async afterEnable() { }

  async afterDisable() { }

  async remove() { }
}

export default PluginHelloServer;

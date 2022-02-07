import { Plugin } from '@nocobase/server';

export default class PluginClient extends Plugin {
  async beforeLoad() {
    const cmd = this.app.findCommand('install');
    if (cmd) {
      cmd.option('--import-demo');
      cmd.option('--lang [lang]');
    }

    this.app.on('afterInstall', async (app, options) => {
      const [opts] = options?.cliArgs || [{}];
      if (opts?.importDemo) {

      }
      if (opts?.lang) {
        
      }
    });
  }

  async load() {
    
  }
}

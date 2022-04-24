import { skip } from '@nocobase/acl';
import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';

export class SystemSettingsPlugin extends Plugin {
  async install(options: InstallOptions) {
    const [opts] = options.cliArgs;
    await this.db.getRepository('systemSettings').create({
      values: {
        title: 'NocoBase',
        appLang: opts?.lang || 'en-US',
        logo: {
          title: 'nocobase-logo',
          filename: '682e5ad037dd02a0fe4800a3e91c283b.png',
          extname: '.png',
          mimetype: 'image/png',
          url: 'https://nocobase.oss-cn-beijing.aliyuncs.com/682e5ad037dd02a0fe4800a3e91c283b.png',
        },
      },
    });
  }

  beforeLoad() {
    const cmd = this.app.findCommand('install');
    if (cmd) {
      cmd.option('--lang [lang]');
    }
  }

  async load() {
    await this.app.db.import({
      directory: resolve(__dirname, 'collections'),
    });
    this.app.acl.use(
      skip({
        resourceName: 'systemSettings',
        actionName: 'get',
      }),
    );
  }

  getName(): string {
    return this.getPackageName(__dirname);
  }
}

export default SystemSettingsPlugin;

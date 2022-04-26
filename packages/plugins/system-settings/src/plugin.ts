import { skip } from '@nocobase/acl';
import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';

export class SystemSettingsPlugin extends Plugin {
  async install(options?: InstallOptions) {
    await this.db.getRepository('systemSettings').create({
      values: {
        title: 'NocoBase',
        appLang: options?.cliArgs?.[0]?.opts?.lang || process.env.APP_LANG || 'en-US',
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

    this.app.resourcer.addParamsMerger('systemSettings:destroy', () => {
      return {
        filter: {
          $and: [{ 'title.$ne': 'Nocobase' }],
        },
      };
    });

    this.app.acl.allow('systemSettings', 'get');
    this.app.acl.allow('systemSettings', 'update', 'allowConfigure');
  }

  getName(): string {
    return this.getPackageName(__dirname);
  }
}

export default SystemSettingsPlugin;

import { skip } from '@nocobase/acl';
import { Plugin } from '@nocobase/server';
import { resolve } from 'path';

export class SystemSettingsPlugin extends Plugin {
  async install() {
    await this.db.getRepository('systemSettings').create({
      values: {
        title: 'NocoBase',
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
}

export default SystemSettingsPlugin;

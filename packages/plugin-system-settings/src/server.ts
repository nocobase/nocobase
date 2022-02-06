import path from 'path';
import { Plugin, PluginOptions } from '@nocobase/server';

export default class PluginSystemSettings extends Plugin {
  async beforeLoad() {
    this.app.on('installing', async () => {
      await this.db.getRepository('system_settings').create({
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
    });
  }

  async load() {
    await this.app.db.import({
      directory: path.resolve(__dirname, 'collections'),
    });
  }
}

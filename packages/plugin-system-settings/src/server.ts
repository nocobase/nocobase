import path from 'path';
import { PluginOptions } from '@nocobase/server';

export default {
  name: 'system-settings',
  async load() {
    const database = this.app.db;

    database.import({
      directory: path.resolve(__dirname, 'collections'),
    });

    const SystemSetting = database.getCollection('system_settings');

    this.app.on('db.init', async () => {
      await SystemSetting.repository.create({
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
  },
} as PluginOptions;

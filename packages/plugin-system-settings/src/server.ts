import path from 'path';
import { PluginOptions } from '@nocobase/server';

export default {
  name: 'system-settings',
  async load() {
    const database = this.app.db;
    const resourcer = this.app.resourcer;

    database.import({
      directory: path.resolve(__dirname, 'collections'),
    });

    const SystemSetting = database.getModel('system_settings');
  
    resourcer.use(async (ctx, next) => {
      const { actionName, resourceName, resourceKey } = ctx.action.params;
      if (resourceName === 'system_settings' && actionName === 'get') {
        let model = await SystemSetting.findOne();
        if (!model) {
          model = await SystemSetting.create();
        }
        ctx.action.mergeParams({
          resourceKey: model.id,
        });
      }
      await next();
    });
  
    this.app.on('db.init', async () => {
      const setting = await SystemSetting.create({
        title: 'NocoBase',
      });
      await setting.updateAssociations({
        logo: {
          title: 'nocobase-logo',
          filename: '682e5ad037dd02a0fe4800a3e91c283b.png',
          extname: '.png',
          mimetype: 'image/png',
          url: 'https://nocobase.oss-cn-beijing.aliyuncs.com/682e5ad037dd02a0fe4800a3e91c283b.png',
        },
      });
    });
  }
} as PluginOptions;

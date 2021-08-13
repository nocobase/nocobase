import path from 'path';
import { Application } from '@nocobase/server';

export default async function (this: Application, options = {}) {
  const database = this.database;
  const resourcer = this.resourcer;

  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });

  resourcer.use(async (ctx, next) => {
    const { actionName, resourceName, resourceKey } = ctx.action.params;
    if (resourceName === 'system_settings' && actionName === 'get') {
      const SystemSetting = database.getModel('system_settings');
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
}

import { Model } from '@nocobase/database';
import { Migration } from '@nocobase/server';

export default class extends Migration {
  async up() {
    await this.db.getCollection('systemSettings').sync({
      force: false,
      alter: {
        drop: false,
      },
    });
    const systemSettings = this.db.getRepository('systemSettings');
    let instance: Model = await systemSettings.findOne();
    if (instance?.options?.adminSchemaUid) {
      return;
    }
    const uiRoutes = this.db.getRepository('uiRoutes');
    const routes = await uiRoutes.find();
    if (!uiRoutes) {
      return;
    }
    for (const route of routes) {
      if (route.uiSchemaUid && route?.options?.component === 'AdminLayout') {
        const options = instance.options || {};
        options['adminSchemaUid'] = route.uiSchemaUid;
        instance.set('options', options);
        instance.changed('options', true);
        await instance.save();
        return;
      }
    }
    instance = await systemSettings.findOne();
    if (!instance?.options?.adminSchemaUid) {
      throw new Error('adminSchemaUid invalid');
    }
    this.app.log.info('systemSettings.options', instance.toJSON());
  }
}

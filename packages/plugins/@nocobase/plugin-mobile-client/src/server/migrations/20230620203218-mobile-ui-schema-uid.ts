import { Model } from '@nocobase/database';
import { Migration } from '@nocobase/server';

export default class extends Migration {
  appVersion = '<0.14.0-alpha.1';
  async up() {
    const result = await this.app.version.satisfies('<0.14.0-alpha.1');
    if (!result) {
      return;
    }
    const systemSettings = this.db.getRepository('systemSettings');
    let instance: Model = await systemSettings.findOne();
    if (instance?.options?.mobileSchemaUid) {
      return;
    }
    const uiRoutes = this.db.getRepository('uiRoutes');
    if (!uiRoutes) {
      return;
    }
    await this.db.getCollection('systemSettings').sync();
    const routes = await uiRoutes.find();
    for (const route of routes) {
      if (route.uiSchemaUid && route?.options?.component === 'MApplication') {
        const options = instance.options || {};
        options['mobileSchemaUid'] = route.uiSchemaUid;
        instance.set('options', options);
        instance.changed('options', true);
        await instance.save();
        return;
      }
    }
    instance = await systemSettings.findOne();
    if (!instance?.options?.mobileSchemaUid) {
      throw new Error('mobileSchemaUid invalid');
    }
    this.app.log.info('systemSettings.options', instance.toJSON());
  }
}

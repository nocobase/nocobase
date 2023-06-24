import { Migration } from '@nocobase/server';

export default class extends Migration {
  async up() {
    const systemSettings = this.db.getRepository('systemSettings');
    const instance = await systemSettings.findOne();
    const uiRoutes = this.db.getRepository('uiRoutes');
    const routes = await uiRoutes.find();
    for (const route of routes) {
      if (route.uiSchemaUid && route?.options?.component === 'AdminLayout') {
        const options = instance.options || {};
        options['adminSchemaUid'] = route.uiSchemaUid;
        instance.set('options', options);
        console.log('options.adminSchemaUid', route.uiSchemaUid);
        await instance.save();
        return;
      }
    }
  }
}

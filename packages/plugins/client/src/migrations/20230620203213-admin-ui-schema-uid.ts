import { Migration } from '@nocobase/server';

export default class extends Migration {
  async up() {
    const systemSettings = this.db.getRepository('systemSettings');
    const instance = await systemSettings.findOne();
    const uiRoutes = this.db.getRepository('uiRoutes');
    const routes = await uiRoutes.find();
    for (const route of routes) {
      if (route.uiSchemaUid && route?.options?.component === 'AdminLayout') {
        instance.set('options.adminSchemaUid', route.uiSchemaUid);
        console.log('options.adminSchemaUid', route.uiSchemaUid);
        await instance.save();
        return;
      }
    }
  }
}

import { Model } from '@nocobase/database';
import { Migration } from '@nocobase/server';

export default class extends Migration {
  async up() {
    const result = await this.app.version.satisfies('<0.17.0-alpha.8');
    if (!result) {
      return;
    }
    const systemSettings = this.db.getRepository('systemSettings');
    const instance: Model = await systemSettings.findOne();
    if (!instance?.options?.adminSchemaUid) {
      return;
    }
    const UiSchemas = this.db.getModel('uiSchemas');
    await UiSchemas.update(
      {
        'x-uid': 'nocobase-admin-menu',
      },
      {
        where: {
          'x-uid': instance?.options?.adminSchemaUid,
        },
      },
    );
  }
}

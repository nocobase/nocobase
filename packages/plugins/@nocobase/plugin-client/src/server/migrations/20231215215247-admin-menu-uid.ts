import { Model } from '@nocobase/database';
import { Migration } from '@nocobase/server';

export default class extends Migration {
  appVersion = '<0.17.0-alpha.8';
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
    await this.db.sequelize.transaction(async (transaction) => {
      await UiSchemas.update(
        {
          'x-uid': 'nocobase-admin-menu',
        },
        {
          transaction,
          where: {
            'x-uid': instance?.options?.adminSchemaUid,
          },
        },
      );
      await this.db.getModel('uiSchemaTreePath').update(
        {
          descendant: 'nocobase-admin-menu',
        },
        {
          transaction,
          where: {
            descendant: instance?.options?.adminSchemaUid,
          },
        },
      );
      await this.db.getModel('uiSchemaTreePath').update(
        {
          ancestor: 'nocobase-admin-menu',
        },
        {
          transaction,
          where: {
            ancestor: instance?.options?.adminSchemaUid,
          },
        },
      );
    });
    console.log(instance?.options?.adminSchemaUid);
  }
}

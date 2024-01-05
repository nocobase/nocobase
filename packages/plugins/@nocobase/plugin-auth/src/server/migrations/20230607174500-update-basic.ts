import { Migration } from '@nocobase/server';
import { presetAuthenticator } from '../../preset';

export default class UpdateBasicAuthMigration extends Migration {
  appVersion = '<0.14.0-alpha.1';
  async up() {
    const SystemSetting = this.context.db.getRepository('systemSettings');
    const setting = await SystemSetting.findOne();
    const allowSignUp = setting.get('allowSignUp') ? true : false;
    const repo = this.context.db.getRepository('authenticators');
    await repo.update({
      values: {
        options: {
          public: {
            allowSignUp,
          },
        },
      },
      filter: {
        name: presetAuthenticator,
      },
    });
  }

  async down() {}
}

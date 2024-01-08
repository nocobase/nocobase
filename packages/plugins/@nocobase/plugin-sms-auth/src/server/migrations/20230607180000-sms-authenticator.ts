import { Migration } from '@nocobase/server';
import { authType } from '../../constants';

export default class AddBasicAuthMigration extends Migration {
  appVersion = '<0.10.0-alpha.2';
  async up() {
    const SystemSetting = this.context.db.getRepository('systemSettings');
    const setting = await SystemSetting.findOne();
    const smsAuthEnabled = setting.get('smsAuthEnabled');
    if (!smsAuthEnabled) {
      return;
    }
    const repo = this.context.db.getRepository('authenticators');
    const existed = await repo.count({
      filter: {
        authType,
      },
    });
    if (existed) {
      return;
    }
    await repo.create({
      values: {
        name: 'sms',
        authType,
        description: 'Sign in with SMS.',
        enabled: true,
      },
    });
  }

  async down() {}
}

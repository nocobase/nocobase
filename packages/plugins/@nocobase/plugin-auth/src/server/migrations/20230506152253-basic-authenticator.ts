import { Migration } from '@nocobase/server';
import { presetAuthType, presetAuthenticator } from '../../preset';

export default class AddBasicAuthMigration extends Migration {
  async up() {
    await this.db.getCollection('authenticators').sync({
      force: false,
      alter: {
        drop: false,
      },
    });
    const repo = this.context.db.getRepository('authenticators');
    const existed = await repo.count();
    if (existed) {
      return;
    }
    await repo.create({
      values: {
        name: presetAuthenticator,
        authType: presetAuthType,
        description: 'Sign in with username/email.',
        enabled: true,
      },
    });
  }

  async down() {}
}

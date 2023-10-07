import { Migration } from '@nocobase/server';
import { authType } from '../../constants';

export default class UpdateBasicAuthMigration extends Migration {
  async up() {
    const result = await this.app.version.satisfies('<=0.14.0-alpha.7');

    if (!result) {
      return;
    }

    const r = this.db.getRepository('authenticators');
    const items = await r.find({
      filter: {
        authType,
      },
    });
    console.log(items.length);
    await this.db.sequelize.transaction(async (transaction) => {
      for (const item of items) {
        let options = item.options;
        options = {
          public: { autoSignup: true },
          oidc: { userBindField: 'email', ...options.oidc },
        };
        item.set('options', options);
        await item.save({ transaction });
      }
    });
  }

  async down() {}
}

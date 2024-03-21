import { Migration } from '@nocobase/server';
import { presetAuthType } from '../../preset';

export default class FixAllowSignUpMigration extends Migration {
  appVersion = '<0.18.0-alpha.1';
  async up() {
    const repo = this.context.db.getRepository('authenticators');
    const authenticators = await repo.find({
      filter: {
        authType: presetAuthType,
      },
    });
    for (const authenticator of authenticators) {
      const options = authenticator.get('options');
      const oldAllowSignUp = options?.public?.allowSignup;
      if (oldAllowSignUp === undefined || oldAllowSignUp === null) {
        continue;
      }
      options.public.allowSignUp = oldAllowSignUp;
      delete options.public.allowSignup;
      await repo.update({
        values: {
          options,
        },
        filter: {
          name: authenticator.name,
        },
      });
    }
  }

  async down() {}
}

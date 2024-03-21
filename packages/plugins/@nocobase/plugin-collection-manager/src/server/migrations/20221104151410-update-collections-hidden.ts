import { Migration } from '@nocobase/server';

export default class UpdateCollectionsHiddenMigration extends Migration {
  appVersion = '<0.8.0-alpha.11';
  async up() {
    const result = await this.app.version.satisfies('<=0.8.0-alpha.9');
    if (!result) {
      return;
    }
    try {
      await this.app.db.getRepository('collections').update({
        filter: {
          options: {
            autoCreate: true,
            isThrough: true,
          },
        },
        values: {
          hidden: true,
        },
      });
    } catch (error) {
      console.error(error);
    }
  }
}

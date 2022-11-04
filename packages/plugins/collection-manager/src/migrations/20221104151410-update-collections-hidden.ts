import { Migration } from '@nocobase/server';

export default class UpdateCollectionsHiddenMigration extends Migration {
  async up() {
    const result = await this.app.version.satisfies('<=0.8.0-alpha.9');
    if (!result) {
      return;
    }
    const db = this.app.db;
    const transaction = await db.sequelize.transaction();
    try {
      await db.getRepository('collections').update({
        filter: {
          options: {
            autoCreate: true,
            isThrough: true,
          },
        },
        values: {
          hidden: true,
        },
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      console.log(error);
      await transaction.rollback();
    }
  }
}

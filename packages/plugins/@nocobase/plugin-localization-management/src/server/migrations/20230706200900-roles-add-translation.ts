import { Migration } from '@nocobase/server';

export default class AddTranslationToRoleTitleMigration extends Migration {
  async up() {
    const repo = this.context.db.getRepository('fields');
    const field = await repo.findOne({
      where: {
        collectionName: 'roles',
        name: 'title',
      },
    });
    if (field) {
      await repo.update({
        filter: {
          key: field.key,
        },
        values: {
          options: {
            ...field.options,
            translation: true,
          },
        },
      });
    }
  }

  async down() {}
}

import { Migration } from '@nocobase/server';

export default class extends Migration {
  appVersion = '<0.8.1-alpha.2';
  async up() {
    const match = await this.app.version.satisfies('<=0.8.0-alpha.13');
    if (!match) {
      return;
    }

    const { db } = this.context;

    const fieldRepo = db.getRepository('fields');
    if (!fieldRepo) {
      return;
    }
    const pluginRepo = db.getRepository('applicationPlugins');
    await db.sequelize.transaction(async (transaction) => {
      const seqPlugin = await pluginRepo.findOne({
        filter: {
          name: 'sequence-field',
        },
        transaction,
      });
      if (!seqPlugin) {
        await pluginRepo.create({
          values: {
            name: 'sequence-field',
            version: '0.8.0-alpha.13',
            enabled: true,
            installed: true,
            builtIn: true,
          },
        });
      }

      const fields = await fieldRepo.find({
        filter: {
          type: 'sequence',
        },
      });
      await fields.reduce(
        (promise, field) =>
          promise.then(async () => {
            const options = field.get('options');
            const fieldName = field.get('name');
            const collectionName = field.get('collectionName');
            // NOTE: cannot use .update because no changes are made, only for forcing to trigger beforeSave hook.
            field.set('patterns', options.patterns);
            await field.save({ transaction });

            const repo = db.getRepository(collectionName);
            const item = await repo.findOne({
              sort: ['-createdAt'],
              transaction,
            });
            if (!item) {
              return;
            }
            const collection = db.getCollection(collectionName);
            const memField = collection.getField(fieldName);
            await memField.update(item, { transaction });
          }),
        Promise.resolve(),
      );
    });
  }

  async down() {}
}

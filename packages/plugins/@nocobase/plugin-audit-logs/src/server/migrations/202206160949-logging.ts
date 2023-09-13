import { Migration } from '@nocobase/server';

export default class LoggingMigration extends Migration {
  async up() {
    const result = await this.app.version.satisfies('<=0.7.0-alpha.83');
    if (!result) {
      return;
    }
    const repository = this.context.db.getRepository('collections');
    const collections = await repository.find();
    for (const collection of collections) {
      if (!collection.get('logging')) {
        collection.set('logging', true);
        await collection.save();
      }
    }
  }
}

import { Migration } from '@nocobase/server';

export default class extends Migration {
  appVersion = '<0.8.1-alpha.2';
  async up() {
    const result = await this.app.version.satisfies('<=0.8.0-alpha.14');
    if (!result) {
      return;
    }
    try {
      const collections = await this.app.db.getRepository('collections').find();
      console.log('migrating...');
      for (const collection of collections) {
        if (collection.get('autoCreate') && collection.get('isThrough')) {
          collection.set('timestamps', true);
          await collection.save();
          console.log(`collection name: ${collection.name}`);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
}

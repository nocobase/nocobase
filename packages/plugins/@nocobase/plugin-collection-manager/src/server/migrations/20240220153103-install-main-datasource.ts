import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<0.19.0-alpha.7';

  async up() {
    const dataSourcesCollection = this.app.db.getCollection('dataSources');

    await dataSourcesCollection.repository.firstOrCreate({
      filterKeys: ['key'],
      values: {
        key: 'main',
        type: 'main',
        displayName: 'Main',
        fixed: true,
        options: {},
      },
    });
  }
}

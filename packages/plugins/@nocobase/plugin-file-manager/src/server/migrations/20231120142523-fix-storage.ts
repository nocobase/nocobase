import { Repository } from '@nocobase/database';
import { Migration } from '@nocobase/server';

export default class extends Migration {
  appVersion = '<0.16.0-alpha.1';
  async up() {
    const result = await this.app.version.satisfies('<0.15.0-alpha.5');

    if (!result) {
      return;
    }

    const r = this.db.getRepository<Repository>('storages');
    await r.collection.sync();
    const items = await r.find({
      filter: {
        type: 'local',
      },
    });
    for (const item of items) {
      const baseUrl = item.get('baseUrl');
      if (baseUrl === '/storage/uploads') {
        continue;
      }
      if (!baseUrl.includes('/storage/uploads')) {
        continue;
      }
      item.set('baseUrl', '/storage/uploads');
      const options = item.get('options');
      options.documentRoot = 'storage/uploads';
      item.changed('options', true);
      item.set('options', options);
      const [, pathname] = baseUrl.split('/storage/uploads/');
      if (pathname && item.get('path')) {
        item.set('path', pathname.replace(/\/$/, '') + '/' + item.get('path'));
      } else if (pathname) {
        item.set('path', pathname.replace(/\/$/, ''));
      }
      await item.save();
    }
    const c = this.db.getCollection('attachments');
    const table = c.getTableNameWithSchemaAsString();
    await this.db.sequelize.query(`update ${table} set url = replace(url, 'http://localhost:13000', '')`);
  }
}

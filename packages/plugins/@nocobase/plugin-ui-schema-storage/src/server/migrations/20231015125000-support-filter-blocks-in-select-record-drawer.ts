import { Migration } from '@nocobase/server';

export default class extends Migration {
  appVersion = '<0.14.0-alpha.8';
  async up() {
    const result = await this.app.version.satisfies('<=0.14.0-alpha.7');
    if (!result) {
      return;
    }
    const r = this.db.getRepository('uiSchemas');
    const items = await r.find({
      filter: {
        'schema.x-designer': 'TableSelectorDesigner',
      },
    });
    await this.db.sequelize.transaction(async (transaction) => {
      for (const item of items) {
        const schema = item.schema;
        // BlockItem -> CardItem
        schema['x-component'] = 'CardItem';
        await item.save({ transaction });
      }
    });
  }
}

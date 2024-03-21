import { Repository } from '@nocobase/database';
import { Migration } from '@nocobase/server';

export default class RenameChartTypeMigration extends Migration {
  appVersion = '<0.14.0-alpha.7';
  async up() {
    const result = await this.app.version.satisfies('<=0.14.0-alpha.7');

    if (!result) {
      return;
    }

    const r = this.db.getRepository<Repository>('uiSchemas');
    const items = await r.find({
      filter: {
        'schema.x-decorator': 'ChartRendererProvider',
      },
    });

    await this.db.sequelize.transaction(async (transaction) => {
      for (const item of items) {
        const schema = item.schema;
        const chartType = schema['x-decorator-props']?.config?.chartType;
        if (!chartType || chartType.startsWith('Built-in.')) {
          continue;
        }
        schema['x-decorator-props'].config.chartType = `Built-in.${chartType}`;
        item.set('schema', schema);
        await item.save({ transaction });
      }
    });
  }
}

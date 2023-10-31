import { Migration } from '@nocobase/server';

export default class extends Migration {
  async up() {
    const version = await this.app.version.satisfies('<0.14.0-alpha.8');
    if (!version) {
      return;
    }
    const repository = this.context.db.getRepository('applicationPlugins');
    const model = await repository.findOne({
      filter: {
        name: 'charts',
      },
    });
    if (!model) {
      return;
    }
    await repository.update({
      values: {
        builtIn: false,
      },
      filter: {
        name: 'charts',
      },
    });
  }
}

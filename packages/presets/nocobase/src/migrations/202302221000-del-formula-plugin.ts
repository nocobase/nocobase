import { Migration } from '@nocobase/server';

export default class extends Migration {
  async up() {
    const repository = this.context.db.getRepository('applicationPlugins');
    await repository.destroy({
      filter: {
        'name.$in': [
          'math-formula-field',
          'excel-formula-field',
        ],
      },
    });
  }
}

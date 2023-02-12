import { Migration } from '@nocobase/server';

export default class extends Migration {
  async up() {
    const result = await this.app.version.satisfies('<=0.8.3-alpha.1');
    if (!result) {
      return;
    }
    const Field = this.context.db.getRepository('fields');
    const fields = await Field.find();
    await this.context.db.sequelize.transaction(async (transaction) => {
      for (const field of fields) {
        if (field.get('type') === 'formula') {
          field.set('type', 'mathFormula');
          field.set('interface', 'mathFormula');
          await field.save({ transaction });
          const schema = await field.getUiSchema({ transaction });
          schema.set('x-component', 'MathFormula.Result');
          await schema.save({ transaction });
        }
      }
    });
  }
}

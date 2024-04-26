import { Migration } from '@nocobase/server';

export default class extends Migration {
  appVersion = '<=0.9.0-alpha.3';
  async up() {
    const result = await this.app.version.satisfies('<=0.9.0-alpha.3');
    if (!result) {
      return;
    }
    const { db } = this.context;
    await db.sequelize.transaction(async (transaction) => {
      const Field = db.getRepository('fields');
      const fields = await Field.find({ transaction });
      for (const field of fields) {
        if (['mathFormula', 'excelFormula'].includes(field.get('type'))) {
          const { options } = field;
          field.set({
            type: 'formula',
            interface: 'formula',
            options: {
              ...options,
              engine: field.get('type') === 'mathFormula' ? 'math.js' : 'formula.js',
              dataType: options.dataType === 'number' ? 'double' : 'string',
            },
          });
          await field.save({ transaction });
          const schema = await field.getUiSchema({ transaction });
          schema.set('x-component', 'Formula.Result');
          await schema.save({ transaction });
        }
      }

      const repository = db.getRepository('applicationPlugins');
      await repository.destroy({
        filter: {
          name: ['math-formula-field', 'excel-formula-field'],
        },
        transaction,
      });
    });
  }
}

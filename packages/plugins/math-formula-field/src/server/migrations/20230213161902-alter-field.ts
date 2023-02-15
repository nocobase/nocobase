import { Migration } from '@nocobase/server';

export default class extends Migration {
  async up() {
    const result = await this.app.version.satisfies('<=0.9.0-alpha.2');
    if (!result) {
      return;
    }
    const { db } = this.context;
    await db.sequelize.transaction(async (transaction) => {
      const Field = db.getRepository('fields');
      const fields = await Field.find({ transaction });
      for (const field of fields) {
        if (['mathFormula', 'excelFormula'].includes(field.get('type'))) {
          field.set('type', 'formula');
          field.set('interface', 'formula');
          await field.save({ transaction });
          const schema = await field.getUiSchema({ transaction });
          schema.set('x-component', 'Formula.Result');
          await schema.save({ transaction });
        }
      }

      const AppPlugin = db.getRepository('applicationPlugins');
      const formulaPlugin = await AppPlugin.findOne({
        filter: {
          name: 'formula-field',
        },
        transaction
      });

      if (!formulaPlugin) {
        await AppPlugin.create({
          values: {
            name: 'formula-field',
            version: '0.9.0-alpha.2',
            enabled: true,
            installed: true,
            builtin: true
          },
          transaction
        });
      }

      await AppPlugin.destroy({
        filter: {
          name: ['math-formula-field', 'excel-formula-field']
        },
        transaction
      });
    });
  }
}

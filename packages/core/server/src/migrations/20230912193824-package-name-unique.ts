import { DataTypes } from '@nocobase/database';
import { Migration } from '../migration';

export default class extends Migration {
  on = 'beforeLoad';
  appVersion = '<0.14.0-alpha.2';

  async up() {
    const tableNameWithSchema = this.pm.collection.getTableNameWithSchema();
    const field = this.pm.collection.getField('packageName');
    const exists = await field.existsInDb();
    if (exists) {
      return;
    }
    try {
      await this.db.sequelize.getQueryInterface().addColumn(tableNameWithSchema, field.columnName(), {
        type: DataTypes.STRING,
      });
      await this.db.sequelize.getQueryInterface().addConstraint(tableNameWithSchema, {
        type: 'unique',
        fields: [field.columnName()],
      });
    } catch (error) {
      //
    }
  }
}

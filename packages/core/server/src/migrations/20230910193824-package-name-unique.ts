import { DataTypes } from '@nocobase/database';
import { Migration } from '@nocobase/server';

export default class extends Migration {
  async up() {
    const tableNameWithSchema = this.db.getCollection('applicationPlugins').getTableNameWithSchema();
    const field = this.db.getCollection('applicationPlugins').getField('packageName');
    if (await field.existsInDb()) {
      return;
    }
    await this.db.sequelize.getQueryInterface().addColumn(tableNameWithSchema, 'packageName', {
      type: DataTypes.STRING,
    });
    await this.db.sequelize.getQueryInterface().addConstraint(tableNameWithSchema, {
      type: 'unique',
      fields: ['packageName'],
    });
  }
}

import { DataTypes } from '@nocobase/database';
import { Migration } from '../migration';

export default class extends Migration {
  async up() {
    const collection = this.db.getCollection('applicationPlugins');
    if (!collection) {
      return;
    }
    const tableNameWithSchema = collection.getTableNameWithSchema();
    const field = collection.getField('packageName');
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

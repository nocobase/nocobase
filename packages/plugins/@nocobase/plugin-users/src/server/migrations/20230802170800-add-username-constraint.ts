import { DataTypes } from '@nocobase/database';
import { Migration } from '@nocobase/server';

export default class AddUserNameMigration extends Migration {
  on = 'beforeLoad';
  appVersion = '<0.13.0-alpha.1';

  async up() {
    const collection = this.db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'username',
          unique: true,
        },
      ],
    });
    const tableNameWithSchema = collection.getTableNameWithSchema();
    const field = collection.getField('username');
    await this.db.sequelize.getQueryInterface().addColumn(tableNameWithSchema, field.columnName(), {
      type: DataTypes.STRING,
    });
    await this.db.sequelize.getQueryInterface().addConstraint(tableNameWithSchema, {
      type: 'unique',
      fields: [field.columnName()],
    });
    this.db.removeCollection('users');
  }
}

import { DataTypes } from '@nocobase/database';
import { Migration } from '@nocobase/server';

export default class AddUsersPhoneMigration extends Migration {
  on = 'beforeLoad';
  appVersion = '<0.7.5-alpha.1';

  async up() {
    const collection = this.db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'phone',
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

  async down() {}
}

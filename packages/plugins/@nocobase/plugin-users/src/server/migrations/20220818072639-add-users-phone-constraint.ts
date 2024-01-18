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
        },
      ],
    });
    const tableNameWithSchema = collection.getTableNameWithSchema();
    const field = collection.getField('phone');
    const exists = await field.existsInDb();
    if (!exists) {
      await this.db.sequelize.getQueryInterface().addColumn(tableNameWithSchema, field.columnName(), {
        type: DataTypes.STRING,
      });
    }
    try {
      await this.db.sequelize.getQueryInterface().addConstraint(tableNameWithSchema, {
        type: 'unique',
        fields: [field.columnName()],
      });
    } catch (error) {
      //
    }
    this.db.removeCollection('users');
  }

  async down() {}
}

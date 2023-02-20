import { DataTypes } from 'sequelize';

import { Migration } from '@nocobase/server';

export default class extends Migration {
  async up() {
    const match = await this.app.version.satisfies('<=0.9.0-alpha.2');
    if (!match) {
      return;
    }

    const { context: { sequelize, queryInterface } } = arguments[0];
    await sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn('workflows', 'config', {
        type: DataTypes.JSON
      }, { transaction });
      await queryInterface.changeColumn('flow_nodes', 'config', {
        type: DataTypes.JSON
      }, { transaction });
      await queryInterface.changeColumn('executions', 'context', {
        type: DataTypes.JSON
      }, { transaction });
      await queryInterface.changeColumn('jobs', 'result', {
        type: DataTypes.JSON
      }, { transaction });
    });
  }
}

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataTypes } from 'sequelize';
import { Migration } from '../migration';

const collections = [
  'departments',
  'desktopRoutes',
  'mobileRoutes',
  'collectionCategories',
  'dataSourcesRolesResources',
  'dataSourcesRolesResourcesActions',
  'dataSourcesRolesResourcesScopes',
  'storages',
  'workflows',
  'flow_nodes',
  'executions',
  'userWokrflowTasks',
  'workflowCategories',
  'approvalExecutions',
  'approvalRecords',
  'approvals',
  'workflowManualTasks',
  'workflowCcTasks',
  'approvalMsgTpls',
  'mailAccounts',
  'mailSettings',
];

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<1.9.0';

  async up() {
    const repo = this.db.getRepository('fields');
    if (!repo) {
      return;
    }

    const queryInterface = this.db.sequelize.getQueryInterface();
    for (const collectionName of collections) {
      const collection = this.db.getCollection(collectionName);
      if (collection) {
        const tableName = collection.getTableNameWithSchema();
        if (this.db.isPostgresCompatibleDialect()) {
          await this.db.sequelize.transaction(async (transaction) => {
            const schema = collection.collectionSchema();
            const table = collection.model.tableName;
            const seqName = `"${schema}"."${table}_id_seq"`;
            await this.db.sequelize.query(`ALTER TABLE "${schema}"."${table}" ALTER COLUMN id DROP DEFAULT;`, {
              transaction,
            });
            await this.db.sequelize.query(`DROP SEQUENCE IF EXISTS ${seqName} CASCADE;`, { transaction });
          });
        } else {
          await queryInterface.changeColumn(tableName, 'id', {
            type: DataTypes.BIGINT,
            primaryKey: true,
            allowNull: false,
            autoIncrement: false,
          });
        }
      }
      const field = await repo.findOne({
        filter: {
          collectionName,
          name: 'id',
        },
      });
      if (field) {
        const options = { ...field.options };
        delete options['autoIncrement'];
        await repo.update({
          filter: { key: field.key },
          values: {
            type: 'snowflakeId',
            options,
          },
        });
      }
    }

    const treeCollections = [...this.db.collections.values()].filter((collection) => collection.options.tree);
    for (const collection of treeCollections) {
      const pathCollection = this.db.getCollection(`main_${collection.name}_path`);
      if (pathCollection) {
        const nodePk = pathCollection.getField('nodePk').columnName();
        await queryInterface.changeColumn(pathCollection.getTableNameWithSchema(), nodePk, {
          type: DataTypes.BIGINT,
        });
        const rootPk = pathCollection.getField('rootPk').columnName();
        await queryInterface.changeColumn(pathCollection.getTableNameWithSchema(), rootPk, {
          type: DataTypes.BIGINT,
        });
      }
    }
  }
}

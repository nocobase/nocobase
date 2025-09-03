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
  'users',
  'desktopRoutes',
  'mobileRoutes',
  'collectionCategories',
  'dataSourcesRolesResources',
  'dataSourcesRolesResourcesScopes',
  'storages',
  'workflows',
  'flow_nodes',
  'workflowCategories',
  'approvalMsgTpls',
  'mailAccounts',
  'mailSettings',
];

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<1.9.0';

  async up() {
    const repo = this.db.getRepository('fields');
    const queryInterface = this.db.sequelize.getQueryInterface();
    for (const collectionName of collections) {
      const collection = this.db.getCollection(collectionName);
      if (collection) {
        const tableName = collection.getTableNameWithSchema();
        await queryInterface.changeColumn(tableName, 'id', {
          type: DataTypes.BIGINT,
          primaryKey: true,
          allowNull: false,
          autoIncrement: false,
        });
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
            interface: 'snowflakeId',
            options,
          },
        });
      }
    }
  }
}

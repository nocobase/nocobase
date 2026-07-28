/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataTypes } from '@nocobase/database';
import { Migration } from '@nocobase/server';

type IndexColumn = string | { name?: string; attribute?: string };
type IndexInfo = {
  name?: string;
  fields?: IndexColumn[];
};

function isIndexInfo(value: unknown): value is IndexInfo {
  return Boolean(value) && typeof value === 'object';
}

function getIndexColumnName(column: IndexColumn) {
  return typeof column === 'string' ? column : column.name || column.attribute || '';
}

function hasIndexColumn(index: IndexInfo, columnName: string) {
  return (index.fields || []).some((column) => getIndexColumnName(column) === columnName);
}

export default class extends Migration {
  on = 'afterLoad';

  async up() {
    const collection = this.db.getCollection('multiPortals');
    if (!collection) {
      return;
    }

    const tableName = collection.getTableNameWithSchema();
    const queryInterface = this.db.sequelize.getQueryInterface();
    const columns = await queryInterface.describeTable(tableName);
    const hasRouteName = Object.prototype.hasOwnProperty.call(columns, 'routeName');
    const hasPortalName = Object.prototype.hasOwnProperty.call(columns, 'portalName');

    if (hasRouteName && !hasPortalName) {
      await queryInterface.renameColumn(tableName, 'routeName', 'portalName');
    } else if (!hasPortalName) {
      await queryInterface.addColumn(tableName, 'portalName', {
        type: DataTypes.STRING,
        allowNull: false,
      });
    }

    const indexes = await queryInterface.showIndex(tableName);
    for (const index of indexes.filter(isIndexInfo)) {
      if (index.name && (hasIndexColumn(index, 'routeName') || hasIndexColumn(index, 'portalName'))) {
        await queryInterface.removeIndex(tableName, index.name);
      }
    }

    await queryInterface.addIndex(tableName, ['portalName'], {
      unique: true,
      name: 'multi_portals_portal_name_unique',
    });
  }
}
